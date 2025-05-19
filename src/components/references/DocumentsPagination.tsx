
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface DocumentsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const DocumentsPagination: React.FC<DocumentsPaginationProps> = ({ 
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {} 
}) => {
  if (totalPages <= 1) return null;
  
  // Create pagination items
  const paginationItems = [];
  
  // Add first page and previous if not on first page
  if (currentPage > 1) {
    paginationItems.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            onPageChange(currentPage - 1);
          }} 
        />
      </PaginationItem>
    );
  }
  
  // Add page numbers
  const displayRange = 2; // How many pages to show before and after current page
  
  for (let i = 1; i <= totalPages; i++) {
    // Always show first and last pages, and pages around current page
    if (
      i === 1 || 
      i === totalPages || 
      (i >= currentPage - displayRange && i <= currentPage + displayRange)
    ) {
      paginationItems.push(
        <PaginationItem key={i}>
          <PaginationLink 
            href="#" 
            isActive={currentPage === i}
            onClick={(e) => {
              e.preventDefault();
              onPageChange(i);
            }}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    } else if (
      (i === currentPage - displayRange - 1 && i > 1) || 
      (i === currentPage + displayRange + 1 && i < totalPages)
    ) {
      // Add ellipsis for skipped pages
      paginationItems.push(
        <PaginationItem key={`ellipsis-${i}`}>
          <span className="px-2">...</span>
        </PaginationItem>
      );
    }
  }
  
  // Add next page if not on last page
  if (currentPage < totalPages) {
    paginationItems.push(
      <PaginationItem key="next">
        <PaginationNext 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            onPageChange(currentPage + 1);
          }} 
        />
      </PaginationItem>
    );
  }
  
  return (
    <Pagination className="mt-4">
      <PaginationContent>
        {paginationItems}
      </PaginationContent>
    </Pagination>
  );
};

export default DocumentsPagination;
