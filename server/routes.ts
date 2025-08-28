import fs from "fs";
import { z } from "zod";
import type { Express } from "express";
import { Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { checkDatabaseHealth } from "./db";
import { 
  insertReportSchema, 
  insertFindingSchema, 
  insertOfflineQueueSchema,
  adminCreateUserSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  insertLocationSchema,
  insertChecklistTemplateSchema,
  insertChecklistSectionSchema,
  insertChecklistQuestionSchema,
  insertInspectionSchema,
  insertInspectionAssignmentSchema,
  insertInspectionResponseSchema,
  insertNotificationSchema,
  CHECKLIST_CATEGORIES,
  EVALUATION_OPTIONS,
  Location
} from "@shared/schema";
import { ReactPdfService } from "./pdfService";
// Template sistemi geçici olarak devre dışı
// import { TemplatePdfService } from "./templatePdfService";
// import { TemplateManager } from "./templateManager";
import jwt from "jsonwebtoken";
import multer from "multer";
import { ObjectStorageService } from "./objectStorage";
import sharp from "sharp";
import path from "path";
import crypto from "crypto";

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

// Role-based access control middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || !['admin', 'central_admin'].includes(user.role)) {
    return res.status(403).json({ message: 'Admin erişimi gerekli' });
  }
  next();
};

// Central Management (can create hospitals and assign specialists) - ADMIN role
const requireCentralManagement = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== 'central_admin') {
    return res.status(403).json({ message: 'Merkez yönetim (ADMIN) yetkisi gerekli' });
  }
  next();
};

// Safety Specialists and Occupational Physicians (can create reports and manage users)
const requireSafetySpecialist = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || !['central_admin', 'safety_specialist', 'occupational_physician'].includes(user.role)) {
    return res.status(403).json({ message: 'İş güvenliği uzmanı veya işyeri hekimi yetkisi gerekli' });
  }
  next();
};

// Responsible Managers (can only update process management sections)  
const requireResponsibleManagerAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || !['central_admin', 'safety_specialist', 'occupational_physician', 'responsible_manager'].includes(user.role)) {
    return res.status(403).json({ message: 'Sorumlu müdür erişim yetkisi gerekli' });
  }
  next();
};

// Check if user can edit findings (technical managers can only edit process steps)
const canEditFinding = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (['central_admin', 'safety_specialist', 'occupational_physician'].includes(user.role)) {
    return next(); // Full editing rights
  }
  
  if (user.role === 'responsible_manager') {
    // Only allow editing processSteps field
    const allowedFields = ['processSteps'];
    const requestedFields = Object.keys(req.body);
    
    const hasUnauthorizedFields = requestedFields.some(field => !allowedFields.includes(field));
    if (hasUnauthorizedFields) {
      return res.status(403).json({ message: 'Sadece süreç yönetimi güncelleyebilirsiniz' });
    }
    return next();
  }
  
  return res.status(403).json({ message: 'Bulgu düzenleme yetkisi yok' });
};

// Middleware to check if password change is required (first login)
const checkPasswordChangeRequired = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
    }

    // Allow password change endpoint even on first login
    if (req.path === '/api/auth/change-password' || req.path.startsWith('/api/auth/reset-password')) {
      return next();
    }

    // Get fresh user data to check firstLogin status
    const currentUser = await storage.getUser(req.user.id);
    if (!currentUser) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
    }

    if (currentUser.firstLogin) {
      return res.status(428).json({ 
        message: 'İlk giriş şifre değiştirme zorunludur',
        requirePasswordChange: true
      });
    }

    next();
  } catch (error) {
    console.error("Check password change required error:", error);
    res.status(500).json({ message: "Kullanıcı durumu kontrol edilirken hata oluştu" });
  }
};

const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: `Gerekli yetki: ${allowedRoles.join(' veya ')}` });
    }
    next();
  };
};

