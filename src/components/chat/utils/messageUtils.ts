
import { Message } from '../ChatMessage';

export const getInitialVisibleChars = (message: Message, content: string, isUserMessage: boolean) => {
  if (isUserMessage) return 0;
  
  // For batch parts, show more initial content for better UX
  if (message.isBatchPart) return 120;
  
  // For regular messages, show the first sentence or first 60 chars
  const firstSentenceMatch = content?.match(/^([^.!?]+[.!?])\s/);
  if (firstSentenceMatch && firstSentenceMatch[1].length < 100) {
    return firstSentenceMatch[1].length;
  }
  return 60;
};

export const getCardClassName = (
  isUserMessage: boolean,
  isError: boolean,
  translationInProgress: boolean,
  isBatchPart: boolean
) => {
  const baseClasses = "p-3 rounded-lg w-full";
  
  if (isUserMessage) {
    return `${baseClasses} bg-finance-medium-blue text-white`;
  }
  
  if (isError) {
    return `${baseClasses} bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300`;
  }
  
  if (translationInProgress) {
    return `${baseClasses} bg-gray-50 dark:bg-gray-800 opacity-70`;
  }
  
  const batchClass = isBatchPart ? ' animate-fade-in' : '';
  return `${baseClasses} bg-gray-50 dark:bg-gray-800${batchClass}`;
};
