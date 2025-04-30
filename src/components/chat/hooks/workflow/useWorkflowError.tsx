
import { Message } from '../../ChatMessage';

export const useWorkflowError = () => {
  // Handle error cases in workflow execution
  const handleWorkflowError = (
    error: any, 
    errorCount: number, 
    updatedMessages: Message[]
  ): Message => {
    console.error('Workflow execution error:', error);
    
    // Create error message based on error count
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: errorCount >= 2 
        ? "I encountered multiple errors processing your request. I'll use a simplified approach to answer your question."
        : "I apologize, but I had trouble processing your request. Could you try rephrasing your question?",
      sender: 'bot',
      timestamp: new Date(),
      isError: true
    };
    
    return errorMessage;
  };
  
  return {
    handleWorkflowError
  };
};
