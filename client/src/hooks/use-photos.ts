import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { SpacePhoto } from "@shared/schema";

export function useSpacePhotos(spaceId: number) {
  return useQuery<SpacePhoto[]>({
    queryKey: ["/api/spaces", spaceId, "photos"],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/photos`, { credentials: "include" });
      return res.json();
    },
    enabled: !!spaceId,
  });
}

export function useUploadSpacePhoto(spaceId: number) {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`/api/spaces/${spaceId}/photos`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al subir foto");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/spaces", spaceId, "photos"] }),
  });
}

export function useDeleteSpacePhoto(spaceId: number) {
  return useMutation({
    mutationFn: async (photoId: number) => {
      await fetch(`/api/photos/${photoId}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/spaces", spaceId, "photos"] }),
  });
}

export function useTicketStats() {
  return useQuery<{ title: string; count: number; spaceId: number; spaceName: string }[]>({
    queryKey: ["/api/stats/tickets"],
  });
}
