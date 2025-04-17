
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Deletes all documents from the reference_documents table
 */
export const clearAllDocuments = async () => {
  try {
    console.log('Clearing all reference documents from the database');
    
    const { error } = await supabase
      .from('reference_documents')
      .delete()
      .neq('id', '0'); // This will delete all records
    
    if (error) {
      console.error('Failed to clear documents:', error);
      toast({
        title: "Operation Failed",
        description: "Could not delete all documents. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
    
    toast({
      title: "Database Cleared",
      description: "All documents have been removed from the database.",
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error clearing documents:', error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });
    return { success: false, error };
  }
};
