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

// Notification System
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'inspection_assigned', 'inspection_completed', 'inspection_overdue', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: varchar("related_id"), // ID of inspection/assignment/etc.
  relatedType: text("related_type"), // 'inspection', 'assignment', etc.
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
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

// NEW: Inspection Management System
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

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  relatedId: true,
  relatedType: true,
});

export const insertOfflineQueueSchema = createInsertSchema(offlineQueue).pick({
  userId: true,
  action: true,
  entityType: true,
  entityId: true,
  data: true,
});

// Checklist insert schemas
export const insertChecklistTemplateSchema = createInsertSchema(checklistTemplates).pick({
  name: true,
  description: true,
  templateNumber: true,
  category: true,
  type: true,
  version: true,
  isActive: true,
});

export const insertChecklistSectionSchema = createInsertSchema(checklistSections).pick({
  templateId: true,
  name: true,
  description: true,
  orderIndex: true,
  isActive: true,
});

export const insertChecklistQuestionSchema = createInsertSchema(checklistQuestions).pick({
  sectionId: true,
  questionText: true,
  orderIndex: true,
  twScore: true,
  category: true,
  isRequired: true,
  allowPhoto: true,
  allowDocument: true,
  isActive: true,
}).extend({
  twScore: z.number().min(1).max(10),
  category: z.enum([
    "Afet ve Acil Durum Yönetimi",
    "Altyapı", 
    "Emniyet",
    "Güvenlik",
    "Tıbbi Cihaz Yönetimi",
    "Malzeme-Cihaz Yönetimi",
    "Tehlikeli Madde Yönetimi",
    "Atık Yönetimi",
    "Yangın Güvenliği",
    "Elektrik",
    "Genel"
  ]),
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
  answer: true,
  score: true,
  notes: true,
  photos: true,
  documents: true,
}).extend({
  answer: z.enum(["Karşılıyor", "Kısmen Karşılıyor", "Karşılamıyor", "Kapsam Dışı"]),
  assignmentId: z.string().optional(), // Made optional since it comes from URL params
  questionId: z.string().optional(), // Made optional since it comes from URL params
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Finding = typeof findings.$inferSelect;
export type InsertFinding = z.infer<typeof insertFindingSchema>;

export type OfflineQueueItem = typeof offlineQueue.$inferSelect;
export type InsertOfflineQueueItem = z.infer<typeof insertOfflineQueueSchema>;

// Checklist types
export type ChecklistTemplate = typeof checklistTemplates.$inferSelect;
export type InsertChecklistTemplate = z.infer<typeof insertChecklistTemplateSchema>;

export type ChecklistSection = typeof checklistSections.$inferSelect;
export type InsertChecklistSection = z.infer<typeof insertChecklistSectionSchema>;

export type ChecklistQuestion = typeof checklistQuestions.$inferSelect;
export type InsertChecklistQuestion = z.infer<typeof insertChecklistQuestionSchema>;

// Inspection types
export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;

export type InspectionAssignment = typeof inspectionAssignments.$inferSelect;
export type InsertInspectionAssignment = z.infer<typeof insertInspectionAssignmentSchema>;

export type InspectionResponse = typeof inspectionResponses.$inferSelect;
export type InsertInspectionResponse = z.infer<typeof insertInspectionResponseSchema>;

// Notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Utility functions
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