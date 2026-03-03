import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, Edit, ShieldAlert, Zap, Wind, Paintbrush, Send, 
  MessageCircle, CheckCircle2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

export default function GuestProfile() {
  const [, params] = useRoute("/guests/:roomNumber");
  const roomNumber = params?.roomNumber || "";
  
  const { data: room, isLoading: roomLoading } = useQuery({
    queryKey: [buildUrl(api.rooms.get.path, { roomNumber })]
  });
  
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: [buildUrl(api.messages.list.path, { roomNumber })]
  });

  const createMessage = useMutation({
    mutationFn: async (msg: any) => {
      const res = await apiRequest("POST", api.messages.create.path, msg);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.messages.list.path, { roomNumber })] });
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.rooms.get.path, { roomNumber })] });
    }
  });

  const [messageText, setMessageText] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    createMessage.mutate({ roomNumber, content: messageText, sender: "Técnico" }, {
      onSuccess: () => setMessageText("")
    });
  };

  const getStatusIcon = (status: string) => {
    return status === "ok" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  if (roomLoading) return <div className="p-10 flex justify-center items-center h-full">Cargando...</div>;
  if (!room) return <div className="p-10 text-center">Habitación no encontrada</div>;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-full h-10 w-10">
            <Link href="/guests"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">Hoja de Vida: Hab. {room.roomNumber}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="rounded-2xl border-none shadow-md bg-card overflow-hidden">
            <CardHeader><CardTitle className="text-xl flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-primary" />Estado de Mantenimiento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                <div className="flex items-center gap-3"><Zap className="h-5 w-5 text-yellow-500" /><span>Energía</span></div>
                {getStatusIcon(room.energyStatus)}
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                <div className="flex items-center gap-3"><Wind className="h-5 w-5 text-blue-400" /><span>Aire Acondicionado</span></div>
                {getStatusIcon(room.acStatus)}
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                <div className="flex items-center gap-3"><ShieldAlert className="h-5 w-5 text-red-400" /><span>Detectores de Humo</span></div>
                {getStatusIcon(room.smokeDetectorStatus)}
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                <div className="flex items-center gap-3"><Paintbrush className="h-5 w-5 text-purple-400" /><span>Pintura</span></div>
                {getStatusIcon(room.paintStatus)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 flex flex-col bg-card rounded-2xl border border-border/50 shadow-md overflow-hidden h-[600px]">
          <div className="bg-secondary/40 p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><MessageCircle className="h-5 w-5 text-emerald-600" />Bitácora Diaria (WhatsApp)</h3>
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages?.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.sender === "Técnico" ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${msg.isMaintenanceUpdate ? 'border-2 border-primary/30' : ''} ${msg.sender === "Técnico" ? 'bg-primary text-primary-foreground' : 'bg-secondary/50'}`}>
                    <div className="text-xs font-bold mb-1">{msg.sender}</div>
                    <p className="text-sm">{msg.content}</p>
                    <div className="text-[10px] mt-1 text-right opacity-60">{format(new Date(msg.receivedAt), "HH:mm", { locale: es })}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 bg-background border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input 
                placeholder="Ej: Aire OK, Energía mantenimiento..." 
                value={messageText} 
                onChange={(e) => setMessageText(e.target.value)}
                className="rounded-full h-12"
              />
              <Button type="submit" size="icon" className="rounded-full h-12 w-12"><Send className="h-5 w-5" /></Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
