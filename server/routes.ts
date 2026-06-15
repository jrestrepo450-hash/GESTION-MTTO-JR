import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import https from "https";
import http from "http";
import { db } from "./db";
import { spaces } from "@shared/schema";
import { eq } from "drizzle-orm";
// ── Helper: download image from URL (follows redirects) ───────────────────────
async function downloadImageFromUrl(imageUrl: string, destPath: string, maxRedirects = 8): Promise<void> {
  let currentUrl = imageUrl;
  for (let i = 0; i < maxRedirects; i++) {
    const result = await new Promise<{ redirect?: string; done?: true }>((resolve, reject) => {
      const proto = currentUrl.startsWith("https://") ? https : http;
      const req = proto.get(currentUrl, { headers: { "User-Agent": "HotelMtto/1.0" } }, (response) => {
        const status = response.statusCode ?? 0;
        if ([301, 302, 307, 308].includes(status) && response.headers.location) {
          response.resume();
          return resolve({ redirect: response.headers.location });
        }
        if (status !== 200) {
          response.resume();
          return reject(new Error(`HTTP ${status} al descargar imagen desde ${currentUrl}`));
        }
        const file = fs.createWriteStream(destPath);
        response.pipe(file);
        file.on("finish", () => resolve({ done: true }));
        file.on("error", (err) => { if (fs.existsSync(destPath)) fs.unlinkSync(destPath); reject(err); });
      });
      req.on("error", reject);
    });
    if (result.done) return;
    if (result.redirect) { currentUrl = result.redirect; continue; }
  }
  throw new Error("Demasiadas redirecciones al descargar imagen");
}

// ── Helper: save base64 image ─────────────────────────────────────────────────
function saveBase64Image(base64: string, mimeType: string, destPath: string): void {
  const data = base64.replace(/^data:image\/\w+;base64,/, "");
  fs.writeFileSync(destPath, Buffer.from(data, "base64"));
}

