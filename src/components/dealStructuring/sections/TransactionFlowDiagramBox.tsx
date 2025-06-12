
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

// Enhanced conversion function to extract all real transaction data
const convertToTransactionFlow = (results: AnalysisResults): TransactionFlow | undefined => {
  if (!results.shareholding && !results.shareholdingChanges) {
    return undefined;
  }

  // Extract real shareholding data - handle both types of shareholder objects
  const beforeShareholders = results.shareholdingChanges?.before || results.shareholding?.before || [];
  const afterShareholders = results.shareholdingChanges?.after || results.shareholding?.after || [];
  
  // Find buyer/acquiring entity from after shareholding
  const buyerShareholder = afterShareholders.find(s => 
    ('type' in s && s.type === 'institutional') && s.percentage > 50
  ) || afterShareholders.find(s => s.percentage > 50) || afterShareholders[0];
  
  const remainingShareholders = afterShareholders.filter(s => s !== buyerShareholder);
  
  // Extract REAL transaction data from analysis results
  const transactionAmount = results.costs?.total || 0;
  const currency = results.costs?.breakdown?.find(item => 
    item.description.toLowerCase().includes('consideration') || 
    item.description.toLowerCase().includes('payment')
  )?.description.includes('USD') ? 'USD' : 'HKD';
  
  // Get actual company names from structure or use analysis context
  const targetCompanyName = results.corporateStructure?.entities?.find(e => e.type === 'target')?.name ||
    results.structure?.recommended?.split(' ')[0] || 'Target Company';
  
  const buyerCompanyName = buyerShareholder?.name || 
    results.corporateStructure?.entities?.find(e => e.type === 'parent')?.name || 
    'Acquiring Company';

  // Generate dynamic transaction steps based on actual transaction type
  const generateTransactionSteps = () => {
    const transactionType = results.transactionType.toLowerCase();
    const steps = [];
    
    if (transactionType.includes('rights issue')) {
      steps.push({
        id: 'step-1',
        title: 'Rights Issue Announcement',
        description: `Announcement of rights issue by ${targetCompanyName}`,
        entities: ['before-target-1']
      });
      steps.push({
        id: 'step-2',
        title: 'Subscription Process',
        description: `${buyerCompanyName} subscribes for rights shares`,
        entities: ['after-buyer-1', 'before-target-1']
      });
    } else if (transactionType.includes('acquisition') || transactionType.includes('takeover')) {
      steps.push({
        id: 'step-1',
        title: 'Due Diligence',
        description: `${buyerCompanyName} conducts due diligence on ${targetCompanyName}`,
        entities: ['after-buyer-1', 'before-target-1']
      });
      steps.push({
        id: 'step-2',
        title: results.transactionType,
        description: `Execution of ${results.transactionType.toLowerCase()}`,
        entities: ['after-buyer-1', ...beforeShareholders.map((_, index) => `before-stockholder-${index}`)]
      });
    } else {
      steps.push({
        id: 'step-1',
        title: 'Transaction Preparation',
        description: `Preparation for ${results.transactionType}`,
        entities: ['after-buyer-1', 'before-target-1']
      });
      steps.push({
        id: 'step-2',
        title: results.transactionType,
        description: `Completion of ${results.transactionType}`,
        entities: ['after-buyer-1', 'before-target-1']
      });
    }
    
    steps.push({
      id: 'step-3',
      title: 'Completion',
      description: `Transfer of ownership and payment of ${currency} ${transactionAmount.toLocaleString()} consideration`,
      entities: ['after-buyer-1', 'after-consideration-1']
    });
    
    return steps;
  };

  const before = {
    entities: [
      { id: 'before-target-1', name: targetCompanyName, type: 'target' as const },
      ...beforeShareholders.map((shareholder, index) => ({
        id: `before-stockholder-${index}`,
        name: shareholder.name,
        type: 'stockholder' as const,
        percentage: shareholder.percentage
      })),
      // Add subsidiary entities if available
      ...(results.corporateStructure?.entities?.filter(e => e.type === 'subsidiary').map((entity, index) => ({
        id: `before-subsidiary-${index}`,
        name: entity.name,
        type: 'subsidiary' as const,
        percentage: results.corporateStructure?.relationships?.find(r => r.child === entity.id)?.ownershipPercentage || 100
      })) || [])
    ],
    relationships: [
      ...beforeShareholders.map((shareholder, index) => ({
        source: `before-stockholder-${index}`,
        target: 'before-target-1',
        type: 'ownership' as const,
        percentage: shareholder.percentage
      })),
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
      { id: 'after-target-1', name: targetCompanyName, type: 'target' as const },
      { 
        id: 'after-buyer-1', 
        name: buyerCompanyName, 
        type: 'buyer' as const, 
        percentage: buyerShareholder?.percentage || 0
      },
      ...remainingShareholders.map((shareholder, index) => ({
        id: `after-stockholder-${index + 1}`,
        name: shareholder.name,
        type: 'stockholder' as const,
        percentage: shareholder.percentage
      })),
      { 
        id: 'after-consideration-1', 
        name: `${currency} Consideration`, 
        type: 'consideration' as const, 
        value: transactionAmount,
        currency: currency
      },
      // Include subsidiaries in after state
      ...(results.corporateStructure?.entities?.filter(e => e.type === 'subsidiary').map((entity, index) => ({
        id: `after-subsidiary-${index}`,
        name: entity.name,
        type: 'subsidiary' as const,
        percentage: results.corporateStructure?.relationships?.find(r => r.child === entity.id)?.ownershipPercentage || 100
      })) || [])
    ],
    relationships: [
      { 
        source: 'after-buyer-1', 
        target: 'after-target-1', 
        type: 'ownership' as const, 
        percentage: buyerShareholder?.percentage || 0
      },
      ...remainingShareholders.map((shareholder, index) => ({
        source: `after-stockholder-${index + 1}`,
        target: 'after-target-1',
        type: 'ownership' as const,
        percentage: shareholder.percentage
      })),
      { 
        source: 'after-buyer-1', 
        target: 'after-consideration-1', 
        type: 'consideration' as const, 
        value: transactionAmount
      },
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
    transactionSteps: generateTransactionSteps(),
    // Pass additional real transaction context
    transactionContext: {
      type: results.transactionType,
      amount: transactionAmount,
      currency: currency,
      targetName: targetCompanyName,
      buyerName: buyerCompanyName,
      description: results.structure?.rationale || `${results.transactionType} transaction`
    }
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
