import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

const dbPath = 'C:/gestion-mtto.db';
const sqlite = new Database(dbPath);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS spaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT,
    type TEXT,
    status TEXT DEFAULT 'active',
    description TEXT,
    notes TEXT
  );
`);

export const db = drizzle(sqlite, { schema });
console.log("🔥 BASE DE DATOS CONFIGURADA EN C:/");