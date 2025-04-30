import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, Calendar, Filter } from 'lucide-react';
import { useState } from 'react';
import DocumentListItem from './DocumentListItem';
import { Skeleton } from '@/components/ui/skeleton';

const DocumentHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Simulate loading for demo purposes
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 800);
    }
  };
  
  return (
    <Card className="finance-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-medium">Recent Documents</CardTitle>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="search"
              placeholder="Search documents..."
              className="pl-8 w-full sm:w-[200px] md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
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
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex space-x-4 p-4 border rounded-lg mb-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))
            ) : (
              [1, 2, 3, 4].map((_, i) => (
                <DocumentListItem 
                  key={i} 
                  title={i % 2 === 0 ? `IPO Prospectus Draft ${i+1}` : `Regulator Response ${i}`}
                  type={i % 2 === 0 ? "Uploaded Document" : "Generated Response"}
                  date={new Date()}
                  datePrefix={i % 2 === 0 ? "Uploaded: " : "Generated: "}
                  isHighlighted={i === 0}
                  onClick={() => console.log(`Document ${i} clicked`)}
                />
              ))
            )}
            
            {!isLoading && searchQuery && searchQuery.length > 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No results match your search query: "{searchQuery}"
              </div>
            )}
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
