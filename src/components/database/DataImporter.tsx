
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RefreshCcw, Database as DatabaseIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { databaseService } from '@/services/databaseService';
import { 
  chapter13Data, 
  chapter14Data, 
  chapter14AData,
  largeChapter13Dataset,
  largeChapter14Dataset,
  largeChapter14ADataset,
  combinedRegulatoryDataset
} from '@/data/regulatoryData';

interface DataImporterProps {
  onImportComplete?: () => void;
}

const DataImporter: React.FC<DataImporterProps> = ({ onImportComplete }) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [dataset, setDataset] = useState('chapter13');
  const [size, setSize] = useState('sample');
  
  const getSelectedDataset = () => {
    if (size === 'full') {
      return combinedRegulatoryDataset;
    }
    
    if (size === 'large') {
      if (dataset === 'chapter13') return largeChapter13Dataset;
      if (dataset === 'chapter14') return largeChapter14Dataset;
      if (dataset === 'chapter14A') return largeChapter14ADataset;
      if (dataset === 'all') {
        return [
          ...largeChapter13Dataset,
          ...largeChapter14Dataset,
          ...largeChapter14ADataset
        ];
      }
    } else { // sample
      if (dataset === 'chapter13') return chapter13Data;
      if (dataset === 'chapter14') return chapter14Data;
      if (dataset === 'chapter14A') return chapter14AData;
      if (dataset === 'all') {
        return [
          ...chapter13Data,
          ...chapter14Data,
          ...chapter14AData
        ];
      }
    }
    
    return [];
  };
  
  const handleImport = async () => {
    const dataToImport = getSelectedDataset();
    
    if (dataToImport.length === 0) {
      toast({
        title: 'Error',
        description: 'No data selected for import',
        variant: 'destructive',
      });
      return;
    }
    
    setIsImporting(true);
    
    try {
      toast({
        title: 'Import Started',
        description: `Importing ${dataToImport.length} entries. This may take a moment...`,
      });
      
      const result = await databaseService.bulkImportProvisions(dataToImport);
      
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.success} provisions. Failed: ${result.failed}`,
        variant: result.failed > 0 ? 'destructive' : 'default',
      });
      
      if (typeof onImportComplete === 'function') {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Unknown error during import',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <Card className="finance-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DatabaseIcon className="mr-2 h-5 w-5" />
          Regulatory Data Importer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dataset">Select Dataset</Label>
            <Select 
              value={dataset} 
              onValueChange={setDataset}
              disabled={isImporting}
            >
              <SelectTrigger id="dataset">
                <SelectValue placeholder="Select dataset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chapter13">Chapter 13 (Continuing Obligations)</SelectItem>
                <SelectItem value="chapter14">Chapter 14 (Notifiable Transactions)</SelectItem>
                <SelectItem value="chapter14A">Chapter 14A (Connected Transactions)</SelectItem>
                <SelectItem value="all">All Chapters</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="size">Dataset Size</Label>
            <Select 
              value={size} 
              onValueChange={setSize}
              disabled={isImporting}
            >
              <SelectTrigger id="size">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sample">Sample (5 per chapter)</SelectItem>
                <SelectItem value="large">Large (15-25 per chapter)</SelectItem>
                <SelectItem value="full">Full Dataset (60+ entries)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-2 pt-2">
          <div className="text-sm text-gray-500">
            {size === 'sample' && 'Sample dataset contains 5 entries per chapter for testing.'}
            {size === 'large' && 'Large dataset contains 15-25 entries per chapter with variations.'}
            {size === 'full' && 'Full dataset contains all available regulatory entries (60+).'}
          </div>
          
          <Button 
            onClick={handleImport}
            disabled={isImporting}
            className="w-full bg-finance-medium-blue hover:bg-finance-dark-blue"
          >
            {isImporting ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Importing Data...
              </>
            ) : (
              <>Import Selected Dataset</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataImporter;
