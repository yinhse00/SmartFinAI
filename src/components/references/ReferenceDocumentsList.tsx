
import React, { useState, useCallback } from 'react';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  
  // Use our hook with optimized refetching strategy
  const { 
    data: documents, 
    isLoading, 
    error, 
    refetch 
  } = useReferenceDocuments(activeCategory === 'all' ? undefined : activeCategory);
  
  // Reset to page 1 when category changes or document count changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, documents?.length]);
  
  // Explicit refetch function with debounce protection
  const handleRefetchDocuments = useCallback(() => {
    console.log('Manual refetch triggered');
    // Use setTimeout to ensure we don't have multiple rapid refetches
    setTimeout(() => {
      refetch();
    }, 100);
  }, [refetch]);
  
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
          {isLoading ? (
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
