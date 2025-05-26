
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  metadata?: {
    financialQueryType?: string;
    reasoning?: string;
    processingTime?: number;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    isTruncated?: boolean;
    isError?: boolean;
    validation?: {
      isValid: boolean;
      vettingConsistency: boolean;
      guidanceConsistency: boolean;
      validationNotes: string[];
      confidence: number;
    };
    vettingRequired?: boolean;
    vettingCategory?: string;
    relevantGuidance?: number;
    guidanceTypes?: string[];
  };
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRetry,
  onTypingProgress,
  isTranslating = false
}) => {
  const {
    sender,
    content,
    references,
    isError,
    isUsingFallback,
    reasoning,
    queryType,
    isTruncated,
    isBatchPart,
    originalContent,
    translationInProgress,
    id
  } = message;
  
  const [isTypingComplete, setIsTypingComplete] = useState(sender === 'user');
  const [showOriginal, setShowOriginal] = useState(false);
  const [formattedContent, setFormattedContent] = useState('');
  
  // Determine initial characters to display immediately for the typing effect
  const getInitialVisibleChars = () => {
    if (sender !== 'bot') return 0;
    
    // For batch parts, show more initial content for better UX
    if (isBatchPart) return 120;
    
    // For regular messages, show the first sentence or first 60 chars
    const firstSentenceMatch = content?.match(/^([^.!?]+[.!?])\s/);
    if (firstSentenceMatch && firstSentenceMatch[1].length < 100) {
      return firstSentenceMatch[1].length;
    }
    return 60;
  };

  // Debug output for empty content detection
  useEffect(() => {
    if (sender === 'bot' && (!content || content.trim() === '')) {
      console.error(`Empty message content detected for bot message ID: ${id}`, message);
    }
  }, [id, sender, content, message]);

  // Process content when message changes or when toggling between original/translated
  useEffect(() => {
    // Ensure displayContent always has a value
    const safeContent = content || "";
    const displayContent = showOriginal && originalContent ? originalContent : safeContent;
    
    // Format tables and process markdown in the content
    if (sender === 'bot') {
      const formatted = detectAndFormatTables(displayContent);
      setFormattedContent(formatted);
    } else {
      // For user messages, no formatting needed
      setFormattedContent(displayContent);
    }
  }, [content, originalContent, showOriginal, sender]);

  // Only show error for empty content if it's actually an error AND processing is complete
  if ((!content || content.trim() === '') && sender === 'bot' && !isTranslating && !translationInProgress && isError) {
    return (
      <div className="flex justify-start mb-4 w-full">
        <Card className="p-3 rounded-lg bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 w-full">
          <div className="whitespace-pre-line">
            Message content is empty. There might be an issue with the response generation.
            {onRetry && (
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry} 
                  className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700"
                >
                  <RefreshCw size={12} className="mr-1" />
                  Retry query
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4 w-full`}>
      <div className={`flex items-start gap-3 w-full ${sender === 'user' ? 'flex-row-reverse' : ''}`}>
        <Card className={`p-3 rounded-lg w-full ${
          sender === 'user' 
            ? 'bg-finance-medium-blue text-white' 
            : isError 
              ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300' 
              : translationInProgress 
                ? 'bg-gray-50 dark:bg-gray-800 opacity-70' 
                : 'bg-gray-50 dark:bg-gray-800'
        } ${isBatchPart ? 'animate-fade-in' : ''}`}>
          {/* Bot message content with enhanced typing animation */}
          {sender === 'bot' && !isTypingComplete && !isTranslating && !translationInProgress && (
            <TypingAnimation 
              text={formattedContent} 
              className="whitespace-pre-line text-left chat-content" 
              onComplete={() => setIsTypingComplete(true)} 
              onProgress={onTypingProgress}
              renderAsHTML={true}
              initialVisibleChars={getInitialVisibleChars()}
            />
          )}
          
          {/* User message content or bot message when translation is in progress or typing is complete */}
          {(sender === 'user' || isTranslating || translationInProgress || (sender === 'bot' && isTypingComplete)) && (
            <div className={`${sender === 'user' ? 'text-right' : 'text-left'} ${sender === 'bot' ? 'chat-content' : ''}`}>
              {translationInProgress && sender === 'bot' ? (
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">正在翻译中...</div>
                  <div className="opacity-60" dangerouslySetInnerHTML={{ __html: formattedContent }} />
                </div>
              ) : sender === 'user' ? (
                <div className="whitespace-pre-line">{formattedContent}</div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
              )}
            </div>
          )}
          
          {/* Toggle original/translated content option for bot messages */}
          {sender === 'bot' && originalContent && isTypingComplete && !isTranslating && !translationInProgress && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowOriginal(!showOriginal)} 
                className="text-xs text-finance-medium-blue dark:text-finance-light-blue"
              >
                {showOriginal ? "查看翻译" : "View original (English)"}
              </Button>
            </div>
          )}
          
          {/* Truncated message retry button */}
          {isTruncated && sender === 'bot' && onRetry && isTypingComplete && !isTranslating && !translationInProgress && (
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry} 
                className="flex items-center text-xs bg-finance-light-blue/20 hover:bg-finance-light-blue/40 text-finance-dark-blue hover:text-finance-dark-blue"
              >
                <RefreshCw size={12} className="mr-1" />
                Continue
              </Button>
            </div>
          )}
          
          {/* References badges */}
          {references && references.length > 0 && isTypingComplete && !isTranslating && !translationInProgress && (
            <div className="mt-2 flex flex-wrap gap-1">
              {references.map((ref, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="text-xs bg-finance-light-blue/20 dark:bg-finance-medium-blue/20"
                >
                  {ref}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChatMessage;
