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

// Enhanced conversion function to create unified post-transaction structure
const convertToUnifiedPostTransactionFlow = (results: AnalysisResults): TransactionFlow | undefined => {
  if (!results.shareholding && !results.shareholdingChanges) {
    return undefined;
  }

  // Parse transaction data from available sources
  const transactionData = parseTransactionData(
    results.structure?.rationale || 
    results.structure?.summary || 
    results.transactionType || 
    ''
  );
  
  // Fallback to cost analysis for consideration amount
  if (transactionData.considerationAmount === 0 && results.costs?.totalCost) {
    transactionData.considerationAmount = results.costs.totalCost * 1000000; // Convert to actual amount
  }
  
  // Use shareholding changes data if available
  const shareholdingAfter = results.shareholdingChanges?.after || results.shareholding?.after || [];
  const actualAcquisitionPercentage = shareholdingAfter.find(s => s.name.toLowerCase().includes('acquiring') || s.name.toLowerCase().includes('buyer'))?.percentage || transactionData.acquisitionPercentage;
  const remainingPercentage = 100 - actualAcquisitionPercentage;
  
  // Extract entity names
  const targetCompanyName = results.corporateStructure?.entities?.find(e => e.type === 'target')?.name || 'Target Company';
  const acquiringCompanyName = results.corporateStructure?.entities?.find(e => e.type === 'parent')?.name || 'Acquiring Company';

  // Create unified post-transaction structure showing the final state
  const unifiedPostTransactionStructure = {
    entities: [
      // Ultimate controlling shareholders of acquiring company
      { 
        id: 'controlling-shareholder', 
        name: 'Controlling Shareholder', 
        type: 'stockholder' as const
      },
      { 
        id: 'public-shareholders', 
        name: 'Public Shareholders', 
        type: 'stockholder' as const
      },
      
      // Listed acquiring company
      { 
        id: 'acquiring-company', 
        name: acquiringCompanyName, 
        type: 'buyer' as const,
        description: `Listed Entity${transactionData.marketCap > 0 ? ` - Market Cap: ${transactionData.currency} ${(transactionData.marketCap / 1000000000).toFixed(1)}B` : ''}`
      },
      
      // Target company with new ownership structure
      { 
        id: 'target-company', 
        name: targetCompanyName, 
        type: 'target' as const,
        description: 'Post-Transaction Structure'
      },
      
      // Remaining shareholders of target
      { 
        id: 'remaining-target-shareholders', 
        name: 'Remaining Target Shareholders', 
        type: 'stockholder' as const
      },
      
      // Transaction consideration
      { 
        id: 'consideration', 
        name: `${transactionData.currency} ${(transactionData.considerationAmount / 1000000).toFixed(0)}M Consideration`, 
        type: 'consideration' as const,
        value: transactionData.considerationAmount,
        currency: transactionData.currency
      }
    ],
    relationships: [
      // Acquiring company ownership structure (unchanged)
      {
        source: 'controlling-shareholder',
        target: 'acquiring-company',
        type: 'ownership' as const,
        percentage: transactionData.controllingPercentage
      },
      {
        source: 'public-shareholders',
        target: 'acquiring-company',
        type: 'ownership' as const,
        percentage: transactionData.publicPercentage
      },
      
      // New target company ownership (post-transaction)
      {
        source: 'acquiring-company',
        target: 'target-company',
        type: 'ownership' as const,
        percentage: actualAcquisitionPercentage
      },
      {
        source: 'remaining-target-shareholders',
        target: 'target-company',
        type: 'ownership' as const,
        percentage: remainingPercentage
      },
      
      // Consideration flow
      {
        source: 'acquiring-company',
        target: 'consideration',
        type: 'consideration' as const,
        value: transactionData.considerationAmount
      }
    ]
  };

  return {
    before: { entities: [], relationships: [] }, // Not needed for unified view
    after: unifiedPostTransactionStructure,
    transactionSteps: [], // Not needed for unified view
    transactionContext: {
      type: results.transactionType,
      amount: transactionData.considerationAmount,
      currency: transactionData.currency,
      targetName: targetCompanyName,
      buyerName: acquiringCompanyName,
      description: `${actualAcquisitionPercentage}% acquisition for ${transactionData.currency} ${(transactionData.considerationAmount / 1000000).toFixed(0)}M`
    }
  };
};

const EnlargedFlowContent = ({ results }: { results: AnalysisResults }) => {
  const transactionFlow = convertToUnifiedPostTransactionFlow(results);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <div className="h-[700px]">
          <CombinedTransactionFlowDiagram 
            transactionFlow={transactionFlow}
            showUnifiedView={true}
          />
        </div>
      </div>
    </div>
  );
};

export const TransactionFlowDiagramBox: React.FC<TransactionFlowDiagramBoxProps> = ({ results }) => {
  const transactionFlow = convertToUnifiedPostTransactionFlow(results);

  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-500" />
            Post-Transaction Structure
          </CardTitle>
          <EnlargedContentDialog
            title="Complete Post-Transaction Corporate & Shareholding Structure"
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
            showUnifiedView={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};
