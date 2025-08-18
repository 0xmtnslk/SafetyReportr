import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema, insertFindingSchema, insertOfflineQueueSchema } from "@shared/schema";
import { ReactPdfService } from "./pdfService";
import jwt from "jsonwebtoken";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const upload = multer({ dest: 'uploads/' });

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure uploads directory exists
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.validateUserCredentials(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    res.json({
      id: req.user.id,
      username: req.user.username,
      fullName: req.user.fullName,
    });
  });

  // Report routes
  app.get("/api/reports", authenticateToken, async (req: any, res) => {
    try {
      const reports = await storage.getUserReports(req.user.id);
      res.json(reports);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/:id", authenticateToken, async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Get report error:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.post("/api/reports", authenticateToken, async (req: any, res) => {
    try {
      // Convert string date to Date object
      const body = { ...req.body };
      if (body.reportDate && typeof body.reportDate === 'string') {
        body.reportDate = new Date(body.reportDate);
      }
      
      const validatedData = insertReportSchema.parse(body);
      const report = await storage.createReport({ ...validatedData, userId: req.user.id });
      res.status(201).json(report);
    } catch (error) {
      console.error("Create report error:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  app.put("/api/reports/:id", authenticateToken, async (req, res) => {
    try {
      // Convert string date to Date object
      const body = { ...req.body };
      if (body.reportDate && typeof body.reportDate === 'string') {
        body.reportDate = new Date(body.reportDate);
      }
      
      const validatedData = insertReportSchema.partial().parse(body);
      const report = await storage.updateReport(req.params.id, validatedData);
      res.json(report);
    } catch (error) {
      console.error("Update report error:", error);
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  app.delete("/api/reports/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteReport(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete report error:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  // Finding routes
  app.get("/api/reports/:reportId/findings", authenticateToken, async (req, res) => {
    try {
      const findings = await storage.getReportFindings(req.params.reportId);
      res.json(findings);
    } catch (error) {
      console.error("Get findings error:", error);
      res.status(500).json({ message: "Failed to fetch findings" });
    }
  });

  app.post("/api/findings", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertFindingSchema.parse(req.body);
      const finding = await storage.createFinding(validatedData);
      res.status(201).json(finding);
    } catch (error) {
      console.error("Create finding error:", error);
      res.status(500).json({ message: "Failed to create finding" });
    }
  });

  app.put("/api/findings/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertFindingSchema.partial().parse(req.body);
      const finding = await storage.updateFinding(req.params.id, validatedData);
      res.json(finding);
    } catch (error) {
      console.error("Update finding error:", error);
      res.status(500).json({ message: "Failed to update finding" });
    }
  });

  app.delete("/api/findings/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteFinding(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete finding error:", error);
      res.status(500).json({ message: "Failed to delete finding" });
    }
  });

  // Image upload route
  app.post("/api/upload-image", authenticateToken, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      const outputPath = path.join('uploads', filename);

      // Compress and convert to WebP
      await sharp(req.file.path)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      // Delete original file
      fs.unlinkSync(req.file.path);

      res.json({ filename, path: `/uploads/${filename}` });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Serve uploaded images
  app.use('/uploads', express.static('uploads'));

  // Statistics route
  app.get("/api/stats", authenticateToken, async (req: any, res) => {
    try {
      const stats = await storage.getReportStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Offline sync routes
  app.post("/api/offline-sync", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertOfflineQueueSchema.parse(req.body);
      const item = await storage.addOfflineQueueItem({ ...validatedData, userId: req.user.id });
      res.status(201).json(item);
    } catch (error) {
      console.error("Offline sync error:", error);
      res.status(500).json({ message: "Failed to add offline item" });
    }
  });

  app.get("/api/offline-sync/pending", authenticateToken, async (req: any, res) => {
    try {
      const items = await storage.getUnprocessedOfflineItems(req.user.id);
      res.json(items);
    } catch (error) {
      console.error("Get pending sync items error:", error);
      res.status(500).json({ message: "Failed to fetch pending items" });
    }
  });

  app.put("/api/offline-sync/:id/processed", authenticateToken, async (req, res) => {
    try {
      await storage.markOfflineItemProcessed(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Mark processed error:", error);
      res.status(500).json({ message: "Failed to mark item as processed" });
    }
  });

  // PDF Generation endpoint
  app.get("/api/reports/:id/pdf", authenticateToken, async (req: any, res) => {
    try {
      const reportId = req.params.id;
      const report = await storage.getReport(reportId, req.user.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      const findings = await storage.getReportFindings(reportId, req.user.id);
      
      const reportData = {
        id: report.id,
        reportNumber: report.reportNumber || 'RPT-2025-001',
        reportDate: report.reportDate || new Date().toLocaleDateString('tr-TR'),
        projectLocation: report.projectLocation || 'İstinye Üniversitesi Topkapı Liv Hastanesi',
        reporter: report.reporter || 'Metin Salık',
        managementSummary: report.managementSummary,
        generalEvaluation: report.generalEvaluation,
        findings: findings.map((finding: any) => ({
          id: finding.id,
          section: finding.section || 3,
          title: finding.title,
          description: finding.currentSituation || finding.description,
          dangerLevel: finding.dangerLevel,
          recommendation: finding.recommendation,
          images: finding.images || [],
          location: finding.location || finding.title,
          processSteps: finding.processSteps || [],
          isCompleted: finding.status === 'completed'
        }))
      };

      const pdfService = new ReactPdfService();
      const pdfBuffer = await pdfService.generatePDF(reportData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ISG_Raporu_${reportData.reportNumber}.pdf"`);
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ message: "PDF oluşturulurken hata oluştu" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
