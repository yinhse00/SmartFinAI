import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Building2,
  DollarSign,
  Info,
  Plus,
  X
} from 'lucide-react';

interface ProductSegment {
  id: string;
  name: string;
  description: string;
  revenue_percentage: number;
  materiality_threshold: number;
  financial_segment_reference: string;
  is_material: boolean;
}

interface SegmentAlignmentValidatorProps {
  projectId: string;
  onValidationUpdate: (isValid: boolean, issues: string[]) => void;
}

export const SegmentAlignmentValidator: React.FC<SegmentAlignmentValidatorProps> = ({
  projectId,
  onValidationUpdate
}) => {
  const [segments, setSegments] = useState<ProductSegment[]>([]);
  const [materialityThreshold, setMaterialityThreshold] = useState<number>(10);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean>(true);

  const addSegment = () => {
    const newSegment: ProductSegment = {
      id: Date.now().toString(),
      name: '',
      description: '',
      revenue_percentage: 0,
      materiality_threshold: materialityThreshold,
      financial_segment_reference: '',
      is_material: false
    };
    setSegments(prev => [...prev, newSegment]);
  };

  const updateSegment = (id: string, field: keyof ProductSegment, value: any) => {
    setSegments(prev => prev.map(segment => 
      segment.id === id 
        ? { 
            ...segment, 
            [field]: value,
            is_material: field === 'revenue_percentage' 
              ? (value as number) >= materialityThreshold
              : segment.is_material
          }
        : segment
    ));
  };

  const removeSegment = (id: string) => {
    setSegments(prev => prev.filter(segment => segment.id !== id));
  };

  const validateSegmentAlignment = () => {
    const issues: string[] = [];
    
    // Check total revenue percentage
    const totalPercentage = segments.reduce((sum, segment) => sum + segment.revenue_percentage, 0);
    if (Math.abs(totalPercentage - 100) > 5) {
      issues.push(`Total revenue percentage (${totalPercentage.toFixed(1)}%) should equal 100%`);
    }

    // Check material segments
    const materialSegments = segments.filter(s => s.is_material);
    materialSegments.forEach(segment => {
      if (!segment.financial_segment_reference.trim()) {
        issues.push(`Material segment "${segment.name}" missing financial segment reference`);
      }
      if (!segment.description.trim()) {
        issues.push(`Material segment "${segment.name}" missing business description`);
      }
    });

    // Check immaterial segments above threshold
    const immaterialAboveThreshold = segments.filter(s => 
      s.revenue_percentage >= materialityThreshold && !s.is_material
    );
    if (immaterialAboveThreshold.length > 0) {
      issues.push(`Segments above ${materialityThreshold}% threshold must be marked as material`);
    }

    // Check for unnamed segments
    const unnamedSegments = segments.filter(s => !s.name.trim());
    if (unnamedSegments.length > 0) {
      issues.push(`${unnamedSegments.length} segment(s) missing names`);
    }

    setValidationIssues(issues);
    const valid = issues.length === 0;
    setIsValid(valid);
    onValidationUpdate(valid, issues);
  };

  useEffect(() => {
    validateSegmentAlignment();
  }, [segments, materialityThreshold]);

  const getValidationStatus = () => {
    if (isValid) {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        badge: <Badge variant="secondary" className="bg-green-100 text-green-800">Aligned</Badge>,
        message: "Business and financial segments are properly aligned"
      };
    } else {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
        badge: <Badge variant="destructive">Issues Found</Badge>,
        message: `${validationIssues.length} alignment issue(s) detected`
      };
    }
  };

  const status = getValidationStatus();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Business-Financial Segment Alignment</CardTitle>
          </div>
          {status.badge}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {status.icon}
          <span>{status.message}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Materiality Threshold */}
        <div className="space-y-2">
          <Label htmlFor="materiality">Materiality Threshold (%)</Label>
          <div className="flex items-center gap-4">
            <Input
              id="materiality"
              type="number"
              value={materialityThreshold}
              onChange={(e) => setMaterialityThreshold(Number(e.target.value))}
              className="w-24"
              min="1"
              max="25"
            />
            <span className="text-sm text-muted-foreground">
              Segments above this threshold require disclosure in financial section
            </span>
          </div>
        </div>

        <Separator />

        {/* Segments List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Product/Service Segments</h4>
            <Button variant="outline" size="sm" onClick={addSegment}>
              <Plus className="h-4 w-4 mr-2" />
              Add Segment
            </Button>
          </div>

          {segments.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Add product/service segments to validate alignment with accountants' report
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {segments.map((segment) => (
                <Card key={segment.id} className={`border ${segment.is_material ? 'border-primary/50' : 'border-muted'}`}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Segment Name</Label>
                        <Input
                          value={segment.name}
                          onChange={(e) => updateSegment(segment.id, 'name', e.target.value)}
                          placeholder="e.g., Manufacturing Division"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Revenue %</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={segment.revenue_percentage}
                            onChange={(e) => updateSegment(segment.id, 'revenue_percentage', Number(e.target.value))}
                            placeholder="0"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Financial Reference</Label>
                        <Input
                          value={segment.financial_segment_reference}
                          onChange={(e) => updateSegment(segment.id, 'financial_segment_reference', e.target.value)}
                          placeholder="Note X.X in Financial Statements"
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label>Business Description</Label>
                      <Input
                        value={segment.description}
                        onChange={(e) => updateSegment(segment.id, 'description', e.target.value)}
                        placeholder="Describe the business activities and market position..."
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {segment.is_material ? (
                          <Badge variant="default" className="bg-blue-100 text-blue-800">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Material Segment
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Non-Material</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {segment.revenue_percentage}% of total revenue
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeSegment(segment.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Validation Issues */}
        {validationIssues.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <strong>Alignment Issues:</strong>
                <ul className="list-disc list-inside space-y-1">
                  {validationIssues.map((issue, index) => (
                    <li key={index} className="text-sm">{issue}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Compliance Information */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>HKEX Requirement:</strong> Products and services disclosed in the business section 
            must align with segment results in the accountants' report. Material segments 
            (above {materialityThreshold}% threshold) require detailed disclosure and financial cross-references.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};