// Location-based filtering middleware
const addLocationFilter = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  // Central admin sees everything
  if (user && user.role === 'central_admin') {
    return next();
  }
  
  // Location-based users only see their location data
  if (user && user.locationId) {
    (req as any).locationFilter = user.locationId;
  } else if (user && user.location) {
    // Legacy location field support
    (req as any).locationFilter = user.location;
  }
  
  next();
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
        // Check if user is active
        if (!user.isActive) {
          return res.status(403).json({ message: 'Hesabınız devre dışı bırakılmış' });
        }

        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            location: user.location,
            locationId: user.locationId
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            location: user.location,
            locationId: user.locationId,
            firstLogin: user.firstLogin
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
        fullName,
        email: `${username}@temp.com`, // Temporary email for register
        phone: '5555555555', // Temporary phone for register  
        role: 'user'
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

  // Utility function to generate random password
  const generateRandomPassword = (length: number = 8): string => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // ADMIN USER MANAGEMENT ROUTES
  
  // Get all users (Safety Specialists and above can view users)
  app.get("/api/admin/users", authenticateToken, requireSafetySpecialist, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords in response
      const usersWithoutPasswords = users.map(user => {
        const { password, resetToken, resetTokenExpiry, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Kullanıcılar getirilirken hata oluştu" });
    }
  });

  // Create new user (Safety Specialists can create normal users)
  app.post("/api/admin/users", authenticateToken, requireSafetySpecialist, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      const userData = adminCreateUserSchema.parse(req.body);
      
      // Check authorization for creating different role types
      if (userData.role === 'central_admin' && !['central_admin'].includes(currentUser.role || '')) {
        return res.status(403).json({ message: 'Sadece merkez yönetim central admin oluşturabilir' });
      }
      
      if (['safety_specialist', 'occupational_physician'].includes(userData.role || '') && 
          !['central_admin'].includes(currentUser.role || '')) {
        return res.status(403).json({ message: 'Uzman rolleri oluşturmak için ADMIN yetkisi gerekli' });
      }
      
      // Safety specialists and occupational physicians can create responsible managers and users
      if (['responsible_manager'].includes(userData.role || '') && 
          !['central_admin', 'safety_specialist', 'occupational_physician'].includes(currentUser.role || '')) {
        return res.status(403).json({ message: 'Sorumlu müdür oluşturmak için uzman yetkisi gerekli' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanımda' });
      }

      // Generate password if not provided
      const password = userData.password || generateRandomPassword(10);
      
      // Set creator and location
      const newUserData = {
        ...userData,
        password,
        createdBy: currentUser.id,
        // If creator has a location and no location specified, use creator's location
        locationId: userData.locationId || currentUser.locationId
      };
      
      const newUser = await storage.createUser(newUserData);

      // Don't send password in response, but include it in success message
      const { password: _, resetToken, resetTokenExpiry, ...userResponse } = newUser;
      
      res.status(201).json({ 
        user: userResponse,
        generatedPassword: userData.password ? undefined : password,
        message: `Kullanıcı başarıyla oluşturuldu${!userData.password ? `. Geçici şifre: ${password}` : ''}`
      });
    } catch (error: any) {
      console.error("Create user error:", error);
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: "Geçersiz veri formatı", errors: error.errors });
      }
      res.status(500).json({ message: "Kullanıcı oluşturulurken hata oluştu" });
    }
  });

  // Update user (Safety Specialists can update users)
  app.put("/api/admin/users/:id", authenticateToken, requireSafetySpecialist, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;
      const updateData = req.body;

      // Validate user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }

      // Check authorization for updating different role types
      if (updateData.role === 'central_admin' && !['central_admin'].includes(currentUser.role || '')) {
        return res.status(403).json({ message: 'Central admin rolünü sadece central admin değiştirebilir' });
      }
      
      if (['safety_specialist', 'occupational_physician'].includes(updateData.role || '') && 
          !['central_admin'].includes(currentUser.role || '')) {
        return res.status(403).json({ message: 'Uzman rollerini değiştirmek için ADMIN yetkisi gerekli' });
      }
      
      if (['responsible_manager'].includes(updateData.role || '') && 
          !['central_admin', 'safety_specialist', 'occupational_physician'].includes(currentUser.role || '')) {
        return res.status(403).json({ message: 'Sorumlu müdür rolünü değiştirmek için uzman yetkisi gerekli' });
      }

      // Check username uniqueness if username is being updated
      if (updateData.username && updateData.username !== existingUser.username) {
        const userWithUsername = await storage.getUserByUsername(updateData.username);
        if (userWithUsername) {
          return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanımda' });
        }
      }

      const updatedUser = await storage.updateUser(id, updateData);
      const { password, resetToken, resetTokenExpiry, ...userResponse } = updatedUser;
      
      res.json(userResponse);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Kullanıcı güncellenirken hata oluştu" });
    }
  });

  // Delete user (Admin only)
  app.delete("/api/admin/users/:id", authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = (req as any).user;

      // Prevent admin from deleting themselves
      if (id === currentUser.id) {
        return res.status(400).json({ message: 'Kendi hesabınızı silemezsiniz' });
      }

      const success = await storage.deleteUser(id);
      if (success) {
        res.json({ message: 'Kullanıcı başarıyla silindi' });
      } else {
        res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Kullanıcı silinirken hata oluştu" });
    }
  });

  // PASSWORD MANAGEMENT ROUTES

  // Change password (All users)
  app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Simple validation
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Mevcut şifre ve yeni şifre gereklidir" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Yeni şifre en az 6 karakter olmalıdır" });
      }
      
      const currentUser = (req as any).user;

      // Verify current password
      const user = await storage.validateUserCredentials(currentUser.username, currentPassword);
      if (!user) {
        return res.status(400).json({ message: 'Mevcut şifre yanlış' });
      }

      // Change password and mark first login as complete
      await storage.changePassword(currentUser.id, newPassword);
      
      res.json({ message: 'Şifre başarıyla değiştirildi' });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Şifre değiştirilirken hata oluştu" });
    }
  });

  // Request password reset
  app.post("/api/auth/reset-password-request", async (req, res) => {
    try {
      const { username } = resetPasswordRequestSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: 'Eğer bu kullanıcı adı sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir' });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.setResetToken(user.id, resetToken, resetExpiry);

      // In a real app, you would send this via email
      // For demo purposes, we'll return it in response (NOT recommended in production)
      res.json({ 
        message: 'Şifre sıfırlama bağlantısı oluşturuldu',
        resetToken: resetToken // REMOVE THIS IN PRODUCTION
      });
    } catch (error) {
      console.error("Reset password request error:", error);
      res.status(500).json({ message: "Şifre sıfırlama isteği oluşturulurken hata oluştu" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const resetData = resetPasswordSchema.parse(req.body);
      
      const user = await storage.getUserByResetToken(resetData.token);
      if (!user) {
        return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş sıfırlama bağlantısı' });
      }

      // Change password and clear reset token
      await storage.changePassword(user.id, resetData.newPassword);
      await storage.setResetToken(user.id, '', new Date());
      
      res.json({ message: 'Şifre başarıyla sıfırlandı' });
    } catch (error: any) {
      console.error("Reset password error:", error);
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: "Geçersiz veri formatı", errors: error.errors });
      }
      res.status(500).json({ message: "Şifre sıfırlanırken hata oluştu" });
    }
  });

  // Reports CRUD routes
  app.get("/api/reports", authenticateToken, checkPasswordChangeRequired, addLocationFilter, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      const locationFilter = (req as any).locationFilter;
      let reports: any[];

      // Central admin sees all reports
      if (currentUser.role === 'central_admin') {
        reports = await storage.getAllReports();
      } else if (locationFilter) {
        // Location-based users see their location reports
        reports = await storage.getUserAccessibleReports(currentUser.id, locationFilter);
      } else {
        // Fallback to user's own reports
        reports = await storage.getUserReports(currentUser.id);
      }

      res.json(reports);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Raporlar alınırken hata oluştu" });
    }
  });

  app.get("/api/reports/:id", authenticateToken, checkPasswordChangeRequired, async (req, res) => {
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

  app.post("/api/reports", authenticateToken, checkPasswordChangeRequired, requireSafetySpecialist, async (req: any, res) => {
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

  app.put("/api/reports/:id", authenticateToken, checkPasswordChangeRequired, requireSafetySpecialist, async (req, res) => {
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

  app.delete("/api/reports/:id", authenticateToken, checkPasswordChangeRequired, requireSafetySpecialist, async (req, res) => {
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
  app.get("/api/reports/:reportId/findings", authenticateToken, checkPasswordChangeRequired, async (req, res) => {
    try {
      const findings = await storage.getReportFindings(req.params.reportId);
      res.json(findings);
    } catch (error) {
      console.error("Get findings error:", error);
      res.status(500).json({ message: "Bulgular alınırken hata oluştu" });
    }
  });

  app.post("/api/reports/:reportId/findings", authenticateToken, checkPasswordChangeRequired, requireSafetySpecialist, async (req, res) => {
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

  app.put("/api/findings/:id", authenticateToken, checkPasswordChangeRequired, canEditFinding, async (req, res) => {
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

  app.delete("/api/findings/:id", authenticateToken, checkPasswordChangeRequired, requireSafetySpecialist, async (req, res) => {
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
      
      // Image processing with Sharp
      let sharpProcessor = sharp(req.file.buffer)
        .resize(1200, 900, { 
          fit: 'inside', 
          withoutEnlargement: true 
        });
      
      // Format'a göre işlem belirleme
      switch (req.file.mimetype) {
        case 'image/png':
          sharpProcessor = sharpProcessor.png({ quality: 90, progressive: true });
          break;
        case 'image/webp':
          sharpProcessor = sharpProcessor.webp({ quality: 85 });
          break;
        default: // jpeg
          sharpProcessor = sharpProcessor.jpeg({ quality: 85, progressive: true });
      }

      // Process the image
      const processedBuffer = await sharpProcessor.toBuffer();
      
      // Upload to object storage instead of local filesystem
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const imagePath = await objectStorageService.uploadImage(
        processedBuffer,
        req.file.originalname,
        req.file.mimetype
      );
      
      console.log(`✅ Fotoğraf cloud depolamaya kaydedildi: ${imagePath}`);

      res.json({ 
        message: 'Fotoğraf başarıyla yüklendi', 
        path: imagePath,
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

  // Serve images from object storage
  app.get("/images/:filename", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const imagePath = `/images/${req.params.filename}`;
      const imageFile = await objectStorageService.getImageFile(imagePath);
      
      if (!imageFile) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      await objectStorageService.downloadObject(imageFile, res);
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ error: "Error serving image" });
    }
  });

  app.get("/api/stats", authenticateToken, checkPasswordChangeRequired, addLocationFilter, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      const locationFilter = (req as any).locationFilter;
      let stats: any;

      // Central admin gets global stats
      if (currentUser.role === 'central_admin') {
        stats = await storage.getStats();
      } else if (locationFilter) {
        // Location-based users get their location stats
        stats = await storage.getUserLocationStats(currentUser.id, locationFilter);
      } else {
        // Fallback to user's own stats
        stats = await storage.getReportStats(currentUser.id);
      }

      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "İstatistikler alınırken hata oluştu" });
    }
  });

  // Offline queue management
  app.post("/api/offline-queue", authenticateToken, checkPasswordChangeRequired, async (req, res) => {
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

  app.get("/api/offline-queue", authenticateToken, checkPasswordChangeRequired, async (req, res) => {
    try {
      const queueItems = await storage.getOfflineQueue();
      res.json(queueItems);
    } catch (error) {
      console.error("Get offline queue error:", error);
      res.status(500).json({ message: "Offline queue alınırken hata oluştu" });
    }
  });

  app.delete("/api/offline-queue/:id", authenticateToken, checkPasswordChangeRequired, async (req, res) => {
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
  app.get("/api/reports/:id/pdf", authenticateToken, checkPasswordChangeRequired, async (req: any, res) => {
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

  // Hospital Management API Endpoints
  // Get all hospitals with statistics - Central Admin only
  app.get('/api/admin/hospitals', authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const hospitalStats = await storage.getHospitalStatistics();
      res.json(hospitalStats);
    } catch (error) {
      console.error('Get hospital statistics error:', error);
      res.status(500).json({ message: 'Hastane istatistikleri alınırken hata oluştu' });
    }
  });

  // Get hospitals for specialists - only their assigned hospital
  app.get('/api/specialist/hospitals', authenticateToken, requireSafetySpecialist, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Check if user has a hospital assignment via locationId
      if (!user.locationId) {
        return res.status(403).json({ error: 'Hastane ataması bulunamadı' });
      }
      
      // Get user's assigned hospital
      const hospital = await storage.getLocationById(user.locationId);
      
      if (!hospital) {
        return res.status(403).json({ error: 'Hastane bilgisi bulunamadı' });
      }
      
      // Return only the specialist's assigned hospital
      res.json([hospital]);
    } catch (error) {
      console.error('Get specialist hospitals error:', error);
      res.status(500).json({ message: 'Hastane bilgileri alınırken hata oluştu' });
    }
  });

  // Create new hospital - Central Admin only
  app.post('/api/admin/hospitals', authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const user = (req as any).user;
      const validatedData = insertLocationSchema.parse(req.body);
      
      const newHospital = await storage.createLocation({
        ...validatedData,
        createdBy: user.id
      });
      
      // Automatically add new hospital to all active inspections for dynamic integration
      const addedToInspections = await storage.addHospitalToAllInspections(newHospital.id);
      console.log(`New hospital ${newHospital.name} added to ${addedToInspections} inspection title(s)`);
      
      res.status(201).json({ 
        ...newHospital, 
        addedToInspections 
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Geçersiz hastane bilgileri', errors: error.errors });
      }
      console.error('Create hospital error:', error);
      res.status(500).json({ message: 'Hastane oluşturulurken hata oluştu' });
    }
  });

  // Update hospital - Central Admin only
  app.put('/api/admin/hospitals/:id', authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const hospitalId = req.params.id;
      const validatedData = insertLocationSchema.partial().parse(req.body);
      
      const updatedHospital = await storage.updateLocation(hospitalId, validatedData);
      
      if (!updatedHospital) {
        return res.status(404).json({ message: 'Hastane bulunamadı' });
      }
      
      res.json(updatedHospital);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Geçersiz hastane bilgileri', errors: error.errors });
      }
      console.error('Update hospital error:', error);
      res.status(500).json({ message: 'Hastane güncellenirken hata oluştu' });
    }
  });

  // Delete hospital - Central Admin only
  app.delete('/api/admin/hospitals/:id', authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const hospitalId = req.params.id;
      
      // Check if hospital has users
      const users = await storage.getUsersByLocationId(hospitalId);
      if (users && users.length > 0) {
        return res.status(400).json({ 
          message: 'Bu hastanede kullanıcılar bulunmaktadır. Önce kullanıcıları başka hastaneye taşıyın.' 
        });
      }
      
      const deleted = await storage.deleteLocation(hospitalId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Hastane bulunamadı' });
      }
      
      res.json({ message: 'Hastane başarıyla silindi' });
    } catch (error) {
      console.error('Delete hospital error:', error);
      res.status(500).json({ message: 'Hastane silinirken hata oluştu' });
    }
  });

  // Get hospital by ID - Central Admin only
  app.get('/api/admin/hospitals/:id', authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const hospitalId = req.params.id;
      const hospital = await storage.getLocationById(hospitalId);
      
      if (!hospital) {
        return res.status(404).json({ message: 'Hastane bulunamadı' });
      }
      
      res.json(hospital);
    } catch (error) {
      console.error('Get hospital error:', error);
      res.status(500).json({ message: 'Hastane alınırken hata oluştu' });
    }
  });

  // Template sistem kapalı - sadece mevcut ReactPDF sistemi kullanılıyor

  // Object Storage Upload Endpoints
  const objectStorageService = new ObjectStorageService();

  // Get upload URL for profile images
  app.post("/api/objects/upload/profiles", authenticateToken, async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getUploadURL('profiles');
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting profile upload URL:", error);
      res.status(500).json({ error: "Error getting upload URL" });
    }
  });

  // Get upload URL for hospital logos
  app.post("/api/objects/upload/logos", authenticateToken, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      
      // Check if user has permission to upload logos
      if (!['central_admin', 'safety_specialist', 'occupational_physician'].includes(currentUser.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }
      
      const uploadURL = await objectStorageService.getUploadURL('logos');
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting logo upload URL:", error);
      res.status(500).json({ error: "Error getting upload URL" });
    }
  });

  // Get upload URL for documents and checklist files
  app.post("/api/objects/upload", authenticateToken, async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getUploadURL('profiles'); // Using existing method
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Error getting upload URL" });
    }
  });

  // Serve objects (profiles, logos, and all uploaded files)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectPath = req.params.objectPath;
      console.log('Serving object:', objectPath);
      
      // Try to get the file directly from private storage
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || '';
      const fullPath = `${privateObjectDir}/${objectPath}`;
      
      console.log('Looking for file at:', fullPath);
      
      // Parse the path and get the file
      const pathParts = fullPath.split('/');
      if (pathParts.length < 3) {
        return res.status(404).json({ error: "Invalid file path" });
      }

      const bucketName = pathParts[1];
      const objectName = pathParts.slice(2).join('/');
      
      console.log('Bucket:', bucketName, 'Object:', objectName);
      
      const { Storage } = require('@google-cloud/storage');
      const storage = new Storage({
        credentials: {
          audience: "replit",
          subject_token_type: "access_token",
          token_url: `http://127.0.0.1:1106/token`,
          type: "external_account",
          credential_source: {
            url: `http://127.0.0.1:1106/credential`,
            format: {
              type: "json",
              subject_token_field_name: "access_token",
            },
          },
          universe_domain: "googleapis.com",
        },
        projectId: "",
      });
      
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(objectName);

      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: "File not found" });
      }

      // Get file metadata
      const [metadata] = await file.getMetadata();
      
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": "public, max-age=3600",
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
      
    } catch (error: any) {
      console.error("Error serving object:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error serving file" });
      }
    }
  });

  // Update user profile image
  app.put("/api/users/:id/profile-image", authenticateToken, async (req, res) => {
    try {
      const userId = req.params.id;
      const currentUser = (req as any).user;
      const { imageURL } = req.body;

      // Users can only update their own profile image, or admin can update anyone's
      if (currentUser.id !== userId && !['central_admin'].includes(currentUser.role)) {
        return res.status(403).json({ error: 'Bu kullanıcının profil resmini değiştirme yetkiniz yok' });
      }

      if (!imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      const imagePath = objectStorageService.normalizeObjectPath(imageURL);
      
      // Update user profile image in database
      const updatedUser = await storage.updateUser(userId, { profileImage: imagePath });
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      res.json({ profileImage: imagePath, message: 'Profil resmi başarıyla güncellendi' });
    } catch (error: any) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ error: "Error updating profile image" });
    }
  });

  // Update hospital logo
  app.put("/api/hospitals/:id/logo", authenticateToken, async (req, res) => {
    try {
      const hospitalId = req.params.id;
      const currentUser = (req as any).user;
      const { logoURL } = req.body;

      // Check permissions: admin, safety_specialist, occupational_physician
      if (!['central_admin', 'safety_specialist', 'occupational_physician'].includes(currentUser.role)) {
        return res.status(403).json({ error: 'Hastane logosunu değiştirme yetkiniz yok' });
      }

      if (!logoURL) {
        return res.status(400).json({ error: "logoURL is required" });
      }

      const logoPath = objectStorageService.normalizeObjectPath(logoURL);
      
      // Update hospital logo in database
      const updatedHospital = await storage.updateLocation(hospitalId, { logo: logoPath });
      
      if (!updatedHospital) {
        return res.status(404).json({ error: 'Hastane bulunamadı' });
      }

      res.json({ logo: logoPath, message: 'Hastane logosu başarıyla güncellendi' });
    } catch (error: any) {
      console.error("Error updating hospital logo:", error);
      res.status(500).json({ error: "Error updating hospital logo" });
    }
  });

  // CHECKLIST API ENDPOINTS

  // Get categories and evaluation options
  app.get("/api/checklist/options", (req, res) => {
    res.json({
      categories: CHECKLIST_CATEGORIES,
      evaluations: EVALUATION_OPTIONS
    });
  });

  // Checklist Templates
  app.get("/api/checklist/templates", authenticateToken, async (req, res) => {
    try {
      const templates = await storage.getAllChecklistTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching checklist templates:", error);
      res.status(500).json({ error: "Error fetching checklist templates" });
    }
  });

  app.get("/api/checklist/templates/:id", authenticateToken, async (req, res) => {
    try {
      const template = await storage.getChecklistTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      console.error("Error fetching checklist template:", error);
      res.status(500).json({ error: "Error fetching checklist template" });
    }
  });

  app.post("/api/checklist/templates", authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      const validatedData = insertChecklistTemplateSchema.parse(req.body);
      
      const template = await storage.createChecklistTemplate({
        ...validatedData,
        createdBy: currentUser.id
      });
      
      res.status(201).json(template);
    } catch (error: any) {
      console.error("Error creating checklist template:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error creating checklist template" });
    }
  });

  app.put("/api/checklist/templates/:id", authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const validatedData = insertChecklistTemplateSchema.partial().parse(req.body);
      const template = await storage.updateChecklistTemplate(req.params.id, validatedData);
      res.json(template);
    } catch (error: any) {
      console.error("Error updating checklist template:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error updating checklist template" });
    }
  });

  app.delete("/api/checklist/templates/:id", authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const success = await storage.deleteChecklistTemplate(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json({ message: "Template deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting checklist template:", error);
      res.status(500).json({ error: "Error deleting checklist template" });
    }
  });

  // Checklist Sections
  app.get("/api/checklist/templates/:templateId/sections", authenticateToken, async (req, res) => {
    try {
      const sections = await storage.getTemplateSections(req.params.templateId);
      res.json(sections);
    } catch (error: any) {
      console.error("Error fetching checklist sections:", error);
      res.status(500).json({ error: "Error fetching checklist sections" });
    }
  });

  // Get template question count
  app.get("/api/checklist/templates/:templateId/question-count", authenticateToken, async (req, res) => {
    try {
      const sections = await storage.getTemplateSections(req.params.templateId);
      let totalQuestions = 0;
      
      // Get questions for each section and count them
      for (const section of sections) {
        const questions = await storage.getSectionQuestions(section.id);
        totalQuestions += questions.length;
      }
      
      res.json({ count: totalQuestions });
    } catch (error: any) {
      console.error("Error fetching template question count:", error);
      res.status(500).json({ error: "Error fetching template question count" });
    }
  });

  app.post("/api/checklist/sections", authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const validatedData = insertChecklistSectionSchema.parse(req.body);
      const section = await storage.createChecklistSection(validatedData);
      res.status(201).json(section);
    } catch (error: any) {
      console.error("Error creating checklist section:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error creating checklist section" });
    }
  });

  app.put("/api/checklist/sections/:id", authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const validatedData = insertChecklistSectionSchema.partial().parse(req.body);
      const section = await storage.updateChecklistSection(req.params.id, validatedData);
      res.json(section);
    } catch (error: any) {
      console.error("Error updating checklist section:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error updating checklist section" });
    }
  });

  app.delete("/api/checklist/sections/:id", authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const success = await storage.deleteChecklistSection(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Section not found" });
      }
      res.json({ message: "Section deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting checklist section:", error);
      res.status(500).json({ error: "Error deleting checklist section" });
    }
  });

  // Checklist Questions
  // Get single section
  app.get("/api/checklist/sections/:id", authenticateToken, async (req, res) => {
    try {
      const section = await storage.getChecklistSection(req.params.id);
      if (section) {
        res.json(section);
      } else {
        res.status(404).json({ error: "Section not found" });
      }
    } catch (error: any) {
      console.error("Error fetching checklist section:", error);
      res.status(500).json({ error: "Error fetching checklist section" });
    }
  });

  app.get("/api/checklist/sections/:sectionId/questions", authenticateToken, async (req, res) => {
    try {
      const questions = await storage.getSectionQuestions(req.params.sectionId);
      res.json(questions);
    } catch (error: any) {
      console.error("Error fetching checklist questions:", error);
      res.status(500).json({ error: "Error fetching checklist questions" });
    }
  });

  app.post("/api/checklist/questions", authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const validatedData = insertChecklistQuestionSchema.parse(req.body);
      const question = await storage.createChecklistQuestion(validatedData);
      res.status(201).json(question);
    } catch (error: any) {
      console.error("Error creating checklist question:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error creating checklist question" });
    }
  });

  // Get single question by ID for editing
  app.get("/api/checklist/questions/:id", authenticateToken, async (req, res) => {
    try {
      console.log('Fetching question by ID:', req.params.id);
      const question = await storage.getChecklistQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      console.log('Found question:', question);
      res.json(question);
    } catch (error: any) {
      console.error("Error fetching checklist question:", error);
      res.status(500).json({ error: "Error fetching checklist question" });
    }
  });

  app.put("/api/checklist/questions/:id", authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      console.log('Updating question:', req.params.id, 'with data:', req.body);
      const validatedData = insertChecklistQuestionSchema.partial().parse(req.body);
      console.log('Validated data:', validatedData);
      const question = await storage.updateChecklistQuestion(req.params.id, validatedData);
      console.log('Updated question:', question);
      res.json(question);
    } catch (error: any) {
      console.error("Error updating checklist question:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error updating checklist question" });
    }
  });

  app.delete("/api/checklist/questions/:id", authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const success = await storage.deleteChecklistQuestion(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json({ message: "Question deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting checklist question:", error);
      res.status(500).json({ error: "Error deleting checklist question" });
    }
  });

  // Checklist Inspections
  app.get("/api/checklist/inspections", authenticateToken, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      let inspections;
      
      if (currentUser.role === 'central_admin') {
        inspections = await storage.getAllChecklistInspections();
      } else {
        // Get inspections for user's location or created by user
        if (currentUser.locationId) {
          inspections = await storage.getLocationInspections(currentUser.locationId);
        } else {
          inspections = await storage.getInspectorInspections(currentUser.id);
        }
      }
      
      res.json(inspections);
    } catch (error: any) {
      console.error("Error fetching checklist inspections:", error);
      res.status(500).json({ error: "Error fetching checklist inspections" });
    }
  });

  app.get("/api/checklist/inspections/:id", authenticateToken, async (req, res) => {
    try {
      const inspection = await storage.getChecklistInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error: any) {
      console.error("Error fetching checklist inspection:", error);
      res.status(500).json({ error: "Error fetching checklist inspection" });
    }
  });

  app.post("/api/checklist/inspections", authenticateToken, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      const validatedData = insertInspectionSchema.parse(req.body);
      
      const inspection = await storage.createChecklistInspection({
        ...validatedData,
        inspectorId: currentUser.id
      });
      
      res.status(201).json(inspection);
    } catch (error: any) {
      console.error("Error creating checklist inspection:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error creating checklist inspection" });
    }
  });

  app.put("/api/checklist/inspections/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertInspectionSchema.partial().parse(req.body);
      const inspection = await storage.updateChecklistInspection(req.params.id, validatedData);
      res.json(inspection);
    } catch (error: any) {
      console.error("Error updating checklist inspection:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error updating checklist inspection" });
    }
  });

  app.delete("/api/checklist/inspections/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteChecklistInspection(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json({ message: "Inspection deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting checklist inspection:", error);
      res.status(500).json({ error: "Error deleting checklist inspection" });
    }
  });

  // Checklist Answers
  app.get("/api/checklist/inspections/:inspectionId/answers", authenticateToken, async (req, res) => {
    try {
      const answers = await storage.getInspectionAnswers(req.params.inspectionId);
      res.json(answers);
    } catch (error: any) {
      console.error("Error fetching checklist answers:", error);
      res.status(500).json({ error: "Error fetching checklist answers" });
    }
  });

  app.post("/api/checklist/answers", authenticateToken, async (req, res) => {
    try {
      // const validatedData = insertChecklistAnswerSchema.parse(req.body);
      const validatedData = req.body;
      const answer = await storage.createChecklistAnswer(validatedData);
      res.status(201).json(answer);
    } catch (error: any) {
      console.error("Error creating checklist answer:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error creating checklist answer" });
    }
  });

  app.put("/api/checklist/answers/:id", authenticateToken, async (req, res) => {
    try {
      // const validatedData = insertChecklistAnswerSchema.partial().parse(req.body);
      const validatedData = req.body;
      const answer = await storage.updateChecklistAnswer(req.params.id, validatedData);
      res.json(answer);
    } catch (error: any) {
      console.error("Error updating checklist answer:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error updating checklist answer" });
    }
  });

  app.delete("/api/checklist/answers/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteChecklistAnswer(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Answer not found" });
      }
      res.json({ message: "Answer deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting checklist answer:", error);
      res.status(500).json({ error: "Error deleting checklist answer" });
    }
  });

  app.get("/api/checklist/inspections/:id/score", authenticateToken, async (req, res) => {
    try {
      const scoreData = await storage.calculateInspectionScore(req.params.id);
      res.json(scoreData);
    } catch (error: any) {
      console.error("Error calculating inspection score:", error);
      res.status(500).json({ error: "Error calculating inspection score" });
    }
  });

  // Checklist Assignment System - Admin assigns tasks to hospitals
  app.get("/api/checklist/assignments", authenticateToken, async (req, res) => {
    try {
      const assignments = await storage.getChecklistAssignments();
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching checklist assignments:", error);
      res.status(500).json({ error: "Error fetching checklist assignments" });
    }
  });

  app.get("/api/checklist/assignments/hospital/:hospitalId", authenticateToken, async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsForHospital(req.params.hospitalId);
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching hospital assignments:", error);
      res.status(500).json({ error: "Error fetching hospital assignments" });
    }
  });

  app.get("/api/checklist/assignments/user/:userId", authenticateToken, async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsForUser(req.params.userId);
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching user assignments:", error);
      res.status(500).json({ error: "Error fetching user assignments" });
    }
  });

  app.post("/api/checklist/assignments", authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      // const validatedData = insertChecklistAssignmentSchema.parse(req.body);
      const validatedData = req.body;
      const assignment = await storage.createChecklistAssignment({
        ...validatedData,
        assignedBy: (req as any).user.id
      });
      res.status(201).json(assignment);
    } catch (error: any) {
      console.error("Error creating checklist assignment:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error creating checklist assignment" });
    }
  });

  app.patch("/api/checklist/assignments/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      const assignment = await storage.updateAssignmentStatus(req.params.id, status);
      res.json(assignment);
    } catch (error: any) {
      console.error("Error updating assignment status:", error);
      res.status(500).json({ error: "Error updating assignment status" });
    }
  });

  app.delete("/api/checklist/assignments/:id", authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const success = await storage.deleteChecklistAssignment(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      res.json({ message: "Assignment deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting checklist assignment:", error);
      res.status(500).json({ error: "Error deleting checklist assignment" });
    }
  });

  // Create inspection from assignment
  app.post("/api/checklist/assignments/:assignmentId/create-inspection", authenticateToken, async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const userId = req.user.id;
      
      // Get assignment
      const assignment = await storage.getChecklistAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      // Check if user has permission
      if (assignment.assignedToUser && assignment.assignedToUser !== userId) {
        return res.status(403).json({ message: 'Not authorized for this assignment' });
      }
      
      if (assignment.assignedToHospital !== req.user.locationId) {
        return res.status(403).json({ message: 'Not authorized for this hospital' });
      }
      
      // Check if inspection already exists
      const existingInspection = await storage.getInspectionByAssignmentId(assignmentId);
      if (existingInspection) {
        return res.json(existingInspection);
      }
      
      // Create new inspection
      const inspection = await storage.createInspectionFromAssignment({
        assignmentId,
        templateId: assignment.templateId,
        inspectorId: userId,
        locationId: assignment.assignedToHospital,
        title: assignment.title,
        description: assignment.description || '',
        dueDate: assignment.dueDate
      });
      
      // Update assignment status
      await storage.updateChecklistAssignment(assignmentId, { status: 'in_progress' });
      
      res.json(inspection);
    } catch (error) {
      console.error('Error creating inspection from assignment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Assignment submissions
  app.get("/api/checklist/assignments/:id/submissions", authenticateToken, async (req, res) => {
    try {
      const submissions = await storage.getAssignmentSubmissions(req.params.id);
      res.json(submissions);
    } catch (error: any) {
      console.error("Error fetching assignment submissions:", error);
      res.status(500).json({ error: "Error fetching assignment submissions" });
    }
  });

  app.post("/api/checklist/submissions", authenticateToken, async (req, res) => {
    try {
      // const validatedData = insertChecklistSubmissionSchema.parse(req.body);
      const validatedData = req.body;
      const submission = await storage.createChecklistSubmission({
        ...validatedData,
        submittedBy: (req as any).user.id
      });
      res.status(201).json(submission);
    } catch (error: any) {
      console.error("Error creating checklist submission:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Error creating checklist submission" });
    }
  });

  // NEW: Inspection Management System Routes

  // Get all inspections (Admin only)
  app.get('/api/inspections', authenticateToken, requireCentralManagement, async (req: Request, res: Response) => {
    try {
      const inspections = await storage.getAllInspections();
      res.json(inspections);
    } catch (error) {
      console.error('Error fetching inspections:', error);
      res.status(500).json({ error: 'Error fetching inspections' });
    }
  });

  // Create new inspection (Central Admin only)
  app.post('/api/inspections', authenticateToken, requireCentralManagement, async (req: Request, res: Response) => {
    try {
      const { assignments, ...inspectionData } = req.body;
      const validatedData = insertInspectionSchema.parse(inspectionData);
      const user = (req as any).user;
      
      const inspection = await storage.createInspection({
        ...validatedData,
        createdBy: user.id
      });

      // Create assignments for all selected hospitals
      const assignmentPromises = assignments.map((assignmentData: any) => 
        storage.createInspectionAssignment({
          inspectionId: inspection.id,
          locationId: assignmentData.locationId,
          assignedUserId: assignmentData.assignedUserId,
          totalQuestions: assignmentData.totalQuestions,
          totalPossibleScore: assignmentData.totalPossibleScore || (assignmentData.totalQuestions * 10),
          status: 'pending'
        })
      );
      
      const createdAssignments = await Promise.all(assignmentPromises);

      // Create notifications for assigned users
      for (const assignment of createdAssignments) {
        try {
          await createNotificationForUser(
            assignment.assignedUserId,
            'inspection_assigned',
            'Yeni Denetim Atandı',
            `"${inspection.title}" denetimi size atanmıştır. Son tarih: ${new Date(inspection.dueDate).toLocaleDateString('tr-TR')}`,
            inspection.id,
            'inspection'
          );
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
        }
      }

      res.status(201).json({ 
        inspection,
        assignments: createdAssignments
      });
    } catch (error) {
      console.error('Error creating inspection:', error);
      res.status(500).json({ error: 'Error creating inspection' });
    }
  });

  // Get user's assignments (for safety specialists)
  app.get('/api/user/assignments', authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const assignments = await storage.getUserAssignments(user.id);
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching user assignments:', error);
      res.status(500).json({ error: 'Error fetching user assignments' });
    }
  });

  // Get assignment details (for assigned user)
  app.get('/api/assignments/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const assignmentId = req.params.id;
      const assignment = await storage.getInspectionAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      
      res.json(assignment);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      res.status(500).json({ error: 'Error fetching assignment' });
    }
  });

  // Start inspection (for assigned user)
  app.post('/api/assignments/:id/start', authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const success = await storage.startInspection(req.params.id, user.id);
      if (success) {
        res.json({ message: 'Inspection started successfully' });
      } else {
        res.status(400).json({ error: 'Cannot start inspection' });
      }
    } catch (error) {
      console.error('Error starting inspection:', error);
      res.status(500).json({ error: 'Error starting inspection' });
    }
  });

  // Submit response to a question
  app.post('/api/assignments/:assignmentId/questions/:questionId/response', authenticateToken, async (req: Request, res: Response) => {
    try {
      const validatedData = insertInspectionResponseSchema.parse(req.body);
      const user = (req as any).user;
      
      const response = await storage.submitInspectionResponse(
        req.params.assignmentId,
        req.params.questionId,
        validatedData
      );
      
      res.json(response);
    } catch (error) {
      console.error('Error submitting inspection response:', error);
      res.status(500).json({ error: 'Error submitting inspection response' });
    }
  });

  // Bulk submit inspection responses
  app.post('/api/inspection/responses', authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const responses = req.body; // Array of response objects
      
      const results = [];
      for (const responseData of responses) {
        const validatedData = {
          assignmentId: responseData.assignmentId,
          questionId: responseData.questionId, 
          answer: responseData.answer,
          notes: responseData.notes || '',
          photos: responseData.photos || [],
          documents: responseData.documents || [],
          respondedBy: user.id
        };
        
        const response = await storage.submitInspectionResponse(
          responseData.assignmentId,
          responseData.questionId,
          validatedData
        );
        results.push(response);
      }
      
      res.json(results);
    } catch (error: any) {
      console.error('Error submitting bulk inspection responses:', error);
      res.status(500).json({ error: 'Error submitting bulk inspection responses' });
    }
  });

  // Complete an assignment
  app.post('/api/assignments/:assignmentId/complete', authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const assignmentId = req.params.assignmentId;
      
      // Update assignment status to completed
      const success = await storage.completeInspection(assignmentId, user.id);
      
      if (success) {
        // Create notification for admins
        await createNotificationForUser(
          'admin', // This should be adapted based on your admin detection logic
          'inspection_completed',
          'Denetim Tamamlandı',
          `${user.fullName || user.username} tarafından denetim tamamlandı.`,
          assignmentId,
          'assignment'
        );
        
        res.json({ message: 'Assignment completed successfully' });
      } else {
        res.status(400).json({ error: 'Cannot complete assignment' });
      }
    } catch (error: any) {
      console.error('Error completing assignment:', error);
      res.status(500).json({ error: 'Error completing assignment' });
    }
  });

  // Get responses for an assignment
  app.get('/api/assignments/:assignmentId/responses', authenticateToken, async (req: Request, res: Response) => {
    try {
      const assignmentId = req.params.assignmentId;
      const responses = await storage.getInspectionResponses(assignmentId);
      res.json(responses);
    } catch (error: any) {
      console.error('Error fetching assignment responses:', error);
      res.status(500).json({ error: 'Error fetching assignment responses' });
    }
  });

  // Admin: Get all completed inspections for management
  app.get('/api/admin/inspections', authenticateToken, requireCentralManagement, async (req: Request, res: Response) => {
    try {
      const inspections = await storage.getAllCompletedInspections();
      res.json(inspections);
    } catch (error: any) {
      console.error('Error fetching admin inspections:', error);
      res.status(500).json({ error: 'Error fetching admin inspections' });
    }
  });

  // Get all inspection titles with statistics (for admin analysis)
  app.get('/api/admin/inspection-titles', authenticateToken, requireCentralManagement, async (req: Request, res: Response) => {
    try {
      const inspectionTitleStats = await storage.getInspectionTitleStatistics();
      res.json(inspectionTitleStats);
    } catch (error: any) {
      console.error('Error fetching inspection title statistics:', error);
      res.status(500).json({ error: 'Error fetching inspection title statistics' });
    }
  });

  // Update inspection title target hospitals - Central Admin only
  app.put('/api/admin/inspection-titles/:id/hospitals', authenticateToken, requireCentralManagement, async (req, res) => {
    try {
      const inspectionId = req.params.id;
      const { targetLocationIds } = req.body;
      
      if (!Array.isArray(targetLocationIds)) {
        return res.status(400).json({ message: 'targetLocationIds array gerekli' });
      }
      
      const result = await storage.updateInspectionTargetHospitals(inspectionId, targetLocationIds);
      
      if (!result) {
        return res.status(404).json({ message: 'Inspection title bulunamadı' });
      }
      
      res.json({ message: 'Hedef hastaneler başarıyla güncellendi', targetLocationIds });
    } catch (error) {
      console.error('Update inspection target hospitals error:', error);
      res.status(500).json({ message: 'Hedef hastaneler güncellenirken hata oluştu' });
    }
  });

  // Helper function to create notifications
  const createNotificationForUser = async (userId: string, type: string, title: string, message: string, relatedId?: string, relatedType?: string) => {
    try {
      await storage.createNotification({
        userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  // Notification routes
  app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const notifications = await storage.getUserNotifications(user.id);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Error fetching notifications' });
    }
  });

  app.get('/api/notifications/unread', authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const notifications = await storage.getUnreadNotifications(user.id);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      res.status(500).json({ error: 'Error fetching unread notifications' });
    }
  });

  app.get('/api/notifications/count', authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const count = await storage.getNotificationCount(user.id);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching notification count:', error);
      res.status(500).json({ error: 'Error fetching notification count' });
    }
  });

  // === SPECIALIST-SPECIFIC ENDPOINTS ===
  
  // Get recent inspections for specialist's hospital
  app.get('/api/hospital/:hospitalId/recent-inspections', authenticateToken, async (req, res) => {
    try {
      const { hospitalId } = req.params;
      const user = (req as any).user;
      
      // Get user assignments for verification  
      const userAssignments = await storage.getUserAssignments(user.id);
      
      // Verify user has assignments
      if (userAssignments.length === 0) {
        return res.status(403).json({ error: 'Bu kullanıcının denetim ataması bulunamadı' });
      }
      
      // Get recent inspections for this hospital (real data)
      const userAssignmentsForHospital = await storage.getUserAssignments(user.id);
      const recentInspections = userAssignmentsForHospital.map((assignment: any) => ({
        id: assignment.id,
        title: assignment.inspection?.title || 'Denetim',
        templateName: assignment.inspection?.description || 'Şablon',
        status: assignment.status,
        progress: assignment.progressPercentage || 0,
        scorePercentage: assignment.scorePercentage || 0,
        letterGrade: assignment.letterGrade || '',
        createdAt: assignment.assignedAt,
        updatedAt: assignment.updatedAt,
        completedAt: assignment.completedAt,
        assignedAt: assignment.assignedAt,
        dueDate: assignment.inspection?.dueDate
      }));
      
      res.json(recentInspections);
    } catch (error) {
      console.error('Error fetching recent inspections:', error);
      res.status(500).json({ error: 'Error fetching recent inspections' });
    }
  });

  // Get inspections for a specific checklist (specialist view)
  app.get('/api/specialist/checklist/:checklistId/inspections', authenticateToken, requireSafetySpecialist, async (req, res) => {
    try {
      const { checklistId } = req.params;
      const user = (req as any).user;
      
      // Get user's hospital
      const userAssignments = await storage.getUserAssignments(user.id);
      const userHospital = userAssignments[0]?.hospital;
      
      if (!userHospital) {
        return res.status(403).json({ error: 'Hastane ataması bulunamadı' });
      }
      
      // Get inspections for this checklist at user's hospital (mock data for now)
      const inspections = [
        {
          id: 'insp-1',
          title: 'Haftalık ADP Denetimi',
          description: 'Haftalık rutin ADP checklist denetimi',
          status: 'completed',
          progress: 100,
          templateId: checklistId,
          hospitalId: userHospital.id,
          createdBy: user.id,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'insp-2',
          title: 'Aylık Kapsamlı Denetim',
          description: 'Aylık detaylı checklist denetimi',
          status: 'in_progress',
          progress: 45,
          templateId: checklistId,
          hospitalId: userHospital.id,
          createdBy: user.id,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'insp-3',
          title: 'Yeni Başlatılan Denetim',
          description: 'Admin tarafından yeni oluşturulan checklist denetimi',
          status: 'pending',
          progress: 0,
          templateId: checklistId,
          hospitalId: userHospital.id,
          createdBy: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      
      res.json(inspections);
    } catch (error) {
      console.error('Error fetching specialist checklist inspections:', error);
      res.status(500).json({ error: 'Error fetching specialist checklist inspections' });
    }
  });

  // Get specific inspection details for specialist
  app.get('/api/specialist/inspection/:inspectionId', authenticateToken, requireSafetySpecialist, async (req, res) => {
    try {
      const { inspectionId } = req.params;
      const user = (req as any).user;
      
      // Get user's hospital
      const userAssignments = await storage.getUserAssignments(user.id);
      const userHospital = userAssignments[0]?.hospital;
      
      if (!userHospital) {
        return res.status(403).json({ error: 'Hastane ataması bulunamadı' });
      }
      
      // Mock inspection data
      const inspection = {
        id: inspectionId,
        title: 'Denetim Detayı',
        description: 'Bu denetim specialist tarafından yönetiliyor',
        status: inspectionId === 'insp-1' ? 'completed' : inspectionId === 'insp-2' ? 'in_progress' : 'pending',
        progress: inspectionId === 'insp-1' ? 100 : inspectionId === 'insp-2' ? 45 : 0,
        templateId: 'bac1e1ac-9d4b-4a72-ba38-f1e8931e08c2',
        hospitalId: userHospital.id,
        createdBy: user.id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: inspectionId === 'insp-1' ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() : null,
      };
      
      res.json(inspection);
    } catch (error) {
      console.error('Error fetching specialist inspection:', error);
      res.status(500).json({ error: 'Error fetching specialist inspection' });
    }
  });

  // Create new inspection for specialist
  app.post('/api/specialist/inspection', authenticateToken, requireSafetySpecialist, async (req, res) => {
    try {
      const user = (req as any).user;
      const { checklistId, title, description } = req.body;
      
      // Get user's hospital
      const userAssignments = await storage.getUserAssignments(user.id);
      const userHospital = userAssignments[0]?.hospital;
      
      if (!userHospital) {
        return res.status(403).json({ error: 'Hastane ataması bulunamadı' });
      }
      
      // Create new inspection (mock implementation)
      const newInspection = {
        id: `insp-${Date.now()}`,
        title: title || 'Yeni Denetim',
        description: description || '',
        status: 'pending',
        progress: 0,
        templateId: checklistId,
        hospitalId: userHospital.id,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      res.status(201).json(newInspection);
    } catch (error) {
      console.error('Error creating specialist inspection:', error);
      res.status(500).json({ error: 'Error creating specialist inspection' });
    }
  });

  // Update inspection progress/status for specialist
  app.put('/api/specialist/inspection/:inspectionId', authenticateToken, requireSafetySpecialist, async (req, res) => {
    try {
      const { inspectionId } = req.params;
      const user = (req as any).user;
      const { status, progress, completedAt } = req.body;
      
      // Get user's hospital
      const userAssignments = await storage.getUserAssignments(user.id);
      const userHospital = userAssignments[0]?.hospital;
      
      if (!userHospital) {
        return res.status(403).json({ error: 'Hastane ataması bulunamadı' });
      }
      
      // Update inspection (mock implementation)
      const updatedInspection = {
        id: inspectionId,
        title: 'Güncellenmiş Denetim',
        description: 'Bu denetim güncellendi',
        status: status || 'in_progress',
        progress: progress || 0,
        templateId: 'bac1e1ac-9d4b-4a72-ba38-f1e8931e08c2',
        hospitalId: userHospital.id,
        createdBy: user.id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: completedAt || null,
      };
      
      res.json(updatedInspection);
    } catch (error) {
      console.error('Error updating specialist inspection:', error);
      res.status(500).json({ error: 'Error updating specialist inspection' });
    }
  });

  // Get inspection assignments for specialists
  app.get('/api/specialist/inspections/:inspectionId/assignments', authenticateToken, requireSafetySpecialist, async (req, res) => {
    try {
      const { inspectionId } = req.params;
      const user = (req as any).user;
      
      // Get user's hospital
      const userAssignments = await storage.getUserAssignments(user.id);
      const userHospital = userAssignments[0]?.hospital;
      
      if (!userHospital) {
        return res.status(403).json({ error: 'Hastane ataması bulunamadı' });
      }
      
      // Mock inspection assignment data for analysis
      const assignments = [
        {
          id: 'assignment-1',
          inspectionId: inspectionId,
          locationId: userHospital.id,
          assignedUserId: user.id,
          status: 'completed',
          scorePercentage: 85,
          letterGrade: 'B',
          totalQuestions: 45,
          answeredQuestions: 45,
          totalPossibleScore: 450,
          earnedScore: 383,
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          location: userHospital,
          assignedUser: {
            id: user.id,
            fullName: user.fullName,
            role: user.role
          }
        }
      ];
      
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching specialist inspection assignments:', error);
      res.status(500).json({ error: 'Error fetching specialist inspection assignments' });
    }
  });

  // Get specialist inspection analysis
  app.get('/api/specialist/inspection/:inspectionId/analysis', authenticateToken, requireSafetySpecialist, async (req, res) => {
    try {
      const { inspectionId } = req.params;
      const user = (req as any).user;
      
      // Check if user has a hospital assignment via locationId
      if (!user.locationId) {
        return res.status(403).json({ error: 'Hastane ataması bulunamadı' });
      }
      
      // Get user's assigned hospital
      const userHospital = await storage.getLocationById(user.locationId);
      
      if (!userHospital) {
        return res.status(403).json({ error: 'Hastane bilgisi bulunamadı' });
      }
      
      // Mock comprehensive analysis data
      const analysisData = {
        inspection: {
          id: inspectionId,
          title: 'İSG Risk Değerlendirmesi Denetimi',
          description: 'Hastane geneli iş sağlığı ve güvenliği risk değerlendirmesi',
          status: 'completed',
          hospital: userHospital,
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          inspector: {
            id: user.id,
            fullName: user.fullName,
            role: user.role
          }
        },
        overall: {
          totalQuestions: 45,
          totalPossiblePoints: 450,
          totalEarnedPoints: 383,
          scorePercentage: 85,
          letterGrade: 'B',
          meetsCriteria: 32,
          partiallyMeets: 8,
          doesNotMeet: 3,
          outOfScope: 2
        },
        sections: [
          {
            id: 'section-1',
            title: 'İş Sağlığı ve Güvenliği Politikası',
            totalQuestions: 15,
            earnedPoints: 135,
            maxPoints: 150,
            successRate: 90,
            grade: 'A',
            meets: 12,
            partial: 2,
            doesNotMeet: 1,
            outOfScope: 0,
            findings: [
              {
                id: 'finding-1',
                question: 'İSG politikası yazılı olarak belirlenmiş mi?',
                status: 'meets',
                points: 10,
                maxPoints: 10,
                notes: 'İSG politikası yazılı olarak hazırlanmış ve uygun yerlerde asılmıştır.'
              }
            ]
          },
          {
            id: 'section-2',
            title: 'Risk Değerlendirmesi',
            totalQuestions: 20,
            earnedPoints: 160,
            maxPoints: 200,
            successRate: 80,
            grade: 'B',
            meets: 14,
            partial: 4,
            doesNotMeet: 2,
            outOfScope: 0,
            findings: []
          },
          {
            id: 'section-3',
            title: 'Acil Durum Planları',
            totalQuestions: 10,
            earnedPoints: 88,
            maxPoints: 100,
            successRate: 88,
            grade: 'B+',
            meets: 6,
            partial: 2,
            doesNotMeet: 0,
            outOfScope: 2,
            findings: []
          }
        ]
      };
      
      res.json(analysisData);
    } catch (error) {
      console.error('Error fetching specialist inspection analysis:', error);
      res.status(500).json({ error: 'Error fetching specialist inspection analysis' });
    }
  });

  app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const success = await storage.markNotificationAsRead(req.params.id, user.id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Notification not found or not accessible' });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Error marking notification as read' });
    }
  });

  app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const success = await storage.markAllNotificationsAsRead(user.id);
      res.json({ success });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Error marking all notifications as read' });
    }
  });

  // Health check endpoint for production monitoring
  app.get('/api/health', async (req, res) => {
    try {
      const dbHealthy = await checkDatabaseHealth();
      const currentTime = new Date().toISOString();
      
      res.status(dbHealthy ? 200 : 503).json({
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: currentTime,
        database: dbHealthy ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}