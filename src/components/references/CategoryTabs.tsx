
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { categoryDisplayNames, DocumentCategory } from '@/types/references';

interface CategoryTabsProps {
  selectedCategory: string | undefined;
  onCategoryChange: (category: string | undefined) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ selectedCategory, onCategoryChange }) => {
  // Get first category as default if none is selected
  const firstCategoryKey = Object.keys(categoryDisplayNames)[0] as DocumentCategory;
  
  return (
    <Tabs 
      defaultValue={firstCategoryKey} 
      value={selectedCategory || ''} 
      onValueChange={onCategoryChange}
    >
      <TabsList className="mb-4 flex flex-wrap gap-1">
        <TabsTrigger key="all" value="">
          All Categories
        </TabsTrigger>
        {Object.entries(categoryDisplayNames).map(([value, label]) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default CategoryTabs;
