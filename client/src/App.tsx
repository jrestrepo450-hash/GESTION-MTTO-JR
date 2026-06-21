import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Hook para obtener todos los tickets (Pendientes)
export function useTickets() {
  return useQuery<any[]>({
    queryKey: ["/api/tickets"],
    queryFn: async () => {
      const res = await fetch("/api/tickets");
      if (!res.ok) {
        throw new Error("Error al consultar los tickets en el servidor");
      }
      const data = await res.json();
      // Nos aseguramos de que siempre devuelva un arreglo para que el .map() de la vista no explote
      return Array.isArray(data) ? data : [];
    }
  });
}

// Hook para crear un nuevo ticket
export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTicket: any) => {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });
      if (!res.ok) throw new Error("No se pudo crear el ticket");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
  });
}

// Hook para actualizar el estado de un ticket
export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...changes }: { id: number; status: string }) => {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error("No se pudo actualizar el ticket");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
  });
}

// Hook para eliminar un ticket
export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar el ticket");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
  });
}
