
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RefreshCcw, Database, Download, ClipboardCopy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Chapter14Entry {
  id: string;
  rule_number: string;
  title: string;
  content: string;
  chapter: string;
  section: string;
  category_id: string;
  last_updated: string;
  is_current: boolean;
}

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
  const [entries, setEntries] = useState<Chapter14Entry[]>([]);
  const [formattedData, setFormattedData] = useState<FormattedChapter14Entry[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch category mappings first
  const fetchCategories = async () => {
    try {
      const { data: categories, error } = await supabase
        .from('regulatory_categories')
        .select('id, code');
        
      if (error) {
        throw error;
      }
      
      const categoryMap: Record<string, string> = {};
      categories.forEach(cat => {
        categoryMap[cat.id] = cat.code;
      });
      
      setCategoryMap(categoryMap);
      return categoryMap;
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch category mappings');
      return {};
    }
  };

  // Fetch Chapter 14 data
  const fetchChapter14Data = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get categories first
      const catMap = await fetchCategories();
      
      // Then fetch regulatory provisions for Chapter 14
      const { data, error } = await supabase
        .from('regulatory_provisions')
        .select('*')
        .eq('chapter', 'Chapter 14');
      
      if (error) {
        throw error;
      }
      
      setEntries(data || []);
      
      // Format the data for import
      const formatted = (data || []).map(entry => ({
        ruleNumber: entry.rule_number,
        title: entry.title,
        content: entry.content,
        chapter: entry.chapter || 'Chapter 14',
        section: entry.section || entry.rule_number,
        categoryCode: catMap[entry.category_id] || 'CH14'
      }));
      
      setFormattedData(formatted);
      
      toast({
        title: 'Data Retrieved',
        description: `Found ${formatted.length} entries for Chapter 14`,
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

  // Update the regulatoryData.ts file directly
  const updateRegDataFile = () => {
    // This function can't directly modify files, but we'll show how the data should be structured
    toast({
      title: 'Information',
      description: 'To update the regulatoryData.ts file, copy the formatted data from clipboard and replace the chapter14Data array in the file.',
    });
    copyToClipboard();
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
