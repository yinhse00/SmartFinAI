
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
  
  // Add proper console logging for debugging
  console.log('Processing query params:', {
    queryType: params.queryType,
    query: params.query,
    shouldTranslate: shouldTranslateToChineseResponse
  });
  
  // Handle special cases for rights issue timetable
  if (params.query?.toLowerCase().includes('rights issue') && 
      (params.query?.toLowerCase().includes('timetable') || params.query?.toLowerCase().includes('timeline'))) {
    console.log('Detected rights issue timetable query - applying special handling');
    
    // Ensure we have the executionContext field set for timetable queries
    if (!params.executionContext && !params.error) {
      console.log('Adding fallback execution context for rights issue timetable');
      // Add specialized context for rights issue timetables
      params.executionContext = "Rights issue timetable requires shareholders' approval when they would increase issued shares by more than 50% (Rule 7.19A). The standard timetable includes Last Cum-Rights Trading Day (T-2), Ex-Rights Date (T-1), Record Date (T), PAL Dispatch (T+5), Nil-Paid Rights Trading Start (T+6), Nil-Paid Rights Trading End (T+10), Latest Acceptance Date (T+14), and New Shares Listing (T+21).";
    }
  }
  
  const result = await executeStep5(params, setStepProgress, shouldTranslateToChineseResponse);
  
  // Enhanced error handling
  if (!result.completed) {
    console.error('Response generation failed:', result.error);
    
    const errorMessage: Message = {
      id: Date.now().toString(),
      content: "I'm sorry, but I couldn't process your request about " + params.query + ". Please try again or rephrase your question.",
      sender: 'bot',
      timestamp: new Date(),
      isError: true
    };
    
    setMessages(prev => [...prev, errorMessage]);
    return result;
  }
  
  // Handle messages if response is available
  if (result.completed && result.response) {
    const botMessage: Message = {
      id: Date.now().toString(),
      content: result.requiresTranslation && result.translatedResponse ? 
        result.translatedResponse : result.response,
      sender: 'bot',
      timestamp: new Date(),
      metadata: result.metadata,
      originalLanguage: result.requiresTranslation ? 'zh' : undefined,
      isTruncated: result.isTruncated || false,
      queryType: params.queryType || 'general',
      references: result.references || [],
      isUsingFallback: !!result.isUsingFallback,
      reasoning: result.reasoning || params.reasoning || '',
      isBatchPart: result.isBatchPart || false,
      isTranslated: result.requiresTranslation || false,
      originalContent: result.requiresTranslation ? result.response : undefined
    };
    
    console.log('Adding bot message to chat:', {
      messageId: botMessage.id,
      isTruncated: botMessage.isTruncated,
      isTranslated: botMessage.isTranslated
    });
    
    setMessages(prev => [...prev, botMessage]);
  }
  
  return result;
};
