
/**
 * Service for generating different document formats
 */

export const documentGenerationService = {
  /**
   * Generate a Word document from text
   */
  generateWordDocument: async (content: string): Promise<Blob> => {
    try {
      console.log("Generating Word document with content:", content);
      
      // Create a Word XML document that preserves rich formatting
      const wordXml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head>
          <meta charset="utf-8">
          <title>Generated Document</title>
          <style>
            @page { 
              margin: 1in; 
              size: 8.5in 11in; 
            }
            body { 
              font-family: 'Times New Roman', serif; 
              font-size: 12pt; 
              line-height: 1.6; 
              margin: 0;
              color: #000;
            }
            h1 { 
              font-size: 18pt; 
              font-weight: bold; 
              margin: 24pt 0 12pt 0;
              page-break-after: avoid;
            }
            h2 { 
              font-size: 16pt; 
              font-weight: bold; 
              margin: 18pt 0 6pt 0;
              page-break-after: avoid;
            }
            h3 { 
              font-size: 14pt; 
              font-weight: bold; 
              margin: 12pt 0 6pt 0;
              page-break-after: avoid;
            }
            p { 
              margin: 6pt 0; 
              text-align: justify;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin: 12pt 0;
            }
            table, th, td { 
              border: 1px solid #000; 
            }
            th, td { 
              padding: 6pt; 
              text-align: left;
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold;
            }
            ul, ol { 
              margin: 6pt 0; 
              padding-left: 24pt;
            }
            li { 
              margin: 3pt 0;
            }
          </style>
        </head>
        <body>
          <div>
            ${content}
          </div>
        </body>
        </html>
      `;
      
      // Return as a proper Word document
      return new Blob([wordXml], {type: 'application/vnd.ms-word'});
    } catch (error) {
      console.error("Error generating Word document:", error);
      throw new Error("Failed to generate Word document.");
    }
  },

  /**
   * Generate a PDF document from text
   */
  generatePdfDocument: async (content: string): Promise<Blob> => {
    try {
      console.log("Generating PDF document with content:", content);
      
      // Create a PDF-like HTML document that preserves rich formatting
      const pdfHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Generated Document</title>
          <style>
            @page { 
              margin: 1in; 
              size: 8.5in 11in; 
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6;
              margin: 40px;
              color: #000;
            }
            .content {
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { 
              font-size: 18pt; 
              font-weight: bold; 
              margin: 24pt 0 12pt 0;
              text-align: center;
              color: #2c5282;
            }
            h2 { 
              font-size: 16pt; 
              font-weight: bold; 
              margin: 18pt 0 6pt 0;
            }
            h3 { 
              font-size: 14pt; 
              font-weight: bold; 
              margin: 12pt 0 6pt 0;
            }
            p { 
              margin: 6pt 0; 
              text-align: justify;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin: 12pt 0;
            }
            table, th, td { 
              border: 1px solid #000; 
            }
            th, td { 
              padding: 6pt; 
              text-align: left;
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold;
            }
            ul, ol { 
              margin: 6pt 0; 
              padding-left: 24pt;
            }
            li { 
              margin: 3pt 0;
            }
          </style>
        </head>
        <body>
          <div class="content">
            <h1>Generated Document</h1>
            ${content}
          </div>
        </body>
        </html>
      `;
      
      // Return as HTML that will be displayed properly when downloaded
      return new Blob([pdfHtml], {type: 'text/html'});
    } catch (error) {
      console.error("Error generating PDF document:", error);
      throw new Error("Failed to generate PDF document.");
    }
  },
  
  /**
   * Generate an Excel document from text
   */
  generateExcelDocument: async (content: string): Promise<Blob> => {
    try {
      console.log("Generating Excel document with content:", content);
      
      // Create a basic CSV format from the content
      let csvContent = "Content\n";
      
      // Add each line as a separate row
      content.split('\n').forEach(line => {
        // Escape any commas in the content
        csvContent += `"${line.replace(/"/g, '""')}"\n`;
      });
      
      // Return as a CSV document that Excel can open
      return new Blob([csvContent], {type: 'text/csv'});
    } catch (error) {
      console.error("Error generating Excel document:", error);
      throw new Error("Failed to generate Excel document.");
    }
  },

  /**
   * Generate a PowerPoint document from text for roadshow presentations
   */
  generatePowerPointDocument: async (content: string, sectionTitle?: string): Promise<Blob> => {
    try {
      console.log("Generating PowerPoint document with content:", content);
      
      // Dynamically import pptxgenjs to reduce bundle size
      const pptxgen = (await import('pptxgenjs')).default;
      
      // Create new presentation
      const pres = new pptxgen();
      
      // Set presentation properties
      pres.author = "IPO Prospectus System";
      pres.company = "Roadshow Materials";
      pres.title = sectionTitle || "IPO Roadshow Presentation";
      
      // Define slide layout
      pres.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
      pres.layout = 'LAYOUT_16x9';
      
      // Create title slide
      const titleSlide = pres.addSlide();
      titleSlide.addText(sectionTitle || "IPO Roadshow Presentation", {
        x: 1,
        y: 1.5,
        w: 8,
        h: 1.5,
        fontSize: 44,
        bold: true,
        color: '2c5282',
        align: 'center'
      });
      
      titleSlide.addText("Generated from IPO Prospectus", {
        x: 1,
        y: 3,
        w: 8,
        h: 0.5,
        fontSize: 18,
        color: '666666',
        align: 'center'
      });
      
      // Parse HTML content and create slides
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // Extract headings and content
      const elements = Array.from(tempDiv.children);
      let currentSlide: any = null;
      let slideContent: string[] = [];
      
      const addContentToSlide = (slide: any, content: string[]) => {
        if (content.length > 0) {
          const bulletPoints = content.map(text => ({ text, options: { bullet: true } }));
          slide.addText(bulletPoints, {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 3.5,
            fontSize: 16
          });
        }
      };

      const addTableToSlide = (slide: any, table: HTMLTableElement) => {
        const rows: string[][] = [];
        const tableRows = table.querySelectorAll('tr');
        
        tableRows.forEach(row => {
          const cells: string[] = [];
          row.querySelectorAll('td, th').forEach(cell => {
            cells.push(cell.textContent?.trim() || '');
          });
          if (cells.length > 0) {
            rows.push(cells);
          }
        });
        
        if (rows.length > 0) {
          slide.addTable(rows, {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 3,
            fontSize: 12,
            border: { pt: 1, color: 'CFCFCF' }
          });
        }
      };
      
      elements.forEach((element) => {
        const tagName = element.tagName?.toLowerCase();
        const textContent = element.textContent?.trim() || '';
        
        if (!textContent) return;
        
        // Create new slide for headings
        if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
          // Save previous slide content
          if (currentSlide && slideContent.length > 0) {
            addContentToSlide(currentSlide, slideContent);
            slideContent = [];
          }
          
          // Create new slide
          currentSlide = pres.addSlide();
          currentSlide.addText(textContent, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 1,
            fontSize: tagName === 'h1' ? 36 : tagName === 'h2' ? 28 : 24,
            bold: true,
            color: '2c5282'
          });
        } else if (tagName === 'p' || tagName === 'li') {
          slideContent.push(textContent);
        } else if (tagName === 'table') {
          // Handle tables
          if (currentSlide) {
            addTableToSlide(currentSlide, element as HTMLTableElement);
          }
        }
        
        // If slide gets too full, create new slide
        if (slideContent.length >= 5) {
          if (currentSlide) {
            addContentToSlide(currentSlide, slideContent);
            slideContent = [];
            currentSlide = pres.addSlide();
            currentSlide.addText("Continued...", {
              x: 0.5,
              y: 0.5,
              w: 9,
              h: 0.8,
              fontSize: 24,
              bold: true,
              color: '2c5282'
            });
          }
        }
      });
      
      // Add remaining content to last slide
      if (currentSlide && slideContent.length > 0) {
        addContentToSlide(currentSlide, slideContent);
      }
      
      // If no content slides were created, create a basic content slide
      if (!currentSlide) {
        const contentSlide = pres.addSlide();
        contentSlide.addText("Content", {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 0.8,
          fontSize: 28,
          bold: true,
          color: '2c5282'
        });
        
        // Split content into bullet points
        const lines = content.replace(/<[^>]*>/g, '').split('\n').filter(line => line.trim());
        const bulletPoints = lines.slice(0, 8).map(line => line.trim());
        
        if (bulletPoints.length > 0) {
          const bulletText = bulletPoints.map(text => ({ text, options: { bullet: true } }));
          contentSlide.addText(bulletText, {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 3.5,
            fontSize: 16
          });
        }
      }
      
      // Generate and return blob
      const pptxData = await pres.writeFile();
      return new Blob([pptxData], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    } catch (error) {
      console.error("Error generating PowerPoint document:", error);
      throw new Error("Failed to generate PowerPoint document.");
    }
  }
};
