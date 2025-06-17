import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, AlertTriangle, CheckCircle, Clock, DollarSign, Shield, FileText } from 'lucide-react';
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
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold">Transaction Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Transaction Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <h4 className="text-base font-medium">Transaction Type</h4>
              </div>
              <Badge variant="outline" className="text-sm mb-1">{transactionData.type.replace('_', ' ').toUpperCase()}</Badge>
              <p className="text-sm text-gray-600">{transactionData.subtype}</p>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <h4 className="text-base font-medium">Amount & Size</h4>
              </div>
              <p className="text-lg font-semibold">{formatCurrency(transactionData.amount)}</p>
              <p className="text-sm text-gray-600">
                {((transactionData.amount / transactionData.marketCap) * 100).toFixed(1)}% of market cap
              </p>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-purple-500" />
                <h4 className="text-base font-medium">Regulatory Framework</h4>
              </div>
              <Badge variant="secondary" className="text-sm mb-1">{getRegulatoryFramework()}</Badge>
              <p className="text-sm text-gray-600">Primary regulation</p>
            </Card>
          </div>

          {/* Main Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Threshold Analysis */}
            <Card className="p-4">
              <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Threshold Analysis
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Classification Level</span>
                  <Badge 
                    variant={thresholdAnalysis.risk === 'high' ? 'destructive' : 
                             thresholdAnalysis.risk === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
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
                
                {/* Compact Regulatory Requirements */}
                <div className="mt-3 space-y-1">
                  <h5 className="text-sm font-medium">Key Requirements</h5>
                  {thresholdAnalysis.level.includes('Substantial') && (
                    <div className="flex items-center text-xs text-red-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Shareholder approval required
                    </div>
                  )}
                  <div className="flex items-center text-xs text-blue-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Circular to shareholders
                  </div>
                  <div className="flex items-center text-xs text-blue-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    HKEX/SFC approval
                  </div>
                </div>
              </div>
            </Card>

            {/* Cost Analysis */}
            <Card className="p-4">
              <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Estimated Costs
              </h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-center p-2 border rounded bg-gray-50">
                  <p className="text-xs text-gray-600 mb-1">Regulatory</p>
                  <p className="text-sm font-semibold">{formatCurrency(costs.regulatory)}</p>
                </div>
                <div className="text-center p-2 border rounded bg-gray-50">
                  <p className="text-xs text-gray-600 mb-1">Professional</p>
                  <p className="text-sm font-semibold">{formatCurrency(costs.professional)}</p>
                </div>
                <div className="text-center p-2 border rounded bg-gray-50">
                  <p className="text-xs text-gray-600 mb-1">Marketing</p>
                  <p className="text-sm font-semibold">{formatCurrency(costs.marketing)}</p>
                </div>
                <div className="text-center p-2 border rounded bg-blue-50">
                  <p className="text-xs text-gray-600 mb-1">Total</p>
                  <p className="text-sm font-bold text-blue-600">{formatCurrency(costs.total)}</p>
                </div>
              </div>
            </Card>

            {/* Timeline Analysis */}
            <Card className="p-4">
              <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Timeline Analysis
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 border rounded">
                  <p className="text-xs text-gray-600 mb-1">Optimistic</p>
                  <p className="text-sm font-semibold text-green-600">{timeline.optimistic}w</p>
                </div>
                <div className="text-center p-2 border rounded bg-blue-50">
                  <p className="text-xs text-gray-600 mb-1">Realistic</p>
                  <p className="text-sm font-bold text-blue-600">{timeline.realistic}w</p>
                </div>
                <div className="text-center p-2 border rounded">
                  <p className="text-xs text-gray-600 mb-1">Conservative</p>
                  <p className="text-sm font-semibold text-red-600">{timeline.conservative}w</p>
                </div>
              </div>
            </Card>

            {/* Risk Assessment */}
            {risks.length > 0 && (
              <Card className="p-4">
                <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Key Risks
                </h4>
                <div className="space-y-2">
                  {risks.map((risk, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1 h-1 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 leading-relaxed">{risk}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <Button onClick={onProceed} className="flex items-center gap-2">
              <span>Get Structure Recommendations</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
