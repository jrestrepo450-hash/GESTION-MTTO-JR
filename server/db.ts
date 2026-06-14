import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
// Forzamos un objeto vacío simulado para que no intente abrir sockets de red
export const pool = { connect: () => Promise.resolve(), query: () => Promise.resolve() };
export const db = drizzle(pool as any, { schema });