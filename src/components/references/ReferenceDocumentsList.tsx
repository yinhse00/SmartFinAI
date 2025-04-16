
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { categoryDisplayNames, DocumentCategory } from '@/types/references';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, FileText, Calendar, File, BookOpen, Target, Download } from 'lucide-react';

const ReferenceDocumentsList: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: documents, isLoading, error } = useReferenceDocuments(activeCategory === 'all' ? undefined : activeCategory);
  
  // Filter documents based on search query
  const filteredDocuments = documents?.filter(doc => 
    searchQuery === '' || 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );
  
  // Get icon based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'listing_rules':
        return <FileText className="h-6 w-6 text-finance-medium-blue dark:text-finance-accent-blue" />;
      case 'takeovers':
        return <Target className="h-6 w-6 text-finance-medium-blue dark:text-finance-accent-blue" />;
      case 'guidance':
        return <BookOpen className="h-6 w-6 text-finance-medium-blue dark:text-finance-accent-blue" />;
      default:
        return <File className="h-6 w-6 text-finance-medium-blue dark:text-finance-accent-blue" />;
    }
  };
  
  // Format file size
  const formatFileSize = (bytes: number | null): string => {
    if (bytes === null) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-4 grid grid-cols-4 md:grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="listing_rules">Listing Rules</TabsTrigger>
            <TabsTrigger value="takeovers">Takeovers Code</TabsTrigger>
            <TabsTrigger value="guidance">Interpretation and Guidance</TabsTrigger>
            <TabsTrigger value="decisions">Listing Review Committee Decisions</TabsTrigger>
            <TabsTrigger value="checklists">Checklists, Forms and Templates</TabsTrigger>
            <TabsTrigger value="other">Others</TabsTrigger>
          </TabsList>
          
          <div className="mt-2">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-3 w-[200px]" />
                      <div className="flex gap-4">
                        <Skeleton className="h-3 w-[100px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-red-500">Error loading documents. Please try again.</p>
              </div>
            ) : filteredDocuments?.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No documents match your search' : 'No documents available'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments?.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(doc.category)}
                            <div>
                              <div className="font-medium">{doc.title}</div>
                              {doc.description && (
                                <div className="text-xs text-gray-500">{doc.description}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {categoryDisplayNames[doc.category as DocumentCategory] || doc.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                        <TableCell>{format(new Date(doc.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <a 
                            href={doc.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-finance-medium-blue hover:text-finance-dark-blue"
                          >
                            <Download size={16} />
                            <span>View</span>
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredDocuments && filteredDocuments.length > 10 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious href="#" />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" isActive>1</PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext href="#" />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReferenceDocumentsList;
