import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, FileText } from 'lucide-react';
import { CategoryAwareDocumentUploader } from './CategoryAwareDocumentUploader';
import { BusinessCategory, BusinessField } from '@/hooks/useBusinessCategories';
interface BusinessCategoryTabProps {
  projectId: string;
  category: BusinessCategory;
  data: Record<string, any>;
  onDataChange: (fieldId: string, value: any) => void;
}
export const BusinessCategoryTab: React.FC<BusinessCategoryTabProps> = ({
  projectId,
  category,
  data,
  onDataChange
}) => {
  const getFieldCompletion = (field: BusinessField) => {
    const value = data[field.id];
    if (!value) return 0;
    if (typeof value === 'string') {
      const minLength = field.type === 'textarea' ? 50 : 10;
      return Math.min(100, value.trim().length / minLength * 100);
    }
    return 100;
  };
  const categoryCompletion = category.fields.reduce((acc, field) => {
    return acc + getFieldCompletion(field) / category.fields.length;
  }, 0);
  const renderField = (field: BusinessField) => {
    const completion = getFieldCompletion(field);
    const value = data[field.id] || '';
    return <div key={field.id} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.id} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {completion > 0 && <Badge variant={completion === 100 ? "default" : "secondary"} className="text-xs">
              {Math.round(completion)}%
            </Badge>}
        </div>
        
        {field.description && <div className="flex items-start gap-2 p-2 bg-muted/40 rounded-md text-xs text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>{field.description}</span>
          </div>}

        {field.example && <div className="text-xs text-muted-foreground italic">
            Example: {field.example}
          </div>}

        {field.type === 'textarea' ? <Textarea id={field.id} placeholder={field.placeholder} value={value} onChange={e => onDataChange(field.id, e.target.value)} rows={4} className="resize-none" /> : <Input id={field.id} placeholder={field.placeholder} value={value} onChange={e => onDataChange(field.id, e.target.value)} />}

        {field.type === 'textarea' && value && <div className="text-xs text-muted-foreground">
            {value.trim().length} characters
          </div>}
      </div>;
  };
  return <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Input Form */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <category.icon className="h-4 w-4" />
                {category.name}
              </CardTitle>
              <Badge variant="outline">
                {Math.round(categoryCompletion)}% Complete
              </Badge>
            </div>
            {category.description && <p className="text-sm text-muted-foreground">
                {category.description}
              </p>}
            <Progress value={categoryCompletion} className="h-1" />
          </CardHeader>
          <CardContent className="p-4 py-[8px]">
            <ScrollArea className="h-[calc(100vh-16rem)] pr-4">
              <div className="space-y-4">
                {category.fields.map(renderField)}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Document Upload Panel */}
      <div>
        <CategoryAwareDocumentUploader projectId={projectId} category={category} onDocumentsChange={docs => {
        // Handle document changes if needed
        console.log('Documents updated for category:', category.id, docs);
      }} />
      </div>
    </div>;
};