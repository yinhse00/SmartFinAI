
/**
 * Central workflow configuration system
 * Defines all workflow states, steps, and transitions dynamically
 */

// Core workflow phases that reflect actual processing
export enum WorkflowPhase {
  ANALYSIS = 'analysis',
  CONTEXT_GATHERING = 'context_gathering', 
  INTELLIGENT_PROCESSING = 'intelligent_processing',
  RESPONSE_GENERATION = 'response_generation',
  VALIDATION = 'validation',
  COMPLETE = 'complete'
}

// Processing states that can occur during workflow
export enum ProcessingState {
  PREPARING = 'preparing',
  PROCESSING = 'processing', 
  FINALIZING = 'finalizing',
  REVIEWING = 'reviewing'
}

// Workflow step configuration
export interface WorkflowStepConfig {
  id: WorkflowPhase;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: string;
  estimatedDuration: number; // in seconds
  canBeOptimized: boolean;
}

// Stage message configuration
export interface StageMessageConfig {
  phase: WorkflowPhase;
  messages: string[];
  messagesZh: string[];
  optimizedMessages?: string[];
  optimizedMessagesZh?: string[];
}

// Workflow step definitions
export const WORKFLOW_STEPS: WorkflowStepConfig[] = [
  {
    id: WorkflowPhase.ANALYSIS,
    name: 'Query Analysis',
    nameZh: '查询分析',
    description: 'Analyzing your query and determining processing strategy',
    descriptionZh: '分析您的查询并确定处理策略',
    icon: 'brain',
    estimatedDuration: 3,
    canBeOptimized: true
  },
  {
    id: WorkflowPhase.CONTEXT_GATHERING,
    name: 'Context Gathering',
    nameZh: '上下文收集',
    description: 'Gathering relevant regulatory context from multiple sources',
    descriptionZh: '从多个来源收集相关监管上下文',
    icon: 'database',
    estimatedDuration: 8,
    canBeOptimized: true
  },
  {
    id: WorkflowPhase.INTELLIGENT_PROCESSING,
    name: 'Intelligent Processing',
    nameZh: '智能处理',
    description: 'Processing regulatory information with advanced algorithms',
    descriptionZh: '使用高级算法处理监管信息',
    icon: 'zap',
    estimatedDuration: 12,
    canBeOptimized: true
  },
  {
    id: WorkflowPhase.RESPONSE_GENERATION,
    name: 'Response Generation',
    nameZh: '回复生成',
    description: 'Generating comprehensive regulatory response',
    descriptionZh: '生成全面的监管回复',
    icon: 'message-square',
    estimatedDuration: 15,
    canBeOptimized: false
  },
  {
    id: WorkflowPhase.VALIDATION,
    name: 'Quality Validation',
    nameZh: '质量验证',
    description: 'Validating response accuracy and completeness',
    descriptionZh: '验证回复的准确性和完整性',
    icon: 'check-circle',
    estimatedDuration: 5,
    canBeOptimized: false
  }
];

