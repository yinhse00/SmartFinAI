
import React, { useState } from 'react';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';

// Import our new components
import ReferenceSearch from './ReferenceSearch';
import CategoryTabs from './CategoryTabs';
import ReferencesSkeleton from './ReferencesSkeleton';
import DocumentsTable from './DocumentsTable';
import DocumentsPagination from './DocumentsPagination';

const ReferenceDocumentsList: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { data: documents, isLoading, error } = useReferenceDocuments(activeCategory === 'all' ? undefined : activeCategory);
  
  // Filter documents based on search query
  const filteredDocuments = documents?.filter(doc => 
    searchQuery === '' || 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

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
              <DocumentsTable documents={filteredDocuments || []} />
              <DocumentsPagination 
                totalCount={filteredDocuments?.length || 0} 
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
