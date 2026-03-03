import { z } from 'zod';
import { insertGuestSchema, insertMessageSchema, guests, messages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  guests: {
    list: {
      method: 'GET' as const,
      path: '/api/guests' as const,
      responses: {
        200: z.array(z.custom<typeof guests.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/guests/:roomNumber' as const,
      responses: {
        200: z.custom<typeof guests.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/guests' as const,
      input: insertGuestSchema,
      responses: {
        201: z.custom<typeof guests.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/guests/:id' as const,
      input: insertGuestSchema.partial(),
      responses: {
        200: z.custom<typeof guests.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/guests/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages/:roomNumber' as const,
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/messages' as const,
      input: insertMessageSchema,
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type GuestResponse = z.infer<typeof api.guests.list.responses[200]>;
export type MessageResponse = z.infer<typeof api.messages.list.responses[200]>;
