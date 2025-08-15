import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  File,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Download,
  Search,
  Filter,
  Sparkles
} from 'lucide-react';
import { EnhancedBusinessCategory } from '@/hooks/useEnhancedBusinessCategories';
import { useIPODocuments } from '@/hooks/useIPODocuments';
import { cn } from '@/lib/utils';

interface EnhancedDocumentUploaderProps {
  projectId: string;
  category: EnhancedBusinessCategory;
  onDocumentSelect?: (document: any) => void;
  onDocumentsChange?: (documents: any[]) => void;
}

export const EnhancedDocumentUploader: React.FC<EnhancedDocumentUploaderProps> = ({
  projectId,
  category,
  onDocumentSelect,
  onDocumentsChange
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { documents, upload, remove, isUploading } = useIPODocuments(projectId, category.documentType);

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

  const getProcessingProgress = (document: any) => {
    switch (document.processing_status) {
      case 'completed':
        return 100;
      case 'processing':
        return 50;
      case 'error':
        return 0;
      default:
        return 25;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesFilter = filter === 'all' || doc.processing_status === filter;
    const matchesSearch = searchTerm === '' || 
      doc.document_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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

  const handleDocumentView = (document: any) => {
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
  };

  const getCompletedDocumentsCount = () => {
    return documents.filter(doc => doc.processing_status === 'completed').length;
  };

  const getSuggestedDocumentStatus = (suggestedDoc: string) => {
    const found = documents.some(doc => 
      doc.document_name.toLowerCase().includes(suggestedDoc.toLowerCase()) ||
      doc.extracted_content?.toLowerCase().includes(suggestedDoc.toLowerCase())
    );
    return found;
  };

  return (
    <div className="h-full space-y-4">
      {/* Upload Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Document Upload - {category.name}
            </CardTitle>
            <Badge variant="outline">
              {getCompletedDocumentsCount()}/{documents.length} Processed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing Progress</span>
              <span>{documents.length > 0 ? Math.round((getCompletedDocumentsCount() / documents.length) * 100) : 0}%</span>
            </div>
            <Progress 
              value={documents.length > 0 ? (getCompletedDocumentsCount() / documents.length) * 100 : 0} 
              className="h-2"
            />
          </div>

          {/* Suggested Documents Checklist */}
          {category.suggestedDocuments && category.suggestedDocuments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Suggested Documents
              </h4>
              <div className="space-y-2">
                {category.suggestedDocuments.map((docType, index) => {
                  const isUploaded = getSuggestedDocumentStatus(docType);
                  return (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {isUploaded ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className={isUploaded ? 'text-green-600' : 'text-muted-foreground'}>
                        {docType}
                      </span>
                      {isUploaded && (
                        <Badge variant="outline" className="text-xs">
                          Uploaded
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              isUploading && "opacity-50 pointer-events-none"
            )}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Upload Supporting Documents</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drop files here or click to browse. Documents will be automatically processed for insights.
            </p>
            
            <input
              type="file"
              multiple
              className="hidden"
              id={`enhanced-file-upload-${category.id}`}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.gif"
            />
            
            <div className="space-y-2">
              <Button
                variant="outline"
                size="lg"
                asChild
                disabled={isUploading}
                className="w-full max-w-xs"
              >
                <label htmlFor={`enhanced-file-upload-${category.id}`} className="cursor-pointer">
                  {isUploading ? 'Uploading...' : 'Choose Files'}
                </label>
              </Button>
              
              <div className="text-xs text-muted-foreground">
                Supported: PDF, Word, Excel, Images • Max 10MB per file
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Management */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Uploaded Documents</CardTitle>
            <div className="flex items-center gap-2">
              {/* Filter Buttons */}
              <div className="flex border rounded-md">
                {['all', 'completed', 'processing', 'error'].map((filterType) => (
                  <Button
                    key={filterType}
                    variant={filter === filterType ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilter(filterType as any)}
                    className="text-xs px-2 py-1 rounded-none first:rounded-l-md last:rounded-r-md"
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md text-sm bg-background"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {searchTerm ? 'No documents match your search' : 'No documents uploaded yet'}
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {filteredDocuments.map((doc) => {
                  const FileIcon = getFileIcon(doc.document_name);
                  const StatusIcon = getStatusIcon(doc.processing_status);
                  const progress = getProcessingProgress(doc);
                  
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                    >
                      <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm truncate">
                            {doc.document_name}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {doc.document_type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <StatusIcon className={cn("h-3 w-3", getStatusColor(doc.processing_status))} />
                          <span className="text-xs text-muted-foreground capitalize">
                            {doc.processing_status}
                          </span>
                          {doc.processing_status === 'processing' && (
                            <Progress value={progress} className="h-1 w-16" />
                          )}
                        </div>
                        
                        {doc.key_insights && doc.key_insights.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {doc.key_insights.length} insight(s) extracted
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {doc.processing_status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDocumentView(doc)}
                            className="h-8 w-8 p-0"
                            title="View document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(doc.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Remove document"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};