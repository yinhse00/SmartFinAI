
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/components/layout/MainLayout';
import DocumentUploader from '@/components/documents/DocumentUploader';
import ResponseGenerator from '@/components/documents/ResponseGenerator';
import DocumentHistory from '@/components/documents/DocumentHistory';
import { BookOpen, Upload, FileOutput } from 'lucide-react';

const Documents = () => {
  const [activeTab, setActiveTab] = useState<string>('documents');
  
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-finance-dark-blue dark:text-white">Document Management</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Upload documents for review and generate professional responses
        </p>
        
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full max-w-md grid grid-cols-3 mb-8">
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <FileOutput className="h-4 w-4" />
                <span className="hidden sm:inline">Generate</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {activeTab === 'documents' && (
        <DocumentHistory />
      )}
      
      {activeTab === 'upload' && (
        <div className="max-w-md mx-auto">
          <DocumentUploader />
        </div>
      )}
      
      {activeTab === 'generate' && (
        <div className="max-w-xl mx-auto">
          <ResponseGenerator />
        </div>
      )}
    </MainLayout>
  );
};

export default Documents;
