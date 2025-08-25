
import { Message } from '../../ChatMessage';
import { responseStreamingService } from '@/services/response/streaming/responseStreamingService';
import { htmlFormatter } from '@/services/response/modules/htmlFormatter';

interface StreamingHandlerProps {
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const useStreamingHandler = ({ setMessages }: StreamingHandlerProps) => {
  const createStreamingResponse = (initialContent: string, assistantMessageId: string) => {
    const streamingResponse = responseStreamingService.createStreamingResponse(initialContent);
    
    // Update UI with streaming content
    streamingResponse.onUpdate((content) => {
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const assistantIndex = newMessages.findIndex(m => m.id === assistantMessageId);
        if (assistantIndex !== -1) {
          newMessages[assistantIndex] = {
            ...newMessages[assistantIndex],
            content: content
          };
        }
        return newMessages;
      });
    });

    return streamingResponse;
  };

  const updateStreamingContent = (streamingResponse: any, content: string) => {
    if (streamingResponse && typeof streamingResponse.setContent === 'function') {
      // Apply basic HTML formatting to eliminate markdown during streaming
      const formattedContent = htmlFormatter.applyHtmlFormatting(content);
      streamingResponse.setContent(formattedContent);
    }
  };

  const appendStreamingContent = (streamingResponse: any, content: string) => {
    if (streamingResponse && typeof streamingResponse.appendContent === 'function') {
      // Apply basic HTML formatting to eliminate markdown during streaming
      const formattedContent = htmlFormatter.applyHtmlFormatting(content);
      streamingResponse.appendContent(formattedContent);
    }
  };

  const completeStreaming = (streamingResponse: any) => {
    if (streamingResponse && typeof streamingResponse.complete === 'function') {
      streamingResponse.complete();
    }
  };

  return {
    createStreamingResponse,
    updateStreamingContent,
    appendStreamingContent,
    completeStreaming
  };
};
