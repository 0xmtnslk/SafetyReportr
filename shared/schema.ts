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
  
  // Extended Profile Information
  firstName: text("first_name"), // Adı
  lastName: text("last_name"), // Soyadı
  registrationDate: timestamp("registration_date"), // Kayıt Tarihi
  certificateNumber: text("certificate_number"), // Belge No (İGU-287183)
  safetySpecialistClass: text("safety_specialist_class"), // A Sınıfı İş Güvenliği Uzmanı, B Sınıfı İş Güvenliği Uzmanı, C Sınıfı İş Güvenliği Uzmanı
  
  // Contact Information
  phone2: text("phone2"), // Second phone number
  mobilPhone1: text("mobil_phone1"), // Mobile phone 1
  mobilPhone2: text("mobil_phone2"), // Mobile phone 2
  
  // Address Information
  province: text("province"), // İl
  district: text("district"), // İlçe
  postalCode: text("postal_code"), // Posta Kodu
  address: text("address"), // Full address
  
  
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
  
  // İSG Specific Fields
  naceCode: text("nace_code"), // NACE Kodu
  dangerClass: text("danger_class"), // Tehlike Sınıfı: "Çok Tehlikeli", "Tehlikeli", "Az Tehlikeli"
  sgkRegistrationNumber: text("sgk_registration_number"), // SGK Sicil Numarası
  
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
  
  // Assignment details
  assignedBy: varchar("assigned_by").references(() => users.id).notNull(), // Who assigned this
  dueDate: timestamp("due_date").notNull(), // Assignment deadline
  
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

// RISK ASSESSMENT SYSTEM - Fine-Kinney Method Implementation

