
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Database as DatabaseIcon, Search, Filter, RefreshCcw, Download, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

// Mock data for database entries
const databaseEntries = [
  {
    id: '1',
    title: 'Related Party Transaction Requirements',
    category: 'Listing Rules',
    source: 'Chapter 14A',
    lastUpdated: '2023-06-15',
    status: 'Active',
  },
  {
    id: '2',
    title: 'Mandatory General Offer Threshold',
    category: 'Takeovers',
    source: 'Rule 26',
    lastUpdated: '2023-05-20',
    status: 'Active',
  },
  {
    id: '3',
    title: 'Profit Forecast Disclosure Requirements',
    category: 'Listing Rules',
    source: 'Practice Note 5',
    lastUpdated: '2023-04-18',
    status: 'Under Review',
  },
  {
    id: '4',
    title: 'Whitewash Waiver Procedures',
    category: 'Takeovers',
    source: 'Rule 26 Note 1',
    lastUpdated: '2023-03-22',
    status: 'Active',
  },
  {
    id: '5',
    title: 'Directors\' Fiduciary Duties',
    category: 'Guidance',
    source: 'SFC Guidance Note',
    lastUpdated: '2023-02-10',
    status: 'Active',
  },
  {
    id: '6',
    title: 'ESG Reporting Requirements',
    category: 'Listing Rules',
    source: 'Appendix 27',
    lastUpdated: '2023-01-05',
    status: 'Active',
  },
];

const Database = () => {
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Regulatory Database</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage and explore the structured knowledge base that powers the regulatory assistant
        </p>
      </div>
      
      <Card className="finance-card mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Database Management</CardTitle>
              <CardDescription>View, search and manage regulatory knowledge entries</CardDescription>
            </div>
            <Button className="bg-finance-medium-blue hover:bg-finance-dark-blue">
              <Plus className="mr-2 h-4 w-4" /> Add New Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="entries">
            <TabsList className="mb-4">
              <TabsTrigger value="entries">Knowledge Entries</TabsTrigger>
              <TabsTrigger value="structure">Database Structure</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="entries">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search knowledge entries..."
                      className="pl-9 w-full"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
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
                        <SelectItem value="guidance">Guidance</SelectItem>
                        <SelectItem value="precedents">Precedents</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" className="flex-shrink-0">
                      <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button variant="outline" className="flex-shrink-0">
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Entry Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {databaseEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.title}</TableCell>
                          <TableCell>{entry.category}</TableCell>
                          <TableCell>{entry.source}</TableCell>
                          <TableCell>{entry.lastUpdated}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                entry.status === 'Active' 
                                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                              }
                            >
                              {entry.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-between items-center">
                  <Button variant="outline" disabled>
                    Previous
                  </Button>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing 1-6 of 42 entries
                  </div>
                  <Button variant="outline">
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="structure">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Database Schema</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Knowledge Entries</h4>
                          <div className="text-xs bg-gray-50 dark:bg-finance-dark-blue/50 rounded-md p-3 font-mono">
                            <div className="text-finance-medium-blue dark:text-finance-accent-blue mb-1">Table: knowledge_entries</div>
                            <div>- id: string (primary key)</div>
                            <div>- title: string</div>
                            <div>- content: text</div>
                            <div>- category_id: string (foreign key)</div>
                            <div>- source: string</div>
                            <div>- last_updated: timestamp</div>
                            <div>- status: string</div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Categories</h4>
                          <div className="text-xs bg-gray-50 dark:bg-finance-dark-blue/50 rounded-md p-3 font-mono">
                            <div className="text-finance-medium-blue dark:text-finance-accent-blue mb-1">Table: categories</div>
                            <div>- id: string (primary key)</div>
                            <div>- name: string</div>
                            <div>- description: text</div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">References</h4>
                          <div className="text-xs bg-gray-50 dark:bg-finance-dark-blue/50 rounded-md p-3 font-mono">
                            <div className="text-finance-medium-blue dark:text-finance-accent-blue mb-1">Table: references</div>
                            <div>- id: string (primary key)</div>
                            <div>- title: string</div>
                            <div>- file_path: string</div>
                            <div>- file_type: string</div>
                            <div>- upload_date: timestamp</div>
                            <div>- category_id: string (foreign key)</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Database Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b">
                          <span className="font-medium">Total Entries:</span>
                          <span className="font-bold text-finance-dark-blue dark:text-white">1,256</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b">
                          <span className="font-medium">Categories:</span>
                          <span className="font-bold text-finance-dark-blue dark:text-white">7</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b">
                          <span className="font-medium">References:</span>
                          <span className="font-bold text-finance-dark-blue dark:text-white">342</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b">
                          <span className="font-medium">Last Update:</span>
                          <span className="font-bold text-finance-dark-blue dark:text-white">June 15, 2023</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Storage Used:</span>
                          <span className="font-bold text-finance-dark-blue dark:text-white">3.2 GB</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Entity Relationships</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-finance-dark-blue/30 rounded-lg border border-dashed">
                      <div className="text-center">
                        <DatabaseIcon className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">Entity Relationship Diagram</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Database visualization coming soon</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics">
              <div className="p-10 text-center">
                <DatabaseIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-6">
                  Advanced database analytics, performance metrics, and usage statistics will be available in a future update.
                </p>
                <Button variant="outline">Request Early Access</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Database;
