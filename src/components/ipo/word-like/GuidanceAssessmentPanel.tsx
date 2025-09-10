import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info,
  FileCheck,
  BarChart3,
  Target,
  BookOpen,
  Loader2
} from 'lucide-react';
import { guidanceAssessmentService } from '@/services/ipo/guidanceAssessmentService';

interface GuidanceAssessmentPanelProps {
  content: string;
  sectionType: string;
  isVisible: boolean;
}

interface AssessmentData {
  regulatoryCompliance: {
    score: number;
    missingRequirements: string[];
    metRequirements: string[];
    recommendations: string[];
  };
  templateAlignment: {
    score: number;
    bestPractices: string[];
    improvementAreas: string[];
    industryBenchmarks: string[];
  };
  professionalStandards: {
    score: number;
    languageQuality: number;
    structureQuality: number;
    completenessScore: number;
  };
  overallAssessment: {
    score: number;
    confidence: number;
    readinessLevel: 'draft' | 'review' | 'near-complete' | 'complete';
    nextSteps: string[];
  };
}

export const GuidanceAssessmentPanel: React.FC<GuidanceAssessmentPanelProps> = ({
  content,
  sectionType,
  isVisible
}) => {
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible && content.length > 50) {
      performAssessment();
    }
  }, [content, sectionType, isVisible]);

  const performAssessment = async () => {
    setIsLoading(true);
    try {
      const result = await guidanceAssessmentService.assessContent(content, sectionType);
      setAssessment(result);
    } catch (error) {
      console.error('Assessment failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.9) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 0.75) return <Badge variant="default" className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 0.6) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Needs Improvement</Badge>;
    return <Badge variant="destructive">Requires Attention</Badge>;
  };

  const getReadinessIcon = (level: string) => {
    switch (level) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'near-complete':
        return <Target className="h-4 w-4 text-blue-600" />;
      case 'review':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-80 border-l bg-background">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Guidance Assessment</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Analyzing content...</span>
          </div>
        ) : assessment ? (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-6">
              {/* Overall Assessment */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Overall Assessment</h3>
                    {getScoreBadge(assessment.overallAssessment.score)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getReadinessIcon(assessment.overallAssessment.readinessLevel)}
                    <span className="text-sm font-medium capitalize">
                      {assessment.overallAssessment.readinessLevel.replace('-', ' ')}
                    </span>
                    <span className={`text-sm font-bold ${getScoreColor(assessment.overallAssessment.score)}`}>
                      {Math.round(assessment.overallAssessment.score * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={assessment.overallAssessment.score * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Confidence: {Math.round(assessment.overallAssessment.confidence * 100)}%
                  </p>
                </CardContent>
              </Card>

              {/* Regulatory Compliance */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Regulatory Compliance</h3>
                    <span className={`text-sm font-bold ${getScoreColor(assessment.regulatoryCompliance.score)}`}>
                      {Math.round(assessment.regulatoryCompliance.score * 100)}%
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress 
                    value={assessment.regulatoryCompliance.score * 100} 
                    className="h-2"
                  />
                  
                  {assessment.regulatoryCompliance.metRequirements.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-700 mb-1">✓ Met Requirements:</p>
                      <ul className="text-xs space-y-1">
                        {assessment.regulatoryCompliance.metRequirements.slice(0, 3).map((req, i) => (
                          <li key={i} className="text-muted-foreground">• {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {assessment.regulatoryCompliance.missingRequirements.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-700 mb-1">⚠ Missing Requirements:</p>
                      <ul className="text-xs space-y-1">
                        {assessment.regulatoryCompliance.missingRequirements.slice(0, 3).map((req, i) => (
                          <li key={i} className="text-muted-foreground">• {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Template Alignment */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Template Alignment</h3>
                    <span className={`text-sm font-bold ${getScoreColor(assessment.templateAlignment.score)}`}>
                      {Math.round(assessment.templateAlignment.score * 100)}%
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress 
                    value={assessment.templateAlignment.score * 100} 
                    className="h-2"
                  />
                  
                  {assessment.templateAlignment.bestPractices.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-700 mb-1">💡 Best Practices:</p>
                      <ul className="text-xs space-y-1">
                        {assessment.templateAlignment.bestPractices.slice(0, 2).map((practice, i) => (
                          <li key={i} className="text-muted-foreground">• {practice}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {assessment.templateAlignment.improvementAreas.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-orange-700 mb-1">🔧 Improvement Areas:</p>
                      <ul className="text-xs space-y-1">
                        {assessment.templateAlignment.improvementAreas.slice(0, 2).map((area, i) => (
                          <li key={i} className="text-muted-foreground">• {area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Standards */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Professional Standards</h3>
                    <span className={`text-sm font-bold ${getScoreColor(assessment.professionalStandards.score)}`}>
                      {Math.round(assessment.professionalStandards.score * 100)}%
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Language Quality</span>
                      <span className={getScoreColor(assessment.professionalStandards.languageQuality)}>
                        {Math.round(assessment.professionalStandards.languageQuality * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={assessment.professionalStandards.languageQuality * 100} 
                      className="h-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Structure Quality</span>
                      <span className={getScoreColor(assessment.professionalStandards.structureQuality)}>
                        {Math.round(assessment.professionalStandards.structureQuality * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={assessment.professionalStandards.structureQuality * 100} 
                      className="h-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Completeness</span>
                      <span className={getScoreColor(assessment.professionalStandards.completenessScore)}>
                        {Math.round(assessment.professionalStandards.completenessScore * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={assessment.professionalStandards.completenessScore * 100} 
                      className="h-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              {assessment.overallAssessment.nextSteps.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <h3 className="font-medium">Recommended Next Steps</h3>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs space-y-2">
                      {assessment.overallAssessment.nextSteps.slice(0, 4).map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary font-medium">{i + 1}.</span>
                          <span className="text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        ) : content.length < 50 ? (
          <div className="text-center py-8">
            <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Start writing content to see guidance assessment
            </p>
          </div>
        ) : null}
      </CardContent>
    </div>
  );
};