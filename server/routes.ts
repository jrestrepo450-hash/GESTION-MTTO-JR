import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `photo_${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo se permiten imágenes"));
  },
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── Spaces ────────────────────────────────────────────────────────────────
  app.get(api.spaces.list.path, async (req, res) => {
    res.json(await storage.getSpaces());
  });

  app.get(api.spaces.get.path, async (req, res) => {
    const s = await storage.getSpace(Number(req.params.id));
    if (!s) return res.status(404).json({ message: "Espacio no encontrado" });
    res.json(s);
  });

  app.post(api.spaces.create.path, async (req, res) => {
    try {
      const input = api.spaces.create.input.parse(req.body);
      res.status(201).json(await storage.createSpace(input));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error interno" });
    }
  });

  app.put(api.spaces.update.path, async (req, res) => {
    try {
      const input = api.spaces.update.input.parse(req.body);
      res.json(await storage.updateSpace(Number(req.params.id), input));
    } catch (err) {
      res.status(500).json({ message: "Error interno" });
    }
  });

  app.delete(api.spaces.delete.path, async (req, res) => {
    await storage.deleteSpace(Number(req.params.id));
    res.status(204).end();
  });

  // ── Space Items ───────────────────────────────────────────────────────────
  app.get(api.spaceItems.list.path, async (req, res) => {
    res.json(await storage.getSpaceItems(Number(req.params.spaceId)));
  });

  app.post(api.spaceItems.create.path, async (req, res) => {
    try {
      const body = { ...req.body, spaceId: Number(req.params.spaceId) };
      res.status(201).json(await storage.createSpaceItem(body));
    } catch (err) {
      res.status(500).json({ message: "Error interno" });
    }
  });

  app.put(api.spaceItems.update.path, async (req, res) => {
    try {
      res.json(await storage.updateSpaceItem(Number(req.params.id), req.body));
    } catch (err) {
      res.status(500).json({ message: "Error interno" });
    }
  });

  app.delete(api.spaceItems.delete.path, async (req, res) => {
    await storage.deleteSpaceItem(Number(req.params.id));
    res.status(204).end();
  });

  // ── WA Users ──────────────────────────────────────────────────────────────
  app.get(api.waUsers.list.path, async (req, res) => {
    res.json(await storage.getWaUsers());
  });

  app.post(api.waUsers.create.path, async (req, res) => {
    try {
      const input = api.waUsers.create.input.parse(req.body);
      res.status(201).json(await storage.createWaUser(input));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error interno" });
    }
  });

  app.put(api.waUsers.update.path, async (req, res) => {
    try {
      const input = api.waUsers.update.input.parse(req.body);
      res.json(await storage.updateWaUser(Number(req.params.id), input));
    } catch (err) {
      res.status(500).json({ message: "Error interno" });
    }
  });

  app.delete(api.waUsers.delete.path, async (req, res) => {
    await storage.deleteWaUser(Number(req.params.id));
    res.status(204).end();
  });

  // ── Tickets ───────────────────────────────────────────────────────────────
  app.get(api.tickets.list.path, async (req, res) => {
    const filters: any = {};
    if (req.query.spaceId) filters.spaceId = Number(req.query.spaceId);
    if (req.query.status) filters.status = String(req.query.status);
    res.json(await storage.getTickets(filters));
  });

  app.get(api.tickets.get.path, async (req, res) => {
    const t = await storage.getTicket(Number(req.params.id));
    if (!t) return res.status(404).json({ message: "Ticket no encontrado" });
    res.json(t);
  });

  app.post(api.tickets.create.path, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.spaceId) body.spaceId = Number(body.spaceId);
      if (body.itemId) body.itemId = Number(body.itemId) || null;
      if (body.assignedToId) body.assignedToId = Number(body.assignedToId) || null;
      if (body.createdById) body.createdById = Number(body.createdById) || null;
      res.status(201).json(await storage.createTicket(body));
    } catch (err) {
      res.status(500).json({ message: "Error interno" });
    }
  });

  app.put(api.tickets.update.path, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.spaceId) body.spaceId = Number(body.spaceId);
      if (body.itemId !== undefined) body.itemId = body.itemId ? Number(body.itemId) : null;
      if (body.assignedToId !== undefined) body.assignedToId = body.assignedToId ? Number(body.assignedToId) : null;
      res.json(await storage.updateTicket(Number(req.params.id), body));
    } catch (err) {
      res.status(500).json({ message: "Error interno" });
    }
  });

  app.delete(api.tickets.delete.path, async (req, res) => {
    await storage.deleteTicket(Number(req.params.id));
    res.status(204).end();
  });

  // ── Messages ──────────────────────────────────────────────────────────────
  app.get(api.messages.list.path, async (req, res) => {
    res.json(await storage.getMessages(req.params.spaceCode));
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const input = api.messages.create.input.parse(req.body);
      const message = await storage.createMessage(input);
      res.status(201).json(message);
    } catch (err) {
      res.status(500).json({ message: "Error interno" });
    }
  });

  // ── Photos ────────────────────────────────────────────────────────────────
  app.get("/api/spaces/:spaceId/photos", async (req, res) => {
    res.json(await storage.getSpacePhotos(Number(req.params.spaceId)));
  });

  app.post("/api/spaces/:spaceId/photos", upload.single("photo"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No se adjuntó imagen" });
      const space = await storage.getSpace(Number(req.params.spaceId));
      if (!space) return res.status(404).json({ message: "Espacio no encontrado" });

      const takenAt = req.body.takenAt ? new Date(req.body.takenAt) : new Date();
      const photo = await storage.createSpacePhoto({
        spaceId: space.id,
        spaceCode: space.code,
        filename: req.file.filename,
        caption: req.body.caption || null,
        takenAt,
        sender: req.body.sender || null,
      });
      res.status(201).json(photo);
    } catch (err) {
      console.error("Photo upload error:", err);
      res.status(500).json({ message: "Error al subir foto" });
    }
  });

  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const allPhotos = await storage.getAllPhotos();
      const photo = allPhotos.find(p => p.id === Number(req.params.id));
      if (photo) {
        const filePath = path.join(uploadsDir, photo.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await storage.deleteSpacePhoto(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Error al eliminar foto" });
    }
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  app.get("/api/stats/tickets", async (req, res) => {
    res.json(await storage.getTicketStats());
  });

  // ── WhatsApp Webhook ──────────────────────────────────────────────────────
  app.post("/api/webhook/whatsapp", async (req, res) => {
    try {
      const body = req.body;
      const content: string = body.body || body.text || "";
      const sender: string = body.from || body.sender || "WhatsApp";

      // Match space code at start: "101: message", "LOBBY: message", "Habitación 101: message"
      const codeMatch =
        content.match(/^(\w[\w-]*)\s*:/i) ||
        content.match(/Habitaci[oó]n\s+(\w+)/i) ||
        content.match(/Espacio\s+(\w+)/i);
      const spaceCode = codeMatch ? codeMatch[1].toUpperCase() : null;

      if (spaceCode) {
        const space = await storage.getSpaceByCode(spaceCode);
        if (space) {
          // Find or create the WA user
          const waUser = await storage.getWaUserByPhone(sender);

          await storage.createMessage({
            spaceCode,
            content,
            sender: waUser ? waUser.name : sender,
            isMaintenanceUpdate: false,
          });

          // Auto-create ticket if message contains keywords
          const low = content.toLowerCase();
          if (low.includes("pendiente") || low.includes("dañado") || low.includes("avería") || low.includes("falla")) {
            await storage.createTicket({
              spaceId: space.id,
              title: content.length > 80 ? content.slice(0, 80) + "…" : content,
              description: content,
              status: "pendiente",
              priority: "media",
              assignedToId: waUser?.id ?? null,
              createdById: waUser?.id ?? null,
            });
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).json({ success: false });
    }
  });

  // ── Seed ──────────────────────────────────────────────────────────────────
  const existingSpaces = await storage.getSpaces();
  if (existingSpaces.length === 0) {
    const h101 = await storage.createSpace({ code: "101", name: "Habitación 101", type: "habitacion", notes: "" });
    const h102 = await storage.createSpace({ code: "102", name: "Habitación 102", type: "habitacion", notes: "" });
    const lobby = await storage.createSpace({ code: "LOBBY", name: "Lobby Principal", type: "lobby", notes: "" });
    const cocina = await storage.createSpace({ code: "COCINA", name: "Cocina Central", type: "cocina", notes: "" });
    const sub = await storage.createSpace({ code: "SUB-1", name: "Subestación 1", type: "subestacion", notes: "" });

    await storage.createSpaceItem({ spaceId: h101.id, name: "Aire acondicionado", status: "ok", notes: "" });
    await storage.createSpaceItem({ spaceId: h101.id, name: "TV 55\"", status: "mantenimiento", notes: "Pantalla con líneas" });
    await storage.createSpaceItem({ spaceId: h101.id, name: "Cama King", status: "ok", notes: "" });
    await storage.createSpaceItem({ spaceId: h101.id, name: "Detector de humo", status: "ok", notes: "" });
    await storage.createSpaceItem({ spaceId: h102.id, name: "Aire acondicionado", status: "ok", notes: "" });
    await storage.createSpaceItem({ spaceId: h102.id, name: "Vidrio baño", status: "fuera_de_servicio", notes: "Roto" });
    await storage.createSpaceItem({ spaceId: lobby.id, name: "Luces LED", status: "ok", notes: "" });
    await storage.createSpaceItem({ spaceId: lobby.id, name: "Pintura paredes", status: "mantenimiento", notes: "Manchas" });
    await storage.createSpaceItem({ spaceId: sub.id, name: "Transformador principal", status: "ok", notes: "" });
    await storage.createSpaceItem({ spaceId: sub.id, name: "UPS respaldo", status: "ok", notes: "" });

    const u1 = await storage.createWaUser({ name: "Carlos Técnico", phone: "+573001234567", role: "tecnico", active: true });
    const u2 = await storage.createWaUser({ name: "Ana Supervisora", phone: "+573009876543", role: "supervisor", active: true });

    await storage.createTicket({ spaceId: h101.id, title: "TV con pantalla dañada", description: "Pantalla tiene líneas horizontales visibles", status: "pendiente", priority: "alta", assignedToId: u1.id, createdById: u2.id });
    await storage.createTicket({ spaceId: h102.id, title: "Vidrio de baño roto", description: "Vidrio de mampara en baño está roto, riesgo de seguridad", status: "en_progreso", priority: "urgente", assignedToId: u1.id, createdById: u2.id });
    await storage.createTicket({ spaceId: lobby.id, title: "Manchas en paredes lobby", description: "Manchas de humedad en pared norte del lobby", status: "pendiente", priority: "media", assignedToId: null, createdById: u2.id });

    await storage.createMessage({ spaceCode: "101", content: "Habitación 101: TV tiene líneas en pantalla", sender: "Carlos Técnico", isMaintenanceUpdate: true });
    await storage.createMessage({ spaceCode: "101", content: "Revisado, se necesita reemplazo del panel", sender: "Ana Supervisora", isMaintenanceUpdate: false });
  }

  return httpServer;
}
