
import { useEffect } from 'react';
import { Message } from '../ChatMessage';
import { useToast } from '@/hooks/use-toast';
import { analyzeFinancialResponse } from '@/utils/truncation';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface TruncationAnalyzerProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  retryLastQuery: () => void;
  lastInputWasChinese: boolean;
}

export const useTruncationAnalyzer = ({
  messages,
  setMessages,
  retryLastQuery,
  lastInputWasChinese
}: TruncationAnalyzerProps) => {
  const { toast } = useToast();

  // Truncation detection and handling
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        (lastMessage.role === 'assistant' || lastMessage.sender === 'bot') &&
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
};
