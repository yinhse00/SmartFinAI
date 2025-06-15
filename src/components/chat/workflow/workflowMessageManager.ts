
/**
 * Dynamic workflow message manager
 * Generates contextual messages based on workflow state and processing context
 */

import { WorkflowPhase, getStageMessages, getStageMessagesZh } from './workflowConfig';

export interface MessageContext {
  isOptimized: boolean;
  isChinese: boolean;
  queryType?: string;
  hasContext?: boolean;
  elapsedTime: number;
}

export class WorkflowMessageManager {
  private messageHistory: string[] = [];
  private lastMessageTime: number = 0;

  // Get dynamic message for current workflow phase with enhanced bold formatting
  getDynamicMessage(
    phase: WorkflowPhase,
    context: MessageContext,
    customMessage?: string
  ): string {
    // Use custom message if provided and relevant, with bold enhancement
    if (customMessage && this.isRelevantMessage(customMessage, phase, context)) {
      const enhancedMessage = this.enhanceMessageWithBold(customMessage, context);
      this.addToHistory(enhancedMessage);
      return enhancedMessage;
    }

    // Get appropriate messages for phase
    const messages = context.isChinese 
      ? getStageMessagesZh(phase, context.isOptimized)
      : getStageMessages(phase, context.isOptimized);

    // Select message based on context and avoid repetition
    const selectedMessage = this.selectContextualMessage(messages, context, phase);
    
    this.addToHistory(selectedMessage);
    return selectedMessage;
  }

  // Generate progress description with bold formatting
  getProgressDescription(
    phase: WorkflowPhase,
    progress: number,
    context: MessageContext
  ): string {
    const progressPercent = Math.round(progress);
    
    if (context.isChinese) {
      return this.getProgressDescriptionZh(phase, progressPercent, context);
    }

    // Generate contextual progress description with bold formatting
    let description = `**${progressPercent}%** complete`;
    
    if (context.isOptimized) {
      description += ' **(Optimized)**';
    }
    
    if (context.elapsedTime > 0) {
      description += ` • **${context.elapsedTime}s** elapsed`;
    }

    return description;
  }

  // Generate time estimate with bold formatting
  getTimeEstimate(estimatedTimeRemaining: number, context: MessageContext): string {
    if (estimatedTimeRemaining <= 0) {
      return context.isChinese ? '**即将完成**' : '**Almost complete**';
    }

    const minutes = Math.floor(estimatedTimeRemaining / 60);
    const seconds = estimatedTimeRemaining % 60;

    if (context.isChinese) {
      if (minutes > 0) {
        return `预计还需 **${minutes}分${seconds}秒**`;
      }
      return `预计还需 **${seconds}秒**`;
    }

    if (minutes > 0) {
      return `**~${minutes}m ${seconds}s** remaining`;
    }
    return `**~${seconds}s** remaining`;
  }

  // Clear message history
  clearHistory(): void {
    this.messageHistory = [];
    this.lastMessageTime = 0;
  }

  // Private methods
  private isRelevantMessage(message: string, phase: WorkflowPhase, context: MessageContext): boolean {
    const messageLower = message.toLowerCase();
    
    // Check if message is relevant to current phase
    switch (phase) {
      case WorkflowPhase.ANALYSIS:
        return /analyz|check|prepar|cache|strateg/i.test(message);
      case WorkflowPhase.CONTEXT_GATHERING:
        return /gather|search|retriev|context|databas|rule|guidance/i.test(message);
      case WorkflowPhase.INTELLIGENT_PROCESSING:
        return /process|intelligent|pattern|synthesis|algorithm/i.test(message);
      case WorkflowPhase.RESPONSE_GENERATION:
        return /generat|format|compil|response|final/i.test(message);
      case WorkflowPhase.VALIDATION:
        return /validat|check|verify|quality|accura/i.test(message);
      default:
        return true;
    }
  }

  private selectContextualMessage(
    messages: string[],
    context: MessageContext,
    phase: WorkflowPhase
  ): string {
    // Avoid recent messages to prevent repetition
    const availableMessages = messages.filter(msg => 
      !this.messageHistory.slice(-2).includes(msg)
    );

    if (availableMessages.length === 0) {
      // If all messages were recent, use the first one
      return messages[0] || 'Processing...';
    }

    // Select based on elapsed time and context
    let selectedIndex = 0;
    
    if (context.elapsedTime > 10) {
      // For longer processing, use later messages in the array
      selectedIndex = Math.min(
        availableMessages.length - 1,
        Math.floor(context.elapsedTime / 5)
      );
    }

    return availableMessages[selectedIndex];
  }

  private enhanceMessageWithBold(message: string, context: MessageContext): string {
    // Enhance custom messages with strategic bold formatting
    let enhanced = message;
    
    // Add bold to key action words
    const actionWords = [
      'analyzing', 'processing', 'generating', 'gathering', 'searching', 'checking',
      'retrieving', 'formatting', 'validating', 'preparing', 'completing',
      'optimizing', 'enhancing', 'finalizing'
    ];
    
    actionWords.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      enhanced = enhanced.replace(regex, '**$1**');
    });
    
    // Add bold to important nouns
    const importantNouns = [
      'regulatory', 'context', 'database', 'rules', 'requirements', 'provisions',
      'guidance', 'response', 'analysis', 'quality', 'accuracy'
    ];
    
    importantNouns.forEach(noun => {
      const regex = new RegExp(`\\b(${noun})\\b`, 'gi');
      enhanced = enhanced.replace(regex, '**$1**');
    });
    
    return enhanced;
  }

  private getProgressDescriptionZh(
    phase: WorkflowPhase,
    progressPercent: number,
    context: MessageContext
  ): string {
    let description = `**${progressPercent}%** 完成`;
    
    if (context.isOptimized) {
      description += ' **(优化模式)**';
    }
    
    if (context.elapsedTime > 0) {
      description += ` • 已用时 **${context.elapsedTime}秒**`;
    }

    return description;
  }

  private addToHistory(message: string): void {
    this.messageHistory.push(message);
    
    // Keep only recent messages
    if (this.messageHistory.length > 10) {
      this.messageHistory = this.messageHistory.slice(-10);
    }
    
    this.lastMessageTime = Date.now();
  }
}

// Singleton instance
export const workflowMessageManager = new WorkflowMessageManager();
