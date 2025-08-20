import { jsPDF } from 'jspdf';
import robotoFonts from 'roboto-base64';

// Add Roboto fonts to jsPDF
export function addCustomFonts() {
  const callAddFont = function() {
    // Add Roboto Regular (normal)
    this.addFileToVFS('Roboto-Regular.ttf', robotoFonts.normal);
    this.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    
    // Add Roboto Bold
    this.addFileToVFS('Roboto-Bold.ttf', robotoFonts.bold);
    this.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    
    // Add Roboto Italic
    this.addFileToVFS('Roboto-Italic.ttf', robotoFonts.italics);
    this.addFont('Roboto-Italic.ttf', 'Roboto', 'italic');
    
    // Add Roboto Bold Italic
    this.addFileToVFS('Roboto-BoldItalic.ttf', robotoFonts.bolditalics);
    this.addFont('Roboto-BoldItalic.ttf', 'Roboto', 'bolditalic');
  };
  
  // Register the font loader with jsPDF
  jsPDF.API.events.push(['addFonts', callAddFont]);
}