import { 
  users, clients, inspections, tiles, nonConformities, reports,
  type User, type InsertUser, type Client, type InsertClient,
  type Inspection, type InsertInspection, type Tile, type InsertTile,
  type NonConformity, type InsertNonConformity, type Report, type InsertReport
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Clients
  getClient(id: number): Promise<Client | undefined>;
  getClientByDocument(document: string): Promise<Client | undefined>;
  searchClients(query: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  listClients(): Promise<Client[]>;

  // Inspections
  getInspection(id: number): Promise<Inspection | undefined>;
  getInspectionByProtocol(protocol: string): Promise<Inspection | undefined>;
  getInspectionsByUser(userId: number, filters?: { status?: string; limit?: number; offset?: number }): Promise<Inspection[]>;
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  updateInspection(id: number, inspection: Partial<InsertInspection>): Promise<Inspection | undefined>;
  deleteInspection(id: number): Promise<boolean>;

  // Tiles
  getTilesByInspection(inspectionId: number): Promise<Tile[]>;
  createTile(tile: InsertTile): Promise<Tile>;
  updateTile(id: number, tile: Partial<InsertTile>): Promise<Tile | undefined>;
  deleteTile(id: number): Promise<boolean>;

  // Non-conformities
  getNonConformitiesByInspection(inspectionId: number): Promise<NonConformity[]>;
  createNonConformity(nonConformity: InsertNonConformity): Promise<NonConformity>;
  updateNonConformity(id: number, nonConformity: Partial<InsertNonConformity>): Promise<NonConformity | undefined>;
  deleteNonConformity(id: number): Promise<boolean>;

  // Reports
  getReportsByInspection(inspectionId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private inspections: Map<number, Inspection>;
  private tiles: Map<number, Tile>;
  private nonConformities: Map<number, NonConformity>;
  private reports: Map<number, Report>;
  private currentUserId: number;
  private currentClientId: number;
  private currentInspectionId: number;
  private currentTileId: number;
  private currentNonConformityId: number;
  private currentReportId: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.inspections = new Map();
    this.tiles = new Map();
    this.nonConformities = new Map();
    this.reports = new Map();
    this.currentUserId = 1;
    this.currentClientId = 1;
    this.currentInspectionId = 1;
    this.currentTileId = 1;
    this.currentNonConformityId = 1;
    this.currentReportId = 1;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser,
      department: insertUser.department || "",
      unit: insertUser.unit || "",
      coordinator: insertUser.coordinator || "",
      manager: insertUser.manager || "",
      regional: insertUser.regional || "",
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateUser };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Clients
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByDocument(document: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(client => client.document === document);
  }

  async searchClients(query: string): Promise<Client[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.clients.values()).filter(client => 
      client.name.toLowerCase().includes(lowerQuery) ||
      client.document.includes(query)
    ).slice(0, 5);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const client: Client = { 
      ...insertClient,
      email: insertClient.email ?? null,
      contact: insertClient.contact ?? null,
      id, 
      createdAt: new Date() 
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, updateClient: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...updateClient };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async listClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  // Inspections
  async getInspection(id: number): Promise<Inspection | undefined> {
    return this.inspections.get(id);
  }

  async getInspectionByProtocol(protocol: string): Promise<Inspection | undefined> {
    return Array.from(this.inspections.values()).find(inspection => inspection.protocol === protocol);
  }

  async getInspectionsByUser(userId: number, filters?: { status?: string; limit?: number; offset?: number }): Promise<Inspection[]> {
    let results = Array.from(this.inspections.values()).filter(inspection => inspection.userId === userId);
    
    if (filters?.status) {
      results = results.filter(inspection => inspection.status === filters.status);
    }
    
    // Sort by date descending
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (filters?.offset) {
      results = results.slice(filters.offset);
    }
    
    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }
    
    return results;
  }

  async createInspection(insertInspection: InsertInspection): Promise<Inspection> {
    const id = this.currentInspectionId++;
    const now = new Date();
    const inspection: Inspection = { 
      ...insertInspection,
      status: insertInspection.status || "pending",
      clientId: insertInspection.clientId ?? null,
      totalArea: insertInspection.totalArea || 0,
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.inspections.set(id, inspection);
    return inspection;
  }

  async updateInspection(id: number, updateInspection: Partial<InsertInspection>): Promise<Inspection | undefined> {
    const inspection = this.inspections.get(id);
    if (!inspection) return undefined;
    
    const updatedInspection = { 
      ...inspection, 
      ...updateInspection, 
      updatedAt: new Date() 
    };
    this.inspections.set(id, updatedInspection);
    return updatedInspection;
  }

  async deleteInspection(id: number): Promise<boolean> {
    return this.inspections.delete(id);
  }

  // Tiles
  async getTilesByInspection(inspectionId: number): Promise<Tile[]> {
    return Array.from(this.tiles.values()).filter(tile => tile.inspectionId === inspectionId);
  }

  async createTile(insertTile: InsertTile): Promise<Tile> {
    const id = this.currentTileId++;
    const tile: Tile = { ...insertTile, id };
    this.tiles.set(id, tile);
    return tile;
  }

  async updateTile(id: number, updateTile: Partial<InsertTile>): Promise<Tile | undefined> {
    const tile = this.tiles.get(id);
    if (!tile) return undefined;
    
    const updatedTile = { ...tile, ...updateTile };
    this.tiles.set(id, updatedTile);
    return updatedTile;
  }

  async deleteTile(id: number): Promise<boolean> {
    return this.tiles.delete(id);
  }

  // Non-conformities
  async getNonConformitiesByInspection(inspectionId: number): Promise<NonConformity[]> {
    return Array.from(this.nonConformities.values()).filter(nc => nc.inspectionId === inspectionId);
  }

  async createNonConformity(insertNonConformity: InsertNonConformity): Promise<NonConformity> {
    const id = this.currentNonConformityId++;
    const nonConformity: NonConformity = { 
      ...insertNonConformity,
      description: insertNonConformity.description ?? null,
      notes: insertNonConformity.notes ?? null,
      photos: insertNonConformity.photos ? (insertNonConformity.photos as string[]) : null,
      id 
    };
    this.nonConformities.set(id, nonConformity);
    return nonConformity;
  }

  async updateNonConformity(id: number, updateNonConformity: Partial<InsertNonConformity>): Promise<NonConformity | undefined> {
    const nonConformity = this.nonConformities.get(id);
    if (!nonConformity) return undefined;
    
    const updatedNonConformity = { 
      ...nonConformity, 
      ...updateNonConformity,
      photos: updateNonConformity.photos ? (updateNonConformity.photos as string[]) : nonConformity.photos
    };
    this.nonConformities.set(id, updatedNonConformity);
    return updatedNonConformity;
  }

  async deleteNonConformity(id: number): Promise<boolean> {
    return this.nonConformities.delete(id);
  }

  // Reports
  async getReportsByInspection(inspectionId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(report => report.inspectionId === inspectionId);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const report: Report = { 
      ...insertReport, 
      id, 
      generatedAt: new Date() 
    };
    this.reports.set(id, report);
    return report;
  }
}

export const storage = new MemStorage();
