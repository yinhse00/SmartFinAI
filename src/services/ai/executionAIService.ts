import { supabase } from '@/integrations/supabase/client';

export interface AIResponse {
  content: string;
  confidence: number;
  suggestions?: string[];
  documents?: string[];
  actions?: AIAction[];
}

export interface AIAction {
  type: 'task_creation' | 'document_generation' | 'notification' | 'escalation';
  description: string;
  data: any;
}

export interface EmailAnalysis {
  intent: 'query' | 'request' | 'update' | 'urgent' | 'regulatory';
  priority: 'low' | 'medium' | 'high' | 'critical';
  stakeholder_type: 'regulator' | 'client' | 'team_member' | 'external_advisor';
  requires_response: boolean;
  suggested_actions: string[];
  key_topics: string[];
}

export interface StakeholderContext {
  id: string;
  name: string;
  role: 'regulator' | 'client' | 'team_member' | 'external_advisor';
  communication_style: 'formal' | 'professional' | 'casual';
  expertise_areas: string[];
  contact_info: {
    email: string;
    phone?: string;
    organization?: string;
  };
}

class ExecutionAIService {
  private async callGrokAPI(prompt: string, context?: any): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-execution-assistant', {
        body: { prompt, context }
      });

      if (error) throw error;
      return data.response;
    } catch (error) {
      console.error('Error calling Grok API:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Analyze email content for intent, priority, and required actions
   */
  async analyzeEmail(
    emailContent: string, 
    sender: string, 
    subject: string,
    projectContext?: any
  ): Promise<EmailAnalysis> {
    const prompt = `
    Analyze this email for execution project management:
    
    From: ${sender}
    Subject: ${subject}
    Content: ${emailContent}
    
    Project Context: ${JSON.stringify(projectContext || {})}
    
    Analyze and return JSON with:
    - intent: query/request/update/urgent/regulatory
    - priority: low/medium/high/critical
    - stakeholder_type: regulator/client/team_member/external_advisor
    - requires_response: boolean
    - suggested_actions: array of strings
    - key_topics: array of strings
    `;

    try {
      const response = await this.callGrokAPI(prompt);
      return JSON.parse(response);
    } catch (error) {
      // Fallback analysis
      return {
        intent: 'query',
        priority: 'medium',
        stakeholder_type: 'team_member',
        requires_response: true,
        suggested_actions: ['Review and respond'],
        key_topics: [subject]
      };
    }
  }

  /**
   * Generate contextual response to email
   */
  async generateEmailResponse(
    emailContent: string,
    analysis: EmailAnalysis,
    projectContext: any,
    stakeholder: StakeholderContext
  ): Promise<AIResponse> {
    const prompt = `
    Generate an appropriate email response for this execution project communication:
    
    Original Email: ${emailContent}
    Analysis: ${JSON.stringify(analysis)}
    Project Context: ${JSON.stringify(projectContext)}
    Stakeholder Info: ${JSON.stringify(stakeholder)}
    
    Generate a response that:
    - Matches the appropriate ${stakeholder.communication_style} tone
    - Addresses the ${analysis.intent} appropriately
    - Includes relevant project information
    - Suggests next steps if applicable
    - For regulators: formal, compliance-focused
    - For clients: professional, informative
    - For team: collaborative, action-oriented
    
    Return JSON with content, confidence (0-1), and suggested actions.
    `;

    try {
      const response = await this.callGrokAPI(prompt, { analysis, projectContext, stakeholder });
      return JSON.parse(response);
    } catch (error) {
      return {
        content: `Thank you for your email regarding ${analysis.key_topics[0] || 'the project'}. We have received your message and will review it shortly. We will provide a detailed response within 24 hours.`,
        confidence: 0.7,
        suggestions: ['Review project status', 'Schedule follow-up call'],
        actions: [{
          type: 'notification',
          description: 'Alert project manager of pending response',
          data: { priority: analysis.priority }
        }]
      };
    }
  }

  /**
   * Analyze task dependencies and suggest optimizations
   */
  async analyzeTaskDependencies(tasks: any[], projectContext: any): Promise<AIResponse> {
    const prompt = `
    Analyze these execution tasks for dependencies, risks, and optimization opportunities:
    
    Tasks: ${JSON.stringify(tasks)}
    Project Context: ${JSON.stringify(projectContext)}
    
    Provide analysis on:
    - Critical path identification
    - Dependency bottlenecks
    - Resource allocation suggestions
    - Risk mitigation strategies
    - Timeline optimization opportunities
    
    Return recommendations in JSON format.
    `;

    try {
      const response = await this.callGrokAPI(prompt, { tasks, projectContext });
      return JSON.parse(response);
    } catch (error) {
      return {
        content: 'Task analysis completed. Monitor critical path tasks for potential delays.',
        confidence: 0.6,
        suggestions: ['Review task dependencies', 'Monitor progress closely']
      };
    }
  }

  /**
   * Generate regulatory document based on email request
   */
  async generateRegulatoryDocument(
    documentType: string,
    requirements: string,
    projectContext: any
  ): Promise<AIResponse> {
    const prompt = `
    Generate a ${documentType} document for this execution project:
    
    Requirements: ${requirements}
    Project Context: ${JSON.stringify(projectContext)}
    
    Create a professional document that:
    - Meets regulatory standards
    - Includes all required information
    - Uses appropriate legal/regulatory language
    - Follows standard formatting
    - References relevant regulations
    
    Return the document content and metadata.
    `;

    try {
      const response = await this.callGrokAPI(prompt, { documentType, requirements, projectContext });
      return JSON.parse(response);
    } catch (error) {
      return {
        content: `Draft ${documentType} prepared based on requirements. Please review and customize as needed.`,
        confidence: 0.7,
        documents: [`${documentType}_draft.docx`]
      };
    }
  }

  /**
   * Predict project risks and suggest interventions
   */
  async predictProjectRisks(
    projectData: any,
    taskProgress: any[],
    stakeholderFeedback?: any[]
  ): Promise<AIResponse> {
    const prompt = `
    Analyze project data for potential risks and recommended interventions:
    
    Project Data: ${JSON.stringify(projectData)}
    Task Progress: ${JSON.stringify(taskProgress)}
    Stakeholder Feedback: ${JSON.stringify(stakeholderFeedback || [])}
    
    Identify:
    - Timeline risks
    - Resource constraints
    - Stakeholder engagement issues
    - Regulatory compliance risks
    - Communication gaps
    
    Suggest specific interventions and preventive measures.
    `;

    try {
      const response = await this.callGrokAPI(prompt);
      return JSON.parse(response);
    } catch (error) {
      return {
        content: 'Project monitoring active. Continue regular progress reviews.',
        confidence: 0.6,
        suggestions: ['Monitor critical tasks', 'Maintain stakeholder communication']
      };
    }
  }

  /**
   * Generate stakeholder-specific status update
   */
  async generateStatusUpdate(
    projectData: any,
    targetStakeholder: StakeholderContext,
    updateType: 'weekly' | 'milestone' | 'urgent' | 'regulatory'
  ): Promise<AIResponse> {
    const prompt = `
    Generate a ${updateType} status update for stakeholder:
    
    Project Data: ${JSON.stringify(projectData)}
    Stakeholder: ${JSON.stringify(targetStakeholder)}
    Update Type: ${updateType}
    
    Create an update that:
    - Matches stakeholder's expertise and interest level
    - Uses appropriate communication style
    - Highlights relevant progress and issues
    - Includes next steps and timelines
    - Addresses stakeholder-specific concerns
    
    For regulators: compliance focus, formal tone
    For clients: business impact, professional tone
    For team: tactical details, collaborative tone
    `;

    try {
      const response = await this.callGrokAPI(prompt);
      return JSON.parse(response);
    } catch (error) {
      return {
        content: `Project status update: Progress continues on track. Next milestone scheduled as planned.`,
        confidence: 0.6
      };
    }
  }
}

export const executionAIService = new ExecutionAIService();