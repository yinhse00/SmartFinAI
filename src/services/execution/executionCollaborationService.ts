import { supabase } from "@/integrations/supabase/client";
import { ExecutionPlan } from './executionPlanExtractor';
import type { Database } from '@/integrations/supabase/types';

export type ExecutionRole = 'admin' | 'manager' | 'team_member' | 'external_advisor' | 'client';

export interface ExecutionProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  transaction_type: string;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold';
  execution_plan?: ExecutionPlan;
  created_at: string;
  updated_at: string;
}

type DbExecutionProject = Database['public']['Tables']['execution_projects']['Row'];
type DbProjectMember = Database['public']['Tables']['execution_project_members']['Row'];
type DbTaskComment = Database['public']['Tables']['execution_task_comments']['Row'];
type DbNotification = Database['public']['Tables']['execution_notifications']['Row'];

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id?: string;
  email?: string;
  role: ExecutionRole;
  invited_at?: string;
  joined_at?: string;
  invited_by?: string;
  status: 'pending' | 'active' | 'inactive';
  permissions: Record<string, boolean>;
  created_at: string;
}

export interface TaskComment {
  id: string;
  project_id: string;
  task_id: string;
  user_id?: string;
  author_email?: string;
  author_name?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ExecutionNotification {
  id: string;
  project_id: string;
  user_id?: string;
  email?: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  read_at?: string;
  created_at: string;
}

export const executionCollaborationService = {
  // Project Management
  async createProject(
    name: string,
    description: string,
    transactionType: string,
    executionPlan: ExecutionPlan
  ): Promise<ExecutionProject> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('execution_projects')
      .insert({
        user_id: user.user.id,
        name,
        description,
        transaction_type: transactionType,
        execution_plan: executionPlan as any,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      execution_plan: data.execution_plan as unknown as ExecutionPlan
    } as ExecutionProject;
  },

  async getUserProjects(): Promise<ExecutionProject[]> {
    const { data, error } = await supabase
      .from('execution_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(project => ({
      ...project,
      execution_plan: project.execution_plan as unknown as ExecutionPlan
    })) as ExecutionProject[];
  },

  async getProjectWithPlan(projectId: string): Promise<ExecutionProject | null> {
    const { data, error } = await supabase
      .from('execution_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) return null;
    return {
      ...data,
      execution_plan: data.execution_plan as unknown as ExecutionPlan
    } as ExecutionProject;
  },

  async updateProject(
    projectId: string,
    updates: Partial<Pick<ExecutionProject, 'name' | 'description' | 'transaction_type' | 'status'>>,
    executionPlan?: ExecutionPlan
  ): Promise<void> {
    const updateData = {
      ...updates,
      ...(executionPlan && { execution_plan: executionPlan as any })
    };

    const { error } = await supabase
      .from('execution_projects')
      .update(updateData)
      .eq('id', projectId);

    if (error) throw error;
  },

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('execution_projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  },

  // Member Management
  async inviteMember(
    projectId: string,
    email: string,
    role: ExecutionRole,
    permissions: Record<string, boolean> = {}
  ): Promise<ProjectMember> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('execution_project_members')
      .insert({
        project_id: projectId,
        email,
        role,
        invited_by: user.user.id,
        permissions: permissions as any,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for invited user
    await this.createNotification(
      projectId,
      'member_invited',
      'Project Invitation',
      `You have been invited to join a project as ${role}`,
      { project_id: projectId, role },
      undefined,
      email
    );

    return {
      ...data,
      permissions: data.permissions as Record<string, boolean>
    } as ProjectMember;
  },

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const { data, error } = await supabase
      .from('execution_project_members')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(member => ({
      ...member,
      permissions: member.permissions as Record<string, boolean>
    })) as ProjectMember[];
  },

  async updateMemberRole(
    projectId: string,
    memberId: string,
    role: ExecutionRole,
    permissions?: Record<string, boolean>
  ): Promise<void> {
    const updateData = {
      role,
      ...(permissions && { permissions: permissions as any })
    };

    const { error } = await supabase
      .from('execution_project_members')
      .update(updateData)
      .eq('id', memberId)
      .eq('project_id', projectId);

    if (error) throw error;
  },

  async removeMember(projectId: string, memberId: string): Promise<void> {
    const { error } = await supabase
      .from('execution_project_members')
      .delete()
      .eq('id', memberId)
      .eq('project_id', projectId);

    if (error) throw error;
  },

  // Task Comments
  async addTaskComment(
    projectId: string,
    taskId: string,
    content: string,
    authorName?: string
  ): Promise<TaskComment> {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('execution_task_comments')
      .insert({
        project_id: projectId,
        task_id: taskId,
        user_id: user.user?.id,
        author_email: user.user?.email,
        author_name: authorName || user.user?.email,
        content
      })
      .select()
      .single();

    if (error) throw error;

    // Notify project members about new comment
    const members = await this.getProjectMembers(projectId);
    for (const member of members) {
      if (member.user_id !== user.user?.id && member.status === 'active') {
        await this.createNotification(
          projectId,
          'task_comment',
          'New Task Comment',
          `${authorName || user.user?.email} commented on a task`,
          { task_id: taskId, comment_id: data.id },
          member.user_id,
          member.email
        );
      }
    }

    return data;
  },

  async getTaskComments(projectId: string, taskId: string): Promise<TaskComment[]> {
    const { data, error } = await supabase
      .from('execution_task_comments')
      .select('*')
      .eq('project_id', projectId)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Notifications
  async createNotification(
    projectId: string,
    type: string,
    title: string,
    message: string,
    data: Record<string, any> = {},
    userId?: string,
    email?: string
  ): Promise<ExecutionNotification> {
    const { data: notification, error } = await supabase
      .from('execution_notifications')
      .insert({
        project_id: projectId,
        user_id: userId,
        email,
        type,
        title,
        message,
        data: data as any
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...notification,
      data: notification.data as Record<string, any>
    } as ExecutionNotification;
  },

  async getUserNotifications(limit = 50): Promise<ExecutionNotification[]> {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('execution_notifications')
      .select('*')
      .or(`user_id.eq.${user.user?.id},email.eq.${user.user?.email}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(notification => ({
      ...notification,
      data: notification.data as Record<string, any>
    })) as ExecutionNotification[];
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('execution_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Task Management with AI Monitoring
  async updateTaskStatus(
    projectId: string,
    taskId: string,
    status: string,
    notes?: string
  ): Promise<void> {
    const project = await this.getProjectWithPlan(projectId);
    if (!project || !project.execution_plan) return;

    // Update task status in execution plan
    const updatedPlan = {
      ...project.execution_plan,
      tasks: project.execution_plan.tasks.map(task =>
        task.id === taskId ? { ...task, status: status as any, notes } : task
      )
    };

    await this.updateProject(projectId, {}, updatedPlan);

    // Create notification for status change
    const members = await this.getProjectMembers(projectId);
    const { data: user } = await supabase.auth.getUser();
    
    for (const member of members) {
      if (member.user_id !== user.user?.id && member.status === 'active') {
        await this.createNotification(
          projectId,
          'task_status_changed',
          'Task Status Updated',
          `Task status changed to ${status}`,
          { task_id: taskId, new_status: status, notes },
          member.user_id,
          member.email
        );
      }
    }

    // AI monitoring logic
    await this.analyzeProjectProgress(projectId, updatedPlan);
  },

  // AI Monitoring and Analysis
  async analyzeProjectProgress(projectId: string, executionPlan: ExecutionPlan): Promise<void> {
    const completedTasks = executionPlan.tasks.filter(t => t.status === 'completed').length;
    const blockedTasks = executionPlan.tasks.filter(t => t.status === 'blocked').length;
    const overdueTasks = executionPlan.tasks.filter(t => {
      // Check if task has a completion date and is overdue
      return t.completionDate && new Date(t.completionDate) < new Date() && t.status !== 'completed';
    }).length;

    // AI Risk Assessment
    const riskLevel = this.calculateRiskLevel(executionPlan.tasks);
    const completionPercentage = (completedTasks / executionPlan.tasks.length) * 100;

    // Auto-escalate if high risk
    if (riskLevel === 'high' || overdueTasks > 3 || blockedTasks > 2) {
      const members = await this.getProjectMembers(projectId);
      const admins = members.filter(m => m.role === 'admin' || m.role === 'manager');

      for (const admin of admins) {
        await this.createNotification(
          projectId,
          'project_risk_alert',
          'Project Risk Alert',
          `Project requires attention: ${overdueTasks} overdue, ${blockedTasks} blocked tasks`,
          { 
            risk_level: riskLevel,
            completion_percentage: completionPercentage,
            overdue_tasks: overdueTasks,
            blocked_tasks: blockedTasks
          },
          admin.user_id,
          admin.email
        );
      }
    }
  },

  calculateRiskLevel(tasks: any[]): 'low' | 'medium' | 'high' {
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    const overdueTasks = tasks.filter(t => {
      // Check if task has a completion date and is overdue
      return t.completionDate && new Date(t.completionDate) < new Date() && t.status !== 'completed';
    }).length;

    const riskScore = (blockedTasks * 2) + (overdueTasks * 1.5);
    
    if (riskScore >= 5) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  },

  // Real-time subscription setup
  subscribeToProjectUpdates(projectId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`project_${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'execution_projects',
        filter: `id=eq.${projectId}`
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'execution_task_comments',
        filter: `project_id=eq.${projectId}`
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'execution_project_members',
        filter: `project_id=eq.${projectId}`
      }, callback)
      .subscribe();
  }
};