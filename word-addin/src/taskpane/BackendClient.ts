/**
 * BackendClient - Connects to Supabase edge functions for AI analysis
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Configuration - Update these for production
const SUPABASE_URL = 'https://petoxjdikxxugbrzajpj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldG94amRpa3h4dWdicnphanBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNTMxMDksImV4cCI6MjA1ODYyOTEwOX0.wPAUBKDWryZtO8oFVDPdNLVE99bMVdAUECMaKZqi2bk';

export interface Amendment {
  id: string;
  type: 'track_change' | 'comment';
  searchText: string;
  replacement?: string;
  commentText?: string;
  reason: string;
  severity: 'critical' | 'important' | 'suggestion';
  regulatoryCitation?: string;
}

export interface ReasoningStep {
  step: number;
  action: string;
  detail: string;
}

export interface AnalysisResult {
  amendments: Amendment[];
  reasoningSteps: ReasoningStep[];
  complianceScore: number;
  missingElements: string[];
  sessionId: string;
}

export interface AnalysisRequest {
  content: string;
  sectionType?: string;
  language?: 'en' | 'zh' | 'mixed';
  userRequest?: string;
  projectId?: string;
}

export class BackendClient {
  private static instance: BackendClient;
  private supabase: SupabaseClient;
  private currentUser: User | null = null;
  private sessionId: string | null = null;

  private constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }

  static getInstance(): BackendClient {
    if (!BackendClient.instance) {
      BackendClient.instance = new BackendClient();
    }
    return BackendClient.instance;
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      this.currentUser = data.user;
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Failed to sign in' };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUser = null;
    this.sessionId = null;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) return this.currentUser;
    
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUser = user;
    return user;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  /**
   * Analyze document content using the edge function
   */
  async analyzeDocument(request: AnalysisRequest): Promise<AnalysisResult> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to analyze documents');
    }

    console.log('Sending analysis request:', {
      contentLength: request.content.length,
      sectionType: request.sectionType,
      language: request.language
    });

    const { data, error } = await this.supabase.functions.invoke('word-addon-analyze', {
      body: {
        content: request.content,
        sectionType: request.sectionType || 'business',
        language: request.language || 'en',
        userRequest: request.userRequest,
        projectId: request.projectId
      }
    });

    if (error) {
      console.error('Analysis error:', error);
      throw new Error(error.message || 'Failed to analyze document');
    }

    // Store session ID for logging actions
    if (data?.sessionId) {
      this.sessionId = data.sessionId;
    }

    return this.transformResponse(data);
  }

  /**
   * Log an amendment action (apply/reject)
   */
  async logAmendmentAction(
    amendmentId: string, 
    action: 'applied' | 'rejected'
  ): Promise<void> {
    if (!this.sessionId) {
      console.warn('No session ID available for logging');
      return;
    }

    try {
      await this.supabase
        .from('word_addon_amendments')
        .update({ 
          user_action: action,
          applied_at: action === 'applied' ? new Date().toISOString() : null
        })
        .eq('id', amendmentId);
      
      console.log(`Amendment ${amendmentId} marked as ${action}`);
    } catch (error) {
      console.error('Error logging amendment action:', error);
    }
  }

  /**
   * Get user's IPO projects
   */
  async getProjects(): Promise<Array<{ id: string; name: string; company: string }>> {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('ipo_prospectus_projects')
      .select('id, project_name, company_name')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    return (data || []).map(p => ({
      id: p.id,
      name: p.project_name,
      company: p.company_name
    }));
  }

  /**
   * Transform API response to AnalysisResult
   */
  private transformResponse(data: any): AnalysisResult {
    return {
      amendments: (data.amendments || []).map((a: any) => ({
        id: a.id || crypto.randomUUID(),
        type: a.amendment_type || a.type || 'comment',
        searchText: a.search_text || a.searchText || '',
        replacement: a.replacement_text || a.replacement,
        commentText: a.comment_text || a.commentText,
        reason: a.comment_text || a.reason || '',
        severity: a.severity || 'suggestion',
        regulatoryCitation: a.regulatory_citation || a.regulatoryCitation
      })),
      reasoningSteps: data.reasoningSteps || [],
      complianceScore: data.complianceScore || 0,
      missingElements: data.missingElements || [],
      sessionId: data.sessionId || ''
    };
  }

  /**
   * Get Supabase client for direct operations
   */
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }
}

export const backendClient = BackendClient.getInstance();
