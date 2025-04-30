
import { Message } from '../../ChatMessage';
import { executeStep5 } from './step5Response';

/**
 * Legacy wrapper function to maintain backward compatibility
 * @deprecated Use executeStep5 instead
 */
export const executeResponse = async (
  params: any, 
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setStepProgress: React.Dispatch<React.SetStateAction<string>>,
  shouldTranslateToChineseResponse: boolean
) => {
  console.warn('executeResponse is deprecated, use executeStep5 directly');
  
  const result = await executeStep5(params, setStepProgress, shouldTranslateToChineseResponse);
  
  // Handle messages if needed
  if (result.completed && result.response) {
    const botMessage: Message = {
      id: Date.now().toString(),
      content: result.requiresTranslation && result.translatedResponse ? 
        result.translatedResponse : result.response,
      sender: 'bot',
      timestamp: new Date(),
      metadata: result.metadata,
      originalLanguage: result.requiresTranslation ? 'zh' : undefined
    };
    
    setMessages(prev => [...prev, botMessage]);
  }
  
  return result;
};
