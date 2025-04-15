
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
      
      // Create a simple Word XML document with the content
      const wordXml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head>
          <meta charset="utf-8">
          <title>Generated Document</title>
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            ${content.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
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
      
      // Create a PDF-like HTML document that will render well when downloaded
      const pdfHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Generated Document</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.5;
              margin: 40px;
            }
            .content {
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              text-align: center;
              color: #2c5282;
            }
          </style>
        </head>
        <body>
          <div class="content">
            <h1>Generated Document</h1>
            ${content.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
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
