import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TimetableEntry {
  day?: string;
  date: string;
  event: string;
  description?: string;
  status?: 'pending' | 'completed' | 'upcoming' | 'regulatory' | 'optional';
  vettingRequired?: boolean;
  ruleReference?: string;
}

interface ChatTimetableRendererProps {
  tableContent: string;
}

const getStatusClass = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'upcoming':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'regulatory':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'optional':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  }
};

const parseTableContent = (content: string): TimetableEntry[] => {
  const lines = content.trim().split('\n');
  const entries: TimetableEntry[] = [];
  
  // Skip header and separator lines
  let dataStartIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('|') && lines[i].includes('-')) {
      dataStartIndex = i + 1;
      break;
    }
  }
  
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.includes('|')) continue;
    
    const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
    if (cells.length >= 3) {
      const entry: TimetableEntry = {
        day: cells[0]?.replace(/Day\s*/i, '') || '',
        date: cells[1] || '',
        event: cells[2] || '',
        description: cells[3] || '',
        status: cells[4]?.toLowerCase() as any || 'pending'
      };
      
      // Check for vetting requirements in event text
      if (entry.event.toLowerCase().includes('vetting') || entry.event.toLowerCase().includes('approval')) {
        entry.vettingRequired = true;
      }
      
      // Extract rule references from description
      const ruleMatch = entry.description?.match(/Rule\s+[\d.]+/i);
      if (ruleMatch) {
        entry.ruleReference = ruleMatch[0];
      }
      
      entries.push(entry);
    }
  }
  
  return entries;
};

export const ChatTimetableRenderer: React.FC<ChatTimetableRendererProps> = ({ tableContent }) => {
  const entries = parseTableContent(tableContent);
  
  if (entries.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 p-4 border rounded">
        Unable to parse timetable data
      </div>
    );
  }
  
  return (
    <div className="rounded-md border my-4">
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
          {entries.map((entry, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                {entry.day ? `Day ${entry.day}` : '-'}
              </TableCell>
              <TableCell>{entry.date}</TableCell>
              <TableCell className="font-medium">
                {entry.event}
                {entry.vettingRequired && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-1 py-0.5 rounded">
                    Vetting Required
                  </span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {entry.description || '-'}
                {entry.ruleReference && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Ref: {entry.ruleReference}
                  </div>
                )}
              </TableCell>
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
  );
};

export default ChatTimetableRenderer;