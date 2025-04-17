
import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ReferenceUploader from '@/components/references/ReferenceUploader';
import ReferenceDocumentsList from '@/components/references/ReferenceDocumentsList';
import { useQueryClient } from '@tanstack/react-query';

const References = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Reference Database</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Upload, download and manage regulatory documents to enhance SmartFinAI's knowledge
        </p>
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
