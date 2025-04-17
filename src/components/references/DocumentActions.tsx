
import React from 'react';
import { ReferenceDocument } from '@/types/references';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import DeleteDocumentDialog from './DeleteDocumentDialog';

interface DocumentActionsProps {
  document: ReferenceDocument;
  refetchDocuments: () => void;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ document, refetchDocuments }) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  
  const handleDownload = async (doc: ReferenceDocument) => {
    try {
      const downloadLink = doc.file_url;
      const link = document.createElement('a');
      link.href = downloadLink;
      link.download = doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${doc.title}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the document.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="ghost"
        size="icon"
        onClick={() => window.open(document.file_url, '_blank')}
      >
        <Eye size={16} className="text-gray-500 hover:text-gray-700" />
      </Button>
      <Button 
        variant="ghost"
        size="icon"
        onClick={() => handleDownload(document)}
      >
        <Download size={16} className="text-finance-medium-blue hover:text-finance-dark-blue" />
      </Button>
      <DeleteDocumentDialog
        document={document}
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        refetchDocuments={refetchDocuments}
      />
    </div>
  );
};

export default DocumentActions;
