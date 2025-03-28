
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ResponseGenerator = () => {
  const [responseType, setResponseType] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState<string | null>(null);

  const handleGenerateResponse = async () => {
    if (!responseType) {
      toast({
        title: "Response type required",
        description: "Please select a response type.",
        variant: "destructive",
      });
      return;
    }

    if (!promptText.trim()) {
      toast({
        title: "Prompt required",
        description: "Please provide details about what response you need.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedResponse(null);

    try {
      // Here we would call the Grok API
      // For demo purposes, we'll simulate a response
      
      // In a real implementation, this would be:
      // const response = await fetch('your-api-endpoint', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': 'Bearer xai-d5jFAjxz2xujjhKYObAGbLFFGrxrM6DSUmOgQCoobSYJe6PWWgjJbgwZYJ190bAH9gniRNcMjezY4qi6'
      //   },
      //   body: JSON.stringify({
      //     prompt: promptText,
      //     responseType: responseType,
      //   })
      // });
      // const data = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Sample response 
      const sampleResponse = 
        "Based on the Hong Kong Listing Rules Chapter 14, specifically Rule 14.34, " +
        "the transaction described constitutes a Discloseable Transaction as the applicable percentage " +
        "ratios exceed 5% but are less than 25%.\n\n" +
        "The issuer must follow these steps:\n\n" +
        "1. Make an announcement as soon as possible after terms have been finalized\n" +
        "2. Include all required disclosure items outlined in Rule 14.58\n" +
        "3. Provide the Stock Exchange with a draft announcement for review\n\n" +
        "No circular or shareholders' approval is required for this transaction level.";
      
      setGeneratedResponse(sampleResponse);
      
      toast({
        title: "Response generated",
        description: "Your regulatory response has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was an error generating your response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadWord = () => {
    if (!generatedResponse) return;
    
    // In a real implementation, this would call a backend endpoint to generate a Word doc
    // For this demo, we'll just show a success message
    toast({
      title: "Word document generated",
      description: "Your response has been downloaded as a Word document.",
    });
  };

  return (
    <Card className="finance-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Generate Regulatory Response</CardTitle>
        <CardDescription>
          Create professional responses to regulatory inquiries or comments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="response-type">Response Type</Label>
            <Select value={responseType} onValueChange={setResponseType}>
              <SelectTrigger id="response-type">
                <SelectValue placeholder="Select a response type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="listing_comment_response">Listing Comment Response</SelectItem>
                <SelectItem value="takeover_comment_response">Takeover Comment Response</SelectItem>
                <SelectItem value="compliance_explanation">Compliance Explanation</SelectItem>
                <SelectItem value="disclosure_enhancement">Disclosure Enhancement</SelectItem>
                <SelectItem value="waiver_application">Waiver Application</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Response Details</Label>
            <Textarea 
              id="prompt" 
              placeholder="Describe the regulatory comment or issue that needs a response..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="resize-none"
              rows={5}
            />
          </div>
        </div>

        {generatedResponse && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Generated Response</h4>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleDownloadWord}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download as Word</span>
              </Button>
            </div>
            <div className="p-4 rounded-md bg-gray-50 dark:bg-finance-dark-blue/20 text-sm whitespace-pre-line">
              {generatedResponse}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleGenerateResponse} 
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>Generate Response</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResponseGenerator;
