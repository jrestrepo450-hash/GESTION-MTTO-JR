import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Message, type InsertMessage } from "@shared/schema";

export function useMessages(roomNumber: string) {
  return useQuery<Message[]>({
    queryKey: [buildUrl(api.messages.list.path, { roomNumber })],
    enabled: !!roomNumber,
  });
}

export function useCreateMessage() {
  return useMutation({
    mutationFn: async (message: InsertMessage) => {
      const res = await apiRequest("POST", api.messages.create.path, message);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.messages.list.path, { roomNumber: variables.roomNumber })] });
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.rooms.get.path, { roomNumber: variables.roomNumber })] });
    },
  });
}
