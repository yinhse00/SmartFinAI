
import MainLayout from '@/components/layout/MainLayout';
import DocumentUploader from '@/components/documents/DocumentUploader';
import ResponseGenerator from '@/components/documents/ResponseGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, Calendar } from 'lucide-react';

const DocumentHistory = () => {
  return (
    <Card className="finance-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Recent Documents</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="search"
              placeholder="Search documents..."
              className="w-[200px] sm:w-[300px] pl-8"
            />
          </div>
          <Button variant="outline" size="sm">
            Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="w-full mb-4 grid grid-cols-3">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="uploaded">Uploaded</TabsTrigger>
            <TabsTrigger value="generated">Generated Responses</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex space-x-4 p-4 rounded-lg border border-gray-100 dark:border-finance-medium-blue/20 hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 transition-colors">
                <div className="rounded-md bg-finance-highlight dark:bg-finance-medium-blue/30 p-3">
                  <FileText className="h-6 w-6 text-finance-medium-blue dark:text-finance-accent-blue" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <h3 className="font-medium text-finance-dark-blue dark:text-white">
                      {i % 2 === 0 ? `IPO Prospectus Draft ${i+1}` : `Regulator Response ${i}`}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {i % 2 === 0 ? "Uploaded Document" : "Generated Response"}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>{i % 2 === 0 ? "Uploaded: " : "Generated: "} {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="uploaded">
            <div className="py-4">
              {[1, 2].map((_, i) => (
                <div key={i} className="flex space-x-4 p-4 rounded-lg border border-gray-100 dark:border-finance-medium-blue/20 hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 transition-colors mb-4">
                  <div className="rounded-md bg-finance-highlight dark:bg-finance-medium-blue/30 p-3">
                    <FileText className="h-6 w-6 text-finance-medium-blue dark:text-finance-accent-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <h3 className="font-medium text-finance-dark-blue dark:text-white">
                        IPO Prospectus Draft {i+1}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Uploaded Document
                    </p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>Uploaded: {new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="generated">
            <div className="py-4">
              {[1, 2].map((_, i) => (
                <div key={i} className="flex space-x-4 p-4 rounded-lg border border-gray-100 dark:border-finance-medium-blue/20 hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 transition-colors mb-4">
                  <div className="rounded-md bg-finance-highlight dark:bg-finance-medium-blue/30 p-3">
                    <FileText className="h-6 w-6 text-finance-medium-blue dark:text-finance-accent-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <h3 className="font-medium text-finance-dark-blue dark:text-white">
                        Regulator Response {i+1}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Generated Response
                    </p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>Generated: {new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

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
