
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RefreshCcw, Database, Download, ClipboardCopy, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { chapter14Data } from '@/data/regulatoryData';

interface FormattedChapter14Entry {
  ruleNumber: string;
  title: string;
  content: string;
  chapter: string;
  section: string;
  categoryCode: string;
}

const Chapter14DataRetriever: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formattedData, setFormattedData] = useState<FormattedChapter14Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateMessage, setShowUpdateMessage] = useState(false);

  // Fetch Chapter 14 data from online source (placeholder for future implementation)
  const fetchChapter14Data = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This would be where we fetch from an API in the future
      // For now, let's simulate a network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Currently returns empty data since we removed sample data
      const sampleData: FormattedChapter14Entry[] = [];
      
      setFormattedData(sampleData);
      
      toast({
        title: 'Data Retrieved',
        description: `Found ${sampleData.length} entries for Chapter 14`,
      });
    } catch (err) {
      console.error('Error fetching Chapter 14 data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Chapter 14 data');
      toast({
        title: 'Error',
        description: 'Failed to retrieve Chapter 14 data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy data to clipboard
  const copyToClipboard = () => {
    try {
      const dataString = JSON.stringify(formattedData, null, 2);
      navigator.clipboard.writeText(dataString);
      toast({
        title: 'Copied',
        description: 'Chapter 14 data copied to clipboard',
      });
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast({
        title: 'Error',
        description: 'Failed to copy data to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Download data as JSON file
  const downloadJSON = () => {
    try {
      const dataString = JSON.stringify(formattedData, null, 2);
      const blob = new Blob([dataString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chapter14_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Downloaded',
        description: 'Chapter 14 data downloaded as JSON',
      });
    } catch (err) {
      console.error('Error downloading data:', err);
      toast({
        title: 'Error',
        description: 'Failed to download data',
        variant: 'destructive',
      });
    }
  };

  // Update the regulatoryData.ts file with the data
  const updateRegDataFile = () => {
    // Since we can't directly modify files here, we'll show instructions
    setShowUpdateMessage(true);
    copyToClipboard();
    
    toast({
      title: 'Information',
      description: 'To update the regulatoryData.ts file, data has been copied to clipboard. See instructions below.',
    });
  };

  return (
    <Card className="finance-card mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Chapter 14 Data Retriever
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <Button
            onClick={fetchChapter14Data}
            disabled={loading}
            className="bg-finance-medium-blue hover:bg-finance-dark-blue"
          >
            {loading ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Retrieving Data...
              </>
            ) : (
              <>Retrieve Chapter 14 Data</>
            )}
          </Button>
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {formattedData.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Retrieved {formattedData.length} entries from Chapter 14.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Button onClick={copyToClipboard} variant="outline">
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Copy as JSON
                </Button>
                <Button onClick={downloadJSON} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
                <Button onClick={updateRegDataFile} className="bg-finance-light-blue hover:bg-finance-medium-blue text-white">
                  <Database className="mr-2 h-4 w-4" />
                  Update Data File
                </Button>
              </div>
              
              {showUpdateMessage && (
                <Alert className="mt-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                  <AlertTitle className="text-blue-800 dark:text-blue-300">How to update the regulatoryData.ts file</AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-400">
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>Data has been copied to your clipboard</li>
                      <li>Open <code>src/data/regulatoryData.ts</code></li>
                      <li>Replace the <code>chapter14Data</code> array with this data</li>
                      <li>The format should match the required data structure</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}
              
              {formattedData.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Preview (First 3 entries)</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-60">
                    <pre className="text-xs">
                      {JSON.stringify(formattedData.slice(0, 3), null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Chapter14DataRetriever;
