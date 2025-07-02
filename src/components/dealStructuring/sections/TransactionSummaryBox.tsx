
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Briefcase, Clock, Percent, ArrowRight } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { useTransactionDataConsistency } from '@/hooks/useTransactionDataConsistency';
import { ExtractedUserInputs } from '@/services/dealStructuring/enhancedAiAnalysisService';

interface TransactionSummaryBoxProps {
  results: AnalysisResults;
  userInputs?: ExtractedUserInputs;
}

export const TransactionSummaryBox = ({ results, userInputs }: TransactionSummaryBoxProps) => {
  const { extractedData } = useTransactionDataConsistency(results, userInputs);
  
  // Format amounts helper
  const formatAmount = (amt: number) => {
    if (amt >= 1000000000) {
      return `${(amt / 1000000000).toFixed(1)}B`;
    } else if (amt >= 1000000) {
      return `${(amt / 1000000).toFixed(1)}M`;
    } else if (amt >= 1000) {
      return `${(amt / 1000).toFixed(1)}K`;
    }
    return amt.toLocaleString();
  };

  // Extract key data
  const amount = extractedData.considerationAmount;
  const currency = extractedData.currency;
  const targetPercentage = extractedData.ownershipPercentages.acquisitionPercentage;
  const targetCompany = extractedData.entityNames.targetCompanyName;
  const acquiringCompany = extractedData.entityNames.acquiringCompanyName;
  const transactionType = results.transactionType || results.structure?.recommended || 'Transaction';
  const paymentStructure = results.structure?.majorTerms?.paymentStructure;
  const timeline = results.timetable?.totalDuration || 'TBD';
  const beforeShareholders = results.shareholding?.before || [];
  const afterShareholders = results.shareholding?.after || [];

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Transaction Summary
          {extractedData.source === 'user_input' && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">User Input</span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Transaction Summary Paragraph */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-sm leading-relaxed text-foreground">
            {acquiringCompany} is undertaking a {transactionType.toLowerCase()} to acquire {targetPercentage}% of {targetCompany} for a total consideration of {currency} {formatAmount(amount)}
            {paymentStructure?.cashPercentage && paymentStructure?.stockPercentage 
              ? `, structured as ${paymentStructure.cashPercentage}% cash and ${paymentStructure.stockPercentage}% stock` 
              : ''
            }. The transaction is expected to complete within {timeline}
            {results.timetable?.keyMilestones?.length > 0 
              ? `, with key milestones including ${results.timetable.keyMilestones.slice(0, 2).join(' and ')}` 
              : ''
            }
            {(beforeShareholders.length > 0 || afterShareholders.length > 0) 
              ? `, resulting in significant changes to the shareholding structure` 
              : ''
            }.
          </p>
        </div>

        {/* Strategic Rationale */}
        {results.executiveSummary?.strategicRationale && (
          <div className="pt-3 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Strategic Rationale</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {results.executiveSummary.strategicRationale}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
