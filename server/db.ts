import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

// Forzamos a que siempre use el archivo local.db de SQLite
const sqlite = new Database('local.db');
export const db = drizzle(sqlite, { schema });