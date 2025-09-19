import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, FileText, Building, Calendar, Loader2, AlertTriangle, Eye, Code, BarChart3 } from 'lucide-react';
import { ProfessionalDraftResult } from '@/services/ipo/professionalDraftGenerator';
import { textDiffEngine } from '@/utils/textDiffEngine';

interface EnhancedPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  draftResult: ProfessionalDraftResult;
  onApply: () => void;
  isApplying?: boolean;
}

export const EnhancedPreviewModal: React.FC<EnhancedPreviewModalProps> = ({
  isOpen,
  onClose,
  originalContent,
  draftResult,
  onApply,
  isApplying = false
}) => {
  const { fullDraft, analysisSteps, precedentCases, complianceNotes, confidence } = draftResult;
  const [showMarkup, setShowMarkup] = useState(true);
  const [diffResult, setDiffResult] = useState<any>(null);

  // Generate diff on modal open
  useEffect(() => {
    if (isOpen && originalContent && fullDraft) {
      const result = textDiffEngine.generateDiff(originalContent, fullDraft);
      setDiffResult(result);
    }
  }, [isOpen, originalContent, fullDraft]);

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    if (confidence >= 0.6) return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              Professional IPO Draft Preview
            </DialogTitle>
            <Badge className={`${getConfidenceColor()}`}>
              {Math.round(confidence * 100)}% confidence
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Complete professionally formatted draft with precedent analysis and compliance notes
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analysis & Precedents Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Analysis Steps */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Analysis Summary
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysisSteps.map((step, index) => (
                  <div key={index} className="text-xs">
                    <div className="font-medium text-foreground mb-1">{step.title}</div>
                    <div className="text-muted-foreground mb-1">{step.description}</div>
                    <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
                      {step.findings.slice(0, 2).map((finding, i) => (
                        <li key={i}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Precedent Cases */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Precedent Cases ({precedentCases.length})
                </h3>
              </CardHeader>
              <CardContent>
                {precedentCases.length > 0 ? (
                  <div className="space-y-3">
                    {precedentCases.map((precedent, index) => (
                      <div key={index} className="text-xs p-2 bg-muted/50 rounded">
                        <div className="font-medium text-foreground">{precedent.companyName}</div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Calendar className="h-3 w-3" />
                          {precedent.prospectusDate}
                          <span>•</span>
                          {precedent.industry}
                        </div>
                        <div className="text-muted-foreground">
                          {precedent.keyInsights.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No specific precedent cases found. General IPO best practices applied.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Compliance Notes */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Compliance Notes
                </h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {complianceNotes.slice(0, 4).map((note, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Draft Preview Panel */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Professional Draft vs Original</h3>
                {diffResult && (
                  <Badge variant="outline" className="text-xs">
                    {diffResult.stats.totalChanges} changes detected
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMarkup(!showMarkup)}
                  className="text-xs"
                >
                  {showMarkup ? (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Clean View
                    </>
                  ) : (
                    <>
                      <Code className="h-3 w-3 mr-1" />
                      Show Changes
                    </>
                  )}
                </Button>
                {diffResult && (
                  <Badge variant="secondary" className="text-xs">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {textDiffEngine.getChangeSummary(diffResult.changes)}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
              {/* Original Content */}
              <div className="flex flex-col min-h-0">
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Original Content
                </h4>
                <ScrollArea className="h-[400px] border rounded-lg bg-muted/20">
                  <div className="p-4">
                    <div className="text-sm text-muted-foreground break-words">
                      {originalContent || 'No original content'}
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Professional Draft */}
              <div className="flex flex-col min-h-0">
                <h4 className="text-xs font-medium text-foreground mb-2 uppercase tracking-wide">
                  Professional IPO Draft {showMarkup && '(with changes highlighted)'}
                </h4>
                <ScrollArea className="h-[400px] border-2 border-primary/20 rounded-lg bg-primary/5">
                  <div className="p-4">
                    <div className="text-sm text-foreground break-words leading-relaxed">
                      {showMarkup && diffResult ? (
                        <div 
                          dangerouslySetInnerHTML={{ __html: diffResult.markedUpText }}
                          className="diff-content"
                        />
                      ) : (
                        fullDraft
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between items-center shrink-0">
          <div className="text-sm text-muted-foreground">
            This will replace your current draft with the complete professional version
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isApplying}>
              Cancel
            </Button>
            <Button onClick={onApply} disabled={isApplying} className="min-w-40">
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying Draft...
                </>
              ) : (
                'Apply Professional Draft'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};