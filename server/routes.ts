import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertInspectionSchema, insertTileSchema, insertNonConformitySchema, insertReportSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Users
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/email/:email", async (req, res) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/supabase/:supabaseId", async (req, res) => {
    try {
      const user = await storage.getUserBySupabaseId(req.params.supabaseId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Clients
  app.get("/api/clients", async (req, res) => {
    try {
      const search = req.query.search as string;
      const clients = await storage.getClients(search);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      
      // Check for duplicate CNPJ/CPF
      if (clientData.cnpjCpf) {
        const existing = await storage.getClientByCnpjCpf(clientData.cnpjCpf);
        if (existing) {
          return res.status(400).json({ message: "Client with this CNPJ/CPF already exists" });
        }
      }

      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  // Inspections
  app.get("/api/inspections", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1; // Default user
      const status = req.query.status as string;
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      const inspections = await storage.getInspections(userId, { status, clientId });
      res.json(inspections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inspections" });
    }
  });

  app.get("/api/inspections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const inspection = await storage.getInspection(id);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inspection" });
    }
  });

  app.get("/api/inspections/protocol/:protocol", async (req, res) => {
    try {
      const inspection = await storage.getInspectionByProtocol(req.params.protocol);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inspection" });
    }
  });

  app.post("/api/inspections", async (req, res) => {
    try {
      const inspectionData = insertInspectionSchema.parse(req.body);
      
      // Check for duplicate protocol
      const existing = await storage.getInspectionByProtocol(inspectionData.protocol);
      if (existing) {
        return res.status(400).json({ message: "Inspection with this protocol already exists" });
      }

      const inspection = await storage.createInspection(inspectionData);
      res.status(201).json(inspection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inspection data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inspection" });
    }
  });

  app.put("/api/inspections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertInspectionSchema.partial().parse(req.body);
      
      const inspection = await storage.updateInspection(id, updateData);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inspection data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update inspection" });
    }
  });

  // Tiles
  app.get("/api/inspections/:inspectionId/tiles", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const tiles = await storage.getTilesByInspection(inspectionId);
      res.json(tiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tiles" });
    }
  });

  app.post("/api/inspections/:inspectionId/tiles", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const tileData = insertTileSchema.parse({
        ...req.body,
        inspectionId
      });

      const tile = await storage.createTile(tileData);
      res.status(201).json(tile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tile" });
    }
  });

  app.delete("/api/tiles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTile(id);
      if (!deleted) {
        return res.status(404).json({ message: "Tile not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tile" });
    }
  });

  // Non-conformities
  app.get("/api/inspections/:inspectionId/non-conformities", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const nonConformities = await storage.getNonConformitiesByInspection(inspectionId);
      res.json(nonConformities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch non-conformities" });
    }
  });

  app.post("/api/inspections/:inspectionId/non-conformities", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const nonConformityData = insertNonConformitySchema.parse({
        ...req.body,
        inspectionId
      });

      const nonConformity = await storage.createNonConformity(nonConformityData);
      res.status(201).json(nonConformity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid non-conformity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create non-conformity" });
    }
  });

  // Photo upload
  app.post("/api/upload/photo", upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      // In a real app, you'd upload to Supabase Storage or similar
      const photoUrl = `/uploads/${req.file.filename}`;
      
      res.json({ 
        url: photoUrl,
        filename: req.file.filename,
        size: req.file.size
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // Reports
  app.post("/api/inspections/:inspectionId/reports", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const reportData = insertReportSchema.parse({
        ...req.body,
        inspectionId
      });

      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  app.get("/api/inspections/:inspectionId/reports", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const report = await storage.getReportByInspection(inspectionId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  // Sync endpoints
  app.get("/api/sync/unsynced", async (req, res) => {
    try {
      const inspections = await storage.getUnsyncedInspections();
      res.json(inspections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unsynced inspections" });
    }
  });

  app.post("/api/sync/mark/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markInspectionSynced(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to mark inspection as synced" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(process.cwd(), 'uploads', req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
