
import React from 'react';
import { ReferenceDocument, categoryDisplayNames } from '@/types/references';
import DocumentCategoryIcon from './DocumentCategoryIcon';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatFileSize, formatDate } from './utils/formatters';
import DocumentActions from './DocumentActions';

interface DocumentRowProps {
  document: ReferenceDocument;
  isUpdating?: boolean;
  onUpdateStart?: () => void;
  onUpdateComplete?: () => Promise<void>;
  refetchDocuments?: () => void;
}

const DocumentRow: React.FC<DocumentRowProps> = ({ 
  document, 
  isUpdating,
  onUpdateStart,
  onUpdateComplete,
  refetchDocuments 
}) => {
  return (
    <TableRow key={document.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/20">
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <DocumentCategoryIcon category={document.category} />
          <div>
            <div className="font-medium">{document.title}</div>
            {document.description && (
              <div className="text-xs text-gray-500">{document.description}</div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant="outline">
          {categoryDisplayNames[document.category]}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">{formatFileSize(document.file_size)}</TableCell>
      <TableCell className="hidden sm:table-cell">{formatDate(document.created_at)}</TableCell>
      <TableCell>
        <DocumentActions 
          document={document} 
          refetchDocuments={refetchDocuments || (() => {})}
          isUpdating={isUpdating}
          onUpdateStart={onUpdateStart}
          onUpdateComplete={onUpdateComplete}
        />
      </TableCell>
    </TableRow>
  );
};

export default DocumentRow;
