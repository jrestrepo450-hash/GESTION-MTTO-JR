import { useQuery } from "@tanstack/react-query";
import { Printer, FileBarChart, CheckCircle2, Clock, AlertTriangle, Zap, Droplets, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TicketWithRelations, Space, EnergyReading, PreventiveTaskWithSpace } from "@shared/schema";
import { ENERGY_LABELS, ENERGY_UNITS } from "@shared/schema";

const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente", en_progreso: "En Progreso", resuelto: "Resuelto",
};
const PRIORITY_LABELS: Record<string, string> = {
  baja: "Baja", media: "Media", alta: "Alta", urgente: "Urgente",
};

export default function Reporte() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const { data: tickets = [] } = useQuery<TicketWithRelations[]>({ queryKey: ["/api/tickets"] });
  const { data: spaces = [] } = useQuery<Space[]>({ queryKey: ["/api/spaces"] });
  const { data: energy = [] } = useQuery<EnergyReading[]>({
    queryKey: ["/api/energy", year],
    queryFn: () => fetch(`/api/energy?year=${year}`).then(r => r.json()),
  });
  const { data: preventive = [] } = useQuery<PreventiveTaskWithSpace[]>({ queryKey: ["/api/preventive"] });

  // This month's tickets
  const thisMonthTickets = tickets.filter(t => {
    const d = new Date(t.createdAt!);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const pending = thisMonthTickets.filter(t => t.status === "pendiente");
  const inProgress = thisMonthTickets.filter(t => t.status === "en_progreso");
  const resolved = thisMonthTickets.filter(t => t.status === "resuelto");

  // Energy this month
  const energyThisMonth = energy.filter(e => e.month === month + 1 && e.year === year);
  const gasReading = energyThisMonth.find(e => e.type === "gas");
  const aguaReading = energyThisMonth.find(e => e.type === "agua");
  const energiaReading = energyThisMonth.find(e => e.type === "energia");

  // Overdue preventive
  const overduePreventive = preventive.filter(t => new Date(t.nextDue) <= now && t.active);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header - hidden in print, only shown on screen */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-primary" /> Reporte Mensual
          </h1>
          <p className="text-muted-foreground mt-1">Resumen de mantenimiento — {MONTHS_ES[month]} {year}</p>
        </div>
        <Button onClick={() => window.print()} data-testid="button-print">
          <Printer className="mr-2 h-4 w-4" /> Imprimir / Exportar PDF
        </Button>
      </div>

      {/* Print header - only shown in print */}
      <div className="hidden print:block mb-8 border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Reporte de Mantenimiento</h1>
            <p className="text-gray-600 mt-1">{MONTHS_ES[month]} {year}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Gran Hotel</p>
            <p>Generado: {now.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pendientes", value: pending.length, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
          { label: "En Progreso", value: inProgress.length, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
          { label: "Resueltos", value: resolved.length, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20" },
          { label: "Espacios", value: spaces.length, icon: FileBarChart, color: "text-primary", bg: "bg-primary/5" },
        ].map(s => (
          <Card key={s.label} className={`border border-border/50 ${s.bg}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color} shrink-0`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Energy this month */}
      <Card className="border border-border/50 shadow-sm mb-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" /> Consumo energético — {MONTHS_ES[month]} {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { type: "gas", reading: gasReading, Icon: Flame, color: "#f97316" },
              { type: "agua", reading: aguaReading, Icon: Droplets, color: "#3b82f6" },
              { type: "energia", reading: energiaReading, Icon: Zap, color: "#eab308" },
            ].map(({ type, reading, Icon, color }) => (
              <div key={type} className="text-center p-3 rounded-xl bg-muted/30">
                <Icon className="h-6 w-6 mx-auto mb-1" style={{ color }} />
                <p className="text-lg font-bold">
                  {reading ? reading.value.toLocaleString("es-CO") : "—"}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{ENERGY_UNITS[type as keyof typeof ENERGY_UNITS]}</span>
                </p>
                <p className="text-xs text-muted-foreground">{ENERGY_LABELS[type as keyof typeof ENERGY_LABELS]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overdue preventive */}
      {overduePreventive.length > 0 && (
        <Card className="border border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10 shadow-sm mb-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Tareas preventivas vencidas ({overduePreventive.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overduePreventive.map(t => (
                <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                  <span className="font-medium">{t.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{t.space?.name}</span>
                    <Badge variant="outline" className="text-xs">Vencida</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ticket list */}
      <Card className="border border-border/50 shadow-sm mb-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Novedades del mes ({thisMonthTickets.length} tickets)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {thisMonthTickets.length === 0 ? (
            <p className="text-muted-foreground text-sm py-2">Sin novedades registradas este mes.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {["Novedad", "Espacio", "Prioridad", "Estado", "Responsable"].map(h => (
                    <th key={h} className="text-left py-2 px-2 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {thisMonthTickets.map(t => (
                  <tr key={t.id} className="border-b border-border/20 last:border-0">
                    <td className="py-2 px-2 font-medium max-w-[200px] truncate">{t.title}</td>
                    <td className="py-2 px-2 text-muted-foreground text-xs">{t.space?.name ?? "—"}</td>
                    <td className="py-2 px-2">
                      <Badge variant="outline" className="text-xs">{PRIORITY_LABELS[t.priority]}</Badge>
                    </td>
                    <td className="py-2 px-2">
                      <Badge className={`text-xs ${t.status === "resuelto" ? "bg-green-500 hover:bg-green-500" : t.status === "en_progreso" ? "bg-amber-500 hover:bg-amber-500" : "bg-red-500 hover:bg-red-500"} text-white`}>
                        {STATUS_LABELS[t.status]}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">{t.assignedTo?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground mt-6 pt-4 border-t border-border/50 print:block">
        <p>Sistema de Mantenimiento — Gran Hotel · Generado el {now.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>
    </div>
  );
}
