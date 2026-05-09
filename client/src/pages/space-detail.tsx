import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useSpace, useSpaceItems, useCreateSpaceItem, useUpdateSpaceItem, useDeleteSpaceItem } from "@/hooks/use-spaces";
import { useMessages, useCreateMessage } from "@/hooks/use-messages";
import { useTickets, useCreateTicket, useUpdateTicket } from "@/hooks/use-tickets";
import { useWaUsers } from "@/hooks/use-wa-users";
import { PhotoGallery } from "@/components/photo-gallery";
import { SpaceTicketChart } from "@/components/ticket-charts";
import {
  ArrowLeft, Plus, Send, MessageCircle, ClipboardList, Camera, Layers,
  CheckCircle2, AlertCircle, XCircle, Pencil, Trash2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SPACE_TYPE_LABELS, type SpaceType, type SpaceItem } from "@shared/schema";
import { SpaceFormDialog } from "@/components/space-form-dialog";

const STATUS_CONFIG = {
  ok: { label: "OK", icon: <CheckCircle2 className="h-4 w-4" />, class: "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20" },
  mantenimiento: { label: "Mantenimiento", icon: <AlertCircle className="h-4 w-4" />, class: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20" },
  fuera_de_servicio: { label: "Fuera de servicio", icon: <XCircle className="h-4 w-4" />, class: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20" },
};

const PRIORITY_COLORS: Record<string, string> = {
  baja: "text-slate-500",
  media: "text-blue-500",
  alta: "text-amber-500",
  urgente: "text-red-500",
};

export default function SpaceDetail() {
  const [, params] = useRoute("/spaces/:id");
  const spaceId = Number(params?.id);

  const { data: space, isLoading } = useSpace(spaceId);
  const { data: items } = useSpaceItems(spaceId);
  const { data: messages } = useMessages(space?.code || "");
  const { data: tickets } = useTickets({ spaceId });
  const { data: waUsers } = useWaUsers();

  const createItem = useCreateSpaceItem(spaceId);
  const updateItem = useUpdateSpaceItem(spaceId);
  const deleteItem = useDeleteSpaceItem(spaceId);
  const createMessage = useCreateMessage();
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();

  const [msgText, setMsgText] = useState("");
  const [msgSender, setMsgSender] = useState("Técnico");
  const [newItemName, setNewItemName] = useState("");
  const [addItemOpen, setAddItemOpen] = useState(false);

  // Ticket form
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketPriority, setTicketPriority] = useState("media");
  const [ticketAssigned, setTicketAssigned] = useState<string>("");

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Cargando espacio...</div>;
  if (!space) return (
    <div className="p-10 text-center">
      <p className="text-muted-foreground mb-4">Espacio no encontrado</p>
      <Button asChild variant="outline"><Link href="/spaces"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Link></Button>
    </div>
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    createMessage.mutate({ spaceCode: space.code, content: msgText, sender: msgSender, isMaintenanceUpdate: false }, {
      onSuccess: () => setMsgText(""),
    });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    createItem.mutate({ name: newItemName, status: "ok", notes: "" }, {
      onSuccess: () => { setNewItemName(""); setAddItemOpen(false); },
    });
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim()) return;
    createTicket.mutate({
      spaceId,
      title: ticketTitle,
      description: ticketDesc,
      status: "pendiente",
      priority: ticketPriority as any,
      assignedToId: ticketAssigned ? Number(ticketAssigned) : null,
      createdById: null,
    }, {
      onSuccess: () => {
        setTicketOpen(false);
        setTicketTitle(""); setTicketDesc(""); setTicketPriority("media"); setTicketAssigned("");
      },
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto flex flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="rounded-full h-9 w-9 shrink-0">
            <Link href="/spaces"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{space.name}</h1>
              <Badge variant="secondary">{SPACE_TYPE_LABELS[space.type as SpaceType] || space.type}</Badge>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-bold">{space.code}</span>
            </div>
            {space.notes && <p className="text-sm text-muted-foreground mt-0.5">{space.notes}</p>}
          </div>
        </div>
        <SpaceFormDialog space={space} trigger={
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-3 w-3" /> Editar espacio
          </Button>
        } />
      </div>

      <Tabs defaultValue="items" className="flex-1">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="items" data-testid="tab-items">
            <Layers className="mr-1.5 h-4 w-4" /> Ítems ({items?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="tickets" data-testid="tab-tickets">
            <ClipboardList className="mr-1.5 h-4 w-4" /> Pendientes ({tickets?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="photos" data-testid="tab-photos">
            <Camera className="mr-1.5 h-4 w-4" /> Fotos
          </TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">
            <MessageCircle className="mr-1.5 h-4 w-4" /> Bitácora WhatsApp
          </TabsTrigger>
        </TabsList>

        {/* ── Items Tab ── */}
        <TabsContent value="items">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">Equipos y elementos del espacio con su estado actual</p>
            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-item">
                  <Plus className="mr-1.5 h-4 w-4" /> Agregar ítem
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo ítem</DialogTitle></DialogHeader>
                <form onSubmit={handleAddItem} className="space-y-4 mt-2">
                  <Input
                    placeholder={'Ej: TV 55", Aire acondicionado, Cama King...'}
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    data-testid="input-item-name"
                  />
                  <Button type="submit" className="w-full" disabled={createItem.isPending}>
                    {createItem.isPending ? "Guardando..." : "Agregar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {items?.map(item => {
              const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ok;
              return (
                <Card key={item.id} className={`border shadow-sm ${cfg.class}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="font-medium text-sm leading-tight">{item.name}</span>
                      <Button
                        variant="ghost" size="icon"
                        className="h-6 w-6 shrink-0 text-muted-foreground"
                        onClick={() => deleteItem.mutate(item.id)}
                        data-testid={`button-delete-item-${item.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      {cfg.icon}
                      <span className="text-xs font-medium">{cfg.label}</span>
                    </div>
                    <Select
                      value={item.status}
                      onValueChange={val => updateItem.mutate({ id: item.id, status: val })}
                    >
                      <SelectTrigger className="h-8 text-xs" data-testid={`select-status-${item.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ok">OK</SelectItem>
                        <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="fuera_de_servicio">Fuera de servicio</SelectItem>
                      </SelectContent>
                    </Select>
                    {item.notes && <p className="text-xs text-muted-foreground mt-2 leading-tight">{item.notes}</p>}
                  </CardContent>
                </Card>
              );
            })}
            {items?.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <Layers className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No hay ítems registrados. Agrega equipos, muebles o elementos.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tickets Tab ── */}
        <TabsContent value="tickets">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">Tareas y pendientes de mantenimiento</p>
            <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-ticket">
                  <Plus className="mr-1.5 h-4 w-4" /> Nuevo pendiente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo pendiente</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateTicket} className="space-y-4 mt-2">
                  <Input
                    placeholder="Título del pendiente"
                    value={ticketTitle}
                    onChange={e => setTicketTitle(e.target.value)}
                    data-testid="input-ticket-title"
                  />
                  <Textarea
                    placeholder="Descripción (opcional)"
                    value={ticketDesc}
                    onChange={e => setTicketDesc(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Prioridad</label>
                      <Select value={ticketPriority} onValueChange={setTicketPriority}>
                        <SelectTrigger data-testid="select-ticket-priority"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Asignar a</label>
                      <Select value={ticketAssigned} onValueChange={setTicketAssigned}>
                        <SelectTrigger data-testid="select-ticket-assigned"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin asignar</SelectItem>
                          {waUsers?.map(u => (
                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createTicket.isPending}>
                    {createTicket.isPending ? "Creando..." : "Crear pendiente"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {tickets?.map(t => (
              <Card key={t.id} className="border border-border/50 shadow-sm">
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm">{t.title}</span>
                      <span className={`text-xs font-semibold ${PRIORITY_COLORS[t.priority]}`}>{t.priority.toUpperCase()}</span>
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground mb-2">{t.description}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      {t.assignedTo && (
                        <span className="text-xs text-muted-foreground">Asignado: {t.assignedTo.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={t.status}
                      onValueChange={val => updateTicket.mutate({ id: t.id, status: val as any })}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en_progreso">En progreso</SelectItem>
                        <SelectItem value="resuelto">Resuelto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
            {tickets?.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No hay pendientes para este espacio</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Messages Tab ── */}
        <TabsContent value="messages" className="flex flex-col">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col" style={{ height: "60vh" }}>
            <div className="p-3 border-b border-border/50 bg-secondary/30 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-sm">Bitácora diaria — Espacio {space.code}</span>
              <span className="text-xs text-muted-foreground ml-auto">Se actualiza cada 5 seg</span>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages?.map(msg => {
                  const isRight = msg.sender === "Técnico" || msg.sender === "Recepción";
                  return (
                    <div key={msg.id} className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl shadow-sm ${
                        isRight ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground"
                      } ${msg.isMaintenanceUpdate ? "ring-2 ring-primary/30" : ""}`}>
                        <div className="text-[10px] font-bold mb-1 opacity-70">{msg.sender}</div>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <div className="text-[10px] mt-1 text-right opacity-50">
                          {msg.receivedAt ? format(new Date(msg.receivedAt), "dd MMM HH:mm", { locale: es }) : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {messages?.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Sin mensajes registrados para este espacio</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border/50 bg-background space-y-2">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Select value={msgSender} onValueChange={setMsgSender}>
                  <SelectTrigger className="w-40 h-10 text-sm shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Recepción">Recepción</SelectItem>
                    {waUsers?.map(u => (
                      <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Escribe un mensaje o actualización..."
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  className="flex-1 h-10"
                  data-testid="input-message"
                />
                <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={!msgText.trim() || createMessage.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-center text-muted-foreground">
                Los mensajes enviados por WhatsApp aparecen aquí automáticamente vinculados al código <strong>{space.code}</strong>
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ── Photos Tab ── */}
        <TabsContent value="photos">
          <SpaceTicketChart spaceId={spaceId} />
          <PhotoGallery spaceId={spaceId} spaceCode={space.code} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
