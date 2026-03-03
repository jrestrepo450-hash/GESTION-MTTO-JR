import { useRooms } from "@/hooks/use-rooms";
import { Wrench, Zap, Wind, ShieldAlert, Paintbrush } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: rooms, isLoading } = useRooms();

  const issues = rooms?.filter(r => 
    r.energyStatus !== "ok" || 
    r.acStatus !== "ok" || 
    r.smokeDetectorStatus !== "ok" || 
    r.paintStatus !== "ok"
  ) || [];

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">Estado Técnico</h1>
          <p className="text-muted-foreground text-lg">Resumen de mantenimiento del hotel.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-border/50 rounded-2xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="rounded-2xl border-none shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white hover-elevate">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-white/80 font-medium mb-1">Pendientes Mantenimiento</p>
                <h3 className="text-4xl font-display font-bold">{issues.length}</h3>
              </div>
              <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Wrench className="h-7 w-7" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/50 shadow-md bg-card hover-elevate">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1">Total Habitaciones</p>
                <h3 className="text-4xl font-display font-bold text-foreground">{rooms?.length || 0}</h3>
              </div>
              <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
                <Zap className="h-7 w-7 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-12 bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">Control en Tiempo Real</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Los mensajes de WhatsApp que incluyan palabras clave como "Aire OK" o "Energía mantenimiento" actualizarán automáticamente el estado de la habitación correspondiente.
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg" className="rounded-xl shadow-md bg-primary">
              <Link href="/guests">Ver Todas las Habitaciones</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
