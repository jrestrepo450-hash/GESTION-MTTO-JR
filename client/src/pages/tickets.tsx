import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTickets, useUpdateTicket, useDeleteTicket, useCreateTicket } from "@/hooks/use-tickets";
import { useSpaces } from "@/hooks/use-spaces";
import { useWaUsers } from "@/hooks/use-wa-users";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Trash2, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_LABELS: Record<string, string> = { 
  pendiente: "Pendiente", 
  Pendiente: "Pendiente", 
  en_progreso: "En Progreso", 
  resuelto: "Resuelto" 
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-900/20",
  en_progreso: "border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  resuelto: "border-green-400 text-green-600 bg-green-50 dark:bg-green-900/20"
};

const PRIORITY_COLORS: Record<string, string> = {
  baja: "text-slate-500", 
  media: "text-blue-500", 
  alta: "text-amber-500", 
  urgente: "text-red-500 font-bold",
};

export default function Tickets() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Hooks globales de obtención de datos
  const { data: tickets, isLoading } = useTickets(); 
  const { data: spaces } = useSpaces();
  const { data: waUsers } = useWaUsers();
  
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();
  const createTicket = useCreateTicket();

  const [localTickets, setLocalTickets] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("media");
  const [spaceId, setSpaceId] = useState<string>("");
  const [assignedToId, setAssignedToId] = useState<string>("");

  // Sincronización robusta con la caché del servidor
  useEffect(() => {
    if (tickets && Array.isArray(tickets)) {
      setLocalTickets(tickets);
    }
  }, [tickets]);

  // Formateador nativo ultra-seguro libre de librerías externas propensas a fallos
  const formatSafeDate = (rawDate: any) => {
    if (!rawDate) return "Reciente";
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return "Reciente";
      return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "Reciente";
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !spaceId) return;
    
    const parsedAssignedTo = assignedToId && assignedToId !== "none" ? Number(assignedToId) : null;

    createTicket.mutate({
      title,
      description: description || "",
      priority: priority as any,
      status: "pendiente",
      spaceId: Number(spaceId),
      imageUrl: null, 
      assignedToId: parsedAssignedTo,
      createdById: null,
    }, {
      onSuccess: () => {
        // Forzamos el refresco completo de la lista general en React Query
        queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
        setTicketOpen(false);
        setTitle(""); setDescription(""); setPriority("media"); setSpaceId(""); setAssignedToId("");
      },
    });
  };

  // Procesamiento seguro de filtros con salvaguardas para cada string
  const filtered = localTickets.filter(t => {
    if (!t) return false;
    
    if (statusFilter !== "all") {
      const currentStatus = String(t.status || "").toLowerCase();
      if (currentStatus !== statusFilter.toLowerCase()) return false;
    }

    // Resolver nombres de relaciones de manera segura incluso si el backend las envía vacías
    const ticketSpaceName = t.space?.name || spaces?.find(s => s.id === t.spaceId)?.name || "";
    const ticketAssignedName = t.assignedTo?.name || waUsers?.find(u => u.id === t.assignedToId)?.name || "";

    const matchesSearch = 
      String(t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      String(ticketSpaceName).toLowerCase().includes(search.toLowerCase()) ||
      String(ticketAssignedName).toLowerCase().includes(search.toLowerCase());
      
    return matchesSearch;
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" /> Pendientes
          </h1>
          <p className="text-muted-foreground mt-1">Gestión de tareas de mantenimiento</p>
        </div>
        <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nuevo pendiente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo pendiente</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium block mb-1">Espacio *</label>
                <Select value={spaceId || undefined} onValueChange={setSpaceId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar espacio" /></SelectTrigger>
                  <SelectContent>
                    {spaces?.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Título *</label>
                <Input
                  placeholder="Describe el problema brevemente"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Descripción</label>
                <Textarea
                  placeholder="Detalles adicionales..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Prioridad</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Asignar a</label>
                  <Select value={assignedToId || "none"} onValueChange={setAssignedToId}>
                    <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {waUsers?.map(u => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createTicket.isPending || !title || !spaceId}>
                {createTicket.isPending ? "Creando..." : "Crear pendiente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Buscar por título, espacio o asignado..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <Filter className="mr-2 h-4 w-4" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="en_progreso">En Progreso</SelectItem>
            <SelectItem value="resuelto">Resueltos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-10">Cargando...</div>
      ) : (
        <div className="space-y-3">
          {filtered?.map(t => {
            const statusKey = t.status || "pendiente";
            
            // 🛡️ Mecanismo de defensa de relaciones en cascada (Evita pantallas en blanco si la propiedad anidada no viene)
            const resolvedSpaceName = t.space?.name || spaces?.find(s => s.id === t.spaceId)?.name || "Espacio N/A";
            const resolvedAssignedUser = t.assignedTo?.name || waUsers?.find(u => u.id === t.assignedToId)?.name || null;

            return (
              <Card key={t.id} className="border border-border/50 shadow-sm">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1.5">
                      <span className="font-semibold text-sm">{t.title}</span>
                      <span className={`text-xs ${PRIORITY_COLORS[t.priority] || "text-slate-500"}`}>
                        [{String(t.priority || "MEDIA").toUpperCase()}]
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{t.description}</p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" /> {resolvedSpaceName}
                      </span>
                      {resolvedAssignedUser && (
                        <span>Asignado: <strong>{resolvedAssignedUser}</strong></span>
                      )}
                      <span>{formatSafeDate(t.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={statusKey}
                      onValueChange={val => {
                        // Actualización local inmediata preservando la consistencia
                        setLocalTickets(prev => prev.map(item => item.id === t.id ? { ...item, status: val } : item));
                        updateTicket.mutate(
                          { id: t.id, status: val as any },
                          {
                            onSuccess: () => {
                              queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
                            }
                          }
                        );
                      }}
                    >
                      <SelectTrigger className={`h-8 w-36 text-xs border ${STATUS_COLORS[statusKey] || "border-amber-400"}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en_progreso">En Progreso</SelectItem>
                        <SelectItem value="resuelto">Resuelto</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeletingId(t.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered?.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No hay pendientes</p>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={deletingId !== null} onOpenChange={o => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pendiente?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { 
                if (deletingId) {
                  setLocalTickets(prev => prev.filter(item => item.id !== deletingId));
                  deleteTicket.mutate(deletingId, {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
                    }
                  });
                } 
                setDeletingId(null); 
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

