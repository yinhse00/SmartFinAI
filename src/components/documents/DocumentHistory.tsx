
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, Calendar } from 'lucide-react';
import { useState } from 'react';
import DocumentListItem from './DocumentListItem';

const DocumentHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              <DocumentListItem 
                key={i} 
                title={i % 2 === 0 ? `IPO Prospectus Draft ${i+1}` : `Regulator Response ${i}`}
                type={i % 2 === 0 ? "Uploaded Document" : "Generated Response"}
                date={new Date()}
                datePrefix={i % 2 === 0 ? "Uploaded: " : "Generated: "}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="uploaded">
            <div className="py-4">
              {[1, 2].map((_, i) => (
                <DocumentListItem 
                  key={i} 
                  title={`IPO Prospectus Draft ${i+1}`}
                  type="Uploaded Document"
                  date={new Date()}
                  datePrefix="Uploaded: "
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="generated">
            <div className="py-4">
              {[1, 2].map((_, i) => (
                <DocumentListItem 
                  key={i} 
                  title={`Regulator Response ${i+1}`}
                  type="Generated Response"
                  date={new Date()}
                  datePrefix="Generated: "
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DocumentHistory;
