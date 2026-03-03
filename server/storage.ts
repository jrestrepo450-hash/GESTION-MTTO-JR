import { db } from "./db";
import {
  rooms, messages,
  type Room, type InsertRoom,
  type Message, type InsertMessage
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getRooms(): Promise<Room[]>;
  getRoom(roomNumber: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, updates: Partial<InsertRoom>): Promise<Room>;
  deleteRoom(id: number): Promise<void>;

  getMessages(roomNumber: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async getRoom(roomNumber: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.roomNumber, roomNumber));
    return room;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [created] = await db.insert(rooms).values(room).returning();
    return created;
  }

  async updateRoom(id: number, updates: Partial<InsertRoom>): Promise<Room> {
    const [updated] = await db.update(rooms)
      .set(updates)
      .where(eq(rooms.id, id))
      .returning();
    return updated;
  }

  async deleteRoom(id: number): Promise<void> {
    await db.delete(rooms).where(eq(rooms.id, id));
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
