
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp, Target, DollarSign } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';
import { useTransactionDataConsistency } from '@/hooks/useTransactionDataConsistency';
import { ExtractedUserInputs } from '@/services/dealStructuring/enhancedAiAnalysisService';

interface TransactionSummaryBoxProps {
  results: AnalysisResults;
  userInputs?: ExtractedUserInputs;
}

export const TransactionSummaryBox = ({ results, userInputs }: TransactionSummaryBoxProps) => {
  const { extractedData } = useTransactionDataConsistency(results, userInputs);
  
  console.log('=== TransactionSummaryBox ===');
  console.log('UserInputs received:', userInputs);
  console.log('ExtractedData amount:', extractedData.considerationAmount);
  console.log('ExtractedData source:', extractedData.source);
  
  const generateIntelligentNarrative = () => {
    // First priority: Use AI-generated executive summary narrative
    if (results.executiveSummary?.narrative) {
      console.log('✅ Using AI-generated executive summary narrative');
      return results.executiveSummary.narrative;
    }

    console.log('⚠️ No AI narrative found, generating comprehensive fallback');
    
    // Use consistent data from the data consistency service
    const amount = extractedData.considerationAmount;
    const currency = extractedData.currency;
    const targetPercentage = extractedData.ownershipPercentages.acquisitionPercentage;
    const targetCompany = extractedData.entityNames.targetCompanyName;
    const acquiringCompany = extractedData.entityNames.acquiringCompanyName;
    
    // Extract additional context from structure data
    const recommendedStructure = results.structure?.recommended || 'acquisition';
    const totalDuration = results.timetable?.totalDuration || '12-18 months';
    
    // Extract payment structure details and calculate equivalent values
    const paymentStructure = results.structure?.majorTerms?.paymentStructure;
    const cashPercentage = paymentStructure?.cashPercentage || 0;
    const stockPercentage = paymentStructure?.stockPercentage || 0;
    
    // Calculate equivalent monetary values
    const cashAmount = amount * (cashPercentage / 100);
    const stockAmount = amount * (stockPercentage / 100);
    
    // Format amounts
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
    
    // Build comprehensive payment structure text with equivalent values
    let paymentText = '';
    if (cashPercentage > 0 && stockPercentage > 0) {
      paymentText = `comprising ${currency} ${formatAmount(cashAmount)} cash (${cashPercentage}%) and ${currency} ${formatAmount(stockAmount)} stock (${stockPercentage}%)`;
    } else if (cashPercentage === 100) {
      paymentText = `structured as an all-cash transaction of ${currency} ${formatAmount(amount)}`;
    } else if (stockPercentage === 100) {
      paymentText = `structured as an all-stock transaction valued at ${currency} ${formatAmount(amount)}`;
    } else {
      paymentText = `utilizing mixed consideration totaling ${currency} ${formatAmount(amount)}`;
    }
    
    // Extract shareholding changes information
    const beforeShareholders = results.shareholding?.before || [];
    const afterShareholders = results.shareholding?.after || [];
    const shareholdingChangesText = beforeShareholders.length > 0 && afterShareholders.length > 0 
      ? `resulting in significant ownership restructuring where existing shareholders' collective ownership will change from ${beforeShareholders.reduce((sum, sh) => sum + sh.percentage, 0)}% to ${afterShareholders.find(sh => !sh.name.toLowerCase().includes(acquiringCompany.toLowerCase()))?.percentage || 0}%`
      : `resulting in ${acquiringCompany} acquiring ${targetPercentage}% control of ${targetCompany}`;
    
    // Extract key regulatory implications
    const listingRules = results.compliance?.listingRules || [];
    const takeoversCode = results.compliance?.takeoversCode || [];
    const regulatoryText = [...listingRules, ...takeoversCode].length > 0
      ? `with compliance requirements including ${[...listingRules, ...takeoversCode].slice(0, 2).join(' and ')}`
      : 'subject to standard regulatory approvals and compliance requirements';
    
    // Extract key conditions
    const keyConditions = results.structure?.majorTerms?.keyConditions || [];
    const conditionsText = keyConditions.length > 0
      ? `, conditional upon ${keyConditions.slice(0, 2).join(' and ')}`
      : '';
    
    // Extract strategic considerations
    const strategicContext = results.structure?.majorTerms?.suggestionConsideration || 
                           'optimizing value creation while ensuring regulatory compliance and minimizing execution risk';
    
    // Generate comprehensive narrative with all required elements
    const narrative = `This strategic ${recommendedStructure.toLowerCase()} involves ${acquiringCompany} acquiring ${targetPercentage}% of ${targetCompany} for total consideration of ${currency} ${formatAmount(amount)}, ${paymentText}, with an expected completion timeline of ${totalDuration}${conditionsText}. The transaction ${strategicContext}, ${shareholdingChangesText}, ${regulatoryText}. Key structural features include comprehensive due diligence provisions, regulatory approval mechanisms, and risk allocation frameworks designed to ensure successful execution within the projected timeline while maximizing stakeholder value and maintaining market confidence.`;
    
    return narrative;
  };

  const getKeyHighlights = () => {
    // Use AI-generated highlights if available
    if (results.executiveSummary?.keyHighlights && results.executiveSummary.keyHighlights.length > 0) {
      return results.executiveSummary.keyHighlights;
    }

    // Generate intelligent fallback highlights including payment breakdown
    const amount = extractedData.considerationAmount;
    const currency = extractedData.currency;
    const targetPercentage = extractedData.ownershipPercentages.acquisitionPercentage;
    const paymentStructure = results.structure?.majorTerms?.paymentStructure;
    
    const formatAmount = (amt: number) => {
      if (amt >= 1000000000) {
        return `${(amt / 1000000000).toFixed(1)}B`;
      } else if (amt >= 1000000) {
        return `${(amt / 1000000).toFixed(1)}M`;
      } else {
        return amt.toLocaleString();
      }
    };

    const highlights = [
      `${currency} ${formatAmount(amount)} total consideration`,
      `${targetPercentage}% acquisition target`
    ];

    // Add payment breakdown to highlights if available
    if (paymentStructure?.cashPercentage && paymentStructure?.stockPercentage) {
      const cashAmount = amount * (paymentStructure.cashPercentage / 100);
      const stockAmount = amount * (paymentStructure.stockPercentage / 100);
      highlights.push(`${currency} ${formatAmount(cashAmount)} cash + ${currency} ${formatAmount(stockAmount)} stock`);
    } else {
      highlights.push(results.structure?.recommended || 'Optimized structure');
    }

    highlights.push(results.timetable?.totalDuration || 'Efficient timeline');

    return highlights;
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Transaction Summary
          {extractedData.source === 'user_input' && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">User Input</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main comprehensive narrative */}
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
