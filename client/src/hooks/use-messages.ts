import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Message, InsertMessage } from "@shared/schema";

export function useMessages(spaceCode: string) {
  return useQuery<Message[]>({
    queryKey: [buildUrl(api.messages.list.path, { spaceCode })],
    enabled: !!spaceCode,
    refetchInterval: 5000, // poll every 5 seconds for real-time feel
  });
}

export function useCreateMessage() {
  return useMutation({
    mutationFn: async (message: InsertMessage) => {
      const res = await apiRequest("POST", api.messages.create.path, message);
      return res.json();
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.messages.list.path, { spaceCode: v.spaceCode })] });
    },
  });
}
