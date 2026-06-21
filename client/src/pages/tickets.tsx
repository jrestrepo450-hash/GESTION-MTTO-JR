import { useState, useEffect } from "react";
import { useTickets, useUpdateTicket, useDeleteTicket, useCreateTicket } from "@/hooks/use-tickets";
import { useSpaces } from "@/hooks/use-spaces";
import { useWaUsers } from "@/hooks/use-wa-users";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Trash2, ChevronRight, Filter, User } from "lucide-react";
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

  // Leemos los datos directamente desde el servidor usando React Query
  const { data: tickets, isLoading } = useTickets(); 
  const { data: spaces } = useSpaces();
  const { data: waUsers } = useWaUsers();
  
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();
  const createTicket = useCreateTicket();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("media");
  const [spaceId, setSpaceId] = useState<string>("");
  const [assignedToId, setAssignedToId] = useState<string>("");

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
        queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
        setTicketOpen(false);
        setTitle(""); setDescription(""); setPriority("media"); setSpaceId(""); setAssignedToId("");
      },
    });
  };

  // Filtramos leyendo directamente la variable estable 'tickets' de internet, sin usar intermediarios
  const filtered = (tickets || []).filter(t => {
    if (!t) return false;
    
    if (statusFilter !== "all") {
      const currentStatus = String(t.status || "").toLowerCase();
      if (currentStatus !== statusFilter.toLowerCase()) return false;
    }

    const spaceName = t.space?.name || "";
    const techName = t.assignedTo?.name || "";

    return (
      String(t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      String(spaceName).toLowerCase().includes(search.toLowerCase()) ||
      String(techName).toLowerCase().includes(search.toLowerCase())
    );
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
                    {Array.isArray(spaces) && spaces.map(s => (
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
                      {Array.isArray(waUsers) && waUsers.map(u => (
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
          {filtered.map(t => {
            // Convertimos estados y prioridades a minúsculas seguras para evitar errores de estilos CSS
            const statusKey = String(t.status || "pendiente").toLowerCase();
            const priorityKey = String(t.priority || "media").toLowerCase();
            
            const currentSpaceName = t.space?.name || "Espacio asignado";
            const currentTechName = t.assignedTo?.name || null;

            return (
              <Card key={t.id} className="border border-border/50 shadow-sm">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1.5">
                      <span className="font-semibold text-sm">{t.title}</span>
                      <span className={`text-xs ${PRIORITY_COLORS[priorityKey] || "text-slate-500"}`}>
                        [{priorityKey.toUpperCase()}]
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{t.description}</p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" /> {currentSpaceName}
                      </span>
                      {currentTechName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground inline" />
                          Asignado: <strong>{currentTechName}</strong>
                        </span>
                      )}
                      <span>{formatSafeDate(t.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={statusKey}
                      onValueChange={val => {
                        const cleanVal = String(val).toLowerCase();
                        // Actualiza directamente en el servidor sin causar bucles locales
                        updateTicket.mutate({ id: t.id, status: cleanVal as any });
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
          {filtered.length === 0 && (
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
                  deleteTicket.mutate(deletingId);
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
