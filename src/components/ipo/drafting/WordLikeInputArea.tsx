import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { WordLikeEditor } from '@/components/ipo/word-like/WordLikeEditor';
import { getEnhancedSectionTemplate } from '@/services/ipo/enhancedSectionTemplates';

interface KeyElements {
  [key: string]: any;
}

interface WordLikeInputAreaProps {
  projectId: string;
  sectionType: string;
  keyElements: KeyElements;
  setKeyElements: (elements: KeyElements) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

export const WordLikeInputArea: React.FC<WordLikeInputAreaProps> = ({
  projectId,
  sectionType,
  keyElements,
  setKeyElements,
  isGenerating,
  onGenerate
}) => {
  const [content, setContent] = useState('');

  // Load section template when section changes
  useEffect(() => {
    const template = getEnhancedSectionTemplate(sectionType);
    if (template) {
      const templateContent = `
        <h1>${template.title}</h1>
        <div class="template-requirements">
          <h3>Requirements:</h3>
          <ul>
            ${template.requirements.map(req => `<li>${req}</li>`).join('')}
          </ul>
        </div>
        
        <div class="content-area">
          <p><em>Please start typing your content here. The AI will enhance and expand based on what you provide...</em></p>
          
          ${template.tabularElements && template.tabularElements.length > 0 ? `
            <h3>Required Tables/Elements:</h3>
            <ul>
              ${template.tabularElements.map(el => `<li>${el}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;
      setContent(templateContent);
    }
  }, [sectionType]);

  // Update keyElements when content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setKeyElements({
      ...keyElements,
      content: newContent
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Word-like Editor */}
      <div className="flex-1">
        <WordLikeEditor
          content={content}
          onChange={handleContentChange}
          viewMode="print"
          sectionType={sectionType}
        />
      </div>

      {/* Generate Button */}
      <div className="p-4 border-t bg-background">
        <Button 
          className="w-full" 
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {isGenerating ? 'Generating...' : 'Generate First Draft'}
        </Button>
      </div>
    </div>
  );
};