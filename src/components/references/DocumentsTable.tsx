
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
  const handleDownload = async (doc: ReferenceDocument) => {
    try {
      // Create a temporary anchor element to trigger download
      const downloadLink = doc.file_url;
      const link = window.document.createElement('a');
      link.href = downloadLink;
      link.download = doc.title;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
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
  
  const handleDelete = async (documentId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('reference_documents')
        .delete()
        .eq('id', documentId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Document Deleted",
        description: `${title} has been removed from the database.`,
      });
      
      // Refresh the documents list
      refetchDocuments();
    } catch (error) {
      console.error('Delete error:', error);
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost"
                      size="icon"
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
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => handleDelete(doc.id, doc.title)}
                      >
                        Delete
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
  );
};

export default DocumentsTable;
