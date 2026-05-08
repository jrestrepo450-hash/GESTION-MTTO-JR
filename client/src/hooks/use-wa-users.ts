import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WaUser, InsertWaUser } from "@shared/schema";

export function useWaUsers() {
  return useQuery<WaUser[]>({ queryKey: [api.waUsers.list.path] });
}

export function useCreateWaUser() {
  return useMutation({
    mutationFn: async (u: InsertWaUser) => {
      const res = await apiRequest("POST", api.waUsers.create.path, u);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.waUsers.list.path] }),
  });
}

export function useUpdateWaUser() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InsertWaUser> & { id: number }) => {
      const res = await apiRequest("PUT", buildUrl(api.waUsers.update.path, { id }), updates);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.waUsers.list.path] }),
  });
}

export function useDeleteWaUser() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", buildUrl(api.waUsers.delete.path, { id }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.waUsers.list.path] }),
  });
}
