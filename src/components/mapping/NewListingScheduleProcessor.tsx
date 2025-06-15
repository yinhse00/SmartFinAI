import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Loader2, FileSpreadsheet, CheckCircle2, AlertCircle, Building } from 'lucide-react';
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
    fileType: string;
  };
}

const NewListingScheduleProcessor: React.FC<ProcessorProps> = ({ onProcessComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  
  // Get reference documents (disabled)
  const documents: any[] | undefined = [];
  const isLoading = false;
  
  // Find the new listing applicants mapping schedule document
  const newListingDoc = documents?.find(doc => 
    doc.title.toLowerCase().includes('guide for new listing applicants')
  );
  
  const processNewListingSchedule = async () => {
    if (!newListingDoc) {
      setError('New listing applicants mapping schedule document not found. Please upload the "Mapping_Schedule_(EN)_(2024)_Guide for New Listing Applicants" file.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setProcessingResult(null);
    
    try {
      console.log('Starting new listing applicants mapping schedule parsing...');
      
      const { data, error } = await supabase.functions.invoke('parse-new-listing-schedule', {
        body: { fileId: newListingDoc.id }
      });
      
      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to process the new listing applicants mapping schedule document');
      }
      
      if (data.success) {
        setProcessed(true);
        setProcessingResult(data);
        toast({
          title: "New listing schedule parsed successfully",
          description: `Extracted ${data.data.totalGuidance} guidance entries for new listing applicants`,
        });
        if (onProcessComplete) {
          onProcessComplete();
        }
      } else {
        throw new Error(data.error || 'Unknown error occurred during parsing');
      }
    } catch (err) {
      console.error('Error processing new listing schedule:', err);
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
          <Building className="h-5 w-5" />
          New Listing Applicants Parser
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : newListingDoc ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Excel file found</AlertTitle>
              <AlertDescription className="text-green-700">
                Found document: <span className="font-medium">{newListingDoc.title}</span>
                <br />
                <span className="text-sm text-green-600">Ready to extract new listing applicant requirements and guidance</span>
              </AlertDescription>
            </Alert>
            
            {processed && processingResult && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Parsing completed successfully</AlertTitle>
                <AlertDescription className="text-green-700">
                  <div className="space-y-2">
                    <div><strong>Total guidance entries extracted:</strong> {processingResult.data.totalGuidance}</div>
                    <div><strong>Guidance entries inserted:</strong> {processingResult.data.insertedGuidance}</div>
                    <div><strong>File type:</strong> {processingResult.data.fileType}</div>
                    
                    {processingResult.data.sampleGuidance && processingResult.data.sampleGuidance.length > 0 && (
                      <div className="mt-3">
                        <div className="font-semibold">Sample extracted new listing guidance:</div>
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
              Please upload the "Mapping_Schedule_(EN)_(2024)_Guide for New Listing Applicants" file.
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
          onClick={processNewListingSchedule} 
          disabled={isProcessing || !newListingDoc}
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
        >
          {isProcessing ? (
            <>
              <span className="mr-2">Parsing Excel File...</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : processed ? 'Re-parse New Listing Schedule' : 'Parse New Listing Schedule'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewListingScheduleProcessor;
