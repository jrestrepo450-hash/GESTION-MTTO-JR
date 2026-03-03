import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomNumber: text("room_number").notNull().unique(),
  name: text("name").notNull(), // Responsible person or Current Guest
  
  // Maintenance Fields
  energyStatus: text("energy_status").default("ok"), // e.g., "ok", "issue", "maintenance"
  acStatus: text("ac_status").default("ok"),
  smokeDetectorStatus: text("smoke_detector_status").default("ok"),
  paintStatus: text("paint_status").default("ok"),
  
  lastMaintenance: timestamp("last_maintenance").defaultNow(),
  notes: text("notes"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomNumber: text("room_number").notNull(),
  content: text("content").notNull(),
  sender: text("sender").notNull(),
  isMaintenanceUpdate: boolean("is_maintenance_update").default(false),
  receivedAt: timestamp("received_at").defaultNow(),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true, lastMaintenance: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, receivedAt: true });

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
