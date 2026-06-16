import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

// Mantenemos la ruta del disco C que sí funcionó
const dbPath = 'C:/gestion-mtto.db';
const sqlite = new Database(dbPath);

// --- EL MAPA COMPLETO PARA MATAR EL PATRÓN ---
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS spaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT,
    type TEXT,
    status TEXT DEFAULT 'active',
    description TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

export const db = drizzle(sqlite, { schema });
console.log("🔥 Conectado a:", dbPath);