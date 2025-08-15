import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Info, 
  FileText, 
  Sparkles, 
  ExternalLink, 
  Eye, 
  EyeOff,
  BookOpen,
  Lightbulb,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { EnhancedDocumentUploader } from './EnhancedDocumentUploader';
import { DocumentViewer } from './DocumentViewer';
import { FieldInputAssistant } from './FieldInputAssistant';
import { EnhancedBusinessCategory, EnhancedBusinessField, useEnhancedBusinessCategories } from '@/hooks/useEnhancedBusinessCategories';

interface EnhancedBusinessCategoryTabProps {
  projectId: string;
  category: EnhancedBusinessCategory;
  data: Record<string, any>;
  onDataChange: (fieldId: string, value: any) => void;
}

export const EnhancedBusinessCategoryTab: React.FC<EnhancedBusinessCategoryTabProps> = ({
  projectId,
  category,
  data,
  onDataChange
}) => {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'input' | 'documents' | 'guidance'>('input');
  
  const { getCompletionPercentage, getTemplateExample, getRegulatoryRequirements } = useEnhancedBusinessCategories();

  const getFieldCompletion = useCallback((field: EnhancedBusinessField) => {
    const value = data[field.id];
    if (!value) return 0;
    
    if (typeof value === 'string') {
      const minLength = field.validation?.minLength || (field.type === 'textarea' ? 50 : 10);
      const currentLength = value.trim().length;
      
      if (currentLength === 0) return 0;
      if (currentLength >= minLength) return 100;
      
      return Math.min(100, (currentLength / minLength) * 100);
    }
    return 100;
  }, [data]);

  const categoryCompletion = getCompletionPercentage(category.id, data);
  const regulatoryInfo = getRegulatoryRequirements(category.id);

  const toggleFieldExpansion = (fieldId: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldId)) {
      newExpanded.delete(fieldId);
    } else {
      newExpanded.add(fieldId);
    }
    setExpandedFields(newExpanded);
  };

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document);
    setShowDocumentViewer(true);
  };

  const getFieldValidationStatus = (field: EnhancedBusinessField) => {
    const value = data[field.id];
    const completion = getFieldCompletion(field);
    
    if (!value && field.required) {
      return { status: 'required', message: 'Required field', color: 'text-destructive' };
    }
    
    if (value && field.validation?.minLength && value.trim().length < field.validation.minLength) {
      return { 
        status: 'incomplete', 
        message: `Minimum ${field.validation.minLength} characters`, 
        color: 'text-yellow-600' 
      };
    }
    
    if (completion === 100) {
      return { status: 'complete', message: 'Complete', color: 'text-green-600' };
    }
    
    return { status: 'partial', message: 'In progress', color: 'text-blue-600' };
  };

  const renderField = (field: EnhancedBusinessField) => {
    const completion = getFieldCompletion(field);
    const value = data[field.id] || '';
    const isExpanded = expandedFields.has(field.id);
    const validation = getFieldValidationStatus(field);
    const templateExample = getTemplateExample(category.id, field.id);

    return (
      <div key={field.id} className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.id} className="text-sm font-medium flex items-center gap-2">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
            {field.hkexReference && (
              <Badge variant="outline" className="text-xs">
                {field.hkexReference}
              </Badge>
            )}
          </Label>
          <div className="flex items-center gap-2">
            {completion > 0 && (
              <Badge 
                variant={completion === 100 ? "default" : "secondary"} 
                className="text-xs"
              >
                {Math.round(completion)}%
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFieldExpansion(field.id)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Field Status */}
        <div className="flex items-center gap-2 text-xs">
          {validation.status === 'complete' && <CheckCircle2 className="h-3 w-3 text-green-600" />}
          {validation.status === 'required' && <AlertCircle className="h-3 w-3 text-destructive" />}
          {validation.status === 'incomplete' && <AlertCircle className="h-3 w-3 text-yellow-600" />}
          <span className={validation.color}>{validation.message}</span>
        </div>
        
        {/* Field Description */}
        {field.description && (
          <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-md text-xs text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>{field.description}</span>
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-3 pl-4 border-l-2 border-muted">
            {/* Template Example */}
            {templateExample && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Lightbulb className="h-3 w-3" />
                  Professional Example
                </div>
                <div className="text-xs p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-2 border-blue-200 dark:border-blue-800">
                  {templateExample}
                </div>
              </div>
            )}

            {/* Suggested Documents */}
            {field.suggestedDocuments && field.suggestedDocuments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Suggested Documents
                </div>
                <div className="flex flex-wrap gap-1">
                  {field.suggestedDocuments.map((doc, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {doc}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* HKEX Reference */}
            {field.hkexReference && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  Regulatory Reference
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {field.hkexReference}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Field */}
        <div className="space-y-2">
          {field.type === 'textarea' ? (
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => onDataChange(field.id, e.target.value)}
              rows={6}
              className="resize-none"
            />
          ) : (
            <Input
              id={field.id}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => onDataChange(field.id, e.target.value)}
            />
          )}

          {/* Character Count & Validation */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {field.type === 'textarea' && value && (
              <span>{value.trim().length} characters</span>
            )}
            {field.validation?.minLength && (
              <span>
                Minimum: {field.validation.minLength} characters
              </span>
            )}
          </div>
        </div>

        {/* Field Input Assistant */}
        <FieldInputAssistant
          field={field}
          currentValue={value}
          onSuggestion={(suggestion) => onDataChange(field.id, suggestion)}
          projectId={projectId}
        />
      </div>
    );
  };

  return (
    <div className="h-full">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
        {/* Tab Navigation */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <category.icon className="h-5 w-5" />
              <h3 className="font-semibold">{category.name}</h3>
              {category.required && (
                <Badge variant="secondary" className="text-xs">Required</Badge>
              )}
            </div>
            <Badge variant="outline" className="font-medium">
              {Math.round(categoryCompletion)}% Complete
            </Badge>
          </div>
          
          <Progress value={categoryCompletion} className="h-2 mb-3" />
          
          {category.description && (
            <p className="text-sm text-muted-foreground mb-3">
              {category.description}
            </p>
          )}

          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Input Fields
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="guidance" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Guidance
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="input" className="h-full m-0 p-4">
            <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Main Input Form */}
              <div className="lg:col-span-3">
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  <div className="space-y-6 pr-4">
                    {category.fields.map(renderField)}
                  </div>
                </ScrollArea>
              </div>

              {/* Document Viewer Sidebar */}
              {showDocumentViewer && selectedDocument && (
                <div className="lg:col-span-1">
                  <DocumentViewer
                    document={selectedDocument}
                    onClose={() => setShowDocumentViewer(false)}
                    onTextSelect={(text) => {
                      // Handle text selection from document
                      console.log('Selected text:', text);
                    }}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="h-full m-0 p-4">
            <EnhancedDocumentUploader
              projectId={projectId}
              category={category}
              onDocumentSelect={handleDocumentSelect}
              onDocumentsChange={(docs) => {
                console.log('Documents updated for category:', category.id, docs);
              }}
            />
          </TabsContent>

          <TabsContent value="guidance" className="h-full m-0 p-4">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-6">
                {/* HKEX Reference */}
                {category.hkexReference && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        HKEX Reference
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {category.hkexReference}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Regulatory Requirements */}
                {regulatoryInfo && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Regulatory Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {regulatoryInfo.general && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">General Guidance</h4>
                          <p className="text-sm text-muted-foreground">
                            {regulatoryInfo.general}
                          </p>
                        </div>
                      )}
                      
                      {regulatoryInfo.specific && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Specific Requirements</h4>
                          <div className="text-sm text-muted-foreground whitespace-pre-line">
                            {regulatoryInfo.specific}
                          </div>
                        </div>
                      )}

                      {regulatoryInfo.contents && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Content Guidelines</h4>
                          <p className="text-sm text-muted-foreground">
                            {regulatoryInfo.contents}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Suggested Documents */}
                {category.suggestedDocuments && category.suggestedDocuments.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Suggested Supporting Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-2">
                        {category.suggestedDocuments.map((doc, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{doc}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Field-Specific Guidance */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Field-Specific Guidance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.fields.map((field) => (
                        <div key={field.id} className="border-l-2 border-muted pl-4">
                          <h4 className="font-medium text-sm mb-2">{field.label}</h4>
                          {field.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {field.description}
                            </p>
                          )}
                          {field.hkexReference && (
                            <Badge variant="outline" className="text-xs">
                              {field.hkexReference}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};