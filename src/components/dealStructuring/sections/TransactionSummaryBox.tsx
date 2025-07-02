
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
        {/* Parties Involved */}
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <Users className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-blue-700">{acquiringCompany}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-green-700">{targetCompany}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Acquiring Company → Target Company</p>
          </div>
        </div>

        {/* Transaction Nature & Key Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Transaction Nature */}
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Briefcase className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm">Transaction Nature</h4>
              <p className="text-sm text-muted-foreground capitalize">{transactionType}</p>
              <p className="text-xs text-muted-foreground mt-1">{targetPercentage}% acquisition</p>
            </div>
          </div>

          {/* Key Terms */}
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0 flex items-center justify-center text-xs font-bold">
              {currency}
            </div>
            <div>
              <h4 className="font-medium text-sm">Total Consideration</h4>
              <p className="text-sm font-semibold text-green-700">{currency} {formatAmount(amount)}</p>
              {paymentStructure?.cashPercentage && paymentStructure?.stockPercentage && (
                <p className="text-xs text-muted-foreground mt-1">
                  {paymentStructure.cashPercentage}% cash + {paymentStructure.stockPercentage}% stock
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Shareholding Changes */}
        {(beforeShareholders.length > 0 || afterShareholders.length > 0) && (
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Percent className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-2">Shareholding Changes</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Before</p>
                  {beforeShareholders.slice(0, 3).map((sh, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate">{sh.name}</span>
                      <span>{sh.percentage}%</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-1">After</p>
                  {afterShareholders.slice(0, 3).map((sh, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate">{sh.name}</span>
                      <span>{sh.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Duration & Timeline */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-sm">Timeline</h4>
            <p className="text-sm text-blue-700">{timeline}</p>
            {results.timetable?.keyMilestones && (
              <p className="text-xs text-blue-600 mt-1">
                {results.timetable.keyMilestones.slice(0, 2).join(' • ')}
              </p>
            )}
          </div>
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
