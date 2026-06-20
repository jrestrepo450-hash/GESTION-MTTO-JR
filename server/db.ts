import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "../shared/schema";

const databaseUrl = (process.env.DATABASE_URL || "").replace(/"/g, "") || 
  "postgresql://neondb_owner:npg_RQgs9Y5IAtuj@ep-snowy-dream-acxmdu7g-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Usamos postgres-js que acepta consultas tradicionales y plantillas por igual
const queryClient = postgres(databaseUrl);
export const db = drizzle(queryClient, { schema });

console.log("🚀 ¡Conectado con éxito a Neon usando el conector universal!");