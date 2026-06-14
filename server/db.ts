import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Simulación de pool compatible para saltarse el sistema de red viejo
export const pool = { 
  connect: () => Promise.resolve(), 
  query: () => Promise.resolve({ rows: [] }) 
};
export const db = drizzle(pool as any, { schema });