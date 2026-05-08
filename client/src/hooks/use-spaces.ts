import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Space, InsertSpace, SpaceItem, InsertSpaceItem } from "@shared/schema";

// ── Spaces ────────────────────────────────────────────────────────────────────
export function useSpaces() {
  return useQuery<Space[]>({ queryKey: [api.spaces.list.path] });
}

export function useSpace(id: number) {
  return useQuery<Space>({
    queryKey: [buildUrl(api.spaces.get.path, { id })],
    enabled: !!id,
  });
}

export function useCreateSpace() {
  return useMutation({
    mutationFn: async (s: InsertSpace) => {
      const res = await apiRequest("POST", api.spaces.create.path, s);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.spaces.list.path] }),
  });
}

export function useUpdateSpace() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InsertSpace> & { id: number }) => {
      const res = await apiRequest("PUT", buildUrl(api.spaces.update.path, { id }), updates);
      return res.json();
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: [api.spaces.list.path] });
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.spaces.get.path, { id: v.id })] });
    },
  });
}

export function useDeleteSpace() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", buildUrl(api.spaces.delete.path, { id }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.spaces.list.path] }),
  });
}

// ── Space Items ───────────────────────────────────────────────────────────────
export function useSpaceItems(spaceId: number) {
  return useQuery<SpaceItem[]>({
    queryKey: [buildUrl(api.spaceItems.list.path, { spaceId })],
    enabled: !!spaceId,
  });
}

export function useCreateSpaceItem(spaceId: number) {
  return useMutation({
    mutationFn: async (item: Omit<InsertSpaceItem, "spaceId">) => {
      const res = await apiRequest("POST", buildUrl(api.spaceItems.create.path, { spaceId }), item);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [buildUrl(api.spaceItems.list.path, { spaceId })] }),
  });
}

export function useUpdateSpaceItem(spaceId: number) {
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InsertSpaceItem> & { id: number }) => {
      const res = await apiRequest("PUT", buildUrl(api.spaceItems.update.path, { id }), updates);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [buildUrl(api.spaceItems.list.path, { spaceId })] }),
  });
}

export function useDeleteSpaceItem(spaceId: number) {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", buildUrl(api.spaceItems.delete.path, { id }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [buildUrl(api.spaceItems.list.path, { spaceId })] }),
  });
}
