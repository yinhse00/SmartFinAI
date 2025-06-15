
/**
 * Dynamic workflow state manager
 * Handles state transitions, progress tracking, and workflow intelligence
 */

import { WorkflowPhase, ProcessingState, getWorkflowStep, getEstimatedTimeRemaining } from './workflowConfig';

export interface WorkflowState {
  currentPhase: WorkflowPhase;
  processingState: ProcessingState;
  progress: number;
  isOptimized: boolean;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  currentMessage: string;
  startTime: number;
}

export interface WorkflowTransition {
  fromPhase: WorkflowPhase;
  toPhase: WorkflowPhase;
  trigger: string | RegExp;
  isOptimizationIndicator?: boolean;
}

// Dynamic workflow transitions based on actual processing signals
export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // Analysis phase transitions
  {
    fromPhase: WorkflowPhase.ANALYSIS,
    toPhase: WorkflowPhase.CONTEXT_GATHERING,
    trigger: /gathering|searching|retriev|context/i
  },
  
  // Context gathering transitions
  {
    fromPhase: WorkflowPhase.CONTEXT_GATHERING,
    toPhase: WorkflowPhase.INTELLIGENT_PROCESSING,
    trigger: /processing|intelligent|pattern|synthesis/i
  },
  
  // Processing transitions
  {
    fromPhase: WorkflowPhase.INTELLIGENT_PROCESSING,
    toPhase: WorkflowPhase.RESPONSE_GENERATION,
    trigger: /generat|format|compil|final/i
  },
  
  // Response generation transitions
  {
    fromPhase: WorkflowPhase.RESPONSE_GENERATION,
    toPhase: WorkflowPhase.VALIDATION,
    trigger: /validat|check|verify|review|quality/i
  },
  
  // Validation transitions
  {
    fromPhase: WorkflowPhase.VALIDATION,
    toPhase: WorkflowPhase.COMPLETE,
    trigger: /complete|ready|finish/i
  },
  
  // Optimization indicators (can occur in any phase)
  {
    fromPhase: WorkflowPhase.ANALYSIS,
    toPhase: WorkflowPhase.ANALYSIS,
    trigger: /cache|fast|optim|smart/i,
    isOptimizationIndicator: true
  },
  {
    fromPhase: WorkflowPhase.CONTEXT_GATHERING,
    toPhase: WorkflowPhase.CONTEXT_GATHERING,
    trigger: /parallel|fast path|quality scoring/i,
    isOptimizationIndicator: true
  }
];

export class WorkflowStateManager {
  private state: WorkflowState;
  private listeners: Array<(state: WorkflowState) => void> = [];

  constructor() {
    this.state = {
      currentPhase: WorkflowPhase.ANALYSIS,
      processingState: ProcessingState.PREPARING,
      progress: 0,
      isOptimized: false,
      elapsedTime: 0,
      estimatedTimeRemaining: 0,
      currentMessage: '',
      startTime: Date.now()
    };
  }

  // Start workflow
  startWorkflow(): void {
    this.state = {
      currentPhase: WorkflowPhase.ANALYSIS,
      processingState: ProcessingState.PREPARING,
      progress: 5,
      isOptimized: false,
      elapsedTime: 0,
      estimatedTimeRemaining: 0,
      currentMessage: 'Starting analysis...',
      startTime: Date.now()
    };
    this.notifyListeners();
  }

  // Update workflow based on processing stage message
  updateFromStageMessage(stageMessage: string): void {
    if (!stageMessage) return;

    const wasOptimized = this.state.isOptimized;
    
    // Check for optimization indicators
    const optimizationKeywords = ['cache', 'fast', 'optim', 'smart', 'parallel', 'quality scoring'];
    const isOptimized = optimizationKeywords.some(keyword => 
      stageMessage.toLowerCase().includes(keyword)
    );

    // Find appropriate transition
    const transition = WORKFLOW_TRANSITIONS.find(t => {
      if (t.fromPhase !== this.state.currentPhase && !t.isOptimizationIndicator) {
        return false;
      }
      
      if (typeof t.trigger === 'string') {
        return stageMessage.toLowerCase().includes(t.trigger.toLowerCase());
      } else {
        return t.trigger.test(stageMessage);
      }
    });

    // Update phase if transition found
    if (transition && !transition.isOptimizationIndicator) {
      this.state.currentPhase = transition.toPhase;
    }

    // Update optimization status
    if (isOptimized || transition?.isOptimizationIndicator) {
      this.state.isOptimized = true;
    }

    // Update progress based on phase and optimization
    this.updateProgress();
    
    // Update current message
    this.state.currentMessage = stageMessage;
    
    // Update elapsed time
    this.state.elapsedTime = Math.floor((Date.now() - this.state.startTime) / 1000);
    
    // Update estimated time remaining
    this.state.estimatedTimeRemaining = getEstimatedTimeRemaining(
      this.state.currentPhase, 
      this.state.elapsedTime
    );

    this.notifyListeners();
  }

  // Update processing state
  updateProcessingState(processingState: ProcessingState): void {
    this.state.processingState = processingState;
    this.updateProgress();
    this.notifyListeners();
  }

  // Complete workflow
  completeWorkflow(): void {
    this.state.currentPhase = WorkflowPhase.COMPLETE;
    this.state.progress = 100;
    this.state.currentMessage = 'Workflow complete';
    this.notifyListeners();
  }

  // Get current state
  getCurrentState(): WorkflowState {
    return { ...this.state };
  }

  // Subscribe to state changes
  subscribe(listener: (state: WorkflowState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Private methods
  private updateProgress(): void {
    const phases = Object.values(WorkflowPhase);
    const currentIndex = phases.indexOf(this.state.currentPhase);
    
    if (currentIndex === -1) {
      this.state.progress = 0;
      return;
    }

    // Base progress from phase
    let baseProgress = (currentIndex / (phases.length - 1)) * 90;
    
    // Add optimization bonus
    if (this.state.isOptimized) {
      baseProgress = Math.min(95, baseProgress * 1.2);
    }
    
    // Add processing state bonus
    switch (this.state.processingState) {
      case ProcessingState.PROCESSING:
        baseProgress += 5;
        break;
      case ProcessingState.FINALIZING:
        baseProgress += 8;
        break;
      case ProcessingState.REVIEWING:
        baseProgress += 10;
        break;
    }

    this.state.progress = Math.min(95, Math.max(5, baseProgress));
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}

// Singleton instance
export const workflowStateManager = new WorkflowStateManager();
