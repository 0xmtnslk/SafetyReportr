import { 
  reports, findings, users, offlineQueue, locations, notifications,
  checklistTemplates, checklistSections, checklistQuestions, inspections, inspectionAssignments, inspectionResponses,
  type User, type InsertUser, type Report, type InsertReport, type Finding, type InsertFinding, 
  type OfflineQueueItem, type InsertOfflineQueueItem, type Location, type InsertLocation,
  type ChecklistTemplate, type InsertChecklistTemplate, type ChecklistSection, type InsertChecklistSection,
  type ChecklistQuestion, type InsertChecklistQuestion, 
  type Inspection, type InsertInspection, type InspectionAssignment, type InsertInspectionAssignment,
  type InspectionResponse, type InsertInspectionResponse, type Notification, type InsertNotification,
  calculateQuestionScore, calculateLetterGrade
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql, gt, or, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(username: string, password: string): Promise<User | null>;
  validateUserCredentials(username: string, password: string): Promise<User | null>;
  
  // User management (Admin operations)
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  changePassword(id: string, newPassword: string): Promise<boolean>;
  setResetToken(id: string, token: string, expiry: Date): Promise<boolean>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  setFirstLoginComplete(id: string): Promise<boolean>;

  // Report operations
  getReport(id: string): Promise<Report | undefined>;
  getAllReports(): Promise<Report[]>;
  getReportsByLocation(location: string): Promise<Report[]>;
  getUserReports(userId: string): Promise<Report[]>;
  getUserAccessibleReports(userId: string, userLocation: string): Promise<Report[]>;
  createReport(report: InsertReport & { userId: string }): Promise<Report>;
  updateReport(id: string, report: Partial<InsertReport>): Promise<Report>;
  deleteReport(id: string): Promise<boolean>;

  // Finding operations
  getFinding(id: string): Promise<Finding | undefined>;
  getReportFindings(reportId: string): Promise<Finding[]>;
  createFinding(finding: InsertFinding): Promise<Finding>;
  updateFinding(id: string, finding: Partial<InsertFinding>): Promise<Finding>;
  deleteFinding(id: string): Promise<boolean>;

  // Offline sync operations
  addOfflineQueueItem(item: InsertOfflineQueueItem & { userId: string }): Promise<OfflineQueueItem>;
  addToOfflineQueue(item: InsertOfflineQueueItem): Promise<OfflineQueueItem>;
  getUnprocessedOfflineItems(userId: string): Promise<OfflineQueueItem[]>;
  getOfflineQueue(): Promise<OfflineQueueItem[]>;
  markOfflineItemProcessed(id: string): Promise<boolean>;

  // Statistics
  getReportStats(userId: string): Promise<{
    totalReports: number;
    highRiskFindings: number;
    mediumRiskFindings: number;
    completedFindings: number;
    completedReports: number;
  }>;
  getLocationStats(location: string): Promise<{
    totalReports: number;
    highRiskFindings: number;
    mediumRiskFindings: number;
    completedFindings: number;
    completedReports: number;
  }>;
  getUserLocationStats(userId: string, userLocation: string): Promise<{
    totalReports: number;
    highRiskFindings: number;
    mediumRiskFindings: number;
    completedFindings: number;
    completedReports: number;
  }>;
  getStats(): Promise<{
    totalReports: number;
    highRiskFindings: number;
    mediumRiskFindings: number;
    completedFindings: number;
    completedReports: number;
  }>;

  // Location/Hospital operations
  getAllLocations(): Promise<Location[]>;
  getLocationById(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation & { createdBy: string }): Promise<Location>;
  updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | null>;
  deleteLocation(id: string): Promise<boolean>;
  getUsersByLocationId(locationId: string): Promise<User[]>;

  // Checklist Template operations
  getAllChecklistTemplates(): Promise<ChecklistTemplate[]>;
  getChecklistTemplate(id: string): Promise<ChecklistTemplate | undefined>;
  createChecklistTemplate(template: InsertChecklistTemplate & { createdBy: string }): Promise<ChecklistTemplate>;
  updateChecklistTemplate(id: string, template: Partial<InsertChecklistTemplate>): Promise<ChecklistTemplate>;
  deleteChecklistTemplate(id: string): Promise<boolean>;

  // Checklist Section operations
  getTemplateSections(templateId: string): Promise<ChecklistSection[]>;
  getChecklistSection(id: string): Promise<ChecklistSection | undefined>;
  createChecklistSection(section: InsertChecklistSection): Promise<ChecklistSection>;
  updateChecklistSection(id: string, section: Partial<InsertChecklistSection>): Promise<ChecklistSection>;
  deleteChecklistSection(id: string): Promise<boolean>;

  // Checklist Question operations
  getSectionQuestions(sectionId: string): Promise<ChecklistQuestion[]>;
  getChecklistQuestion(id: string): Promise<ChecklistQuestion | undefined>;
  createChecklistQuestion(question: InsertChecklistQuestion): Promise<ChecklistQuestion>;
  updateChecklistQuestion(id: string, question: Partial<InsertChecklistQuestion>): Promise<ChecklistQuestion>;
  deleteChecklistQuestion(id: string): Promise<boolean>;

  // Checklist Inspection operations
  getAllChecklistInspections(): Promise<ChecklistInspection[]>;
  getChecklistInspection(id: string): Promise<ChecklistInspection | undefined>;
  getLocationInspections(locationId: string): Promise<ChecklistInspection[]>;
  getInspectorInspections(inspectorId: string): Promise<ChecklistInspection[]>;
  createChecklistInspection(inspection: InsertChecklistInspection & { inspectorId: string }): Promise<ChecklistInspection>;
  updateChecklistInspection(id: string, inspection: Partial<InsertChecklistInspection>): Promise<ChecklistInspection>;
  deleteChecklistInspection(id: string): Promise<boolean>;

  // Checklist Answer operations
  getInspectionAnswers(inspectionId: string): Promise<ChecklistAnswer[]>;
  getChecklistAnswer(id: string): Promise<ChecklistAnswer | undefined>;
  createChecklistAnswer(answer: InsertChecklistAnswer): Promise<ChecklistAnswer>;
  updateChecklistAnswer(id: string, answer: Partial<InsertChecklistAnswer>): Promise<ChecklistAnswer>;
  deleteChecklistAnswer(id: string): Promise<boolean>;
  calculateInspectionScore(inspectionId: string): Promise<{
    totalScore: number;
    maxPossibleScore: number;
    successPercentage: number;
    letterGrade: string;
  }>;
  
  // Assignment system
  createChecklistAssignment(assignment: InsertChecklistAssignment & { assignedBy: string }): Promise<ChecklistAssignment>;
  getChecklistAssignments(): Promise<ChecklistAssignment[]>;
  getChecklistAssignmentById(id: string): Promise<ChecklistAssignment | null>;
  getAssignmentsForHospital(hospitalId: string): Promise<ChecklistAssignment[]>;
  getAssignmentsForUser(userId: string): Promise<ChecklistAssignment[]>;
  updateChecklistAssignment(id: string, updates: Partial<InsertChecklistAssignment>): Promise<ChecklistAssignment | null>;
  updateAssignmentStatus(assignmentId: string, status: string): Promise<ChecklistAssignment>;
  deleteChecklistAssignment(assignmentId: string): Promise<boolean>;
  
  // Assignment to Inspection operations
  getInspectionByAssignmentId(assignmentId: string): Promise<ChecklistInspection | null>;
  createInspectionFromAssignment(data: {
    assignmentId: string;
    templateId: string;
    inspectorId: string;
    locationId: string;
    title: string;
    description: string;
    dueDate: string;
  }): Promise<ChecklistInspection>;
  
  // Submission system
  createChecklistSubmission(submission: InsertChecklistSubmission & { submittedBy: string }): Promise<ChecklistSubmission>;
  getAssignmentSubmissions(assignmentId: string): Promise<ChecklistSubmission[]>;
  
  // NEW: Inspection Management System
  // Inspection operations
  getAllInspections(): Promise<Inspection[]>;
  getInspection(id: string): Promise<Inspection | undefined>;
  createInspection(inspection: InsertInspection & { createdBy: string }): Promise<Inspection>;
  updateInspection(id: string, inspection: Partial<InsertInspection>): Promise<Inspection>;
  deleteInspection(id: string): Promise<boolean>;
  
  // Assignment operations
  getInspectionAssignments(inspectionId: string): Promise<InspectionAssignment[]>;
  getInspectionAssignment(id: string): Promise<InspectionAssignment | undefined>;
  getUserAssignments(userId: string): Promise<InspectionAssignment[]>;
  createInspectionAssignment(assignment: InsertInspectionAssignment): Promise<InspectionAssignment>;
  updateInspectionAssignment(id: string, assignment: Partial<InsertInspectionAssignment>): Promise<InspectionAssignment>;
  
  // Response operations
  getInspectionResponses(assignmentId: string): Promise<InspectionResponse[]>;
  getInspectionResponse(assignmentId: string, questionId: string): Promise<InspectionResponse | undefined>;
  createInspectionResponse(response: InsertInspectionResponse): Promise<InspectionResponse>;
  updateInspectionResponse(id: string, response: Partial<InsertInspectionResponse>): Promise<InspectionResponse>;
  
  // Assignment workflow
  startInspection(assignmentId: string, userId: string): Promise<boolean>;
  submitInspectionResponse(assignmentId: string, questionId: string, response: InsertInspectionResponse): Promise<InspectionResponse>;
  completeInspection(assignmentId: string, userId: string): Promise<boolean>;
  getAllCompletedInspections(): Promise<InspectionAssignment[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;
  getNotificationCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  // User Management Functions
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User> {
    const updateData = { ...updateUser };
    
    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    // First delete all inspection assignments for this user
    await db.delete(inspectionAssignments).where(eq(inspectionAssignments.assignedUserId, id));
    
    // Delete all notifications for this user
    await db.delete(notifications).where(eq(notifications.userId, id));
    
    // Then delete the user
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async changePassword(id: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        firstLogin: false,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async setResetToken(id: string, token: string, expiry: Date): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        resetToken: token,
        resetTokenExpiry: expiry,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.resetToken, token),
        gt(users.resetTokenExpiry, new Date())
      )
    );
    return user;
  }

  async setFirstLoginComplete(id: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        firstLogin: false,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async validateUserCredentials(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    return this.validateUserCredentials(username, password);
  }

  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getUserReports(userId: string): Promise<Report[]> {
    return await db.select().from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt));
  }

  async getReportsByLocation(location: string): Promise<Report[]> {
    return await db.select().from(reports)
      .where(eq(reports.projectLocation, location))
      .orderBy(desc(reports.createdAt));
  }

  async getUserAccessibleReports(userId: string, userLocation: string): Promise<Report[]> {
    return await db.select().from(reports)
      .where(or(
        eq(reports.userId, userId),
        eq(reports.projectLocation, userLocation)
      ))
      .orderBy(desc(reports.createdAt));
  }

  async createReport(report: InsertReport & { userId: string }): Promise<Report> {
    // Generate automatic report number if not provided or ensure uniqueness
    let reportNumber = report.reportNumber;
    if (!reportNumber || await this.isReportNumberExists(reportNumber)) {
      reportNumber = await this.generateUniqueReportNumber();
    }
    
    const [newReport] = await db
      .insert(reports)
      .values({
        ...report,
        reportNumber
      })
      .returning();
    
    // Copy unresolved findings from the latest report
    await this.copyUnresolvedFindings(newReport.id, report.userId);
    
    return newReport;
  }
  
  // Helper function to check if report number exists
  async isReportNumberExists(reportNumber: string): Promise<boolean> {
    const [existing] = await db
      .select({ id: reports.id })
      .from(reports)
      .where(eq(reports.reportNumber, reportNumber))
      .limit(1);
    return !!existing;
  }

  // Generate unique report number in format YYYY-XXX
  async generateUniqueReportNumber(): Promise<string> {
    const year = new Date().getFullYear();
    
    // Get the latest report number for this year
    const allReports = await db
      .select({ reportNumber: reports.reportNumber })
      .from(reports)
      .orderBy(desc(reports.reportNumber));
    
    // Filter reports for current year
    const latestReport = allReports.filter(report => 
      report.reportNumber.startsWith(year.toString())
    );
    
    let nextNumber = 1;
    
    if (latestReport.length > 0) {
      const currentNumber = latestReport[0].reportNumber;
      const parts = currentNumber.split('-');
      if (parts.length === 2 && parts[0] === year.toString()) {
        nextNumber = parseInt(parts[1]) + 1;
      }
    }
    
    // Ensure we have a 3-digit number (001, 002, etc.)
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    const newReportNumber = `${year}-${formattedNumber}`;
    
    // Double-check uniqueness
    if (await this.isReportNumberExists(newReportNumber)) {
      // If by any chance it exists, try next number
      return this.generateUniqueReportNumber();
    }
    
    return newReportNumber;
  }
  
  async copyUnresolvedFindings(newReportId: string, userId: string) {
    console.log(`🔄 Yeni rapor için çözülmemiş bulgular kopyalanıyor: ${newReportId}`);
    
    // Kullanıcının önceki raporlarını al (yeni oluşturulan hariç)
    const userReports = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt));
    
    // En son raporu bul (yeni oluşturulan rapor değil)
    const latestReport = userReports.find(report => report.id !== newReportId);
    
    if (!latestReport) {
      console.log('ℹ️  Önceki rapor bulunamadı, bulgu kopyalama atlanıyor');
      return;
    }
    
    console.log(`📋 Önceki rapor bulundu: ${latestReport.reportNumber}`);
    
    // Önceki rapordan YÜKSEK ve ORTA risk seviyesindeki, TÜMAMLANMAMıŞ bulgular
    const unresolvedFindings = await db
      .select()
      .from(findings)
      .where(
        and(
          eq(findings.reportId, latestReport.id),
          inArray(findings.dangerLevel, ['high', 'medium']),
          eq(findings.isCompleted, false)
        )
      );
    
    console.log(`🎯 ${unresolvedFindings.length} adet çözülmemiş yüksek/orta risk bulgusu bulundu`);
    
    if (unresolvedFindings.length > 0) {
      const todayDate = new Date().toISOString().split('T')[0];
      
      const findingsToInsert = unresolvedFindings.map(finding => {
        // Önceki süreç adımlarını kopyala ve geçiş notu ekle
        const existingSteps = (finding.processSteps as Array<{date: string, description: string}>) || [];
        const transitionStep = {
          date: todayDate,
          description: `📄 Bu bulgu ${latestReport.reportNumber} raporundan devralındı - Durum kontrolü ve güncelleme gerekli`
        };
        
        return {
          reportId: newReportId,
          section: finding.section,
          title: finding.title,
          dangerLevel: finding.dangerLevel,
          currentSituation: finding.currentSituation,
          legalBasis: finding.legalBasis,
          recommendation: finding.recommendation,
          images: finding.images || [],
          processSteps: [...existingSteps, transitionStep],
          isCompleted: false
        };
      });
      
      await db.insert(findings).values(findingsToInsert as any);
      console.log(`✅ ${findingsToInsert.length} bulgu başarıyla yeni rapora kopyalandı`);
    }
  }

  async updateReport(id: string, report: Partial<InsertReport>): Promise<Report> {
    const [updatedReport] = await db
      .update(reports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteReport(id: string): Promise<boolean> {
    // Önce raporun durumunu kontrol et - sadece taslak ve devam eden raporlar silinebilir
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    
    if (!report) {
      console.log(`❌ Silinmeye çalışılan rapor bulunamadı: ${id}`);
      return false;
    }
    
    if (report.status === 'completed') {
      console.log(`🚫 Tamamlanmış rapor silinemez: ${report.reportNumber} (${report.status})`);
      throw new Error('Tamamlanmış raporlar silinemez');
    }
    
    console.log(`🗑️ Rapor siliniyor: ${report.reportNumber} (Durum: ${report.status})`);
    
    // Önce rapor bulgularını sil
    await db.delete(findings).where(eq(findings.reportId, id));
    
    // Sonra raporu sil
    const result = await db.delete(reports).where(eq(reports.id, id));
    
    const success = (result.rowCount || 0) > 0;
    if (success) {
      console.log(`✅ Rapor başarıyla silindi: ${report.reportNumber}`);
    }
    
    return success;
  }

  async getFinding(id: string): Promise<Finding | undefined> {
    const [finding] = await db.select().from(findings).where(eq(findings.id, id));
    return finding;
  }

  async getReportFindings(reportId: string): Promise<Finding[]> {
    return await db.select().from(findings)
      .where(eq(findings.reportId, reportId))
      .orderBy(
        // Risk seviyesine göre sıralama: high (1) -> medium (2) -> low (3)
        sql`CASE 
          WHEN ${findings.dangerLevel} = 'high' THEN 1 
          WHEN ${findings.dangerLevel} = 'medium' THEN 2 
          WHEN ${findings.dangerLevel} = 'low' THEN 3 
          ELSE 4 
        END ASC`,
        desc(findings.createdAt) // Aynı risk seviyesinde tarihe göre
      );
  }

  async createFinding(finding: InsertFinding): Promise<Finding> {
    const [newFinding] = await db
      .insert(findings)
      .values({
        ...finding,
        images: finding.images || [],
        processSteps: finding.processSteps || [],
        isCompleted: finding.isCompleted || false
      } as any)
      .returning();
    return newFinding;
  }

  async updateFinding(id: string, finding: Partial<InsertFinding>): Promise<Finding> {
    const [updatedFinding] = await db
      .update(findings)
      .set({ 
        ...finding, 
        updatedAt: new Date(),
        images: finding.images ? [...finding.images] : undefined,
        processSteps: finding.processSteps ? [...finding.processSteps] : undefined
      })
      .where(eq(findings.id, id))
      .returning();
    return updatedFinding;
  }

  async deleteFinding(id: string): Promise<boolean> {
    const result = await db.delete(findings).where(eq(findings.id, id));
    return (result.rowCount || 0) > 0;
  }

  async addOfflineQueueItem(item: InsertOfflineQueueItem & { userId: string }): Promise<OfflineQueueItem> {
    const [queueItem] = await db
      .insert(offlineQueue)
      .values(item)
      .returning();
    return queueItem;
  }

  async getUnprocessedOfflineItems(userId: string): Promise<OfflineQueueItem[]> {
    return await db.select().from(offlineQueue)
      .where(and(eq(offlineQueue.userId, userId), eq(offlineQueue.processed, false)))
      .orderBy(offlineQueue.createdAt);
  }

  async addToOfflineQueue(item: InsertOfflineQueueItem): Promise<OfflineQueueItem> {
    // Ensure userId is provided for offline queue items
    const [newItem] = await db
      .insert(offlineQueue)
      .values({
        ...item,
        userId: (item as any).userId || 'system'
      } as any)
      .returning();
    return newItem;
  }

  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    return await db.select().from(offlineQueue).orderBy(desc(offlineQueue.createdAt));
  }

  async markOfflineItemProcessed(id: string): Promise<boolean> {
    const result = await db.update(offlineQueue)
      .set({ processed: true })
      .where(eq(offlineQueue.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getReportStats(userId: string): Promise<{
    totalReports: number;
    highRiskFindings: number;
    mediumRiskFindings: number;
    completedFindings: number;
    completedReports: number;
  }> {
    const userReports = await this.getUserReports(userId);
    const totalReports = userReports.length;
    const completedReports = userReports.filter(r => r.status === 'completed').length;
    
    let highRiskFindings = 0;
    let mediumRiskFindings = 0;
    let completedFindings = 0;
    
    for (const report of userReports) {
      const reportFindings = await this.getReportFindings(report.id);
      highRiskFindings += reportFindings.filter(f => f.dangerLevel === 'high').length;
      mediumRiskFindings += reportFindings.filter(f => f.dangerLevel === 'medium').length;
      completedFindings += reportFindings.filter(f => f.section === 4 || (f.isCompleted && f.dangerLevel === 'low')).length;
    }

    return {
      totalReports,
      highRiskFindings,
      mediumRiskFindings,
      completedFindings,
      completedReports,
    };
  }

  async getLocationStats(location: string): Promise<{
    totalReports: number;
    highRiskFindings: number;
    mediumRiskFindings: number;
    completedFindings: number;
    completedReports: number;
  }> {
    const locationReports = await this.getReportsByLocation(location);
    const totalReports = locationReports.length;
    const completedReports = locationReports.filter(r => r.status === 'completed').length;
    
    let highRiskFindings = 0;
    let mediumRiskFindings = 0;
    let completedFindings = 0;
    
    for (const report of locationReports) {
      const reportFindings = await this.getReportFindings(report.id);
      highRiskFindings += reportFindings.filter(f => f.dangerLevel === 'high').length;
      mediumRiskFindings += reportFindings.filter(f => f.dangerLevel === 'medium').length;
      completedFindings += reportFindings.filter(f => f.section === 4 || (f.isCompleted && f.dangerLevel === 'low')).length;
    }

    return {
      totalReports,
      highRiskFindings,
      mediumRiskFindings,
      completedFindings,
      completedReports,
    };
  }

  async getUserLocationStats(userId: string, userLocation: string): Promise<{
    totalReports: number;
    highRiskFindings: number;
    mediumRiskFindings: number;
    completedFindings: number;
    completedReports: number;
  }> {
    const accessibleReports = await this.getUserAccessibleReports(userId, userLocation);
    const totalReports = accessibleReports.length;
    const completedReports = accessibleReports.filter(r => r.status === 'completed').length;
    
    let highRiskFindings = 0;
    let mediumRiskFindings = 0;
    let completedFindings = 0;
    
    for (const report of accessibleReports) {
      const reportFindings = await this.getReportFindings(report.id);
      highRiskFindings += reportFindings.filter(f => f.dangerLevel === 'high').length;
      mediumRiskFindings += reportFindings.filter(f => f.dangerLevel === 'medium').length;
      completedFindings += reportFindings.filter(f => f.section === 4 || (f.isCompleted && f.dangerLevel === 'low')).length;
    }

    return {
      totalReports,
      highRiskFindings,
      mediumRiskFindings,
      completedFindings,
      completedReports,
    };
  }

  async getStats(): Promise<{
    totalReports: number;
    highRiskFindings: number;
    mediumRiskFindings: number;
    completedFindings: number;
    completedReports: number;
  }> {
    const allReports = await db.select().from(reports);
    const totalReports = allReports.length;
    const completedReports = allReports.filter(r => r.status === 'completed').length;
    
    let highRiskFindings = 0;
    let mediumRiskFindings = 0;
    let completedFindings = 0;
    
    for (const report of allReports) {
      const reportFindings = await this.getReportFindings(report.id);
      highRiskFindings += reportFindings.filter(f => f.dangerLevel === 'high').length;
      mediumRiskFindings += reportFindings.filter(f => f.dangerLevel === 'medium').length;
      completedFindings += reportFindings.filter(f => f.section === 4 || (f.isCompleted && f.dangerLevel === 'low')).length;
    }

    return {
      totalReports,
      highRiskFindings,
      mediumRiskFindings,
      completedFindings,
      completedReports,
    };
  }

  // Hospital/Location Management Operations
  async getAllLocations(): Promise<Location[]> {
    return await db.select().from(locations).orderBy(desc(locations.createdAt));
  }

  async getLocationById(id: string): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location || undefined;
  }

  async createLocation(location: InsertLocation & { createdBy: string }): Promise<Location> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }

  async updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | null> {
    const [updatedLocation] = await db
      .update(locations)
      .set({ 
        ...location, 
        updatedAt: new Date() 
      })
      .where(eq(locations.id, id))
      .returning();
    return updatedLocation || null;
  }

  async deleteLocation(id: string): Promise<boolean> {
    const result = await db.delete(locations).where(eq(locations.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getUsersByLocationId(locationId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.locationId, locationId));
  }

  // Checklist Template operations
  async getAllChecklistTemplates(): Promise<ChecklistTemplate[]> {
    return await db.select().from(checklistTemplates)
      .where(eq(checklistTemplates.isActive, true))
      .orderBy(desc(checklistTemplates.createdAt));
  }

  async getChecklistTemplate(id: string): Promise<ChecklistTemplate | undefined> {
    const [template] = await db.select().from(checklistTemplates).where(eq(checklistTemplates.id, id));
    return template;
  }

  async createChecklistTemplate(template: InsertChecklistTemplate & { createdBy: string }): Promise<ChecklistTemplate> {
    const [newTemplate] = await db.insert(checklistTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateChecklistTemplate(id: string, template: Partial<InsertChecklistTemplate>): Promise<ChecklistTemplate> {
    const [updatedTemplate] = await db.update(checklistTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(checklistTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteChecklistTemplate(id: string): Promise<boolean> {
    const result = await db.delete(checklistTemplates).where(eq(checklistTemplates.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Checklist Section operations
  async getTemplateSections(templateId: string): Promise<ChecklistSection[]> {
    return await db.select().from(checklistSections)
      .where(and(
        eq(checklistSections.templateId, templateId),
        eq(checklistSections.isActive, true)
      ))
      .orderBy(checklistSections.orderIndex);
  }

  async getChecklistSection(id: string): Promise<ChecklistSection | undefined> {
    const [section] = await db.select().from(checklistSections).where(eq(checklistSections.id, id));
    return section;
  }

  async createChecklistSection(section: InsertChecklistSection): Promise<ChecklistSection> {
    const [newSection] = await db.insert(checklistSections)
      .values(section)
      .returning();
    return newSection;
  }

  async updateChecklistSection(id: string, section: Partial<InsertChecklistSection>): Promise<ChecklistSection> {
    const [updatedSection] = await db.update(checklistSections)
      .set({ ...section, updatedAt: new Date() })
      .where(eq(checklistSections.id, id))
      .returning();
    return updatedSection;
  }

  async deleteChecklistSection(id: string): Promise<boolean> {
    const result = await db.delete(checklistSections).where(eq(checklistSections.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Checklist Question operations
  async getSectionQuestions(sectionId: string): Promise<ChecklistQuestion[]> {
    return await db.select().from(checklistQuestions)
      .where(and(
        eq(checklistQuestions.sectionId, sectionId),
        eq(checklistQuestions.isActive, true)
      ))
      .orderBy(checklistQuestions.orderIndex);
  }

  async getChecklistQuestion(id: string): Promise<ChecklistQuestion | undefined> {
    const [question] = await db.select().from(checklistQuestions).where(eq(checklistQuestions.id, id));
    return question;
  }

  async createChecklistQuestion(question: InsertChecklistQuestion): Promise<ChecklistQuestion> {
    const [newQuestion] = await db.insert(checklistQuestions)
      .values(question)
      .returning();
    return newQuestion;
  }

  async updateChecklistQuestion(id: string, question: Partial<InsertChecklistQuestion>): Promise<ChecklistQuestion> {
    const [updatedQuestion] = await db.update(checklistQuestions)
      .set({ ...question, updatedAt: new Date() })
      .where(eq(checklistQuestions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deleteChecklistQuestion(id: string): Promise<boolean> {
    const result = await db.delete(checklistQuestions).where(eq(checklistQuestions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Checklist Inspection operations
  async getAllChecklistInspections(): Promise<ChecklistInspection[]> {
    return await db.select().from(checklistInspections)
      .orderBy(desc(checklistInspections.createdAt));
  }

  async getChecklistInspection(id: string): Promise<ChecklistInspection | undefined> {
    const [inspection] = await db.select().from(checklistInspections).where(eq(checklistInspections.id, id));
    return inspection;
  }

  async getLocationInspections(locationId: string): Promise<ChecklistInspection[]> {
    return await db.select().from(checklistInspections)
      .where(eq(checklistInspections.locationId, locationId))
      .orderBy(desc(checklistInspections.createdAt));
  }

  async getInspectorInspections(inspectorId: string): Promise<ChecklistInspection[]> {
    return await db.select().from(checklistInspections)
      .where(eq(checklistInspections.inspectorId, inspectorId))
      .orderBy(desc(checklistInspections.createdAt));
  }

  async createChecklistInspection(inspection: InsertChecklistInspection & { inspectorId: string }): Promise<ChecklistInspection> {
    const [newInspection] = await db.insert(checklistInspections)
      .values(inspection)
      .returning();
    return newInspection;
  }

  async updateChecklistInspection(id: string, inspection: Partial<InsertChecklistInspection>): Promise<ChecklistInspection> {
    const [updatedInspection] = await db.update(checklistInspections)
      .set({ ...inspection, updatedAt: new Date() })
      .where(eq(checklistInspections.id, id))
      .returning();
    return updatedInspection;
  }

  async deleteChecklistInspection(id: string): Promise<boolean> {
    // First delete all answers for this inspection
    await db.delete(checklistAnswers).where(eq(checklistAnswers.inspectionId, id));
    
    // Then delete the inspection
    const result = await db.delete(checklistInspections).where(eq(checklistInspections.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Checklist Answer operations
  async getInspectionAnswers(inspectionId: string): Promise<ChecklistAnswer[]> {
    return await db.select().from(checklistAnswers)
      .where(eq(checklistAnswers.inspectionId, inspectionId))
      .orderBy(checklistAnswers.createdAt);
  }

  async getChecklistAnswer(id: string): Promise<ChecklistAnswer | undefined> {
    const [answer] = await db.select().from(checklistAnswers).where(eq(checklistAnswers.id, id));
    return answer;
  }

  async createChecklistAnswer(answer: InsertChecklistAnswer): Promise<ChecklistAnswer> {
    // Calculate score based on evaluation and TW score
    const calculatedScore = calculateQuestionScore(answer.evaluation, answer.twScore);
    
    const [newAnswer] = await db.insert(checklistAnswers)
      .values({
        ...answer,
        calculatedScore,
        photos: answer.photos || [],
        documents: answer.documents || []
      } as any)
      .returning();
    
    // Recalculate inspection totals
    await this.recalculateInspectionScore(answer.inspectionId);
    
    return newAnswer;
  }

  async updateChecklistAnswer(id: string, answer: Partial<InsertChecklistAnswer>): Promise<ChecklistAnswer> {
    // Get current answer to get inspection ID
    const currentAnswer = await this.getChecklistAnswer(id);
    if (!currentAnswer) throw new Error("Answer not found");

    // Calculate new score if evaluation or TW score changed
    let calculatedScore = currentAnswer.calculatedScore;
    if (answer.evaluation !== undefined || answer.twScore !== undefined) {
      const evaluation = answer.evaluation || currentAnswer.evaluation;
      const twScore = answer.twScore || currentAnswer.twScore;
      calculatedScore = calculateQuestionScore(evaluation, twScore);
    }

    const [updatedAnswer] = await db.update(checklistAnswers)
      .set({ 
        ...answer, 
        calculatedScore,
        updatedAt: new Date(),
        photos: answer.photos ? [...answer.photos] : undefined,
        documents: answer.documents ? [...answer.documents] : undefined
      })
      .where(eq(checklistAnswers.id, id))
      .returning();
    
    // Recalculate inspection totals
    await this.recalculateInspectionScore(currentAnswer.inspectionId);
    
    return updatedAnswer;
  }

  async deleteChecklistAnswer(id: string): Promise<boolean> {
    // Get inspection ID before deleting
    const answer = await this.getChecklistAnswer(id);
    if (!answer) return false;

    const result = await db.delete(checklistAnswers).where(eq(checklistAnswers.id, id));
    const success = (result.rowCount || 0) > 0;
    
    if (success) {
      // Recalculate inspection totals
      await this.recalculateInspectionScore(answer.inspectionId);
    }
    
    return success;
  }

  async calculateInspectionScore(inspectionId: string): Promise<{
    totalScore: number;
    maxPossibleScore: number;
    successPercentage: number;
    letterGrade: string;
  }> {
    const answers = await this.getInspectionAnswers(inspectionId);
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    for (const answer of answers) {
      if (answer.evaluation !== "Kapsam Dışı") {
        // Add TW score to max possible score
        maxPossibleScore += answer.twScore;
        
        // Add calculated score to total
        totalScore += answer.calculatedScore || 0;
      }
    }
    
    const successPercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    const letterGrade = calculateLetterGrade(successPercentage);
    
    return {
      totalScore,
      maxPossibleScore, 
      successPercentage,
      letterGrade
    };
  }

  private async recalculateInspectionScore(inspectionId: string): Promise<void> {
    const scoreData = await this.calculateInspectionScore(inspectionId);
    
    await db.update(checklistInspections)
      .set({
        totalScore: scoreData.totalScore,
        maxPossibleScore: scoreData.maxPossibleScore,
        successPercentage: scoreData.successPercentage,
        letterGrade: scoreData.letterGrade,
        updatedAt: new Date()
      })
      .where(eq(checklistInspections.id, inspectionId));
  }

  // Assignment system implementation
  async createChecklistAssignment(assignment: InsertChecklistAssignment & { assignedBy: string }): Promise<ChecklistAssignment> {
    const [newAssignment] = await db.insert(checklistAssignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async getChecklistAssignments(): Promise<ChecklistAssignment[]> {
    return await db.select().from(checklistAssignments)
      .orderBy(desc(checklistAssignments.createdAt));
  }

  async getChecklistAssignmentById(id: string): Promise<ChecklistAssignment | null> {
    const [assignment] = await db.select().from(checklistAssignments)
      .where(eq(checklistAssignments.id, id));
    return assignment || null;
  }

  async getAssignmentsForHospital(hospitalId: string): Promise<ChecklistAssignment[]> {
    return await db.select().from(checklistAssignments)
      .where(eq(checklistAssignments.assignedToHospital, hospitalId))
      .orderBy(desc(checklistAssignments.createdAt));
  }

  async getAssignmentsForUser(userId: string): Promise<ChecklistAssignment[]> {
    return await db.select().from(checklistAssignments)
      .where(
        or(
          eq(checklistAssignments.assignedToUser, userId),
          // Also include assignments for user's hospital
          and(
            isNull(checklistAssignments.assignedToUser),
            eq(checklistAssignments.assignedToHospital, 
              sql`(SELECT location_id FROM users WHERE id = ${userId})`)
          )
        )
      )
      .orderBy(desc(checklistAssignments.createdAt));
  }

  async updateChecklistAssignment(id: string, updates: Partial<InsertChecklistAssignment>): Promise<ChecklistAssignment | null> {
    const [updatedAssignment] = await db.update(checklistAssignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(checklistAssignments.id, id))
      .returning();
    return updatedAssignment || null;
  }

  async updateAssignmentStatus(assignmentId: string, status: string): Promise<ChecklistAssignment> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const [updatedAssignment] = await db.update(checklistAssignments)
      .set(updateData)
      .where(eq(checklistAssignments.id, assignmentId))
      .returning();
    return updatedAssignment;
  }

  async deleteChecklistAssignment(assignmentId: string): Promise<boolean> {
    const result = await db.delete(checklistAssignments)
      .where(eq(checklistAssignments.id, assignmentId));
    return (result.rowCount || 0) > 0;
  }

  // Assignment to Inspection operations
  async getInspectionByAssignmentId(assignmentId: string): Promise<ChecklistInspection | null> {
    const [inspection] = await db.select().from(checklistInspections)
      .where(eq(checklistInspections.assignmentId, assignmentId));
    return inspection || null;
  }

  async createInspectionFromAssignment(data: {
    assignmentId: string;
    templateId: string;
    inspectorId: string;
    locationId: string;
    title: string;
    description: string;
    dueDate: string;
  }): Promise<ChecklistInspection> {
    const [newInspection] = await db.insert(checklistInspections)
      .values({
        assignmentId: data.assignmentId,
        templateId: data.templateId,
        inspectorId: data.inspectorId,
        locationId: data.locationId,
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        status: 'draft',
        totalScore: 0,
        maxPossibleScore: 0,
        successPercentage: 0,
        letterGrade: 'E'
      })
      .returning();
    return newInspection;
  }

  // Submission system implementation
  async createChecklistSubmission(submission: InsertChecklistSubmission & { submittedBy: string }): Promise<ChecklistSubmission> {
    const [newSubmission] = await db.insert(checklistSubmissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  async getAssignmentSubmissions(assignmentId: string): Promise<ChecklistSubmission[]> {
    return await db.select().from(checklistSubmissions)
      .where(eq(checklistSubmissions.assignmentId, assignmentId))
      .orderBy(desc(checklistSubmissions.submittedAt));
  }
  
  // NEW: Inspection Management System Implementation
  
  // Inspection operations
  async getAllInspections(): Promise<any[]> {
    const results = await db
      .select()
      .from(inspections)
      .leftJoin(checklistTemplates, eq(inspections.templateId, checklistTemplates.id))
      .orderBy(desc(inspections.createdAt));

    return results.map(result => ({
      id: result.inspections.id,
      inspectionNumber: result.inspections.inspectionNumber,
      templateId: result.inspections.templateId,
      title: result.inspections.title,
      description: result.inspections.description,
      startDate: result.inspections.startDate,
      dueDate: result.inspections.dueDate,
      status: result.inspections.status,
      targetLocationIds: result.inspections.targetLocationIds || [],
      template: result.checklist_templates ? {
        id: result.checklist_templates.id,
        name: result.checklist_templates.name,
        title: result.checklist_templates.name
      } : null,
      createdAt: result.inspections.createdAt
    }));
  }

  async getInspection(id: string): Promise<Inspection | undefined> {
    const [inspection] = await db
      .select()
      .from(inspections)
      .where(and(eq(inspections.id, id), eq(inspections.isActive, true)));
    return inspection;
  }

  async createInspection(insertInspection: InsertInspection & { createdBy: string }): Promise<Inspection> {
    // Generate inspection number: INS-YYYYMMDD-XXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const inspectionNumber = `INS-${dateStr}-${randomNum}`;

    const [inspection] = await db
      .insert(inspections)
      .values({
        ...insertInspection,
        inspectionNumber,
        createdBy: insertInspection.createdBy
      })
      .returning();
    return inspection;
  }

  async updateInspection(id: string, inspection: Partial<InsertInspection>): Promise<Inspection> {
    const [updated] = await db
      .update(inspections)
      .set({ ...inspection, updatedAt: new Date() })
      .where(eq(inspections.id, id))
      .returning();
    return updated;
  }

  async deleteInspection(id: string): Promise<boolean> {
    const result = await db
      .update(inspections)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(inspections.id, id));
    return result.rowCount > 0;
  }

  // Assignment operations
  async getInspectionAssignments(inspectionId: string): Promise<InspectionAssignment[]> {
    return await db
      .select()
      .from(inspectionAssignments)
      .where(eq(inspectionAssignments.inspectionId, inspectionId))
      .orderBy(desc(inspectionAssignments.assignedAt));
  }

  async getInspectionAssignment(id: string): Promise<InspectionAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(inspectionAssignments)
      .where(eq(inspectionAssignments.id, id));
    
    if (!assignment) return undefined;
    
    // Join inspection data to get template information
    const [location] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, assignment.locationId));

    const [inspection] = await db
      .select()
      .from(inspections)
      .where(eq(inspections.id, assignment.inspectionId));

    return {
      ...assignment,
      location: location || null,
      inspection: inspection ? {
        ...inspection,
        templateId: inspection.templateId // Ensure templateId is explicitly included
      } : null,
    };
  }

  async getUserAssignments(userId: string): Promise<InspectionAssignment[]> {
    const assignments = await db
      .select()
      .from(inspectionAssignments)
      .where(eq(inspectionAssignments.assignedUserId, userId))
      .orderBy(desc(inspectionAssignments.assignedAt));

    // Manually join the related data to avoid Drizzle nested object issues
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const [location] = await db
          .select()
          .from(locations)
          .where(eq(locations.id, assignment.locationId));

        const [inspection] = await db
          .select()
          .from(inspections)
          .where(eq(inspections.id, assignment.inspectionId));

        return {
          ...assignment,
          location: location || null,
          inspection: inspection ? {
            ...inspection,
            templateId: inspection.templateId // Ensure templateId is explicitly included
          } : null,
        };
      })
    );

    return enrichedAssignments;
  }

  async createInspectionAssignment(assignment: InsertInspectionAssignment): Promise<InspectionAssignment> {
    const [created] = await db
      .insert(inspectionAssignments)
      .values(assignment)
      .returning();
    return created;
  }

  async updateInspectionAssignment(id: string, assignment: Partial<InsertInspectionAssignment>): Promise<InspectionAssignment> {
    const [updated] = await db
      .update(inspectionAssignments)
      .set({ ...assignment, updatedAt: new Date() })
      .where(eq(inspectionAssignments.id, id))
      .returning();
    return updated;
  }

  // Response operations
  async getInspectionResponses(assignmentId: string): Promise<InspectionResponse[]> {
    return await db
      .select()
      .from(inspectionResponses)
      .where(eq(inspectionResponses.assignmentId, assignmentId))
      .orderBy(desc(inspectionResponses.respondedAt));
  }

  async getInspectionResponse(assignmentId: string, questionId: string): Promise<InspectionResponse | undefined> {
    const [response] = await db
      .select()
      .from(inspectionResponses)
      .where(
        and(
          eq(inspectionResponses.assignmentId, assignmentId),
          eq(inspectionResponses.questionId, questionId)
        )
      );
    return response;
  }

  async createInspectionResponse(response: InsertInspectionResponse): Promise<InspectionResponse> {
    const [created] = await db
      .insert(inspectionResponses)
      .values(response)
      .returning();
    return created;
  }

  async updateInspectionResponse(id: string, response: Partial<InsertInspectionResponse>): Promise<InspectionResponse> {
    const [updated] = await db
      .update(inspectionResponses)
      .set({ ...response, updatedAt: new Date() })
      .where(eq(inspectionResponses.id, id))
      .returning();
    return updated;
  }

  // Assignment workflow
  async startInspection(assignmentId: string, userId: string): Promise<boolean> {
    const result = await db
      .update(inspectionAssignments)
      .set({
        status: 'in_progress',
        startedAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(inspectionAssignments.id, assignmentId),
          eq(inspectionAssignments.assignedUserId, userId)
        )
      );
    return result.rowCount > 0;
  }

  async submitInspectionResponse(assignmentId: string, questionId: string, response: InsertInspectionResponse): Promise<InspectionResponse> {
    // Check if response already exists
    const existing = await this.getInspectionResponse(assignmentId, questionId);
    
    if (existing) {
      // Update existing response
      return await this.updateInspectionResponse(existing.id, response);
    } else {
      // Create new response
      return await this.createInspectionResponse({
        ...response,
        assignmentId,
        questionId
      });
    }
  }

  async completeInspection(assignmentId: string, userId: string): Promise<boolean> {
    // Calculate final scores
    const responses = await this.getInspectionResponses(assignmentId);
    const totalScore = responses.reduce((sum, resp) => sum + (resp.score || 0), 0);
    const maxPossibleScore = responses.length * 10; // Assuming max TW score is 10
    const scorePercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    const letterGrade = calculateLetterGrade(scorePercentage);

    const result = await db
      .update(inspectionAssignments)
      .set({
        status: 'completed',
        completedAt: new Date(),
        answeredQuestions: responses.length,
        actualScore: totalScore,
        scorePercentage,
        letterGrade,
        progressPercentage: 100,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(inspectionAssignments.id, assignmentId),
          eq(inspectionAssignments.assignedUserId, userId)
        )
      );
    return result.rowCount > 0;
  }

  async getAllCompletedInspections(): Promise<any[]> {
    const results = await db
      .select()
      .from(inspectionAssignments)
      .leftJoin(locations, eq(inspectionAssignments.locationId, locations.id))
      .leftJoin(inspections, eq(inspectionAssignments.inspectionId, inspections.id))
      .leftJoin(users, eq(inspectionAssignments.assignedUserId, users.id))
      .where(eq(inspectionAssignments.status, 'completed'))
      .orderBy(desc(inspectionAssignments.completedAt));

    return results.map(result => ({
      id: result.inspection_assignments.id,
      assignedUserId: result.inspection_assignments.assignedUserId,
      inspectionId: result.inspection_assignments.inspectionId,
      locationId: result.inspection_assignments.locationId,
      assignedBy: result.inspection_assignments.assignedBy || null,
      dueDate: result.inspection_assignments.dueDate || null,
      status: result.inspection_assignments.status,
      completedAt: result.inspection_assignments.completedAt,
      scorePercentage: result.inspection_assignments.scorePercentage,
      letterGrade: result.inspection_assignments.letterGrade,
      answeredQuestions: result.inspection_assignments.answeredQuestions,
      actualScore: result.inspection_assignments.actualScore,
      createdAt: result.inspection_assignments.createdAt,
      location: result.locations ? {
        id: result.locations.id,
        name: result.locations.name,
        type: result.locations.type
      } : null,
      inspection: result.inspections ? {
        id: result.inspections.id,
        title: result.inspections.title,
        category: result.inspections.category
      } : null,
      assignedUser: result.users ? {
        id: result.users.id,
        fullName: result.users.fullName,
        username: result.users.username
      } : null
    }));
  }

  // Get hospital statistics with aggregated scores
  async getHospitalStatistics(): Promise<any[]> {
    const hospitals = await db
      .select()
      .from(locations)
      .where(eq(locations.type, 'hospital'))
      .orderBy(locations.name);

    const statistics = [];
    
    for (const hospital of hospitals) {
      // Get completed inspections for this hospital
      const completedInspections = await db
        .select()
        .from(inspectionAssignments)
        .leftJoin(inspections, eq(inspectionAssignments.inspectionId, inspections.id))
        .where(
          and(
            eq(inspectionAssignments.locationId, hospital.id),
            eq(inspectionAssignments.status, 'completed')
          )
        );

      const totalInspections = completedInspections.length;
      let averageScore = 0;
      let letterGrade = 'E';
      
      if (totalInspections > 0) {
        const totalScore = completedInspections.reduce((sum, inspection) => {
          return sum + (inspection.inspection_assignments.scorePercentage || 0);
        }, 0);
        averageScore = Math.round(totalScore / totalInspections);
        letterGrade = calculateLetterGrade(averageScore);
      }

      // Get all inspections (including pending) for counts
      const allInspections = await db
        .select()
        .from(inspectionAssignments)
        .where(eq(inspectionAssignments.locationId, hospital.id));

      const pendingInspections = allInspections.filter(i => i.status === 'pending').length;
      const overdueInspections = allInspections.filter(i => {
        if (i.status !== 'pending') return false;
        return i.dueDate ? new Date(i.dueDate) < new Date() : false;
      }).length;

      statistics.push({
        ...hospital,
        totalInspections,
        completedInspections: totalInspections,
        pendingInspections,
        overdueInspections,
        averageScore,
        letterGrade
      });
    }

    return statistics;
  }

  // Get inspection title statistics with aggregated scores
  async getInspectionTitleStatistics(): Promise<any[]> {
    const inspectionTitles = await db
      .select()
      .from(inspections)
      .orderBy(desc(inspections.createdAt));

    const statistics = [];
    
    for (const inspectionTitle of inspectionTitles) {
      // Get completed assignments for this inspection title
      const completedAssignments = await db
        .select()
        .from(inspectionAssignments)
        .leftJoin(locations, eq(inspectionAssignments.locationId, locations.id))
        .where(
          and(
            eq(inspectionAssignments.inspectionId, inspectionTitle.id),
            eq(inspectionAssignments.status, 'completed')
          )
        );

      const totalCompletedInspections = completedAssignments.length;
      let averageScore = 0;
      let letterGrade = 'E';
      
      if (totalCompletedInspections > 0) {
        const totalScore = completedAssignments.reduce((sum, assignment) => {
          return sum + (assignment.inspection_assignments.scorePercentage || 0);
        }, 0);
        averageScore = Math.round(totalScore / totalCompletedInspections);
        letterGrade = calculateLetterGrade(averageScore);
      }

      // Get all assignments for counts
      const allAssignments = await db
        .select()
        .from(inspectionAssignments)
        .where(eq(inspectionAssignments.inspectionId, inspectionTitle.id));

      const totalAssignments = allAssignments.length;
      const pendingAssignments = allAssignments.filter(a => a.status === 'pending').length;
      const overdueAssignments = allAssignments.filter(a => {
        if (a.status !== 'pending') return false;
        return a.dueDate ? new Date(a.dueDate) < new Date() : false;
      }).length;

      statistics.push({
        ...inspectionTitle,
        totalAssignments,
        completedAssignments: totalCompletedInspections,
        pendingAssignments,
        overdueAssignments,
        averageScore,
        letterGrade,
        targetLocationIds: inspectionTitle.targetLocationIds || []
      });
    }

    return statistics;
  }

  // Update inspection target hospitals
  async updateInspectionTargetHospitals(inspectionId: string, targetLocationIds: string[]): Promise<boolean> {
    const result = await db
      .update(inspections)
      .set({
        targetLocationIds: JSON.stringify(targetLocationIds),
        updatedAt: new Date()
      })
      .where(eq(inspections.id, inspectionId));
    
    return result.rowCount > 0;
  }

  // Add new hospital to all active inspections (for dynamic system)
  async addHospitalToAllInspections(hospitalId: string): Promise<number> {
    const result = await db.execute(sql`
      UPDATE inspections 
      SET target_location_ids = target_location_ids || ${JSON.stringify([hospitalId])}::jsonb,
          updated_at = NOW()
      WHERE is_active = true
      AND NOT target_location_ids ? ${hospitalId}
    `);
    
    return result.rowCount || 0;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return created;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const [updated] = await db
        .update(notifications)
        .set({ 
          isRead: true, 
          readAt: new Date() 
        })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ))
        .returning();
      return !!updated;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      await db
        .update(notifications)
        .set({ 
          isRead: true, 
          readAt: new Date() 
        })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  async getNotificationCount(userId: string): Promise<number> {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
      return result?.count || 0;
    } catch (error) {
      console.error('Error fetching notification count:', error);
      return 0;
    }
  }
}

export const storage = new DatabaseStorage();
