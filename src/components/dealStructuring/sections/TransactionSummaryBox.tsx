
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp, Target, DollarSign } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { useTransactionDataConsistency } from '@/hooks/useTransactionDataConsistency';

interface TransactionSummaryBoxProps {
  results: AnalysisResults;
}

export const TransactionSummaryBox = ({ results }: TransactionSummaryBoxProps) => {
  const { extractedData } = useTransactionDataConsistency(results);
  
  const generateIntelligentNarrative = () => {
    // First priority: Use AI-generated executive summary narrative
    if (results.executiveSummary?.narrative) {
      console.log('✅ Using AI-generated executive summary narrative');
      return results.executiveSummary.narrative;
    }

    console.log('⚠️ No AI narrative found, generating intelligent fallback');
    
    // Use consistent data from the data consistency service
    const amount = extractedData.considerationAmount;
    const currency = extractedData.currency;
    const targetPercentage = extractedData.ownershipPercentages.acquisitionPercentage;
    const targetCompany = extractedData.entityNames.targetCompanyName;
    const acquiringCompany = extractedData.entityNames.acquiringCompanyName;
    
    // Extract additional context from structure data
    const recommendedStructure = results.structure?.recommended || 'acquisition';
    const totalDuration = results.timetable?.totalDuration || '12-18 months';
    
    // Extract payment structure details
    const paymentStructure = results.structure?.majorTerms?.paymentStructure;
    const cashPercentage = paymentStructure?.cashPercentage;
    const stockPercentage = paymentStructure?.stockPercentage;
    
    // Format consideration amount
    const formatAmount = (amt: number) => {
      if (amt >= 1000000000) {
        return `${(amt / 1000000000).toFixed(1)} billion`;
      } else if (amt >= 1000000) {
        return `${(amt / 1000000).toFixed(1)} million`;
      } else if (amt >= 1000) {
        return `${(amt / 1000).toFixed(1)} thousand`;
      } else {
        return amt.toLocaleString();
      }
    };
    
    // Build consideration text
    const considerationText = `${currency} ${formatAmount(amount)}`;
    
    // Build payment structure text
    let paymentText = '';
    if (cashPercentage && stockPercentage) {
      paymentText = `The consideration consists of ${cashPercentage}% cash and ${stockPercentage}% stock, `;
    } else if (cashPercentage === 100) {
      paymentText = 'The transaction is structured as an all-cash deal, ';
    } else if (stockPercentage === 100) {
      paymentText = 'The transaction is structured as an all-stock deal, ';
    } else {
      paymentText = 'The transaction utilizes mixed consideration, ';
    }
    
    // Build strategic context
    const strategicContext = results.structure?.majorTerms?.suggestionConsideration || 
                           'optimizing value creation while ensuring regulatory compliance and minimizing execution risk';
    
    // Extract key conditions for additional context
    const keyConditions = results.structure?.majorTerms?.keyConditions;
    let conditionsText = '';
    if (keyConditions && keyConditions.length > 0) {
      conditionsText = ` Key transaction conditions include ${keyConditions.slice(0, 2).join(' and ')}.`;
    }
    
    // Generate intelligent narrative
    const narrative = `This strategic transaction involves ${acquiringCompany} acquiring ${targetPercentage}% of ${targetCompany} for ${considerationText}. ${paymentText}${strategicContext}. The deal is structured as a ${recommendedStructure.toLowerCase()} with an expected completion timeline of ${totalDuration}.${conditionsText} The transaction incorporates market-standard terms and regulatory compliance frameworks to ensure successful execution.`;
    
    return narrative;
  };

  const getKeyHighlights = () => {
    // Use AI-generated highlights if available
    if (results.executiveSummary?.keyHighlights && results.executiveSummary.keyHighlights.length > 0) {
      return results.executiveSummary.keyHighlights;
    }

    // Generate intelligent fallback highlights
    const amount = extractedData.considerationAmount;
    const currency = extractedData.currency;
    const targetPercentage = extractedData.ownershipPercentages.acquisitionPercentage;
    
    const formatAmount = (amt: number) => {
      if (amt >= 1000000000) {
        return `${(amt / 1000000000).toFixed(1)}B`;
      } else if (amt >= 1000000) {
        return `${(amt / 1000000).toFixed(1)}M`;
      } else {
        return amt.toLocaleString();
      }
    };

    return [
      `${currency} ${formatAmount(amount)} total consideration`,
      `${targetPercentage}% acquisition target`,
      results.structure?.recommended || 'Optimized structure',
      results.timetable?.totalDuration || 'Efficient timeline'
    ];
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Transaction Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main narrative */}
        <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
          {generateIntelligentNarrative()}
        </p>
        
        {/* Key highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {getKeyHighlights().map((highlight, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {index === 0 && <DollarSign className="h-4 w-4 text-green-600" />}
              {index === 1 && <Target className="h-4 w-4 text-blue-600" />}
              {index === 2 && <TrendingUp className="h-4 w-4 text-purple-600" />}
              {index === 3 && <FileText className="h-4 w-4 text-orange-600" />}
              <span className="text-gray-600 dark:text-gray-300">{highlight}</span>
            </div>
          ))}
        </div>

        {/* Strategic rationale if available */}
        {results.executiveSummary?.strategicRationale && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Strategic Rationale</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {results.executiveSummary.strategicRationale}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
