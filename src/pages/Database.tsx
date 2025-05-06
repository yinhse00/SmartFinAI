
import { useEffect, useState } from 'react';
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
import { 
  Database as DatabaseIcon, 
  Search, 
  Filter, 
  RefreshCcw, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Upload,
  AlertCircle,
  X
} from 'lucide-react';
import { databaseService } from '@/services/databaseService';
import { RegulatoryEntry } from '@/services/database/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Database = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<RegulatoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [importFormat, setImportFormat] = useState('json');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  // Form state for adding/editing provisions
  const [formData, setFormData] = useState({
    ruleNumber: '',
    title: '',
    content: '',
    chapter: '',
    section: '',
    categoryCode: 'CH14',
  });

  // Function to load data
  const loadData = async () => {
    setLoading(true);
    try {
      let data: RegulatoryEntry[];
      
      if (activeCategory === 'all') {
        data = await databaseService.getAllEntries();
      } else {
        data = await databaseService.getEntriesByCategory(activeCategory);
      }
      
      setEntries(data);
    } catch (error) {
      console.error('Error loading database entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load database entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on initial render and when category changes
  useEffect(() => {
    loadData();
  }, [activeCategory]);

  // Handle search
  const filteredEntries = entries.filter(entry => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      entry.title.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query) ||
      entry.source.toLowerCase().includes(query) ||
      String(entry.id).toLowerCase().includes(query)
    );
  });
  
  // Handle adding a new provision
  const handleAddProvision = async () => {
    try {
      const id = await databaseService.addProvision({
        ruleNumber: formData.ruleNumber,
        title: formData.title,
        content: formData.content,
        chapter: formData.chapter,
        section: formData.section,
        categoryCode: formData.categoryCode,
      });
      
      if (id) {
        toast({
          title: 'Success',
          description: 'Provision added successfully',
        });
        setIsAddDialogOpen(false);
        loadData();
        resetForm();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add provision',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding provision:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while adding the provision',
        variant: 'destructive',
      });
    }
  };
  
  // Handle bulk import
  const handleBulkImport = async () => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      let provisions;
      
      if (importFormat === 'json') {
        provisions = JSON.parse(importData);
      } else {
        // CSV format - simple implementation for demo purposes
        provisions = importData.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [ruleNumber, title, content, chapter, section, categoryCode] = line.split(',');
            return {
              ruleNumber: ruleNumber?.trim() || '',
              title: title?.trim() || '',
              content: content?.trim() || '',
              chapter: chapter?.trim(),
              section: section?.trim(),
              categoryCode: categoryCode?.trim() || 'OTHER',
            };
          });
      }
      
      if (!Array.isArray(provisions)) {
        throw new Error('Invalid import format. Expected an array of provisions.');
      }
      
      const result = await databaseService.bulkImportProvisions(provisions);
      
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.success} provisions. Failed: ${result.failed}`,
        variant: result.failed > 0 ? 'destructive' : 'default',
      });
      
      if (result.success > 0) {
        setIsImportDialogOpen(false);
        setImportData('');
        loadData();
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error instanceof Error ? error.message : 'Invalid import data');
      toast({
        title: 'Import Failed',
        description: 'Could not process the import data',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      ruleNumber: '',
      title: '',
      content: '',
      chapter: '',
      section: '',
      categoryCode: 'CH14',
    });
  };

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
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsImportDialogOpen(true)} 
                variant="outline"
                className="bg-finance-light-blue hover:bg-finance-medium-blue text-white"
              >
                <Upload className="mr-2 h-4 w-4" /> Import Data
              </Button>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-finance-medium-blue hover:bg-finance-dark-blue"
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Entry
              </Button>
            </div>
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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select 
                      defaultValue="all" 
                      value={activeCategory}
                      onValueChange={setActiveCategory}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <div className="flex items-center">
                          <Filter className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Category" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="listing_rules">Listing Rules</SelectItem>
                        <SelectItem value="takeovers">Takeovers</SelectItem>
                        <SelectItem value="guidance">Guidance</SelectItem>
                        <SelectItem value="decisions">Decisions</SelectItem>
                        <SelectItem value="checklists">Checklists</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" className="flex-shrink-0" onClick={loadData} disabled={loading}>
                      <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
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
                        <TableHead>Rule Number</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex items-center justify-center">
                              <RefreshCcw className="animate-spin h-6 w-6 mr-2 text-finance-medium-blue" />
                              <span>Loading entries...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredEntries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No entries found. {searchQuery ? 'Try a different search query.' : 'Add some entries to get started.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">{entry.title}</TableCell>
                            <TableCell>{entry.source.split(' ')[1] || '-'}</TableCell>
                            <TableCell>{entry.category}</TableCell>
                            <TableCell>{entry.source}</TableCell>
                            <TableCell>{entry.lastUpdated.toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={
                                  entry.status === 'active' 
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-between items-center">
                  <Button variant="outline" disabled>
                    Previous
                  </Button>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {filteredEntries.length} entries
                  </div>
                  <Button variant="outline">
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Database Structure Tab */}
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
                          <h4 className="text-sm font-medium mb-2">Regulatory Provisions</h4>
                          <div className="text-xs bg-gray-50 dark:bg-finance-dark-blue/50 rounded-md p-3 font-mono">
                            <div className="text-finance-medium-blue dark:text-finance-accent-blue mb-1">Table: regulatory_provisions</div>
                            <div>- id: uuid (primary key)</div>
                            <div>- rule_number: string</div>
                            <div>- title: string</div>
                            <div>- content: text</div>
                            <div>- chapter: string</div>
                            <div>- section: string</div>
                            <div>- category_id: uuid (foreign key)</div>
                            <div>- is_current: boolean</div>
                            <div>- last_updated: timestamp</div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Categories</h4>
                          <div className="text-xs bg-gray-50 dark:bg-finance-dark-blue/50 rounded-md p-3 font-mono">
                            <div className="text-finance-medium-blue dark:text-finance-accent-blue mb-1">Table: regulatory_categories</div>
                            <div>- id: uuid (primary key)</div>
                            <div>- code: string</div>
                            <div>- name: string</div>
                            <div>- description: text</div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Search Index</h4>
                          <div className="text-xs bg-gray-50 dark:bg-finance-dark-blue/50 rounded-md p-3 font-mono">
                            <div className="text-finance-medium-blue dark:text-finance-accent-blue mb-1">Table: search_index</div>
                            <div>- id: uuid (primary key)</div>
                            <div>- provision_id: uuid (foreign key)</div>
                            <div>- full_text: text</div>
                            <div>- search_vector: tsvector</div>
                            <div>- keywords: text[]</div>
                            <div>- last_indexed: timestamp</div>
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
                          <span className="font-medium">Total Provisions:</span>
                          <span className="font-bold text-finance-dark-blue dark:text-white">{entries.length}</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b">
                          <span className="font-medium">Categories:</span>
                          <span className="font-bold text-finance-dark-blue dark:text-white">7</span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b">
                          <span className="font-medium">Last Update:</span>
                          <span className="font-bold text-finance-dark-blue dark:text-white">
                            {entries.length > 0
                              ? new Date(Math.max(...entries.map(e => e.lastUpdated.getTime()))).toLocaleDateString()
                              : 'No entries'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics">
              <div className="p-10 text-center">
                <DatabaseIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-6">
                  Advanced database analytics, performance metrics, and usage statistics will be available in a future update.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Add Provision Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Regulatory Provision</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <Label htmlFor="ruleNumber">Rule Number</Label>
                <Input
                  id="ruleNumber"
                  placeholder="e.g. 14.01"
                  value={formData.ruleNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, ruleNumber: e.target.value }))}
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="categoryCode">Category</Label>
                <Select 
                  value={formData.categoryCode}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryCode: value }))}
                >
                  <SelectTrigger id="categoryCode">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CH13">Chapter 13</SelectItem>
                    <SelectItem value="CH14">Chapter 14</SelectItem>
                    <SelectItem value="CH14A">Chapter 14A</SelectItem>
                    <SelectItem value="TO">Takeovers</SelectItem>
                    <SelectItem value="GN">Guidance</SelectItem>
                    <SelectItem value="LD">Decisions</SelectItem>
                    <SelectItem value="CL">Checklists</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <Label htmlFor="chapter">Chapter</Label>
                <Input
                  id="chapter"
                  placeholder="e.g. Chapter 14"
                  value={formData.chapter}
                  onChange={(e) => setFormData(prev => ({ ...prev, chapter: e.target.value }))}
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  placeholder="e.g. 14.01"
                  value={formData.section}
                  onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Provision title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter provision content"
                className="min-h-[150px]"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddProvision}
              disabled={!formData.ruleNumber || !formData.title || !formData.content}
              className="bg-finance-medium-blue hover:bg-finance-dark-blue"
            >
              Add Provision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Data Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Import Regulatory Data</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="importFormat">Import Format</Label>
                <Select 
                  value={importFormat}
                  onValueChange={setImportFormat}
                >
                  <SelectTrigger id="importFormat" className="w-[180px]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Format Example</Label>
                <div className="text-sm bg-gray-50 dark:bg-finance-dark-blue/20 border rounded p-2 mt-2 text-gray-600 dark:text-gray-300">
                  {importFormat === 'json' ? (
                    <code>
                      [{"ruleNumber": "14.01", "title": "Rule Title", "content": "Rule content", "chapter": "Chapter 14", "section": "14.01", "categoryCode": "CH14"}]
                    </code>
                  ) : (
                    <code>
                      14.01,Rule Title,Rule content,Chapter 14,14.01,CH14
                    </code>
                  )}
                </div>
              </div>
            </div>
            
            {importError && (
              <Alert variant="destructive" className="my-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import Error</AlertTitle>
                <AlertDescription>
                  {importError}
                </AlertDescription>
                <X 
                  className="h-4 w-4 absolute right-2 top-2 cursor-pointer" 
                  onClick={() => setImportError(null)} 
                />
              </Alert>
            )}
            
            <div>
              <Label htmlFor="importData">Data Input</Label>
              <Textarea
                id="importData"
                placeholder={`Paste your ${importFormat.toUpperCase()} data here`}
                className="min-h-[250px] font-mono"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleBulkImport}
              disabled={!importData.trim() || isImporting}
              className="bg-finance-medium-blue hover:bg-finance-dark-blue"
            >
              {isImporting ? (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>Import Data</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Database;
