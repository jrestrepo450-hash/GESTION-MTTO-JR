import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

// Usamos de manera fija el archivo donde Drizzle guarda los datos
const sqlite = new Database('local.db');
export const db = drizzle(sqlite, { schema });