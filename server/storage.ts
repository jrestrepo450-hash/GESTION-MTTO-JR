import { db } from "./db";
import {
  spaces, spaceItems, waUsers, tickets, messages, spacePhotos, energyReadings,
  type Space, type InsertSpace,
  type SpaceItem, type InsertSpaceItem,
  type WaUser, type InsertWaUser,
  type Ticket, type InsertTicket, type TicketWithRelations,
  type Message, type InsertMessage,
  type SpacePhoto, type InsertSpacePhoto,
  type EnergyReading, type InsertEnergyReading,
} from "@shared/schema";
import { eq, desc, asc, and } from "drizzle-orm";

export interface IStorage {
  // Spaces
  getSpaces(): Promise<Space[]>;
  getSpace(id: number): Promise<Space | undefined>;
  getSpaceByCode(code: string): Promise<Space | undefined>;
  createSpace(space: InsertSpace): Promise<Space>;
  updateSpace(id: number, updates: Partial<InsertSpace>): Promise<Space>;
  deleteSpace(id: number): Promise<void>;

  // Space Items
  getSpaceItems(spaceId: number): Promise<SpaceItem[]>;
  createSpaceItem(item: InsertSpaceItem): Promise<SpaceItem>;
  updateSpaceItem(id: number, updates: Partial<InsertSpaceItem>): Promise<SpaceItem>;
  deleteSpaceItem(id: number): Promise<void>;

  // WA Users
  getWaUsers(): Promise<WaUser[]>;
  getWaUserByPhone(phone: string): Promise<WaUser | undefined>;
  createWaUser(user: InsertWaUser): Promise<WaUser>;
  updateWaUser(id: number, updates: Partial<InsertWaUser>): Promise<WaUser>;
  deleteWaUser(id: number): Promise<void>;

  // Tickets
  getTickets(filters?: { spaceId?: number; status?: string }): Promise<TicketWithRelations[]>;
  getTicket(id: number): Promise<TicketWithRelations | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<InsertTicket>): Promise<Ticket>;
  deleteTicket(id: number): Promise<void>;

  // Messages
  getMessages(spaceCode: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Photos
  getSpacePhotos(spaceId: number): Promise<SpacePhoto[]>;
  getAllPhotos(): Promise<SpacePhoto[]>;
  createSpacePhoto(photo: InsertSpacePhoto): Promise<SpacePhoto>;
  deleteSpacePhoto(id: number): Promise<void>;

  // Energy Readings
  getEnergyReadings(filters?: { type?: string; year?: number }): Promise<EnergyReading[]>;
  createEnergyReading(reading: InsertEnergyReading): Promise<EnergyReading>;
  deleteEnergyReading(id: number): Promise<void>;

  // Stats
  getTicketStats(): Promise<{ title: string; count: number; spaceId: number; spaceName: string }[]>;
}

export class DatabaseStorage implements IStorage {
  // ── Spaces ──────────────────────────────────────────────
  async getSpaces(): Promise<Space[]> {
    return db.select().from(spaces).orderBy(asc(spaces.code));
  }
  async getSpace(id: number): Promise<Space | undefined> {
    const [s] = await db.select().from(spaces).where(eq(spaces.id, id));
    return s;
  }
  async getSpaceByCode(code: string): Promise<Space | undefined> {
    const [s] = await db.select().from(spaces).where(eq(spaces.code, code));
    return s;
  }
  async createSpace(space: InsertSpace): Promise<Space> {
    const [s] = await db.insert(spaces).values(space).returning();
    return s;
  }
  async updateSpace(id: number, updates: Partial<InsertSpace>): Promise<Space> {
    const [s] = await db.update(spaces).set(updates).where(eq(spaces.id, id)).returning();
    return s;
  }
  async deleteSpace(id: number): Promise<void> {
    await db.delete(spaces).where(eq(spaces.id, id));
  }

  // ── Space Items ──────────────────────────────────────────
  async getSpaceItems(spaceId: number): Promise<SpaceItem[]> {
    return db.select().from(spaceItems).where(eq(spaceItems.spaceId, spaceId));
  }
  async createSpaceItem(item: InsertSpaceItem): Promise<SpaceItem> {
    const [i] = await db.insert(spaceItems).values(item).returning();
    return i;
  }
  async updateSpaceItem(id: number, updates: Partial<InsertSpaceItem>): Promise<SpaceItem> {
    const [i] = await db.update(spaceItems).set({ ...updates, lastChecked: new Date() }).where(eq(spaceItems.id, id)).returning();
    return i;
  }
  async deleteSpaceItem(id: number): Promise<void> {
    await db.delete(spaceItems).where(eq(spaceItems.id, id));
  }

  // ── WA Users ────────────────────────────────────────────
  async getWaUsers(): Promise<WaUser[]> {
    return db.select().from(waUsers).orderBy(asc(waUsers.name));
  }
  async getWaUserByPhone(phone: string): Promise<WaUser | undefined> {
    const [u] = await db.select().from(waUsers).where(eq(waUsers.phone, phone));
    return u;
  }
  async createWaUser(user: InsertWaUser): Promise<WaUser> {
    const [u] = await db.insert(waUsers).values(user).returning();
    return u;
  }
  async updateWaUser(id: number, updates: Partial<InsertWaUser>): Promise<WaUser> {
    const [u] = await db.update(waUsers).set(updates).where(eq(waUsers.id, id)).returning();
    return u;
  }
  async deleteWaUser(id: number): Promise<void> {
    await db.delete(waUsers).where(eq(waUsers.id, id));
  }

