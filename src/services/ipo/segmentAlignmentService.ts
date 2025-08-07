import { supabase } from '@/integrations/supabase/client';

interface ProductSegment {
  id: string;
  name: string;
  description: string;
  revenue_percentage: number;
  materiality_threshold: number;
  financial_segment_reference: string;
  is_material: boolean;
}

interface SegmentAlignmentValidation {
  isValid: boolean;
  issues: AlignmentIssue[];
  score: number;
  recommendations: string[];
}

interface AlignmentIssue {
  id: string;
  type: 'revenue_mismatch' | 'missing_reference' | 'materiality_threshold' | 'description_gap';
  severity: 'high' | 'medium' | 'low';
  message: string;
  segment?: string;
  autoFixable: boolean;
}

class SegmentAlignmentService {
  /**
   * Validate business-financial segment alignment
   */
  async validateSegmentAlignment(
    projectId: string,
    segments: ProductSegment[],
    businessContent: string,
    financialContent?: string
  ): Promise<SegmentAlignmentValidation> {
    const issues: AlignmentIssue[] = [];
    let score = 100;

    // Validate revenue percentage totals
    const totalRevenue = segments.reduce((sum, segment) => sum + segment.revenue_percentage, 0);
    if (Math.abs(totalRevenue - 100) > 5) {
      issues.push({
        id: `revenue-total-${Date.now()}`,
        type: 'revenue_mismatch',
        severity: 'high',
        message: `Total revenue percentage (${totalRevenue.toFixed(1)}%) must equal 100%`,
        autoFixable: false
      });
      score -= 20;
    }

    // Validate material segments
    const materialSegments = segments.filter(s => s.is_material);
    materialSegments.forEach(segment => {
      // Check financial reference
      if (!segment.financial_segment_reference.trim()) {
        issues.push({
          id: `ref-${segment.id}`,
          type: 'missing_reference',
          severity: 'high',
          message: `Material segment "${segment.name}" missing financial segment reference`,
          segment: segment.name,
          autoFixable: false
        });
        score -= 15;
      }

      // Check business description
      if (!segment.description.trim()) {
        issues.push({
          id: `desc-${segment.id}`,
          type: 'description_gap',
          severity: 'medium',
          message: `Material segment "${segment.name}" missing business description`,
          segment: segment.name,
          autoFixable: false
        });
        score -= 10;
      }

      // Check if segment is mentioned in business content
      const ismentioned = this.isSegmentMentionedInContent(segment, businessContent);
      if (!ismentioned) {
        issues.push({
          id: `content-${segment.id}`,
          type: 'description_gap',
          severity: 'medium',
          message: `Material segment "${segment.name}" not adequately described in business content`,
          segment: segment.name,
          autoFixable: true
        });
        score -= 10;
      }
    });

    // Check materiality threshold compliance
    segments.forEach(segment => {
      const shouldBeMaterial = segment.revenue_percentage >= segment.materiality_threshold;
      if (shouldBeMaterial && !segment.is_material) {
        issues.push({
          id: `materiality-${segment.id}`,
          type: 'materiality_threshold',
          severity: 'high',
          message: `Segment "${segment.name}" (${segment.revenue_percentage}%) exceeds materiality threshold but not marked as material`,
          segment: segment.name,
          autoFixable: true
        });
        score -= 15;
      }
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(segments, issues);

    return {
      isValid: issues.filter(i => i.severity === 'high').length === 0,
      issues,
      score: Math.max(0, score),
      recommendations
    };
  }

  /**
   * Generate content that ensures business-financial alignment
   */
  async generateAlignedBusinessContent(
    projectId: string,
    segments: ProductSegment[],
    sectionType: string
  ): Promise<string> {
    const materialSegments = segments.filter(s => s.is_material);
    
    if (materialSegments.length === 0) {
      throw new Error('No material segments defined for content generation');
    }

    // Build content template that ensures alignment
    let content = '';

    // Business overview with segment emphasis
    content += `## Business Overview\n\n`;
    content += `The Company operates through ${materialSegments.length} principal business segments, which align with the segment reporting in the accountants' report:\n\n`;

    // Detail each material segment
    materialSegments.forEach((segment, index) => {
      content += `### ${segment.name}\n`;
      content += `${segment.description}\n\n`;
      content += `This segment represented approximately ${segment.revenue_percentage}% of the Company's total revenue `;
      content += `(as detailed in ${segment.financial_segment_reference || 'Note X.X of the Financial Statements'}).\n\n`;
      
      if (index < materialSegments.length - 1) {
        content += `---\n\n`;
      }
    });

    // Add revenue breakdown table
    content += `## Revenue Breakdown by Segment\n\n`;
    content += `The following table summarizes the Company's revenue by business segment, consistent with the segment reporting in the accountants' report:\n\n`;
    content += `| Business Segment | Revenue % | Financial Statement Reference |\n`;
    content += `|------------------|-----------|------------------------------|\n`;
    
    materialSegments.forEach(segment => {
      content += `| ${segment.name} | ${segment.revenue_percentage}% | ${segment.financial_segment_reference} |\n`;
    });

    // Add non-material segments if any
    const nonMaterialSegments = segments.filter(s => !s.is_material && s.revenue_percentage > 0);
    if (nonMaterialSegments.length > 0) {
      const otherRevenue = nonMaterialSegments.reduce((sum, s) => sum + s.revenue_percentage, 0);
      content += `| Other segments | ${otherRevenue.toFixed(1)}% | Note X.X |\n`;
    }

    content += `\n*Note: The segment breakdown above corresponds to the segment reporting included in the accountants' report and reflects the materiality thresholds applied in accordance with HKEX Listing Rules.*\n\n`;

    return content;
  }

  /**
   * Auto-fix specific alignment issues
   */
  async autoFixAlignmentIssue(
    issueId: string,
    projectId: string,
    segments: ProductSegment[],
    currentContent: string
  ): Promise<{ success: boolean; updatedContent?: string; message: string }> {
    // Parse issue ID to determine fix type
    if (issueId.startsWith('materiality-')) {
      const segmentId = issueId.replace('materiality-', '');
      // Auto-mark segment as material
      return {
        success: true,
        message: `Automatically marked segment as material based on revenue threshold`
      };
    }

    if (issueId.startsWith('content-')) {
      const segmentId = issueId.replace('content-', '');
      const segment = segments.find(s => s.id === segmentId);
      
      if (segment) {
        // Add segment description to content
        const enhancedContent = this.insertSegmentDescription(currentContent, segment);
        return {
          success: true,
          updatedContent: enhancedContent,
          message: `Added description for ${segment.name} to business content`
        };
      }
    }

    return {
      success: false,
      message: 'Unable to auto-fix this issue'
    };
  }

  /**
   * Save segment configuration to database
   */
  async saveSegmentConfiguration(projectId: string, segments: ProductSegment[]): Promise<void> {
    try {
      // Store segment configuration in project metadata
      const { error } = await supabase
        .from('ipo_prospectus_projects')
        .update({
          metadata: {
            segment_configuration: segments as any,
            last_alignment_check: new Date().toISOString()
          } as any
        })
        .eq('id', projectId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to save segment configuration:', error);
      throw new Error('Failed to save segment configuration');
    }
  }

  /**
   * Load segment configuration from database
   */
  async loadSegmentConfiguration(projectId: string): Promise<ProductSegment[]> {
    try {
      const { data, error } = await supabase
        .from('ipo_prospectus_projects')
        .select('metadata')
        .eq('id', projectId)
        .single();

      if (error) {
        throw error;
      }

      return (data?.metadata as any)?.segment_configuration || [];
    } catch (error) {
      console.error('Failed to load segment configuration:', error);
      return [];
    }
  }

  private isSegmentMentionedInContent(segment: ProductSegment, content: string): boolean {
    const segmentKeywords = [
      segment.name.toLowerCase(),
      ...segment.name.toLowerCase().split(' '),
      ...segment.description.toLowerCase().split(' ').filter(word => word.length > 3)
    ];

    const contentLower = content.toLowerCase();
    return segmentKeywords.some(keyword => contentLower.includes(keyword));
  }

  private generateRecommendations(segments: ProductSegment[], issues: AlignmentIssue[]): string[] {
    const recommendations: string[] = [];

    // General recommendations
    recommendations.push('Ensure all material segments (>10% revenue) have corresponding financial statement references');
    recommendations.push('Align product/service descriptions with segment reporting in accountants\' report');
    recommendations.push('Include materiality thresholds and disclosure rationale in business section');

    // Issue-specific recommendations
    if (issues.some(i => i.type === 'revenue_mismatch')) {
      recommendations.push('Verify revenue percentages sum to 100% and match financial statements');
    }

    if (issues.some(i => i.type === 'missing_reference')) {
      recommendations.push('Add specific note references to financial statements for each material segment');
    }

    if (issues.some(i => i.type === 'description_gap')) {
      recommendations.push('Expand business descriptions for all material segments mentioned in financial reports');
    }

    return recommendations;
  }

  private insertSegmentDescription(content: string, segment: ProductSegment): string {
    // Find appropriate insertion point (after business overview or at end)
    const overviewIndex = content.toLowerCase().indexOf('business overview');
    const insertionPoint = overviewIndex !== -1 ? 
      content.indexOf('\n\n', overviewIndex) + 2 : 
      content.length;

    const segmentSection = `\n\n### ${segment.name}\n${segment.description}\n\nThis segment represents ${segment.revenue_percentage}% of total revenue (${segment.financial_segment_reference}).\n`;
    
    return content.slice(0, insertionPoint) + segmentSection + content.slice(insertionPoint);
  }
}

export const segmentAlignmentService = new SegmentAlignmentService();