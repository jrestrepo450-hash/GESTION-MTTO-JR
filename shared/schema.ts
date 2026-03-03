import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const guests = pgTable("guests", {
  id: serial("id").primaryKey(),
  roomNumber: text("room_number").notNull().unique(),
  name: text("name").notNull(),
  documentId: text("document_id"),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  notes: text("notes"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomNumber: text("room_number").notNull(),
  content: text("content").notNull(),
  sender: text("sender").notNull(),
  receivedAt: timestamp("received_at").defaultNow(),
});

export const insertGuestSchema = createInsertSchema(guests).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, receivedAt: true });

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
