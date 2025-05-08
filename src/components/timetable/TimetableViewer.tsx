import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, File, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useFileProcessing } from '@/hooks/useFileProcessing';

interface TimetableEntry {
  day: number;
  date: string;
  event: string;
  description?: string;
  status?: 'pending' | 'completed' | 'upcoming';
}

interface TimetableData {
  title: string;
  referenceDate: string;
  entries: TimetableEntry[];
}

const TimetableViewer: React.FC = () => {
  const { toast } = useToast();
  const { processFiles, isProcessing } = useFileProcessing();
  const [timetableData, setTimetableData] = useState<TimetableData>({
    title: "Financial Transaction Timetable (Processing...)",
    referenceDate: "2025-05-07",
    entries: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch timetable from Supabase on component mount
  useEffect(() => {
    fetchTimetableDocument();
  }, []);

  const fetchTimetableDocument = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Search for Timetable document in the reference_documents table
      const { data: documents, error: docError } = await supabase
        .from('reference_documents')
        .select('*')
        .or('title.ilike.%Timetable%,file_path.ilike.%Timetable%')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (docError) {
        throw new Error(docError.message);
      }
      
      if (!documents || documents.length === 0) {
        setTimetableData({
          title: "Financial Transaction Timetable (May 7, 2025)",
          referenceDate: "2025-05-07",
          entries: getDefaultTimetableEntries() // Fallback to default entries
        });
        setIsLoading(false);
        return;
      }

      // Found a timetable document, now process it
      const timetableDoc = documents[0];
      
      // Create a File object from the document URL
      const response = await fetch(timetableDoc.file_url);
      const blob = await response.blob();
      const file = new File([blob], timetableDoc.title || "Timetable20250507.docx");
      
      // Process the file - Fixed: Pass file as an array
      const processedResults = await processFiles([file]);
      
      if (processedResults && processedResults.length > 0) {
        // Extract timetable data from processed content
        const extractedContent = processedResults[0].content;
        const parsedTimetable = parseTimetableContent(extractedContent);
        
        if (parsedTimetable) {
          setTimetableData(parsedTimetable);
        } else {
          // If parsing failed, use default data
          setTimetableData({
            title: timetableDoc.title || "Financial Transaction Timetable",
            referenceDate: "2025-05-07",
            entries: getDefaultTimetableEntries()
          });
        }
      }
    } catch (err) {
      console.error("Error fetching timetable document:", err);
      setError("Could not load timetable data from database. Using default timetable.");
      
      // Use default data if there's an error
      setTimetableData({
        title: "Financial Transaction Timetable (May 7, 2025)",
        referenceDate: "2025-05-07",
        entries: getDefaultTimetableEntries()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get default timetable entries
  const getDefaultTimetableEntries = (): TimetableEntry[] => {
    return [
      {
        day: 0,
        date: "Wed, May 7, 2025",
        event: "Board Meeting and Announcement",
        description: "Board approves the transaction and issues announcement",
        status: 'completed'
      },
      {
        day: 1,
        date: "Thu, May 8, 2025",
        event: "Submit Draft Circular to HKEX",
        description: "First draft circular submitted for regulatory review",
        status: 'upcoming'
      },
      {
        day: 14,
        date: "Wed, May 21, 2025",
        event: "Expected Regulatory Feedback",
        description: "First round of comments from HKEX expected",
        status: 'upcoming'
      },
      {
        day: 28,
        date: "Wed, June 4, 2025",
        event: "EGM Notice & Despatch Circular",
        description: "Circular finalized and sent to shareholders",
        status: 'upcoming'
      },
      {
        day: 42,
        date: "Wed, June 18, 2025",
        event: "Extraordinary General Meeting",
        description: "Shareholders vote on the proposed transaction",
        status: 'upcoming'
      },
      {
        day: 44,
        date: "Fri, June 20, 2025",
        event: "Results Announcement",
        description: "Publication of EGM results and next steps",
        status: 'upcoming'
      }
    ];
  };

  // Parse timetable content from extracted document text
  const parseTimetableContent = (content: string): TimetableData | null => {
    try {
      // Look for dates in format like "Wed, May 7, 2025" or "May 7, 2025"
      const dateRegex = /(?:\w{3}, )?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/g;
      const dates = content.match(dateRegex) || [];
      
      // Look for title
      let title = "Financial Transaction Timetable";
      const titleMatch = content.match(/(?:Transaction|Timetable|Schedule)(?:\s+for\s+|\s*[-:]\s*|\s+of\s+)?([^\n.]+)/i);
      if (titleMatch && titleMatch[0]) {
        title = titleMatch[0].trim();
      }
      
      // Find reference date
      let referenceDate = "2025-05-07";
      const refDateMatch = content.match(/(?:Reference|Start)\s+[Dd]ate:?\s+((?:\w{3}, )?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})/);
      if (refDateMatch && refDateMatch[1]) {
        referenceDate = refDateMatch[1].trim();
      } else if (dates.length > 0) {
        // Use the first date as reference if explicit reference date not found
        referenceDate = dates[0];
      }
      
      // Extract events and descriptions
      const entries: TimetableEntry[] = [];
      const lines = content.split('\n');
      
      // Process the content line by line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (line === '') continue;
        
        // Try to find date patterns
        const dateMatches = line.match(dateRegex);
        if (dateMatches && dateMatches[0]) {
          const currentDate = dateMatches[0];
          let event = line.replace(currentDate, '').trim();
          
          // If the event is empty, try to get it from the next line
          if (!event && i + 1 < lines.length) {
            event = lines[i + 1].trim();
            i++; // Skip the next line
          }
          
          // Look for description in the next line
          let description = '';
          if (i + 1 < lines.length && !lines[i + 1].match(dateRegex)) {
            description = lines[i + 1].trim();
            i++; // Skip the next line
          }
          
          // Calculate day number based on the reference date
          const refDate = new Date(referenceDate);
          const currentDateObj = new Date(currentDate);
          const dayDiff = Math.floor((currentDateObj.getTime() - refDate.getTime()) / (1000 * 3600 * 24));
          
          // Determine status based on the current date
          const today = new Date();
          let status: 'completed' | 'upcoming' | 'pending' = 'upcoming';
          
          if (currentDateObj < today) {
            status = 'completed';
          } else if (Math.abs(currentDateObj.getTime() - today.getTime()) < 24 * 3600 * 1000) {
            status = 'pending';
          }
          
          // Add the entry if we have a valid date and event
          if (currentDate && event) {
            entries.push({
              day: dayDiff,
              date: currentDate,
              event: event,
              description: description || undefined,
              status: status
            });
          }
        }
      }
      
      // If we couldn't extract entries, return null to use default data instead
      if (entries.length === 0) {
        return null;
      }
      
      // Sort entries by day
      entries.sort((a, b) => a.day - b.day);
      
      return {
        title,
        referenceDate,
        entries
      };
    } catch (error) {
      console.error('Error parsing timetable content:', error);
      return null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      toast({
        title: "Processing timetable document",
        description: "Extracting information from your document...",
      });
      
      const file = files[0];
      const processedResults = await processFiles([file]);
      
      if (processedResults && processedResults.length > 0) {
        const extractedContent = processedResults[0].content;
        const parsedTimetable = parseTimetableContent(extractedContent);
        
        if (parsedTimetable) {
          setTimetableData(parsedTimetable);
          toast({
            title: "Timetable processed",
            description: `Successfully extracted timetable with ${parsedTimetable.entries.length} events`,
          });
        } else {
          toast({
            title: "Processing incomplete",
            description: "Could not parse timetable structure from document",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error("Error processing document:", err);
      setError("Failed to process document. Please try again or use a different format.");
      toast({
        title: "Error",
        description: "Could not process the document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
      case 'upcoming':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Card className="finance-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          <CalendarDays className="mr-2 h-5 w-5 text-finance-medium-blue" />
          <CardTitle>{timetableData.title}</CardTitle>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={fetchTimetableDocument}
            disabled={isLoading}
            title="Refresh timetable data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <input
            type="file"
            id="timetable-upload"
            className="hidden"
            accept=".docx,.doc,.pdf,.txt"
            onChange={handleFileSelect}
            disabled={isLoading}
          />
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('timetable-upload')?.click()}
            disabled={isLoading}
          >
            <File className="mr-2 h-4 w-4" />
            {isLoading ? "Processing..." : "Load Timetable Document"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="mr-1 h-4 w-4" />
            <span>Reference date: {timetableData.referenceDate}</span>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 rounded-full border-2 border-finance-medium-blue border-t-transparent animate-spin"></div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading timetable data...</p>
          </div>
        ) : timetableData.entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No timetable entries found. Upload a timetable document to view details.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Day</TableHead>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timetableData.entries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">Day {entry.day}</TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell className="font-medium">{entry.event}</TableCell>
                    <TableCell className="hidden md:table-cell">{entry.description || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(entry.status)}`}>
                        {entry.status || 'N/A'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>* This timetable is for reference only and is subject to change.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimetableViewer;
