
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegulationProvision } from '@/services/database/types';
import CategorySelector from './explorer/CategorySelector';
import ChapterList from './explorer/ChapterList';
import ProvisionDialog from './explorer/ProvisionDialog';
import { useProvisions } from './hooks/useProvisions';

const RegulatoryExplorer = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewingProvision, setViewingProvision] = useState<RegulationProvision | null>(null);

  // Fetch provisions for selected category
  const { provisionsByChapter, isLoading: loadingProvisions } = useProvisions(selectedCategory);

  const handleViewProvision = (provision: RegulationProvision) => {
    setViewingProvision(provision);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Regulatory Categories</CardTitle>
          <CardDescription>
            Browse regulatory content by category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <CategorySelector 
              selectedCategory={selectedCategory} 
              onSelectCategory={setSelectedCategory} 
            />
          </div>

          {selectedCategory && (
            <div className="space-y-4">
              <ChapterList 
                provisionsByChapter={provisionsByChapter} 
                isLoading={loadingProvisions}
                onViewProvision={handleViewProvision}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ProvisionDialog 
        provision={viewingProvision}
        onClose={() => setViewingProvision(null)}
      />
    </div>
  );
};

export default RegulatoryExplorer;
