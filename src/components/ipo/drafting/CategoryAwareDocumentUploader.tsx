import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, Image, FileSpreadsheet, File, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { BusinessCategory } from '@/hooks/useBusinessCategories';
import { useIPODocuments } from '@/hooks/useIPODocuments';
import { cn } from '@/lib/utils';
interface CategoryAwareDocumentUploaderProps {
  projectId: string;
  category: BusinessCategory;
  onDocumentsChange?: (documents: any[]) => void;
}
export const CategoryAwareDocumentUploader: React.FC<CategoryAwareDocumentUploaderProps> = ({
  projectId,
  category,
  onDocumentsChange
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const {
    documents,
    upload,
    remove,
    isUploading
  } = useIPODocuments(projectId, category.documentType);
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return Image;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return FileSpreadsheet;
      case 'pdf':
      case 'doc':
      case 'docx':
        return FileText;
      default:
        return File;
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'processing':
        return Clock;
      case 'error':
        return AlertCircle;
      default:
        return Clock;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    for (const file of files) {
      await upload(file);
    }
    if (onDocumentsChange) {
      onDocumentsChange(documents);
    }
  }, [upload, documents, onDocumentsChange]);
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    for (const file of files) {
      await upload(file);
    }
    if (onDocumentsChange) {
      onDocumentsChange(documents);
    }
  }, [upload, documents, onDocumentsChange]);
  const handleRemove = useCallback(async (documentId: string) => {
    await remove(documentId);
    if (onDocumentsChange) {
      onDocumentsChange(documents.filter(d => d.id !== documentId));
    }
  }, [remove, documents, onDocumentsChange]);
  return <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Supporting Documents
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload documents relevant to {category.name.toLowerCase()}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Suggested Document Types */}
        {category.suggestedDocuments && category.suggestedDocuments.length > 0}

        {/* Upload Area */}
        <div className={cn("border-2 border-dashed rounded-lg p-4 text-center transition-colors", isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25", isUploading && "opacity-50 pointer-events-none")} onDrop={handleDrop} onDragOver={e => {
        e.preventDefault();
        setIsDragOver(true);
      }} onDragLeave={() => setIsDragOver(false)}>
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Drop files here or click to upload
          </p>
          <input type="file" multiple className="hidden" id={`file-upload-${category.id}`} onChange={handleFileSelect} accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.gif" />
          <Button variant="outline" size="sm" asChild disabled={isUploading}>
            <label htmlFor={`file-upload-${category.id}`} className="cursor-pointer">
              Choose Files
            </label>
          </Button>
        </div>

        {/* Document List */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {documents.length === 0 ? <div className="text-center py-8 text-sm text-muted-foreground">
                No documents uploaded yet
              </div> : documents.map(doc => {
            const FileIcon = getFileIcon(doc.document_name);
            const StatusIcon = getStatusIcon(doc.processing_status);
            return <div key={doc.id} className="flex items-center gap-3 p-2 border rounded-lg bg-background">
                    <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {doc.document_name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <StatusIcon className={cn("h-3 w-3", getStatusColor(doc.processing_status))} />
                        <span className="capitalize">{doc.processing_status}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(doc.id)} className="flex-shrink-0 h-6 w-6 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>;
          })}
          </div>
        </ScrollArea>

        {/* Upload Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• Supported formats: PDF, Word, Excel, Images</div>
          <div>• Max file size: 10MB per file</div>
          <div>• Files are processed automatically for insights</div>
        </div>
      </CardContent>
    </Card>;
};