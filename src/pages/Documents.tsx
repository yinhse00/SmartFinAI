
import MainLayout from '@/components/layout/MainLayout';
import DocumentUploader from '@/components/documents/DocumentUploader';
import ResponseGenerator from '@/components/documents/ResponseGenerator';
import DocumentHistory from '@/components/documents/DocumentHistory';

const Documents = () => {
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Document Management</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Upload documents for review and generate professional responses
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DocumentHistory />
        </div>
        <div className="space-y-6">
          <DocumentUploader />
          <ResponseGenerator />
        </div>
      </div>
    </MainLayout>
  );
};

export default Documents;
