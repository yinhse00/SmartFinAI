
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { File, Link as LinkIcon } from 'lucide-react';

const KnowledgePanel: React.FC = () => {
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
                  <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                    <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                    <span>HKEx Listing Rules Chapter 14A</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                    <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                    <span>SFC Guidance Note on Directors' Duties</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  Takeovers Code
                  <Badge variant="outline" className="ml-auto text-xs font-normal">AI Analysis</Badge>
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                    <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                    <span>SFC Takeovers Code Rule 26</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 dark:bg-finance-medium-blue/10">
                    <LinkIcon size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                    <span>Executive Decisions 2022-04</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="recent" className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 cursor-pointer">
                <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                <div>
                  <div className="font-medium">IPO Due Diligence Guide</div>
                  <div className="text-gray-500">Viewed yesterday</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 cursor-pointer">
                <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                <div>
                  <div className="font-medium">Profit Forecast Requirements</div>
                  <div className="text-gray-500">Viewed 3 days ago</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-gray-50 dark:hover:bg-finance-medium-blue/10 cursor-pointer">
                <File size={14} className="text-finance-medium-blue dark:text-finance-accent-blue" />
                <div>
                  <div className="font-medium">Whitewash Waiver Practice Note</div>
                  <div className="text-gray-500">Viewed 1 week ago</div>
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
