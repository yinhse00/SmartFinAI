
import React, { useState } from 'react';
import detectAndFormatTables from '@/utils/tableFormatter';
import TypingAnimation from '../TypingAnimation';
import { analyzeContentForCharts, ChartData } from '@/utils/chartParser';
import RegulatoryFlowChart from '@/components/charts/RegulatoryFlowChart';
import TimelineChart from '@/components/charts/TimelineChart';
import DecisionTree from '@/components/charts/DecisionTree';
import { Button } from '@/components/ui/button';
import { BarChart3, FileText } from 'lucide-react';

interface MessageContentProps {
  content: string;
  isUserMessage: boolean;
  isBot: boolean;
  isTypingComplete: boolean;
  isTranslating: boolean;
  translationInProgress: boolean;
  formattedContent: string;
  onTypingComplete: () => void;
  onTypingProgress: () => void;
  getInitialVisibleChars: () => number;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  isUserMessage,
  isBot,
  isTypingComplete,
  isTranslating,
  translationInProgress,
  formattedContent,
  onTypingComplete,
  onTypingProgress,
  getInitialVisibleChars
}) => {
  const [viewMode, setViewMode] = useState<'text' | 'chart'>('text');
  const [chartData, setChartData] = useState<ChartData | null>(null);

  // Analyze content for charts when typing is complete
  React.useEffect(() => {
    if (isBot && isTypingComplete && !isTranslating && !translationInProgress && content) {
      const analyzed = analyzeContentForCharts(content);
      if (analyzed.type !== 'none') {
        setChartData(analyzed);
        // Auto-switch to chart view if chart data is available
        setViewMode('chart');
      }
    }
  }, [isBot, isTypingComplete, isTranslating, translationInProgress, content]);

  const renderChart = () => {
    if (!chartData || chartData.type === 'none') return null;

    switch (chartData.type) {
      case 'timeline':
        return <TimelineChart events={chartData.data} title={chartData.title} />;
      case 'flowchart':
        return <RegulatoryFlowChart data={chartData.data} />;
      case 'decision-tree':
        return <DecisionTree data={chartData.data} title={chartData.title} />;
      default:
        return null;
    }
  };

  // Bot message content with enhanced typing animation
  if (isBot && !isTypingComplete && !isTranslating && !translationInProgress) {
    return (
      <TypingAnimation 
        text={formattedContent} 
        className="whitespace-pre-line text-left chat-content" 
        onComplete={onTypingComplete} 
        onProgress={onTypingProgress}
        renderAsHTML={true}
        initialVisibleChars={getInitialVisibleChars()}
      />
    );
  }
  
  // User message content or bot message when translation is in progress or typing is complete
  if (isUserMessage || isTranslating || translationInProgress || (isBot && isTypingComplete)) {
    return (
      <div className={`${isUserMessage ? 'text-right' : 'text-left'} ${isBot ? 'chat-content' : ''}`}>
        {/* View toggle buttons for bot messages with chart data */}
        {isBot && chartData && chartData.type !== 'none' && !isTranslating && !translationInProgress && (
          <div className="flex gap-2 mb-3">
            <Button
              variant={viewMode === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('text')}
              className="text-xs"
            >
              <FileText size={14} className="mr-1" />
              Text
            </Button>
            <Button
              variant={viewMode === 'chart' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('chart')}
              className="text-xs"
            >
              <BarChart3 size={14} className="mr-1" />
              Chart
            </Button>
          </div>
        )}

        {/* Content rendering based on view mode */}
        {viewMode === 'chart' && chartData && chartData.type !== 'none' ? (
          <div className="mb-4">
            {renderChart()}
            {/* Show text content below chart */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Text Summary:</div>
              <div className="text-sm opacity-80" dangerouslySetInnerHTML={{ __html: formattedContent }} />
            </div>
          </div>
        ) : (
          <>
            {translationInProgress && isBot ? (
              <div className="flex flex-col gap-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">正在翻译中...</div>
                <div className="opacity-60" dangerouslySetInnerHTML={{ __html: formattedContent }} />
              </div>
            ) : isUserMessage ? (
              <div className="whitespace-pre-line">{formattedContent}</div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
            )}
          </>
        )}
      </div>
    );
  }
  
  return null;
};