  // ── Tickets ─────────────────────────────────────────────
  async getTickets(filters?: { spaceId?: number; status?: string }): Promise<TicketWithRelations[]> {
    const rows = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    const result: TicketWithRelations[] = [];
    for (const t of rows) {
      if (filters?.spaceId && t.spaceId !== filters.spaceId) continue;
      if (filters?.status && t.status !== filters.status) continue;
      const [space] = await db.select().from(spaces).where(eq(spaces.id, t.spaceId));
      const item = t.itemId ? (await db.select().from(spaceItems).where(eq(spaceItems.id, t.itemId)))[0] ?? null : null;
      const assignedTo = t.assignedToId ? (await db.select().from(waUsers).where(eq(waUsers.id, t.assignedToId)))[0] ?? null : null;
      const createdBy = t.createdById ? (await db.select().from(waUsers).where(eq(waUsers.id, t.createdById)))[0] ?? null : null;
      result.push({ ...t, space, item, assignedTo, createdBy });
    }
    return result;
  }
  async getTicket(id: number): Promise<TicketWithRelations | undefined> {
    const [t] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!t) return undefined;
    const [space] = await db.select().from(spaces).where(eq(spaces.id, t.spaceId));
    const item = t.itemId ? (await db.select().from(spaceItems).where(eq(spaceItems.id, t.itemId)))[0] ?? null : null;
    const assignedTo = t.assignedToId ? (await db.select().from(waUsers).where(eq(waUsers.id, t.assignedToId)))[0] ?? null : null;
    const createdBy = t.createdById ? (await db.select().from(waUsers).where(eq(waUsers.id, t.createdById)))[0] ?? null : null;
    return { ...t, space, item, assignedTo, createdBy };
  }
  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [t] = await db.insert(tickets).values(ticket).returning();
    return t;
  }
  async updateTicket(id: number, updates: Partial<InsertTicket>): Promise<Ticket> {
    const extra: any = {};
    if (updates.status === "resuelto") extra.resolvedAt = new Date();
    const [t] = await db.update(tickets).set({ ...updates, ...extra }).where(eq(tickets.id, id)).returning();
    return t;
  }
  async deleteTicket(id: number): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  // ── Messages ─────────────────────────────────────────────
  async getMessages(spaceCode: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.spaceCode, spaceCode)).orderBy(asc(messages.receivedAt));
  }
  async createMessage(message: InsertMessage): Promise<Message> {
    const [m] = await db.insert(messages).values(message).returning();
    return m;
  }

  // ── Photos ───────────────────────────────────────────────
  async getSpacePhotos(spaceId: number): Promise<SpacePhoto[]> {
    return db.select().from(spacePhotos).where(eq(spacePhotos.spaceId, spaceId)).orderBy(desc(spacePhotos.takenAt));
  }
  async getAllPhotos(): Promise<SpacePhoto[]> {
    return db.select().from(spacePhotos).orderBy(desc(spacePhotos.takenAt));
  }
  async createSpacePhoto(photo: InsertSpacePhoto): Promise<SpacePhoto> {
    const [p] = await db.insert(spacePhotos).values(photo).returning();
    return p;
  }
  async deleteSpacePhoto(id: number): Promise<void> {
    await db.delete(spacePhotos).where(eq(spacePhotos.id, id));
  }

  // ── Energy Readings ──────────────────────────────────────
  async getEnergyReadings(filters?: { type?: string; year?: number }): Promise<EnergyReading[]> {
    let query = db.select().from(energyReadings);
    const conditions = [];
    if (filters?.type) conditions.push(eq(energyReadings.type, filters.type));
    if (filters?.year) conditions.push(eq(energyReadings.year, filters.year));
    if (conditions.length > 0) {
      return db.select().from(energyReadings).where(and(...conditions)).orderBy(desc(energyReadings.year), desc(energyReadings.month));
    }
    return db.select().from(energyReadings).orderBy(desc(energyReadings.year), desc(energyReadings.month));
  }
  async createEnergyReading(reading: InsertEnergyReading): Promise<EnergyReading> {
    const [r] = await db.insert(energyReadings).values(reading).returning();
    return r;
  }
  async deleteEnergyReading(id: number): Promise<void> {
    await db.delete(energyReadings).where(eq(energyReadings.id, id));
  }

  // ── Stats ────────────────────────────────────────────────
  async getTicketStats(): Promise<{ title: string; count: number; spaceId: number; spaceName: string }[]> {
    const allTickets = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    const allSpaces = await db.select().from(spaces);
    const spaceMap = new Map(allSpaces.map(s => [s.id, s.name]));

    // Group by title (normalized) + spaceId
    const map = new Map<string, { title: string; count: number; spaceId: number; spaceName: string }>();
    for (const t of allTickets) {
      // Normalize: lowercase, trim
      const key = `${t.spaceId}::${t.title.toLowerCase().trim()}`;
      if (map.has(key)) {
        map.get(key)!.count++;
      } else {
        map.set(key, {
          title: t.title,
          count: 1,
          spaceId: t.spaceId,
          spaceName: spaceMap.get(t.spaceId) ?? "Desconocido",
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }
}

export const storage = new DatabaseStorage();