// Hospital Departments/Units - Managed by specialists
export const hospitalDepartments = pgTable("hospital_departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  name: text("name").notNull(), // e.g., "Acil Servis", "Ameliyathane"
  isDefault: boolean("is_default").default(false), // Predefined departments vs custom added
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Risk Categories - Main categories (Admin managed)
export const riskCategories = pgTable("risk_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // e.g., "Tıbbi Hizmetler", "Yönetsel Hizmetler"
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Risk Sub-Categories - Under main categories (Admin managed)
export const riskSubCategories = pgTable("risk_sub_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => riskCategories.id).notNull(),
  name: text("name").notNull(), // e.g., "Hizmete erişim ile ilgili riskler"
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Risk Assessments - Main assessment records using Fine-Kinney method
export const riskAssessments = pgTable("risk_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  departmentId: varchar("department_id").references(() => hospitalDepartments.id).notNull(),
  assessorId: varchar("assessor_id").references(() => users.id).notNull(), // Safety specialist
  
  // Basic Information
  assessmentNumber: text("assessment_number").notNull().unique(), // Auto-generated
  detectionDate: timestamp("detection_date").notNull(),
  categoryId: varchar("category_id").references(() => riskCategories.id).notNull(),
  subCategoryId: varchar("sub_category_id").references(() => riskSubCategories.id).notNull(),
  
  // Risk Details
  area: text("area"), // Equipment, location, etc.
  activity: text("activity"), // Work or incident description  
  hazard: text("hazard"), // Identified hazard - optional field
  risk: text("risk"), // Associated risk - optional field
  potentialConsequence: text("potential_consequence"), // Possible harm/damage
  hazardDescription: text("hazard_description").notNull(), // Required hazard description
  riskSituation: text("risk_situation").notNull(), // Required risk situation
  
  // Affected Persons
  affectedPersons: jsonb("affected_persons").$type<string[]>().default([]), 
  // Array of: "Doktor", "Hemşire", "YSP", "Teknisyen", "Hasta", "Hasta Yakını", "Çalışan", "Ziyaretçi", "Diğer"
  otherAffectedPersons: text("other_affected_persons"), // If "Diğer" is selected
  
  // Current State
  currentStateDescription: text("current_state_description").notNull(),
  currentStateImages: jsonb("current_state_images").$type<string[]>().default([]),
  
  // Fine-Kinney Current Risk Score
  currentProbability: integer("current_probability").notNull(), // 0.2, 0.5, 1, 3, 6, 10
  currentFrequency: integer("current_frequency").notNull(), // 0.5, 1, 2, 3, 6, 10
  currentSeverity: integer("current_severity").notNull(), // 1, 3, 7, 15, 40, 100
  currentRiskScore: integer("current_risk_score").notNull(), // P*F*S
  currentRiskLevel: text("current_risk_level").notNull(), // Based on score ranges
  currentRiskColor: text("current_risk_color").notNull(), // Color coding
  
  // Improvement Plan
  improvementMeasures: text("improvement_measures").notNull(), // Actions to take
  improvementResponsible: text("improvement_responsible").notNull(), // Person responsible
  targetDate: timestamp("target_date").notNull(), // Deadline for improvement
  
  // Status
  status: text("status").notNull().default("open"), // open, in_progress, completed
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Risk Improvements - Improvement tracking and post-assessment
export const riskImprovements = pgTable("risk_improvements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").references(() => riskAssessments.id).notNull(),
  
  // Improvement Implementation
  improvementDescription: text("improvement_description").notNull(), // What was done
  completionDate: timestamp("completion_date").notNull(), // When completed
  postImprovementImages: jsonb("post_improvement_images").$type<string[]>().default([]),
  
  // Post-Improvement Fine-Kinney Risk Score
  postProbability: integer("post_probability").notNull(), // New probability after improvement
  postFrequency: integer("post_frequency").notNull(), // New frequency after improvement
  postSeverity: integer("post_severity").notNull(), // New severity after improvement
  postRiskScore: integer("post_risk_score").notNull(), // New P*F*S
  postRiskLevel: text("post_risk_level").notNull(), // New risk level
  postRiskColor: text("post_risk_color").notNull(), // New color coding
  
  // Effectiveness Measurement
  effectivenessMeasurement: text("effectiveness_measurement").notNull(), 
  // "Gösterge takibi", "Belgelendirme (Rapor, Tatbikat, Kayıt v.b.)", "Sınav/Değerlendirme", "Diğer"
  effectivenessOther: text("effectiveness_other"), // If "Diğer" selected
  controlResponsible: text("control_responsible").notNull(), // Person responsible for control
  result: text("result").notNull(), // Final result/outcome
  relatedRegulation: text("related_regulation"), // Related laws/regulations
  
  // System fields  
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Regulation library for auto-complete (built from user inputs)
export const regulations = pgTable("regulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull().unique(), // Regulation/law title
  usageCount: integer("usage_count").default(1), // How many times it's been used
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
  firstName: true,
  lastName: true,
  registrationDate: true,
  certificateNumber: true,
  safetySpecialistClass: true,
  phone2: true,
  mobilPhone1: true,
  mobilPhone2: true,
  province: true,
  district: true,
  postalCode: true,
  address: true,
  isActive: true,
}).extend({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Telefon numarası en az 10 karakter olmalıdır"),
  safetySpecialistClass: z.enum(["A", "B", "C"]).optional(),
  registrationDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]).optional(),
});

// User profile editing schema (excludes system fields and sensitive information)
export const editUserProfileSchema = createInsertSchema(users).pick({
  fullName: true,
  email: true,
  phone: true,
  profileImage: true,
  firstName: true,
  lastName: true,
  certificateNumber: true,
  safetySpecialistClass: true,
  phone2: true,
  mobilPhone1: true,
  mobilPhone2: true,
  province: true,
  district: true,
  postalCode: true,
  address: true,
}).extend({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Telefon numarası en az 10 karakter olmalıdır"),
  safetySpecialistClass: z.enum(["A", "B", "C"]).optional(),
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
  assignedBy: true,
  dueDate: true,
  status: true,
  totalQuestions: true,
  answeredQuestions: true,
  progressPercentage: true,
  totalPossibleScore: true,
  actualScore: true,
  scorePercentage: true,
  letterGrade: true,
  notes: true,
}).extend({
  dueDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]),
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

// Risk Assessment insert schemas
export const insertHospitalDepartmentSchema = createInsertSchema(hospitalDepartments).pick({
  locationId: true,
  name: true,
  isDefault: true,
});

export const insertRiskCategorySchema = createInsertSchema(riskCategories).pick({
  name: true,
  orderIndex: true,
  isActive: true,
});

export const insertRiskSubCategorySchema = createInsertSchema(riskSubCategories).pick({
  categoryId: true,
  name: true,
  orderIndex: true,
  isActive: true,
});

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).pick({
  locationId: true,
  departmentId: true,
  detectionDate: true,
  categoryId: true,
  subCategoryId: true,
  area: true,
  activity: true,
  hazard: true,
  risk: true,
  potentialConsequence: true,
  affectedPersons: true,
  otherAffectedPersons: true,
  currentStateDescription: true,
  currentStateImages: true,
  currentProbability: true,
  currentFrequency: true,
  currentSeverity: true,
  improvementMeasures: true,
  improvementResponsible: true,
  targetDate: true,
  status: true,
  priority: true,
}).extend({
  detectionDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]),
  targetDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]),
  affectedPersons: z.array(z.string()).default([]),
  currentProbability: z.number().refine(val => [0.2, 0.5, 1, 3, 6, 10].includes(val), {
    message: "Geçersiz olasılık değeri"
  }),
  currentFrequency: z.number().refine(val => [0.5, 1, 2, 3, 6, 10].includes(val), {
    message: "Geçersiz frekans değeri"
  }),
  currentSeverity: z.number().refine(val => [1, 3, 7, 15, 40, 100].includes(val), {
    message: "Geçersiz şiddet değeri"
  }),
});

