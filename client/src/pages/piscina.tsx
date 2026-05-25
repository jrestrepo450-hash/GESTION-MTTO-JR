import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Waves, Plus, Trash2, Settings, FlaskConical, AlertTriangle,
  CheckCircle2, Thermometer, Droplets, ChevronDown, ChevronUp, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import type { PoolConfig, PoolReading } from "@shared/schema";
import { POOL_PARAMS } from "@shared/schema";

// ── Chemical calculation logic ──────────────────────────────────────────────
interface Chemical {
  name: string;
  product: string;
  dose: string; // dose per 100m³ per unit change
  unit: string;
  direction: "up" | "down";
  notes: string;
}

interface Recommendation {
  param: string;
  label: string;
  current: number;
  target: number;
  chemical: Chemical;
  amount: string;
  urgent: boolean;
}

const CHEMICALS = {
  phUp: {
    name: "Subir pH",
    product: "Carbonato de sodio (Soda Ash)",
    dose: "150g por 100m³ para subir 0.1 unidades",
    unit: "g",
    direction: "up" as const,
    notes: "Diluir en agua antes de agregar. Agregar lentamente con bomba encendida.",
  },
  phDown: {
    name: "Bajar pH",
    product: "Ácido clorhídrico (Muriático) 33%",
    dose: "200ml por 100m³ para bajar 0.1 unidades",
    unit: "ml",
    direction: "down" as const,
    notes: "⚠️ PELIGROSO. Usar EPP (guantes, gafas). Agregar al agua, nunca al revés. Diluir primero.",
  },
  chlorineUp: {
    name: "Subir cloro",
    product: "Hipoclorito de calcio 65% (granulado)",
    dose: "15g por 100m³ para subir 1 ppm",
    unit: "g",
    direction: "up" as const,
    notes: "Diluir en balde con agua tibia. Agregar con bomba encendida en área de retorno.",
  },
  alkalinityUp: {
    name: "Subir alcalinidad",
    product: "Bicarbonato de sodio",
    dose: "170g por 100m³ para subir 10 ppm",
    unit: "g",
    direction: "up" as const,
    notes: "Distribuir por todo el perímetro de la piscina con la bomba encendida.",
  },
  alkalinityDown: {
    name: "Bajar alcalinidad",
    product: "Ácido clorhídrico (Muriático) 33%",
    dose: "400ml por 100m³ para bajar 10 ppm",
    unit: "ml",
    direction: "down" as const,
    notes: "⚠️ Agregar en el punto más profundo con la bomba APAGADA. Esperar 1h, luego encender.",
  },
  calciumUp: {
    name: "Subir dureza cálcica",
    product: "Cloruro de calcio (CaCl₂)",
    dose: "125g por 100m³ para subir 10 ppm",
    unit: "g",
    direction: "up" as const,
    notes: "Diluir en agua antes de agregar. La solución se calienta — tener cuidado.",
  },
  cyanuricUp: {
    name: "Subir estabilizador",
    product: "Ácido isocianúrico (Estabilizador)",
    dose: "130g por 100m³ para subir 10 ppm",
    unit: "g",
    direction: "up" as const,
    notes: "Solo para piscinas exteriores. Colocar en el skimmer. Tarda 24-48h en disolverse.",
  },
};

function calcAmount(
  volumeM3: number,
  current: number,
  target: number,
  dosePerUnit: number, // grams or ml per 100m³ per unit
  baseChange: number,  // how many units 1 dose changes
): string {
  const diff = Math.abs(target - current);
  const doses = diff / baseChange;
  const amount = (doses * dosePerUnit * volumeM3) / 100;
  if (amount < 1000) return `${Math.round(amount)} g / ml`;
  return `${(amount / 1000).toFixed(2)} kg / L`;
}

