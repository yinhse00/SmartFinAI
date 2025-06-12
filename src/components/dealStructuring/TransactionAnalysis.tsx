import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { TransactionData } from '@/types/dealStructuring';

interface TransactionAnalysisProps {
  transactionData: TransactionData;
  onProceed: () => void;
}

export const TransactionAnalysis = ({ transactionData, onProceed }: TransactionAnalysisProps) => {
  
  // Analysis logic based on transaction data
  const getRegulatoryFramework = () => {
    if (transactionData.type === 'ma_transaction') {
      return transactionData.subtype === 'Asset Acquisition' ? 'Listing Rules (Chapter 14)' : 'Takeovers Code';
    }
    return 'Listing Rules (Chapter 7)';
  };

  const getThresholdAnalysis = () => {
    const dilution = (transactionData.amount / transactionData.marketCap) * 100;
    
    if (transactionData.type === 'capital_raising') {
      if (dilution > 100) return { level: 'Very Substantial', threshold: '100%+', risk: 'high' };
      if (dilution > 50) return { level: 'Substantial', threshold: '50%+', risk: 'medium' };
      if (dilution > 25) return { level: 'Major', threshold: '25%+', risk: 'medium' };
      return { level: 'Minor', threshold: '<25%', risk: 'low' };
    }
    
    if (transactionData.type === 'ma_transaction') {
      if (dilution > 30) return { level: 'Mandatory Offer Triggered', threshold: '30%+', risk: 'high' };
      return { level: 'Below Threshold', threshold: '<30%', risk: 'low' };
    }
    
    return { level: 'To Be Determined', threshold: 'N/A', risk: 'medium' };
  };

  const getEstimatedCosts = () => {
    const baseAmount = transactionData.amount;
    const regulatoryFees = baseAmount * 0.002; // 0.2%
    const professionalFees = baseAmount * 0.01; // 1%
    const marketingCosts = baseAmount * 0.005; // 0.5%
    const total = regulatoryFees + professionalFees + marketingCosts;
    
    return {
      regulatory: regulatoryFees,
      professional: professionalFees,
      marketing: marketingCosts,
      total
    };
  };

  const getTimelineEstimate = () => {
    const thresholdAnalysis = getThresholdAnalysis();
    const framework = getRegulatoryFramework();
    
    let baseWeeks = 8; // Base timeline
    
    if (framework.includes('Takeovers Code')) baseWeeks += 4;
    if (thresholdAnalysis.level.includes('Substantial')) baseWeeks += 6;
    if (transactionData.regulatoryConstraints.includes('Shareholder Approval Required')) baseWeeks += 4;
    
    return {
      optimistic: baseWeeks - 2,
      realistic: baseWeeks,
      conservative: baseWeeks + 4
    };
  };

  const getKeyRisks = () => {
    const risks = [];
    const thresholdAnalysis = getThresholdAnalysis();
    
    if (thresholdAnalysis.risk === 'high') {
      risks.push('High regulatory threshold - Complex approval process required');
    }
    
    if (transactionData.regulatoryConstraints.includes('Connected Party Transaction')) {
      risks.push('Connected party transaction - Enhanced disclosure requirements');
    }
    
    if (transactionData.timeline === 'urgent') {
      risks.push('Tight timeline - May require expedited processing');
    }
    
    if (transactionData.shareholderStructure.some(s => s.type === 'connected')) {
      risks.push('Connected shareholders - Potential voting restrictions');
    }
    
    return risks;
  };

  const thresholdAnalysis = getThresholdAnalysis();
  const costs = getEstimatedCosts();
  const timeline = getTimelineEstimate();
  const risks = getKeyRisks();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: transactionData.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Transaction Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Transaction Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Transaction Type</h3>
              <div className="space-y-1">
                <Badge variant="outline" className="text-sm">{transactionData.type.replace('_', ' ').toUpperCase()}</Badge>
                <p className="text-sm text-gray-600">{transactionData.subtype}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Amount & Size</h3>
              <div className="space-y-1">
                <p className="text-lg font-medium">{formatCurrency(transactionData.amount)}</p>
                <p className="text-sm text-gray-600">
                  {((transactionData.amount / transactionData.marketCap) * 100).toFixed(1)}% of market cap
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Regulatory Framework</h3>
              <div className="space-y-1">
                <Badge variant="secondary">{getRegulatoryFramework()}</Badge>
                <p className="text-sm text-gray-600">Primary regulation</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Threshold Analysis */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Threshold Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Classification Level</span>
                  <Badge 
                    variant={thresholdAnalysis.risk === 'high' ? 'destructive' : 
                             thresholdAnalysis.risk === 'medium' ? 'default' : 'secondary'}
                  >
                    {thresholdAnalysis.level}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Threshold</span>
                  <span className="text-sm font-medium">{thresholdAnalysis.threshold}</span>
                </div>
                <Progress 
                  value={thresholdAnalysis.risk === 'high' ? 85 : thresholdAnalysis.risk === 'medium' ? 60 : 30} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Regulatory Requirements</h4>
                <div className="space-y-2 text-sm">
                  {thresholdAnalysis.level.includes('Substantial') && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-red-500" />
                      <span>Shareholder approval required</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>Circular to shareholders</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>HKEX/SFC approval</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cost Analysis */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Estimated Costs</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Regulatory Fees</p>
                <p className="text-lg font-semibold">{formatCurrency(costs.regulatory)}</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Professional Fees</p>
                <p className="text-lg font-semibold">{formatCurrency(costs.professional)}</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Marketing Costs</p>
                <p className="text-lg font-semibold">{formatCurrency(costs.marketing)}</p>
              </div>
              <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <p className="text-sm text-gray-600 mb-1">Total Estimated</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(costs.total)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timeline Analysis */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Timeline Analysis</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Optimistic</p>
                <p className="text-lg font-semibold text-green-600">{timeline.optimistic} weeks</p>
              </div>
              <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <p className="text-sm text-gray-600 mb-1">Realistic</p>
                <p className="text-lg font-bold text-blue-600">{timeline.realistic} weeks</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Conservative</p>
                <p className="text-lg font-semibold text-red-600">{timeline.conservative} weeks</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Risk Assessment */}
          {risks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Key Risks & Considerations</span>
              </h3>
              <div className="space-y-3">
                {risks.map((risk, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{risk}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onProceed} className="flex items-center space-x-2">
              <span>Get Structure Recommendations</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
