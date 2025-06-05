import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  supabaseId: text("supabase_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpjCpf: text("cnpj_cpf").unique(),
  contact: text("contact"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Basic info
  date: timestamp("date").notNull(),
  development: text("development").notNull(), // Residencial, Comercial, Industrial
  city: text("city").notNull(),
  state: text("state").notNull(),
  address: text("address").notNull(),
  cep: text("cep").notNull(),
  protocol: text("protocol").notNull().unique(),
  subject: text("subject").notNull(),
  
  // Team info
  technician: text("technician").notNull(),
  department: text("department").notNull().default("Assistência Técnica"),
  unit: text("unit").notNull().default("PR"),
  coordinator: text("coordinator").notNull().default("Marlon Weingartner"),
  manager: text("manager").notNull().default("Elisabete Kudo"),
  regional: text("regional").notNull().default("Sul"),
  
  // Status
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Offline sync
  localId: text("local_id"),
  syncedAt: timestamp("synced_at"),
});

export const tiles = pgTable("tiles", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").references(() => inspections.id).notNull(),
  thickness: text("thickness").notNull(), // 5mm, 6mm, 8mm
  length: real("length").notNull(), // in meters
  width: real("width").notNull(), // in meters
  quantity: integer("quantity").notNull(),
  grossArea: real("gross_area").notNull(),
  correctedArea: real("corrected_area").notNull(),
});

export const nonConformities = pgTable("non_conformities", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").references(() => inspections.id).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  notes: text("notes"),
  photos: jsonb("photos").$type<string[]>().default([]),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").references(() => inspections.id).notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  syncedAt: true,
});

export const insertTileSchema = createInsertSchema(tiles).omit({
  id: true,
});

export const insertNonConformitySchema = createInsertSchema(nonConformities).omit({
  id: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  generatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;

export type Tile = typeof tiles.$inferSelect;
export type InsertTile = z.infer<typeof insertTileSchema>;

export type NonConformity = typeof nonConformities.$inferSelect;
export type InsertNonConformity = z.infer<typeof insertNonConformitySchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

// Predefined non-conformity types
export const NON_CONFORMITY_TYPES = [
  { id: "1", title: "Armazenagem Incorreta", description: "As telhas foram armazenadas de forma inadequada, expostas à umidade, sujeira ou empilhamento incorreto." },
  { id: "2", title: "Carga Permanente", description: "Excesso de equipamentos ou estruturas permanentes instalados sobre as telhas." },
  { id: "3", title: "Corte das Telhas", description: "Cortes realizados sem ferramentas adequadas ou técnicas apropriadas." },
  { id: "4", title: "Esforços devido à vento", description: "Estrutura inadequada para resistir aos esforços causados pelo vento." },
  { id: "5", title: "Fixação Inadequada", description: "Sistema de fixação das telhas não conforme as especificações técnicas." },
  { id: "6", title: "Inclinação Insuficiente", description: "Inclinação do telhado abaixo do recomendado para o produto." },
  { id: "7", title: "Instalação Incorreta", description: "Procedimento de instalação não seguiu as normas técnicas." },
  { id: "8", title: "Manuseio Inadequado", description: "Manuseio das telhas durante transporte ou instalação causou danos." },
  { id: "9", title: "Perfuração Inadequada", description: "Furos realizados de forma incorreta nas telhas." },
  { id: "10", title: "Sobrecarga", description: "Peso excessivo sobre a estrutura do telhado." },
  { id: "11", title: "Subdimensionamento", description: "Estrutura subdimensionada para suportar as cargas previstas." },
  { id: "12", title: "Ventilação Inadequada", description: "Sistema de ventilação insuficiente ou mal dimensionado." },
  { id: "13", title: "Uso Inadequado", description: "Utilização das telhas fora das especificações recomendadas." },
  { id: "14", title: "Outros", description: "Outras não conformidades não listadas anteriormente." },
] as const;

// Tile configuration options
export const TILE_CONFIGURATIONS = {
  "5mm": {
    lengths: [1.22, 1.53, 1.83, 2.13, 2.44],
    widths: [0.92, 1.10]
  },
  "6mm": {
    lengths: [1.22, 1.53, 1.83, 2.13, 2.44, 3.05, 3.66],
    widths: [0.92, 1.10]
  },
  "8mm": {
    lengths: [1.22, 1.53, 1.83, 2.13, 2.44, 3.05, 3.66],
    widths: [0.92, 1.10],
    restrictions: {
      "3.66": [1.10] // 3.66m length only allows 1.10m width
    }
  }
} as const;
