
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, GitBranch, Building2, LayoutGrid } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import DealStepsFlowDiagram from '../flow/DealStepsFlowDiagram';
import TransactionFlowControls from '../flow/TransactionFlowControls';
import { CorporateStructureDiagram } from './CorporateStructureDiagram';
import CombinedTransactionFlowDiagram from '../flow/CombinedTransactionFlowDiagram';
import { TransactionFlow } from '@/types/transactionFlow';
import { EnlargedContentDialog } from '../dialogs/EnlargedContentDialog';

interface TransactionFlowDiagramBoxProps {
  results: AnalysisResults;
}

// Convert analysis results to transaction flow format
const convertToTransactionFlow = (results: AnalysisResults): TransactionFlow | undefined => {
  if (!results.shareholdingChanges && !results.corporateStructure) {
    return undefined;
  }

  // Create enhanced transaction flow based on analysis results
  const before = {
    entities: results.shareholdingChanges?.before.map((shareholder, index) => ({
      id: `before-shareholder-${index}`,
      name: shareholder.name,
      type: shareholder.type === 'institutional' ? 'stockholder' as const : 'stockholder' as const,
      percentage: shareholder.percentage,
    })) || [
      { id: 'before-target-1', name: 'Target Company', type: 'target' as const },
      { id: 'before-stockholder-1', name: 'Existing Shareholders', type: 'stockholder' as const, percentage: 100 },
    ],
    relationships: [
      { source: 'before-stockholder-1', target: 'before-target-1', type: 'ownership' as const, percentage: 100 },
    ],
  };

  const after = {
    entities: [
      { id: 'after-target-1', name: 'Target Company', type: 'target' as const },
      { id: 'after-buyer-1', name: 'Acquiring Company', type: 'buyer' as const },
      { id: 'after-stockholder-1', name: 'Existing Shareholders', type: 'stockholder' as const, percentage: 30 },
      { id: 'after-consideration-1', name: 'Cash Consideration', type: 'consideration' as const, value: 1000 },
    ],
    relationships: [
      { source: 'after-buyer-1', target: 'after-target-1', type: 'ownership' as const, percentage: 70 },
      { source: 'after-stockholder-1', target: 'after-target-1', type: 'ownership' as const, percentage: 30 },
      { source: 'after-buyer-1', target: 'after-consideration-1', type: 'consideration' as const, value: 1000 },
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
        entities: ['after-buyer-1', 'after-target-1'],
      },
      {
        id: 'step-2',
        title: 'Share Purchase Agreement',
        description: 'Execution of share purchase agreement',
        entities: ['after-buyer-1', 'after-stockholder-1'],
      },
      {
        id: 'step-3',
        title: 'Completion',
        description: 'Transfer of shares and payment of consideration',
        entities: ['after-buyer-1', 'after-stockholder-1', 'after-consideration-1'],
      },
    ],
  };
};

const EnlargedFlowContent = ({ results }: { results: AnalysisResults }) => {
  const [showBefore, setShowBefore] = useState(true);
  const transactionFlow = convertToTransactionFlow(results);

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="combined" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="combined" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Combined View
          </TabsTrigger>
          <TabsTrigger value="flow" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Deal Flow
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Corporate Structure
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="combined" className="flex-1 space-y-4">
          <TransactionFlowControls
            showBefore={showBefore}
            onToggleView={setShowBefore}
          />
          <div className="h-[600px]">
            <CombinedTransactionFlowDiagram 
              transactionFlow={transactionFlow}
              showBefore={showBefore}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="flow" className="flex-1 space-y-4">
          <TransactionFlowControls
            showBefore={showBefore}
            onToggleView={setShowBefore}
          />
          <div className="h-[600px]">
            <DealStepsFlowDiagram 
              transactionFlow={transactionFlow}
              showBefore={showBefore}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="structure" className="flex-1">
          <div className="h-[650px]">
            <CorporateStructureDiagram 
              corporateStructure={results.corporateStructure}
              transactionType={results.transactionType}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const TransactionFlowDiagramBox: React.FC<TransactionFlowDiagramBoxProps> = ({ results }) => {
  const [showBefore, setShowBefore] = useState(true);
  const transactionFlow = convertToTransactionFlow(results);

  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-500" />
            Transaction Structure Diagram
          </CardTitle>
          <EnlargedContentDialog
            title="Transaction Structure & Flow Analysis"
            enlargedContent={<EnlargedFlowContent results={results} />}
            size="full"
          >
            <div />
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="h-[400px]">
        <Tabs defaultValue="combined" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="combined" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Combined
            </TabsTrigger>
            <TabsTrigger value="flow" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Deal Flow
            </TabsTrigger>
            <TabsTrigger value="structure" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Structure
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="combined" className="h-[340px] mt-4 space-y-2">
            <TransactionFlowControls
              showBefore={showBefore}
              onToggleView={setShowBefore}
            />
            <div className="h-[290px]">
              <CombinedTransactionFlowDiagram 
                transactionFlow={transactionFlow}
                showBefore={showBefore}
              />
            </div>
          </TabsContent>
          
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
