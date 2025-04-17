
import React from 'react';
import { ReferenceDocument, categoryDisplayNames } from '@/types/references';
import DocumentCategoryIcon from './DocumentCategoryIcon';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatFileSize, formatDate } from './utils/formatters';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';

interface DocumentsTableProps {
  documents: ReferenceDocument[];
  refetchDocuments: () => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents, refetchDocuments }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [documentToDelete, setDocumentToDelete] = React.useState<{id: string, title: string} | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleDownload = async (doc: ReferenceDocument) => {
    try {
      // Create a temporary anchor element to trigger download
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
  
  const handleDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      setIsDeleting(true);
      console.log('Attempting to delete document:', documentToDelete.id);
      
      // Perform Supabase delete operation
      const { error } = await supabase
        .from('reference_documents')
        .delete()
        .eq('id', documentToDelete.id);
        
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('Document deleted successfully from Supabase');
      
      // Show success toast
      toast({
        title: "Document Deleted",
        description: `${documentToDelete.title} has been removed from the database.`,
      });
      
      // Force immediate refetch before closing dialog
      await refetchDocuments();
      
      // Reset state and close dialog
      setDocumentToDelete(null);
      setIsDeleting(false);
      setDialogOpen(false);
      
    } catch (error) {
      console.error('Delete error:', error);
      setIsDeleting(false);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive"
      });
    }
  };

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
    <>
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
            <TableRow key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/20">
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
                <div className="flex gap-2">
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(doc.file_url, '_blank')}
                  >
                    <Eye size={16} className="text-gray-500 hover:text-gray-700" />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download size={16} className="text-finance-medium-blue hover:text-finance-dark-blue" />
                  </Button>
                  <AlertDialog open={dialogOpen && documentToDelete?.id === doc.id} onOpenChange={setDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDocumentToDelete({ id: doc.id, title: doc.title });
                          setDialogOpen(true);
                        }}
                      >
                        <Trash2 size={16} className="text-red-500 hover:text-red-700" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{doc.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                          setDialogOpen(false);
                          setDocumentToDelete(null);
                        }}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-500 hover:bg-red-600 text-white"
                          disabled={isDeleting}
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                          }}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default DocumentsTable;
