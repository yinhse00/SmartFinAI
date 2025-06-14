
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, PieChart } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { ShareholdingDiagramVisualization } from './ShareholdingDiagramVisualization';
import { CorporateStructureDiagram } from './CorporateStructureDiagram';
import { extractEntityNames } from '@/services/dealStructuring/converterUtils/entityHelpers'; // Added import

interface TransactionStructureDiagramBoxProps {
  results: AnalysisResults;
}

export const TransactionStructureDiagramBox = ({ results }: TransactionStructureDiagramBoxProps) => {
  const entityNames = extractEntityNames(results); // Extract entity names

  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-500" />
          Transaction Structure Diagram
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <Tabs defaultValue="shareholding" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shareholding" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Shareholding Changes
            </TabsTrigger>
            <TabsTrigger value="structure" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Corporate Structure
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="shareholding" className="h-[340px] mt-4">
            <ShareholdingDiagramVisualization 
              shareholdingChanges={results.shareholdingChanges}
              fallbackData={results.shareholding}
              paymentStructure={results.structure?.majorTerms?.paymentStructure}
              dealEconomics={results.dealEconomics}
              acquiringCompanyName={entityNames.acquiringCompanyName}
              targetCompanyName={entityNames.targetCompanyName}
            />
          </TabsContent>
          
          <TabsContent value="structure" className="h-[340px] mt-4">
            <CorporateStructureDiagram 
              corporateStructure={results.corporateStructure}
              transactionType={results.transactionType}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

