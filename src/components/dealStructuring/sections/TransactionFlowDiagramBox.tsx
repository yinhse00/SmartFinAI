
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

// Enhanced parsing function to extract exact values from transaction description
const parseTransactionData = (description: string) => {
  // Parse consideration amount with improved patterns
  const considerationPatterns = [
    /(?:consideration.*?)(HK\$\s*[\d.,]+\s*(?:million|billion))/i,
    /(?:purchase.*?)(HK\$\s*[\d.,]+\s*(?:million|billion))/i,
    /(HK\$\s*[\d.,]+\s*(?:million|billion)).*?(?:consideration|purchase|acquire)/i
  ];
  
  let considerationAmount = 0;
  for (const pattern of considerationPatterns) {
    const match = description.match(pattern);
    if (match) {
      considerationAmount = parseConsiderationAmount(match[1]);
      break;
    }
  }
  
  // Parse ownership percentage being acquired
  const ownershipMatch = description.match(/(?:purchase|acquire|buy)\s+(\d+)%/i);
  const acquisitionPercentage = ownershipMatch ? parseInt(ownershipMatch[1]) : 55;
  
  // Parse market cap
  const marketCapMatch = description.match(/market cap.*?(HK\$\s*[\d.,]+\s*(?:million|billion))/i);
  const marketCap = marketCapMatch ? parseConsiderationAmount(marketCapMatch[1]) : 0;
  
  // Parse controlling shareholder percentage
  const controllingMatch = description.match(/controlling shareholder.*?(\d+)%/i);
  const controllingPercentage = controllingMatch ? parseInt(controllingMatch[1]) : 65;
  
  // Parse public shareholders percentage
  const publicMatch = description.match(/(?:other|public).*?(\d+)%.*?public/i);
  const publicPercentage = publicMatch ? parseInt(publicMatch[1]) : 35;
  
  return {
    considerationAmount,
    acquisitionPercentage,
    marketCap,
    controllingPercentage,
    publicPercentage,
    currency: 'HKD'
  };
};

const parseConsiderationAmount = (amountStr: string): number => {
  const cleanStr = amountStr.replace(/[HK$\s,]/g, '');
  const numMatch = cleanStr.match(/([\d.]+)/);
  if (!numMatch) return 0;
  
  const num = parseFloat(numMatch[1]);
  if (cleanStr.toLowerCase().includes('billion')) {
    return num * 1000000000;
  } else if (cleanStr.toLowerCase().includes('million')) {
    return num * 1000000;
  }
  return num;
};

