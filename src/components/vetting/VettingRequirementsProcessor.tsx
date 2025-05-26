
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ProcessorProps {
  onProcessComplete?: () => void;
}

const VettingRequirementsProcessor: React.FC<ProcessorProps> = ({ onProcessComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);
  
  // Get reference documents
  const { data: documents, isLoading } = useReferenceDocuments();
  
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
      console.log('Calling Edge Function to parse Excel file...');
      
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
          title: "Vetting requirements updated",
          description: `Successfully processed ${data.count} vetting requirements from the Excel file.`,
        });
        if (onProcessComplete) {
          onProcessComplete();
        }
      } else {
        throw new Error(data.error || 'Unknown error occurred during processing');
      }
    } catch (err) {
      console.error('Error processing vetting guide:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Processing error: ${errorMessage}`);
      toast({
        title: "Processing failed",
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
        <CardTitle className="text-xl font-semibold">Vetting Requirements Processor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : vettingGuideDoc ? (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Found vetting guide document</AlertTitle>
              <AlertDescription className="text-blue-700">
                Found document: <span className="font-medium">{vettingGuideDoc.title}</span>
              </AlertDescription>
            </Alert>
            
            {processed && processingResult && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Processing complete</AlertTitle>
                <AlertDescription className="text-green-700">
                  Successfully processed {processingResult.count} vetting requirements from the Excel file.
                  {processingResult.requirements && (
                    <div className="mt-2">
                      <span className="font-semibold">Sample categories processed:</span>
                      <ul className="list-disc list-inside mt-1">
                        {processingResult.requirements.slice(0, 3).map((req: any, index: number) => (
                          <li key={index} className="text-sm">
                            {req.headline_category} - {req.is_vetting_required ? 'Pre-vetting required' : 'Post-vetting only'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Document not found</AlertTitle>
            <AlertDescription>
              Please upload the "Guide on pre-vetting requirements and selection of headline categories for announcements (2025.5.23).xls" file to the References section.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Processing failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
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
              <span className="mr-2">Processing Excel File...</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : processed ? 'Reprocess Excel File' : 'Parse Excel File to Database'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VettingRequirementsProcessor;
