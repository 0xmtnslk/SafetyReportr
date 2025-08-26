import { 
  reports, findings, users, offlineQueue, locations,
  checklistTemplates, checklistSections, checklistQuestions, checklistInspections, checklistAnswers,
  type User, type InsertUser, type Report, type InsertReport, type Finding, type InsertFinding, 
  type OfflineQueueItem, type InsertOfflineQueueItem, type Location, type InsertLocation,
  type ChecklistTemplate, type InsertChecklistTemplate, type ChecklistSection, type InsertChecklistSection,
  type ChecklistQuestion, type InsertChecklistQuestion, type ChecklistInspection, type InsertChecklistInspection,
  type ChecklistAnswer, type InsertChecklistAnswer, calculateQuestionScore, calculateLetterGrade
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql, gt, or } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
