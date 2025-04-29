import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import APIKeyDialog from './APIKeyDialog';
import ChatContainer from './ChatContainer';
import ProcessingIndicator from './ProcessingIndicator';
import ApiConnectionStatus from './ApiConnectionStatus';
import { useChatLogic } from './useChatLogic';
import { useToast } from '@/hooks/use-toast';
import {
  analyzeFinancialResponse
} from '@/utils/truncation';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, AlertCircle, Languages } from 'lucide-react';
import { translationService } from '@/services/translation/translationService';
import { Message } from './ChatMessage';

const ChatInterface = () => {
  const { toast } = useToast();
  const {
    input,
    setInput,
    grokApiKeyInput,
    setGrokApiKeyInput,
    isGrokApiKeySet,
    messages,
    setMessages,
    isLoading,
    processingStage,
    apiKeyDialogOpen,
    setApiKeyDialogOpen,
    handleSaveApiKeys,
    handleSend,
    handleKeyDown,
    retryLastQuery,
    isBatching,
    currentBatchNumber,
    handleContinueBatch,
    autoBatch
  } = useChatLogic();

  const [lastInputWasChinese, setLastInputWasChinese] = useState(false);
  const [translatingMessageIds, setTranslatingMessageIds] = useState<string[]>([]);
  const translationInProgressRef = useRef(false);

  // Check if input contains Chinese characters
  const handleSendWithCheck = () => {
    const containsChinese = /[\u4e00-\u9fa5]/.test(input);
    setLastInputWasChinese(containsChinese);
    handleSend();
  };

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
            
            // Create a temporary message with an indicator that translation is in progress
            const messagesWithTranslating = [...messages];
            const translatingIndex = messagesWithTranslating.length - 1;
            
            // Store original content before updating
            const originalContent = lastMessage.content;
            
            // Show toast to indicate translation is in progress
            toast({
              title: "正在翻译",
              description: "正在将回复翻译成中文，请稍候...",
              duration: 5000,
            });
            
            // Translate the content
            console.log('Calling translation service...');
            const translatedResponse = await translationService.translateContent({
              content: lastMessage.content,
              sourceLanguage: 'en',
              targetLanguage: 'zh'
            });
            
            // Remove this message ID from the translating list
            setTranslatingMessageIds(prev => prev.filter(id => id !== lastMessage.id));
            
            // Create a new array with the translated message
            const finalMessages = [...messages];
            finalMessages[finalMessages.length - 1] = {
              ...lastMessage,
              content: translatedResponse.text,
              isTranslated: true,
              originalContent: originalContent
            };
            
            // Update messages state with translated content
            setMessages(finalMessages);
            
            console.log(`Translation complete for message ${lastMessage.id}`);
            
            // Show completion toast
            toast({
              title: "翻译完成",
              description: "您可以点击消息底部的按钮切换查看原文或翻译版本",
              duration: 5000,
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
            
            // Mark as translated even if there was an error to prevent infinite loops
            const updatedMessages = [...messages];
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              isTranslated: true // Prevent further translation attempts
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
  }, [messages, isLoading, lastInputWasChinese, setMessages, toast]);

  // Truncation detection and handling
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.sender === 'bot' &&
        lastMessage.content &&
        !lastMessage.isTruncated
      ) {
        const content = lastMessage.content;
        const queryType = lastMessage.queryType || '';
        const financialAnalysis = analyzeFinancialResponse(content, queryType);
        const isTruncated = financialAnalysis.isComplete === false;
        if (isTruncated) {
          console.log('Response appears incomplete:', {
            financialAnalysis: financialAnalysis.missingElements
          });
          const updatedMessages = [...messages];
          updatedMessages[updatedMessages.length - 1].isTruncated = true;
          setMessages(updatedMessages);

          toast({
            title: lastInputWasChinese ? "回复不完整" : "Incomplete Response",
            description: lastInputWasChinese 
              ? "回复似乎被截断了。您可以重试您的查询以获取完整答案。" 
              : "The response appears to have been cut off. You can retry your query to get a complete answer.",
            duration: 15000,
            action: <Button
              onClick={retryLastQuery}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 bg-finance-light-blue/20 hover:bg-finance-light-blue/40 text-finance-dark-blue hover:text-finance-dark-blue"
            >
              <RefreshCw size={14} />
              {lastInputWasChinese ? "重试查询" : "Retry query"}
            </Button>
          });
        }
      }
    }
  }, [messages, toast, retryLastQuery, setMessages, lastInputWasChinese]);

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex-1">
        <ApiConnectionStatus onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)} />

        <div className="flex-1 flex flex-col">
          {isLoading && <ProcessingIndicator isVisible={true} stage={processingStage} />}

          {isLoading && processingStage === 'reviewing' && (
            <div className="flex items-center justify-center mb-2 gap-2 text-xs text-finance-medium-blue dark:text-finance-light-blue">
              <Database size={14} className="animate-pulse" />
              <span className="font-medium">Reviewing database for accurate information...</span>
              <span className="text-[10px] bg-finance-light-blue/20 dark:bg-finance-medium-blue/30 px-1.5 py-0.5 rounded-full">
                Consulting HK regulatory database
              </span>
            </div>
          )}

          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            isGrokApiKeySet={isGrokApiKeySet}
            input={input}
            setInput={setInput}
            handleSend={handleSendWithCheck}
            handleKeyDown={handleKeyDown}
            onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)}
            retryLastQuery={retryLastQuery}
            translatingMessageIds={translatingMessageIds}
          />

          {isBatching && !autoBatch && (
            <div className="flex justify-center my-4">
              <Button
                variant="default"
                className="flex items-center gap-2 bg-finance-accent-blue text-white"
                onClick={handleContinueBatch}
              >
                <RefreshCw size={16} /> {lastInputWasChinese ? `继续下一部分 (第 ${currentBatchNumber + 1} 部分)` : `Continue to Next Part (Part ${currentBatchNumber + 1})`}
              </Button>
            </div>
          )}
        </div>
      </div>

      <APIKeyDialog
        open={apiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
        grokApiKeyInput={grokApiKeyInput}
        setGrokApiKeyInput={setGrokApiKeyInput}
        onSave={handleSaveApiKeys}
      />
    </div>
  );
};

export default ChatInterface;
