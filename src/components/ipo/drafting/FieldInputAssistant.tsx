import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  FileText, 
  Copy, 
  RefreshCw,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Wand2
} from 'lucide-react';
import { EnhancedBusinessField } from '@/hooks/useEnhancedBusinessCategories';
import { cn } from '@/lib/utils';

interface FieldInputAssistantProps {
  field: EnhancedBusinessField;
  currentValue: string;
  onSuggestion: (suggestion: string) => void;
  projectId: string;
}

export const FieldInputAssistant: React.FC<FieldInputAssistantProps> = ({
  field,
  currentValue,
  onSuggestion,
  projectId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [documentSuggestions, setDocumentSuggestions] = useState<any[]>([]);

  // Mock data for demonstration - in real implementation, this would come from AI services
  const mockSuggestions = {
    'business_description': [
      'ABC Corporation is a leading technology company specializing in cloud-based enterprise solutions, founded in 2015 and incorporated in Hong Kong. We provide comprehensive software-as-a-service (SaaS) platforms that help businesses streamline their operations, improve efficiency, and reduce costs.',
      'XYZ Ltd is a vertically integrated manufacturing company established in 2010, specializing in sustainable consumer products. Our operations span from raw material sourcing to final product distribution, with facilities located in major industrial zones.',
    ],
    'competitive_advantages': [
      'Our key competitive advantages include proprietary technology platforms, strategic partnerships with industry leaders, first-mover advantage in emerging markets, and a highly experienced management team with proven track records.',
      'We maintain competitive leadership through continuous innovation, cost-effective manufacturing processes, strong brand recognition, and exclusive long-term contracts with key suppliers.',
    ],
    'business_strategies_overview': [
      'Our primary business strategies focus on market expansion through strategic acquisitions, strengthening our sales network across Asia-Pacific, vertical integration of our supply chain, and entering into long-term contracts with enterprise clients.',
      'Key strategies include digital transformation initiatives, geographic expansion into Southeast Asian markets, development of new product lines, and strategic partnerships with technology providers.',
    ]
  };

  const mockDocumentInsights = [
    {
      source: 'Business Plan 2024.pdf',
      content: 'The company operates in three main business segments: cloud infrastructure (60% of revenue), enterprise software (30%), and consulting services (10%).',
      relevance: 0.95
    },
    {
      source: 'Market Analysis Report.pdf',
      content: 'Market research indicates strong competitive positioning with 15% market share in the enterprise cloud solutions sector.',
      relevance: 0.88
    }
  ];

  const generateSuggestions = useCallback(async () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock suggestions based on field type
    const fieldSuggestions = mockSuggestions[field.id as keyof typeof mockSuggestions] || [
      `Professional content suggestion for ${field.label.toLowerCase()}. This would be generated based on industry best practices, regulatory requirements, and similar successful IPO prospectuses.`,
      `Alternative professional suggestion for ${field.label.toLowerCase()} that demonstrates compliance with HKEX requirements while highlighting unique business strengths.`
    ];
    
    setSuggestions(fieldSuggestions);
    setDocumentSuggestions(mockDocumentInsights);
    setIsGenerating(false);
  }, [field.id, field.label]);

  const handleUseSuggestion = (suggestion: string) => {
    if (currentValue.trim()) {
      // If field has content, append with proper formatting
      const combinedContent = `${currentValue}\n\n${suggestion}`;
      onSuggestion(combinedContent);
    } else {
      // If field is empty, use suggestion directly
      onSuggestion(suggestion);
    }
  };

  const handleCopySuggestion = (suggestion: string) => {
    navigator.clipboard.writeText(suggestion);
  };

  const getFieldCompletionStatus = () => {
    if (!currentValue.trim()) return 'empty';
    if (field.validation?.minLength && currentValue.trim().length < field.validation.minLength) {
      return 'incomplete';
    }
    return 'complete';
  };

  const shouldShowAssistant = () => {
    const status = getFieldCompletionStatus();
    return status === 'empty' || status === 'incomplete' || suggestions.length > 0;
  };

  if (!shouldShowAssistant()) return null;

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Assistant</span>
              <Badge variant="secondary" className="text-xs">
                Smart Help
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              {suggestions.length === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateSuggestions}
                  disabled={isGenerating}
                  className="h-6 px-2 text-xs"
                >
                  {isGenerating ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Wand2 className="h-3 w-3 mr-1" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Quick Status */}
          <div className="text-xs text-muted-foreground">
            {getFieldCompletionStatus() === 'empty' && 'Get professional content suggestions to start'}
            {getFieldCompletionStatus() === 'incomplete' && 'Enhance your content with AI-powered suggestions'}
            {getFieldCompletionStatus() === 'complete' && 'Refine and improve your existing content'}
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="space-y-3 border-t pt-3">
              {/* Document Insights */}
              {documentSuggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <FileText className="h-3 w-3" />
                    From Your Documents
                  </div>
                  {documentSuggestions.map((insight, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {insight.source}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(insight.relevance * 100)}% relevant
                        </span>
                      </div>
                      <div className="text-xs bg-background p-2 rounded border">
                        {insight.content}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUseSuggestion(insight.content)}
                          className="h-5 px-2 text-xs"
                        >
                          Use
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopySuggestion(insight.content)}
                          className="h-5 px-2 text-xs"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Lightbulb className="h-3 w-3" />
                    Professional Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="space-y-2">
                      <div className="text-xs bg-background p-3 rounded border leading-relaxed">
                        {suggestion}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUseSuggestion(suggestion)}
                          className="h-5 px-2 text-xs"
                        >
                          Use This
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopySuggestion(suggestion)}
                          className="h-5 px-2 text-xs"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Generate More */}
              {suggestions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSuggestions}
                  disabled={isGenerating}
                  className="w-full h-6 text-xs"
                >
                  {isGenerating ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Wand2 className="h-3 w-3 mr-1" />
                  )}
                  Generate More Suggestions
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};