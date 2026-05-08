import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Ticket, InsertTicket, TicketWithRelations } from "@shared/schema";

export function useTickets(filters?: { spaceId?: number; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.spaceId) params.set("spaceId", String(filters.spaceId));
  if (filters?.status) params.set("status", filters.status);
  const queryString = params.toString() ? `?${params.toString()}` : "";

  return useQuery<TicketWithRelations[]>({
    queryKey: [api.tickets.list.path, filters?.spaceId, filters?.status],
    queryFn: async () => {
      const res = await fetch(`${api.tickets.list.path}${queryString}`, { credentials: "include" });
      return res.json();
    },
  });
}

export function useCreateTicket() {
  return useMutation({
    mutationFn: async (t: InsertTicket) => {
      const res = await apiRequest("POST", api.tickets.create.path, t);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
    },
  });
}

export function useUpdateTicket() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InsertTicket> & { id: number }) => {
      const res = await apiRequest("PUT", buildUrl(api.tickets.update.path, { id }), updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
    },
  });
}

export function useDeleteTicket() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", buildUrl(api.tickets.delete.path, { id }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
    },
  });
}
