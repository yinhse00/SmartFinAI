import { useState, useEffect, useCallback } from 'react';
import { ddDocumentsService } from '@/services/ipo/ddDocumentsService';
import { IPODDDocument } from '@/types/ipo';
import { useToast } from '@/hooks/use-toast';

export const useIPODocuments = (projectId: string, documentType?: string) => {
  const [documents, setDocuments] = useState<IPODDDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const loadDocuments = useCallback(async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const docs = await ddDocumentsService.list(projectId, documentType ? { document_type: documentType as any } : undefined);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, documentType, toast]);

  const upload = useCallback(async (file: File) => {
    if (!projectId) return null;

    setIsUploading(true);
    try {
      const uploadedDoc = await ddDocumentsService.upload(projectId, file, documentType ? { document_type: documentType as any } : undefined);
      setDocuments(prev => [...prev, uploadedDoc]);
      
      toast({
        title: 'Upload Successful',
        description: `${file.name} has been uploaded and is being processed`
      });
      
      return uploadedDoc;
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: `Failed to upload ${file.name}`,
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [projectId, documentType, toast]);

  const remove = useCallback(async (documentId: string) => {
    try {
      const docToRemove = documents.find(doc => doc.id === documentId);
      if (docToRemove) {
        await ddDocumentsService.remove({ id: docToRemove.id, file_path: docToRemove.file_path });
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        
        toast({
          title: 'Document Removed',
          description: 'Document has been successfully removed'
        });
      }
    } catch (error) {
      console.error('Failed to remove document:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove document',
        variant: 'destructive'
      });
    }
  }, [documents, toast]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    isLoading,
    isUploading,
    upload,
    remove,
    refresh: loadDocuments
  };
};