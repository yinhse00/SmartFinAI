
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResponseForm from './ResponseForm';
import TranslationForm from './TranslationForm';

const ResponseGenerator = () => {
  const [activeTab, setActiveTab] = useState<string>('response');
  
  return (
    <Card className="finance-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Generate Content</CardTitle>
        <CardDescription>
          Create responses and translations using Grok AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="response" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="response">Regulatory Response</TabsTrigger>
            <TabsTrigger value="translation">Translation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="response">
            <ResponseForm />
          </TabsContent>
          
          <TabsContent value="translation">
            <TranslationForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ResponseGenerator;
