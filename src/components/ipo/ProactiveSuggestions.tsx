
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, CheckCircle, Lightbulb, Target, 
  ChevronDown, ChevronUp, Play, RefreshCw, 
  TrendingUp, AlertCircle
} from 'lucide-react';
import { ProactiveAnalysisResult, AnalysisIssue, ImprovementOpportunity } from '@/types/ipoAnalysis';

interface ProactiveSuggestionsProps {
  analysis: ProactiveAnalysisResult;
  onApplyFix: (issueId: string) => void;
  onApplyImprovement: (opportunityId: string) => void;
  onRefreshAnalysis: () => void;
  isLoading?: boolean;
}

export const ProactiveSuggestions: React.FC<ProactiveSuggestionsProps> = ({
  analysis,
  onApplyFix,
  onApplyImprovement,
  onRefreshAnalysis,
  isLoading = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!analysis.hasIssues && analysis.urgentIssues.length === 0 && analysis.quickWins.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Content looks good!</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            No urgent issues detected. Your content meets basic requirements.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
              <TrendingUp className="h-4 w-4" />
              AI Analysis Summary
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefreshAnalysis}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-blue-700 mb-3">{analysis.summary}</p>
          
          {/* Quick Stats */}
          <div className="flex gap-2 mb-3">
            {analysis.urgentIssues.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {analysis.urgentIssues.length} urgent
              </Badge>
            )}
            {analysis.quickWins.length > 0 && (
              <Badge variant="default" className="text-xs">
                {analysis.quickWins.length} quick wins
              </Badge>
            )}
          </div>

          {/* Next Steps */}
          {analysis.nextSteps.length > 0 && (
            <div>
              <p className="text-xs font-medium text-blue-800 mb-1">Recommended next steps:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                {analysis.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-blue-400 mt-1">•</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Urgent Issues */}
      {analysis.urgentIssues.length > 0 && (
        <Card className="border-red-200">
          <Collapsible 
            open={expandedSections.has('urgent')}
            onOpenChange={() => toggleSection('urgent')}
          >
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    Urgent Issues ({analysis.urgentIssues.length})
                  </CardTitle>
                  {expandedSections.has('urgent') ? (
                    <ChevronUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                {analysis.urgentIssues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onApplyFix={onApplyFix}
                  />
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Quick Wins */}
      {analysis.quickWins.length > 0 && (
        <Card className="border-green-200">
          <Collapsible 
            open={expandedSections.has('quickWins')}
            onOpenChange={() => toggleSection('quickWins')}
          >
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                    <Lightbulb className="h-4 w-4" />
                    Quick Wins ({analysis.quickWins.length})
                  </CardTitle>
                  {expandedSections.has('quickWins') ? (
                    <ChevronUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                {analysis.quickWins.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onApplyImprovement={onApplyImprovement}
                  />
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
};

// Issue Card Component
const IssueCard: React.FC<{
  issue: AnalysisIssue;
  onApplyFix: (issueId: string) => void;
}> = ({ issue, onApplyFix }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="h-3 w-3 text-red-500" />
          <span className="text-sm font-medium text-red-800">{issue.title}</span>
          <Badge variant="outline" className="text-xs">
            {issue.severity}
          </Badge>
        </div>
        <p className="text-xs text-red-700 mb-2">{issue.description}</p>
        {issue.suggestedFix && (
          <p className="text-xs text-red-600 bg-red-100 p-2 rounded">
            <strong>Suggested fix:</strong> {issue.suggestedFix}
          </p>
        )}
      </div>
      {issue.autoFixable && (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-6 border-red-300 text-red-700 hover:bg-red-100"
          onClick={() => onApplyFix(issue.id)}
        >
          <Play className="h-3 w-3 mr-1" />
          Fix
        </Button>
      )}
    </div>
  </div>
);

// Opportunity Card Component  
const OpportunityCard: React.FC<{
  opportunity: ImprovementOpportunity;
  onApplyImprovement: (opportunityId: string) => void;
}> = ({ opportunity, onApplyImprovement }) => (
  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-3 w-3 text-green-500" />
          <span className="text-sm font-medium text-green-800">{opportunity.title}</span>
          <Badge variant="outline" className="text-xs">
            {opportunity.impact} impact
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {opportunity.effort}
          </Badge>
        </div>
        <p className="text-xs text-green-700 mb-2">{opportunity.description}</p>
        {opportunity.suggestedAction && (
          <p className="text-xs text-green-600 bg-green-100 p-2 rounded">
            <strong>Action:</strong> {opportunity.suggestedAction}
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="text-xs h-6 border-green-300 text-green-700 hover:bg-green-100"
        onClick={() => onApplyImprovement(opportunity.id)}
      >
        <Play className="h-3 w-3 mr-1" />
        Apply
      </Button>
    </div>
  </div>
);
