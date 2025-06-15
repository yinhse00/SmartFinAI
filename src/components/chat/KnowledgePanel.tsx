
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Target, BookOpen } from 'lucide-react';

const KnowledgePanel: React.FC = () => {
  const [activeSection, setActiveSection] = useState('listing');
  
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
            <TabsList className="w-full grid grid-cols-1">
              <TabsTrigger value="related">Related</TabsTrigger>
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
                  {sections[activeSection as keyof typeof sections].defaultDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                      {sections[activeSection as keyof typeof sections].icon}
                      <div>
                        <span className="font-medium">{doc.title}</span>
                        {doc.description && (
                          <p className="text-gray-500 text-xs">{doc.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgePanel;
