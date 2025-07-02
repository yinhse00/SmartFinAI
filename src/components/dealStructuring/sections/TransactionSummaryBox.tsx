
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
              ? `, structured as ${paymentStructure.cashPercentage}% cash (${currency} ${formatAmount(Math.round(amount * (paymentStructure.cashPercentage / 100)))}) and ${paymentStructure.stockPercentage}% stock (${currency} ${formatAmount(Math.round(amount * (paymentStructure.stockPercentage / 100)))})` 
              : paymentStructure?.cashPercentage === 100 
                ? `, paid entirely in cash`
                : paymentStructure?.stockPercentage === 100
                  ? `, paid entirely in stock`
                  : ''
            }. The transaction is expected to complete within {timeline}
            {results.timetable?.keyMilestones?.length > 0 
              ? `, with key milestones including ${results.timetable.keyMilestones.slice(0, 2).join(' and ')}` 
              : ''
            }
            {results.shareholdingChanges?.keyChanges?.length > 0
              ? `. The transaction will result in ${results.shareholdingChanges.keyChanges.slice(0, 2).map(change => `${change.shareholder} ${change.change > 0 ? 'increasing' : 'decreasing'} from ${change.before}% to ${change.after}%`).join(' and ')}`
              : results.shareholding?.majorChanges?.length > 0
                ? `. The transaction will result in ${results.shareholding.majorChanges[0]}`
                : ''
            }
            {(results.compliance?.risks?.length > 0 || results.compliance?.listingRules?.length > 0 || results.compliance?.takeoversCode?.length > 0)
              ? `. Key regulatory considerations include ${[
                  ...(results.compliance?.risks?.slice(0, 1) || []),
                  ...(results.compliance?.listingRules?.slice(0, 1) || []),
                  ...(results.compliance?.takeoversCode?.slice(0, 1) || [])
                ].slice(0, 2).join(' and ')}`
              : ''
            }.
          </p>
        </div>

      </CardContent>
    </Card>
  );
};
