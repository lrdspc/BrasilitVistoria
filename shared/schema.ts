import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  department: text("department").notNull().default("Assistência Técnica"),
  unit: text("unit").notNull().default("PR"),
  coordinator: text("coordinator").notNull().default("Marlon Weingartner"),
  manager: text("manager").notNull().default("Elisabete Kudo"),
  regional: text("regional").notNull().default("Sul"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  document: text("document").notNull().unique(), // CNPJ/CPF
  contact: text("contact"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  clientId: integer("client_id").references(() => clients.id),
  protocol: text("protocol").notNull().unique(),
  date: timestamp("date").notNull(),
  enterprise: text("enterprise").notNull(), // Residencial, Comercial, Industrial
  city: text("city").notNull(),
  state: text("state").notNull(),
  address: text("address").notNull(),
  cep: text("cep").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  totalArea: real("total_area").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tiles = pgTable("tiles", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").references(() => inspections.id).notNull(),
  thickness: text("thickness").notNull(), // 5mm, 6mm, 8mm
  length: real("length").notNull(), // in meters
  width: real("width").notNull(), // in meters
  quantity: integer("quantity").notNull(),
  grossArea: real("gross_area").notNull(),
  correctedArea: real("corrected_area").notNull(), // with 12% overlap correction
});

export const nonConformities = pgTable("non_conformities", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").references(() => inspections.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  notes: text("notes"),
  photos: jsonb("photos").$type<string[]>().default([]),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").references(() => inspections.id).notNull(),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
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
}).extend({
  date: z.string().transform((str) => new Date(str)),
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

// Non-conformity predefined list
export const NON_CONFORMITY_LIST = [
  "1. Armazenagem Incorreta",
  "2. Carga Permanente",
  "3. Corte das Telhas",
  "4. Esforços devido à vento",
  "5. Fixação Inadequada",
  "6. Inclinação Insuficiente",
  "7. Instalação Inadequada",
  "8. Manutenção Inadequada",
  "9. Pisoteio",
  "10. Sobrecarga Acidental",
  "11. Subcontratos",
  "12. Transporte Inadequado",
  "13. Uso Inadequado",
  "14. Vandalismo",
];

// Tile dimensions configuration
export const TILE_CONFIG = {
  "5mm": {
    lengths: [1.22, 1.53, 1.83, 2.13, 2.44],
    widths: [0.92, 1.10],
  },
  "6mm": {
    lengths: [1.22, 1.53, 1.83, 2.13, 2.44, 3.05, 3.66],
    widths: [0.92, 1.10],
  },
  "8mm": {
    lengths: [1.22, 1.53, 1.83, 2.13, 2.44, 3.05, 3.66],
    widths: [0.92, 1.10],
    restrictions: {
      "3.66": [1.10], // 3.66m length only allows 1.10m width
    },
  },
};
