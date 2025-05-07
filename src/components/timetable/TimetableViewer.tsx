import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fileProcessingService } from '@/services/documents/fileProcessingService';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [timetableData, setTimetableData] = useState<TimetableData>({
    title: "Financial Transaction Timetable (May 7, 2025)",
    referenceDate: "2025-05-07",
    entries: [
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
    ]
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      toast({
        title: "Processing document",
        description: "Extracting timetable information from your document...",
      });
      
      const file = files[0];
      const result = await fileProcessingService.processFile(file);
      
      // Simple parsing logic - in a real app this would be more sophisticated
      if (result.content) {
        // Here we would parse the document content to extract timetable information
        // For now, we'll just show a success message
        toast({
          title: "Document processed",
          description: "Document content extracted successfully",
        });
        
        // This is where you would parse the result.content to extract timetable data
        // For now, we'll keep the default timetable
        
        // Example of how you might want to parse content in a production app:
        /*
        const parsedData = parseTimetableContent(result.content);
        if (parsedData) {
          setTimetableData(parsedData);
        }
        */
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
      setIsProcessing(false);
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
          <input
            type="file"
            id="timetable-upload"
            className="hidden"
            accept=".docx,.doc,.pdf,.txt"
            onChange={handleFileSelect}
            disabled={isProcessing}
          />
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('timetable-upload')?.click()}
            disabled={isProcessing}
          >
            <File className="mr-2 h-4 w-4" />
            {isProcessing ? "Processing..." : "Load Timetable Document"}
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
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>* This timetable is for reference only and is subject to change.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimetableViewer;
