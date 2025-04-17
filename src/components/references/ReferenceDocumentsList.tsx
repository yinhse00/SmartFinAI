
import React, { useState, useCallback, useEffect } from 'react';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

// Import our components
import ReferenceSearch from './ReferenceSearch';
import CategoryTabs from './CategoryTabs';
import ReferencesSkeleton from './ReferencesSkeleton';
import DocumentsTable from './DocumentsTable';
import DocumentsPagination from './DocumentsPagination';

const ReferenceDocumentsList: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const queryClient = useQueryClient();
  
  // Use our hook with optimized refetching strategy
  const { 
    data: documents, 
    isLoading, 
    error,
    refetch,
    isRefetching
  } = useReferenceDocuments(activeCategory === 'all' ? undefined : activeCategory);
  
  // Reset to page 1 when category changes or document count changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, documents?.length]);

  // Force refetch when component mounts or activeCategory changes
  useEffect(() => {
    console.log('Initial fetch of documents');
    handleRefetchDocuments();
  }, [activeCategory]); // Depend only on activeCategory
  
  // Explicit refetch function with forced invalidation
  const handleRefetchDocuments = useCallback(() => {
    console.log('Manual refetch triggered');
    
    // Increment refresh trigger to force component update
    setRefreshTrigger(prev => prev + 1);
    
    // Force invalidation of the query
    queryClient.invalidateQueries({ 
      queryKey: ['referenceDocuments'],
      refetchType: 'all', 
      exact: false 
    });
    
    // Force refetch
    refetch().then(() => {
      console.log('Refetch completed successfully');
    }).catch(err => {
      console.error('Refetch failed:', err);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh document list. Please try again.",
        variant: "destructive"
      });
    });
  }, [refetch, queryClient]);
  
  // Filter documents based on search query
  const filteredDocuments = documents?.filter(doc => 
    searchQuery === '' || 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );
  
  // Sort documents by date (newest first)
  const sortedDocuments = filteredDocuments ? 
    [...filteredDocuments].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ) : [];

  return (
    <Card className="finance-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Knowledge Base Documents</CardTitle>
        <ReferenceSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </CardHeader>
      <CardContent>
        <CategoryTabs activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        
        <div className="mt-2">
          {isLoading || isRefetching ? (
            <ReferencesSkeleton />
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-red-500">Error loading documents. Please try again.</p>
            </div>
          ) : (
            <>
              <DocumentsTable 
                documents={sortedDocuments} 
                refetchDocuments={handleRefetchDocuments}
                key={`docs-table-${refreshTrigger}`} // Force re-render on refresh
              />
              <DocumentsPagination 
                totalCount={sortedDocuments?.length || 0} 
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferenceDocumentsList;
