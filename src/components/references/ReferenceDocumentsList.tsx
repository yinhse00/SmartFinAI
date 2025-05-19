
import { useState } from 'react';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import DocumentsTable from './DocumentsTable';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from '@/components/ui/card';
import CategoryTabs from './CategoryTabs';
import ReferenceSearch from './ReferenceSearch';
import DocumentsPagination from './DocumentsPagination';
import ReferencesSkeleton from './ReferencesSkeleton';

interface ReferenceDocumentsListProps {
  onValidateMapping?: () => Promise<void>;
}

const ReferenceDocumentsList: React.FC<ReferenceDocumentsListProps> = ({ onValidateMapping }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: documents, isLoading, error } = useReferenceDocuments(selectedCategory);

  // Filter documents based on search query
  const filteredDocuments = documents?.filter(doc => {
    if (!searchQuery) return true;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(lowerCaseQuery) ||
      doc.description?.toLowerCase().includes(lowerCaseQuery)
    );
  }) || [];

  // Calculate pagination
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle category change
  const handleCategoryChange = (category: string | undefined) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page on category change
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
  };

  return (
    <Card className="finance-card h-full">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <CategoryTabs 
            selectedCategory={selectedCategory} 
            onCategoryChange={handleCategoryChange} 
          />
          <ReferenceSearch 
            searchQuery={searchQuery} 
            onSearch={handleSearch} 
          />
        </div>

        {isLoading ? (
          <ReferencesSkeleton />
        ) : error ? (
          <div className="text-center p-6 text-red-600">
            <p>Error loading documents. Please try again later.</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center p-6 text-gray-500">
            <p>No documents found. Try changing your search or category filter.</p>
          </div>
        ) : (
          <>
            <DocumentsTable 
              documents={paginatedDocuments} 
              onValidateMapping={onValidateMapping}
            />
            
            {totalPages > 1 && (
              <div className="pt-4">
                <DocumentsPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default ReferenceDocumentsList;
