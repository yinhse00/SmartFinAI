
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { File, FileText, FileSearch, BookOpen, Target } from 'lucide-react';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const KnowledgePanel: React.FC = () => {
  const { data: documents, isLoading } = useReferenceDocuments();
  const [activeSection, setActiveSection] = useState('listing');
  
  // Get the most recent 5 documents
  const recentDocuments = documents 
    ? [...documents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
    : [];
  
  // Get listing rules and takeovers documents
  const listingRulesDocuments = documents?.filter(doc => doc.category === 'listing_rules').slice(0, 3) || [];
  const takeoversDocuments = documents?.filter(doc => doc.category === 'takeovers').slice(0, 3) || [];

  // Sections for the "related" tab
  const sections = {
    listing: {
      title: "Listing Rules",
      defaultDocs: [
        { id: "1", title: "HKEX Listing Rules Chapter 8", description: "Qualifications for Listing" },
        { id: "2", title: "HKEX Listing Rules Chapter 14A", description: "Connected Transactions" }
      ],
      icon: <FileText size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
    },
    takeovers: {
      title: "Takeovers Code",
      defaultDocs: [
        { id: "1", title: "SFC Takeovers Code Rule 26", description: "Mandatory General Offers" }
      ],
      icon: <Target size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
    },
    guidance: {
      title: "Guidance",
      defaultDocs: [
        { id: "1", title: "HKEX Guidance Letter", description: "Listing Document Disclosure" }
      ],
      icon: <BookOpen size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
    }
  };

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
              <div className="flex space-x-2 text-xs mb-4">
                <button 
                  onClick={() => setActiveSection('listing')}
                  className={`px-2 py-1 rounded-md ${activeSection === 'listing' ? 'bg-finance-light-blue/20 text-finance-dark-blue' : 'hover:bg-gray-100 dark:hover:bg-finance-dark-blue/20'}`}
                >
                  Listing Rules
                </button>
                <button 
                  onClick={() => setActiveSection('takeovers')}
                  className={`px-2 py-1 rounded-md ${activeSection === 'takeovers' ? 'bg-finance-light-blue/20 text-finance-dark-blue' : 'hover:bg-gray-100 dark:hover:bg-finance-dark-blue/20'}`}
                >
                  Takeovers
                </button>
                <button 
                  onClick={() => setActiveSection('guidance')}
                  className={`px-2 py-1 rounded-md ${activeSection === 'guidance' ? 'bg-finance-light-blue/20 text-finance-dark-blue' : 'hover:bg-gray-100 dark:hover:bg-finance-dark-blue/20'}`}
                >
                  Guidance
                </button>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  {sections[activeSection as keyof typeof sections].title}
                  <Badge variant="outline" className="ml-auto text-xs font-normal">AI Analysis</Badge>
                </h4>
                <div className="space-y-2">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </>
                  ) : activeSection === 'listing' && listingRulesDocuments.length > 0 ? (
                    listingRulesDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                        <FileSearch size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
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
                  ) : activeSection === 'takeovers' && takeoversDocuments.length > 0 ? (
                    takeoversDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                        <FileSearch size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
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
                    sections[activeSection as keyof typeof sections].defaultDocs.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                        {sections[activeSection as keyof typeof sections].icon}
                        <div>
                          <span className="font-medium">{doc.title}</span>
                          {doc.description && (
                            <p className="text-gray-500 text-xs">{doc.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2">Database References</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                    <FileText size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                    <div>
                      <span className="font-medium">Rule 8.05 - Qualifications for Listing</span>
                      <p className="text-gray-500 text-xs">HKEX Listing Rules Chapter 8</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                    <FileText size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                    <div>
                      <span className="font-medium">Connected Transactions</span>
                      <p className="text-gray-500 text-xs">HKEX Listing Rules Chapter 14A</p>
                    </div>
                  </div>
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
