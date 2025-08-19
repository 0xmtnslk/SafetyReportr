import { db } from './db';
import { pdfTemplates, pdfTemplateFields } from '@shared/schema';
import type { 
  PdfTemplate, 
  InsertPdfTemplate, 
  TemplateConfig, 
  TemplateSection, 
  TemplateStyles 
} from '@shared/schema';
import { eq } from 'drizzle-orm';

export class TemplateManager {
  // Create new template
  async createTemplate(templateData: InsertPdfTemplate): Promise<PdfTemplate> {
    const [template] = await db
      .insert(pdfTemplates)
      .values([templateData as any])
      .returning();
    
    return template;
  }

  // Update existing template
  async updateTemplate(templateId: string, updates: Partial<InsertPdfTemplate>): Promise<PdfTemplate | null> {
    const updateData: any = { ...updates };
    delete updateData.updatedAt; // Let database handle timestamp
    
    const [template] = await db
      .update(pdfTemplates)
      .set(updateData)
      .where(eq(pdfTemplates.id, templateId))
      .returning();

    return template || null;
  }

  // Get template by ID
  async getTemplate(templateId: string): Promise<PdfTemplate | null> {
    const [template] = await db
      .select()
      .from(pdfTemplates)
      .where(eq(pdfTemplates.id, templateId))
      .limit(1);

    return template || null;
  }

  // Get template by name
  async getTemplateByName(name: string): Promise<PdfTemplate | null> {
    const [template] = await db
      .select()
      .from(pdfTemplates)
      .where(eq(pdfTemplates.name, name))
      .limit(1);

    return template || null;
  }

  // List all active templates
  async getActiveTemplates(): Promise<PdfTemplate[]> {
    return await db
      .select()
      .from(pdfTemplates)
      .where(eq(pdfTemplates.isActive, true))
      .orderBy(pdfTemplates.templateType, pdfTemplates.displayName);
  }

  // Initialize default templates
  async initializeDefaultTemplates(): Promise<void> {
    console.log('Initializing default PDF templates...');

    // Check if ISG template already exists
    const existingTemplate = await this.getTemplateByName('isg_inspection_report');
    if (existingTemplate) {
      console.log('ISG template already exists');
      return;
    }

    // Create ISG Report Template
    await this.createISGReportTemplate();
    console.log('Default templates initialized successfully');
  }

