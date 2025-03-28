
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Calendar, 
  ChevronRight, 
  MessageSquare, 
  Filter,
  Download,
  Bookmark,
  Clock,
  CalendarIcon 
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for query history
const queries = [
  {
    id: '1',
    query: 'What are the disclosure requirements for related party transactions?',
    timestamp: 'Today, 10:23 AM',
    category: 'Listing Rules',
    saved: true,
  },
  {
    id: '2',
    query: 'How to handle a mandatory general offer triggered by share repurchase?',
    timestamp: 'Yesterday, 4:15 PM',
    category: 'Takeovers',
    saved: false,
  },
  {
    id: '3',
    query: 'Requirements for profit forecast in IPO prospectus',
    timestamp: 'Jun 12, 2023, 11:30 AM',
    category: 'Listing Rules',
    saved: true,
  },
  {
    id: '4',
    query: 'Procedures for whitewash waiver application',
    timestamp: 'Jun 10, 2023, 9:45 AM',
    category: 'Takeovers',
    saved: false,
  },
  {
    id: '5',
    query: 'What are the continuing obligations for a listed company after IPO?',
    timestamp: 'Jun 8, 2023, 2:20 PM',
    category: 'Listing Rules',
    saved: false,
  },
  {
    id: '6',
    query: 'Disclosure requirements for directors\' shareholdings',
    timestamp: 'Jun 5, 2023, 5:10 PM',
    category: 'Disclosure',
    saved: true,
  },
  {
    id: '7',
    query: 'Requirements for issuing a profit warning announcement',
    timestamp: 'Jun 1, 2023, 3:30 PM',
    category: 'Disclosure',
    saved: false,
  },
];

const History = () => {
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Query History</h1>
        <p className="text-gray-600 dark:text-gray-300">
          View and manage your previous regulatory queries and responses
        </p>
      </div>
      
      <Card className="finance-card mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="search"
                placeholder="Search your query history..."
                className="pl-9 w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="listing">Listing Rules</SelectItem>
                  <SelectItem value="takeovers">Takeovers</SelectItem>
                  <SelectItem value="disclosure">Disclosure</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="month">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Time Period" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="quarter">Past 3 Months</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" className="flex-shrink-0">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Queries</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-0 border rounded-lg">
              {queries.map((query, index) => (
                <div key={query.id}>
                  <div className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 transition-colors">
                    <div className="mr-4 bg-finance-highlight dark:bg-finance-medium-blue/30 p-2 rounded-md">
                      <MessageSquare className="h-5 w-5 text-finance-medium-blue dark:text-finance-accent-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center mb-1">
                        <Badge variant="outline" className="text-xs font-normal bg-finance-highlight/70 dark:bg-finance-medium-blue/30 text-finance-medium-blue dark:text-finance-accent-blue">
                          {query.category}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {query.timestamp}
                        </div>
                        {query.saved && (
                          <Badge variant="outline" className="text-xs font-normal bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                            <Bookmark className="h-3 w-3 mr-1" /> Saved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-finance-dark-blue dark:text-white truncate">{query.query}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-2 text-gray-400 hover:text-finance-medium-blue dark:hover:text-finance-accent-blue">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                  {index < queries.length - 1 && <Separator />}
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="saved" className="space-y-0 border rounded-lg">
              {queries.filter(q => q.saved).map((query, index, filtered) => (
                <div key={query.id}>
                  <div className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 transition-colors">
                    <div className="mr-4 bg-finance-highlight dark:bg-finance-medium-blue/30 p-2 rounded-md">
                      <MessageSquare className="h-5 w-5 text-finance-medium-blue dark:text-finance-accent-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center mb-1">
                        <Badge variant="outline" className="text-xs font-normal bg-finance-highlight/70 dark:bg-finance-medium-blue/30 text-finance-medium-blue dark:text-finance-accent-blue">
                          {query.category}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {query.timestamp}
                        </div>
                        <Badge variant="outline" className="text-xs font-normal bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                          <Bookmark className="h-3 w-3 mr-1" /> Saved
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-finance-dark-blue dark:text-white truncate">{query.query}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-2 text-gray-400 hover:text-finance-medium-blue dark:hover:text-finance-accent-blue">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                  {index < filtered.length - 1 && <Separator />}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center">
        <Button variant="outline" disabled>
          Previous
        </Button>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Page 1 of 3
        </div>
        <Button variant="outline">
          Next
        </Button>
      </div>
    </MainLayout>
  );
};

export default History;
