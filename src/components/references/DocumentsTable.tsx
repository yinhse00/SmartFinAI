
import React from 'react';
import { ReferenceDocument } from '@/types/references';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DocumentRow from './DocumentRow';

interface DocumentsTableProps {
  documents: ReferenceDocument[];
  refetchDocuments: () => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents, refetchDocuments }) => {
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
          <DocumentRow 
            key={doc.id}
            document={doc} 
            refetchDocuments={refetchDocuments} 
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default DocumentsTable;
