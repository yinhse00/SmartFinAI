
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedTransactionInputProps {
  onAnalyze: (data: {
    description: string;
    uploadedFiles: File[];
    extractedContent?: string[];
  }) => void;
  isAnalyzing?: boolean;
}

export const EnhancedTransactionInput = ({ onAnalyze, isAnalyzing = false }: EnhancedTransactionInputProps) => {
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid file types",
        description: "Only PDF, Word, Excel, and text files are supported.",
        variant: "destructive"
      });
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!description.trim() && uploadedFiles.length === 0) {
      toast({
        title: "Input required",
        description: "Please provide either a transaction description or upload documents.",
        variant: "destructive"
      });
      return;
    }

    onAnalyze({
      description,
      uploadedFiles
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Powered Transaction Advisory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transaction Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Transaction Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your transaction requirements in natural language. For example: 'We are planning a HK$500 million rights issue for our listed company. The company has 1 billion shares outstanding with a market cap of HK$8 billion. We need to raise funds for expansion and debt refinancing. The transaction should be completed within 3 months.'"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="resize-none"
          />
        </div>

        {/* Document Upload */}
        <div className="space-y-4">
          <Label>Upload Transaction Documents (Optional)</Label>
          
          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop your documents here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse files
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer">
                Browse Files
              </Button>
            </label>
            <p className="text-xs text-gray-400 mt-2">
              Supports: PDF, Word, Excel, Text files
            </p>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Documents</Label>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSubmit}
            disabled={isAnalyzing || (!description.trim() && uploadedFiles.length === 0)}
            className="flex items-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Analyze with AI</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
