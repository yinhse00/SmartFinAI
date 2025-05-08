
import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ReferenceUploader from '@/components/references/ReferenceUploader';
import ReferenceDocumentsList from '@/components/references/ReferenceDocumentsList';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const References = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Every time a file is uploaded, we'll invalidate the documents cache
  const handleDocumentsChanged = () => {
    queryClient.invalidateQueries({
      queryKey: ['referenceDocuments'],
      exact: false
    });
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
        
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/timetable')}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            View Timetables
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReferenceDocumentsList />
        </div>
        <div>
          <ReferenceUploader onUploadComplete={handleDocumentsChanged} />
        </div>
      </div>
    </MainLayout>
  );
};

export default References;
