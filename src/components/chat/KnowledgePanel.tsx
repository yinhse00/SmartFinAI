
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { File, Link as LinkIcon, FileText } from 'lucide-react';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const KnowledgePanel: React.FC = () => {
  const { data: documents, isLoading } = useReferenceDocuments();
  
  // Get the most recent 5 documents
  const recentDocuments = documents 
    ? [...documents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
    : [];
  
  // Get listing rules and takeovers documents
  const listingRulesDocuments = documents?.filter(doc => doc.category === 'listing_rules').slice(0, 2) || [];
  const takeoversDocuments = documents?.filter(doc => doc.category === 'takeovers').slice(0, 2) || [];

  return (
    <div className="w-80 hidden lg:block">
      <Card className="finance-card h-full">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg font-medium">Knowledge Base</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="related">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="related">Related</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
            
            <TabsContent value="related" className="p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  Listing Rules
                  <Badge variant="outline" className="ml-auto text-xs font-normal">AI Analysis</Badge>
                </h4>
                <div className="space-y-2">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </>
                  ) : listingRulesDocuments.length > 0 ? (
                    listingRulesDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                        <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                        <a 
                          href={doc.file_url}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-finance-medium-blue hover:text-finance-dark-blue"
                        >
                          {doc.title}
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                      <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                      <span>HKEx Listing Rules Chapter 14A</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  Takeovers Code
                  <Badge variant="outline" className="ml-auto text-xs font-normal">AI Analysis</Badge>
                </h4>
                <div className="space-y-2">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </>
                  ) : takeoversDocuments.length > 0 ? (
                    takeoversDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                        <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                        <a 
                          href={doc.file_url}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-finance-medium-blue hover:text-finance-dark-blue"
                        >
                          {doc.title}
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                      <FileText size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                      <span>SFC Takeovers Code Rule 26</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="recent" className="p-4 space-y-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : recentDocuments.length > 0 ? (
                recentDocuments.map(doc => (
                  <a 
                    key={doc.id}
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 cursor-pointer"
                  >
                    <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                    <div>
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-gray-500">Viewed {format(new Date(doc.created_at), 'MMM d, yyyy')}</div>
                    </div>
                  </a>
                ))
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">
                  No recent documents
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgePanel;
