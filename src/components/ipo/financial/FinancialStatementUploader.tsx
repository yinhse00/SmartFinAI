import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { financialDataExtractor, FinancialData } from '@/services/financial/financialDataExtractor';
import { supabase } from '@/integrations/supabase/client';
import { aiDocumentStructureAnalyzer } from '@/services/financial/aiDocumentStructureAnalyzer';
import { documentStructureService } from '@/services/financial/documentStructureService';
import { grokService } from '@/services/grokService';

interface FinancialStatementUploaderProps {
  projectId: string;
  onFileProcessed: (statementId: string, data: FinancialData, documentContent?: string) => void;
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
  const { validateFiles } = useFileUpload();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!validateFiles(files)) return;

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

        // Extract text content from document
        const documentContent = await grokService.extractDocumentText(file);
        
        // Step 1: Discover document structure using AI
        console.log('🔍 Analyzing document structure with AI...');
        const analysisResult = await aiDocumentStructureAnalyzer.analyzeDocumentStructure(
          documentContent,
          file.name
        );
        
        console.log('✓ Document analysis complete:', {
          quality: analysisResult.quality.overall,
          contentBlocks: analysisResult.structure.contentBlocks.length,
          crossReferences: analysisResult.structure.crossReferences.length,
          processingTime: `${analysisResult.processingTime}ms`
        });

        // Step 2: Extract financial data (existing logic)
        const extractionResult = await financialDataExtractor.extractFinancialData(file);
        
        if (!extractionResult.success || !extractionResult.data) {
          throw new Error(extractionResult.error || 'Failed to extract financial data');
        }

        // Step 3: Save to database
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

        // Step 4: Save AI-discovered structure
        console.log('💾 Saving document structure to database...');
        await documentStructureService.saveContentBlocks(
          savedStatement.id,
          analysisResult.structure.contentBlocks
        );
        
        await documentStructureService.saveCrossReferences(
          savedStatement.id,
          analysisResult.structure.crossReferences
        );

        // Update status to completed
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { 
            ...f, 
            status: 'completed', 
            data: extractionResult.data 
          } : f)
        );

        onFileProcessed(savedStatement.id, extractionResult.data, documentContent);

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Financial Statement Upload
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
        </div>
      </CardContent>
    </Card>
  );
};