
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
      
      // Format the data for import
      // In a real scenario, this would process data from the API
      const sampleData: FormattedChapter14Entry[] = [
        {
          ruleNumber: "14.01",
          title: "Preliminary",
          content: "This Chapter deals with certain transactions, principally acquisitions and disposals, by a listed issuer. It describes how they are classified, the details that are required to be disclosed in respect of them and whether they require shareholders' approval. It also considers additional requirements in respect of takeovers and mergers.",
          chapter: "Chapter 14",
          section: "14.01",
          categoryCode: "CH14"
        },
        {
          ruleNumber: "14.02",
          title: "Application of Chapter 14",
          content: "This Chapter applies to acquisitions and disposals by a listed issuer. This includes acquisition and disposal of any interest in any other company or entity, as well as transactions in relation to real estate, and even where the transaction is entered into by the listed issuer's subsidiaries.",
          chapter: "Chapter 14",
          section: "14.02",
          categoryCode: "CH14"
        },
        {
          ruleNumber: "14.06",
          title: "Classification and explanation of terms",
          content: "A listed issuer must determine the classification of a transaction using the percentage ratios set out in rule 14.07. The classifications are:— (1) share transaction — an acquisition of assets (excluding cash) by a listed issuer where the consideration includes securities for which listing will be sought and where all percentage ratios are less than 5%; (2) discloseable transaction — a transaction or a series of transactions (aggregated under rules 14.22 and 14.23) by a listed issuer where any percentage ratio is 5% or more, but less than 25%; (3) major transaction — a transaction or a series of transactions (aggregated under rules 14.22 and 14.23) by a listed issuer where any percentage ratio is 25% or more, but less than 100% for an acquisition or 75% for a disposal; (4) very substantial disposal — a disposal or a series of disposals (aggregated under rules 14.22 and 14.23) of assets (including deemed disposals referred to in rule 14.29) by a listed issuer where any percentage ratio is 75% or more; (5) very substantial acquisition — an acquisition or a series of acquisitions (aggregated under rules 14.22 and 14.23) of assets by a listed issuer where any percentage ratio is 100% or more; (6) reverse takeover — an acquisition or a series of acquisitions of assets by a listed issuer which, in the opinion of the Exchange, constitutes, or is part of a transaction or arrangement or series of transactions or arrangements which constitute, an attempt to achieve a listing of the assets to be acquired and a means to circumvent the requirements for new applicants set out in Chapter 8 of the Listing Rules.",
          chapter: "Chapter 14",
          section: "14.06",
          categoryCode: "CH14"
        },
        {
          ruleNumber: "14.07",
          title: "Percentage ratios",
          content: "The percentage ratios are the figures, expressed as percentages resulting from each of the following calculations:— (1) Assets ratio — the total assets which are the subject of the transaction divided by the total assets of the listed issuer; (2) Profits ratio — the profits attributable to the assets which are the subject of the transaction divided by the profits of the listed issuer; (3) Revenue ratio — the revenue attributable to the assets which are the subject of the transaction divided by the revenue of the listed issuer; (4) Consideration ratio — the consideration divided by the total market capitalisation of the listed issuer. The total market capitalisation is the average closing price of the listed issuer's securities as stated in the Exchange's daily quotations sheets for the five business days immediately preceding the date of the transaction; and (5) Equity capital ratio — the number of shares to be issued by the listed issuer as consideration divided by the total number of the listed issuer's issued shares immediately before the transaction.",
          chapter: "Chapter 14",
          section: "14.07",
          categoryCode: "CH14"
        },
        {
          ruleNumber: "14.22",
          title: "Aggregation of transactions",
          content: "In addition to the circumstances stated in rule 14.06(6)(b), the Exchange may require listed issuers to aggregate a series of transactions and treat them as if they were one transaction if they are all completed within a 12 month period or are otherwise related. In such cases, the listed issuer must comply with the requirements for the relevant classification of the transaction when aggregated and the figures to be used for determining the percentage ratios are those as shown in the listed issuer's accounts for the relevant period.",
          chapter: "Chapter 14",
          section: "14.22",
          categoryCode: "CH14"
        }
      ];
      
      setFormattedData(sampleData);
      
      toast({
        title: 'Data Retrieved',
        description: `Found ${sampleData.length} sample entries for Chapter 14`,
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
              <>Retrieve Sample Chapter 14 Data</>
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
                Retrieved {formattedData.length} sample entries from Chapter 14.
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
                      <li>The format should match the sample data structure</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Preview (First 3 entries)</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-60">
                  <pre className="text-xs">
                    {JSON.stringify(formattedData.slice(0, 3), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Chapter14DataRetriever;
