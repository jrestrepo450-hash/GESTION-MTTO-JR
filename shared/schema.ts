import { pgTable, text, serial, timestamp, boolean, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const SPACE_TYPES = [
  "habitacion",
  "subestacion",
  "area_publica",
  "cocina",
  "restaurante",
  "lobby",
  "oficina",
  "bodega",
  "otro",
] as const;
export type SpaceType = typeof SPACE_TYPES[number];

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  habitacion: "Habitación",
  subestacion: "Subestación",
  area_publica: "Área Pública",
  cocina: "Cocina",
  restaurante: "Restaurante",
  lobby: "Lobby",
  oficina: "Oficina",
  bodega: "Bodega",
  otro: "Otro",
};

export const TICKET_STATUS = ["pendiente", "en_progreso", "resuelto"] as const;
export type TicketStatus = typeof TICKET_STATUS[number];

export const TICKET_PRIORITY = ["baja", "media", "alta", "urgente"] as const;
export type TicketPriority = typeof TICKET_PRIORITY[number];

// ─── Spaces ──────────────────────────────────────────────────────────────────
export const spaces = pgTable("spaces", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g. "101", "LOBBY-1", "COCINA"
  name: text("name").notNull(),
  type: text("type").notNull().default("habitacion"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Space Items ──────────────────────────────────────────────────────────────
export const spaceItems = pgTable("space_items", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull().references(() => spaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "Aire acondicionado", "TV", "Cama"
  status: text("status").notNull().default("ok"), // "ok" | "mantenimiento" | "fuera_de_servicio"
  notes: text("notes"),
  lastChecked: timestamp("last_checked").defaultNow(),
});

// ─── WhatsApp Users ───────────────────────────────────────────────────────────
export const waUsers = pgTable("wa_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(), // WhatsApp phone number
  role: text("role").notNull().default("tecnico"), // "tecnico" | "supervisor" | "recepcion"
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Tickets / Pendientes ─────────────────────────────────────────────────────
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull().references(() => spaces.id, { onDelete: "cascade" }),
  itemId: integer("item_id").references(() => spaceItems.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pendiente"),
  priority: text("priority").notNull().default("media"),
  assignedToId: integer("assigned_to_id").references(() => waUsers.id, { onDelete: "set null" }),
  createdById: integer("created_by_id").references(() => waUsers.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  spaceCode: text("space_code").notNull(), // linked by space code
  content: text("content").notNull(),
  sender: text("sender").notNull(), // phone number or name
  isMaintenanceUpdate: boolean("is_maintenance_update").default(false),
  receivedAt: timestamp("received_at").defaultNow(),
});

// ─── Insert schemas ───────────────────────────────────────────────────────────
export const insertSpaceSchema = createInsertSchema(spaces).omit({ id: true, createdAt: true });
export const insertSpaceItemSchema = createInsertSchema(spaceItems).omit({ id: true, lastChecked: true });
export const insertWaUserSchema = createInsertSchema(waUsers).omit({ id: true, createdAt: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true, resolvedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, receivedAt: true });

// ─── Types ────────────────────────────────────────────────────────────────────
export type Space = typeof spaces.$inferSelect;
export type InsertSpace = z.infer<typeof insertSpaceSchema>;
export type SpaceItem = typeof spaceItems.$inferSelect;
export type InsertSpaceItem = z.infer<typeof insertSpaceItemSchema>;
export type WaUser = typeof waUsers.$inferSelect;
export type InsertWaUser = z.infer<typeof insertWaUserSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type TicketWithRelations = Ticket & {
  space?: Space;
  item?: SpaceItem | null;
  assignedTo?: WaUser | null;
  createdBy?: WaUser | null;
};

// ─── Space Photos ─────────────────────────────────────────────────────────────
export const spacePhotos = pgTable("space_photos", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull().references(() => spaces.id, { onDelete: "cascade" }),
  spaceCode: text("space_code").notNull(),
  filename: text("filename").notNull(),
  caption: text("caption"),
  takenAt: timestamp("taken_at").notNull(), // fecha de realización
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  sender: text("sender"), // who uploaded (WhatsApp user name/phone)
});

export const insertSpacePhotoSchema = createInsertSchema(spacePhotos).omit({ id: true, uploadedAt: true });
export type SpacePhoto = typeof spacePhotos.$inferSelect;
export type InsertSpacePhoto = z.infer<typeof insertSpacePhotoSchema>;

// ─── Energy Readings ──────────────────────────────────────────────────────────
export const ENERGY_TYPES = ["gas", "agua", "energia"] as const;
export type EnergyType = typeof ENERGY_TYPES[number];

export const ENERGY_LABELS: Record<EnergyType, string> = {
  gas: "Gas",
  agua: "Agua",
  energia: "Energía",
};

export const ENERGY_UNITS: Record<EnergyType, string> = {
  gas: "m³",
  agua: "m³",
  energia: "kWh",
};

export const ENERGY_CODES: Record<string, EnergyType> = {
  GAS: "gas",
  AGUA: "agua",
  ENERGIA: "energia",
  ENERGÍA: "energia",
};

export const energyReadings = pgTable("energy_readings", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "gas" | "agua" | "energia"
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  notes: text("notes"),
  sender: text("sender"),
  source: text("source").notNull().default("manual"), // "manual" | "whatsapp"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEnergyReadingSchema = createInsertSchema(energyReadings).omit({ id: true, createdAt: true });
export type EnergyReading = typeof energyReadings.$inferSelect;
export type InsertEnergyReading = z.infer<typeof insertEnergyReadingSchema>;

// ─── Preventive Maintenance Tasks ────────────────────────────────────────────
export const PREV_FREQ = ["semanal", "quincenal", "mensual", "trimestral", "semestral", "anual"] as const;
export type PrevFreq = typeof PREV_FREQ[number];

export const PREV_FREQ_DAYS: Record<PrevFreq, number> = {
  semanal: 7,
  quincenal: 15,
  mensual: 30,
  trimestral: 90,
  semestral: 180,
  anual: 365,
};

export const preventiveTasks = pgTable("preventive_tasks", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull().references(() => spaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull().default("mensual"), // PrevFreq
  lastDone: timestamp("last_done"),
  nextDue: timestamp("next_due").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPreventiveTaskSchema = createInsertSchema(preventiveTasks).omit({ id: true, createdAt: true });
export type PreventiveTask = typeof preventiveTasks.$inferSelect;
export type InsertPreventiveTask = z.infer<typeof insertPreventiveTaskSchema>;

export type PreventiveTaskWithSpace = PreventiveTask & { space?: Space };

// ─── Materials Inventory ──────────────────────────────────────────────────────
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull().default("unidad"), // "unidad", "m", "kg", "litro", etc.
  stock: real("stock").notNull().default(0),
  minStock: real("min_stock").notNull().default(0),
  location: text("location"), // where stored in hotel
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, createdAt: true });
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

// Materials used in a ticket
export const ticketMaterials = pgTable("ticket_materials", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  materialId: integer("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  quantity: real("quantity").notNull(),
  notes: text("notes"),
  usedAt: timestamp("used_at").defaultNow(),
});

export const insertTicketMaterialSchema = createInsertSchema(ticketMaterials).omit({ id: true, usedAt: true });
export type TicketMaterial = typeof ticketMaterials.$inferSelect;
export type InsertTicketMaterial = z.infer<typeof insertTicketMaterialSchema>;

export type TicketMaterialWithDetails = TicketMaterial & {
  material?: Material;
};

// ─── Pool Maintenance ─────────────────────────────────────────────────────────
export const poolConfigs = pgTable("pool_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("Piscina Principal"),
  volumeM3: real("volume_m3").notNull().default(100), // pool volume in m³
  type: text("type").notNull().default("exterior"), // "interior" | "exterior"
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPoolConfigSchema = createInsertSchema(poolConfigs).omit({ id: true, updatedAt: true });
export type PoolConfig = typeof poolConfigs.$inferSelect;
export type InsertPoolConfig = z.infer<typeof insertPoolConfigSchema>;

// Chemical readings log
export const poolReadings = pgTable("pool_readings", {
  id: serial("id").primaryKey(),
  poolId: integer("pool_id").notNull().references(() => poolConfigs.id, { onDelete: "cascade" }),
  readingDate: timestamp("reading_date").notNull().defaultNow(),
  ph: real("ph"),                          // ideal 7.2–7.6
  freeChlorine: real("free_chlorine"),    // ppm, ideal 0.5–1.5
  totalAlkalinity: real("total_alkalinity"), // ppm, ideal 80–120
  calciumHardness: real("calcium_hardness"), // ppm, ideal 200–400
  cyanuricAcid: real("cyanuric_acid"),    // ppm, ideal 30–50 (exterior)
  temperature: real("temperature"),       // °C
  turbidity: text("turbidity"),           // "clara" | "turbia" | "muy_turbia"
  notes: text("notes"),
  technician: text("technician"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPoolReadingSchema = createInsertSchema(poolReadings).omit({ id: true, createdAt: true });
export type PoolReading = typeof poolReadings.$inferSelect;
export type InsertPoolReading = z.infer<typeof insertPoolReadingSchema>;

// Pool parameter ideal ranges and labels
export const POOL_PARAMS = {
  ph:               { label: "pH",                   unit: "",     min: 7.2,  max: 7.6,  warn: 0.2 },
  freeChlorine:     { label: "Cloro libre",           unit: "ppm",  min: 0.5,  max: 1.5,  warn: 0.5 },
  totalAlkalinity:  { label: "Alcalinidad total",     unit: "ppm",  min: 80,   max: 120,  warn: 20  },
  calciumHardness:  { label: "Dureza cálcica",        unit: "ppm",  min: 200,  max: 400,  warn: 50  },
  cyanuricAcid:     { label: "Ácido isocianúrico",    unit: "ppm",  min: 30,   max: 50,   warn: 10  },
  temperature:      { label: "Temperatura",           unit: "°C",   min: 24,   max: 30,   warn: 2   },
} as const;

export type PoolParamKey = keyof typeof POOL_PARAMS;
