
import React from 'react';
import { ReferenceDocument } from '@/types/references';
import { Button } from "@/components/ui/button";
import { Download, Trash2, FileText, Loader } from "lucide-react";

interface DocumentActionsProps {
  document: ReferenceDocument;
  refetchDocuments: () => void;
  isUpdating?: boolean;
  onUpdateStart?: () => void;
  onUpdateComplete?: () => Promise<void>;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ 
  document, 
  refetchDocuments,
  isUpdating,
  onUpdateStart,
  onUpdateComplete 
}) => {
  return (
    <div className="flex justify-end gap-2">
      {isUpdating ? (
        <Button size="sm" variant="ghost" disabled>
          <Loader className="h-4 w-4 animate-spin" />
        </Button>
      ) : (
        <>
          <Button size="sm" variant="ghost" asChild>
            <a href={document.file_url} target="_blank" rel="noopener noreferrer">
              <FileText className="h-4 w-4" />
              <span className="sr-only">View</span>
            </a>
          </Button>
          
          <Button size="sm" variant="ghost" asChild>
            <a href={document.file_url} download={document.title}>
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </a>
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={async () => {
              if (onUpdateStart) onUpdateStart();
              // Delete implementation goes here
              await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
              if (onUpdateComplete) await onUpdateComplete();
              refetchDocuments();
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </>
      )}
    </div>
  );
};

export default DocumentActions;
