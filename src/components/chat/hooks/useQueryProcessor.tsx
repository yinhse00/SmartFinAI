import { useEffect, useRef, useState } from 'react';
import { useRetryHandler } from './useRetryHandler';
import { useQueryExecution } from './useQueryExecution';
import { useQueryInputHandler } from './useQueryInputHandler';
import { Message } from '../ChatMessage';
import { isChineseText } from '@/utils/translation/languageDetector';
import { translationService } from '@/services/translation/translationService';

export const useQueryProcessor = (
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  input: string,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  lastQuery: string,
  setLastQuery: React.Dispatch<React.SetStateAction<string>>,
  isGrokApiKeySet: boolean,
  setApiKeyDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { retryLastQuery, setProcessQueryFn } = useRetryHandler(lastQuery, setInput);
  const { isLoading, processQuery: executeQuery, processingStage } = useQueryExecution(
    messages,
    setMessages,
    setLastQuery,
    setInput,
    retryLastQuery,
    isGrokApiKeySet,
    setApiKeyDialogOpen
  );

  const batchNumber = useRef(1);
  const [isBatching, setIsBatching] = useState(false);
  const [batchingPrompt, setBatchingPrompt] = useState<string | null>(null);
  const [autoBatch, setAutoBatch] = useState(true);

  const MAX_AUTO_BATCHES = 4;

  const processQuery = async (queryText: string, options: { isBatchContinuation?: boolean, autoBatch?: boolean } = {}) => {
    let prompt = queryText;
    const isBatchContinuation = options.isBatchContinuation || false;
    const autoBatchMode = options.autoBatch ?? autoBatch;

    if (isChineseText(queryText)) {
      console.log('Chinese text detected, translating to English');
      let originalLanguage: 'en' | 'zh' = 'en';
      try {
        const translatedQuery = await translationService.translateContent({
          content: queryText,
          sourceLanguage: 'zh',
          targetLanguage: 'en'
        });
        prompt = translatedQuery.text;
        console.log('Translated query:', prompt);
      } catch (error) {
        console.error('Translation error:', error);
        prompt = queryText;
      }
    }

    if (isBatchContinuation && batchNumber.current > 1) {
      prompt = `${prompt} [CONTINUE_BATCH_PART ${batchNumber.current}] Please continue the previous answer immediately after the last word, avoiding unnecessary repetition or summary.`;
    }

    if (!isBatchContinuation) {
      setBatchingPrompt(queryText);
      batchNumber.current = 1;
      setIsBatching(false);
      setAutoBatch(autoBatchMode);
    }

    const batchInfo = isBatchContinuation
      ? { batchNumber: batchNumber.current, isContinuing: true }
      : undefined;

    const setMessagesWithTranslation = async (msgs: Message[]) => {
      if (originalLanguage === 'zh') {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && lastMsg.sender === 'bot') {
          try {
            const translatedResponse = await translationService.translateContent({
              content: lastMsg.content,
              sourceLanguage: 'en',
              targetLanguage: 'zh'
            });
            
            const translatedMsgs = msgs.map((msg, index) => 
              index === msgs.length - 1 
                ? { ...msg, content: translatedResponse.text }
                : msg
            );
            
            setMessages(translatedMsgs);
            return;
          } catch (error) {
            console.error('Translation error:', error);
          }
        }
      }
      setMessages(msgs);
    };

    let truncatedLastPart = false;

    await executeQuery(
      prompt,
      batchInfo,
      async (truncated: boolean) => {
        truncatedLastPart = truncated;
        if (truncated && autoBatchMode && batchNumber.current < MAX_AUTO_BATCHES) {
          setIsBatching(true);
          setTimeout(() => {
            batchNumber.current += 1;
            processQuery(queryText, { isBatchContinuation: true, autoBatch: autoBatchMode });
          }, 750);
        } else if (truncated) {
          setIsBatching(true);
        } else {
          setIsBatching(false);
        }
      },
      setMessagesWithTranslation
    );
  };

  const { handleSend, handleKeyDown } = useQueryInputHandler(
    (q, opt = {}) => processQuery(q, { ...opt, autoBatch }), input
  );

  const handleContinueBatch = () => {
    if (batchingPrompt) {
      batchNumber.current += 1;
      processQuery(batchingPrompt, { isBatchContinuation: true, autoBatch });
    }
  };

  useEffect(() => {
    setProcessQueryFn((query: string, opts = {}) => processQuery(query, opts));
  }, [processQuery, setProcessQueryFn]);

  return {
    isLoading,
    handleSend,
    handleKeyDown,
    processQuery,
    retryLastQuery,
    processingStage,
    isBatching,
    currentBatchNumber: batchNumber.current,
    handleContinueBatch,
    autoBatch
  };
};
