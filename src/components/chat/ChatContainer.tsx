
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ChatHeader from './ChatHeader';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import { Message } from './ChatMessage';
import { translationService } from '@/services/translation/translationService';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  isGrokApiKeySet: boolean;
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onOpenApiKeyDialog: () => void;
  retryLastQuery?: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  isGrokApiKeySet,
  input,
  setInput,
  handleSend,
  handleKeyDown,
  onOpenApiKeyDialog,
  retryLastQuery
}) => {
  const handleTranslatedSend = async () => {
    if (!input.trim()) return;
    
    // Check if input contains Chinese characters
    const containsChinese = /[\u4e00-\u9fa5]/.test(input);
    
    if (containsChinese) {
      try {
        // Translate Chinese to English
        const translatedInput = await translationService.translateContent({
          content: input,
          sourceLanguage: 'zh',
          targetLanguage: 'en'
        });
        
        // Store original input for reference
        const originalInput = input;
        
        // Set translated input and trigger send
        setInput(translatedInput.text);
        await handleSend();
        
        // Restore original input
        setInput(originalInput);
      } catch (error) {
        console.error('Translation error:', error);
        handleSend(); // Fallback to original behavior
      }
    } else {
      handleSend();
    }
  };

  return (
    <Card className="finance-card h-full flex flex-col">
      <ChatHeader 
        isGrokApiKeySet={isGrokApiKeySet} 
        onOpenApiKeyDialog={onOpenApiKeyDialog} 
      />
      <CardContent 
        className="flex-1 p-0 overflow-auto max-h-[calc(100vh-25rem)] md:max-h-[calc(100vh-20rem)] min-h-[400px] flex flex-col"
      >
        <ChatHistory 
          messages={messages} 
          isLoading={isLoading} 
          onRetry={retryLastQuery}
        />
      </CardContent>
      <ChatInput 
        input={input}
        setInput={setInput}
        handleSend={handleTranslatedSend}
        isLoading={isLoading}
        isGrokApiKeySet={isGrokApiKeySet}
        onOpenApiKeyDialog={onOpenApiKeyDialog}
        handleKeyDown={handleKeyDown}
      />
    </Card>
  );
};

export default ChatContainer;
