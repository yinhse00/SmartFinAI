
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { announcementVettingService } from '@/services/vetting/announcementVettingService';
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
  
  // Get reference documents
  const { data: documents, isLoading } = useReferenceDocuments();
  
  // Find the pre-vetting guide document
  const vettingGuideDoc = documents?.find(doc => 
    doc.title.toLowerCase().includes('pre-vetting') && 
    doc.title.toLowerCase().includes('guide') && 
    doc.title.toLowerCase().includes('announcement')
  );
  
  const processVettingGuide = async () => {
    if (!vettingGuideDoc) {
      setError('Vetting guide document not found. Please upload the "Guide on pre-vetting requirements and selection of headline categories for announcements.xls" file.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const success = await announcementVettingService.parseAndUpdateVettingRequirements(vettingGuideDoc.id);
      if (success) {
        setProcessed(true);
        toast({
          title: "Vetting requirements updated",
          description: "Successfully processed the vetting requirements document.",
        });
        if (onProcessComplete) {
          onProcessComplete();
        }
      } else {
        setError("Failed to process the vetting requirements document. Please try again or check the console for errors.");
      }
    } catch (err) {
      console.error('Error processing vetting guide:', err);
      setError(`Processing error: ${err instanceof Error ? err.message : String(err)}`);
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
            
            {processed && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Processing complete</AlertTitle>
                <AlertDescription className="text-green-700">
                  Successfully processed the vetting requirements document.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Document not found</AlertTitle>
            <AlertDescription>
              Please upload the "Guide on pre-vetting requirements and selection of headline categories for announcements.xls" file to the References section.
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
              <span className="mr-2">Processing...</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : processed ? 'Reprocess Document' : 'Process Vetting Guide'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VettingRequirementsProcessor;
