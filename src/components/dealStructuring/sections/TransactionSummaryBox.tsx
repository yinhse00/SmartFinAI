import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnalysisResults } from '../AIAnalysisResults';
import { OptimizationResult } from '@/services/dealStructuring/optimizationEngine';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  Shield, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';

interface TransactionSummaryBoxProps {
  results: AnalysisResults;
  optimizationResult?: OptimizationResult;
}

export const TransactionSummaryBox = ({ results, optimizationResult }: TransactionSummaryBoxProps) => {
  const getComplianceStatus = () => {
    const totalRequirements = results.compliance.listingRules.length + results.compliance.takeoversCode.length;
    const risks = results.compliance.risks.length;
    
    if (risks === 0) return { status: 'compliant', color: 'bg-green-100 text-green-800' };
    if (risks <= 2) return { status: 'attention', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'high-risk', color: 'bg-red-100 text-red-800' };
  };

  const generateTransactionDescription = () => {
    const dealEconomics = results.dealEconomics;
    const structure = results.structure;
    const valuation = results.valuation;
    const timetable = results.timetable;
    
    // Extract key information
    const transactionType = results.transactionType || 'transaction';
    const recommendedStructure = structure.recommended || 'standard structure';
    const currency = dealEconomics?.currency || valuation?.transactionValue?.currency || 'HKD';
    const amount = dealEconomics?.purchasePrice || valuation?.transactionValue?.amount;
    const targetPercentage = dealEconomics?.targetPercentage || structure.majorTerms?.targetPercentage;
    const paymentStructure = structure.majorTerms?.paymentStructure;
    const pricingMechanism = structure.majorTerms?.pricingMechanism;
    const duration = timetable.totalDuration;
    
    // Build description components
    let description = `This ${transactionType.toLowerCase()}`;
    
    // Add amount and percentage if available
    if (amount) {
      const formattedAmount = amount >= 1000000000 
        ? `${currency} ${(amount / 1000000000).toFixed(1)}B`
        : amount >= 1000000 
        ? `${currency} ${Math.round(amount / 1000000)}M`
        : `${currency} ${amount.toLocaleString()}`;
      
      description += ` involves a ${formattedAmount} consideration`;
      
      if (targetPercentage && targetPercentage !== 100) {
        description += ` for ${targetPercentage}% acquisition`;
      }
    } else if (targetPercentage && targetPercentage !== 100) {
      description += ` involves a ${targetPercentage}% acquisition`;
    }
    
    description += ` utilizing a ${recommendedStructure.toLowerCase()}`;
    
    // Add payment structure details
    if (paymentStructure) {
      const cashPct = paymentStructure.cashPercentage;
      const stockPct = paymentStructure.stockPercentage;
      
      if (cashPct !== undefined && stockPct !== undefined) {
        if (cashPct === 100) {
          description += ` with all-cash consideration`;
        } else if (stockPct === 100) {
          description += ` with all-stock consideration`;
        } else if (cashPct > 0 && stockPct > 0) {
          description += ` with mixed consideration comprising ${cashPct}% cash and ${stockPct}% stock`;
        }
      }
    }
    
    // Add pricing mechanism
    if (pricingMechanism && pricingMechanism !== 'fixed') {
      description += ` using a ${pricingMechanism} pricing mechanism`;
    }
    
    // Add timeline
    if (duration) {
      description += `. The transaction is expected to complete within ${duration.toLowerCase()}`;
    }
    
    // Add compliance status
    const compliance = getComplianceStatus();
    if (compliance.status === 'compliant') {
      description += ` and is expected to meet all regulatory requirements`;
    } else if (compliance.status === 'attention') {
      description += ` with certain regulatory considerations requiring attention`;
    } else {
      description += ` and involves significant regulatory complexities that require careful management`;
    }
    
    description += '.';
    
    return description;
  };

  const compliance = getComplianceStatus();

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-5 w-5" />
          Transaction Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Transaction Description Paragraph */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm leading-relaxed text-gray-700">
            {generateTransactionDescription()}
          </p>
        </div>

        {/* Existing Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Deal Overview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">Deal Overview</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Type:</span>
                <span className="text-sm">{results.transactionType}</span>
              </div>
              {results.structure.recommended && (
                <div className="text-sm">
                  <span className="font-medium">Structure:</span> {results.structure.recommended}
                </div>
              )}
              {results.valuation?.transactionValue && (
                <div className="text-sm">
                  <span className="font-medium">Value:</span> {results.valuation.transactionValue.currency} {results.valuation.transactionValue.amount.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Major Terms */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">Major Terms</h3>
            <div className="space-y-2">
              {results.structure.majorTerms?.pricingMechanism && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Pricing:</span>
                  <Badge variant="outline" className="text-xs">
                    {results.structure.majorTerms.pricingMechanism}
                  </Badge>
                </div>
              )}
              {results.structure.majorTerms?.paymentStructure && (
                <div className="text-sm">
                  <span className="font-medium">Payment:</span> 
                  {results.structure.majorTerms.paymentStructure.cashPercentage}% Cash, 
                  {results.structure.majorTerms.paymentStructure.stockPercentage}% Stock
                </div>
              )}
              {results.structure.majorTerms?.targetPercentage && (
                <div className="text-sm">
                  <span className="font-medium">Target %:</span> {results.structure.majorTerms.targetPercentage}%
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">Key Metrics</h3>
            <div className="space-y-2">
              {results.valuation?.valuationRange && (
                <div className="text-sm">
                  <span className="font-medium">Range:</span> 
                  {results.valuation.transactionValue.currency} {results.valuation.valuationRange.low.toLocaleString()} - {results.valuation.valuationRange.high.toLocaleString()}
                </div>
              )}
              {results.valuation?.valuationMetrics?.peRatio && (
                <div className="text-sm">
                  <span className="font-medium">P/E:</span> {results.valuation.valuationMetrics.peRatio}x
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Confidence:</span>
                <Badge variant="outline" className="text-xs">
                  {Math.round(results.confidence * 100)}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">Status</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <Badge className={`text-xs ${compliance.color}`}>
                  {compliance.status === 'compliant' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {compliance.status === 'attention' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {compliance.status === 'high-risk' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {compliance.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{results.timetable.totalDuration}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">{results.shareholding.before.length} shareholders</span>
              </div>
              {optimizationResult?.recommendedStructure?.optimizationScore && (
                <div className="text-sm">
                  <span className="font-medium">Optimization:</span> {Math.round(optimizationResult.recommendedStructure.optimizationScore * 100)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