// Enhanced conversion function with proper data parsing
const convertToTransactionFlow = (results: AnalysisResults): TransactionFlow | undefined => {
  if (!results.shareholding && !results.shareholdingChanges) {
    return undefined;
  }

  // Parse actual transaction data from the original description
  const transactionData = parseTransactionData(results.structure?.rationale || '');
  
  // Use parsed data instead of AI analysis fallbacks
  const actualConsideration = transactionData.considerationAmount;
  const actualAcquisitionPercentage = transactionData.acquisitionPercentage;
  const remainingPercentage = 100 - actualAcquisitionPercentage;
  
  // Extract entity names
  const targetCompanyName = results.corporateStructure?.entities?.find(e => e.type === 'target')?.name || 'Target Company';
  const acquiringCompanyName = results.corporateStructure?.entities?.find(e => e.type === 'parent')?.name || 'Acquiring Company';

  // Generate transaction steps based on actual data
  const generateTransactionSteps = () => {
    return [
      {
        id: 'step-1',
        title: 'Due Diligence & Negotiation',
        description: `${acquiringCompanyName} conducts due diligence and negotiates acquisition terms`,
        entities: ['before-acquiring-company', 'before-target-company']
      },
      {
        id: 'step-2',
        title: 'Share Purchase Agreement',
        description: `Execution of share purchase for ${actualAcquisitionPercentage}% stake`,
        entities: ['before-acquiring-company', 'before-target-company']
      },
      {
        id: 'step-3',
        title: 'Completion & Payment',
        description: `Transfer of ${actualAcquisitionPercentage}% ownership and payment of ${transactionData.currency} ${(actualConsideration / 1000000).toFixed(0)}M consideration`,
        entities: ['after-acquiring-company', 'after-target-company', 'consideration-payment']
      }
    ];
  };

  // BEFORE structure - showing both acquiring company and target company structures
  const before = {
    entities: [
      // Acquiring Company Structure
      { 
        id: 'before-controlling-shareholder', 
        name: 'Controlling Shareholder', 
        type: 'stockholder' as const
      },
      { 
        id: 'before-public-shareholders', 
        name: 'Public Shareholders', 
        type: 'stockholder' as const
      },
      { 
        id: 'before-acquiring-company', 
        name: acquiringCompanyName, 
        type: 'buyer' as const,
        description: transactionData.marketCap > 0 ? `Market Cap: ${transactionData.currency} ${(transactionData.marketCap / 1000000000).toFixed(1)}B` : 'Listed Entity'
      },
      
      // Target Company Structure
      { 
        id: 'before-target-shareholders', 
        name: 'Existing Target Shareholders', 
        type: 'stockholder' as const
      },
      { 
        id: 'before-target-company', 
        name: targetCompanyName, 
        type: 'target' as const 
      }
    ],
    relationships: [
      // Acquiring company ownership structure
      {
        source: 'before-controlling-shareholder',
        target: 'before-acquiring-company',
        type: 'ownership' as const,
        percentage: transactionData.controllingPercentage
      },
      {
        source: 'before-public-shareholders',
        target: 'before-acquiring-company',
        type: 'ownership' as const,
        percentage: transactionData.publicPercentage
      },
      // Target company ownership structure
      {
        source: 'before-target-shareholders',
        target: 'before-target-company',
        type: 'ownership' as const,
        percentage: 100
      }
    ]
  };

  // AFTER structure - showing new ownership of target and maintained acquiring company structure
  const after = {
    entities: [
      // Target Company Post-Transaction
      { 
        id: 'after-target-company', 
        name: targetCompanyName, 
        type: 'target' as const 
      },
      
      // New Target Company Owners
      { 
        id: 'after-acquiring-company', 
        name: acquiringCompanyName, 
        type: 'buyer' as const
      },
      { 
        id: 'after-remaining-shareholders', 
        name: 'Remaining Target Shareholders', 
        type: 'stockholder' as const
      },
      
      // Acquiring Company Structure (maintained)
      { 
        id: 'after-controlling-shareholder', 
        name: 'Controlling Shareholder', 
        type: 'stockholder' as const
      },
      { 
        id: 'after-public-shareholders', 
        name: 'Public Shareholders', 
        type: 'stockholder' as const
      },
      
      // Consideration Payment
      { 
        id: 'consideration-payment', 
        name: `${transactionData.currency} ${(actualConsideration / 1000000).toFixed(0)}M Consideration`, 
        type: 'consideration' as const,
        value: actualConsideration,
        currency: transactionData.currency
      }
    ],
    relationships: [
      // Target company new ownership
      {
        source: 'after-acquiring-company',
        target: 'after-target-company',
        type: 'ownership' as const,
        percentage: actualAcquisitionPercentage
      },
      {
        source: 'after-remaining-shareholders',
        target: 'after-target-company',
        type: 'ownership' as const,
        percentage: remainingPercentage
      },
      
      // Acquiring company maintained structure
      {
        source: 'after-controlling-shareholder',
        target: 'after-acquiring-company',
        type: 'ownership' as const,
        percentage: transactionData.controllingPercentage
      },
      {
        source: 'after-public-shareholders',
        target: 'after-acquiring-company',
        type: 'ownership' as const,
        percentage: transactionData.publicPercentage
      },
      
      // Consideration flow
      {
        source: 'after-acquiring-company',
        target: 'consideration-payment',
        type: 'consideration' as const,
        value: actualConsideration
      }
    ]
  };

  return {
    before,
    after,
    transactionSteps: generateTransactionSteps(),
    transactionContext: {
      type: results.transactionType,
      amount: actualConsideration,
      currency: transactionData.currency,
      targetName: targetCompanyName,
      buyerName: acquiringCompanyName,
      description: `${actualAcquisitionPercentage}% acquisition for ${transactionData.currency} ${(actualConsideration / 1000000).toFixed(0)}M`
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