  // Create ISG Report Template
  private async createISGReportTemplate(): Promise<PdfTemplate> {
    const config: TemplateConfig = {
      pageSize: 'A4' as const,
      orientation: 'portrait' as const,
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      fonts: {
        primary: 'helvetica',
        sizes: {
          title: 24,
          header: 14,
          subheader: 12,
          body: 10,
          small: 9
        }
      },
      colors: {
        primary: '#2563eb',
        text: '#000000',
        gray: '#6b7280',
        lightGray: '#f3f4f6',
        white: '#ffffff'
      },
      logo: {
        url: 'logo',
        width: 30,
        height: 30,
        position: { x: 15, y: 8 }
      }
    };

    const styles: TemplateStyles = {
      fonts: {
        title: { family: 'helvetica', size: 24, weight: 'bold', color: '#2563eb' },
        header: { family: 'helvetica', size: 14, weight: 'bold', color: '#ffffff' },
        subheader: { family: 'helvetica', size: 12, weight: 'bold', color: '#000000' },
        body: { family: 'helvetica', size: 10, weight: 'normal', color: '#000000' },
        small: { family: 'helvetica', size: 9, weight: 'normal', color: '#6b7280' }
      },
      colors: {
        primary: '#2563eb',
        text: '#000000',
        gray: '#6b7280',
        lightGray: '#f3f4f6',
        white: '#ffffff',
        red: '#dc2626'
      },
      spacing: {
        small: 5,
        medium: 10,
        large: 20
      },
      borders: {
        thin: { width: 1, color: '#d1d5db', style: 'solid' },
        medium: { width: 2, color: '#2563eb', style: 'solid' }
      }
    };

    const sections: TemplateSection[] = [
      // Cover Page Header
      {
        id: 'cover_header',
        name: 'Cover Page Header',
        type: 'header',
        position: { x: 0, y: 0 },
        dimensions: { width: 210, height: 45 },
        style: { backgroundColor: '#2563eb' },
        dataBinding: '',
        components: [
          {
            id: 'header_bg',
            type: 'rectangle',
            content: '',
            position: { x: 0, y: 0 },
            dimensions: { width: 210, height: 45 },
            style: { fillColor: '#2563eb' }
          },
          {
            id: 'logo',
            type: 'image',
            content: 'logo',
            position: { x: 15, y: 8 },
            dimensions: { width: 30, height: 30 },
            style: {}
          },
          {
            id: 'company_name',
            type: 'text',
            content: 'MLPCARE',
            position: { x: 50, y: 25 },
            style: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' }
          }
        ]
      },
      
      // Title Section
      {
        id: 'title_section',
        name: 'Report Title',
        type: 'content',
        position: { x: 15, y: 70 },
        dimensions: { width: 180, height: 40 },
        style: {},
        dataBinding: '',
        components: [
          {
            id: 'main_title',
            type: 'text',
            content: 'İŞ SAĞLIĞI VE GÜVENLİĞİ',
            position: { x: 0, y: 0 },
            style: { fontSize: 24, fontWeight: 'bold', color: '#2563eb' }
          },
          {
            id: 'sub_title',
            type: 'text',
            content: 'SAHA GÖZLEM RAPORU',
            position: { x: 0, y: 15 },
            style: { fontSize: 24, fontWeight: 'bold', color: '#2563eb' }
          },
          {
            id: 'project_location',
            type: 'text',
            content: '{{projectLocation}}',
            position: { x: 0, y: 35 },
            dimensions: { width: 180, height: 20 },
            dataBinding: 'projectLocation',
            style: { fontSize: 16, color: '#6b7280' }
          }
        ]
      },

      // Report Info Table
      {
        id: 'report_info',
        name: 'Report Information',
        type: 'table',
        position: { x: 15, y: 140 },
        dimensions: { width: 180, height: 100 },
        style: {},
        dataBinding: '',
        components: [
          {
            id: 'info_table',
            type: 'table',
            content: {
              columns: [
                { field: 'label', header: 'Alan', width: 60 },
                { field: 'value', header: 'Değer', width: 120 }
              ],
              cellHeight: 15,
              headerStyle: { backgroundColor: '#f3f4f6', fontWeight: 'bold' }
            },
            position: { x: 0, y: 0 },
            dimensions: { width: 180, height: 100 },
            dataBinding: 'reportInfo',
            style: { fontSize: 11 }
          }
        ]
      },

      // Executive Summary Page Header
      {
        id: 'summary_header',
        name: 'Executive Summary Header',
        type: 'header',
        position: { x: 0, y: 0 },
        dimensions: { width: 210, height: 35 },
        style: {},
        dataBinding: '',
        components: [
          {
            id: 'summary_bg',
            type: 'rectangle',
            content: '',
            position: { x: 0, y: 0 },
            dimensions: { width: 210, height: 35 },
            style: { fillColor: '#2563eb' }
          },
          {
            id: 'summary_logo',
            type: 'image',
            content: 'logo',
            position: { x: 15, y: 5 },
            dimensions: { width: 25, height: 25 },
            style: {}
          },
          {
            id: 'summary_title',
            type: 'text',
            content: 'YÖNETİCİ ÖZETİ',
            position: { x: 45, y: 20 },
            style: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' }
          }
        ]
      },

      // Executive Summary Content
      {
        id: 'executive_summary',
        name: 'Executive Summary Content',
        type: 'content',
        position: { x: 15, y: 50 },
        dimensions: { width: 180, height: 150 },
        style: {},
        dataBinding: 'managementSummary',
        components: [
          {
            id: 'summary_section_title',
            type: 'rectangle',
            content: '',
            position: { x: 0, y: 0 },
            dimensions: { width: 180, height: 12 },
            style: { fillColor: '#2563eb' }
          },
          {
            id: 'summary_section_text',
            type: 'text',
            content: 'YÖNETİCİ ÖZETİ',
            position: { x: 5, y: 8 },
            style: { fontSize: 12, fontWeight: 'bold', color: '#ffffff' }
          },
          {
            id: 'summary_content_bg',
            type: 'rectangle',
            content: '',
            position: { x: 0, y: 20 },
            dimensions: { width: 180, height: 120 },
            style: { fillColor: '#f8fafc' }
          },
          {
            id: 'summary_content',
            type: 'text',
            content: '{{managementSummary}}',
            position: { x: 5, y: 30 },
            dimensions: { width: 170, height: 110 },
            dataBinding: 'managementSummary',
            style: { fontSize: 10, color: '#000000' }
          }
        ]
      },

      // Findings Section (Repeatable)
      {
        id: 'findings',
        name: 'Safety Findings',
        type: 'content',
        position: { x: 15, y: 50 },
        dimensions: { width: 180, height: 200 },
        style: {},
        dataBinding: 'findings',
        isRepeatable: true,
        components: [
          {
            id: 'finding_header_bg',
            type: 'rectangle',
            content: '',
            position: { x: 0, y: 0 },
            dimensions: { width: 180, height: 12 },
            style: { fillColor: '#f3f4f6' }
          },
          {
            id: 'finding_title',
            type: 'text',
            content: 'BULGU {{itemIndex}}: {{title}}',
            position: { x: 5, y: 8 },
            dataBinding: 'title',
            style: { fontSize: 12, fontWeight: 'bold', color: '#111827' }
          },
          {
            id: 'finding_location',
            type: 'text',
            content: 'Konum: {{location}}',
            position: { x: 5, y: 20 },
            dataBinding: 'location',
            style: { fontSize: 9, color: '#6b7280' }
          },
          {
            id: 'risk_badge',
            type: 'rectangle',
            content: '',
            position: { x: 140, y: 15 },
            dimensions: { width: 35, height: 8 },
            style: { fillColor: '{{dangerLevel === "high" ? "#dc2626" : dangerLevel === "medium" ? "#ea580c" : "#16a34a"}}' }
          },
          {
            id: 'risk_text',
            type: 'text',
            content: '{{dangerLevel === "high" ? "YÜKSEK RİSK" : dangerLevel === "medium" ? "ORTA RİSK" : "DÜŞÜK RİSK"}}',
            position: { x: 143, y: 20 },
            dataBinding: 'dangerLevel',
            style: { fontSize: 8, fontWeight: 'bold', color: '#ffffff' }
          },
          {
            id: 'current_situation_label',
            type: 'text',
            content: 'Mevcut Durum:',
            position: { x: 5, y: 35 },
            style: { fontSize: 10, fontWeight: 'bold', color: '#000000' }
          },
          {
            id: 'current_situation_text',
            type: 'text',
            content: '{{currentSituation}}',
            position: { x: 5, y: 45 },
            dimensions: { width: 170, height: 40 },
            dataBinding: 'currentSituation',
            style: { fontSize: 9, color: '#000000' }
          },
          {
            id: 'legal_basis_label',
            type: 'text',
            content: 'Hukuki Dayanak:',
            position: { x: 5, y: 90 },
            style: { fontSize: 10, fontWeight: 'bold', color: '#000000' },
            conditions: [{ field: 'legalBasis', operator: 'exists', value: null }]
          },
          {
            id: 'legal_basis_text',
            type: 'text',
            content: '{{legalBasis}}',
            position: { x: 5, y: 100 },
            dimensions: { width: 170, height: 30 },
            dataBinding: 'legalBasis',
            style: { fontSize: 9, color: '#000000' },
            conditions: [{ field: 'legalBasis', operator: 'exists', value: null }]
          },
          {
            id: 'recommendation_label',
            type: 'text',
            content: 'Öneri/Çözüm:',
            position: { x: 5, y: 135 },
            style: { fontSize: 10, fontWeight: 'bold', color: '#000000' },
            conditions: [{ field: 'recommendation', operator: 'exists', value: null }]
          },
          {
            id: 'recommendation_text',
            type: 'text',
            content: '{{recommendation}}',
            position: { x: 5, y: 145 },
            dimensions: { width: 170, height: 30 },
            dataBinding: 'recommendation',
            style: { fontSize: 9, color: '#000000' },
            conditions: [{ field: 'recommendation', operator: 'exists', value: null }]
          }
        ]
      },

      // General Evaluation
      {
        id: 'general_evaluation',
        name: 'General Evaluation',
        type: 'content',
        position: { x: 15, y: 50 },
        dimensions: { width: 180, height: 150 },
        style: {},
        dataBinding: 'generalEvaluation',
        components: [
          {
            id: 'eval_section_title',
            type: 'rectangle',
            content: '',
            position: { x: 0, y: 0 },
            dimensions: { width: 180, height: 12 },
            style: { fillColor: '#2563eb' }
          },
          {
            id: 'eval_section_text',
            type: 'text',
            content: 'GENEL DEĞERLENDİRME',
            position: { x: 5, y: 8 },
            style: { fontSize: 12, fontWeight: 'bold', color: '#ffffff' }
          },
          {
            id: 'eval_content_bg',
            type: 'rectangle',
            content: '',
            position: { x: 0, y: 20 },
            dimensions: { width: 180, height: 120 },
            style: { fillColor: '#f8fafc' }
          },
          {
            id: 'eval_content',
            type: 'text',
            content: '{{generalEvaluation}}',
            position: { x: 5, y: 30 },
            dimensions: { width: 170, height: 110 },
            dataBinding: 'generalEvaluation',
            style: { fontSize: 10, color: '#000000' }
          }
        ]
      }
    ];

    const templateData: InsertPdfTemplate = {
      name: 'isg_inspection_report',
      displayName: 'İSG İnceleme Raporu',
      description: 'Standart İş Sağlığı ve Güvenliği saha inceleme raporu şablonu',
      templateType: 'isg_report',
      version: '1.0.0',
      isActive: true,
      config,
      sections,
      styles
    };

    return await this.createTemplate(templateData);
  }