function getRecommendations(reading: PoolReading, volumeM3: number): Recommendation[] {
  const recs: Recommendation[] = [];

  if (reading.ph != null) {
    const idealMid = (POOL_PARAMS.ph.min + POOL_PARAMS.ph.max) / 2; // 7.4
    if (reading.ph < POOL_PARAMS.ph.min) {
      const diff = idealMid - reading.ph;
      const amount = ((diff / 0.1) * 150 * volumeM3) / 100;
      recs.push({
        param: "ph", label: "pH", current: reading.ph, target: idealMid,
        chemical: CHEMICALS.phUp,
        amount: amount < 1000 ? `${Math.round(amount)} g` : `${(amount / 1000).toFixed(2)} kg`,
        urgent: reading.ph < 7.0,
      });
    } else if (reading.ph > POOL_PARAMS.ph.max) {
      const diff = reading.ph - idealMid;
      const amount = ((diff / 0.1) * 200 * volumeM3) / 100;
      recs.push({
        param: "ph", label: "pH", current: reading.ph, target: idealMid,
        chemical: CHEMICALS.phDown,
        amount: amount < 1000 ? `${Math.round(amount)} ml` : `${(amount / 1000).toFixed(2)} L`,
        urgent: reading.ph > 8.0,
      });
    }
  }

  if (reading.freeChlorine != null) {
    const idealMid = 1.0;
    if (reading.freeChlorine < POOL_PARAMS.freeChlorine.min) {
      const diff = idealMid - reading.freeChlorine;
      const amount = (diff * 15 * volumeM3) / 100;
      recs.push({
        param: "freeChlorine", label: "Cloro libre", current: reading.freeChlorine, target: idealMid,
        chemical: CHEMICALS.chlorineUp,
        amount: amount < 1000 ? `${Math.round(amount)} g` : `${(amount / 1000).toFixed(2)} kg`,
        urgent: reading.freeChlorine < 0.3,
      });
    }
  }

  if (reading.totalAlkalinity != null) {
    const idealMid = 100;
    if (reading.totalAlkalinity < POOL_PARAMS.totalAlkalinity.min) {
      const diff = idealMid - reading.totalAlkalinity;
      const amount = ((diff / 10) * 170 * volumeM3) / 100;
      recs.push({
        param: "totalAlkalinity", label: "Alcalinidad", current: reading.totalAlkalinity, target: idealMid,
        chemical: CHEMICALS.alkalinityUp,
        amount: amount < 1000 ? `${Math.round(amount)} g` : `${(amount / 1000).toFixed(2)} kg`,
        urgent: reading.totalAlkalinity < 60,
      });
    } else if (reading.totalAlkalinity > POOL_PARAMS.totalAlkalinity.max) {
      const diff = reading.totalAlkalinity - idealMid;
      const amount = ((diff / 10) * 400 * volumeM3) / 100;
      recs.push({
        param: "totalAlkalinity", label: "Alcalinidad", current: reading.totalAlkalinity, target: idealMid,
        chemical: CHEMICALS.alkalinityDown,
        amount: amount < 1000 ? `${Math.round(amount)} ml` : `${(amount / 1000).toFixed(2)} L`,
        urgent: reading.totalAlkalinity > 150,
      });
    }
  }

  if (reading.calciumHardness != null && reading.calciumHardness < POOL_PARAMS.calciumHardness.min) {
    const diff = POOL_PARAMS.calciumHardness.min - reading.calciumHardness;
    const amount = ((diff / 10) * 125 * volumeM3) / 100;
    recs.push({
      param: "calciumHardness", label: "Dureza cálcica", current: reading.calciumHardness, target: POOL_PARAMS.calciumHardness.min,
      chemical: CHEMICALS.calciumUp,
      amount: amount < 1000 ? `${Math.round(amount)} g` : `${(amount / 1000).toFixed(2)} kg`,
      urgent: false,
    });
  }

  if (reading.cyanuricAcid != null && reading.cyanuricAcid < POOL_PARAMS.cyanuricAcid.min) {
    const diff = POOL_PARAMS.cyanuricAcid.min - reading.cyanuricAcid;
    const amount = ((diff / 10) * 130 * volumeM3) / 100;
    recs.push({
      param: "cyanuricAcid", label: "Estabilizador", current: reading.cyanuricAcid, target: POOL_PARAMS.cyanuricAcid.min,
      chemical: CHEMICALS.cyanuricUp,
      amount: amount < 1000 ? `${Math.round(amount)} g` : `${(amount / 1000).toFixed(2)} kg`,
      urgent: false,
    });
  }

  return recs;
}

