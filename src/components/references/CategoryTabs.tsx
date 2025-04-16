
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { categoryDisplayNames, DocumentCategory } from '@/types/references';

interface CategoryTabsProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeCategory, setActiveCategory }) => {
  return (
    <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
      <TabsList className="mb-4 flex flex-wrap gap-1">
        <TabsTrigger value="all">All</TabsTrigger>
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
