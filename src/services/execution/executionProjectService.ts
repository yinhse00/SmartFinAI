import { ExecutionPlan } from './executionPlanExtractor';

export interface ExecutionProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  transaction_type: string;
  created_at: Date;
  updated_at: Date;
}

export interface ExecutionProjectWithPlan extends ExecutionProject {
  execution_plan?: ExecutionPlan;
}

// Temporary localStorage-based implementation until database migration is approved
export const executionProjectService = {
  /**
   * Create a new execution project
   */
  createProject: async (
    name: string,
    description: string,
    transactionType: string,
    executionPlan: ExecutionPlan
  ): Promise<ExecutionProject> => {
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = 'temp_user'; // Will be replaced with actual user ID once auth is integrated
    
    const project: ExecutionProjectWithPlan = {
      id: projectId,
      user_id: userId,
      name,
      description,
      transaction_type: transactionType,
      created_at: new Date(),
      updated_at: new Date(),
      execution_plan: executionPlan
    };

    // Store in localStorage
    const existingProjects = executionProjectService.getStoredProjects();
    existingProjects.push(project);
    localStorage.setItem('execution_projects', JSON.stringify(existingProjects));

    return project;
  },

  /**
   * Get all projects for the current user
   */
  getUserProjects: async (): Promise<ExecutionProject[]> => {
    const projects = executionProjectService.getStoredProjects();
    return projects.map(({ execution_plan, ...project }) => project);
  },

  /**
   * Get a specific project with its execution plan
   */
  getProjectWithPlan: async (projectId: string): Promise<ExecutionProjectWithPlan | null> => {
    const projects = executionProjectService.getStoredProjects();
    return projects.find(p => p.id === projectId) || null;
  },

  /**
   * Update an existing project
   */
  updateProject: async (
    projectId: string,
    updates: Partial<Pick<ExecutionProject, 'name' | 'description' | 'transaction_type'>>,
    executionPlan?: ExecutionPlan
  ): Promise<void> => {
    const projects = executionProjectService.getStoredProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) throw new Error('Project not found');
    
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...updates,
      updated_at: new Date(),
      ...(executionPlan && { execution_plan: executionPlan })
    };
    
    localStorage.setItem('execution_projects', JSON.stringify(projects));
  },

  /**
   * Delete a project
   */
  deleteProject: async (projectId: string): Promise<void> => {
    const projects = executionProjectService.getStoredProjects();
    const filteredProjects = projects.filter(p => p.id !== projectId);
    localStorage.setItem('execution_projects', JSON.stringify(filteredProjects));
  },

  /**
   * Update task status
   */
  updateTaskStatus: async (projectId: string, taskId: string, status: string): Promise<void> => {
    const projects = executionProjectService.getStoredProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project || !project.execution_plan) return;
    
    project.execution_plan.tasks = project.execution_plan.tasks.map(task =>
      task.id === taskId ? { ...task, status: status as any } : task
    );
    
    localStorage.setItem('execution_projects', JSON.stringify(projects));
  },

  /**
   * Helper to get stored projects from localStorage
   */
  getStoredProjects: (): ExecutionProjectWithPlan[] => {
    try {
      const stored = localStorage.getItem('execution_projects');
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((p: any) => {
        // Restore project dates
        const project: ExecutionProjectWithPlan = {
          ...p,
          created_at: new Date(p.created_at),
          updated_at: new Date(p.updated_at)
        };

        // Restore execution plan dates if execution plan exists
        if (p.execution_plan) {
          project.execution_plan = {
            ...p.execution_plan,
            // Restore plan dates
            createdAt: new Date(p.execution_plan.createdAt),
            updatedAt: new Date(p.execution_plan.updatedAt),
            // Restore milestone dates
            milestones: p.execution_plan.milestones?.map((milestone: any) => ({
              ...milestone,
              date: new Date(milestone.date)
            })) || [],
            // Restore task dates
            tasks: p.execution_plan.tasks?.map((task: any) => ({
              ...task,
              startDate: task.startDate ? new Date(task.startDate) : undefined,
              completionDate: task.completionDate ? new Date(task.completionDate) : undefined
            })) || []
          };
        }

        return project;
      });
    } catch (error) {
      console.error('Error parsing stored projects:', error);
      return [];
    }
  }
};