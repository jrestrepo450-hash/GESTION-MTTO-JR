import { useTicketStats } from "@/hooks/use-photos";
import { useTickets } from "@/hooks/use-tickets";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PieChart as PieIcon } from "lucide-react";

const COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

// ── Global Charts ─────────────────────────────────────────────────────────────
export function GlobalTicketCharts() {
  const { data: stats } = useTicketStats();
  const { data: tickets } = useTickets();

  // Top 8 novedades más recurrentes globalmente
  const topGlobal = (stats || []).slice(0, 8).map(s => ({
    name: s.title.length > 28 ? s.title.slice(0, 28) + "…" : s.title,
    fullName: s.title,
    espacio: s.spaceName,
    cantidad: s.count,
  }));

  // Aseguramos que tickets sea una lista válida en este componente
  const listaTickets = Array.isArray(tickets) ? tickets : [];

  const statusCounts = {
    "Pendiente": listaTickets.filter(t => t.status?.toLowerCase() === "pendiente" || t.status?.toLowerCase() === "en_progreso").length ?? 0,
    "En Progreso": listaTickets.filter(t => t.status?.toLowerCase() === "en_progreso").length ?? 0,
    "Resuelto": listaTickets.filter(t => t.status?.toLowerCase() === "resuelto").length ?? 0,
  };
  const pieData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  // Distribución por prioridad (con .toLowerCase() para asegurar el match)
  const priorityCounts = {
    "Baja": listaTickets.filter(t => t.priority?.toLowerCase() === "baja").length ?? 0,
    "Media": listaTickets.filter(t => t.priority?.toLowerCase() === "media").length ?? 0,
    "Alta": listaTickets.filter(t => t.priority?.toLowerCase() === "alta").length ?? 0,
    "Urgente": listaTickets.filter(t => t.priority?.toLowerCase() === "urgente").length ?? 0,
  };
  const priorityData = Object.entries(priorityCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const priorityColors: Record<string, string> = {
    Urgente: "#ef4444", Alta: "#f59e0b", Media: "#6366f1", Baja: "#10b981",
  };

  if (!stats?.length && !tickets?.length) {
    return (
      <Card className="border border-border/50 shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay datos de pendientes para mostrar gráficos
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bar Chart: Novedades más recurrentes */}
      {topGlobal.length > 0 && (
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Novedades más recurrentes (global)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topGlobal} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={160}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-xl px-3 py-2 shadow-lg text-sm">
                          <p className="font-semibold mb-1">{d.fullName}</p>
                          <p className="text-muted-foreground text-xs">{d.espacio}</p>
                          <p className="text-primary font-bold mt-1">{d.cantidad} {d.cantidad === 1 ? "vez" : "veces"}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="cantidad" radius={[0, 6, 6, 0]}>
                  {topGlobal.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Pie Charts: Estado y Prioridad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-primary" />
                Por estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {priorityData.length > 0 && (
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-amber-500" />
                Por prioridad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {priorityData.map((entry) => (
                      <Cell key={entry.name} fill={priorityColors[entry.name] || "#6366f1"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Per-Space Chart ───────────────────────────────────────────────────────────
export function SpaceTicketChart({ spaceId }: { spaceId: number }) {
  const { data: tickets } = useTickets({ spaceId });

  if (!tickets?.length) return null;

  // Group by normalized title
  const map = new Map<string, number>();
  for (const t of tickets) {
    const key = t.title.trim();
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const data = Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([title, count]) => ({
      name: title.length > 24 ? title.slice(0, 24) + "…" : title,
      fullName: title,
      cantidad: count,
    }));

  if (data.length <= 1) return null;

  return (
    <Card className="border border-border/50 shadow-sm mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Novedades recurrentes en este espacio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={130} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
                      <p className="font-semibold">{d.fullName}</p>
                      <p className="text-primary font-bold mt-1">{d.cantidad} {d.cantidad === 1 ? "vez" : "veces"}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="cantidad" radius={[0, 6, 6, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
