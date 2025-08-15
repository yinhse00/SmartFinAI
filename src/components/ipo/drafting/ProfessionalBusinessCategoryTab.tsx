import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Info, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  BookOpen,
  Target,
  Lightbulb
} from 'lucide-react';
import { CategoryAwareDocumentUploader } from './CategoryAwareDocumentUploader';
import { ProfessionalBusinessCategory, ProfessionalBusinessField, useProfessionalBusinessCategories } from '@/hooks/useProfessionalBusinessCategories';

interface ProfessionalBusinessCategoryTabProps {
  projectId: string;
  category: ProfessionalBusinessCategory;
  data: Record<string, any>;
  onDataChange: (fieldId: string, value: any) => void;
}

export const ProfessionalBusinessCategoryTab: React.FC<ProfessionalBusinessCategoryTabProps> = ({
  projectId,
  category,
  data,
  onDataChange
}) => {
  const { validateField } = useProfessionalBusinessCategories();
  const [expandedGuidance, setExpandedGuidance] = useState<Record<string, boolean>>({});
  const [expandedRequirements, setExpandedRequirements] = useState(false);

  const getFieldCompletion = (field: ProfessionalBusinessField) => {
    const value = data[field.id];
    if (!value) return 0;
    if (typeof value === 'string') {
      const minLength = field.minLength || (field.type === 'textarea' ? 50 : 10);
      const lengthScore = Math.min(100, (value.trim().length / minLength) * 100);
      
      // Professional quality indicators
      const hasUppercase = /[A-Z]/.test(value);
      const hasPunctuation = /[.,;:!?]/.test(value);
      const wordCount = value.split(/\s+/).length;
      const avgWordLength = value.replace(/\s+/g, '').length / wordCount;
      
      const qualityBonus = (hasUppercase ? 5 : 0) + (hasPunctuation ? 5 : 0) + (avgWordLength > 4 ? 5 : 0);
      
      return Math.min(100, lengthScore + qualityBonus);
    }
    return 100;
  };

  const getFieldValidation = (field: ProfessionalBusinessField) => {
    const value = data[field.id] || '';
    return validateField(field, value);
  };

  const getFieldStatus = (field: ProfessionalBusinessField) => {
    const completion = getFieldCompletion(field);
    const validation = getFieldValidation(field);
    
    if (validation) return { status: 'error', icon: AlertCircle, color: 'text-destructive' };
    if (completion >= 80) return { status: 'complete', icon: CheckCircle, color: 'text-green-600' };
    if (completion > 0) return { status: 'progress', icon: Target, color: 'text-yellow-600' };
    return { status: 'pending', icon: AlertCircle, color: 'text-muted-foreground' };
  };

  const categoryCompletion = category.fields.reduce((acc, field) => {
    return acc + (getFieldCompletion(field) / category.fields.length);
  }, 0);

  const toggleGuidance = (fieldId: string) => {
    setExpandedGuidance(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const renderField = (field: ProfessionalBusinessField) => {
    const completion = getFieldCompletion(field);
    const validation = getFieldValidation(field);
    const { status, icon: StatusIcon, color } = getFieldStatus(field);
    const value = data[field.id] || '';
    const isExpanded = expandedGuidance[field.id];

    return (
      <div key={field.id} className="space-y-3 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.id} className="text-sm font-medium flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${color}`} />
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <div className="flex items-center gap-2">
            {completion > 0 && (
              <Badge variant={completion >= 80 ? "default" : "secondary"} className="text-xs">
                {Math.round(completion)}%
              </Badge>
            )}
            {field.hkexReference && (
              <Badge variant="outline" className="text-xs">
                {field.hkexReference}
              </Badge>
            )}
          </div>
        </div>

        {/* HKEX Professional Guidance */}
        {field.professionalGuidance && (
          <Collapsible open={isExpanded} onOpenChange={() => toggleGuidance(field.id)}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3 w-3" />
                  HKEX Professional Guidance
                </div>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>HKEX Requirement:</strong> {field.professionalGuidance}
                </AlertDescription>
              </Alert>
              
              {field.description && (
                <div className="flex items-start gap-2 p-2 bg-muted/40 rounded-md text-xs text-muted-foreground">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{field.description}</span>
                </div>
              )}

              {field.minLength && (
                <div className="text-xs text-muted-foreground">
                  Professional standard: Minimum {field.minLength} characters required
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Validation Error */}
        {validation && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{validation}</AlertDescription>
          </Alert>
        )}

        {/* Input Field */}
        {field.type === 'textarea' ? (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => onDataChange(field.id, e.target.value)}
            rows={6}
            className="resize-none"
          />
        ) : field.type === 'number' || field.type === 'percentage' ? (
          <Input
            id={field.id}
            type="number"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => onDataChange(field.id, e.target.value)}
            min={field.type === 'percentage' ? 0 : undefined}
            max={field.type === 'percentage' ? 100 : undefined}
          />
        ) : (
          <Input
            id={field.id}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => onDataChange(field.id, e.target.value)}
          />
        )}

        {/* Character Count & Professional Feedback */}
        {field.type === 'textarea' && value && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{value.trim().length} characters</span>
            {field.minLength && value.trim().length < field.minLength && (
              <span className="text-yellow-600">
                Need {field.minLength - value.trim().length} more for professional standard
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Input Form */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <category.icon className="h-4 w-4" />
                {category.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {category.hkexSection}
                </Badge>
                <Badge variant="outline">
                  {Math.round(categoryCompletion)}% Complete
                </Badge>
              </div>
            </div>
            
            {category.description && (
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            )}

            {/* HKEX Requirements Overview */}
            <Collapsible open={expandedRequirements} onOpenChange={setExpandedRequirements}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    HKEX Professional Requirements ({category.professionalRequirements.length})
                  </div>
                  {expandedRequirements ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-1">
                  {category.professionalRequirements.map((req, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Progress value={categoryCompletion} className="h-2" />
          </CardHeader>
          
          <CardContent>
            <ScrollArea className="h-[calc(100vh-22rem)] pr-4">
              <div className="space-y-4">
                {category.fields.map(renderField)}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Professional Document Upload Panel */}
      <div>
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Supporting Documents
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Upload documents to support your {category.shortName.toLowerCase()} section
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Suggested Documents */}
              <div>
                <h4 className="text-xs font-medium mb-2">Suggested Documents:</h4>
                <div className="space-y-1">
                  {category.suggestedDocuments.map((doc, index) => (
                    <div key={index} className="text-xs text-muted-foreground p-2 bg-muted/30 rounded flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary/40" />
                      {doc}
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Upload */}
              <CategoryAwareDocumentUploader
                projectId={projectId}
                category={{
                  id: category.id,
                  name: category.name,
                  shortName: category.shortName,
                  description: category.description,
                  icon: category.icon,
                  fields: [],
                  documentType: category.documentTypes[0] || 'business',
                  suggestedDocuments: category.suggestedDocuments
                }}
                onDocumentsChange={(docs) => {
                  console.log('Documents updated for professional category:', category.id, docs);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};