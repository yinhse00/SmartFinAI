
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
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

  // Create comprehensive transaction flow based on analysis results
  const before = {
    entities: [
      { id: 'before-target-1', name: 'Target Company', type: 'target' as const },
      { id: 'before-stockholder-1', name: 'Existing Shareholders', type: 'stockholder' as const, percentage: 100 },
      ...(results.corporateStructure?.entities?.filter(e => e.type === 'subsidiary').map((entity, index) => ({
        id: `before-subsidiary-${index}`,
        name: entity.name,
        type: 'subsidiary' as const,
        percentage: results.corporateStructure?.relationships?.find(r => r.child === entity.id)?.ownershipPercentage || 100
      })) || [])
    ],
    relationships: [
      { source: 'before-stockholder-1', target: 'before-target-1', type: 'ownership' as const, percentage: 100 },
      // Add subsidiary relationships
      ...(results.corporateStructure?.relationships?.map((rel, index) => ({
        source: `before-target-1`,
        target: `before-subsidiary-${index}`,
        type: 'subsidiary' as const,
        percentage: rel.ownershipPercentage
      })) || [])
    ],
  };

  const after = {
    entities: [
      { id: 'after-target-1', name: 'Target Company', type: 'target' as const },
      { id: 'after-buyer-1', name: 'Acquiring Company', type: 'buyer' as const, percentage: 70 },
      { id: 'after-stockholder-1', name: 'Remaining Shareholders', type: 'stockholder' as const, percentage: 30 },
      { id: 'after-consideration-1', name: 'Cash Consideration', type: 'consideration' as const, value: 1000 },
      // Include subsidiaries in after state
      ...(results.corporateStructure?.entities?.filter(e => e.type === 'subsidiary').map((entity, index) => ({
        id: `after-subsidiary-${index}`,
        name: entity.name,
        type: 'subsidiary' as const,
        percentage: results.corporateStructure?.relationships?.find(r => r.child === entity.id)?.ownershipPercentage || 100
      })) || [])
    ],
    relationships: [
      { source: 'after-buyer-1', target: 'after-target-1', type: 'ownership' as const, percentage: 70 },
      { source: 'after-stockholder-1', target: 'after-target-1', type: 'ownership' as const, percentage: 30 },
      { source: 'after-buyer-1', target: 'after-consideration-1', type: 'consideration' as const, value: 1000 },
      // Add subsidiary relationships in after state
      ...(results.corporateStructure?.relationships?.map((rel, index) => ({
        source: `after-target-1`,
        target: `after-subsidiary-${index}`,
        type: 'subsidiary' as const,
        percentage: rel.ownershipPercentage
      })) || [])
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
  const transactionFlow = convertToTransactionFlow(results);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <div className="h-[700px]">
          <CombinedTransactionFlowDiagram 
            transactionFlow={transactionFlow}
          />
        </div>
      </div>
    </div>
  );
};

export const TransactionFlowDiagramBox: React.FC<TransactionFlowDiagramBoxProps> = ({ results }) => {
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
            title="Complete Transaction Structure & Flow"
            enlargedContent={<EnlargedFlowContent results={results} />}
            size="full"
          >
            <div />
          </EnlargedContentDialog>
        </div>
      </CardHeader>
      <CardContent className="h-[400px]">
        <div className="h-full">
          <CombinedTransactionFlowDiagram 
            transactionFlow={transactionFlow}
          />
        </div>
      </CardContent>
    </Card>
  );
};
