import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, Sparkles, Loader2 } from 'lucide-react';

interface KeyElements {
  company_description: string;
  principal_activities: string;
  business_model: string;
}

interface InputGenerateTabProps {
  keyElements: KeyElements;
  setKeyElements: (elements: KeyElements) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onUploadDD: () => void;
}

export const InputGenerateTab: React.FC<InputGenerateTabProps> = ({
  keyElements,
  setKeyElements,
  isGenerating,
  onGenerate,
  onUploadDD
}) => {
  return (
    <div className="h-full p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Key Elements Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Key Elements Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Company Description
              </label>
              <Textarea
                placeholder="Describe the company's core business..."
                value={keyElements.company_description}
                onChange={(e) => setKeyElements({
                  ...keyElements,
                  company_description: e.target.value
                })}
                rows={3}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Principal Activities
              </label>
              <Textarea
                placeholder="List the main business activities..."
                value={keyElements.principal_activities}
                onChange={(e) => setKeyElements({
                  ...keyElements,
                  principal_activities: e.target.value
                })}
                rows={3}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Business Model
              </label>
              <Textarea
                placeholder="Explain how the company generates revenue..."
                value={keyElements.business_model}
                onChange={(e) => setKeyElements({
                  ...keyElements,
                  business_model: e.target.value
                })}
                rows={3}
              />
            </div>
            
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
          </CardContent>
        </Card>

        {/* DD Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Due Diligence Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload business-related DD documents
              </p>
              <Button variant="outline" onClick={onUploadDD}>
                Upload Documents
              </Button>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Recommended Documents:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Business plan and strategy documents</li>
                <li>• Management presentations</li>
                <li>• Market research reports</li>
                <li>• Competitive analysis</li>
                <li>• Product/service documentation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};