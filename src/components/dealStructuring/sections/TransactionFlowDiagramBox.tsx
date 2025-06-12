
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, GitBranch, Building2 } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import DealStepsFlowDiagram from '../flow/DealStepsFlowDiagram';
import TransactionFlowControls from '../flow/TransactionFlowControls';
import { CorporateStructureDiagram } from './CorporateStructureDiagram';
import { TransactionFlow } from '@/types/transactionFlow';

interface TransactionFlowDiagramBoxProps {
  results: AnalysisResults;
}

// Convert analysis results to transaction flow format
const convertToTransactionFlow = (results: AnalysisResults): TransactionFlow | undefined => {
  if (!results.shareholdingChanges && !results.corporateStructure) {
    return undefined;
  }

  // Create sample transaction flow based on analysis results
  const before = {
    entities: results.shareholdingChanges?.before.map((shareholder, index) => ({
      id: `shareholder-${index}`,
      name: shareholder.name,
      type: shareholder.type === 'institutional' ? 'stockholder' as const : 'stockholder' as const,
      percentage: shareholder.percentage,
    })) || [
      { id: 'target-1', name: 'Target Company', type: 'target' as const },
      { id: 'stockholder-1', name: 'Existing Shareholders', type: 'stockholder' as const, percentage: 100 },
    ],
    relationships: [
      { source: 'stockholder-1', target: 'target-1', type: 'ownership' as const, percentage: 100 },
    ],
  };

  const after = {
    entities: [
      ...before.entities,
      { id: 'buyer-1', name: 'Acquiring Company', type: 'buyer' as const },
      { id: 'consideration-1', name: 'Cash Consideration', type: 'consideration' as const, value: 1000 },
    ],
    relationships: [
      { source: 'buyer-1', target: 'target-1', type: 'ownership' as const, percentage: 70 },
      { source: 'stockholder-1', target: 'target-1', type: 'ownership' as const, percentage: 30 },
      { source: 'buyer-1', target: 'consideration-1', type: 'consideration' as const, value: 700 },
    ],
  };

  return {
    before,
    after,
    transactionSteps: [
      {
        id: 'step-1',
        title: 'Due Diligence',
        description: 'Buyer conducts comprehensive due diligence',
        entities: ['buyer-1', 'target-1'],
      },
      {
        id: 'step-2',
        title: 'Share Purchase Agreement',
        description: 'Execution of share purchase agreement',
        entities: ['buyer-1', 'stockholder-1'],
      },
      {
        id: 'step-3',
        title: 'Completion',
        description: 'Transfer of shares and payment of consideration',
        entities: ['buyer-1', 'stockholder-1', 'consideration-1'],
      },
    ],
  };
};

export const TransactionFlowDiagramBox: React.FC<TransactionFlowDiagramBoxProps> = ({ results }) => {
  const [showBefore, setShowBefore] = useState(true);
  const transactionFlow = convertToTransactionFlow(results);

  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-500" />
          Transaction Structure Diagram
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <Tabs defaultValue="flow" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="flow" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Deal Flow
            </TabsTrigger>
            <TabsTrigger value="structure" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Corporate Structure
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="flow" className="h-[340px] mt-4 space-y-2">
            <TransactionFlowControls
              showBefore={showBefore}
              onToggleView={setShowBefore}
            />
            <div className="h-[290px]">
              <DealStepsFlowDiagram 
                transactionFlow={transactionFlow}
                showBefore={showBefore}
              />
            </div>
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
