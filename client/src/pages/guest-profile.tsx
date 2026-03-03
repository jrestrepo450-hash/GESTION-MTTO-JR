import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGuest } from "@/hooks/use-guests";
import { useMessages, useCreateMessage } from "@/hooks/use-messages";
import { GuestFormDialog } from "@/components/guest-form-dialog";
import { 
  ArrowLeft, Edit, Calendar, User, FileText, AlignLeft, Send, 
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function GuestProfile() {
  const [, params] = useRoute("/guests/:roomNumber");
  const roomNumber = params?.roomNumber || "";
  
  const { data: guest, isLoading: guestLoading } = useGuest(roomNumber);
  const { data: messages, isLoading: messagesLoading } = useMessages(roomNumber);
  const createMessage = useCreateMessage();

  const [messageText, setMessageText] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    createMessage.mutate({
      roomNumber,
      content: messageText,
      sender: "Hotel", // Simulating the hotel sending a message
    }, {
      onSuccess: () => setMessageText("")
    });
  };

  const formatDate = (dateStr: Date | string | null | undefined) => {
    if (!dateStr) return "No registrado";
    return format(new Date(dateStr), "dd MMMM yyyy", { locale: es });
  };

  if (guestLoading) {
    return <div className="p-10 flex justify-center items-center h-full">Cargando perfil...</div>;
  }

  if (!guest) {
    return (
      <div className="p-10 flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-3xl font-display font-bold text-foreground mb-4">Huésped no encontrado</h2>
        <p className="text-muted-foreground mb-8">No existe un registro para la habitación {roomNumber}</p>
        <Button asChild className="rounded-xl hover-elevate">
          <Link href="/guests"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al directorio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-full h-10 w-10 hover-elevate">
            <Link href="/guests"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-display font-bold text-foreground">{guest.name}</h1>
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm font-bold shadow-sm">
                Hab. {guest.roomNumber}
              </span>
            </div>
          </div>
        </div>
        <GuestFormDialog 
          guest={guest} 
          open={isEditOpen} 
          onOpenChange={setIsEditOpen}
          trigger={
            <Button variant="outline" className="rounded-xl hover-elevate bg-card border-border shadow-sm">
              <Edit className="mr-2 h-4 w-4 text-primary" /> Editar Perfil
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Col: Info */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="rounded-2xl border-none shadow-md bg-card overflow-hidden">
            <div className="h-2 bg-accent w-full"></div>
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-xl text-foreground flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" /> Detalles del Huésped
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                  <FileText className="mr-1.5 h-4 w-4" /> Documento / ID
                </p>
                <p className="text-base font-semibold">{guest.documentId || "No registrado"}</p>
              </div>
              <Separator className="bg-border/50" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                    <Calendar className="mr-1.5 h-4 w-4" /> Check-in
                  </p>
                  <p className="text-base font-semibold">{formatDate(guest.checkIn)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                    <Calendar className="mr-1.5 h-4 w-4" /> Check-out
                  </p>
                  <p className="text-base font-semibold">{formatDate(guest.checkOut)}</p>
                </div>
              </div>
              <Separator className="bg-border/50" />
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                  <AlignLeft className="mr-1.5 h-4 w-4" /> Notas Adicionales
                </p>
                <div className="bg-secondary/50 p-4 rounded-xl text-sm leading-relaxed border border-border/50 min-h-[100px]">
                  {guest.notes ? guest.notes : <span className="text-muted-foreground italic">Sin notas registradas.</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: WhatsApp Messages */}
        <div className="lg:col-span-8 flex flex-col h-[600px] lg:h-auto bg-card rounded-2xl border border-border/50 shadow-md overflow-hidden">
          <div className="bg-secondary/40 p-4 border-b border-border/50 flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-full">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Comunicaciones (WhatsApp)</h3>
              <p className="text-xs text-muted-foreground">Vinculado a Habitación {guest.roomNumber}</p>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6 bg-slate-50/50 dark:bg-background">
            {messagesLoading ? (
              <div className="flex justify-center py-10 text-muted-foreground text-sm">Cargando mensajes...</div>
            ) : messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-10 text-muted-foreground">
                <MessageCircle className="h-10 w-10 opacity-20" />
                <p>No hay mensajes registrados para esta habitación.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages?.map((msg) => {
                  const isHotel = msg.sender === "Hotel";
                  return (
                    <div key={msg.id} className={`flex ${isHotel ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`
                          max-w-[80%] rounded-2xl px-4 py-3 shadow-sm
                          ${isHotel 
                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                            : 'bg-white border border-border/50 text-foreground rounded-tl-sm dark:bg-card'}
                        `}
                      >
                        <div className="text-xs font-semibold mb-1 opacity-70">
                          {isHotel ? 'Recepción' : msg.sender}
                        </div>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className={`text-[10px] mt-2 text-right opacity-60`}>
                          {msg.receivedAt ? format(new Date(msg.receivedAt), "HH:mm") : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 bg-background border-t border-border/50">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Escribe un mensaje al huésped..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 rounded-full bg-secondary/30 border-border focus-visible:ring-primary h-12 px-6"
                disabled={createMessage.isPending}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90 hover-elevate shadow-md shrink-0"
                disabled={!messageText.trim() || createMessage.isPending}
              >
                <Send className="h-5 w-5 ml-1" />
              </Button>
            </form>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              *Este es un simulador de envío. Se conectará al webhook de WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
