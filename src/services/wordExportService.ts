/**
 * Service for exporting IPO prospectus content to Word format
 * and generating documents compatible with the Word Add-in
 */

import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } from 'docx';

export interface ExportSection {
  title: string;
  content: string;
  sectionType: string;
}

export class WordExportService {
  /**
   * Export content to a Word document (.docx)
   */
  static async exportToWord(
    sections: ExportSection[],
    companyName: string,
    projectName: string
  ): Promise<Blob> {
    const children: Paragraph[] = [];

    // Title
    children.push(
      new Paragraph({
        text: companyName,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    // Subtitle
    children.push(
      new Paragraph({
        text: 'IPO Prospectus',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Add each section
    for (const section of sections) {
      // Section heading
      children.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );

      // Section content - handle HTML content
      const plainText = this.htmlToPlainText(section.content);
      const paragraphs = plainText.split('\n\n').filter(p => p.trim());
      
      for (const para of paragraphs) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para.trim(),
                size: 24, // 12pt
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    return await Packer.toBlob(doc);
  }

  /**
   * Export single section content
   */
  static async exportSectionToWord(
    content: string,
    sectionTitle: string,
    companyName: string
  ): Promise<Blob> {
    const children: Paragraph[] = [];

    // Header with company name
    children.push(
      new Paragraph({
        text: companyName,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    // Section title
    children.push(
      new Paragraph({
        text: sectionTitle,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 300 },
      })
    );

    // Content
    const plainText = this.htmlToPlainText(content);
    const paragraphs = plainText.split('\n\n').filter(p => p.trim());
    
    for (const para of paragraphs) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: para.trim(),
              size: 24,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    return await Packer.toBlob(doc);
  }

  /**
   * Convert HTML content to plain text
   */
  private static htmlToPlainText(html: string): string {
    if (!html) return '';
    
    // Create a temporary element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Replace <br> and </p> with newlines
    temp.innerHTML = temp.innerHTML
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li>/gi, '• ');
    
    // Get text content
    return temp.textContent || temp.innerText || '';
  }

  /**
   * Download a blob as a file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate filename for export
   */
  static generateFilename(companyName: string, sectionType?: string): string {
    const sanitizedName = companyName.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_');
    const date = new Date().toISOString().split('T')[0];
    
    if (sectionType) {
      return `${sanitizedName}_${sectionType}_${date}.docx`;
    }
    return `${sanitizedName}_IPO_Prospectus_${date}.docx`;
  }
}
