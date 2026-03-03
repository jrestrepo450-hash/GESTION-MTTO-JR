import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.rooms.list.path, async (req, res) => {
    const roomsList = await storage.getRooms();
    res.json(roomsList);
  });

  app.get(api.rooms.get.path, async (req, res) => {
    const room = await storage.getRoom(req.params.roomNumber);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });

  app.post(api.rooms.create.path, async (req, res) => {
    try {
      const input = api.rooms.create.input.parse(req.body);
      const room = await storage.createRoom(input);
      res.status(201).json(room);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.rooms.update.path, async (req, res) => {
    try {
      const input = api.rooms.update.input.parse(req.body);
      const room = await storage.updateRoom(Number(req.params.id), input);
      res.json(room);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.rooms.delete.path, async (req, res) => {
    try {
      await storage.deleteRoom(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.messages.list.path, async (req, res) => {
    const messagesList = await storage.getMessages(req.params.roomNumber);
    res.json(messagesList);
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const input = api.messages.create.input.parse(req.body);
      const content = input.content.toLowerCase();
      const room = await storage.getRoom(input.roomNumber);
      
      if (room) {
        const updates: any = {};
        if (content.includes("energía") || content.includes("luz")) updates.energyStatus = content.includes("ok") ? "ok" : "mantenimiento";
        if (content.includes("aire") || content.includes("ac")) updates.acStatus = content.includes("ok") ? "ok" : "mantenimiento";
        if (content.includes("humo") || content.includes("detector")) updates.smokeDetectorStatus = content.includes("ok") ? "ok" : "mantenimiento";
        if (content.includes("pintura")) updates.paintStatus = content.includes("ok") ? "ok" : "mantenimiento";
        
        if (Object.keys(updates).length > 0) {
          await storage.updateRoom(room.id, updates);
          input.isMaintenanceUpdate = true;
        }
      }

      const message = await storage.createMessage(input);
      res.status(201).json(message);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Webhook for WhatsApp
  app.post('/api/webhook/whatsapp', async (req, res) => {
    const body = req.body;
    let content = body.body || '';
    const sender = body.from || 'WhatsApp';
    
    const match = content.match(/Room\s*(\w+)/i) || content.match(/Habitaci[oó]n\s*(\w+)/i) || content.match(/^(\d+)/);
    const roomNumber = match ? match[1] : 'UNKNOWN';

    if (roomNumber !== 'UNKNOWN') {
      const room = await storage.getRoom(roomNumber);
      const updates: any = {};
      const lowContent = content.toLowerCase();
      
      if (lowContent.includes("energía")) updates.energyStatus = lowContent.includes("ok") ? "ok" : "mantenimiento";
      if (lowContent.includes("aire")) updates.acStatus = lowContent.includes("ok") ? "ok" : "mantenimiento";
      if (lowContent.includes("humo")) updates.smokeDetectorStatus = lowContent.includes("ok") ? "ok" : "mantenimiento";
      if (lowContent.includes("pintura")) updates.paintStatus = lowContent.includes("ok") ? "ok" : "mantenimiento";

      if (room && Object.keys(updates).length > 0) {
        await storage.updateRoom(room.id, updates);
      }

      await storage.createMessage({
        roomNumber,
        content,
        sender,
        isMaintenanceUpdate: Object.keys(updates).length > 0
      });
    }

    res.status(200).json({ success: true });
  });

  // Seed initial rooms
  const existingRooms = await storage.getRooms();
  if (existingRooms.length === 0) {
    await storage.createRoom({
      roomNumber: "101",
      name: "Técnico de Turno",
      energyStatus: "ok",
      acStatus: "mantenimiento",
      smokeDetectorStatus: "ok",
      paintStatus: "ok",
      notes: "Aire acondicionado requiere cambio de filtro.",
    });
    await storage.createRoom({
      roomNumber: "102",
      name: "Mantenimiento General",
      energyStatus: "ok",
      acStatus: "ok",
      smokeDetectorStatus: "mantenimiento",
      paintStatus: "ok",
      notes: "Detector de humo en revisión.",
    });
  }

  return httpServer;
}
