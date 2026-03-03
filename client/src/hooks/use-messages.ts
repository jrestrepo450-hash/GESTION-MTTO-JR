import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertMessage, Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useMessages(roomNumber: string) {
  return useQuery({
    queryKey: [api.messages.list.path, roomNumber],
    queryFn: async () => {
      if (!roomNumber) return [];
      const url = buildUrl(api.messages.list.path, { roomNumber });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar los mensajes");
      return (await res.json()) as Message[];
    },
    enabled: !!roomNumber,
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertMessage) => {
      const res = await fetch(api.messages.create.path, {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al enviar mensaje");
      }
      return (await res.json()) as Message;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, variables.roomNumber] });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });
}
