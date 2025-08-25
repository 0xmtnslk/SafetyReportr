import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"), 
  // Roles: "central_admin" | "safety_specialist" | "occupational_physician" | "responsible_manager" | "user"
  position: text("position"), // e.g., "İş Güvenliği Uzmanı", "Teknik Hizmetler Müdürü", "İşyeri Hekimi"
  locationId: varchar("location_id"), // Will reference locations.id
  location: text("location"), // Legacy field - to be deprecated
  firstLogin: boolean("first_login").default(true), // Force password change on first login
  resetToken: text("reset_token"), // Password reset token
  resetTokenExpiry: timestamp("reset_token_expiry"), // Token expiration
  isActive: boolean("is_active").default(true), // Admin can deactivate users
  createdBy: varchar("created_by"), // Will reference users.id
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Locations table - Hospitals, Medical Centers etc.
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "İstinye Üniversite Topkapı Liv Hastanesi"
  address: text("address").notNull(), // Full address
  type: text("type").notNull().default("hospital"), // hospital, medical_center, clinic
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id), // Created by central management
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportNumber: text("report_number").notNull().unique(),
  reportDate: timestamp("report_date").notNull(),
  reporter: text("reporter").notNull(),
  projectLocation: text("project_location").notNull(),
  locationId: varchar("location_id").references(() => locations.id), // Link to location
  status: text("status").notNull().default("draft"), // draft, in_progress, completed
  managementSummary: text("management_summary"),
  generalEvaluation: text("general_evaluation"),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const findings = pgTable("findings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => reports.id).notNull(),
  section: integer("section").notNull(), // 2, 3, 4 (corresponding to report sections)
  title: text("title").notNull(),
  dangerLevel: text("danger_level").notNull(), // high, medium, low
  currentSituation: text("current_situation").notNull(),
  legalBasis: text("legal_basis"),
  recommendation: text("recommendation"),
  images: jsonb("images").$type<string[]>().default([]),
  processSteps: jsonb("process_steps").$type<Array<{date: string, description: string}>>().default([]),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const offlineQueue = pgTable("offline_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // create, update, delete
  entityType: text("entity_type").notNull(), // report, finding
  entityId: varchar("entity_id"),
  data: jsonb("data").notNull(),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// PDF Template System
export const pdfTemplates = pgTable("pdf_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  templateType: text("template_type").notNull(), // 'isg_report', 'technical_findings', 'inspection', etc.
  version: text("version").notNull().default("1.0.0"),
  isActive: boolean("is_active").default(true),
  config: jsonb("config").$type<TemplateConfig>().notNull(),
  sections: jsonb("sections").$type<TemplateSection[]>().notNull(),
  styles: jsonb("styles").$type<TemplateStyles>().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pdfTemplateFields = pgTable("pdf_template_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => pdfTemplates.id).notNull(),
  fieldKey: text("field_key").notNull(), // 'reportNumber', 'findings.title', etc.
  fieldLabel: text("field_label").notNull(), // 'Rapor Numarası', 'Bulgu Başlığı'
  fieldType: text("field_type").notNull(), // 'text', 'date', 'image', 'table', 'list'
  isRequired: boolean("is_required").default(false),
  validation: jsonb("validation").$type<FieldValidation>(),
  defaultValue: text("default_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas  
export const insertLocationSchema = createInsertSchema(locations).pick({
  name: true,
  address: true,
  type: true,
  isActive: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  position: true,
  locationId: true,
  location: true, // Keep for backward compatibility
  isActive: true,
});

// Admin user creation schema (with auto-generated password option)
export const adminCreateUserSchema = insertUserSchema.extend({
  password: z.string().optional(), // Password will be auto-generated if not provided
});

// Password change schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Password reset schemas
export const resetPasswordRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertReportSchema = createInsertSchema(reports).pick({
  reportNumber: true,
  reportDate: true,
  reporter: true,
  projectLocation: true,
  locationId: true,
  status: true,
  managementSummary: true,
  generalEvaluation: true,
}).extend({
  reportDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ])
});

export const insertFindingSchema = createInsertSchema(findings).pick({
  reportId: true,
  section: true,
  title: true,
  dangerLevel: true,
  currentSituation: true,
  legalBasis: true,
  recommendation: true,
  images: true,
  processSteps: true,
  isCompleted: true,
});

export const insertOfflineQueueSchema = createInsertSchema(offlineQueue).pick({
  action: true,
  entityType: true,
  entityId: true,
  data: true,
});

export const insertPdfTemplateSchema = createInsertSchema(pdfTemplates).pick({
  name: true,
  displayName: true,
  description: true,
  templateType: true,
  version: true,
  isActive: true,
  config: true,
  sections: true,
  styles: true,
});

export const insertPdfTemplateFieldSchema = createInsertSchema(pdfTemplateFields).pick({
  templateId: true,
  fieldKey: true,
  fieldLabel: true,
  fieldType: true,
  isRequired: true,
  validation: true,
  defaultValue: true,
});

// Types
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AdminCreateUser = z.infer<typeof adminCreateUserSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Finding = typeof findings.$inferSelect;
export type InsertFinding = z.infer<typeof insertFindingSchema>;

export type OfflineQueueItem = typeof offlineQueue.$inferSelect;
export type InsertOfflineQueueItem = z.infer<typeof insertOfflineQueueSchema>;

export type PdfTemplate = typeof pdfTemplates.$inferSelect;
export type InsertPdfTemplate = z.infer<typeof insertPdfTemplateSchema>;

export type PdfTemplateField = typeof pdfTemplateFields.$inferSelect;
export type InsertPdfTemplateField = z.infer<typeof insertPdfTemplateFieldSchema>;

// Template Configuration Types
export interface TemplateConfig {
  pageSize: 'A4' | 'A3' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  fonts: {
    primary: string;
    secondary?: string;
    sizes: { [key: string]: number };
  };
  colors: { [key: string]: string };
  logo?: {
    url: string;
    width: number;
    height: number;
    position: { x: number; y: number };
  };
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'header' | 'content' | 'table' | 'image' | 'footer' | 'custom';
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  style: { [key: string]: any };
  dataBinding: string; // JSON path to data field
  components: TemplateComponent[];
  isRepeatable?: boolean; // For arrays like findings
  conditions?: { field: string; operator: string; value: any }[]; // Show/hide conditions
}

export interface TemplateComponent {
  id: string;
  type: 'text' | 'image' | 'table' | 'line' | 'rectangle' | 'chart';
  content: string | { [key: string]: any };
  position: { x: number; y: number };
  dimensions?: { width: number; height: number };
  style: { [key: string]: any };
  dataBinding?: string;
  conditions?: { field: string; operator: string; value: any }[]; // Show/hide conditions
}

export interface TemplateStyles {
  fonts: { [key: string]: { family: string; size: number; weight?: string; color?: string } };
  colors: { [key: string]: string };
  spacing: { [key: string]: number };
  borders: { [key: string]: { width: number; color: string; style: string } };
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: 'email' | 'phone' | 'date' | 'url';
}
