import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(), // Required - Contact email
  phone: text("phone").notNull(), // Required - Contact phone
  profileImage: text("profile_image"), // Optional - Profile photo URL from object storage
  role: text("role").notNull().default("user"), 
  // Roles: "central_admin" | "safety_specialist" | "occupational_physician" | "responsible_manager" | "user"
  position: text("position"), // e.g., "İş Güvenliği Uzmanı", "Teknik Hizmetler Müdürü", "İşyeri Hekimi"
  department: text("department"), // Department within hospital for granular permissions
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
  shortName: text("short_name"), // e.g., "Topkapı Liv", "GOP Hastanesi"
  logo: text("logo"), // Hospital logo URL from object storage
  type: text("type").notNull().default("hospital"), // hospital, medical_center, clinic, office
  
  // Contact Information
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  
  // Address Information (Turkish Address System)
  address: text("address").notNull(), // Street address
  district: text("district").notNull(), // İlçe
  city: text("city").notNull(), // İl
  postalCode: text("postal_code"),
  country: text("country").default("Türkiye"),
  
  // Organization Details
  taxNumber: text("tax_number"),
  legalRepresentative: text("legal_representative"),
  
  // System Fields
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

// Checklist System Tables
export const checklistTemplates = pgTable("checklist_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  templateNumber: text("template_number").unique(), // TMP-123456
  category: text("category").default("Genel"),
  type: text("type").default("hospital_technical"), // hospital_technical, general_safety, hygiene
  version: text("version").default("1.0"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const checklistSections = pgTable("checklist_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => checklistTemplates.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const checklistQuestions = pgTable("checklist_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId: varchar("section_id").references(() => checklistSections.id).notNull(),
  questionText: text("question_text").notNull(),
  orderIndex: integer("order_index").default(0),
  twScore: integer("tw_score").default(1), // 1-10 TW score
  category: text("category").default("Genel"), // Güvenlik, Hijyen, Teknik, etc.
  isRequired: boolean("is_required").default(true),
  allowPhoto: boolean("allow_photo").default(true),
  allowDocument: boolean("allow_document").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NEW: Inspection System Tables
export const inspections = pgTable("inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionNumber: text("inspection_number").notNull().unique(), // INS-123456
  templateId: varchar("template_id").references(() => checklistTemplates.id).notNull(),
  title: text("title").notNull(), // e.g., "Ocak 2025 Teknik Denetim"
  description: text("description"),
  
  // Timing
  startDate: timestamp("start_date").notNull(), // When inspection starts
  dueDate: timestamp("due_date").notNull(), // Original deadline
  extendedDueDate: timestamp("extended_due_date"), // Admin can extend
  completedAt: timestamp("completed_at"), // When all responses are submitted
  
  // Assignment scope
  assignmentType: text("assignment_type").notNull(), // "all_hospitals", "selected_hospitals"
  targetLocationIds: jsonb("target_location_ids").$type<string[]>().default([]), // If selected_hospitals
  
  // Status tracking
  status: text("status").notNull().default("active"), // active, completed, overdue, cancelled
  totalAssignments: integer("total_assignments").default(0),
  completedAssignments: integer("completed_assignments").default(0),
  overdueAssignments: integer("overdue_assignments").default(0),
  
  // Admin controls
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inspectionAssignments = pgTable("inspection_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionId: varchar("inspection_id").references(() => inspections.id).notNull(),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  assignedUserId: varchar("assigned_user_id").references(() => users.id).notNull(), // Safety specialist
  
  // Status
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, overdue
  assignedAt: timestamp("assigned_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Progress tracking
  totalQuestions: integer("total_questions").default(0),
  answeredQuestions: integer("answered_questions").default(0),
  progressPercentage: integer("progress_percentage").default(0),
  
  // Scoring
  totalPossibleScore: integer("total_possible_score").default(0),
  actualScore: integer("actual_score").default(0),
  scorePercentage: integer("score_percentage").default(0),
  letterGrade: text("letter_grade"), // A, B, C, D, E
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inspectionResponses = pgTable("inspection_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").references(() => inspectionAssignments.id).notNull(),
  questionId: varchar("question_id").references(() => checklistQuestions.id).notNull(),
  
  // Response data
  answer: text("answer").notNull(), // "Karşılıyor", "Kısmen Karşılıyor", "Karşılamıyor", "Kapsam Dışı"
  score: integer("score").default(0), // Calculated score based on TW and answer
  notes: text("notes"),
  
  // Attachments
  photos: jsonb("photos").$type<string[]>().default([]), // Photo URLs
  documents: jsonb("documents").$type<string[]>().default([]), // Document URLs
  
  // Response tracking
  respondedBy: varchar("responded_by").references(() => users.id).notNull(),
  respondedAt: timestamp("responded_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  shortName: true,
  logo: true,
  type: true,
  phone: true,
  email: true,
  website: true,
  address: true,
  district: true,
  city: true,
  postalCode: true,
  country: true,
  taxNumber: true,
  legalRepresentative: true,
  isActive: true,
}).extend({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Telefon numarası en az 10 karakter olmalıdır"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  phone: true,
  profileImage: true,
  role: true,
  position: true,
  department: true,
  locationId: true,
  location: true, // Keep for backward compatibility
  isActive: true,
}).extend({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Telefon numarası en az 10 karakter olmalıdır"),
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

// Checklist types
export type ChecklistTemplate = typeof checklistTemplates.$inferSelect;
export type InsertChecklistTemplate = z.infer<typeof insertChecklistTemplateSchema>;

export type ChecklistSection = typeof checklistSections.$inferSelect;
export type InsertChecklistSection = z.infer<typeof insertChecklistSectionSchema>;

export type ChecklistQuestion = typeof checklistQuestions.$inferSelect;
export type InsertChecklistQuestion = z.infer<typeof insertChecklistQuestionSchema>;

export type ChecklistInspection = typeof checklistInspections.$inferSelect;
export type InsertChecklistInspection = z.infer<typeof insertChecklistInspectionSchema>;

export type ChecklistAnswer = typeof checklistAnswers.$inferSelect;
export type InsertChecklistAnswer = z.infer<typeof insertChecklistAnswerSchema>;

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

// Checklist utility functions
export const calculateQuestionScore = (evaluation: string, twScore: number): number => {
  if (!evaluation) return 0;
  if (evaluation === "Kapsam Dışı") return 0; // NA - not counted
  if (evaluation === "Karşılamıyor") return -1 * twScore;
  if (evaluation === "Kısmen Karşılıyor") return 0.5 * twScore;
  if (evaluation === "Karşılıyor") return 1 * twScore;
  return 0;
};

export const calculateLetterGrade = (percentage: number): string => {
  if (percentage >= 90) return "A";
  if (percentage >= 75) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 25) return "D";
  if (percentage >= 0) return "E";
  return "";
};

export const CHECKLIST_CATEGORIES = [
  "Afet ve Acil Durum Yönetimi",
  "Altyapı", 
  "Emniyet",
  "Güvenlik",
  "Tıbbi Cihaz Yönetimi",
  "Malzeme-Cihaz Yönetimi",
  "Tehlikeli Madde Yönetimi",
  "Atık Yönetimi",
  "Yangın Güvenliği"
] as const;

export const EVALUATION_OPTIONS = [
  "Karşılıyor",
  "Kısmen Karşılıyor", 
  "Karşılamıyor",
  "Kapsam Dışı"
] as const;

// Technical Inspection Checklist System
// New Inspection System Tables - append to main schema
export const inspections = pgTable("inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionNumber: text("inspection_number").notNull().unique(), // INS-123456
  templateId: varchar("template_id").references(() => checklistTemplates.id).notNull(),
  title: text("title").notNull(), // e.g., "Ocak 2025 Teknik Denetim"
  description: text("description"),
  
  // Timing
  startDate: timestamp("start_date").notNull(), // When inspection starts
  dueDate: timestamp("due_date").notNull(), // Original deadline
  extendedDueDate: timestamp("extended_due_date"), // Admin can extend
  completedAt: timestamp("completed_at"), // When all responses are submitted
  
  // Assignment scope
  assignmentType: text("assignment_type").notNull(), // "all_hospitals", "selected_hospitals"
  targetLocationIds: jsonb("target_location_ids").$type<string[]>().default([]), // If selected_hospitals
  
  // Status tracking
  status: text("status").notNull().default("active"), // active, completed, overdue, cancelled
  totalAssignments: integer("total_assignments").default(0),
  completedAssignments: integer("completed_assignments").default(0),
  overdueAssignments: integer("overdue_assignments").default(0),
  
  // Admin controls
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inspectionAssignments = pgTable("inspection_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionId: varchar("inspection_id").references(() => inspections.id).notNull(),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  assignedUserId: varchar("assigned_user_id").references(() => users.id).notNull(), // Safety specialist
  
  // Status
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, overdue
  assignedAt: timestamp("assigned_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Progress tracking
  totalQuestions: integer("total_questions").default(0),
  answeredQuestions: integer("answered_questions").default(0),
  progressPercentage: integer("progress_percentage").default(0),
  
  // Scoring
  totalPossibleScore: integer("total_possible_score").default(0),
  actualScore: integer("actual_score").default(0),
  scorePercentage: integer("score_percentage").default(0),
  letterGrade: text("letter_grade"), // A, B, C, D, E
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inspectionResponses = pgTable("inspection_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").references(() => inspectionAssignments.id).notNull(),
  questionId: varchar("question_id").references(() => checklistQuestions.id).notNull(),
  
  // Response data
  answer: text("answer").notNull(), // "Karşılıyor", "Kısmen Karşılıyor", "Karşılamıyor", "Kapsam Dışı"
  score: integer("score").default(0), // Calculated score based on TW and answer
  notes: text("notes"),
  
  // Attachments
  photos: jsonb("photos").$type<string[]>().default([]), // Photo URLs
  documents: jsonb("documents").$type<string[]>().default([]), // Document URLs
  
  // Response tracking
  respondedBy: varchar("responded_by").references(() => users.id).notNull(),
  respondedAt: timestamp("responded_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inspection insert schemas
export const insertInspectionSchema = createInsertSchema(inspections).pick({
  templateId: true,
  title: true,
  description: true,
  startDate: true,
  dueDate: true,
  extendedDueDate: true,
  assignmentType: true,
  targetLocationIds: true,
  status: true,
  isActive: true,
}).extend({
  startDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]),
  dueDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]),
  extendedDueDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]).optional(),
});

export const insertInspectionAssignmentSchema = createInsertSchema(inspectionAssignments).pick({
  inspectionId: true,
  locationId: true,
  assignedUserId: true,
  status: true,
  totalQuestions: true,
  answeredQuestions: true,
  progressPercentage: true,
  totalPossibleScore: true,
  actualScore: true,
  scorePercentage: true,
  letterGrade: true,
  notes: true,
});

export const insertInspectionResponseSchema = createInsertSchema(inspectionResponses).pick({
  assignmentId: true,
  questionId: true,
  answer: true,
  score: true,
  notes: true,
  photos: true,
  documents: true,
}).extend({
  answer: z.enum(["Karşılıyor", "Kısmen Karşılıyor", "Karşılamıyor", "Kapsam Dışı"]),
});

// Types
export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;

export type InspectionAssignment = typeof inspectionAssignments.$inferSelect;
export type InsertInspectionAssignment = z.infer<typeof insertInspectionAssignmentSchema>;

export type InspectionResponse = typeof inspectionResponses.$inferSelect;
export type InsertInspectionResponse = z.infer<typeof insertInspectionResponseSchema>;