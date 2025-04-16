
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CategoryTabsProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeCategory, setActiveCategory }) => {
  return (
    <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
      <TabsList className="mb-4 grid grid-cols-4 md:grid-cols-7">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="listing_rules">Listing Rules</TabsTrigger>
        <TabsTrigger value="takeovers">Takeovers Code</TabsTrigger>
        <TabsTrigger value="guidance">Interpretation and Guidance</TabsTrigger>
        <TabsTrigger value="decisions">Listing Review Committee Decisions</TabsTrigger>
        <TabsTrigger value="checklists">Checklists, Forms and Templates</TabsTrigger>
        <TabsTrigger value="other">Others</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default CategoryTabs;
