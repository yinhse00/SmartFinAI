
import React, { useState, useCallback, useEffect } from 'react';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

// Import our components
import ReferenceSearch from './ReferenceSearch';
import CategoryTabs from './CategoryTabs';
import ReferencesSkeleton from './ReferencesSkeleton';
import DocumentsTable from './DocumentsTable';
import DocumentsPagination from './DocumentsPagination';
import { DocumentCategory, categoryDisplayNames } from '@/types/references';

const ReferenceDocumentsList: React.FC = () => {
  // Get first category key as default
  const firstCategoryKey = Object.keys(categoryDisplayNames)[0] as DocumentCategory;
  const [activeCategory, setActiveCategory] = useState<string>(firstCategoryKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  
  // Use our hook to fetch documents
  const { 
    data: documents, 
    isLoading, 
    error,
    refetch,
    isRefetching
  } = useReferenceDocuments(activeCategory);

  console.log("Current documents state:", { 
    isLoading, 
    isRefetching, 
    activeCategory, 
    documentsLength: documents?.length, 
    error 
  });
  
  // Reset to page 1 when category changes or document count changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, documents?.length]);

  // Force refetch when component mounts or activeCategory changes
  useEffect(() => {
    console.log('Fetching documents for category:', activeCategory);
    refetch();
  }, [activeCategory, refetch]); 
  
  // Handle category change
  const handleCategoryChange = useCallback((category: string) => {
    console.log('Category changed to:', category);
    setActiveCategory(category);
    
    // Invalidate queries to force refresh
    queryClient.invalidateQueries({ 
      queryKey: ['referenceDocuments'],
      exact: false 
    });
  }, [queryClient]);
  
  // Manual refetch function
  const handleRefetchDocuments = useCallback(() => {
    console.log('Manual refetch triggered for category:', activeCategory);
    
    toast({
      title: "Refreshing documents",
      description: "Getting the latest documents...",
    });
    
    // Invalidate cache and refetch
    queryClient.invalidateQueries({ 
      queryKey: ['referenceDocuments'],
      exact: false 
    });
    
    refetch().catch(err => {
      console.error('Refetch failed:', err);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh document list. Please try again.",
        variant: "destructive"
      });
    });
  }, [refetch, queryClient, activeCategory]);
  
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
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-medium">Knowledge Base Documents</CardTitle>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleRefetchDocuments}
            disabled={isLoading || isRefetching}
            title="Refresh documents"
          >
            <RefreshCcw size={16} className={isRefetching ? "animate-spin" : ""} />
          </Button>
        </div>
        <ReferenceSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </CardHeader>
      <CardContent>
        <CategoryTabs 
          activeCategory={activeCategory} 
          setActiveCategory={handleCategoryChange}
        />
        
        <div className="mt-2">
          {isLoading || isRefetching ? (
            <ReferencesSkeleton />
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-red-500">Error loading documents. Please try again.</p>
              <Button 
                variant="outline" 
                className="mt-2" 
                onClick={handleRefetchDocuments}
              >
                Retry
              </Button>
            </div>
          ) : (
            <>
              <DocumentsTable 
                documents={sortedDocuments} 
                refetchDocuments={handleRefetchDocuments}
              />
              <DocumentsPagination 
                totalCount={sortedDocuments?.length || 0} 
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
              {sortedDocuments.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No documents found in this category
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferenceDocumentsList;
