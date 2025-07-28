
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
  }
};
