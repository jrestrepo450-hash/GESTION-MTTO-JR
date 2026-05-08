import { z } from "zod";
import {
  insertSpaceSchema,
  insertSpaceItemSchema,
  insertWaUserSchema,
  insertTicketSchema,
  insertMessageSchema,
  spaces, spaceItems, waUsers, tickets, messages,
} from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  spaces: {
    list:   { method: "GET" as const,    path: "/api/spaces" as const },
    get:    { method: "GET" as const,    path: "/api/spaces/:id" as const },
    create: { method: "POST" as const,   path: "/api/spaces" as const, input: insertSpaceSchema },
    update: { method: "PUT" as const,    path: "/api/spaces/:id" as const, input: insertSpaceSchema.partial() },
    delete: { method: "DELETE" as const, path: "/api/spaces/:id" as const },
  },
  spaceItems: {
    list:   { method: "GET" as const,    path: "/api/spaces/:spaceId/items" as const },
    create: { method: "POST" as const,   path: "/api/spaces/:spaceId/items" as const, input: insertSpaceItemSchema.omit({ spaceId: true }) },
    update: { method: "PUT" as const,    path: "/api/space-items/:id" as const, input: insertSpaceItemSchema.partial() },
    delete: { method: "DELETE" as const, path: "/api/space-items/:id" as const },
  },
  waUsers: {
    list:   { method: "GET" as const,    path: "/api/wa-users" as const },
    create: { method: "POST" as const,   path: "/api/wa-users" as const, input: insertWaUserSchema },
    update: { method: "PUT" as const,    path: "/api/wa-users/:id" as const, input: insertWaUserSchema.partial() },
    delete: { method: "DELETE" as const, path: "/api/wa-users/:id" as const },
  },
  tickets: {
    list:   { method: "GET" as const,    path: "/api/tickets" as const },
    get:    { method: "GET" as const,    path: "/api/tickets/:id" as const },
    create: { method: "POST" as const,   path: "/api/tickets" as const, input: insertTicketSchema },
    update: { method: "PUT" as const,    path: "/api/tickets/:id" as const, input: insertTicketSchema.partial() },
    delete: { method: "DELETE" as const, path: "/api/tickets/:id" as const },
  },
  messages: {
    list:   { method: "GET" as const, path: "/api/messages/:spaceCode" as const },
    create: { method: "POST" as const, path: "/api/messages" as const, input: insertMessageSchema },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
