
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { categoryDisplayNames, DocumentCategory } from '@/types/references';

interface CategoryTabsProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeCategory, setActiveCategory }) => {
  // Get first category as default if none is selected
  const firstCategoryKey = Object.keys(categoryDisplayNames)[0] as DocumentCategory;
  
  return (
    <Tabs 
      defaultValue={firstCategoryKey} 
      value={activeCategory} 
      onValueChange={setActiveCategory}
    >
      <TabsList className="mb-4 flex flex-wrap gap-1">
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
