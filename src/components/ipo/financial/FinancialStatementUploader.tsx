import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { financialDataExtractor, FinancialData } from '@/services/financial/financialDataExtractor';
import { supabase } from '@/integrations/supabase/client';
import { hasGrokApiKey } from '@/services/apiKeyService';
import { ApiKeyConfiguration } from './ApiKeyConfiguration';

interface FinancialStatementUploaderProps {
  projectId: string;
  onFileProcessed: (statementId: string, data: FinancialData) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'profit_loss' | 'balance_sheet' | 'cash_flow';
  status: 'uploading' | 'processing' | 'completed' | 'error';
  data?: FinancialData;
  error?: string;
}

export const FinancialStatementUploader: React.FC<FinancialStatementUploaderProps> = ({
  projectId,
  onFileProcessed
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const { validateFiles } = useFileUpload();
  const { toast } = useToast();

  useEffect(() => {
    setHasApiKey(hasGrokApiKey());
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!validateFiles(files)) return;

    // Check if API key is configured for enhanced processing
    if (!hasGrokApiKey()) {
      toast({
        title: "API Key Required",
        description: "Configure X.AI API key for AI-powered financial table recognition",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    for (const file of Array.from(files)) {
      const fileId = `${Date.now()}-${file.name}`;
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        type: detectStatementType(file.name),
        status: 'uploading'
      };

      setUploadedFiles(prev => [...prev, newFile]);

      try {
        // Update status to processing
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { ...f, status: 'processing' } : f)
        );

        // Extract financial data
        const extractionResult = await financialDataExtractor.extractFinancialData(file);
        
        if (!extractionResult.success || !extractionResult.data) {
          throw new Error(extractionResult.error || 'Failed to extract financial data');
        }

        // Save to database
        const { data: savedStatement, error: saveError } = await supabase
          .from('financial_statements')
          .insert({
            project_id: projectId,
            statement_type: extractionResult.data.statementType,
            file_name: file.name,
            extracted_data: extractionResult.data as any,
            total_revenue: extractionResult.data.totalRevenue || null,
            total_assets: extractionResult.data.totalAssets || null,
            total_liabilities: extractionResult.data.totalLiabilities || null
          })
          .select()
          .single();

        if (saveError) {
          throw new Error(`Failed to save financial statement: ${saveError.message}`);
        }

        // Update status to completed
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { 
            ...f, 
            status: 'completed', 
            data: extractionResult.data 
          } : f)
        );

        onFileProcessed(savedStatement.id, extractionResult.data);

        toast({
          title: "Financial statement processed",
          description: `${file.name} has been successfully analyzed.`
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { 
            ...f, 
            status: 'error', 
            error: errorMessage 
          } : f)
        );

        toast({
          title: "Processing failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }

    setIsUploading(false);
    event.target.value = '';
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const detectStatementType = (fileName: string): 'profit_loss' | 'balance_sheet' | 'cash_flow' => {
    const lower = fileName.toLowerCase();
    if (lower.includes('cash') || lower.includes('flow')) return 'cash_flow';
    if (lower.includes('balance') || lower.includes('position')) return 'balance_sheet';
    return 'profit_loss';
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'error':
        return <X className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
    }
  };

  return (
    <div className="space-y-4">
      {!hasApiKey && (
        <ApiKeyConfiguration onKeyConfigured={() => setHasApiKey(true)} />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Financial Statement Upload
            {hasApiKey && <CheckCircle className="w-4 h-4 text-success ml-auto" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Upload your financial statements (PDF, Word, Excel)
          </p>
          <Input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="financial-upload"
          />
          <Button 
            asChild 
            disabled={isUploading}
            variant="outline"
          >
            <label htmlFor="financial-upload" className="cursor-pointer">
              Choose Files
            </label>
          </Button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Uploaded Files</h4>
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="w-4 h-4" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getStatusIcon(file.status)}
                      <span>{getStatusText(file.status)}</span>
                      <span className="capitalize">({file.type.replace('_', ' ')})</span>
                    </div>
                    {file.error && (
                      <p className="text-xs text-destructive mt-1">{file.error}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  disabled={file.status === 'uploading' || file.status === 'processing'}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>Supported formats: PDF, Word (.doc, .docx), Excel (.xls, .xlsx)</p>
          <p>Maximum file size: 20MB per file</p>
          {hasApiKey && (
            <p className="text-success">✅ AI-powered table recognition enabled</p>
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
};