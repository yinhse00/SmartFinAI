import React, { useState, useEffect } from 'react';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ReferenceDocument, categoryDisplayNames, DocumentCategory } from '@/types/references';
import DocumentActions from './DocumentActions';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const ReferenceDocumentsList: React.FC = () => {
  const [category, setCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: documents = [], isLoading, refetch } = useReferenceDocuments(category !== 'all' ? category : undefined);
  const queryClient = useQueryClient();

  // Filter documents by search query
  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (doc.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle deleting a document by title
  const handleDeleteDocumentByTitle = async (title: string) => {
    const documentsToDelete = documents.filter(doc => doc.title === title);
    
    if (documentsToDelete.length === 0) {
      toast({
        title: "Document not found",
        description: `No document found with title: ${title}`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      for (const doc of documentsToDelete) {
        // Delete from Supabase
        const { error } = await supabase
          .from('reference_documents')
          .delete()
          .eq('id', doc.id);
          
        if (error) {
          console.error('Error deleting document:', error);
          throw error;
        }
      }
      
      toast({
        title: "Document Deleted",
        description: `${documentsToDelete.length} document(s) with title "${title}" have been removed.`,
      });
      
      // Invalidate cache and refetch
      queryClient.invalidateQueries({
        queryKey: ['referenceDocuments'],
        exact: false
      });
      
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Immediately delete the PDF versions on component mount
  useEffect(() => {
    const removePdfVersions = async () => {
      if (documents && documents.length > 0) {
        // Check for Chapter 14 PDF
        const chapter14PdfToRemove = documents.find(doc => 
          doc.title === "MB_Chapter 14 Notifiable Transactions.pdf"
        );
        
        // Check for Chapter 13 PDF
        const chapter13PdfToRemove = documents.find(doc => 
          doc.title === "MB_Chapter 13 Continuing Obligations.pdf"
        );
        
        if (chapter14PdfToRemove) {
          console.log("Found Chapter 14 PDF document to remove:", chapter14PdfToRemove);
          await handleDeleteDocumentByTitle("MB_Chapter 14 Notifiable Transactions.pdf");
        }
        
        if (chapter13PdfToRemove) {
          console.log("Found Chapter 13 PDF document to remove:", chapter13PdfToRemove);
          await handleDeleteDocumentByTitle("MB_Chapter 13 Continuing Obligations.pdf");
        }
      }
    };
    
    if (!isLoading && documents) {
      removePdfVersions();
    }
  }, [documents, isLoading]);

  return (
    <Card className="finance-card">
      <CardHeader>
        <CardTitle>Reference Documents</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input 
              placeholder="Search documents..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(categoryDisplayNames).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="mb-4 w-full sm:w-auto">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid" className="w-full">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-finance-light-blue border-t-transparent rounded-full"></div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No documents found. Try adjusting your search or category filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium truncate" title={doc.title}>
                          {doc.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {categoryDisplayNames[doc.category as DocumentCategory]}
                        </p>
                      </div>
                      <DocumentActions document={doc} refetchDocuments={refetch} />
                    </div>
                    {doc.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-3">
                        {doc.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="list" className="w-full">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-finance-light-blue border-t-transparent rounded-full"></div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No documents found. Try adjusting your search or category filter.
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="p-4 flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate" title={doc.title}>
                        {doc.title}
                      </h3>
                      <div className="flex items-center mt-1">
                        <span className="text-xs bg-finance-light-blue/20 text-finance-medium-blue dark:bg-finance-accent-blue/20 dark:text-finance-accent-blue px-2 py-0.5 rounded">
                          {categoryDisplayNames[doc.category as DocumentCategory]}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <DocumentActions document={doc} refetchDocuments={refetch} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReferenceDocumentsList;
