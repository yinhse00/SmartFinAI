
import React from 'react';
import { ReferenceDocument } from '@/types/references';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
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

interface DeleteDocumentDialogProps {
  document: ReferenceDocument;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  refetchDocuments: () => void;
}

const DeleteDocumentDialog: React.FC<DeleteDocumentDialogProps> = ({ 
  document, 
  isOpen, 
  setIsOpen, 
  refetchDocuments 
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      console.log('Attempting to delete document:', document.id);
      
      // Perform Supabase delete operation
      const { error } = await supabase
        .from('reference_documents')
        .delete()
        .eq('id', document.id);
        
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('Document deleted successfully from Supabase');
      
      // Show success toast
      toast({
        title: "Document Deleted",
        description: `${document.title} has been removed from the database.`,
      });
      
      // Close the dialog first
      setIsOpen(false);
      
      // Complete cache reset approach
      console.log('Invalidating and removing all reference document queries');
      
      // Remove all query cache related to reference documents
      queryClient.removeQueries({
        queryKey: ['referenceDocuments'],
        exact: false
      });
      
      // Force invalidate all queries related to reference documents
      queryClient.invalidateQueries({
        queryKey: ['referenceDocuments'],
        exact: false,
        refetchType: 'all'
      });
      
      // Force immediate refetch
      refetchDocuments();
      
      // Additional refetch after a delay to ensure UI is updated
      setTimeout(() => {
        console.log('Performing delayed refetch to ensure data consistency');
        refetchDocuments();
        
        // Refresh the entire query cache as a last resort
        queryClient.refetchQueries({
          queryKey: ['referenceDocuments'],
          exact: false,
          type: 'all'
        });
      }, 500);
      
    } catch (error) {
      console.error('Delete error:', error);
      setIsDeleting(false);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
        >
          <Trash2 size={16} className="text-red-500 hover:text-red-700" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Document</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{document.title}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsOpen(false)}>
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
  );
};

export default DeleteDocumentDialog;
