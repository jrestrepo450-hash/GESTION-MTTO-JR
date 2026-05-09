import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarCheck, Plus, Trash2, Check, AlertTriangle, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import type { PreventiveTaskWithSpace, Space } from "@shared/schema";
import { PREV_FREQ } from "@shared/schema";

const FREQ_LABELS: Record<string, string> = {
  semanal: "Semanal", quincenal: "Quincenal", mensual: "Mensual",
  trimestral: "Trimestral", semestral: "Semestral", anual: "Anual",
};

const formSchema = z.object({
  spaceId: z.coerce.number().min(1, "Selecciona un espacio"),
  title: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string().optional(),
  frequency: z.enum(PREV_FREQ),
  nextDue: z.string().min(1, "Selecciona una fecha"),
});
type FormValues = z.infer<typeof formSchema>;

function TaskFormDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { data: spaces = [] } = useQuery<Space[]>({ queryKey: ["/api/spaces"] });

  const today = new Date().toISOString().split("T")[0];
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { spaceId: undefined as any, title: "", description: "", frequency: "mensual", nextDue: today },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => apiRequest("POST", "/api/preventive", {
      ...data,
      description: data.description || null,
      nextDue: new Date(data.nextDue),
      active: true,
      lastDone: null,
    }),
    onSuccess: () => {
      toast({ title: "Tarea creada" });
      queryClient.invalidateQueries({ queryKey: ["/api/preventive"] });
      setOpen(false); form.reset();
      onSuccess();
    },
    onError: () => toast({ title: "Error al crear tarea", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-task"><Plus className="mr-2 h-4 w-4" /> Nueva tarea</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Programar mantenimiento preventivo</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="spaceId" render={({ field }) => (
              <FormItem>
                <FormLabel>Espacio</FormLabel>
                <Select onValueChange={v => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                  <FormControl><SelectTrigger data-testid="select-space"><SelectValue placeholder="Seleccionar espacio" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {spaces.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.code})</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Tarea</FormLabel>
                <FormControl><Input placeholder="Ej: Revisar filtros de aire" data-testid="input-title" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción (opcional)</FormLabel>
                <FormControl><Textarea placeholder="Instrucciones o detalles..." {...field} /></FormControl>
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="frequency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-freq"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PREV_FREQ.map(f => <SelectItem key={f} value={f}>{FREQ_LABELS[f]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nextDue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Próxima fecha</FormLabel>
                  <FormControl><Input type="date" data-testid="input-nextDue" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Guardando…" : "Guardar"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function dueBadge(nextDue: string | Date) {
  const due = new Date(nextDue);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return <Badge className="bg-red-500 hover:bg-red-500 text-white gap-1"><AlertTriangle className="h-3 w-3" /> Vencida hace {Math.abs(diffDays)}d</Badge>;
  if (diffDays === 0) return <Badge className="bg-orange-500 hover:bg-orange-500 text-white gap-1"><AlertTriangle className="h-3 w-3" /> Hoy</Badge>;
  if (diffDays <= 3) return <Badge className="bg-amber-500 hover:bg-amber-500 text-white gap-1"><Clock className="h-3 w-3" /> En {diffDays}d</Badge>;
  if (diffDays <= 7) return <Badge variant="outline" className="border-amber-400 text-amber-700 gap-1"><Clock className="h-3 w-3" /> En {diffDays}d</Badge>;
  return <Badge variant="outline" className="text-muted-foreground gap-1"><Clock className="h-3 w-3" /> {due.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}</Badge>;
}

export default function Preventivo() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [tab, setTab] = useState<"todas" | "vencidas">("todas");
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<PreventiveTaskWithSpace[]>({
    queryKey: ["/api/preventive"],
  });

  const doneMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/preventive/${id}/done`, {}),
    onSuccess: () => { toast({ title: "Tarea marcada como realizada" }); queryClient.invalidateQueries({ queryKey: ["/api/preventive"] }); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/preventive/${id}`),
    onSuccess: () => { toast({ title: "Tarea eliminada" }); queryClient.invalidateQueries({ queryKey: ["/api/preventive"] }); setDeleteId(null); },
  });

  const now = new Date();
  const overdue = tasks.filter(t => new Date(t.nextDue) <= now);
  const displayed = tab === "vencidas" ? overdue : tasks;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" /> Mantenimiento Preventivo
          </h1>
          <p className="text-muted-foreground mt-1">Tareas programadas por espacio con alertas de vencimiento</p>
        </div>
        <TaskFormDialog onSuccess={() => {}} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total tareas", value: tasks.length, color: "text-foreground" },
          { label: "Vencidas", value: overdue.length, color: overdue.length > 0 ? "text-red-500" : "text-foreground" },
          { label: "Activas", value: tasks.filter(t => t.active).length, color: "text-green-600" },
        ].map(s => (
          <Card key={s.label} className="border border-border/50 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["todas", "vencidas"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}>
            {t === "todas" ? `Todas (${tasks.length})` : `Vencidas (${overdue.length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-10">Cargando…</p>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>{tab === "vencidas" ? "No hay tareas vencidas. ¡Todo al día!" : "No hay tareas programadas. Crea la primera."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(task => {
            const due = new Date(task.nextDue);
            const isOverdue = due <= now;
            return (
              <div key={task.id} data-testid={`card-task-${task.id}`}
                className={`bg-card border rounded-2xl p-4 flex items-start gap-4 shadow-sm transition-colors ${isOverdue ? "border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10" : "border-border/50"}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${isOverdue ? "bg-red-100 dark:bg-red-900/30" : "bg-primary/10"}`}>
                  <CalendarCheck className={`h-5 w-5 ${isOverdue ? "text-red-500" : "text-primary"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold">{task.title}</p>
                      {task.description && <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>}
                    </div>
                    {dueBadge(task.nextDue)}
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" /> {task.space?.name ?? "—"}
                    </span>
                    <Badge variant="secondary" className="text-xs">{FREQ_LABELS[task.frequency]}</Badge>
                    {task.lastDone && (
                      <span className="text-xs text-muted-foreground">
                        Última: {new Date(task.lastDone).toLocaleDateString("es-CO")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" className="h-8 gap-1 text-green-700 border-green-300 hover:bg-green-50"
                    data-testid={`button-done-${task.id}`}
                    disabled={doneMutation.isPending}
                    onClick={() => doneMutation.mutate(task.id)}>
                    <Check className="h-3.5 w-3.5" /> Realizada
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                    data-testid={`button-delete-task-${task.id}`}
                    onClick={() => setDeleteId(task.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
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
