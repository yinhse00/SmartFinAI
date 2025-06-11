
/**
 * Utility for parsing AI responses and extracting chart-worthy content
 */

import { Node, Edge } from '@xyflow/react';

export interface ChartData {
  type: 'timeline' | 'flowchart' | 'decision-tree' | 'none';
  data: any;
  title?: string;
}

// Timeline event pattern matching
const timelinePatterns = [
  /T[-+]\d+/g, // T-15, T+5 patterns
  /Day \d+/gi, // Day 1, Day 30
  /\d+\s+(days?|weeks?|months?)\s+(before|after|from)/gi,
  /(deadline|due date|submission|approval)/gi
];

// Process flow patterns
const flowPatterns = [
  /(step \d+|stage \d+|phase \d+)/gi,
  /(then|next|subsequently|following)/gi,
  /(approval|submission|review|notification)/gi,
  /(process|procedure|workflow)/gi
];

// Decision tree patterns
const decisionPatterns = [
  /(if|whether|depends on)/gi,
  /(yes|no|either|or)/gi,
  /(criteria|requirement|condition)/gi,
  /(exemption|exception|waiver)/gi
];

/**
 * Analyze response content to determine chart type
 */
export const analyzeContentForCharts = (content: string): ChartData => {
  const lowerContent = content.toLowerCase();
  
  // Check for timeline content
  const timelineScore = timelinePatterns.reduce((score, pattern) => {
    const matches = content.match(pattern);
    return score + (matches ? matches.length : 0);
  }, 0);
  
  // Check for flow chart content
  const flowScore = flowPatterns.reduce((score, pattern) => {
    const matches = content.match(pattern);
    return score + (matches ? matches.length : 0);
  }, 0);
  
  // Check for decision tree content
  const decisionScore = decisionPatterns.reduce((score, pattern) => {
    const matches = content.match(pattern);
    return score + (matches ? matches.length : 0);
  }, 0);
  
  // Determine chart type based on highest score
  const maxScore = Math.max(timelineScore, flowScore, decisionScore);
  
  if (maxScore < 2) {
    return { type: 'none', data: null };
  }
  
  if (timelineScore === maxScore && timelineScore >= 2) {
    return {
      type: 'timeline',
      data: extractTimelineData(content),
      title: extractTitle(content, 'timeline')
    };
  }
  
  if (flowScore === maxScore && flowScore >= 2) {
    return {
      type: 'flowchart',
      data: extractFlowChartData(content),
      title: extractTitle(content, 'process')
    };
  }
  
  if (decisionScore === maxScore && decisionScore >= 2) {
    return {
      type: 'decision-tree',
      data: extractDecisionTreeData(content),
      title: extractTitle(content, 'decision')
    };
  }
  
  return { type: 'none', data: null };
};

/**
 * Extract timeline events from content
 */
const extractTimelineData = (content: string) => {
  const events: any[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Look for T-X or T+X patterns
    const tPatternMatch = line.match(/T([-+]\d+)/);
    // Look for "Day X" patterns
    const dayPatternMatch = line.match(/Day (\d+)/i);
    // Look for deadline keywords
    const deadlineMatch = line.match(/(deadline|due|submission|approval)/i);
    
    if (tPatternMatch || dayPatternMatch || deadlineMatch) {
      const dateStr = tPatternMatch ? `T${tPatternMatch[1]}` : 
                     dayPatternMatch ? `Day ${dayPatternMatch[1]}` : 
                     'TBD';
      
      // Extract the meaningful part of the line
      const description = line.replace(/^[•\-\*]\s*/, '').trim();
      
      if (description.length > 10) {
        events.push({
          date: dateStr,
          title: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
          description: description,
          type: deadlineMatch ? 'deadline' : 'milestone',
          status: 'upcoming'
        });
      }
    }
  });
  
  return events.length > 0 ? events : [
    {
      date: 'T-15',
      title: 'Application Submission',
      description: 'Submit complete application package',
      type: 'submission',
      status: 'upcoming'
    }
  ];
};

/**
 * Extract flow chart data from content
 */
const extractFlowChartData = (content: string) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Look for numbered steps or stages
  const stepMatches = content.match(/(step|stage|phase)\s+\d+[:\.]?\s*([^\n]+)/gi);
  
  if (stepMatches && stepMatches.length > 1) {
    stepMatches.forEach((match, index) => {
      const stepText = match.replace(/(step|stage|phase)\s+\d+[:\.]?\s*/i, '').trim();
      
      nodes.push({
        id: `step-${index}`,
        type: 'default',
        position: { x: 100, y: index * 120 },
        data: { 
          label: `Step ${index + 1}: ${stepText.substring(0, 40)}${stepText.length > 40 ? '...' : ''}` 
        }
      });
      
      if (index > 0) {
        edges.push({
          id: `edge-${index}`,
          source: `step-${index - 1}`,
          target: `step-${index}`,
          type: 'smoothstep'
        });
      }
    });
  } else {
    // Fallback default flow
    nodes.push(
      {
        id: 'start',
        type: 'input',
        position: { x: 100, y: 0 },
        data: { label: 'Start Process' }
      },
      {
        id: 'review',
        type: 'default',
        position: { x: 100, y: 120 },
        data: { label: 'Review Application' }
      },
      {
        id: 'approval',
        type: 'output',
        position: { x: 100, y: 240 },
        data: { label: 'Final Approval' }
      }
    );
    
    edges.push(
      { id: 'e1', source: 'start', target: 'review' },
      { id: 'e2', source: 'review', target: 'approval' }
    );
  }
  
  return { nodes, edges };
};

/**
 * Extract decision tree data from content
 */
const extractDecisionTreeData = (content: string) => {
  // Simple decision tree structure based on content
  return {
    id: 'root',
    question: 'Does the transaction meet the criteria?',
    type: 'decision' as const,
    children: {
      yes: {
        id: 'compliant',
        question: '',
        type: 'outcome' as const,
        outcome: {
          result: 'Compliant',
          description: 'Transaction can proceed under normal process',
          severity: 'low' as const
        }
      },
      no: {
        id: 'review',
        question: 'Is there an applicable exemption?',
        type: 'decision' as const,
        children: {
          yes: {
            id: 'exempt',
            question: '',
            type: 'outcome' as const,
            outcome: {
              result: 'Exempt',
              description: 'Transaction may proceed with exemption',
              severity: 'medium' as const
            }
          },
          no: {
            id: 'requires-approval',
            question: '',
            type: 'outcome' as const,
            outcome: {
              result: 'Requires Approval',
              description: 'Independent shareholders approval required',
              severity: 'high' as const
            }
          }
        }
      }
    }
  };
};

/**
 * Extract title from content based on chart type
 */
const extractTitle = (content: string, chartType: string): string => {
  const lines = content.split('\n');
  
  // Look for headings that might be relevant
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed.startsWith('**')) {
      const title = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      if (title.toLowerCase().includes(chartType) || 
          title.toLowerCase().includes('process') || 
          title.toLowerCase().includes('timeline') ||
          title.toLowerCase().includes('procedure')) {
        return title;
      }
    }
  }
  
  // Fallback titles
  switch (chartType) {
    case 'timeline': return 'Regulatory Timeline';
    case 'process': return 'Process Flow';
    case 'decision': return 'Decision Tree';
    default: return 'Regulatory Process';
  }
};
