import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ArrowRight, TrendingUp, AlertCircle } from 'lucide-react';

interface ContentDiff {
  type: 'insert' | 'delete' | 'replace';
  originalText: string;
  newText: string;
  location: {
    section: string;
    paragraph?: number;
  };
  reason: string;
}

interface ComplianceImpact {
  scoreChange: number;
  affectedRequirements: string[];
  riskReduction: string[];
}

interface PreviewDiffViewerProps {
  title: string;
  description: string;
  diffs: ContentDiff[];
  complianceImpact: ComplianceImpact;
  confidence: number;
  onApply: () => void;
  onReject: () => void;
  isApplying?: boolean;
}

export const PreviewDiffViewer: React.FC<PreviewDiffViewerProps> = ({
  title,
  description,
  diffs,
  complianceImpact,
  confidence,
  onApply,
  onReject,
  isApplying = false
}) => {
  const getDiffTypeColor = (type: string) => {
    switch (type) {
      case 'insert':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'delete':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'replace':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getDiffTypeIcon = (type: string) => {
    switch (type) {
      case 'insert':
        return '+';
      case 'delete':
        return '-';
      case 'replace':
        return '~';
      default:
        return '?';
    }
  };

  const formatText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {title}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {Math.round(confidence * 100)}% confidence
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Compliance Impact Summary */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <h4 className="text-xs font-medium flex items-center gap-2">
            <TrendingUp className="h-3 w-3" />
            Compliance Impact
          </h4>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Score change:</span>
              <Badge variant={complianceImpact.scoreChange > 0 ? 'default' : 'secondary'}>
                {complianceImpact.scoreChange > 0 ? '+' : ''}{complianceImpact.scoreChange}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Requirements:</span>
              <span className="font-medium">{complianceImpact.affectedRequirements.length}</span>
            </div>
          </div>
          {complianceImpact.riskReduction.length > 0 && (
            <div className="text-xs">
              <span className="text-muted-foreground">Reduces risks:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {complianceImpact.riskReduction.map((risk, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {risk}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Diff Preview */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium">Content Changes</h4>
          <ScrollArea className="max-h-64">
            <div className="space-y-3">
              {diffs.map((diff, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-xs">
                      {diff.location.section}
                      {diff.location.paragraph && ` - Para ${diff.location.paragraph}`}
                    </Badge>
                    <span className="text-muted-foreground">{diff.reason}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Original Text */}
                    {diff.type !== 'insert' && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-red-600">-</span>
                          <span className="text-red-600 font-medium">Remove:</span>
                        </div>
                        <div className="text-red-800">
                          {formatText(diff.originalText)}
                        </div>
                      </div>
                    )}
                    
                    {/* Arrow for replace */}
                    {diff.type === 'replace' && (
                      <div className="flex justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* New Text */}
                    {diff.type !== 'delete' && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-green-600">+</span>
                          <span className="text-green-600 font-medium">
                            {diff.type === 'insert' ? 'Add:' : 'Replace with:'}
                          </span>
                        </div>
                        <div className="text-green-800">
                          {formatText(diff.newText)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {index < diffs.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Warning if low confidence */}
        {confidence < 0.7 && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
            <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5" />
            <div className="text-amber-800">
              <strong>Lower confidence:</strong> Please review these changes carefully before applying.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};