// ── Status helpers ─────────────────────────────────────────────────────────
type ParamStatus = "ok" | "warning" | "critical";
function getStatus(key: keyof typeof POOL_PARAMS, value: number | null | undefined): ParamStatus {
  if (value == null) return "ok";
  const p = POOL_PARAMS[key];
  const outBy = value < p.min ? p.min - value : value > p.max ? value - p.max : 0;
  if (outBy === 0) return "ok";
  if (outBy <= p.warn) return "warning";
  return "critical";
}
const STATUS_COLORS: Record<ParamStatus, string> = {
  ok: "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40",
  warning: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40",
  critical: "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40",
};

// ── Pool Config Dialog ────────────────────────────────────────────────────
const configSchema = z.object({
  name: z.string().min(2),
  volumeM3: z.coerce.number().positive("El volumen debe ser positivo"),
  type: z.enum(["interior", "exterior"]),
  notes: z.string().optional(),
});
type ConfigValues = z.infer<typeof configSchema>;

function PoolConfigDialog({ config, onSuccess }: { config?: PoolConfig; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<ConfigValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      name: config?.name ?? "Piscina Principal",
      volumeM3: config?.volumeM3 ?? 100,
      type: (config?.type as "interior" | "exterior") ?? "exterior",
      notes: config?.notes ?? "",
    },
  });
  const mutation = useMutation({
    mutationFn: (d: ConfigValues) => apiRequest("POST", "/api/pool/config", { ...d, notes: d.notes || null }),
    onSuccess: () => {
      toast({ title: "Configuración guardada" });
      queryClient.invalidateQueries({ queryKey: ["/api/pool/config"] });
      setOpen(false); onSuccess();
    },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-pool-config">
          <Settings className="mr-2 h-4 w-4" /> Configurar piscina
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Configuración de la piscina</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nombre</FormLabel>
                <FormControl><Input data-testid="input-pool-name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="volumeM3" render={({ field }) => (
                <FormItem><FormLabel>Volumen (m³)</FormLabel>
                  <FormControl><Input type="number" step="0.1" data-testid="input-volume" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="exterior">Exterior</SelectItem>
                      <SelectItem value="interior">Interior</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notas</FormLabel>
                <FormControl><Textarea placeholder="Dimensiones, ubicación…" {...field} /></FormControl>
              </FormItem>
            )} />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Guardando…" : "Guardar"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Reading Form Dialog ───────────────────────────────────────────────────
const readingSchema = z.object({
  readingDate: z.string(),
  ph: z.coerce.number().min(0).max(14).optional().or(z.literal("")),
  freeChlorine: z.coerce.number().min(0).optional().or(z.literal("")),
  totalAlkalinity: z.coerce.number().min(0).optional().or(z.literal("")),
  calciumHardness: z.coerce.number().min(0).optional().or(z.literal("")),
  cyanuricAcid: z.coerce.number().min(0).optional().or(z.literal("")),
  temperature: z.coerce.number().optional().or(z.literal("")),
  turbidity: z.enum(["clara", "turbia", "muy_turbia"]).optional().or(z.literal("")),
  technician: z.string().optional(),
  notes: z.string().optional(),
});
type ReadingValues = z.infer<typeof readingSchema>;

