import { reports, findings, users, offlineQueue, type User, type InsertUser, type Report, type InsertReport, type Finding, type InsertFinding, type OfflineQueueItem, type InsertOfflineQueueItem } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql, gt } from "drizzle-orm";
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
  getStats(): Promise<{
    totalReports: number;
    highRiskFindings: number;
    mediumRiskFindings: number;
    completedFindings: number;
    completedReports: number;
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
}

export const storage = new DatabaseStorage();
