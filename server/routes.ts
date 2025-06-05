import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertClientSchema, insertInspectionSchema,
  insertTileSchema, insertNonConformitySchema, insertReportSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Login failed" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const { search } = req.query;
      
      if (search && typeof search === 'string') {
        const clients = await storage.searchClients(search);
        res.json(clients);
      } else {
        const clients = await storage.listClients();
        res.json(clients);
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      
      // Check if client already exists
      const existingClient = await storage.getClientByDocument(clientData.document);
      if (existingClient) {
        return res.status(400).json({ message: "Client with this document already exists" });
      }
      
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid client data" });
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
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch client" });
    }
  });

  // Inspection routes
  app.get("/api/inspections", async (req, res) => {
    try {
      const { userId, status, limit = "10", offset = "0" } = req.query;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const filters = {
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };
      
      const inspections = await storage.getInspectionsByUser(parseInt(userId as string), filters);
      res.json(inspections);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch inspections" });
    }
  });

  app.post("/api/inspections", async (req, res) => {
    try {
      const inspectionData = insertInspectionSchema.parse(req.body);
      
      // Check if protocol already exists
      const existingInspection = await storage.getInspectionByProtocol(inspectionData.protocol);
      if (existingInspection) {
        return res.status(400).json({ message: "Inspection with this protocol already exists" });
      }
      
      const inspection = await storage.createInspection(inspectionData);
      res.json(inspection);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid inspection data" });
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
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch inspection" });
    }
  });

  app.put("/api/inspections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const inspection = await storage.updateInspection(id, updateData);
      
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }
      
      res.json(inspection);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update inspection" });
    }
  });

  // Tile routes
  app.get("/api/inspections/:inspectionId/tiles", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const tiles = await storage.getTilesByInspection(inspectionId);
      res.json(tiles);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch tiles" });
    }
  });

  app.post("/api/inspections/:inspectionId/tiles", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const tileData = insertTileSchema.parse({ ...req.body, inspectionId });
      
      const tile = await storage.createTile(tileData);
      res.json(tile);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid tile data" });
    }
  });

  app.put("/api/tiles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const tile = await storage.updateTile(id, updateData);
      
      if (!tile) {
        return res.status(404).json({ message: "Tile not found" });
      }
      
      res.json(tile);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update tile" });
    }
  });

  app.delete("/api/tiles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTile(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Tile not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete tile" });
    }
  });

  // Non-conformity routes
  app.get("/api/inspections/:inspectionId/non-conformities", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const nonConformities = await storage.getNonConformitiesByInspection(inspectionId);
      res.json(nonConformities);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch non-conformities" });
    }
  });

  app.post("/api/inspections/:inspectionId/non-conformities", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const nonConformityData = insertNonConformitySchema.parse({ ...req.body, inspectionId });
      
      const nonConformity = await storage.createNonConformity(nonConformityData);
      res.json(nonConformity);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid non-conformity data" });
    }
  });

  app.put("/api/non-conformities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const nonConformity = await storage.updateNonConformity(id, updateData);
      
      if (!nonConformity) {
        return res.status(404).json({ message: "Non-conformity not found" });
      }
      
      res.json(nonConformity);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update non-conformity" });
    }
  });

  // Report routes
  app.post("/api/inspections/:inspectionId/reports", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const reportData = insertReportSchema.parse({ ...req.body, inspectionId });
      
      const report = await storage.createReport(reportData);
      res.json(report);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid report data" });
    }
  });

  app.get("/api/inspections/:inspectionId/reports", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const reports = await storage.getReportsByInspection(inspectionId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch reports" });
    }
  });

  // Utility routes
  app.get("/api/config/non-conformities", (req, res) => {
    const { NON_CONFORMITY_LIST } = require("@shared/schema");
    res.json(NON_CONFORMITY_LIST);
  });

  app.get("/api/config/tiles", (req, res) => {
    const { TILE_CONFIG } = require("@shared/schema");
    res.json(TILE_CONFIG);
  });

  const httpServer = createServer(app);
  return httpServer;
}
