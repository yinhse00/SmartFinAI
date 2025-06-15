import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Loader2, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ProcessorProps {
  onProcessComplete?: () => void;
}

interface ProcessingResult {
  success: boolean;
  count: number;
  requirements: any[];
  summary: {
    totalRecords: number;
    requiringVetting: number;
    notRequiringVetting: number;
  };
}

const VettingRequirementsProcessor: React.FC<ProcessorProps> = ({ onProcessComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  
  // Get reference documents (disabled)
  const documents: any[] | undefined = [];
  const isLoading = false;
  
  // Find the pre-vetting guide document
  const vettingGuideDoc = documents?.find(doc => 
    doc.title.toLowerCase().includes('pre-vetting') && 
    doc.title.toLowerCase().includes('guide') && 
    doc.title.toLowerCase().includes('announcement') &&
    doc.title.includes('2025.5.23')
  );
  
  const processVettingGuide = async () => {
    if (!vettingGuideDoc) {
      setError('Vetting guide document not found. Please upload the "Guide on pre-vetting requirements and selection of headline categories for announcements (2025.5.23).xls" file.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setProcessingResult(null);
    
    try {
      console.log('Starting Excel parsing with improved SheetJS implementation...');
      
      const { data, error } = await supabase.functions.invoke('parse-vetting-requirements', {
        body: { fileId: vettingGuideDoc.id }
      });
      
      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to process the vetting requirements document');
      }
      
      if (data.success) {
        setProcessed(true);
        setProcessingResult(data);
        toast({
          title: "Excel parsing completed successfully",
          description: `Extracted ${data.count} vetting requirements. Pre-vetting required: ${data.summary?.requiringVetting || 0}, Post-vetting only: ${data.summary?.notRequiringVetting || 0}`,
        });
        if (onProcessComplete) {
          onProcessComplete();
        }
      } else {
        throw new Error(data.error || 'Unknown error occurred during Excel parsing');
      }
    } catch (err) {
      console.error('Error processing Excel file:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Excel parsing failed: ${errorMessage}`);
      toast({
        title: "Excel parsing failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Card className="finance-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Excel Vetting Requirements Parser
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : vettingGuideDoc ? (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Excel file found</AlertTitle>
              <AlertDescription className="text-blue-700">
                Found document: <span className="font-medium">{vettingGuideDoc.title}</span>
                <br />
                <span className="text-sm text-blue-600">Ready to parse with enhanced SheetJS implementation</span>
              </AlertDescription>
            </Alert>
            
            {processed && processingResult && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Parsing completed successfully</AlertTitle>
                <AlertDescription className="text-green-700">
                  <div className="space-y-2">
                    <div><strong>Total records extracted:</strong> {processingResult.count}</div>
                    <div><strong>Pre-vetting required:</strong> {processingResult.summary?.requiringVetting || 0}</div>
                    <div><strong>Post-vetting only:</strong> {processingResult.summary?.notRequiringVetting || 0}</div>
                    
                    {processingResult.requirements && processingResult.requirements.length > 0 && (
                      <div className="mt-3">
                        <div className="font-semibold">Sample extracted categories:</div>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {processingResult.requirements.slice(0, 5).map((req: any, index: number) => (
                            <li key={index} className="text-sm">
                              <span className="font-medium">{req.headline_category}</span> - 
                              <span className={req.is_vetting_required ? 'text-red-600' : 'text-green-600'}>
                                {req.is_vetting_required ? ' Pre-vetting required' : ' Post-vetting only'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Excel file not found</AlertTitle>
            <AlertDescription>
              Please upload the "Guide on pre-vetting requirements and selection of headline categories for announcements (2025.5.23).xls" file to the References section first.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Parsing failed</AlertTitle>
            <AlertDescription>
              <div className="space-y-1">
                <div>{error}</div>
                <div className="text-sm text-gray-600">
                  Check the Edge Function logs for detailed error information.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={processVettingGuide} 
          disabled={isProcessing || !vettingGuideDoc}
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
        >
          {isProcessing ? (
            <>
              <span className="mr-2">Parsing Excel File...</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : processed ? 'Re-parse Excel File' : 'Parse Excel File with SheetJS'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VettingRequirementsProcessor;
