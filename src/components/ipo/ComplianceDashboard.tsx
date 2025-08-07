import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  FileText,
  Building2,
  DollarSign,
  Info
} from 'lucide-react';

interface ComplianceIssue {
  id: string;
  type: 'business_financial_alignment' | 'materiality' | 'disclosure' | 'citation';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  section: string;
  autoFixable: boolean;
}

interface ComplianceMetrics {
  overallScore: number;
  businessFinancialAlignment: number;
  materialityCompliance: number;
  disclosureCompleteness: number;
  citationAccuracy: number;
}

interface ComplianceDashboardProps {
  projectId: string;
  selectedSection: string;
  issues: ComplianceIssue[];
  metrics: ComplianceMetrics;
  onFixIssue: (issueId: string) => void;
  onRefreshAnalysis: () => void;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  projectId,
  selectedSection,
  issues,
  metrics,
  onFixIssue,
  onRefreshAnalysis
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  const getSeverityIcon = (severity: ComplianceIssue['severity']) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeIcon = (type: ComplianceIssue['type']) => {
    switch (type) {
      case 'business_financial_alignment':
        return <Building2 className="h-4 w-4" />;
      case 'materiality':
        return <TrendingUp className="h-4 w-4" />;
      case 'disclosure':
        return <FileText className="h-4 w-4" />;
      case 'citation':
        return <Shield className="h-4 w-4" />;
    }
  };

  const criticalIssues = issues.filter(issue => issue.severity === 'high');
  const businessFinancialIssues = issues.filter(issue => issue.type === 'business_financial_alignment');

  return (
    <div className="space-y-6">
      {/* Overall Compliance Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance Dashboard
            </CardTitle>
            <Badge variant={getScoreBadgeVariant(metrics.overallScore)}>
              {metrics.overallScore}% Compliant
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Compliance</span>
                <span className={`text-sm font-bold ${getScoreColor(metrics.overallScore)}`}>
                  {metrics.overallScore}%
                </span>
              </div>
              <Progress value={metrics.overallScore} className="h-2" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Business-Financial</span>
                </div>
                <div className="flex items-center justify-between">
                  <Progress value={metrics.businessFinancialAlignment} className="h-1 flex-1 mr-2" />
                  <span className={`text-xs ${getScoreColor(metrics.businessFinancialAlignment)}`}>
                    {metrics.businessFinancialAlignment}%
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Materiality</span>
                </div>
                <div className="flex items-center justify-between">
                  <Progress value={metrics.materialityCompliance} className="h-1 flex-1 mr-2" />
                  <span className={`text-xs ${getScoreColor(metrics.materialityCompliance)}`}>
                    {metrics.materialityCompliance}%
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Disclosure</span>
                </div>
                <div className="flex items-center justify-between">
                  <Progress value={metrics.disclosureCompleteness} className="h-1 flex-1 mr-2" />
                  <span className={`text-xs ${getScoreColor(metrics.disclosureCompleteness)}`}>
                    {metrics.disclosureCompleteness}%
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Citations</span>
                </div>
                <div className="flex items-center justify-between">
                  <Progress value={metrics.citationAccuracy} className="h-1 flex-1 mr-2" />
                  <span className={`text-xs ${getScoreColor(metrics.citationAccuracy)}`}>
                    {metrics.citationAccuracy}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues Alert */}
      {criticalIssues.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{criticalIssues.length} Critical Issue(s)</strong> requiring immediate attention before IPO submission
          </AlertDescription>
        </Alert>
      )}

      {/* Business-Financial Alignment Focus */}
      {businessFinancialIssues.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business-Financial Segment Alignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-amber-200 bg-amber-50">
              <DollarSign className="h-4 w-4" />
              <AlertDescription className="text-amber-800">
                <strong>HKEX Requirement:</strong> Products/services in business section must align with 
                segment results in accountants' report. {businessFinancialIssues.length} alignment issue(s) detected.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Issues List */}
      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance Issues ({issues.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {issues.map((issue) => (
                <div key={issue.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(issue.severity)}
                      {getTypeIcon(issue.type)}
                      <div>
                        <h4 className="font-medium text-sm">{issue.title}</h4>
                        <p className="text-xs text-muted-foreground">Section: {issue.section}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={issue.severity === 'high' ? 'destructive' : 
                                issue.severity === 'medium' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {issue.severity.toUpperCase()}
                      </Badge>
                      {issue.autoFixable && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          Auto-Fixable
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                  
                  {issue.autoFixable && (
                    <button
                      onClick={() => onFixIssue(issue.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Apply Automatic Fix
                    </button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Summary */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Hong Kong IPO Compliance:</strong> This dashboard monitors alignment between business 
          descriptions and financial segment reporting as required by HKEX Listing Rules App1A Part A. 
          Material segments must be consistently disclosed across business and financial sections.
        </AlertDescription>
      </Alert>
    </div>
  );
};