export const insertRiskImprovementSchema = createInsertSchema(riskImprovements).pick({
  assessmentId: true,
  improvementDescription: true,
  completionDate: true,
  postImprovementImages: true,
  postProbability: true,
  postFrequency: true,
  postSeverity: true,
  effectivenessMeasurement: true,
  effectivenessOther: true,
  controlResponsible: true,
  result: true,
  relatedRegulation: true,
}).extend({
  completionDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]),
  postProbability: z.number().refine(val => [0.2, 0.5, 1, 3, 6, 10].includes(val), {
    message: "Geçersiz olasılık değeri"
  }),
  postFrequency: z.number().refine(val => [0.5, 1, 2, 3, 6, 10].includes(val), {
    message: "Geçersiz frekans değeri"
  }),
  postSeverity: z.number().refine(val => [1, 3, 7, 15, 40, 100].includes(val), {
    message: "Geçersiz şiddet değeri"
  }),
  effectivenessMeasurement: z.enum([
    "Gösterge takibi", 
    "Belgelendirme (Rapor, Tatbikat, Kayıt v.b.)", 
    "Sınav/Değerlendirme", 
    "Diğer"
  ]),
});

export const insertRegulationSchema = createInsertSchema(regulations).pick({
  title: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type EditUserProfile = z.infer<typeof editUserProfileSchema>;

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

// Risk Assessment types
export type HospitalDepartment = typeof hospitalDepartments.$inferSelect;
export type InsertHospitalDepartment = z.infer<typeof insertHospitalDepartmentSchema>;

export type RiskCategory = typeof riskCategories.$inferSelect;
export type InsertRiskCategory = z.infer<typeof insertRiskCategorySchema>;

export type RiskSubCategory = typeof riskSubCategories.$inferSelect;
export type InsertRiskSubCategory = z.infer<typeof insertRiskSubCategorySchema>;

export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;

export type RiskImprovement = typeof riskImprovements.$inferSelect;
export type InsertRiskImprovement = z.infer<typeof insertRiskImprovementSchema>;

export type Regulation = typeof regulations.$inferSelect;
export type InsertRegulation = z.infer<typeof insertRegulationSchema>;

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

// FINE-KINNEY RISK ASSESSMENT CONSTANTS

// Hospital departments (predefined list)
export const DEFAULT_HOSPITAL_DEPARTMENTS = [
  "Acil Servis",
  "Ameliyathane",
  "Arşiv",
  "Atık Alanları",
  "Bilgi Sistemleri",
  "Biyomedikal",
  "CCTV Odası",
  "Doğumhane",
  "Eczane",
  "Endoskopi",
  "Girişimsel Radyoloji",
  "İdari Ofisler",
  "Kan Alma",
  "Laboratuvar (Biyokimya)",
  "Laboratuvar (Mkirobiyoloji)",
  "Laboratuvar (Patoloji)",
  "Laboratuvar (PCR)",
  "Merkezi Sterilizasyon Ünitesi",
  "Morg",
  "Mutfak",
  "Nükleer Tıp",
  "Organ Nakli",
  "Otopark (Açık)",
  "Otopark (Kapalı)",
  "Poliklinikler",
  "Radyasyon Onkolojisi",
  "Radyoloji",
  "Santral / Çağrı Merkezi",
  "Server Odası",
  "Teknik Alanlar",
  "Toplanma Alanı",
  "Transfüzyon Merkezi",
  "Tüp Bebek (IVF)",
  "Yatan Hasta Katı",
  "Yemekhane",
  "Yoğun Bakım (Erişkin)",
  "Yoğun Bakım (KVC)",
  "Yoğun Bakım (NICU)",
  "Yoğun Bakım (Pediyatrik)",
  "Yoğun Bakım (Yenidoğan)",
  "Diğer"
] as const;

// Fine-Kinney Probability (Olasılık) Scale
export const FINE_KINNEY_PROBABILITY = [
  { value: 10, label: "Beklenir, kesin" },
  { value: 6, label: "Yüksek, oldukça mümkün" },
  { value: 3, label: "Olası" },
  { value: 1, label: "Mümkün fakat düşük" },
  { value: 0.5, label: "Beklenmez fakat mümkün" },
  { value: 0.2, label: "Beklenmez" }
] as const;

// Fine-Kinney Frequency (Frekans) Scale  
export const FINE_KINNEY_FREQUENCY = [
  { value: 10, label: "Hemen hemen sürekli (bir saatte birkaç defa)" },
  { value: 6, label: "Sık (günde bir veya birkaç defa)" },
  { value: 3, label: "Ara sıra (haftada bir veya birkaç defa)" },
  { value: 2, label: "Sık değil (ayda bir veya birkaç defa)" },
  { value: 1, label: "Seyrek (yılda birkaç defa)" },
  { value: 0.5, label: "Çok seyrek (yılda bir veya daha seyrek)" }
] as const;

// Fine-Kinney Severity (Şiddet) Scale
export const FINE_KINNEY_SEVERITY = [
  { value: 100, label: "Birden fazla ölümlü kaza / Çevresel Felaket" },
  { value: 40, label: "Öldürücü kaza / Ciddi çevresel zarar" },
  { value: 15, label: "Kalıcı hasar - Yaralanma, İş kaybı / Çevresel engel oluşturma, Yakın çevreden şikayet" },
  { value: 7, label: "Önemli hasar / Yaralanma, Dış ilkyardım ihtiyacı / Arazi sınırları dışında çevresel zarar" },
  { value: 3, label: "Küçük hasar / Yaralanma, dahili ilkyardım / Arazi sınırları içinde çevresel zarar" },
  { value: 1, label: "Ucuz atlatma / Çevresel zarar yok" }
] as const;

// Risk Level Categories based on Fine-Kinney score
export const FINE_KINNEY_RISK_LEVELS = [
  { 
    min: 400, 
    max: Infinity, 
    level: "Tolerans Gösterilemez Risk", 
    color: "bg-red-900",
    textColor: "text-white",
    description: "Hemen gerekli önlemler alınmalı veya tesis, bina ve çevrenin kapatılması düşünülmelidir"
  },
  { 
    min: 200, 
    max: 399, 
    level: "Yüksek Risk", 
    color: "bg-red-500",
    textColor: "text-white", 
    description: "Kısa dönemde iyileştirilmelidir (birkaç ay içinde)"
  },
  { 
    min: 70, 
    max: 199, 
    level: "Önemli Risk", 
    color: "bg-orange-500",
    textColor: "text-white",
    description: "Uzun dönemde iyileştirilmelidir (yıl içinde)"
  },
  { 
    min: 20, 
    max: 69, 
    level: "Olası Risk", 
    color: "bg-yellow-600",
    textColor: "text-white",
    description: "Gözetim altında uygulanmalıdır"
  },
  { 
    min: 0.1, 
    max: 19, 
    level: "Düşük Risk", 
    color: "bg-green-500",
    textColor: "text-white",
    description: "Önlem öncelikli değildir"
  }
] as const;

// Affected persons options
export const AFFECTED_PERSONS_OPTIONS = [
  "Doktor",
  "Hemşire", 
  "YSP",
  "Teknisyen",
  "Hasta",
  "Hasta Yakını",
  "Çalışan",
  "Ziyaretçi",
  "Diğer"
] as const;

// Effectiveness measurement options
export const EFFECTIVENESS_MEASUREMENT_OPTIONS = [
  "Gösterge takibi",
  "Belgelendirme (Rapor, Tatbikat, Kayıt v.b.)",
  "Sınav/Değerlendirme",
  "Diğer"
] as const;

// Risk assessment status options
export const RISK_ASSESSMENT_STATUS_OPTIONS = [
  { value: "open", label: "Açık" },
  { value: "in_progress", label: "Devam Ediyor" },
  { value: "completed", label: "Tamamlandı" }
] as const;

// Risk assessment priority options
export const RISK_ASSESSMENT_PRIORITY_OPTIONS = [
  { value: "low", label: "Düşük", color: "bg-blue-100 text-blue-800" },
  { value: "medium", label: "Orta", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "Yüksek", color: "bg-orange-100 text-orange-800" },
  { value: "critical", label: "Kritik", color: "bg-red-100 text-red-800" }
] as const;

// Fine-Kinney calculation function
export const calculateFineKinneyScore = (probability: number, frequency: number, severity: number): number => {
  return probability * frequency * severity;
};

// Get risk level from Fine-Kinney score
export const getFineKinneyRiskLevel = (score: number) => {
  return FINE_KINNEY_RISK_LEVELS.find(level => score >= level.min && score <= level.max) || FINE_KINNEY_RISK_LEVELS[FINE_KINNEY_RISK_LEVELS.length - 1];
};

export const OLD_EVALUATION_OPTIONS = [
  "Karşılıyor",
  "Kısmen Karşılıyor", 
  "Karşılamıyor",
  "Kapsam Dışı"
] as const;