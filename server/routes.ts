import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Guests endpoints
  app.get(api.guests.list.path, async (req, res) => {
    const guestsList = await storage.getGuests();
    res.json(guestsList);
  });

  app.get(api.guests.get.path, async (req, res) => {
    const guest = await storage.getGuest(req.params.roomNumber);
    if (!guest) {
      return res.status(404).json({ message: "Guest not found" });
    }
    res.json(guest);
  });

  app.post(api.guests.create.path, async (req, res) => {
    try {
      // Coerce date inputs if they are strings
      const payload = { ...req.body };
      if (payload.checkIn) payload.checkIn = new Date(payload.checkIn);
      if (payload.checkOut) payload.checkOut = new Date(payload.checkOut);

      const input = api.guests.create.input.parse(payload);
      const guest = await storage.createGuest(input);
      res.status(201).json(guest);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.guests.update.path, async (req, res) => {
    try {
      const payload = { ...req.body };
      if (payload.checkIn) payload.checkIn = new Date(payload.checkIn);
      if (payload.checkOut) payload.checkOut = new Date(payload.checkOut);

      const input = api.guests.update.input.parse(payload);
      const guest = await storage.updateGuest(Number(req.params.id), input);
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }
      res.json(guest);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.guests.delete.path, async (req, res) => {
    try {
      await storage.deleteGuest(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Messages endpoints
  app.get(api.messages.list.path, async (req, res) => {
    const messagesList = await storage.getMessages(req.params.roomNumber);
    res.json(messagesList);
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const input = api.messages.create.input.parse(req.body);
      const message = await storage.createMessage(input);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Webhook for WhatsApp (Simulated endpoint for receiving actual messages from providers like Twilio or Meta)
  app.post('/api/webhook/whatsapp', async (req, res) => {
    try {
      // In a real scenario, this payload depends on the provider (e.g. Twilio or Meta WhatsApp API)
      // Here we assume a simplified payload for the example:
      // { from: 'whatsapp:+1234567890', body: 'Room 101: Need more towels' }
      
      const body = req.body;
      let roomNumber = 'UNKNOWN';
      let content = body.body || '';
      const sender = body.from || 'WhatsApp';

      // Very simple extraction: assume message starts with "Room XXX:" or we can extract the first number
      const match = content.match(/Room\s*(\w+)/i) || content.match(/Habitaci[oó]n\s*(\w+)/i);
      if (match && match[1]) {
        roomNumber = match[1];
      } else {
        // Fallback strategy or require a specific format
        const parts = content.split(':');
        if (parts.length > 1) {
          roomNumber = parts[0].trim();
          content = parts.slice(1).join(':').trim();
        }
      }

      const message = await storage.createMessage({
        roomNumber,
        content,
        sender
      });

      res.status(200).json({ success: true, message });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  // Seed database
  const existingGuests = await storage.getGuests();
  if (existingGuests.length === 0) {
    await storage.createGuest({
      roomNumber: "101",
      name: "Juan Pérez",
      documentId: "12345678",
      checkIn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      checkOut: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      notes: "VIP guest, needs extra pillows.",
    });

    await storage.createGuest({
      roomNumber: "102",
      name: "María Gómez",
      documentId: "87654321",
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: "Checking out early.",
    });

    await storage.createMessage({
      roomNumber: "101",
      sender: "+573001234567",
      content: "Hola, ¿podrían enviarme toallas adicionales a la habitación 101?",
    });

    await storage.createMessage({
      roomNumber: "101",
      sender: "Hotel",
      content: "Claro señor Juan, enseguida se las enviamos.",
    });
  }

  return httpServer;
}
