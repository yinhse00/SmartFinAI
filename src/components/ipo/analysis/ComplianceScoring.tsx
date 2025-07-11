import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  MessageSquare,
  Building,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { ComplianceScore } from '@/services/ipo/realTimeAnalyzer';

interface ComplianceScoringProps {
  score: ComplianceScore;
  className?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreColorClass = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getScoreDescription = (score: number) => {
  if (score >= 90) return 'Excellent compliance';
  if (score >= 80) return 'Good compliance';
  if (score >= 70) return 'Fair compliance';
  if (score >= 60) return 'Needs improvement';
  return 'Requires attention';
};

const CategoryScore: React.FC<{
  icon: React.ReactNode;
  title: string;
  score: number;
  description: string;
}> = ({ icon, title, score, description }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
            <span className={`text-sm font-bold ml-auto ${getScoreColor(score)}`}>
              {score}%
            </span>
          </div>
          <Progress 
            value={score} 
            className="h-2"
            style={{
              '--progress-background': getScoreColorClass(score)
            } as React.CSSProperties}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{description}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const ComplianceScoring: React.FC<ComplianceScoringProps> = ({
  score,
  className = ''
}) => {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5" />
          HKEX Compliance Score
          <Badge 
            variant={score.overall >= 80 ? 'default' : score.overall >= 60 ? 'secondary' : 'destructive'}
            className="ml-auto"
          >
            {score.overall}%
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className={`text-3xl font-bold ${getScoreColor(score.overall)}`}>
            {score.overall}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {getScoreDescription(score.overall)}
          </p>
          
          {/* Critical Issues Alert */}
          {score.criticalIssues > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {score.criticalIssues} critical issue{score.criticalIssues !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Category Breakdown</h4>
          
          <CategoryScore
            icon={<FileText className="h-4 w-4 text-blue-500" />}
            title="Disclosure"
            score={score.categories.disclosure}
            description="Required HKEX disclosures and information completeness"
          />
          
          <CategoryScore
            icon={<MessageSquare className="h-4 w-4 text-green-500" />}
            title="Language"
            score={score.categories.language}
            description="Professional tone and appropriate terminology"
          />
          
          <CategoryScore
            icon={<Building className="h-4 w-4 text-purple-500" />}
            title="Structure"
            score={score.categories.structure}
            description="Content organization and flow"
          />
          
          <CategoryScore
            icon={<BookOpen className="h-4 w-4 text-orange-500" />}
            title="Citations"
            score={score.categories.citations}
            description="Regulatory references and supporting citations"
          />
        </div>

        {/* Missing Disclosures */}
        {score.missingDisclosures.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Missing Disclosures
            </h4>
            <div className="space-y-1">
              {score.missingDisclosures.slice(0, 3).map((disclosure, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {disclosure}
                </Badge>
              ))}
              {score.missingDisclosures.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{score.missingDisclosures.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {score.overall < 80 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Tips to improve score:</span>
            </div>
            <ul className="text-xs text-muted-foreground mt-1 ml-6 space-y-1">
              {score.categories.disclosure < 80 && (
                <li>• Add missing required disclosures</li>
              )}
              {score.categories.language < 80 && (
                <li>• Use more professional language</li>
              )}
              {score.categories.citations < 80 && (
                <li>• Include HKEX Listing Rules references</li>
              )}
              {score.categories.structure < 80 && (
                <li>• Improve content organization</li>
              )}
            </ul>
          </div>
        )}

        {/* Perfect Score Celebration */}
        {score.overall >= 90 && (
          <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-2 rounded">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Excellent HKEX compliance!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};