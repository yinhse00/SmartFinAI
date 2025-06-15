import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Loader2, FileSpreadsheet, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ProcessorProps {
  onProcessComplete?: () => void;
}

interface ProcessingResult {
  success: boolean;
  data: {
    totalFAQs: number;
    totalGuidance: number;
    insertedFAQs: number;
    insertedGuidance: number;
    sampleFAQs: any[];
    sampleGuidance: any[];
  };
}

const MappingScheduleProcessor: React.FC<ProcessorProps> = ({ onProcessComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  
  // Get reference documents (disabled)
  const documents: any[] | undefined = [];
  const isLoading = false;
  
  // Find the mapping schedule document
  const mappingDoc = documents?.find(doc => 
    doc.title.toLowerCase().includes('mapping_schedule_faq_guidance') && 
    doc.title.toLowerCase().includes('listed issuers')
  );
  
  const processMappingSchedule = async () => {
    if (!mappingDoc) {
      setError('Mapping schedule document not found. Please upload the "Mapping_schedule_FAQ_Guidance Materials for Listed Issuers.xlsx" file.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setProcessingResult(null);
    
    try {
      console.log('Starting mapping schedule parsing...');
      
      const { data, error } = await supabase.functions.invoke('parse-mapping-schedule', {
        body: { fileId: mappingDoc.id }
      });
      
      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to process the mapping schedule document');
      }
      
      if (data.success) {
        setProcessed(true);
        setProcessingResult(data);
        toast({
          title: "Mapping schedule parsed successfully",
          description: `Extracted ${data.data.totalFAQs} FAQs and ${data.data.totalGuidance} guidance entries`,
        });
        if (onProcessComplete) {
          onProcessComplete();
        }
      } else {
        throw new Error(data.error || 'Unknown error occurred during parsing');
      }
    } catch (err) {
      console.error('Error processing mapping schedule:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Parsing failed: ${errorMessage}`);
      toast({
        title: "Parsing failed",
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
          <BookOpen className="h-5 w-5" />
          Mapping Schedule Parser
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : mappingDoc ? (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Excel file found</AlertTitle>
              <AlertDescription className="text-blue-700">
                Found document: <span className="font-medium">{mappingDoc.title}</span>
                <br />
                <span className="text-sm text-blue-600">Ready to extract FAQs and guidance materials</span>
              </AlertDescription>
            </Alert>
            
            {processed && processingResult && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Parsing completed successfully</AlertTitle>
                <AlertDescription className="text-green-700">
                  <div className="space-y-2">
                    <div><strong>Total FAQs extracted:</strong> {processingResult.data.totalFAQs}</div>
                    <div><strong>Total guidance entries extracted:</strong> {processingResult.data.totalGuidance}</div>
                    <div><strong>FAQs inserted:</strong> {processingResult.data.insertedFAQs}</div>
                    <div><strong>Guidance entries inserted:</strong> {processingResult.data.insertedGuidance}</div>
                    
                    {processingResult.data.sampleFAQs && processingResult.data.sampleFAQs.length > 0 && (
                      <div className="mt-3">
                        <div className="font-semibold">Sample extracted FAQs:</div>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {processingResult.data.sampleFAQs.slice(0, 3).map((faq: any, index: number) => (
                            <li key={index} className="text-sm">
                              <span className="font-medium">{faq.question.substring(0, 80)}...</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {processingResult.data.sampleGuidance && processingResult.data.sampleGuidance.length > 0 && (
                      <div className="mt-3">
                        <div className="font-semibold">Sample extracted guidance:</div>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {processingResult.data.sampleGuidance.slice(0, 3).map((guidance: any, index: number) => (
                            <li key={index} className="text-sm">
                              <span className="font-medium">{guidance.title}</span>
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
              Please upload the "Mapping_schedule_FAQ_Guidance Materials for Listed Issuers.xlsx" file.
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
          onClick={processMappingSchedule} 
          disabled={isProcessing || !mappingDoc}
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
        >
          {isProcessing ? (
            <>
              <span className="mr-2">Parsing Excel File...</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : processed ? 'Re-parse Mapping Schedule' : 'Parse Mapping Schedule'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MappingScheduleProcessor;
