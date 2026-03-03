import { useGuests } from "@/hooks/use-guests";
import { Users, DoorOpen, CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: guests, isLoading } = useGuests();

  const activeGuests = guests?.filter(g => !g.checkOut || new Date(g.checkOut) >= new Date()) || [];
  const checkingOutSoon = guests?.filter(g => {
    if (!g.checkOut) return false;
    const co = new Date(g.checkOut);
    const now = new Date();
    const diff = co.getTime() - now.getTime();
    return diff > 0 && diff <= 48 * 60 * 60 * 1000; // Next 48 hours
  }) || [];

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">Panel Principal</h1>
          <p className="text-muted-foreground text-lg">Resumen y estado actual de la residencia.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-border/50 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="rounded-2xl border-none shadow-lg bg-gradient-to-br from-primary to-primary/90 text-primary-foreground hover-elevate">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 font-medium mb-1">Huéspedes Activos</p>
                <h3 className="text-4xl font-display font-bold">{activeGuests.length}</h3>
              </div>
              <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Users className="h-7 w-7 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/50 shadow-md bg-card hover-elevate">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1">Salidas Próximas</p>
                <h3 className="text-4xl font-display font-bold text-foreground">{checkingOutSoon.length}</h3>
              </div>
              <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
                <DoorOpen className="h-7 w-7 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/50 shadow-md bg-card hover-elevate">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1">Total Registros</p>
                <h3 className="text-4xl font-display font-bold text-foreground">{guests?.length || 0}</h3>
              </div>
              <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
                <CalendarCheck className="h-7 w-7 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-12 bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">Gestión Inteligente</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Administre las hojas de vida de los residentes, controle fechas de estadía y mantenga el historial de comunicaciones por WhatsApp vinculado automáticamente al número de habitación.
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg" className="rounded-xl shadow-md hover-elevate active-elevate-2 bg-primary">
              <Link href="/guests">Ver Todos los Huéspedes</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
