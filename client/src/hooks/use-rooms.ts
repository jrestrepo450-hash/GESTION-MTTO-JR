import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Room, type InsertRoom } from "@shared/schema";

export function useRooms() {
  return useQuery<Room[]>({
    queryKey: [api.rooms.list.path],
  });
}

export function useRoom(roomNumber: string) {
  return useQuery<Room>({
    queryKey: [buildUrl(api.rooms.get.path, { roomNumber })],
    enabled: !!roomNumber,
  });
}

export function useCreateRoom() {
  return useMutation({
    mutationFn: async (room: InsertRoom) => {
      const res = await apiRequest("POST", api.rooms.create.path, room);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
    },
  });
}

export function useUpdateRoom() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InsertRoom> & { id: number }) => {
      const res = await apiRequest("PUT", buildUrl(api.rooms.update.path, { id }), updates);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
      // We don't have the roomNumber here easily, but the list invalidation helps
    },
  });
}

export function useDeleteRoom() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", buildUrl(api.rooms.delete.path, { id }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
    },
  });
}
