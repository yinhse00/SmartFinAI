import { grokApiService } from '../api/grokApiService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { responseFormatter } from '../response/modules/responseFormatter';

export interface ExecutionTask {
  id: string;
  title: string;
  description: string;
  type: 'regulatory' | 'financial' | 'legal' | 'operational' | 'documentation';
  priority: 'high' | 'medium' | 'low';
  estimatedDays: number;
  dependencies: string[];
  stakeholders: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  startDate?: Date;
  completionDate?: Date;
  documents?: string[];
  milestone?: string;
}

export interface ExecutionPlan {
  id: string;
  title: string;
  description: string;
  tasks: ExecutionTask[];
  totalEstimatedDays: number;
  criticalPath: string[];
  milestones: Array<{
    id: string;
    name: string;
    date: Date;
    taskIds: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatAnalysisContext {
  originalAnalysis: AnalysisResults;
  chatHistory: Array<{
    question: string;
    response: string;
    timestamp: Date;
  }>;
  transactionType: string;
  targetCompany: string;
  acquiringCompany: string;
}

export const executionPlanExtractor = {
  /**
   * Extract actionable execution plan from analysis results and chat context
   */
  extractExecutionPlan: async (context: ChatAnalysisContext): Promise<ExecutionPlan> => {
    try {
      console.log('Extracting execution plan from analysis and chat context');
      
      const extractionPrompt = `
You are a Hong Kong financial advisory execution planning expert. Extract a comprehensive, actionable execution plan from the provided transaction analysis and chat discussions.

TRANSACTION CONTEXT:
Transaction Type: ${context.transactionType}
Target Company: ${context.targetCompany}
Acquiring Company: ${context.acquiringCompany}

ANALYSIS RESULTS:
${JSON.stringify(context.originalAnalysis, null, 2)}

CHAT DISCUSSIONS:
${context.chatHistory.map((chat, index) => `
Discussion ${index + 1}:
Q: ${chat.question}
A: ${chat.response}
Time: ${chat.timestamp.toISOString()}
`).join('\n')}

INSTRUCTIONS:
1. Create a detailed execution plan with specific, actionable tasks
2. Each task should include clear deliverables and stakeholder responsibilities
3. Consider Hong Kong regulatory requirements and timelines
4. Identify dependencies and critical path items
5. Include realistic time estimates based on market practice
6. Extract any specific requirements or modifications discussed in the chat

Please respond with a JSON object in this exact format:
{
  "title": "Execution Plan for [Transaction Description]",
  "description": "Brief overview of the execution plan",
  "tasks": [
    {
      "id": "task_1",
      "title": "Task title",
      "description": "Detailed task description with specific deliverables",
      "type": "regulatory|financial|legal|operational|documentation",
      "priority": "high|medium|low",
      "estimatedDays": number,
      "dependencies": ["task_id_array"],
      "stakeholders": ["role/department names"],
      "status": "pending",
      "documents": ["required documents"],
      "milestone": "milestone name if applicable"
    }
  ],
  "milestones": [
    {
      "id": "milestone_1",
      "name": "Milestone name",
      "date": "ISO date string",
      "taskIds": ["related_task_ids"]
    }
  ]
}

Focus on practical, Hong Kong market-specific tasks that can be tracked and executed.
`;

      const response = await grokApiService.callChatCompletions({
        messages: [
          { role: 'system', content: 'You are a Hong Kong financial advisory execution planning expert.' },
          { role: 'user', content: extractionPrompt }
        ],
        model: 'grok-3-beta',
        temperature: 0.2,
        max_tokens: 8000,
        metadata: {
          processingStage: 'executionPlanExtraction',
          transactionType: context.transactionType,
          bypassCache: true,
          timestamp: Date.now()
        }
      });

      const responseContent = response?.choices?.[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from AI');
      }

      const extractedPlan = JSON.parse(jsonMatch[0]);
      
      // Create execution plan with metadata
      const executionPlan: ExecutionPlan = {
        id: `exec_plan_${Date.now()}`,
        title: extractedPlan.title,
        description: extractedPlan.description,
        tasks: extractedPlan.tasks.map((task: any, index: number) => ({
          ...task,
          id: task.id || `task_${index + 1}`,
          status: 'pending' as const
        })),
        totalEstimatedDays: extractedPlan.tasks.reduce((total: number, task: any) => total + (task.estimatedDays || 0), 0),
        criticalPath: this.calculateCriticalPath(extractedPlan.tasks),
        milestones: extractedPlan.milestones.map((milestone: any) => ({
          ...milestone,
          date: new Date(milestone.date)
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Execution plan extracted successfully:', executionPlan.title);
      console.log('Total tasks:', executionPlan.tasks.length);
      console.log('Estimated duration:', executionPlan.totalEstimatedDays, 'days');
      
      return executionPlan;
    } catch (error) {
      console.error('Error extracting execution plan:', error);
      
      // Fallback execution plan based on analysis results
      return this.createFallbackExecutionPlan(context);
    }
  },

  /**
   * Calculate critical path from task dependencies
   */
  calculateCriticalPath: (tasks: ExecutionTask[]): string[] => {
    // Simple critical path calculation - tasks with no dependencies first, then longest chain
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    const visited = new Set<string>();
    const criticalPath: string[] = [];

    const findLongestPath = (taskId: string, currentPath: string[] = []): string[] => {
      if (visited.has(taskId) || currentPath.includes(taskId)) {
        return currentPath;
      }

      const task = taskMap.get(taskId);
      if (!task) return currentPath;

      const newPath = [...currentPath, taskId];
      visited.add(taskId);

      let longestPath = newPath;
      for (const depId of task.dependencies) {
        const depPath = findLongestPath(depId, newPath);
        if (depPath.length > longestPath.length) {
          longestPath = depPath;
        }
      }

      return longestPath;
    };

    // Find the task with the longest dependency chain
    let longestOverallPath: string[] = [];
    for (const task of tasks) {
      visited.clear();
      const path = findLongestPath(task.id);
      if (path.length > longestOverallPath.length) {
        longestOverallPath = path;
      }
    }

    return longestOverallPath;
  },

  /**
   * Create fallback execution plan when AI extraction fails
   */
  createFallbackExecutionPlan: (context: ChatAnalysisContext): ExecutionPlan => {
    const baseTasks: ExecutionTask[] = [
      {
        id: 'task_1',
        title: 'Regulatory Compliance Review',
        description: 'Review and ensure compliance with Hong Kong listing rules and takeover code requirements',
        type: 'regulatory',
        priority: 'high',
        estimatedDays: 5,
        dependencies: [],
        stakeholders: ['Legal Team', 'Compliance Officer'],
        status: 'pending',
        documents: ['Listing Rules Checklist', 'Takeover Code Analysis']
      },
      {
        id: 'task_2',
        title: 'Financial Due Diligence',
        description: 'Complete financial analysis and validation of transaction terms',
        type: 'financial',
        priority: 'high',
        estimatedDays: 7,
        dependencies: [],
        stakeholders: ['Finance Team', 'External Auditors'],
        status: 'pending',
        documents: ['Financial Statements', 'Valuation Report']
      },
      {
        id: 'task_3',
        title: 'Legal Documentation',
        description: 'Prepare and review all legal documentation for the transaction',
        type: 'legal',
        priority: 'medium',
        estimatedDays: 10,
        dependencies: ['task_1', 'task_2'],
        stakeholders: ['Legal Counsel', 'External Law Firm'],
        status: 'pending',
        documents: ['Transaction Agreements', 'Board Resolutions']
      }
    ];

    return {
      id: `fallback_plan_${Date.now()}`,
      title: `Execution Plan for ${context.transactionType}`,
      description: 'Automated execution plan based on transaction analysis',
      tasks: baseTasks,
      totalEstimatedDays: 22,
      criticalPath: ['task_1', 'task_2', 'task_3'],
      milestones: [
        {
          id: 'milestone_1',
          name: 'Regulatory Approval',
          date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          taskIds: ['task_1', 'task_3']
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  /**
   * Update task status and recalculate plan metrics
   */
  updateTaskStatus: (plan: ExecutionPlan, taskId: string, status: ExecutionTask['status']): ExecutionPlan => {
    const updatedTasks = plan.tasks.map(task => 
      task.id === taskId 
        ? { ...task, status, completionDate: status === 'completed' ? new Date() : undefined }
        : task
    );

    return {
      ...plan,
      tasks: updatedTasks,
      updatedAt: new Date()
    };
  }
};