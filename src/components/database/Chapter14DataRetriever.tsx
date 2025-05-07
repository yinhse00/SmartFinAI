
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RefreshCcw, Database, Download, ClipboardCopy, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { chapter14Data } from '@/data/regulatoryData';
import { supabase } from '@/integrations/supabase/client';
import { databaseService } from '@/services/databaseService';

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

  // Fetch Chapter 14 data from Supabase
  const fetchChapter14Data = async () => {
    setLoading(true);
    setError(null);
    
    try {
      toast({
        title: 'Fetching Data',
        description: 'Retrieving Chapter 14 data from SmartFinAI database...',
      });
      
      const { data: provisions, error } = await supabase
        .from('regulatory_provisions')
        .select(`
          id,
          rule_number,
          title,
          content,
          chapter,
          section,
          regulatory_categories(code)
        `)
        .eq('chapter', 'Chapter 14')
        .order('rule_number');
        
      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      // Format the retrieved data
      const formattedProvisions: FormattedChapter14Entry[] = provisions.map(item => ({
        ruleNumber: item.rule_number,
        title: item.title || '',
        content: item.content || '',
        chapter: item.chapter || 'Chapter 14',
        section: item.section || '',
        categoryCode: item.regulatory_categories?.code || 'CH14'
      }));
      
      setFormattedData(formattedProvisions);
      
      toast({
        title: 'Data Retrieved',
        description: `Found ${formattedProvisions.length} entries for Chapter 14`,
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
  
  // Load sample data into Supabase
  const loadSampleDataToSupabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      toast({
        title: 'Loading Data',
        description: 'Loading sample Chapter 14 data to SmartFinAI database...',
      });
      
      // Create sample data entries
      const sampleData = [
        {
          ruleNumber: '14.44',
          title: 'Connected Transaction Definition',
          content: 'A connected transaction is a transaction between a listed issuer's group and a connected person.',
          chapter: 'Chapter 14',
          section: '14.44',
          categoryCode: 'CH14'
        },
        {
          ruleNumber: '14.06',
          title: 'Percentage Ratios',
          content: 'The percentage ratios are the figures, expressed as percentages resulting from each of the following calculations: (1) Assets ratio; (2) Profits ratio; (3) Revenue ratio; (4) Consideration ratio; and (5) Equity capital ratio.',
          chapter: 'Chapter 14',
          section: '14.06',
          categoryCode: 'CH14'
        },
        {
          ruleNumber: '14.07',
          title: 'Assets Ratio',
          content: 'The assets ratio is the ratio of the total assets which are the subject of the transaction to the total assets of the listed issuer.',
          chapter: 'Chapter 14',
          section: '14.07',
          categoryCode: 'CH14'
        }
      ];
      
      // Import data to Supabase using the database service
      const result = await databaseService.bulkImportProvisions(
        sampleData.map(entry => ({
          ruleNumber: entry.ruleNumber,
          title: entry.title,
          content: entry.content,
          chapter: entry.chapter,
          section: entry.section,
          categoryCode: entry.categoryCode
        }))
      );
      
      toast({
        title: 'Sample Data Loaded',
        description: `Successfully loaded ${result.success} sample entries. Failed: ${result.failed}`,
        variant: result.failed > 0 ? 'destructive' : 'default',
      });
      
      // Fetch the newly loaded data
      await fetchChapter14Data();
    } catch (err) {
      console.error('Error loading sample data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sample data');
      toast({
        title: 'Error',
        description: 'Failed to load sample data to database',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
        <div className="flex flex-wrap gap-4">
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
          
          <Button
            onClick={loadSampleDataToSupabase}
            disabled={loading}
            className="bg-finance-light-blue hover:bg-finance-medium-blue"
          >
            {loading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Loading Sample Data...
              </>
            ) : (
              <>Load Sample Data</>
            )}
          </Button>
        </div>
        
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
      </CardContent>
    </Card>
  );
};

export default Chapter14DataRetriever;
