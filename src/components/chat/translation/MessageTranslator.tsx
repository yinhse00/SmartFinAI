
import { useState, useEffect, useRef } from 'react';
import { Message } from '../ChatMessage';
import { translationService } from '@/services/translation/translationService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

interface MessageTranslatorProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  lastInputWasChinese: boolean;
  isTraditionalChinese?: boolean;
  isLoading: boolean;
}

export const useMessageTranslator = ({
  messages,
  setMessages,
  lastInputWasChinese,
  isTraditionalChinese = false,
  isLoading
}: MessageTranslatorProps) => {
  const [translatingMessageIds, setTranslatingMessageIds] = useState<string[]>([]);
  const translationInProgressRef = useRef(false);
  const { toast } = useToast();

  // Handle translation of responses for Chinese input
  useEffect(() => {
    const processLatestMessage = async () => {
      // If already processing a translation, skip
      if (translationInProgressRef.current || isLoading) {
        return;
      }
      
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        
        // Only translate if:
        // 1. The message is from the bot
        // 2. There's content
        // 3. The last input was Chinese
        // 4. The message is not already translated
        // 5. The message is not currently being translated
        if (
          lastMessage.sender === 'bot' &&
          lastMessage.content &&
          lastInputWasChinese &&
          !lastMessage.isTranslated && 
          !translatingMessageIds.includes(lastMessage.id)
        ) {
          try {
            console.log(`Starting translation for message ${lastMessage.id}`);
            
            // Set the translation flag to prevent multiple translation attempts
            translationInProgressRef.current = true;
            
            // Mark this message as being translated
            setTranslatingMessageIds(prev => [...prev, lastMessage.id]);
            
            // Show translation in progress in the UI - but do this sooner to improve UX
            const messagesWithTranslating = [...messages];
            const translatingIndex = messagesWithTranslating.length - 1;
            
            // Store original content before updating
            const originalContent = lastMessage.content;
            
            // Start translation process immediately in UI
            messagesWithTranslating[translatingIndex] = {
              ...lastMessage,
              translationInProgress: true
            };
            
            setMessages(messagesWithTranslating);
            
            // Choose which Chinese variant to use for the translation
            const targetLanguage = isTraditionalChinese ? 'zh-TW' : 'zh-CN';
            
            // Show minimal toast to indicate translation is in progress
            toast({
              title: "正在翻译",
              description: "正在将回复翻译成中文...",
              duration: 3000,
            });
            
            // Translate the content - use Promise.race with a small delay to show partial results
            console.log(`Calling translation service for ${targetLanguage}...`);
            
            // Implementation of progressive translation display
            const fullTranslation = translationService.translateContent({
              content: lastMessage.content,
              sourceLanguage: 'en',
              targetLanguage: targetLanguage
            });
            
            // Get the actual translation
            const translatedResponse = await fullTranslation;
            
            // Remove this message ID from the translating list
            setTranslatingMessageIds(prev => prev.filter(id => id !== lastMessage.id));
            
            // Create a new array with the translated message
            const finalMessages = [...messages];
            finalMessages[finalMessages.length - 1] = {
              ...lastMessage,
              content: translatedResponse.text,
              isTranslated: true,
              originalContent: originalContent,
              translationInProgress: false
            };
            
            // Update messages state with translated content
            setMessages(finalMessages);
            
            console.log(`Translation complete for message ${lastMessage.id}`);
            
            // Show completion toast with language toggle option
            toast({
              title: "翻译完成",
              description: "您可以点击消息底部的按钮切换查看原文或翻译版本",
              duration: 4000,
              action: (
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Languages size={14} />
                </Button>
              )
            });
          } catch (error) {
            console.error('Translation error:', error);
            
            // Show error toast
            toast({
              title: "翻译错误",
              description: "无法完成翻译，请稍后再试。",
              variant: "destructive"
            });
            
            // Remove from translating list even if there was an error
            setTranslatingMessageIds(prev => prev.filter(id => id !== lastMessage.id));
            
            // Update the message to remove the translation in progress state
            const updatedMessages = [...messages];
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              isTranslated: true, // Prevent further translation attempts
              translationInProgress: false
            };
            setMessages(updatedMessages);
          } finally {
            // Reset the translation flag
            translationInProgressRef.current = false;
          }
        }
      }
    };

    // Only run translation when not loading
    if (!isLoading) {
      processLatestMessage();
    }
  }, [messages, isLoading, lastInputWasChinese, setMessages, toast, isTraditionalChinese]);

  return { translatingMessageIds };
};
