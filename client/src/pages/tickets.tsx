import { useState } from "react";
import { Link } from "wouter";
import { useTickets, useUpdateTicket, useDeleteTicket, useCreateTicket } from "@/hooks/use-tickets";
import { useSpaces } from "@/hooks/use-spaces";
import { useWaUsers } from "@/hooks/use-wa-users";
import { ClipboardList, Plus, Trash2, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_LABELS: Record<string, string> = { 
  pendiente: "Pendiente", 
  Pendiente: "Pendiente", // 🛡️ Soporte para P mayúscula
  en_progreso: "En Progreso", 
  resuelto: "Resuelto" 
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-900/20",
  Pendiente: "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-900/20", // 🛡️ Mismo color
  en_progreso: "border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  resuelto: "border-green-400 text-green-600 bg-green-50 dark:bg-green-900/20"
};
const PRIORITY_COLORS: Record<string, string> = {
  baja: "text-slate-500", media: "text-blue-500", alta: "text-amber-500", urgente: "text-red-500 font-bold",
};

export default function Tickets() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: tickets, isLoading } = useTickets(statusFilter !== "all" ? { status: statusFilter } : undefined);
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
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !spaceId) return;
    createTicket.mutate({
      title,
      description,
      priority: priority as any,
      status: "pendiente",
      spaceId: Number(spaceId),
      imageUrl: imageFile ? URL.createObjectURL(imageFile) : null,
      assignedToId: assignedToId ? Number(assignedToId) : null,
      createdById: null,
    }, {
      onSuccess: () => {
        setTicketOpen(false);
        setTitle(""); setDescription(""); setPriority("media"); setSpaceId(""); setAssignedToId("");
      },
    });
  };

  const filtered = tickets?.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.space?.name.toLowerCase().includes(search.toLowerCase()) ||
    t.assignedTo?.name.toLowerCase().includes(search.toLowerCase())
  );

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
            <Button data-testid="button-new-ticket"><Plus className="mr-2 h-4 w-4" />Nuevo pendiente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo pendiente</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium block mb-1">Espacio *</label>
                <Select value={spaceId || undefined} onValueChange={setSpaceId}>
                  <SelectTrigger data-testid="select-space"><SelectValue placeholder="Seleccionar espacio" /></SelectTrigger>
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
                  data-testid="input-ticket-title"
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
              <div className="space-y-2">
  <label className="text-sm font-medium block">Evidencia Fotográfica</label>
  <input 
    type="file" 
    accept="image/*" 
    capture="environment"
    onChange={(e) => {
      if (e.target.files && e.target.files[0]) {
        setImageFile(e.target.files[0]);
      }
    }}
    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
  />
  {imageFile && (
    <p className="text-xs text-green-500">✓ Foto cargada con éxito</p>
  )}
</div>
              <Button type="submit" className="w-full" disabled={createTicket.isPending || !title || !spaceId}>
                {createTicket.isPending ? "Creando..." : "Crear pendiente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
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
          {filtered?.map(t => (
            <Card key={t.id} className="border border-border/50 shadow-sm">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1.5">
                    <span className="font-semibold text-sm">{t.title}</span>
                    <span className={`text-xs ${PRIORITY_COLORS[t.priority]}`}>[{t.priority.toUpperCase()}]</span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{t.description}</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                    {t.space && (
                      <Link href={`/spaces/${t.space.id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <ChevronRight className="h-3 w-3" /> {t.space.name}
                      </Link>
                    )}
                    {t.assignedTo && <span>Asignado: <strong>{t.assignedTo.name}</strong></span>}
                    {t.createdAt && <span>{format(new Date(t.createdAt), "dd MMM yyyy", { locale: es })}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={t.status}
                    onValueChange={val => updateTicket.mutate({ id: t.id, status: val as any })}
                  >
                    <SelectTrigger className={`h-8 w-36 text-xs border ${STATUS_COLORS[t.status] || ""}`}>
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
                    data-testid={`button-delete-ticket-${t.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered?.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No hay pendientes {statusFilter !== "all" ? `con estado "${STATUS_LABELS[statusFilter]}"` : ""}</p>
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
              onClick={() => { if (deletingId) deleteTicket.mutate(deletingId); setDeletingId(null); }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

