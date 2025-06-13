
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Upload, TrendingUp, FileText } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { fileProcessingService } from '@/services/documents/fileProcessingService';
import { OptimizationPreferences } from './OptimizationPreferences';
import { OptimizationParameters } from '@/services/dealStructuring/optimizationEngine';

interface EnhancedTransactionInputProps {
  onAnalyze: (data: {
    description: string;
    uploadedFiles: File[];
    extractedContent?: string[];
    optimizationParameters?: OptimizationParameters;
  }) => void;
  isAnalyzing: boolean;
}

export const EnhancedTransactionInput: React.FC<EnhancedTransactionInputProps> = ({
  onAnalyze,
  isAnalyzing
}) => {
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('HKD');
  
  // Default optimization parameters
  const [optimizationParams, setOptimizationParams] = useState<OptimizationParameters>({
    priority: 'control',
    riskTolerance: 'medium',
    timeConstraints: 'normal',
    budgetConstraints: 'moderate',
    strategicObjectives: ['value creation'],
    marketConditions: 'neutral'
  });

  const {
    files,
    uploadFile,
    removeFile,
    isUploading,
    uploadProgress
  } = useFileUpload();

  const [extractedContent, setExtractedContent] = useState<string[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    for (const file of selectedFiles) {
      await uploadFile(file);
      
      // Extract content from uploaded files
      try {
        const content = await fileProcessingService.processFile(file);
        if (content.content) {
          setExtractedContent(prev => [...prev, content.content]);
        }
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }
  };

  const handleAnalyze = () => {
    // Build enhanced description with transaction details
    let enhancedDescription = description;
    
    if (transactionType) {
      enhancedDescription = `Transaction Type: ${transactionType}\n\n${enhancedDescription}`;
    }
    
    if (amount) {
      enhancedDescription = `Transaction Amount: ${currency} ${amount}\n\n${enhancedDescription}`;
    }

    onAnalyze({
      description: enhancedDescription,
      uploadedFiles: files,
      extractedContent,
      optimizationParameters: optimizationParams
    });
  };

  const isReadyToAnalyze = description.trim().length > 20;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Enhanced Transaction Analysis & Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Basic Details
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="optimization" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Optimization
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction-type">Transaction Type</Label>
                  <Select value={transactionType} onValueChange={setTransactionType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merger">Merger</SelectItem>
                      <SelectItem value="acquisition">Acquisition</SelectItem>
                      <SelectItem value="rights-issue">Rights Issue</SelectItem>
                      <SelectItem value="open-offer">Open Offer</SelectItem>
                      <SelectItem value="takeover-offer">Takeover Offer</SelectItem>
                      <SelectItem value="spin-off">Spin-off</SelectItem>
                      <SelectItem value="ipo">IPO</SelectItem>
                      <SelectItem value="capital-reorganization">Capital Reorganization</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Transaction Value</Label>
                  <div className="flex gap-2">
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HKD">HKD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="RMB">RMB</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="amount"
                      placeholder="e.g., 100000000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      type="number"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Transaction Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your transaction in detail. Include objectives, constraints, timeline requirements, and any specific considerations..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <div className="text-sm text-gray-500">
                  {description.length}/500+ characters recommended for comprehensive analysis
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Upload Supporting Documents</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload term sheets, agreements, financial statements, or other relevant documents
                  </p>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-700">Click to upload files</p>
                      <p className="text-sm text-gray-500">PDF, Word, Excel, or text files</p>
                    </label>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files</Label>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {extractedContent.length > 0 && (
                  <div className="space-y-2">
                    <Label>Extracted Content Preview</Label>
                    <div className="max-h-32 overflow-y-auto p-3 bg-gray-50 rounded-lg text-sm">
                      {extractedContent.map((content, index) => (
                        <div key={index} className="mb-2">
                          <strong>Document {index + 1}:</strong> {content.substring(0, 200)}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="optimization">
              <OptimizationPreferences
                preferences={optimizationParams}
                onPreferencesChange={setOptimizationParams}
              />
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t">
            <Button
              onClick={handleAnalyze}
              disabled={!isReadyToAnalyze || isAnalyzing || isUploading}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Brain className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing with AI Optimization...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze & Optimize Transaction
                </>
              )}
            </Button>
            
            {!isReadyToAnalyze && (
              <p className="text-sm text-gray-500 text-center mt-2">
                Please provide a detailed transaction description to begin analysis
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
