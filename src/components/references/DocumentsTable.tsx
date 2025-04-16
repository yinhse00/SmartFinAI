
import React from 'react';
import { ReferenceDocument, categoryDisplayNames } from '@/types/references';
import DocumentCategoryIcon from './DocumentCategoryIcon';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatFileSize, formatDate } from './utils/formatters';

interface DocumentsTableProps {
  documents: ReferenceDocument[];
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents }) => {
  if (documents.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No documents available
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <DocumentCategoryIcon category={doc.category} />
                <div>
                  <div className="font-medium">{doc.title}</div>
                  {doc.description && (
                    <div className="text-xs text-gray-500">{doc.description}</div>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {categoryDisplayNames[doc.category]}
              </Badge>
            </TableCell>
            <TableCell>{formatFileSize(doc.file_size)}</TableCell>
            <TableCell>{formatDate(doc.created_at)}</TableCell>
            <TableCell>
              <a 
                href={doc.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-finance-medium-blue hover:text-finance-dark-blue"
              >
                <Download size={16} />
                <span>View</span>
              </a>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DocumentsTable;
