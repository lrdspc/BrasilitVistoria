import { users, clients, inspections, tiles, nonConformities, reports, type User, type Client, type Inspection, type InsertUser, type InsertClient, type InsertInspection, type InsertTile, type InsertNonConformity, type InsertReport, type Tile, type NonConformity, type Report } from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserBySupabaseId(supabaseId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;

  // Clients
  getClient(id: number): Promise<Client | undefined>;
  getClientByName(name: string): Promise<Client | undefined>;
  getClientByCnpjCpf(cnpjCpf: string): Promise<Client | undefined>;
  getClients(search?: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined>;

  // Inspections
  getInspection(id: number): Promise<Inspection | undefined>;
  getInspectionByProtocol(protocol: string): Promise<Inspection | undefined>;
  getInspections(userId: number, filters?: { status?: string; clientId?: number }): Promise<Inspection[]>;
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  updateInspection(id: number, data: Partial<InsertInspection>): Promise<Inspection | undefined>;
  deleteInspection(id: number): Promise<boolean>;

  // Tiles
  getTilesByInspection(inspectionId: number): Promise<Tile[]>;
  createTile(tile: InsertTile): Promise<Tile>;
  updateTile(id: number, data: Partial<InsertTile>): Promise<Tile | undefined>;
  deleteTile(id: number): Promise<boolean>;

  // Non-conformities
  getNonConformitiesByInspection(inspectionId: number): Promise<NonConformity[]>;
  createNonConformity(nonConformity: InsertNonConformity): Promise<NonConformity>;
  updateNonConformity(id: number, data: Partial<InsertNonConformity>): Promise<NonConformity | undefined>;
  deleteNonConformity(id: number): Promise<boolean>;

  // Reports
  getReportByInspection(inspectionId: number): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;

  // Sync methods
  getUnsyncedInspections(): Promise<Inspection[]>;
  markInspectionSynced(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private clients: Map<number, Client> = new Map();
  private inspections: Map<number, Inspection> = new Map();
  private tiles: Map<number, Tile> = new Map();
  private nonConformities: Map<number, NonConformity> = new Map();
  private reports: Map<number, Report> = new Map();
  
  private currentUserId = 1;
  private currentClientId = 1;
  private currentInspectionId = 1;
  private currentTileId = 1;
  private currentNonConformityId = 1;
  private currentReportId = 1;

  constructor() {
    // Initialize with a default user
    this.createUser({
      email: "tecnico@brasilit.com",
      name: "João Silva",
      supabaseId: "default-user"
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserBySupabaseId(supabaseId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.supabaseId === supabaseId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Clients
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByName(name: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(client => 
      client.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  async getClientByCnpjCpf(cnpjCpf: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(client => client.cnpjCpf === cnpjCpf);
  }

  async getClients(search?: string): Promise<Client[]> {
    const allClients = Array.from(this.clients.values());
    if (!search) return allClients;
    
    return allClients.filter(client =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      (client.cnpjCpf && client.cnpjCpf.includes(search))
    );
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const client: Client = {
      ...insertClient,
      id,
      createdAt: new Date(),
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...data };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  // Inspections
  async getInspection(id: number): Promise<Inspection | undefined> {
    return this.inspections.get(id);
  }

  async getInspectionByProtocol(protocol: string): Promise<Inspection | undefined> {
    return Array.from(this.inspections.values()).find(inspection => inspection.protocol === protocol);
  }

  async getInspections(userId: number, filters?: { status?: string; clientId?: number }): Promise<Inspection[]> {
    let inspections = Array.from(this.inspections.values()).filter(inspection => inspection.userId === userId);
    
    if (filters?.status) {
      inspections = inspections.filter(inspection => inspection.status === filters.status);
    }
    
    if (filters?.clientId) {
      inspections = inspections.filter(inspection => inspection.clientId === filters.clientId);
    }
    
    return inspections.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createInspection(insertInspection: InsertInspection): Promise<Inspection> {
    const id = this.currentInspectionId++;
    const now = new Date();
    const inspection: Inspection = {
      ...insertInspection,
      id,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
    };
    this.inspections.set(id, inspection);
    return inspection;
  }

  async updateInspection(id: number, data: Partial<InsertInspection>): Promise<Inspection | undefined> {
    const inspection = this.inspections.get(id);
    if (!inspection) return undefined;
    
    const updatedInspection = { 
      ...inspection, 
      ...data, 
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

  async updateTile(id: number, data: Partial<InsertTile>): Promise<Tile | undefined> {
    const tile = this.tiles.get(id);
    if (!tile) return undefined;
    
    const updatedTile = { ...tile, ...data };
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
    const nonConformity: NonConformity = { ...insertNonConformity, id };
    this.nonConformities.set(id, nonConformity);
    return nonConformity;
  }

  async updateNonConformity(id: number, data: Partial<InsertNonConformity>): Promise<NonConformity | undefined> {
    const nonConformity = this.nonConformities.get(id);
    if (!nonConformity) return undefined;
    
    const updatedNonConformity = { ...nonConformity, ...data };
    this.nonConformities.set(id, updatedNonConformity);
    return updatedNonConformity;
  }

  async deleteNonConformity(id: number): Promise<boolean> {
    return this.nonConformities.delete(id);
  }

  // Reports
  async getReportByInspection(inspectionId: number): Promise<Report | undefined> {
    return Array.from(this.reports.values()).find(report => report.inspectionId === inspectionId);
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

  // Sync methods
  async getUnsyncedInspections(): Promise<Inspection[]> {
    return Array.from(this.inspections.values()).filter(inspection => !inspection.syncedAt);
  }

  async markInspectionSynced(id: number): Promise<void> {
    const inspection = this.inspections.get(id);
    if (inspection) {
      inspection.syncedAt = new Date();
      this.inspections.set(id, inspection);
    }
  }
}

export const storage = new MemStorage();
