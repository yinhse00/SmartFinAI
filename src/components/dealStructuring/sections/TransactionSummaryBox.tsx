
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { AnalysisResults } from '../AIAnalysisResults';

interface TransactionSummaryBoxProps {
  results: AnalysisResults;
}

export const TransactionSummaryBox = ({ results }: TransactionSummaryBoxProps) => {
  const generateNarrativeParagraph = () => {
    // Extract key data points with fallbacks
    const transactionType = results.transactionType || 'corporate transaction';
    const purchasePrice = results.dealEconomics?.purchasePrice;
    const currency = results.dealEconomics?.currency || 'HKD';
    const targetPercentage = results.dealEconomics?.targetPercentage || 100;
    const recommendedStructure = results.structure?.recommended || 'general offer';
    const totalDuration = results.timetable?.totalDuration || '12-18 months';
    
    // Extract payment structure details
    const paymentStructure = results.structure?.majorTerms?.paymentStructure;
    const cashPercentage = paymentStructure?.cashPercentage;
    const stockPercentage = paymentStructure?.stockPercentage;
    
    // Format consideration amount
    const formatAmount = (amount: number) => {
      if (amount >= 1000000000) {
        return `${(amount / 1000000000).toFixed(1)} billion`;
      } else if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)} million`;
      } else {
        return amount.toLocaleString();
      }
    };
    
    // Build consideration text
    let considerationText = '';
    if (purchasePrice) {
      considerationText = `${currency} ${formatAmount(purchasePrice)}`;
    } else {
      considerationText = 'an undisclosed amount';
    }
    
    // Build payment structure text
    let paymentText = '';
    if (cashPercentage && stockPercentage) {
      paymentText = `${cashPercentage}% cash and ${stockPercentage}% stock`;
    } else if (cashPercentage === 100) {
      paymentText = 'all cash';
    } else if (stockPercentage === 100) {
      paymentText = 'all stock';
    } else {
      paymentText = 'mixed consideration';
    }
    
    // Extract key conditions if available
    const keyConditions = results.structure?.majorTerms?.keyConditions;
    let conditionsText = '';
    if (keyConditions && keyConditions.length > 0) {
      conditionsText = ` with key terms including ${keyConditions.slice(0, 2).join(' and ')}`;
    }
    
    // Build the narrative paragraph
    const narrative = `This transaction involves acquiring ${targetPercentage}% through a ${transactionType.toLowerCase()} for ${considerationText}. The consideration consists of ${paymentText}${conditionsText}. The transaction is structured as a ${recommendedStructure.toLowerCase()} and is expected to complete within ${totalDuration}.`;
    
    return narrative;
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Transaction Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
          {generateNarrativeParagraph()}
        </p>
      </CardContent>
    </Card>
  );
};
