import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be a neon postgres connection string");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
console.log("🚀 ¡Conectado con éxito a la base de datos de Neon en Internet!");