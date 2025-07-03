import { supabase } from '@/integrations/supabase/client';
import { executionAIService, EmailAnalysis, StakeholderContext } from './executionAIService';

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: Date;
  projectId?: string;
  analysis?: EmailAnalysis;
  aiResponse?: string;
  status: 'pending' | 'analyzed' | 'responded' | 'escalated';
}

export interface EmailIntegrationConfig {
  projectId: string;
  autoReply: boolean;
  stakeholderRules: StakeholderRule[];
  escalationRules: EscalationRule[];
}

export interface StakeholderRule {
  emailPattern: string;
  stakeholderType: StakeholderContext['role'];
  autoReplyEnabled: boolean;
  requiresApproval: boolean;
}

export interface EscalationRule {
  condition: 'priority_high' | 'regulatory' | 'deadline_near' | 'keyword_match';
  value?: string;
  action: 'notify_manager' | 'immediate_response' | 'create_task' | 'schedule_meeting';
  recipients: string[];
}

class EmailIntegrationService {
  /**
   * Process incoming email and generate AI response
   */
  async processIncomingEmail(
    email: EmailMessage, 
    projectId: string
  ): Promise<{ analysis: EmailAnalysis; response?: string; actions: any[] }> {
    try {
      // Get project context
      const projectContext = await this.getProjectContext(projectId);
      
      // Analyze email
      const analysis = await executionAIService.analyzeEmail(
        email.body, 
        email.from, 
        email.subject, 
        projectContext
      );

      // Get stakeholder context
      const stakeholder = await this.getStakeholderContext(email.from, projectId);
      
      // Get integration config
      const config = await this.getIntegrationConfig(projectId);
      
      const actions: any[] = [];
      let response: string | undefined;

      // Generate AI response if auto-reply is enabled
      if (config.autoReply && this.shouldAutoReply(analysis, stakeholder, config)) {
        const aiResponse = await executionAIService.generateEmailResponse(
          email.body,
          analysis,
          projectContext,
          stakeholder
        );
        
        response = aiResponse.content;
        
        // Add suggested actions
        if (aiResponse.actions) {
          actions.push(...aiResponse.actions);
        }
      }

      // Check escalation rules
      const escalations = this.checkEscalationRules(analysis, config);
      actions.push(...escalations);

      // Store processed email
      await this.storeProcessedEmail({
        ...email,
        projectId,
        analysis,
        aiResponse: response,
        status: response ? 'responded' : 'analyzed'
      });

      return { analysis, response, actions };
    } catch (error) {
      console.error('Error processing email:', error);
      throw error;
    }
  }

