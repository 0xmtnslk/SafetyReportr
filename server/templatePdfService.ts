import { jsPDF } from 'jspdf';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { db } from './db';
import { pdfTemplates, pdfTemplateFields } from '@shared/schema';
import type { PdfTemplate, TemplateSection, TemplateComponent, TemplateConfig } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class TemplatePdfService {
  private logoBase64: string = '';
  private tahomaFont: string = '';
  private tahomaBoldFont: string = '';

  constructor() {
    this.loadLogo();
    this.loadFonts();
  }

  private loadLogo() {
    try {
      const logoPath = join(process.cwd(), 'client/src/assets/mlp-logo.png');
      if (existsSync(logoPath)) {
        const logoBuffer = readFileSync(logoPath);
        this.logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      }
    } catch (error) {
      console.warn('Could not load logo:', error);
    }
  }

  private loadFonts() {
    try {
      // Tahoma Regular font yükle
      const tahomaPath = join(process.cwd(), 'assets/fonts/Tahoma.ttf');
      if (existsSync(tahomaPath)) {
        const tahomaBuffer = readFileSync(tahomaPath);
        this.tahomaFont = tahomaBuffer.toString('base64');
      }
      
      // Tahoma Bold font yükle
      const tahomaBoldPath = join(process.cwd(), 'assets/fonts/TahomaBold.ttf');
      if (existsSync(tahomaBoldPath)) {
        const tahomaBoldBuffer = readFileSync(tahomaBoldPath);
        this.tahomaBoldFont = tahomaBoldBuffer.toString('base64');
      }
    } catch (error) {
      console.warn('Could not load Tahoma fonts:', error);
    }
  }

  // Ana template-based PDF oluşturma fonksiyonu
  async generatePdfFromTemplate(templateId: string, data: any): Promise<Uint8Array> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    console.log('Generating PDF from template:', template.name);

    const pdf = new jsPDF({
      orientation: template.config.orientation || 'portrait',
      unit: 'mm',
      format: template.config.pageSize || 'a4'
    });

    // PDF'i initialize et - font problemini önlemek için
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let pageNumber = 1;

    // Template sections'ı sıraya koy ve işle
    const sortedSections = template.sections.sort((a, b) => a.position.y - b.position.y);

    for (const section of sortedSections) {
      await this.renderSection(pdf, section, data, template.config, template.styles);
    }

    this.addPageFooter(pdf, pageNumber, template);

    return new Uint8Array(pdf.output('arraybuffer'));
  }

  // Template'i veritabanından al
  async getTemplate(templateId: string): Promise<PdfTemplate | null> {
    const [template] = await db
      .select()
      .from(pdfTemplates)
      .where(eq(pdfTemplates.id, templateId))
      .limit(1);

    return template || null;
  }

  // Template'i adına göre al
  async getTemplateByName(name: string): Promise<PdfTemplate | null> {
    const [template] = await db
      .select()
      .from(pdfTemplates)
      .where(eq(pdfTemplates.name, name))
      .limit(1);

    return template || null;
  }

  // Tüm aktif template'leri listele
  async getActiveTemplates(): Promise<PdfTemplate[]> {
    return await db
      .select()
      .from(pdfTemplates)
      .where(eq(pdfTemplates.isActive, true))
      .orderBy(pdfTemplates.templateType, pdfTemplates.name);
  }

  // Section rendering
  private async renderSection(pdf: jsPDF, section: TemplateSection, data: any, config: TemplateConfig, styles: any) {
    // Data binding - JSON path'den veriyi al
    const sectionData = this.getDataFromPath(data, section.dataBinding);

    // Conditional rendering check
    if (section.conditions && !this.checkConditions(section.conditions, data)) {
      return;
    }

    // Repeatable sections için (bulgular gibi)
    if (section.isRepeatable && Array.isArray(sectionData)) {
      let currentY = section.position.y;
      
      for (let i = 0; i < sectionData.length; i++) {
        const itemData = sectionData[i];
        const itemSection = { ...section, position: { ...section.position, y: currentY } };
        
        await this.renderSectionComponents(pdf, itemSection, itemData, config, styles, i);
        currentY += section.dimensions.height + 10; // Spacing between repeated items
        
        // Check if new page needed
        if (currentY > pdf.internal.pageSize.getHeight() - 30) {
          pdf.addPage();
          currentY = 30; // New page margin
        }
      }
    } else {
      await this.renderSectionComponents(pdf, section, sectionData || data, config, styles);
    }
  }

  // Section components rendering
  private async renderSectionComponents(pdf: jsPDF, section: TemplateSection, data: any, config: TemplateConfig, styles: any, itemIndex?: number) {
    for (const component of section.components) {
      await this.renderComponent(pdf, component, data, section, config, styles, itemIndex);
    }
  }

  // Component rendering
  private async renderComponent(pdf: jsPDF, component: TemplateComponent, data: any, section: TemplateSection, config: TemplateConfig, styles: any, itemIndex?: number) {
    const absoluteX = section.position.x + component.position.x;
    const absoluteY = section.position.y + component.position.y;

    switch (component.type) {
      case 'text':
        await this.renderTextComponent(pdf, component, data, absoluteX, absoluteY, styles, itemIndex);
        break;
      case 'image':
        await this.renderImageComponent(pdf, component, data, absoluteX, absoluteY);
        break;
      case 'table':
        await this.renderTableComponent(pdf, component, data, absoluteX, absoluteY, styles);
        break;
      case 'rectangle':
        this.renderRectangleComponent(pdf, component, absoluteX, absoluteY);
        break;
      case 'line':
        this.renderLineComponent(pdf, component, absoluteX, absoluteY);
        break;
    }
  }

  // Text component rendering
  private async renderTextComponent(pdf: jsPDF, component: TemplateComponent, data: any, x: number, y: number, styles: any, itemIndex?: number) {
    try {
      let text = component.content as string;
      
      // Data binding ile text'i değiştir
      if (component.dataBinding) {
        const boundData = this.getDataFromPath(data, component.dataBinding);
        text = boundData?.toString() || text;
      }

      // Template variables'ı değiştir ({{variable}} format)
      text = this.replaceTemplateVariables(text, data, itemIndex);

      // Boş text'i skip et
      if (!text || text.trim() === '') {
        return;
      }

      // Style uygula - Basitleştirilmiş
      const fontSize = component.style?.fontSize || 10;
      const fontWeight = component.style?.fontWeight === 'bold' ? 'bold' : 'normal';
      
      // Font ayarlarını dikkatli yapç
      try {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontWeight);
        if (component.style?.color) {
          pdf.setTextColor(component.style.color);
        }
      } catch (fontError) {
        // Font error durumunda default kullan
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor('#000000');
      }

      // Word wrap support with proper line height
      if (component.dimensions?.width && component.dimensions.width > 0) {
        try {
          const lines = pdf.splitTextToSize(text, component.dimensions.width);
          const lineHeight = fontSize * 0.35;
          
          lines.forEach((line: string, index: number) => {
            if (line && line.trim() !== '') {
              pdf.text(line, x, y + (index * lineHeight));
            }
          });
        } catch (splitError) {
          // Split error durumunda basit text render
          pdf.text(text, x, y);
        }
      } else {
        pdf.text(text, x, y);
      }
    } catch (error) {
      console.warn('Text component render error:', error);
      // Error durumunda placeholder
      try {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text('[TEXT ERROR]', x, y);
      } catch (fallbackError) {
        // Even fallback failed, skip
      }
    }
  }

  // Image component rendering
  private async renderImageComponent(pdf: jsPDF, component: TemplateComponent, data: any, x: number, y: number) {
    let imageUrl = component.content as string;
    
    // Data binding
    if (component.dataBinding) {
      const boundData = this.getDataFromPath(data, component.dataBinding);
      imageUrl = boundData || imageUrl;
    }

    try {
      let imageData = '';
      
      // Logo özel durumu
      if (imageUrl === 'logo' && this.logoBase64) {
        imageData = this.logoBase64;
      } else if (imageUrl.startsWith('http')) {
        // External URL
        imageData = await this.optimizeImage(imageUrl);
      } else if (imageUrl.startsWith('/images/') || imageUrl.startsWith('/uploads/')) {
        // Cloud storage or local images - process through optimizeImage
        imageData = await this.optimizeImage(imageUrl);
      } else {
        // Base64 data
        imageData = imageUrl;
      }

      if (imageData && component.dimensions) {
        pdf.addImage(
          imageData, 
          'JPEG', 
          x, 
          y, 
          component.dimensions.width, 
          component.dimensions.height
        );
      }
    } catch (error) {
      console.warn('Could not render image component:', error);
      // Placeholder rectangle
      pdf.setFillColor(240, 240, 240);
      pdf.rect(x, y, component.dimensions?.width || 50, component.dimensions?.height || 30, 'F');
      pdf.text('Görsel Yüklenemedi', x + 5, y + 15);
    }
  }

  // Rectangle component rendering
  private renderRectangleComponent(pdf: jsPDF, component: TemplateComponent, x: number, y: number) {
    const style = component.style;
    const dimensions = component.dimensions || { width: 50, height: 20 };

    if (style.fillColor) {
      const fillColor = this.hexToRgb(style.fillColor);
      pdf.setFillColor(fillColor.r, fillColor.g, fillColor.b);
    }

    if (style.borderColor && style.borderWidth) {
      const borderColor = this.hexToRgb(style.borderColor);
      pdf.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
      pdf.setLineWidth(style.borderWidth);
    }

    const fillStyle = style.fillColor ? (style.borderColor ? 'FD' : 'F') : (style.borderColor ? 'S' : '');
    if (fillStyle) {
      pdf.rect(x, y, dimensions.width, dimensions.height, fillStyle);
    }
  }

  // Line component rendering
  private renderLineComponent(pdf: jsPDF, component: TemplateComponent, x: number, y: number) {
    const style = component.style;
    const dimensions = component.dimensions || { width: 100, height: 0 };

    if (style.color) {
      const color = this.hexToRgb(style.color);
      pdf.setDrawColor(color.r, color.g, color.b);
    }

    pdf.setLineWidth(style.width || 1);
    pdf.line(x, y, x + dimensions.width, y + dimensions.height);
  }

  // Table component rendering
  private async renderTableComponent(pdf: jsPDF, component: TemplateComponent, data: any, x: number, y: number, styles: any) {
    try {
      const tableConfig = component.content as any;
      const tableData = this.getDataFromPath(data, component.dataBinding || '');

      if (!Array.isArray(tableData) || tableData.length === 0) return;
      if (!tableConfig.columns || tableConfig.columns.length === 0) return;

      const cellHeight = tableConfig.cellHeight || 20;
      const cellWidth = (component.dimensions?.width || 100) / tableConfig.columns.length;

      // Headers
      let currentY = y;
      
      try {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
      } catch (headerFontError) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
      }
      
      tableConfig.columns.forEach((column: any, colIndex: number) => {
        const cellX = x + (colIndex * cellWidth);
        
        try {
          pdf.setFillColor(200, 200, 200);
          pdf.rect(cellX, currentY, cellWidth, cellHeight, 'F');
          pdf.text(column.header || '', cellX + 2, currentY + 12);
        } catch (headerError) {
          console.warn('Table header render error:', headerError);
        }
      });

      currentY += cellHeight;

      // Data rows - sadece ilk 20 satırı render et
      const maxRows = Math.min(tableData.length, 20);
      
      try {
        pdf.setFont('helvetica', 'normal');
      } catch (bodyFontError) {
        // ignore
      }
      
      for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        const row = tableData[rowIndex];
        
        tableConfig.columns.forEach((column: any, colIndex: number) => {
          const cellX = x + (colIndex * cellWidth);
          
          try {
            const cellValue = this.getDataFromPath(row, column.field) || '';
            pdf.rect(cellX, currentY, cellWidth, cellHeight, 'S');
            pdf.text(cellValue.toString(), cellX + 2, currentY + 12);
          } catch (cellError) {
            console.warn('Table cell render error:', cellError);
          }
        });
        
        currentY += cellHeight;
        
        // Page break check
        if (currentY > pdf.internal.pageSize.getHeight() - 30) {
          break;
        }
      }
    } catch (error) {
      console.warn('Table component render error:', error);
    }
  }

  // Helper functions
  private getDataFromPath(data: any, path: string): any {
    if (!path) return data;
    
    const keys = path.split('.');
    let result = data;
    
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return undefined;
      }
    }
    
    return result;
  }

  private replaceTemplateVariables(text: string, data: any, itemIndex?: number): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      if (path === 'itemIndex' && itemIndex !== undefined) {
        return (itemIndex + 1).toString();
      }
      
      const value = this.getDataFromPath(data, path);
      return value?.toString() || '';
    });
  }

  private checkConditions(conditions: any[], data: any): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getDataFromPath(data, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'exists':
          return fieldValue !== undefined && fieldValue !== null;
        case 'not_exists':
          return fieldValue === undefined || fieldValue === null;
        case 'contains':
          return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
        default:
          return true;
      }
    });
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private async optimizeImage(imageUrl: string): Promise<string> {
    try {
      // Server-side için resim optimizasyonu atla, sadece URL'i döndür
      // Eğer base64 formatındaysa direkt döndür
      if (imageUrl.startsWith('data:')) {
        return imageUrl;
      }
      
      // Cloud storage images (new system)
      if (imageUrl.startsWith('/images/')) {
        console.log('📄 PDF: Processing cloud image:', imageUrl);
        try {
          const { ObjectStorageService } = await import("./objectStorage");
          const objectStorageService = new ObjectStorageService();
          const imageFile = await objectStorageService.getImageFile(imageUrl);
          
          if (imageFile) {
            console.log('📄 PDF: Image file found, downloading buffer...');
            // Download file buffer from cloud storage
            const buffer = await new Promise<Buffer>((resolve, reject) => {
              const chunks: Buffer[] = [];
              const stream = imageFile.createReadStream();
              
              stream.on('data', (chunk) => chunks.push(chunk));
              stream.on('end', () => {
                console.log('📄 PDF: Buffer download complete, size:', Buffer.concat(chunks).length);
                resolve(Buffer.concat(chunks));
              });
              stream.on('error', (err) => {
                console.error('📄 PDF: Stream error:', err);
                reject(err);
              });
            });
            
            // Get file metadata to determine format
            const [metadata] = await imageFile.getMetadata();
            let format = 'jpeg'; // default
            if (metadata.contentType) {
              if (metadata.contentType.includes('png')) format = 'png';
              else if (metadata.contentType.includes('webp')) format = 'jpeg'; // Convert WebP to JPEG for PDF
            }
            
            console.log('📄 PDF: Image processed successfully, format:', format);
            return `data:image/${format};base64,${buffer.toString('base64')}`;
          } else {
            console.warn('📄 PDF: Image file not found:', imageUrl);
          }
        } catch (cloudError) {
          console.error('📄 PDF: Cloud storage image fetch failed:', cloudError);
        }
      }
      
      // Legacy local dosya yolu için (backward compatibility)
      if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('./uploads/')) {
        const imagePath = join(process.cwd(), imageUrl);
        if (existsSync(imagePath)) {
          const imageBuffer = readFileSync(imagePath);
          const ext = imagePath.toLowerCase().includes('.png') ? 'png' : 'jpeg';
          return `data:image/${ext};base64,${imageBuffer.toString('base64')}`;
        }
      }
      
      // HTTP URL'ler için - şimdilik boş döndür
      return '';
    } catch (error) {
      console.warn('Image optimization failed:', error);
      return '';
    }
  }

  private addPageFooter(pdf: jsPDF, pageNumber: number, template: PdfTemplate) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setFontSize(9);
    // Footer için Helvetica kullan
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    // Footer line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
    
    // Template info
    pdf.text(template.displayName, 15, pageHeight - 10);
    pdf.text(`Sayfa ${pageNumber}`, pageWidth - 35, pageHeight - 10);
  }
}