function AddReadingDialog({ poolId, onSuccess }: { poolId: number; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const now = new Date().toISOString().slice(0, 16);
  const form = useForm<ReadingValues>({
    resolver: zodResolver(readingSchema),
    defaultValues: { readingDate: now, ph: "", freeChlorine: "", totalAlkalinity: "", calciumHardness: "", cyanuricAcid: "", temperature: "", turbidity: "", technician: "", notes: "" },
  });
  const mutation = useMutation({
    mutationFn: (d: ReadingValues) => {
      const payload: any = {
        poolId,
        readingDate: new Date(d.readingDate),
        ph: d.ph !== "" ? Number(d.ph) : null,
        freeChlorine: d.freeChlorine !== "" ? Number(d.freeChlorine) : null,
        totalAlkalinity: d.totalAlkalinity !== "" ? Number(d.totalAlkalinity) : null,
        calciumHardness: d.calciumHardness !== "" ? Number(d.calciumHardness) : null,
        cyanuricAcid: d.cyanuricAcid !== "" ? Number(d.cyanuricAcid) : null,
        temperature: d.temperature !== "" ? Number(d.temperature) : null,
        turbidity: d.turbidity || null,
        technician: d.technician || null,
        notes: d.notes || null,
      };
      return apiRequest("POST", "/api/pool/readings", payload);
    },
    onSuccess: () => {
      toast({ title: "Lectura registrada" });
      queryClient.invalidateQueries({ queryKey: ["/api/pool/readings"] });
      setOpen(false); form.reset({ readingDate: new Date().toISOString().slice(0, 16) });
      onSuccess();
    },
    onError: () => toast({ title: "Error al guardar lectura", variant: "destructive" }),
  });

  const FIELDS = [
    { name: "ph" as const, label: "pH", placeholder: "7.2–7.6", step: "0.01" },
    { name: "freeChlorine" as const, label: "Cloro libre (ppm)", placeholder: "0.5–1.5", step: "0.1" },
    { name: "totalAlkalinity" as const, label: "Alcalinidad total (ppm)", placeholder: "80–120", step: "1" },
    { name: "calciumHardness" as const, label: "Dureza cálcica (ppm)", placeholder: "200–400", step: "1" },
    { name: "cyanuricAcid" as const, label: "Ácido isocianúrico (ppm)", placeholder: "30–50", step: "1" },
    { name: "temperature" as const, label: "Temperatura (°C)", placeholder: "24–30", step: "0.1" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-reading"><Plus className="mr-2 h-4 w-4" /> Registrar análisis</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nuevo análisis de piscina</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="readingDate" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>Fecha y hora</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                </FormItem>
              )} />
              {FIELDS.map(f => (
                <FormField key={f.name} control={form.control} name={f.name} render={({ field }) => (
                  <FormItem><FormLabel>{f.label}</FormLabel>
                    <FormControl>
                      <Input type="number" step={f.step} placeholder={f.placeholder}
                        data-testid={`input-${f.name}`} {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )} />
              ))}
              <FormField control={form.control} name="turbidity" render={({ field }) => (
                <FormItem><FormLabel>Turbidez</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="clara">Clara</SelectItem>
                      <SelectItem value="turbia">Turbia</SelectItem>
                      <SelectItem value="muy_turbia">Muy turbia</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="technician" render={({ field }) => (
                <FormItem><FormLabel>Técnico</FormLabel>
                  <FormControl><Input placeholder="Nombre del técnico" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>Observaciones</FormLabel>
                  <FormControl><Textarea placeholder="Observaciones adicionales…" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Guardando…" : "Registrar"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Parameter Card ─────────────────────────────────────────────────────────
function ParamCard({ paramKey, value, unit }: { paramKey: keyof typeof POOL_PARAMS; value: number | null | undefined; unit: string }) {
  const p = POOL_PARAMS[paramKey];
  const status = getStatus(paramKey, value);
  return (
    <div className={`rounded-xl border p-3 ${STATUS_COLORS[status]}`}>
      <p className="text-xs font-medium mb-1 opacity-80">{p.label}</p>
      <p className="text-xl font-bold">
        {value != null ? value.toLocaleString("es-CO", { maximumFractionDigits: 2 }) : "—"}
        {value != null && unit && <span className="text-xs font-normal ml-1 opacity-70">{unit}</span>}
      </p>
      <p className="text-xs opacity-60 mt-0.5">Ideal: {p.min}–{p.max}{unit}</p>
      {status === "ok" && value != null && <CheckCircle2 className="h-3.5 w-3.5 mt-1 opacity-60" />}
      {status === "warning" && <AlertTriangle className="h-3.5 w-3.5 mt-1 opacity-80" />}
      {status === "critical" && <AlertTriangle className="h-3.5 w-3.5 mt-1" />}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Piscina() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const { toast } = useToast();

  const { data: config } = useQuery<PoolConfig | null>({ queryKey: ["/api/pool/config"] });
  const { data: readings = [], isLoading } = useQuery<PoolReading[]>({ queryKey: ["/api/pool/readings"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/pool/readings/${id}`),
    onSuccess: () => { toast({ title: "Lectura eliminada" }); queryClient.invalidateQueries({ queryKey: ["/api/pool/readings"] }); setDeleteId(null); },
  });

  const latest = readings[0] ?? null;
  const volumeM3 = config?.volumeM3 ?? 100;
  const recs = latest ? getRecommendations(latest, volumeM3) : [];
  const urgentRecs = recs.filter(r => r.urgent);

  const poolId = config?.id ?? 1;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Waves className="h-6 w-6 text-blue-500" /> {config?.name ?? "Piscina"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Control de calidad del agua · {config ? `${config.volumeM3} m³ · ${config.type === "exterior" ? "Exterior" : "Interior"}` : "Configura el volumen para calcular dosis exactas"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PoolConfigDialog config={config ?? undefined} onSuccess={() => {}} />
          <AddReadingDialog poolId={config?.id ?? 1} onSuccess={() => {}} />
        </div>
      </div>

      {/* Urgent alerts */}
      {urgentRecs.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4 mb-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">⚠️ Parámetros críticos — requieren atención inmediata</p>
            <ul className="text-xs text-red-600 dark:text-red-400 mt-1 list-disc list-inside">
              {urgentRecs.map(r => (
                <li key={r.param}>{r.label}: {r.current} {POOL_PARAMS[r.param as keyof typeof POOL_PARAMS]?.unit} (ideal {POOL_PARAMS[r.param as keyof typeof POOL_PARAMS]?.min}–{POOL_PARAMS[r.param as keyof typeof POOL_PARAMS]?.max})</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Latest reading dashboard */}
      {latest && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Último análisis · {new Date(latest.readingDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              {latest.technician && ` · ${latest.technician}`}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <ParamCard paramKey="ph" value={latest.ph} unit="" />
            <ParamCard paramKey="freeChlorine" value={latest.freeChlorine} unit="ppm" />
            <ParamCard paramKey="totalAlkalinity" value={latest.totalAlkalinity} unit="ppm" />
            <ParamCard paramKey="calciumHardness" value={latest.calciumHardness} unit="ppm" />
            <ParamCard paramKey="cyanuricAcid" value={latest.cyanuricAcid} unit="ppm" />
            <ParamCard paramKey="temperature" value={latest.temperature} unit="°C" />
          </div>
          {latest.turbidity && (
            <p className="text-xs text-muted-foreground mb-6">
              Turbidez: <span className={`font-semibold ${latest.turbidity === "clara" ? "text-green-600" : latest.turbidity === "turbia" ? "text-amber-600" : "text-red-600"}`}>
                {latest.turbidity === "clara" ? "Clara" : latest.turbidity === "turbia" ? "Turbia" : "Muy turbia"}
              </span>
              {latest.notes && ` · ${latest.notes}`}
            </p>
          )}
        </>
      )}

      {!latest && !isLoading && (
        <div className="text-center py-10 text-muted-foreground mb-6">
          <Waves className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Registra el primer análisis para ver el estado de la piscina y las dosis recomendadas.</p>
        </div>
      )}

      {/* Chemical recommendations */}
      {recs.length > 0 && (
        <Card className="border border-border/50 shadow-sm mb-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-blue-500" />
              Dosis recomendadas para {volumeM3} m³
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recs.map(r => (
              <div key={r.param}
                className={`rounded-xl border p-4 ${r.urgent ? "border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/40" : "border-border/50 bg-muted/20"}`}>
                <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                  <div>
                    <p className="font-semibold text-sm">{r.chemical.name} — {r.label}</p>
                    <p className="text-xs text-muted-foreground">Actual: <strong>{r.current}</strong> → Objetivo: <strong>{r.target}</strong></p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{r.amount}</p>
                    <p className="text-xs text-muted-foreground">{r.chemical.product}</p>
                  </div>
                </div>
                <div className="bg-background/60 rounded-lg p-2.5 text-xs text-muted-foreground border border-border/30">
                  📋 {r.chemical.notes}
                </div>
              </div>
            ))}
            {recs.length === 0 && (
              <p className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Todos los parámetros están en rango óptimo.
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {latest && recs.length === 0 && (
        <div className="flex items-center gap-2 text-green-600 mb-5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-xl p-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">¡Todos los parámetros están en rango ideal! No se requieren químicos.</p>
        </div>
      )}

      {/* Maintenance guide */}
      <Collapsible open={guideOpen} onOpenChange={setGuideOpen} className="mb-5">
        <Card className="border border-border/50 shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 rounded-t-xl transition-colors">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Guía de mantenimiento y plan semanal</span>
                {guideOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Schedule */}
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-primary">📅 Plan de mantenimiento</h3>
                  {[
                    {
                      freq: "Diario", tasks: [
                        "Medir pH y cloro libre (mantener 7.2–7.6 y 0.5–1.5 ppm)",
                        "Verificar turbidez del agua visualmente",
                        "Revisar funcionamiento de bombas y filtros",
                        "Limpiar skimmers y cestas de desagüe",
                        "Agregar cloro de mantenimiento según necesidad",
                      ]
                    },
                    {
                      freq: "Semanal", tasks: [
                        "Análisis completo: pH, cloro, alcalinidad, dureza",
                        "Cepillar paredes y fondo de la piscina",
                        "Aspirar sedimentos del fondo",
                        "Retrolavado del filtro de arena (si presión ↑ 1 bar)",
                        "Choque de cloro si es necesario (0.5–1 kg/100m³)",
                        "Verificar nivel de agua y reponer si bajó",
                      ]
                    },
                    {
                      freq: "Mensual", tasks: [
                        "Análisis de ácido isocianúrico (estabilizador)",
                        "Análisis de dureza cálcica",
                        "Revisión de equipos: motores, sellos, válvulas",
                        "Limpieza profunda de filtro (si aplica)",
                        "Inspección de iluminación subacuática",
                      ]
                    },
                    {
                      freq: "Semestral", tasks: [
                        "Vaciado parcial o total para limpieza de algas incrustadas",
                        "Inspección de recubrimiento (pintura, gresite, liner)",
                        "Revisión de instalaciones eléctricas e hidráulicas",
                        "Cambio de arena del filtro (si aplica, cada 3–5 años)",
                        "Calibración de equipos de medición",
                      ]
                    },
                  ].map(({ freq, tasks }) => (
                    <div key={freq} className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{freq}</p>
                      <ul className="space-y-0.5">
                        {tasks.map(t => (
                          <li key={t} className="text-xs flex gap-1.5 items-start">
                            <span className="text-primary mt-0.5 shrink-0">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Chemical reference table */}
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-primary">⚗️ Tabla de referencia de químicos</h3>
                  <div className="space-y-2">
                    {[
                      {
                        param: "pH bajo (< 7.2)", action: "Agregar Carbonato de sodio (Soda Ash)",
                        dose: "150 g por cada 100 m³ para subir 0.1 unidades de pH",
                        warning: "Diluir antes. Agregar lentamente con bomba encendida.",
                        danger: false,
                      },
                      {
                        param: "pH alto (> 7.6)", action: "Agregar Ácido muriático 33%",
                        dose: "200 ml por cada 100 m³ para bajar 0.1 unidades de pH",
                        warning: "⚠️ CORROSIVO — Usar EPP. Nunca agregar agua al ácido.",
                        danger: true,
                      },
                      {
                        param: "Cloro libre bajo (< 0.5 ppm)", action: "Hipoclorito de calcio 65%",
                        dose: "15 g por cada 100 m³ para subir 1 ppm de cloro",
                        warning: "Diluir en balde. Aplicar en área de retorno.",
                        danger: false,
                      },
                      {
                        param: "Choque de cloro (turbiedad)", action: "Hipoclorito de calcio 65%",
                        dose: "50–100 g por cada 100 m³ (super-cloración)",
                        warning: "No bañarse por 8–24h. pH debe estar en 7.2–7.4 antes.",
                        danger: true,
                      },
                      {
                        param: "Alcalinidad baja (< 80 ppm)", action: "Bicarbonato de sodio",
                        dose: "170 g por cada 100 m³ para subir 10 ppm",
                        warning: "Distribuir por todo el perímetro.",
                        danger: false,
                      },
                      {
                        param: "Alcalinidad alta (> 120 ppm)", action: "Ácido muriático 33%",
                        dose: "400 ml por cada 100 m³ para bajar 10 ppm",
                        warning: "⚠️ Agregar en punto profundo con bomba APAGADA.",
                        danger: true,
                      },
                      {
                        param: "Dureza baja (< 200 ppm)", action: "Cloruro de calcio (CaCl₂)",
                        dose: "125 g por cada 100 m³ para subir 10 ppm",
                        warning: "La solución se calienta — manejar con cuidado.",
                        danger: false,
                      },
                      {
                        param: "Estabilizador bajo (< 30 ppm)", action: "Ácido isocianúrico",
                        dose: "130 g por cada 100 m³ para subir 10 ppm",
                        warning: "Solo piscinas exteriores. Colocar en skimmer.",
                        danger: false,
                      },
                    ].map(item => (
                      <div key={item.param} className={`rounded-lg border p-2.5 text-xs ${item.danger ? "border-red-200 bg-red-50/30 dark:bg-red-950/10 dark:border-red-900/30" : "border-border/40 bg-muted/20"}`}>
                        <p className="font-semibold mb-0.5">{item.param}</p>
                        <p className="text-primary font-medium">{item.action}</p>
                        <p className="text-muted-foreground my-0.5">Dosis: {item.dose}</p>
                        <p className={item.danger ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}>{item.warning}</p>
                      </div>
                    ))}
                  </div>

                  {/* Safety box */}
                  <div className="mt-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">🦺 Seguridad con químicos</p>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                      <li>• Siempre usar guantes de nitrilo y gafas de seguridad</li>
                      <li>• Nunca mezclar dos químicos entre sí — pueden explotar</li>
                      <li>• Almacenar en lugar fresco, seco y ventilado</li>
                      <li>• Esperar 30 min después de agregar químicos antes de bañarse</li>
                      <li>• Ajustar pH antes de agregar cloro (más efectivo en pH 7.2–7.4)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Readings history */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" /> Historial de análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Cargando…</p>
          ) : readings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay análisis registrados. Registra el primero.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    {["Fecha", "pH", "Cloro", "Alcalin.", "Dureza", "Estab.", "Temp.", "Turbidez", "Técnico", ""].map(h => (
                      <th key={h} className="text-left py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {readings.map(r => {
                    const phSt = getStatus("ph", r.ph);
                    const clSt = getStatus("freeChlorine", r.freeChlorine);
                    return (
                      <tr key={r.id} data-testid={`row-reading-${r.id}`}
                        className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="py-2 px-2 font-medium whitespace-nowrap">
                          {new Date(r.readingDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                          <br />
                          <span className="text-muted-foreground">
                            {new Date(r.readingDate).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className={`py-2 px-2 font-mono font-semibold ${phSt === "critical" ? "text-red-500" : phSt === "warning" ? "text-amber-500" : "text-green-600"}`}>
                          {r.ph?.toFixed(2) ?? "—"}
                        </td>
                        <td className={`py-2 px-2 font-mono font-semibold ${clSt === "critical" ? "text-red-500" : clSt === "warning" ? "text-amber-500" : "text-green-600"}`}>
                          {r.freeChlorine?.toFixed(2) ?? "—"}
                        </td>
                        <td className="py-2 px-2 font-mono">{r.totalAlkalinity?.toFixed(0) ?? "—"}</td>
                        <td className="py-2 px-2 font-mono">{r.calciumHardness?.toFixed(0) ?? "—"}</td>
                        <td className="py-2 px-2 font-mono">{r.cyanuricAcid?.toFixed(0) ?? "—"}</td>
                        <td className="py-2 px-2 font-mono">{r.temperature != null ? `${r.temperature}°C` : "—"}</td>
                        <td className="py-2 px-2">
                          {r.turbidity ? (
                            <Badge variant="outline" className={`text-[10px] ${r.turbidity === "clara" ? "text-green-600 border-green-300" : r.turbidity === "turbia" ? "text-amber-600 border-amber-300" : "text-red-600 border-red-300"}`}>
                              {r.turbidity === "clara" ? "Clara" : r.turbidity === "turbia" ? "Turbia" : "Muy turbia"}
                            </Badge>
                          ) : "—"}
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">{r.technician ?? "—"}</td>
                        <td className="py-2 px-2">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                            data-testid={`button-delete-reading-${r.id}`}
                            onClick={() => setDeleteId(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar análisis?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
