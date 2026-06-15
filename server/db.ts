import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

// Esto crea automáticamente un archivo físico llamado 'local.db' en tu proyecto
const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite, { schema });