import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';

// Obligamos a que use la raíz de C para evitar bloqueos de OneDrive
const dbPath = 'C:/gestion-mtto.db';
const sqlite = new Database(dbPath);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS spaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT,
    type TEXT,
    status TEXT DEFAULT 'active',
    description TEXT
  );
`);

export const db = drizzle(sqlite, { schema });
console.log("🔥 Conectado a:", dbPath);