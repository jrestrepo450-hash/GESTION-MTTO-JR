import { db } from "./db";
import {
  guests, messages,
  type Guest, type InsertGuest,
  type Message, type InsertMessage
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getGuests(): Promise<Guest[]>;
  getGuest(roomNumber: string): Promise<Guest | undefined>;
  createGuest(guest: InsertGuest): Promise<Guest>;
  updateGuest(id: number, updates: Partial<InsertGuest>): Promise<Guest>;
  deleteGuest(id: number): Promise<void>;

  getMessages(roomNumber: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getGuests(): Promise<Guest[]> {
    return await db.select().from(guests);
  }

  async getGuest(roomNumber: string): Promise<Guest | undefined> {
    const [guest] = await db.select().from(guests).where(eq(guests.roomNumber, roomNumber));
    return guest;
  }

  async createGuest(guest: InsertGuest): Promise<Guest> {
    const [created] = await db.insert(guests).values(guest).returning();
    return created;
  }

  async updateGuest(id: number, updates: Partial<InsertGuest>): Promise<Guest> {
    const [updated] = await db.update(guests)
      .set(updates)
      .where(eq(guests.id, id))
      .returning();
    return updated;
  }

  async deleteGuest(id: number): Promise<void> {
    await db.delete(guests).where(eq(guests.id, id));
  }

  async getMessages(roomNumber: string): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.roomNumber, roomNumber))
      .orderBy(desc(messages.receivedAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
