import fs from "fs";
import { z } from "zod";
import type { Express } from "express";
import { Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema, insertFindingSchema, insertOfflineQueueSchema } from "@shared/schema";
import { ReactPdfService } from "./pdfService";
// Template sistemi geçici olarak devre dışı
// import { TemplatePdfService } from "./templatePdfService";
// import { TemplateManager } from "./templateManager";
import jwt from "jsonwebtoken";
import multer from "multer";
import sharp from "sharp";
import path from "path";

const JWT_SECRET = "dev-secret-key";

// Multer setup for image uploads
const storage_multer = multer.memoryStorage();
const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure uploads directory exists
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }

  // Template sistemi geçici olarak devre dışı
  // const templateManager = new TemplateManager();
  // const templatePdfService = new TemplatePdfService();

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.authenticateUser(username, password);
      
      if (user) {
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username,
            fullName: user.fullName
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            username: user.username,
            fullName: user.fullName
          } 
        });
      } else {
        res.status(401).json({ message: 'Geçersiz kullanıcı adı veya parola' });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Giriş yapılırken hata oluştu" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, fullName } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanımda' });
      }

      const newUser = await storage.createUser({
        username,
        password,
        fullName
      });

      const token = jwt.sign(
        { 
          id: newUser.id, 
          username: newUser.username,
          fullName: newUser.fullName
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({ 
        token, 
        user: { 
          id: newUser.id, 
          username: newUser.username,
          fullName: newUser.fullName
        } 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Kayıt olurken hata oluştu" });
    }
  });

  app.get("/api/auth/verify", authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
  });

  // Reports CRUD routes
  app.get("/api/reports", authenticateToken, async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Raporlar alınırken hata oluştu" });
    }
  });

  app.get("/api/reports/:id", authenticateToken, async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (report) {
        res.json(report);
      } else {
        res.status(404).json({ message: "Rapor bulunamadı" });
      }
    } catch (error) {
      console.error("Get report error:", error);
      res.status(500).json({ message: "Rapor alınırken hata oluştu" });
    }
  });

  app.post("/api/reports", authenticateToken, async (req: any, res) => {
    try {
      const validation = insertReportSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Geçersiz veri formatı", errors: validation.error.errors });
      }

      const report = await storage.createReport({
        ...validation.data,
        userId: req.user.id
      });
      res.status(201).json(report);
    } catch (error) {
      console.error("Create report error:", error);
      res.status(500).json({ message: "Rapor oluşturulurken hata oluştu" });
    }
  });

  app.put("/api/reports/:id", authenticateToken, async (req, res) => {
    try {
      const validation = insertReportSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Geçersiz veri formatı", errors: validation.error.errors });
      }

      const report = await storage.updateReport(req.params.id, validation.data);
      if (report) {
        res.json(report);
      } else {
        res.status(404).json({ message: "Rapor bulunamadı" });
      }
    } catch (error) {
      console.error("Update report error:", error);
      res.status(500).json({ message: "Rapor güncellenirken hata oluştu" });
    }
  });

  app.delete("/api/reports/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteReport(req.params.id);
      if (success) {
        res.json({ message: "Rapor silindi" });
      } else {
        res.status(404).json({ message: "Rapor bulunamadı" });
      }
    } catch (error) {
      console.error("Delete report error:", error);
      res.status(500).json({ message: "Rapor silinirken hata oluştu" });
    }
  });

  // Findings CRUD routes
  app.get("/api/reports/:reportId/findings", authenticateToken, async (req, res) => {
    try {
      const findings = await storage.getReportFindings(req.params.reportId);
      res.json(findings);
    } catch (error) {
      console.error("Get findings error:", error);
      res.status(500).json({ message: "Bulgular alınırken hata oluştu" });
    }
  });

  app.post("/api/reports/:reportId/findings", authenticateToken, async (req, res) => {
    try {
      const validation = insertFindingSchema.safeParse({
        ...req.body,
        reportId: req.params.reportId
      });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Geçersiz veri formatı", errors: validation.error.errors });
      }

      const finding = await storage.createFinding(validation.data);
      res.status(201).json(finding);
    } catch (error) {
      console.error("Create finding error:", error);
      res.status(500).json({ message: "Bulgu oluşturulurken hata oluştu" });
    }
  });

  app.put("/api/findings/:id", authenticateToken, async (req, res) => {
    try {
      const validation = insertFindingSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Geçersiz veri formatı", errors: validation.error.errors });
      }

      const finding = await storage.updateFinding(req.params.id, validation.data);
      if (finding) {
        res.json(finding);
      } else {
        res.status(404).json({ message: "Bulgu bulunamadı" });
      }
    } catch (error) {
      console.error("Update finding error:", error);
      res.status(500).json({ message: "Bulgu güncellenirken hata oluştu" });
    }
  });

  app.delete("/api/findings/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteFinding(req.params.id);
      if (success) {
        res.json({ message: "Bulgu silindi" });
      } else {
        res.status(404).json({ message: "Bulgu bulunamadı" });
      }
    } catch (error) {
      console.error("Delete finding error:", error);
      res.status(500).json({ message: "Bulgu silinirken hata oluştu" });
    }
  });

  // File upload endpoint with image compression
  // Fotoğraf yükleme endpoint'i (jpeg, png, webp formatları destekler)
  app.post("/api/upload-image", authenticateToken, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Dosya bulunamadı' });
      }

      // Desteklenen formatları kontrol et
      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!supportedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          message: 'Desteklenmeyen dosya formatı. Sadece JPEG, PNG ve WebP formatları kabul edilir.' 
        });
      }

      console.log(`📸 Fotoğraf yükleniyor: ${req.file.originalname} (${req.file.mimetype})`);
      
      // Dosya uzantısını orijinal formatına göre ayarla
      let outputExtension = '.jpg'; // varsayılan
      let sharpProcessor = sharp(req.file.buffer)
        .resize(1200, 900, { 
          fit: 'inside', 
          withoutEnlargement: true 
        });
      
      // Format'a göre işlem ve uzantı belirleme
      switch (req.file.mimetype) {
        case 'image/png':
          outputExtension = '.png';
          sharpProcessor = sharpProcessor.png({ quality: 90, progressive: true });
          break;
        case 'image/webp':
          outputExtension = '.webp';
          sharpProcessor = sharpProcessor.webp({ quality: 85 });
          break;
        default: // jpeg
          outputExtension = '.jpg';
          sharpProcessor = sharpProcessor.jpeg({ quality: 85, progressive: true });
      }
      
      const filename = `${Date.now()}_${Math.random().toString(36).substring(2)}${outputExtension}`;
      const filepath = path.join('uploads', filename);
      
      // uploads klasörünü oluştur (yoksa)
      const uploadsDir = path.dirname(filepath);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Fotoğrafı işle ve kaydet
      const processedBuffer = await sharpProcessor.toBuffer();
      fs.writeFileSync(filepath, processedBuffer);
      
      const imagePath = `/${filepath}`;
      console.log(`✅ Fotoğraf kaydedildi: ${imagePath}`);

      res.json({ 
        message: 'Fotoğraf başarıyla yüklendi', 
        path: imagePath,
        filename: filename,
        originalName: req.file.originalname,
        size: processedBuffer.length
      });

    } catch (error) {
      console.error("📸 Fotoğraf yükleme hatası:", error);
      res.status(500).json({ 
        message: "Fotoğraf yüklenirken hata oluştu", 
        error: (error as any).message 
      });
    }
  });

  app.get("/api/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "İstatistikler alınırken hata oluştu" });
    }
  });

  // Offline queue management
  app.post("/api/offline-queue", authenticateToken, async (req, res) => {
    try {
      const validation = insertOfflineQueueSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Geçersiz veri formatı", errors: validation.error.errors });
      }

      const queueItem = await storage.addToOfflineQueue(validation.data);
      res.status(201).json(queueItem);
    } catch (error) {
      console.error("Add to offline queue error:", error);
      res.status(500).json({ message: "Offline queue'ya eklenirken hata oluştu" });
    }
  });

  app.get("/api/offline-queue", authenticateToken, async (req, res) => {
    try {
      const queueItems = await storage.getOfflineQueue();
      res.json(queueItems);
    } catch (error) {
      console.error("Get offline queue error:", error);
      res.status(500).json({ message: "Offline queue alınırken hata oluştu" });
    }
  });

  app.delete("/api/offline-queue/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.markOfflineItemProcessed(req.params.id);
      if (success) {
        res.json({ message: "Queue item processed" });
      } else {
        res.status(404).json({ message: "Queue item not found" });
      }
    } catch (error) {
      console.error("Mark offline item processed error:", error);
      res.status(500).json({ message: "Failed to mark item as processed" });
    }
  });

  // PDF Generation endpoint
  app.get("/api/reports/:id/pdf", authenticateToken, async (req: any, res) => {
    try {
      const reportId = req.params.id;
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      const findings = await storage.getReportFindings(reportId);
      
      const reportData = {
        id: report.id,
        reportNumber: report.reportNumber || 'RPT-2025-001',
        reportDate: report.reportDate ? new Date(report.reportDate).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
        projectLocation: report.projectLocation || 'İstinye Üniversitesi Topkapı Liv Hastanesi',
        reporter: report.reporter || 'Metin Salık',
        managementSummary: report.managementSummary || undefined,
        generalEvaluation: report.generalEvaluation || undefined,
        findings: findings.map((finding: any) => {
          // Convert old /uploads/ images to base64
          let processedImages = finding.images || [];
          if (Array.isArray(processedImages)) {
            processedImages = processedImages.map((img: string) => {
              if (img && img.startsWith('/uploads/')) {
                try {
                  const fullPath = path.join(process.cwd(), img);
                  if (fs.existsSync(fullPath)) {
                    const buffer = fs.readFileSync(fullPath);
                    const ext = path.extname(img).toLowerCase();
                    const mimeType = ext === '.webp' ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'image/jpeg';
                    return `data:${mimeType};base64,${buffer.toString('base64')}`;
                  }
                } catch (e) {
                  console.error('Image conversion error:', e);
                }
              }
              return img; // Return as-is if already base64 or invalid
            }).filter(Boolean);
          }
          
          return {
            id: finding.id,
            section: finding.section || 3,
            title: finding.title,
            description: finding.currentSituation || finding.description,
            currentSituation: finding.currentSituation,
            dangerLevel: finding.dangerLevel,
            recommendation: finding.recommendation,
            legalBasis: finding.legalBasis,
            images: processedImages,
            location: finding.location || finding.title,
            processSteps: finding.processSteps || [],
            isCompleted: finding.status === 'completed'
          };
        })
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

  // Template sistem kapalı - sadece mevcut ReactPDF sistemi kullanılıyor

  const httpServer = createServer(app);
  return httpServer;
}