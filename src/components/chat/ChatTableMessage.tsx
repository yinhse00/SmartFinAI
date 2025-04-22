
import React from 'react';
import { StyledTable } from '@/components/ui/styled-table';

interface ChatTableMessageProps {
  content: string;
}

const ChatTableMessage: React.FC<ChatTableMessageProps> = ({ content }) => {
  // Parse markdown table into headers and rows
  const parseTable = (markdown: string) => {
    const lines = markdown.split('\n').filter(line => line.includes('|'));
    if (lines.length < 3) return null; // Need at least header, separator, and one data row
    
    const headers = lines[0]
      .split('|')
      .filter(cell => cell.trim())
      .map(header => header.trim());
    
    // Skip the separator line (index 1) and process data rows
    const rows = lines.slice(2).map(line => 
      line.split('|')
        .filter(cell => cell.trim())
        .map(cell => cell.trim())
    );

    return { headers, rows };
  };

  const tableData = parseTable(content);
  
  if (!tableData) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  return (
    <div className="my-4 max-w-full overflow-x-auto">
      <StyledTable 
        headers={tableData.headers}
        rows={tableData.rows}
        sortable={true}
      />
    </div>
  );
};

export default ChatTableMessage;
