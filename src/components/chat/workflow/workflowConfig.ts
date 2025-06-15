
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

// Stage messages for each workflow phase
export const STAGE_MESSAGES: StageMessageConfig[] = [
  {
    phase: WorkflowPhase.ANALYSIS,
    messages: [
      'Analyzing your query...',
      'Determining processing strategy...',
      'Checking query cache...',
      'Preparing regulatory analysis...'
    ],
    messagesZh: [
      '分析您的查询...',
      '确定处理策略...',
      '检查查询缓存...',
      '准备监管分析...'
    ],
    optimizedMessages: [
      'Smart analysis in progress...',
      'Using optimized processing patterns...',
      'Cache hit - accelerating response...'
    ],
    optimizedMessagesZh: [
      '智能分析进行中...',
      '使用优化处理模式...',
      '缓存命中 - 加速响应...'
    ]
  },
  {
    phase: WorkflowPhase.CONTEXT_GATHERING,
    messages: [
      'Gathering regulatory context...',
      'Searching listing rules database...',
      'Checking takeovers code provisions...',
      'Retrieving guidance materials...',
      'Quality scoring context relevance...'
    ],
    messagesZh: [
      '收集监管上下文...',
      '搜索上市规则数据库...',
      '检查收购守则条款...',
      '检索指导材料...',
      '对上下文相关性进行质量评分...'
    ],
    optimizedMessages: [
      'Using parallel context retrieval...',
      'Fast path context gathering...',
      'High-quality context identified...'
    ],
    optimizedMessagesZh: [
      '使用并行上下文检索...',
      '快速路径上下文收集...',
      '识别高质量上下文...'
    ]
  },
  {
    phase: WorkflowPhase.INTELLIGENT_PROCESSING,
    messages: [
      'Processing regulatory information...',
      'Applying intelligent search patterns...',
      'Cross-referencing regulatory provisions...',
      'Synthesizing comprehensive analysis...'
    ],
    messagesZh: [
      '处理监管信息...',
      '应用智能搜索模式...',
      '交叉引用监管条款...',
      '综合全面分析...'
    ],
    optimizedMessages: [
      'Using advanced processing algorithms...',
      'Intelligent pattern matching active...',
      'Optimized regulatory synthesis...'
    ],
    optimizedMessagesZh: [
      '使用高级处理算法...',
      '智能模式匹配激活...',
      '优化监管综合...'
    ]
  },
  {
    phase: WorkflowPhase.RESPONSE_GENERATION,
    messages: [
      'Generating comprehensive response...',
      'Formatting regulatory content...',
      'Ensuring accuracy and completeness...',
      'Finalizing expert analysis...'
    ],
    messagesZh: [
      '生成全面回复...',
      '格式化监管内容...',
      '确保准确性和完整性...',
      '完成专家分析...'
    ]
  },
  {
    phase: WorkflowPhase.VALIDATION,
    messages: [
      'Validating response quality...',
      'Checking regulatory accuracy...',
      'Verifying completeness...',
      'Response ready...'
    ],
    messagesZh: [
      '验证回复质量...',
      '检查监管准确性...',
      '验证完整性...',
      '回复就绪...'
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