// Stage messages for each workflow phase with enhanced bold formatting
export const STAGE_MESSAGES: StageMessageConfig[] = [
  {
    phase: WorkflowPhase.ANALYSIS,
    messages: [
      '**Analyzing** your query to understand regulatory requirements...',
      '**Determining** optimal processing strategy for your request...',
      '**Checking** query cache for similar regulatory questions...',
      '**Preparing** comprehensive regulatory analysis framework...'
    ],
    messagesZh: [
      '**分析**您的查询以了解监管要求...',
      '**确定**您请求的最佳处理策略...',
      '**检查**类似监管问题的查询缓存...',
      '**准备**全面的监管分析框架...'
    ],
    optimizedMessages: [
      '**Smart analysis** in progress - leveraging **AI patterns**...',
      'Using **optimized processing** patterns for faster results...',
      '**Cache hit** detected - **accelerating** response generation...'
    ],
    optimizedMessagesZh: [
      '**智能分析**进行中 - 利用**AI模式**...',
      '使用**优化处理**模式以获得更快结果...',
      '检测到**缓存命中** - **加速**响应生成...'
    ]
  },
  {
    phase: WorkflowPhase.CONTEXT_GATHERING,
    messages: [
      '**Gathering** relevant regulatory context from **multiple databases**...',
      '**Searching** listing rules database for **applicable provisions**...',
      '**Checking** takeovers code for **relevant requirements**...',
      '**Retrieving** guidance materials and **FAQ resources**...',
      '**Quality scoring** context relevance for **optimal results**...'
    ],
    messagesZh: [
      '从**多个数据库**收集相关监管上下文...',
      '在上市规则数据库中搜索**适用条款**...',
      '检查收购守则中的**相关要求**...',
      '检索指导材料和**FAQ资源**...',
      '对上下文相关性进行**质量评分**以获得**最佳结果**...'
    ],
    optimizedMessages: [
      'Using **parallel context retrieval** for **enhanced speed**...',
      '**Fast path** context gathering with **quality optimization**...',
      '**High-quality** regulatory context **successfully identified**...'
    ],
    optimizedMessagesZh: [
      '使用**并行上下文检索**以**提高速度**...',
      '**快速路径**上下文收集与**质量优化**...',
      '**高质量**监管上下文**成功识别**...'
    ]
  },
  {
    phase: WorkflowPhase.INTELLIGENT_PROCESSING,
    messages: [
      '**Processing** regulatory information with **advanced algorithms**...',
      '**Applying** intelligent search patterns for **comprehensive analysis**...',
      '**Cross-referencing** regulatory provisions across **multiple sources**...',
      '**Synthesizing** comprehensive analysis from **regulatory data**...'
    ],
    messagesZh: [
      '使用**高级算法**处理监管信息...',
      '应用智能搜索模式进行**全面分析**...',
      '跨**多个来源**交叉引用监管条款...',
      '从**监管数据**综合全面分析...'
    ],
    optimizedMessages: [
      'Using **advanced processing algorithms** for **superior results**...',
      '**Intelligent pattern matching** actively **optimizing** analysis...',
      '**Optimized regulatory synthesis** delivering **enhanced accuracy**...'
    ],
    optimizedMessagesZh: [
      '使用**高级处理算法**获得**卓越结果**...',
      '**智能模式匹配**主动**优化**分析...',
      '**优化监管综合**提供**增强准确性**...'
    ]
  },
  {
    phase: WorkflowPhase.RESPONSE_GENERATION,
    messages: [
      '**Generating** comprehensive response with **regulatory precision**...',
      '**Formatting** regulatory content for **professional presentation**...',
      '**Ensuring** accuracy and completeness of **regulatory guidance**...',
      '**Finalizing** expert analysis with **quality assurance**...'
    ],
    messagesZh: [
      '以**监管精度**生成全面回复...',
      '为**专业展示**格式化监管内容...',
      '确保**监管指导**的准确性和完整性...',
      '通过**质量保证**完成专家分析...'
    ]
  },
  {
    phase: WorkflowPhase.VALIDATION,
    messages: [
      '**Validating** response quality against **regulatory standards**...',
      '**Checking** regulatory accuracy and **compliance requirements**...',
      '**Verifying** completeness of **regulatory analysis**...',
      '**Response ready** - **quality assured** regulatory guidance...'
    ],
    messagesZh: [
      '根据**监管标准**验证回复质量...',
      '检查监管准确性和**合规要求**...',
      '验证**监管分析**的完整性...',
      '**回复就绪** - **质量保证**的监管指导...'
    ]
  }
];

// Utility functions for workflow configuration
export const getWorkflowStep = (phase: WorkflowPhase): WorkflowStepConfig | undefined => {
  return WORKFLOW_STEPS.find(step => step.id === phase);
};

export const getStageMessages = (phase: WorkflowPhase, isOptimized = false): string[] => {
  const config = STAGE_MESSAGES.find(msg => msg.phase === phase);
  if (!config) return ['Processing...'];
  
  if (isOptimized && config.optimizedMessages) {
    return config.optimizedMessages;
  }
  return config.messages;
};

export const getStageMessagesZh = (phase: WorkflowPhase, isOptimized = false): string[] => {
  const config = STAGE_MESSAGES.find(msg => msg.phase === phase);
  if (!config) return ['处理中...'];
  
  if (isOptimized && config.optimizedMessagesZh) {
    return config.optimizedMessagesZh;
  }
  return config.messagesZh;
};

export const getTotalEstimatedDuration = (): number => {
  return WORKFLOW_STEPS.reduce((total, step) => total + step.estimatedDuration, 0);
};

export const getEstimatedTimeRemaining = (currentPhase: WorkflowPhase, elapsedTime: number): number => {
  const currentIndex = WORKFLOW_STEPS.findIndex(step => step.id === currentPhase);
  if (currentIndex === -1) return 0;
  
  const remainingSteps = WORKFLOW_STEPS.slice(currentIndex + 1);
  const remainingTime = remainingSteps.reduce((total, step) => total + step.estimatedDuration, 0);
  
  // Adjust based on current step progress
  const currentStep = WORKFLOW_STEPS[currentIndex];
  const currentStepRemaining = Math.max(0, currentStep.estimatedDuration - elapsedTime);
  
  return remainingTime + currentStepRemaining;
};
