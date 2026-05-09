import { Link } from "wouter";
import { useSpaces } from "@/hooks/use-spaces";
import { useTickets } from "@/hooks/use-tickets";
import { useWaUsers } from "@/hooks/use-wa-users";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, MapPin, ClipboardList, AlertTriangle, CheckCircle2, BarChart2 } from "lucide-react";
import { SPACE_TYPE_LABELS, type SpaceType } from "@shared/schema";
import { GlobalTicketCharts } from "@/components/ticket-charts";

export default function Dashboard() {
  const { data: spaces } = useSpaces();
  const { data: tickets } = useTickets();
  const { data: waUsers } = useWaUsers();

  const pendientes = tickets?.filter(t => t.status === "pendiente") || [];
  const urgentes = tickets?.filter(t => t.priority === "urgente" && t.status !== "resuelto") || [];
  const resueltos = tickets?.filter(t => t.status === "resuelto") || [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Panel de Control</h1>
        <p className="text-muted-foreground mt-1">Estado general del sistema de mantenimiento</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-primary to-primary/80">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/70 text-sm font-medium">Total Espacios</p>
              <h3 className="text-3xl font-bold text-primary-foreground">{spaces?.length ?? 0}</h3>
            </div>
            <MapPin className="h-8 w-8 text-primary-foreground/40" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-gradient-to-br from-red-500 to-red-600">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Pendientes</p>
              <h3 className="text-3xl font-bold text-white">{pendientes.length}</h3>
            </div>
            <Wrench className="h-8 w-8 text-white/40" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-gradient-to-br from-amber-500 to-amber-600">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Urgentes</p>
              <h3 className="text-3xl font-bold text-white">{urgentes.length}</h3>
            </div>
            <AlertTriangle className="h-8 w-8 text-white/40" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-gradient-to-br from-green-500 to-green-600">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Resueltos</p>
              <h3 className="text-3xl font-bold text-white">{resueltos.length}</h3>
            </div>
            <CheckCircle2 className="h-8 w-8 text-white/40" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" /> Análisis de Novedades
        </h2>
        <GlobalTicketCharts />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Últimos Pendientes</h2>
              <Button asChild variant="ghost" size="sm"><Link href="/pendientes">Ver todos</Link></Button>
            </div>
            <div className="space-y-3">
              {tickets?.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.space?.name}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge variant="outline" className={`text-xs ${
                      t.priority === "urgente" ? "border-red-500 text-red-500" :
                      t.priority === "alta" ? "border-amber-500 text-amber-500" : ""
                    }`}>{t.priority}</Badge>
                    <Badge variant="outline" className={`text-xs ${
                      t.status === "resuelto" ? "border-green-500 text-green-500" :
                      t.status === "en_progreso" ? "border-blue-500 text-blue-500" : ""
                    }`}>{t.status}</Badge>
                  </div>
                </div>
              ))}
              {!tickets?.length && <p className="text-muted-foreground text-sm text-center py-4">Sin pendientes registrados</p>}
            </div>
          </CardContent>
        </Card>

        {/* Spaces Overview */}
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Espacios Registrados</h2>
              <Button asChild variant="ghost" size="sm"><Link href="/spaces">Ver todos</Link></Button>
            </div>
            <div className="space-y-2">
              {spaces?.slice(0, 6).map(s => (
                <Link key={s.id} href={`/spaces/${s.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover-elevate cursor-pointer">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.code}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {SPACE_TYPE_LABELS[s.type as SpaceType] || s.type}
                    </Badge>
                  </div>
                </Link>
              ))}
              {!spaces?.length && <p className="text-muted-foreground text-sm text-center py-4">Sin espacios registrados</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
