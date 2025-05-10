
import React, { useEffect, useRef } from 'react';
import { X, AlignLeft, AlignRight, AlignCenter, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { detectAndFormatTables } from '@/utils/tableFormatter';
import { cn } from '@/lib/utils';
import '@/styles/presentation.css';

interface PresentationViewProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

const PresentationView: React.FC<PresentationViewProps> = ({ 
  content, 
  isOpen, 
  onClose,
  onToggleFullscreen,
  isFullscreen
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Apply text alignment based on markers in content
  const processTextAlignment = (text: string) => {
    // Replace alignment markers with proper HTML
    let processed = text.replace(/\[align-left\](.*?)\[\/align-left\]/gs, '<div class="text-left">$1</div>');
    processed = processed.replace(/\[align-right\](.*?)\[\/align-right\]/gs, '<div class="text-right">$1</div>');
    processed = processed.replace(/\[align-center\](.*?)\[\/align-center\]/gs, '<div class="text-center">$1</div>');
    
    return processed;
  };
  
  // Process content to handle tables and text alignment
  const processContent = () => {
    if (!content) return '';
    
    // First detect and format any tables
    const withTables = detectAndFormatTables(content);
    
    // Then process text alignment
    return processTextAlignment(withTables);
  };

  // Handle escape key to exit presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-white dark:bg-gray-900 z-50 transition-all duration-300",
        isFullscreen ? "p-0" : "p-4"
      )}
    >
      {/* Header with controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Presentation View</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(content)}>
              Copy Text
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </Button>
          </div>
          <Button variant="outline" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Content area */}
      <div 
        ref={containerRef}
        className={cn(
          "presentation-content overflow-auto",
          isFullscreen ? "pt-16 pb-4 px-4" : "mt-16 p-4", 
          "max-h-full"
        )}
        dangerouslySetInnerHTML={{ __html: processContent() }}
      />
    </div>
  );
};

export default PresentationView;