// ── Helper: extract ext from mime type ───────────────────────────────────────
function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png",
    "image/webp": ".webp", "image/gif": ".gif", "image/heic": ".heic",
  };
  return map[mime?.toLowerCase()] || ".jpg";
}

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

  // --- Spaces
  app.get(api.spaces.list.path, async (req, res) => {
    try {
      // Consulta directa a SQLite para traer todos los espacios a la pantalla
      const allSpaces = await db.select().from(spaces);
      res.json(allSpaces);
    } catch (err) {
      console.error("Error al obtener espacios:", err);
      res.status(500).json({ message: "Error al obtener espacios de SQLite" });
    }
  });

  app.get(api.spaces.get.path, async (req, res) => {
    try {
      // Consulta directa a SQLite filtrando por el ID
      const s = await db.select().from(spaces).where(eq(spaces.id, Number(req.params.id)));
      if (s.length === 0) return res.status(404).json({ message: "Espacio no encontrado" });
      res.json(s[0]);
    } catch (err) {
      console.error("Error al buscar espacio:", err);
      res.status(500).json({ message: "Error al buscar espacio en SQLite" });
    }
  });

  app.post(api.spaces.create.path, async (req, res) => {
    try {
      const input = api.spaces.create.input.parse(req.body);
      
      const [newSpace] = await db.insert(spaces).values({
        code: input.code,
        name: input.name,
        type: input.type || "habitacion",
        notes: input.notes || ""
      }).returning();

      res.status(201).json(newSpace);
    } catch (err) {
      console.error("Error al crear espacio:", err);
      res.status(500).json({ message: "Error interno al guardar en SQLite" });
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

      // 🛡️ Escudo protector: Traduce "vale" a "OK" y estandariza fuera de servicio
      if (body.status) {
        const currentStatus = body.status.toLowerCase();
        if (currentStatus === "vale") {
          body.status = "OK";
        } else if (currentStatus === "fuera de servicio" || currentStatus === "fuera_de_servicio") {
          body.status = "fuera_de_servicio";
        }
      }

      res.status(201).json(await storage.createSpaceItem(body));
    } catch (err) {
      res.status(500).json({ message: "Error interno" });
    }
  });

 app.put(api.spaceItems.update.path, async (req, res) => {
    try {
      const body = { ...req.body };

      // 🛡️ Escudo protector al editar un equipo
      if (body.status) {
        const currentStatus = body.status.toLowerCase();
        if (currentStatus === "vale") {
          body.status = "OK";
        } else if (currentStatus === "fuera de servicio" || currentStatus === "fuera_de_servicio") {
          body.status = "fuera_de_servicio";
        }
      }

      res.json(await storage.updateSpaceItem(Number(req.params.id), body));
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

  // ── Preventive Tasks ──────────────────────────────────────────────────────
  app.get("/api/preventive", async (req, res) => {
    res.json(await storage.getPreventiveTasks());
  });
  app.post("/api/preventive", async (req, res) => {
    try {
      const { insertPreventiveTaskSchema } = await import("@shared/schema");
      const data = insertPreventiveTaskSchema.parse({
        ...req.body,
        nextDue: new Date(req.body.nextDue),
        lastDone: req.body.lastDone ? new Date(req.body.lastDone) : null,
      });
      res.status(201).json(await storage.createPreventiveTask(data));
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.patch("/api/preventive/:id", async (req, res) => {
    try {
      const updates: any = { ...req.body };
      if (updates.nextDue) updates.nextDue = new Date(updates.nextDue);
      if (updates.lastDone) updates.lastDone = new Date(updates.lastDone);
      res.json(await storage.updatePreventiveTask(Number(req.params.id), updates));
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.post("/api/preventive/:id/done", async (req, res) => {
    try { res.json(await storage.markTaskDone(Number(req.params.id))); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/preventive/:id", async (req, res) => {
    await storage.deletePreventiveTask(Number(req.params.id));
    res.status(204).end();
  });

  // ── Materials ──────────────────────────────────────────────────────────────
  app.get("/api/materials", async (req, res) => {
    res.json(await storage.getMaterials());
  });
  app.post("/api/materials", async (req, res) => {
    try {
      const { insertMaterialSchema } = await import("@shared/schema");
      const data = insertMaterialSchema.parse(req.body);
      res.status(201).json(await storage.createMaterial(data));
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.patch("/api/materials/:id", async (req, res) => {
    try { res.json(await storage.updateMaterial(Number(req.params.id), req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/materials/:id", async (req, res) => {
    await storage.deleteMaterial(Number(req.params.id));
    res.status(204).end();
  });

  // ── Ticket Materials ───────────────────────────────────────────────────────
  app.get("/api/tickets/:id/materials", async (req, res) => {
    res.json(await storage.getTicketMaterials(Number(req.params.id)));
  });
  app.post("/api/tickets/:id/materials", async (req, res) => {
    try {
      const { insertTicketMaterialSchema } = await import("@shared/schema");
      const data = insertTicketMaterialSchema.parse({ ...req.body, ticketId: Number(req.params.id) });
      res.status(201).json(await storage.addTicketMaterial(data));
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/ticket-materials/:id", async (req, res) => {
    await storage.deleteTicketMaterial(Number(req.params.id));
    res.status(204).end();
  });

  // ── Pool ──────────────────────────────────────────────────────────────────
  app.get("/api/pool/config", async (req, res) => {
    res.json(await storage.getPoolConfig());
  });
  app.post("/api/pool/config", async (req, res) => {
    try { res.json(await storage.upsertPoolConfig(req.body)); }
    catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.get("/api/pool/readings", async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    res.json(await storage.getPoolReadings(limit));
  });
  app.post("/api/pool/readings", async (req, res) => {
    try {
      const { insertPoolReadingSchema } = await import("@shared/schema");
      const body = { ...req.body, readingDate: req.body.readingDate ? new Date(req.body.readingDate) : new Date() };
      // Ensure poolId exists — create default config if needed
      let poolId = body.poolId;
      if (!poolId) {
        const cfg = await storage.getPoolConfig() ?? await storage.upsertPoolConfig({});
        poolId = cfg.id;
      }
      const data = insertPoolReadingSchema.parse({ ...body, poolId });
      res.status(201).json(await storage.createPoolReading(data));
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });
  app.delete("/api/pool/readings/:id", async (req, res) => {
    await storage.deletePoolReading(Number(req.params.id));
    res.status(204).end();
  });

  // ── Search ─────────────────────────────────────────────────────────────────
  app.get("/api/search", async (req, res) => {
    const q = (req.query.q as string || "").toLowerCase().trim();
    if (!q || q.length < 2) return res.json({ spaces: [], tickets: [] });
    const allSpaces = await storage.getSpaces();
    const allTickets = await storage.getTickets();
    const spaces = allSpaces.filter(s =>
      s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.notes ?? "").toLowerCase().includes(q)
    ).slice(0, 5);
    const tickets = allTickets.filter(t =>
      t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)
    ).slice(0, 5);
    res.json({ spaces, tickets });
  });

  // ── Energy Readings ───────────────────────────────────────────────────────
  app.get("/api/energy", async (req, res) => {
    const { type, year } = req.query;
    const filters: { type?: string; year?: number } = {};
    if (type && typeof type === "string") filters.type = type;
    if (year && !isNaN(Number(year))) filters.year = Number(year);
    res.json(await storage.getEnergyReadings(Object.keys(filters).length ? filters : undefined));
  });

  app.post("/api/energy", async (req, res) => {
    try {
      const { insertEnergyReadingSchema } = await import("@shared/schema");
      const data = insertEnergyReadingSchema.parse(req.body);
      const reading = await storage.createEnergyReading(data);
      res.status(201).json(reading);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/energy/:id", async (req, res) => {
    try {
      await storage.deleteEnergyReading(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Error al eliminar lectura" });
    }
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  app.get("/api/stats/tickets", async (req, res) => {
    res.json(await storage.getTicketStats());
  });

  // ── WhatsApp Webhook ──────────────────────────────────────────────────────
  // Supports formats:
  //  Simple:  { from, body, mediaUrl?, mediaBase64?, mediaType?, caption? }
  //  WA API:  { entry:[{ changes:[{ value:{ messages:[{ type, from, timestamp, image:{url,caption,mime_type}, text:{body} }] }}] }] }
  app.post("/api/webhook/whatsapp", async (req, res) => {
    try {
      const body = req.body;

      // ── Normalize payload ─────────────────────────────────────────────────
      let sender = "";
      let content = "";
      let mediaUrl: string | null = null;
      let mediaBase64: string | null = null;
      let mediaType = "image/jpeg";
      let caption = "";
      let timestamp: Date = new Date();

      // WhatsApp Business API Cloud format
      if (body.entry && Array.isArray(body.entry)) {
        const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (!msg) { return res.status(200).json({ success: true }); }
        sender = msg.from || "";
        timestamp = msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date();
        if (msg.type === "image" && msg.image) {
          mediaUrl = msg.image.url || null;
          mediaType = msg.image.mime_type || "image/jpeg";
          caption = msg.image.caption || "";
          content = caption || "[Foto recibida]";
        } else if (msg.type === "text") {
          content = msg.text?.body || "";
        }
      } else {
        // Simple / direct format
        sender = body.from || body.sender || "WhatsApp";
        content = body.body || body.text || body.caption || "";
        mediaUrl = body.mediaUrl || body.imageUrl || null;
        mediaBase64 = body.mediaBase64 || null;
        mediaType = body.mediaType || body.mimeType || "image/jpeg";
        caption = body.caption || content;
      }

      // ── Detect energy reading (GAS / AGUA / ENERGIA) ─────────────────────
      const textToSearch = content || caption;
      const energyMatch = textToSearch.match(/^(GAS|AGUA|ENERG[IÍ]A)\s*:\s*([\d.,]+)\s*(m3|m³|kwh|kWh)?(?:\s+(.*))?$/i);
      if (energyMatch) {
        const { ENERGY_CODES, ENERGY_UNITS } = await import("@shared/schema");
        const rawType = energyMatch[1].toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normalizedKey = rawType === "ENERGIA" ? "ENERGIA" : rawType;
        const energyType = ENERGY_CODES[normalizedKey] ?? ENERGY_CODES[rawType];
        const rawValue = energyMatch[2].replace(",", ".");
        const value = parseFloat(rawValue);
        if (energyType && !isNaN(value)) {
          const now = new Date();
          const waUser = await storage.getWaUserByPhone(sender);
          const senderName = waUser ? waUser.name : sender;
          await storage.createEnergyReading({
            type: energyType,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            value,
            unit: ENERGY_UNITS[energyType],
            notes: energyMatch[4]?.trim() || null,
            sender: senderName,
            source: "whatsapp",
          });
          return res.status(200).json({
            success: true,
            energyType,
            value,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          });
        }
      }

      // ── Detect space code ─────────────────────────────────────────────────
      const codeMatch =
        textToSearch.match(/^(\w[\w\s-]*?)\s*:/i) ||
        textToSearch.match(/Habitaci[oó]n\s+(\w+)/i) ||
        textToSearch.match(/Espacio\s+(\w+)/i);
      const rawCode = codeMatch ? codeMatch[1].trim() : null;
      const spaceCode = rawCode ? rawCode.toUpperCase() : null;

      if (!spaceCode) {
        return res.status(200).json({ success: true, note: "No se detectó código de espacio" });
      }

      const space = await storage.getSpaceByCode(spaceCode);
      if (!space) {
        return res.status(200).json({ success: true, note: `Espacio ${spaceCode} no encontrado` });
      }

      const waUser = await storage.getWaUserByPhone(sender);
      const senderName = waUser ? waUser.name : sender;

      // ── Save image if present ─────────────────────────────────────────────
      let savedFilename: string | null = null;
      const hasMedia = !!(mediaUrl || mediaBase64);

      if (hasMedia) {
        const ext = extFromMime(mediaType);
        const filename = `wa_${Date.now()}${ext}`;
        const destPath = path.join(uploadsDir, filename);

        try {
          if (mediaUrl) {
            await downloadImageFromUrl(mediaUrl, destPath);
          } else if (mediaBase64) {
            saveBase64Image(mediaBase64, mediaType, destPath);
          }
          savedFilename = filename;

          // Create space photo record
          await storage.createSpacePhoto({
            spaceId: space.id,
            spaceCode,
            filename,
            caption: caption || content || null,
            takenAt: timestamp,
            sender: senderName,
          });
        } catch (imgErr) {
          console.error("Error al guardar imagen del webhook:", imgErr);
        }
      }

      // ── Save message in bitácora ──────────────────────────────────────────
      const msgContent = hasMedia
        ? `📸 ${caption || "Foto"} ${savedFilename ? "(imagen guardada)" : "(error al guardar imagen)"}`
        : textToSearch;

      await storage.createMessage({
        spaceCode,
        content: msgContent,
        sender: senderName,
        isMaintenanceUpdate: hasMedia,
      });

      // ── Auto-create ticket on keywords ────────────────────────────────────
      const low = textToSearch.toLowerCase();
      if (low.includes("pendiente") || low.includes("dañado") || low.includes("avería") || low.includes("falla")) {
        await storage.createTicket({
          spaceId: space.id,
          title: textToSearch.length > 80 ? textToSearch.slice(0, 80) + "…" : textToSearch,
          description: textToSearch,
          status: "pendiente",
          priority: "media",
          assignedToId: waUser?.id ?? null,
          createdById: waUser?.id ?? null,
        });
      }

      res.status(200).json({
        success: true,
        space: spaceCode,
        photoSaved: !!savedFilename,
        filename: savedFilename,
      });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).json({ success: false });
    }
  });

  // ── Seed ──────────────────────────────────────────────────────────────────
  const existingSpaces = await storage.getSpaces();
  // if (existingSpaces.length === 0) {
  //   const h101 = await storage.createSpace({ code: "101", name: "Habitación 101", type: "habitacion", notes: "" });
  //   const h102 = await storage.createSpace({ code: "102", name: "Habitación 102", type: "habitacion", notes: "" });
  //   const lobby = await storage.createSpace({ code: "LOBBY", name: "Lobby Principal", type: "lobby", notes: "" });
  //   const cocina = await storage.createSpace({ code: "COCINA", name: "Cocina Central", type: "cocina", notes: "" });
  //   const sub = await storage.createSpace({ code: "SUB-1", name: "Subestación 1", type: "subestacion", notes: "" });

  //   await storage.createSpaceItem({ spaceId: h101.id, name: "Aire acondicionado", status: "ok", notes: "" });
  //   await storage.createSpaceItem({ spaceId: h101.id, name: "TV 55\"", status: "mantenimiento", notes: "Pantalla con líneas" });
  //   await storage.createSpaceItem({ spaceId: h101.id, name: "Cama King", status: "ok", notes: "" });
  //   await storage.createSpaceItem({ spaceId: h101.id, name: "Detector de humo", status: "ok", notes: "" });
  //   await storage.createSpaceItem({ spaceId: h102.id, name: "Aire acondicionado", status: "ok", notes: "" });
  //   await storage.createSpaceItem({ spaceId: h102.id, name: "Vidrio baño", status: "fuera_de_servicio", notes: "Roto" });
  //   await storage.createSpaceItem({ spaceId: lobby.id, name: "Luces LED", status: "ok", notes: "" });
  //   await storage.createSpaceItem({ spaceId: lobby.id, name: "Pintura paredes", status: "mantenimiento", notes: "Manchas" });
  //   await storage.createSpaceItem({ spaceId: sub.id, name: "Transformador principal", status: "ok", notes: "" });
  //   await storage.createSpaceItem({ spaceId: sub.id, name: "UPS respaldo", status: "ok", notes: "" });

  //   const u1 = await storage.createWaUser({ name: "Carlos Técnico", phone: "+573001234567", role: "tecnico", active: true });
  //   const u2 = await storage.createWaUser({ name: "Ana Supervisora", phone: "+573009876543", role: "supervisor", active: true });

  //   await storage.createTicket({ spaceId: h101.id, title: "TV con pantalla dañada", description: "Pantalla tiene líneas horizontales visibles", status: "pendiente", priority: "alta", assignedToId: u1.id, createdById: u2.id });
  //   await storage.createTicket({ spaceId: h102.id, title: "Vidrio de baño roto", description: "Vidrio de mampara en baño está roto, riesgo de seguridad", status: "en_progreso", priority: "urgente", assignedToId: u1.id, createdById: u2.id });
  //   await storage.createTicket({ spaceId: lobby.id, title: "Manchas en paredes lobby", description: "Manchas de humedad en pared norte del lobby", status: "pendiente", priority: "media", assignedToId: null, createdById: u2.id });

  //   await storage.createMessage({ spaceCode: "101", content: "Habitación 101: TV tiene líneas en pantalla", sender: "Carlos Técnico", isMaintenanceUpdate: true });
  //   await storage.createMessage({ spaceCode: "101", content: "Revisado, se necesita reemplazo del panel", sender: "Ana Supervisora", isMaintenanceUpdate: false });
  // }

  // return httpServer;
}
