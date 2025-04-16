
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
  totalCount: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

const DocumentsPagination: React.FC<DocumentsPaginationProps> = ({ 
  totalCount, 
  currentPage = 1,
  onPageChange = () => {} 
}) => {
  if (totalCount <= 10) return null;
  
  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }} 
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink 
            href="#" 
            isActive={currentPage === 1}
            onClick={(e) => {
              e.preventDefault();
              onPageChange(1);
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              onPageChange(currentPage + 1);
            }} 
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default DocumentsPagination;
