import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertGuest, Guest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useGuests() {
  return useQuery({
    queryKey: [api.guests.list.path],
    queryFn: async () => {
      const res = await fetch(api.guests.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("No se pudieron cargar los huéspedes");
      return (await res.json()) as Guest[];
    },
  });
}

export function useGuest(roomNumber: string) {
  return useQuery({
    queryKey: [api.guests.get.path, roomNumber],
    queryFn: async () => {
      if (!roomNumber) return null;
      const url = buildUrl(api.guests.get.path, { roomNumber });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Error al cargar el huésped");
      return (await res.json()) as Guest;
    },
    enabled: !!roomNumber,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertGuest) => {
      const res = await fetch(api.guests.create.path, {
        method: api.guests.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear el huésped");
      }
      return (await res.json()) as Guest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.guests.list.path] });
      toast({ title: "Huésped registrado", description: "El huésped se ha creado correctamente." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InsertGuest> & { id: number }) => {
      const url = buildUrl(api.guests.update.path, { id });
      const res = await fetch(url, {
        method: api.guests.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar");
      }
      return (await res.json()) as Guest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.guests.list.path] });
      // Invalidar todos los queries de guest individuales para estar seguros
      queryClient.invalidateQueries({ queryKey: [api.guests.get.path] });
      toast({ title: "Actualizado", description: "Los datos del huésped se han actualizado." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.guests.delete.path, { id });
      const res = await fetch(url, {
        method: api.guests.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al eliminar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.guests.list.path] });
      toast({ title: "Eliminado", description: "El huésped ha sido eliminado del sistema." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });
}
