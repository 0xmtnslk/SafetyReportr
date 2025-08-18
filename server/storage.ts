import { reports, findings, users, offlineQueue, type User, type InsertUser, type Report, type InsertReport, type Finding, type InsertFinding, type OfflineQueueItem, type InsertOfflineQueueItem } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUserCredentials(username: string, password: string): Promise<User | null>;

  // Report operations
  getReport(id: string): Promise<Report | undefined>;
  getUserReports(userId: string): Promise<Report[]>;
  createReport(report: InsertReport & { userId: string }): Promise<Report>;
  updateReport(id: string, report: Partial<InsertReport>): Promise<Report>;
  deleteReport(id: string): Promise<void>;

  // Finding operations
  getFinding(id: string): Promise<Finding | undefined>;
  getReportFindings(reportId: string): Promise<Finding[]>;
  createFinding(finding: InsertFinding): Promise<Finding>;
  updateFinding(id: string, finding: Partial<InsertFinding>): Promise<Finding>;
  deleteFinding(id: string): Promise<void>;

  // Offline sync operations
  addOfflineQueueItem(item: InsertOfflineQueueItem & { userId: string }): Promise<OfflineQueueItem>;
  getUnprocessedOfflineItems(userId: string): Promise<OfflineQueueItem[]>;
  markOfflineItemProcessed(id: string): Promise<void>;

  // Statistics
  getReportStats(userId: string): Promise<{
    totalReports: number;
    highRiskFindings: number;
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

  async validateUserCredentials(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
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

  async createReport(report: InsertReport & { userId: string }): Promise<Report> {
    const [newReport] = await db
      .insert(reports)
      .values(report)
      .returning();
    return newReport;
  }

  async updateReport(id: string, report: Partial<InsertReport>): Promise<Report> {
    const [updatedReport] = await db
      .update(reports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteReport(id: string): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }

  async getFinding(id: string): Promise<Finding | undefined> {
    const [finding] = await db.select().from(findings).where(eq(findings.id, id));
    return finding;
  }

  async getReportFindings(reportId: string): Promise<Finding[]> {
    return await db.select().from(findings)
      .where(eq(findings.reportId, reportId))
      .orderBy(desc(findings.createdAt));
  }

  async createFinding(finding: InsertFinding): Promise<Finding> {
    const [newFinding] = await db
      .insert(findings)
      .values({
        ...finding,
        images: finding.images || [],
        processSteps: finding.processSteps || []
      })
      .returning();
    return newFinding;
  }

  async updateFinding(id: string, finding: Partial<InsertFinding>): Promise<Finding> {
    const [updatedFinding] = await db
      .update(findings)
      .set({ 
        ...finding, 
        updatedAt: new Date(),
        images: finding.images || undefined,
        processSteps: finding.processSteps || undefined
      })
      .where(eq(findings.id, id))
      .returning();
    return updatedFinding;
  }

  async deleteFinding(id: string): Promise<void> {
    await db.delete(findings).where(eq(findings.id, id));
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

  async markOfflineItemProcessed(id: string): Promise<void> {
    await db.update(offlineQueue)
      .set({ processed: true })
      .where(eq(offlineQueue.id, id));
  }

  async getReportStats(userId: string): Promise<{
    totalReports: number;
    highRiskFindings: number;
    completedReports: number;
  }> {
    const userReports = await this.getUserReports(userId);
    const totalReports = userReports.length;
    const completedReports = userReports.filter(r => r.status === 'completed').length;
    
    let highRiskFindings = 0;
    for (const report of userReports) {
      const reportFindings = await this.getReportFindings(report.id);
      highRiskFindings += reportFindings.filter(f => f.dangerLevel === 'high').length;
    }

    return {
      totalReports,
      highRiskFindings,
      completedReports,
    };
  }
}

export const storage = new DatabaseStorage();
