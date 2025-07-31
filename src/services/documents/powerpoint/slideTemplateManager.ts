/**
 * Manager for roadshow-specific PowerPoint slide templates
 */

import { SummarizedSlide, VisualElement } from './contentSummarizer';
import { IPOSectionType } from './contentAnalyzer';

export interface SlideTemplate {
  type: IPOSectionType;
  layout: SlideLayout;
  styling: SlideStyle;
  maxBullets: number;
  includeVisuals: boolean;
}

export interface SlideLayout {
  titlePosition: 'top' | 'center';
  contentLayout: 'bullets' | 'split' | 'visual-heavy';
  visualPosition?: 'right' | 'bottom' | 'background';
}

export interface SlideStyle {
  backgroundColor: string;
  titleFont: string;
  titleSize: number;
  bulletFont: string;
  bulletSize: number;
  primaryColor: string;
  accentColor: string;
}

/**
 * Slide template manager for professional roadshow presentations
 */
export const slideTemplateManager = {
  /**
   * Get template configuration for a slide type
   */
  getTemplate(slideType: IPOSectionType): SlideTemplate {
    const templates: Record<IPOSectionType, SlideTemplate> = {
      executive_summary: {
        type: 'executive_summary',
        layout: {
          titlePosition: 'top',
          contentLayout: 'split',
          visualPosition: 'right'
        },
        styling: {
          backgroundColor: '1e293b', // slate-800
          titleFont: 'Arial',
          titleSize: 24,
          bulletFont: 'Arial',
          bulletSize: 16,
          primaryColor: '3b82f6', // blue-500
          accentColor: '10b981'    // green-500
        },
        maxBullets: 4,
        includeVisuals: true
      },
      
      financial_highlights: {
        type: 'financial_highlights',
        layout: {
          titlePosition: 'top',
          contentLayout: 'visual-heavy',
          visualPosition: 'right'
        },
        styling: {
          backgroundColor: '1e293b',
          titleFont: 'Arial',
          titleSize: 22,
          bulletFont: 'Arial',
          bulletSize: 14,
          primaryColor: '10b981', // green-500
          accentColor: '3b82f6'   // blue-500
        },
        maxBullets: 3,
        includeVisuals: true
      },
      
      business_overview: {
        type: 'business_overview',
        layout: {
          titlePosition: 'top',
          contentLayout: 'bullets'
        },
        styling: {
          backgroundColor: '1e293b',
          titleFont: 'Arial',
          titleSize: 22,
          bulletFont: 'Arial',
          bulletSize: 16,
          primaryColor: '3b82f6',
          accentColor: '8b5cf6'   // purple-500
        },
        maxBullets: 5,
        includeVisuals: false
      },
      
      market_opportunity: {
        type: 'market_opportunity',
        layout: {
          titlePosition: 'top',
          contentLayout: 'split',
          visualPosition: 'right'
        },
        styling: {
          backgroundColor: '1e293b',
          titleFont: 'Arial',
          titleSize: 22,
          bulletFont: 'Arial',
          bulletSize: 16,
          primaryColor: 'f59e0b', // amber-500
          accentColor: '3b82f6'
        },
        maxBullets: 4,
        includeVisuals: true
      },
      
      competitive_advantages: {
        type: 'competitive_advantages',
        layout: {
          titlePosition: 'top',
          contentLayout: 'bullets'
        },
        styling: {
          backgroundColor: '1e293b',
          titleFont: 'Arial',
          titleSize: 22,
          bulletFont: 'Arial',
          bulletSize: 16,
          primaryColor: '8b5cf6', // purple-500
          accentColor: '10b981'
        },
        maxBullets: 5,
        includeVisuals: false
      },
      
      use_of_proceeds: {
        type: 'use_of_proceeds',
        layout: {
          titlePosition: 'top',
          contentLayout: 'visual-heavy',
          visualPosition: 'bottom'
        },
        styling: {
          backgroundColor: '1e293b',
          titleFont: 'Arial',
          titleSize: 22,
          bulletFont: 'Arial',
          bulletSize: 16,
          primaryColor: '06b6d4', // cyan-500
          accentColor: '10b981'
        },
        maxBullets: 4,
        includeVisuals: true
      },
      
      risk_factors: {
        type: 'risk_factors',
        layout: {
          titlePosition: 'top',
          contentLayout: 'bullets'
        },
        styling: {
          backgroundColor: '1e293b',
          titleFont: 'Arial',
          titleSize: 22,
          bulletFont: 'Arial',
          bulletSize: 14,
          primaryColor: 'ef4444', // red-500
          accentColor: 'f59e0b'
        },
        maxBullets: 6,
        includeVisuals: false
      },
      
      management_team: {
        type: 'management_team',
        layout: {
          titlePosition: 'top',
          contentLayout: 'split',
          visualPosition: 'right'
        },
        styling: {
          backgroundColor: '1e293b',
          titleFont: 'Arial',
          titleSize: 22,
          bulletFont: 'Arial',
          bulletSize: 16,
          primaryColor: '6366f1', // indigo-500
          accentColor: '8b5cf6'
        },
        maxBullets: 4,
        includeVisuals: false
      },
      
      general: {
        type: 'general',
        layout: {
          titlePosition: 'top',
          contentLayout: 'bullets'
        },
        styling: {
          backgroundColor: '1e293b',
          titleFont: 'Arial',
          titleSize: 22,
          bulletFont: 'Arial',
          bulletSize: 16,
          primaryColor: '64748b', // slate-500
          accentColor: '94a3b8'
        },
        maxBullets: 5,
        includeVisuals: false
      }
    };
    
    return templates[slideType];
  },

  /**
   * Apply template to slide content
   */
  applyTemplate(slide: SummarizedSlide, template: SlideTemplate): any {
    const slideConfig = {
      backgroundColor: { color: template.styling.backgroundColor },
      title: slide.title,
      titleOptions: {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 1,
        fontSize: template.styling.titleSize,
        fontFace: template.styling.titleFont,
        color: 'FFFFFF',
        bold: true,
        align: 'left'
      },
      content: this.formatContent(slide, template)
    };
    
    return slideConfig;
  },

  /**
   * Format slide content based on template layout
   */
  formatContent(slide: SummarizedSlide, template: SlideTemplate): any[] {
    const content: any[] = [];
    
    // Add bullet points
    const bullets = slide.bulletPoints.slice(0, template.maxBullets);
    if (bullets.length > 0) {
      content.push({
        text: bullets.map(bullet => ({ text: bullet, options: { bullet: true } })),
        options: {
          x: template.layout.contentLayout === 'split' ? 0.5 : 0.5,
          y: 2,
          w: template.layout.contentLayout === 'split' ? 5 : 9,
          h: 5,
          fontSize: template.styling.bulletSize,
          fontFace: template.styling.bulletFont,
          color: 'FFFFFF',
          lineSpacing: 28
        }
      });
    }
    
    // Add visuals if template supports them
    if (template.includeVisuals && slide.visualData) {
      for (const visual of slide.visualData) {
        const visualContent = this.createVisualContent(visual, template);
        if (visualContent) {
          content.push(visualContent);
        }
      }
    }
    
    // Add key metrics as highlight box
    if (slide.keyMetrics && slide.keyMetrics.length > 0) {
      content.push(this.createMetricsHighlight(slide.keyMetrics, template));
    }
    
    return content;
  },

  /**
   * Create visual content element
   */
  createVisualContent(visual: VisualElement, template: SlideTemplate): any | null {
    if (visual.type === 'highlight' && Array.isArray(visual.data)) {
      return {
        text: visual.data.map(metric => ({ text: metric, options: { fontSize: 14, color: template.styling.accentColor } })),
        options: {
          x: template.layout.visualPosition === 'right' ? 6 : 0.5,
          y: template.layout.visualPosition === 'bottom' ? 6 : 3,
          w: 3.5,
          h: 2,
          fill: { color: '374151' }, // gray-700
          line: { color: template.styling.primaryColor, width: 2 },
          margin: 10
        }
      };
    }
    
    if (visual.type === 'chart' && visual.data) {
      // For now, represent charts as formatted text
      // In a full implementation, this would create actual charts
      const chartData = Array.isArray(visual.data) ? visual.data : [visual.data];
      const chartText = chartData.map(item => 
        typeof item === 'object' ? `${item.metric}: ${item.value}` : item.toString()
      );
      
      return {
        text: [
          { text: visual.title, options: { fontSize: 16, bold: true, color: 'FFFFFF' } },
          ...chartText.map(text => ({ text, options: { fontSize: 12, color: template.styling.accentColor } }))
        ],
        options: {
          x: template.layout.visualPosition === 'right' ? 6 : 0.5,
          y: template.layout.visualPosition === 'bottom' ? 5.5 : 2.5,
          w: 3.5,
          h: 3,
          fill: { color: '1f2937' }, // gray-800
          line: { color: template.styling.primaryColor, width: 1 },
          margin: 10
        }
      };
    }
    
    return null;
  },

  /**
   * Create metrics highlight box
   */
  createMetricsHighlight(metrics: string[], template: SlideTemplate): any {
    const topMetrics = metrics.slice(0, 3);
    
    return {
      text: [
        { text: 'Key Metrics', options: { fontSize: 14, bold: true, color: 'FFFFFF' } },
        ...topMetrics.map(metric => ({ 
          text: metric, 
          options: { fontSize: 12, color: template.styling.accentColor }
        }))
      ],
      options: {
        x: 7,
        y: 1.5,
        w: 2.5,
        h: 2,
        fill: { color: '374151' },
        line: { color: template.styling.primaryColor, width: 2 },
        margin: 8,
        align: 'center'
      }
    };
  },

  /**
   * Create title slide for roadshow presentation
   */
  createTitleSlide(companyName: string): any {
    return {
      backgroundColor: { color: '0f172a' }, // slate-900
      objects: [
        {
          text: [
            { text: companyName, options: { fontSize: 36, bold: true, color: 'FFFFFF' } },
            { text: 'Initial Public Offering', options: { fontSize: 24, color: '64748b' } },
            { text: 'Investor Presentation', options: { fontSize: 20, color: '94a3b8' } }
          ],
          options: {
            x: 0.5,
            y: 3,
            w: 9,
            h: 2,
            align: 'center'
          }
        }
      ]
    };
  },

  /**
   * Create agenda slide
   */
  createAgendaSlide(slideTypes: IPOSectionType[]): any {
    const agendaItems = slideTypes.map(type => {
      const displayNames: Record<IPOSectionType, string> = {
        executive_summary: 'Investment Highlights',
        financial_highlights: 'Financial Performance',
        business_overview: 'Business Overview',
        market_opportunity: 'Market Opportunity',
        competitive_advantages: 'Competitive Advantages',
        use_of_proceeds: 'Use of Proceeds',
        management_team: 'Management Team',
        risk_factors: 'Risk Factors',
        general: 'Additional Information'
      };
      return displayNames[type] || type.replace('_', ' ');
    });

    return {
      backgroundColor: { color: '1e293b' },
      title: 'Agenda',
      titleOptions: {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 1,
        fontSize: 28,
        fontFace: 'Arial',
        color: 'FFFFFF',
        bold: true,
        align: 'center'
      },
      content: [
        {
          text: agendaItems.map((item, index) => ({
            text: `${index + 1}. ${item}`,
            options: { fontSize: 18, color: 'FFFFFF', bullet: false }
          })),
          options: {
            x: 2,
            y: 2,
            w: 6,
            h: 5,
            lineSpacing: 36
          }
        }
      ]
    };
  }
};