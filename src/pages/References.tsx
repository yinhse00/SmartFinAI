
import MainLayout from '@/components/layout/MainLayout';
import ReferenceUploader from '@/components/references/ReferenceUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, File, Calendar, FileText, BookOpen, Target } from 'lucide-react';

const ReferencesList = () => {
  return (
    <Card className="finance-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Knowledge Base Documents</CardTitle>
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
        <Tabs defaultValue="listing">
          <TabsList className="w-full mb-4 grid grid-cols-4">
            <TabsTrigger value="listing">Listing Rules</TabsTrigger>
            <TabsTrigger value="takeovers">Takeovers</TabsTrigger>
            <TabsTrigger value="guidance">Guidance</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
          
          <TabsContent value="listing" className="space-y-4">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex space-x-4 p-4 rounded-lg border border-gray-100 dark:border-finance-medium-blue/20 hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 transition-colors">
                <div className="rounded-md bg-finance-highlight dark:bg-finance-medium-blue/30 p-3">
                  <FileText className="h-6 w-6 text-finance-medium-blue dark:text-finance-accent-blue" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <h3 className="font-medium text-finance-dark-blue dark:text-white">
                      HKEx Listing Rules - Chapter {i + 14}
                    </h3>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {i === 0 ? "Connected Transactions" : 
                     i === 1 ? "Notifiable Transactions" : 
                     i === 2 ? "Equity Securities" : "Financial Information"}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>Updated: May 2023</span>
                    </div>
                    <div className="flex items-center">
                      <File className="h-3.5 w-3.5 mr-1" />
                      <span>42 pages</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="takeovers" className="space-y-4">
            {[1, 2].map((_, i) => (
              <div key={i} className="flex space-x-4 p-4 rounded-lg border border-gray-100 dark:border-finance-medium-blue/20 hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 transition-colors">
                <div className="rounded-md bg-finance-highlight dark:bg-finance-medium-blue/30 p-3">
                  <Target className="h-6 w-6 text-finance-medium-blue dark:text-finance-accent-blue" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <h3 className="font-medium text-finance-dark-blue dark:text-white">
                      {i === 0 ? "SFC Takeovers Code" : "SFC Share Repurchases Code"}
                    </h3>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {i === 0 ? "Main text including rules 1-38" : "Share Repurchase regulations"}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>Updated: March 2023</span>
                    </div>
                    <div className="flex items-center">
                      <File className="h-3.5 w-3.5 mr-1" />
                      <span>{i === 0 ? "78" : "36"} pages</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="guidance" className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex space-x-4 p-4 rounded-lg border border-gray-100 dark:border-finance-medium-blue/20 hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 transition-colors">
                <div className="rounded-md bg-finance-highlight dark:bg-finance-medium-blue/30 p-3">
                  <BookOpen className="h-6 w-6 text-finance-medium-blue dark:text-finance-accent-blue" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <h3 className="font-medium text-finance-dark-blue dark:text-white">
                      {i === 0 ? "Guidance on Directors' Duties" : 
                       i === 1 ? "Practice Note on Due Diligence" : "ESG Reporting Guide"}
                    </h3>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {i === 0 ? "Securities and Futures Commission" : 
                     i === 1 ? "Hong Kong Stock Exchange" : "HKEx Listed Issuers"}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>Updated: {i === 0 ? "January 2023" : i === 1 ? "April 2023" : "December 2022"}</span>
                    </div>
                    <div className="flex items-center">
                      <File className="h-3.5 w-3.5 mr-1" />
                      <span>{i === 0 ? "16" : i === 1 ? "28" : "52"} pages</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="other">
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No other documents available</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const References = () => {
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Reference Management</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Upload and manage regulatory documents to enhance the system's knowledge
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReferencesList />
        </div>
        <div>
          <ReferenceUploader />
        </div>
      </div>
    </MainLayout>
  );
};

export default References;
