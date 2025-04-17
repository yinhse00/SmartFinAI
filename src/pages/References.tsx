
import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ReferenceUploader from '@/components/references/ReferenceUploader';
import ReferenceDocumentsList from '@/components/references/ReferenceDocumentsList';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { clearAllDocuments } from '@/utils/referenceCleanupUtils';
import { useQueryClient } from '@tanstack/react-query';

const References = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();
  
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL documents? This action cannot be undone.')) {
      const result = await clearAllDocuments();
      
      if (result.success) {
        // Force cache invalidation
        queryClient.invalidateQueries({
          queryKey: ['referenceDocuments'],
          refetchType: 'all',
          exact: false
        });
        
        // Completely remove queries from cache
        queryClient.removeQueries({
          queryKey: ['referenceDocuments'],
          exact: false
        });
        
        // Force component rerender by updating the key
        setRefreshKey(prev => prev + 1);
        
        // Force refetch all queries
        await queryClient.refetchQueries({
          queryKey: ['referenceDocuments'],
          type: 'all'
        });
      }
    }
  };

  return (
    <MainLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Reference Database</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload, download and manage regulatory documents to enhance SmartFinAI's knowledge
          </p>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleClearAll}
          className="flex items-center gap-2"
        >
          <Trash2 size={16} />
          Clear All Documents
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReferenceDocumentsList key={`documents-list-${refreshKey}`} />
        </div>
        <div>
          <ReferenceUploader />
        </div>
      </div>
    </MainLayout>
  );
};

export default References;