  /**
   * Send AI-generated email response
   */
  async sendAIResponse(
    originalEmail: EmailMessage,
    response: string,
    projectId: string
  ): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email-response', {
        body: {
          to: originalEmail.from,
          subject: `Re: ${originalEmail.subject}`,
          body: response,
          projectId,
          originalEmailId: originalEmail.id
        }
      });

      if (error) throw error;

      // Update email status
      await this.updateEmailStatus(originalEmail.id, 'responded');
      
      // Log the interaction
      await this.logEmailInteraction(originalEmail.id, 'ai_response_sent', response);
    } catch (error) {
      console.error('Error sending AI response:', error);
      throw error;
    }
  }

  /**
   * Parse email content for task creation requests
   */
  async parseEmailForTasks(
    email: EmailMessage,
    projectId: string
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('parse-email-tasks', {
        body: {
          emailContent: email.body,
          subject: email.subject,
          projectId
        }
      });

      if (error) throw error;
      return data.tasks || [];
    } catch (error) {
      console.error('Error parsing email for tasks:', error);
      return [];
    }
  }

  /**
   * Generate document based on email request
   */
  async generateDocumentFromEmail(
    email: EmailMessage,
    projectId: string
  ): Promise<{ document: any; downloadUrl: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-document-from-email', {
        body: {
          emailContent: email.body,
          subject: email.subject,
          projectId,
          sender: email.from
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating document from email:', error);
      throw error;
    }
  }

  /**
   * Set up email monitoring for a project
   */
  async setupProjectEmailMonitoring(
    projectId: string,
    config: EmailIntegrationConfig
  ): Promise<void> {
    try {
      // Store in localStorage for now until migration is applied
      const configKey = `email_config_${projectId}`;
      localStorage.setItem(configKey, JSON.stringify(config));
      console.log('Email monitoring config stored locally for project:', projectId);
    } catch (error) {
      console.error('Error setting up email monitoring:', error);
      throw error;
    }
  }

  /**
   * Get stakeholder context for email sender
   */
  private async getStakeholderContext(
    email: string, 
    projectId: string
  ): Promise<StakeholderContext> {
    try {
      // Try to find stakeholder in project members
      const { data: member } = await supabase
        .from('execution_project_members')
        .select('*')
        .eq('project_id', projectId)
        .eq('email', email)
        .single();

      if (member) {
        // Map execution_role to stakeholder role
        const roleMap: Record<string, StakeholderContext['role']> = {
          'admin': 'team_member',
          'manager': 'team_member', 
          'team_member': 'team_member',
          'external_advisor': 'external_advisor',
          'client': 'client'
        };
        
        return {
          id: member.id,
          name: member.email,
          role: roleMap[member.role] || 'external_advisor',
          communication_style: 'professional',
          expertise_areas: [],
          contact_info: { email: member.email }
        };
      }

      // Default stakeholder context
      return {
        id: 'unknown',
        name: email,
        role: 'external_advisor',
        communication_style: 'professional',
        expertise_areas: [],
        contact_info: { email }
      };
    } catch (error) {
      console.error('Error getting stakeholder context:', error);
      return {
        id: 'unknown',
        name: email,
        role: 'external_advisor',
        communication_style: 'professional',
        expertise_areas: [],
        contact_info: { email }
      };
    }
  }

  /**
   * Get project context for AI analysis
   */
  private async getProjectContext(projectId: string): Promise<any> {
    try {
      const { data: project } = await supabase
        .from('execution_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      return project || {};
    } catch (error) {
      console.error('Error getting project context:', error);
      return {};
    }
  }

  /**
   * Get email integration configuration
   */
  private async getIntegrationConfig(projectId: string): Promise<EmailIntegrationConfig> {
    try {
      // Use localStorage until migration is applied
      const configKey = `email_config_${projectId}`;
      const stored = localStorage.getItem(configKey);
      
      if (stored) {
        return JSON.parse(stored);
      }
      
      return {
        projectId,
        autoReply: true,
        stakeholderRules: [],
        escalationRules: []
      };
    } catch (error) {
      return {
        projectId,
        autoReply: true,
        stakeholderRules: [],
        escalationRules: []
      };
    }
  }

  /**
   * Check if auto-reply should be sent
   */
  private shouldAutoReply(
    analysis: EmailAnalysis,
    stakeholder: StakeholderContext,
    config: EmailIntegrationConfig
  ): boolean {
    // Don't auto-reply to urgent regulatory emails - they need human review
    if (analysis.priority === 'critical' && analysis.stakeholder_type === 'regulator') {
      return false;
    }

    // Check stakeholder-specific rules
    const rule = config.stakeholderRules.find(r => 
      stakeholder.contact_info.email.includes(r.emailPattern)
    );

    if (rule) {
      return rule.autoReplyEnabled && !rule.requiresApproval;
    }

    return config.autoReply;
  }

  /**
   * Check escalation rules and return required actions
   */
  private checkEscalationRules(
    analysis: EmailAnalysis,
    config: EmailIntegrationConfig
  ): any[] {
    const actions: any[] = [];

    config.escalationRules.forEach(rule => {
      let shouldEscalate = false;

      switch (rule.condition) {
        case 'priority_high':
          shouldEscalate = analysis.priority === 'high' || analysis.priority === 'critical';
          break;
        case 'regulatory':
          shouldEscalate = analysis.stakeholder_type === 'regulator';
          break;
        case 'keyword_match':
          shouldEscalate = rule.value ? 
            analysis.key_topics.some(topic => 
              topic.toLowerCase().includes(rule.value!.toLowerCase())
            ) : false;
          break;
      }

      if (shouldEscalate) {
        actions.push({
          type: 'escalation',
          description: `Escalation triggered: ${rule.condition}`,
          data: {
            action: rule.action,
            recipients: rule.recipients,
            rule: rule.condition
          }
        });
      }
    });

    return actions;
  }

  /**
   * Store processed email in database
   */
  private async storeProcessedEmail(email: EmailMessage): Promise<void> {
    try {
      // Store in localStorage until migration is applied
      const emailKey = `processed_email_${email.id}`;
      const emailData = {
        id: email.id,
        project_id: email.projectId,
        from_email: email.from,
        to_email: email.to,
        subject: email.subject,
        body: email.body,
        analysis: email.analysis,
        ai_response: email.aiResponse,
        status: email.status,
        timestamp: email.timestamp.toISOString()
      };
      localStorage.setItem(emailKey, JSON.stringify(emailData));
      console.log('Email stored locally:', email.id);
    } catch (error) {
      console.error('Error storing processed email:', error);
    }
  }

  /**
   * Update email status
   */
  private async updateEmailStatus(emailId: string, status: EmailMessage['status']): Promise<void> {
    try {
      // Update in localStorage until migration is applied
      const emailKey = `processed_email_${emailId}`;
      const stored = localStorage.getItem(emailKey);
      if (stored) {
        const emailData = JSON.parse(stored);
        emailData.status = status;
        emailData.updated_at = new Date().toISOString();
        localStorage.setItem(emailKey, JSON.stringify(emailData));
        console.log('Email status updated locally:', emailId, status);
      }
    } catch (error) {
      console.error('Error updating email status:', error);
    }
  }

  /**
   * Log email interaction
   */
  private async logEmailInteraction(
    emailId: string, 
    action: string, 
    details: string
  ): Promise<void> {
    try {
      // Store in localStorage until migration is applied
      const logKey = `email_log_${emailId}_${Date.now()}`;
      const logData = {
        email_id: emailId,
        action,
        details,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(logKey, JSON.stringify(logData));
      console.log('Email interaction logged locally:', emailId, action);
    } catch (error) {
      console.error('Error logging email interaction:', error);
    }
  }
}

export const emailIntegrationService = new EmailIntegrationService();