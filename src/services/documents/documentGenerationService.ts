
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

      // Use jsPDF to create a true PDF file
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 56; // ~0.78in
      const maxWidth = pageWidth - margin * 2;
      const lineHeight = 18;

      // Convert basic HTML to plain text while preserving structure
      const plain = content
        .replace(/<br\s*\/?>(?=\n)?/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<li[^>]*>/gi, '\u2022 ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/gi, '')
        .replace(/<h1[^>]*>(.*?)<\/h1>/gis, (_m, t) => `\n\n${String(t).toUpperCase()}\n`)
        .replace(/<h2[^>]*>(.*?)<\/h2>/gis, (_m, t) => `\n\n${String(t)}\n`)
        .replace(/<h3[^>]*>(.*?)<\/h3>/gis, (_m, t) => `\n${String(t)}\n`)
        .replace(/<table[\s\S]*?<\/table>/gi, '\n[Table omitted]\n') // Tables are noted but not rendered
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();

      const paragraphs = plain.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

      let y = margin;
      const addPageIfNeeded = (needed: number) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Title
      doc.setFont('Times', 'bold');
      doc.setFontSize(16);
      const title = 'Generated Document';
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, y);
      y += lineHeight * 1.5;

      // Body
      doc.setFont('Times', 'normal');
      doc.setFontSize(12);

      for (const para of paragraphs) {
        const lines = doc.splitTextToSize(para, maxWidth);
        addPageIfNeeded(lines.length * lineHeight);
        doc.text(lines, margin, y, { baseline: 'top' });
        y += lines.length * lineHeight + lineHeight * 0.6;
      }

      return doc.output('blob');
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
   * Generate a PowerPoint document with intelligent content analysis for roadshow presentations
   */
  generatePowerPointDocument: async (content: string, sectionTitle?: string): Promise<Blob> => {
    try {
      console.log("Generating intelligent PowerPoint document with content analysis");
      
      // Dynamically import required services
      const [
        pptxgen,
        { contentAnalyzer },
        { contentSummarizer },
        { slideTemplateManager }
      ] = await Promise.all([
        import('pptxgenjs').then(mod => mod.default),
        import('./powerpoint/contentAnalyzer'),
        import('./powerpoint/contentSummarizer'),
        import('./powerpoint/slideTemplateManager')
      ]);
      
      const pres = new pptxgen();
      
      // Set presentation properties
      pres.author = 'IPO Document Generator';
      pres.company = 'IPO Platform';
      pres.subject = sectionTitle || 'IPO Document';
      pres.title = sectionTitle || 'IPO Presentation';
      
      // Define professional slide layout
      pres.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
      pres.layout = 'LAYOUT_16x9';
      
      // Clean the content
      let processedContent = content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/&amp;/g, '&') // Replace HTML entities
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Analyze content and extract structured sections
      const contentSections = contentAnalyzer.analyzeContent(processedContent);
      console.log('Analyzed content sections:', contentSections.map(s => s.type));
      
      // Create summarized slides from sections
      const summarizedSlides = contentSummarizer.summarizeForPresentation(contentSections);
      console.log('Created summarized slides:', summarizedSlides.length);
      
      // Extract company name for title slide
      const companyName = sectionTitle || 'Company Name';
      
      // Add title slide
      const titleSlide = pres.addSlide();
      const titleConfig = slideTemplateManager.createTitleSlide(companyName);
      titleSlide.background = titleConfig.backgroundColor;
      
      titleSlide.addText(titleConfig.objects[0].text, titleConfig.objects[0].options);
      
      // Add agenda slide if multiple sections
      if (summarizedSlides.length > 1) {
        const agendaSlide = pres.addSlide();
        const agendaConfig = slideTemplateManager.createAgendaSlide(
          summarizedSlides.map(s => s.slideType)
        );
        agendaSlide.background = agendaConfig.backgroundColor;
        agendaSlide.addText(agendaConfig.title, agendaConfig.titleOptions);
        agendaSlide.addText(agendaConfig.content[0].text, agendaConfig.content[0].options);
      }
      
      // Create executive summary slide first if we have multiple sections
      if (summarizedSlides.length > 1) {
        const executiveSummary = contentSummarizer.createExecutiveSummary(contentSections);
        const execSlide = pres.addSlide();
        const execTemplate = slideTemplateManager.getTemplate('executive_summary');
        const execConfig = slideTemplateManager.applyTemplate(executiveSummary, execTemplate);
        
        execSlide.background = execConfig.backgroundColor;
        execSlide.addText(execConfig.title, execConfig.titleOptions);
        
        // Add content elements
        for (const contentElement of execConfig.content) {
          execSlide.addText(contentElement.text, contentElement.options);
        }
      }
      
      // Add content slides
      for (const slide of summarizedSlides) {
        const newSlide = pres.addSlide();
        const template = slideTemplateManager.getTemplate(slide.slideType);
        const slideConfig = slideTemplateManager.applyTemplate(slide, template);
        
        // Apply slide background
        newSlide.background = slideConfig.backgroundColor;
        
        // Add title
        newSlide.addText(slideConfig.title, slideConfig.titleOptions);
        
        // Add content elements
        for (const contentElement of slideConfig.content) {
          newSlide.addText(contentElement.text, contentElement.options);
        }
      }
      
      // If no structured content found, create a simple slide
      if (summarizedSlides.length === 0) {
        const slide = pres.addSlide();
        slide.background = { color: '1e293b' };
        
        slide.addText(sectionTitle || 'IPO Document', {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 1,
          fontSize: 24,
          fontFace: 'Arial',
          color: 'FFFFFF',
          bold: true,
          align: 'center'
        });
        
        // Create basic bullet points from content
        const paragraphs = processedContent
          .split(/\n\s*\n/)
          .filter(p => p.trim().length > 20)
          .slice(0, 6);
        
        if (paragraphs.length > 0) {
          const bulletPoints = paragraphs.map(para => {
            let cleaned = para.replace(/\s+/g, ' ').trim();
            if (cleaned.length > 120) {
              cleaned = cleaned.substring(0, 120) + '...';
            }
            return {
              text: cleaned,
              options: { bullet: true, fontSize: 16, color: 'FFFFFF' }
            };
          });
          
          slide.addText(bulletPoints, {
            x: 0.5,
            y: 2,
            w: 9,
            h: 5,
            fontSize: 16,
            fontFace: 'Arial',
            color: 'FFFFFF',
            lineSpacing: 28
          });
        }
      }
      
      // Generate and return blob
      const pptxBuffer = await pres.write({ outputType: 'arraybuffer' });
      return new Blob([pptxBuffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    } catch (error) {
      console.error("Error generating PowerPoint document:", error);
      throw new Error("Failed to generate PowerPoint document.");
    }
  }
};
