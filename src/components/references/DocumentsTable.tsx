
import { useState } from 'react';
import { ReferenceDocument } from '@/types/references';
import DocumentRow from './DocumentRow';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DocumentsTableProps {
  documents: ReferenceDocument[];
  onValidateMapping?: () => Promise<void>;
}

const DocumentsTable = ({ documents, onValidateMapping }: DocumentsTableProps) => {
  const [updatingDocument, setUpdatingDocument] = useState<string | null>(null);

  const handleDocumentUpdated = async () => {
    // Document was updated or deleted, so we should check if validation status needs updating
    if (onValidateMapping) {
      await onValidateMapping();
    }
    setUpdatingDocument(null);
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800">
            <TableHead className="w-1/3">Document Name</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead className="hidden md:table-cell">Size</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              isUpdating={updatingDocument === document.id}
              onUpdateStart={() => setUpdatingDocument(document.id)}
              onUpdateComplete={handleDocumentUpdated}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentsTable;