  // Create Technical Findings Template (örnek template)
  async createTechnicalFindingsTemplate(): Promise<PdfTemplate> {
    const config: TemplateConfig = {
      pageSize: 'A4' as const,
      orientation: 'portrait' as const,
      margins: { top: 40, right: 40, bottom: 40, left: 40 },
      fonts: {
        primary: 'helvetica',
        sizes: {
          title: 14,
          header: 12,
          body: 10,
          small: 9
        }
      },
      colors: {
        primary: '#8b0000',
        header: '#666666',
        text: '#000000',
        lightGray: '#f2f2f2'
      }
    };

    // Technical findings template sections would go here...
    const sections: TemplateSection[] = [
      // This would be similar to the attached example but structured as template sections
    ];

    const styles: TemplateStyles = {
      fonts: {
        title: { family: 'helvetica', size: 14, weight: 'bold' },
        header: { family: 'helvetica', size: 12, weight: 'bold' },
        body: { family: 'helvetica', size: 10, weight: 'normal' }
      },
      colors: {
        primary: '#8b0000',
        header: '#666666',
        text: '#000000',
        lightGray: '#f2f2f2'
      },
      spacing: { small: 5, medium: 10, large: 20 },
      borders: { thin: { width: 1, color: '#cccccc', style: 'solid' } }
    };

    const templateData: InsertPdfTemplate = {
      name: 'technical_findings_report',
      displayName: 'Teknik Bulgular Raporu',
      description: 'Teknik bulgular ve süreç takibi için detaylı rapor şablonu',
      templateType: 'technical_findings',
      version: '1.0.0',
      isActive: true,
      config,
      sections,
      styles
    };

    return await this.createTemplate(templateData);
  }
}