
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ReferenceSearchProps {
  searchQuery: string;
  onSearch: (query: string) => void;
}

const ReferenceSearch: React.FC<ReferenceSearchProps> = ({ searchQuery, onSearch }) => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
      <Input
        type="search"
        placeholder="Search documents..."
        className="w-[200px] sm:w-[300px] pl-8"
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
};

export default ReferenceSearch;
