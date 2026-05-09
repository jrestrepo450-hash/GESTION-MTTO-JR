import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flame, Droplets, Zap, Plus, Trash2, Wifi } from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import type { EnergyReading } from "@shared/schema";
import { ENERGY_LABELS, ENERGY_UNITS } from "@shared/schema";

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const TYPE_CONFIG = {
  gas: { label: "Gas", icon: Flame, color: "#f97316", unit: "m³" },
  agua: { label: "Agua", icon: Droplets, color: "#3b82f6", unit: "m³" },
  energia: { label: "Energía", icon: Zap, color: "#eab308", unit: "kWh" },
} as const;

const formSchema = z.object({
  type: z.enum(["gas", "agua", "energia"]),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
  value: z.coerce.number().positive("El valor debe ser positivo"),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

function AddReadingDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const now = new Date();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "energia",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      value: undefined as any,
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const type = data.type as keyof typeof TYPE_CONFIG;
      return apiRequest("POST", "/api/energy", {
        ...data,
        unit: TYPE_CONFIG[type].unit,
        source: "manual",
        notes: data.notes || null,
        sender: null,
      });
    },
    onSuccess: () => {
      toast({ title: "Lectura registrada" });
      queryClient.invalidateQueries({ queryKey: ["/api/energy"] });
      setOpen(false);
      form.reset();
      onSuccess();
    },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });

  const selectedType = form.watch("type") as keyof typeof TYPE_CONFIG;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-reading">
          <Plus className="mr-2 h-4 w-4" /> Agregar lectura
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar consumo</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="gas">Flame Gas (m³)</SelectItem>
                    <SelectItem value="agua">Agua (m³)</SelectItem>
                    <SelectItem value="energia">Energía (kWh)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="month" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mes</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger data-testid="select-month">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MONTHS_ES.map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem>
                  <FormLabel>Año</FormLabel>
                  <FormControl>
                    <Input type="number" data-testid="input-year" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="value" render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Valor ({selectedType ? TYPE_CONFIG[selectedType].unit : "unidad"})
                </FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ej: 450.5" data-testid="input-value" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notas (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Observaciones..." data-testid="input-notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Consumo() {
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: readings = [], isLoading } = useQuery<EnergyReading[]>({
    queryKey: ["/api/energy", yearFilter],
    queryFn: () => fetch(`/api/energy?year=${yearFilter}`).then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/energy/${id}`),
    onSuccess: () => {
      toast({ title: "Lectura eliminada" });
      queryClient.invalidateQueries({ queryKey: ["/api/energy"] });
      setDeleteId(null);
    },
  });

  // Build chart data: one row per month with gas, agua, energia values
  const chartData = MONTHS_ES.map((label, i) => {
    const month = i + 1;
    const gas = readings.find(r => r.type === "gas" && r.month === month);
    const agua = readings.find(r => r.type === "agua" && r.month === month);
    const energia = readings.find(r => r.type === "energia" && r.month === month);
    return {
      mes: label,
      Gas: gas?.value ?? null,
      Agua: agua?.value ?? null,
      Energía: energia?.value ?? null,
    };
  });

  // Latest readings per type
  const latest = (type: string) => readings.find(r => r.type === type);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" /> Consumo Energético
          </h1>
          <p className="text-muted-foreground mt-1">Registro mensual de gas, agua y electricidad</p>
        </div>
        <div className="flex items-center gap-2">
          <Select onValueChange={(v) => setYearFilter(Number(v))} value={String(yearFilter)}>
            <SelectTrigger className="w-28" data-testid="select-year-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <AddReadingDialog onSuccess={() => {}} />
        </div>
      </div>

      {/* WhatsApp quick tip */}
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-xl p-3 mb-6 flex items-start gap-2.5">
        <Wifi className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
        <p className="text-xs text-green-700 dark:text-green-300">
          <strong>Registro vía WhatsApp:</strong> Envía{" "}
          <code className="bg-green-100 dark:bg-green-900 px-1 rounded">GAS: 450</code>,{" "}
          <code className="bg-green-100 dark:bg-green-900 px-1 rounded">AGUA: 230</code> o{" "}
          <code className="bg-green-100 dark:bg-green-900 px-1 rounded">ENERGIA: 1200</code>{" "}
          al webhook y se registrará automáticamente para el mes actual.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {(["gas", "agua", "energia"] as const).map(type => {
          const cfg = TYPE_CONFIG[type];
          const Icon = cfg.icon;
          const last = latest(type);
          return (
            <Card key={type} className="border border-border/50 shadow-sm" data-testid={`card-${type}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0"
                  style={{ backgroundColor: cfg.color + "20" }}>
                  <Icon className="h-6 w-6" style={{ color: cfg.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{cfg.label}</p>
                  {last ? (
                    <>
                      <p className="text-2xl font-bold" data-testid={`value-${type}`}>
                        {last.value.toLocaleString("es-CO")} <span className="text-sm font-normal text-muted-foreground">{cfg.unit}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{MONTHS_ES[last.month - 1]} {last.year}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin datos</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Tendencia anual — Gas y Agua (m³)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="Gas" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="Agua" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Energía eléctrica mensual (kWh)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Energía" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Readings table */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Historial de lecturas — {yearFilter}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Cargando…</p>
          ) : readings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay lecturas registradas para {yearFilter}. Agrega la primera.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Mes</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Valor</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Notas</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Origen</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Enviado por</th>
                    <th className="py-2 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {readings.map(r => {
                    const cfg = TYPE_CONFIG[r.type as keyof typeof TYPE_CONFIG];
                    const Icon = cfg?.icon ?? Zap;
                    return (
                      <tr key={r.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors" data-testid={`row-reading-${r.id}`}>
                        <td className="py-2.5 px-3 font-medium">{MONTHS_ES[r.month - 1]} {r.year}</td>
                        <td className="py-2.5 px-3">
                          <span className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5" style={{ color: cfg?.color }} />
                            <span>{cfg?.label ?? r.type}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {r.value.toLocaleString("es-CO")} <span className="text-muted-foreground font-normal text-xs">{r.unit}</span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-xs max-w-[180px] truncate">{r.notes || "—"}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={r.source === "whatsapp" ? "default" : "secondary"} className="text-xs">
                            {r.source === "whatsapp" ? "WhatsApp" : "Manual"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">{r.sender || "—"}</td>
                        <td className="py-2.5 px-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            data-testid={`button-delete-${r.id}`}
                            onClick={() => setDeleteId(r.id)}
                          >
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

      {/* Delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar lectura?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
