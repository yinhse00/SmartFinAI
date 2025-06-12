
import MainLayout from '@/components/layout/MainLayout';
import { useState } from 'react';
import { TransactionInputWizard } from '@/components/dealStructuring/TransactionInputWizard';
import { StructureRecommendations } from '@/components/dealStructuring/StructureRecommendations';
import { TransactionAnalysis } from '@/components/dealStructuring/TransactionAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calculator, FileText, Clock } from 'lucide-react';

export interface TransactionData {
  type: 'capital_raising' | 'ma_transaction' | 'hybrid' | '';
  subtype: string;
  amount: number;
  currency: string;
  currentShares: number;
  marketCap: number;
  objectives: string[];
  timeline: string;
  shareholderStructure: Array<{
    name: string;
    percentage: number;
    type: 'individual' | 'institutional' | 'connected';
  }>;
  regulatoryConstraints: string[];
  jurisdiction: string;
}

const DealStructuring = () => {
  const [currentStep, setCurrentStep] = useState<'input' | 'analysis' | 'recommendations'>('input');
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);

  const handleTransactionSubmit = (data: TransactionData) => {
    setTransactionData(data);
    setCurrentStep('analysis');
  };

  const handleProceedToRecommendations = () => {
    setCurrentStep('recommendations');
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Deal Structuring Advisory
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
            Comprehensive advisory for capital raising and M&A transactions, covering regulatory compliance, 
            execution planning, cost optimization, and structure recommendations.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transaction Types</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15+</div>
              <p className="text-xs text-muted-foreground">Capital raising & M&A structures</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regulatory Frameworks</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Listing Rules & Takeovers Code</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Analysis</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">360°</div>
              <p className="text-xs text-muted-foreground">Complete cost optimization</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timeline Planning</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Smart</div>
              <p className="text-xs text-muted-foreground">Optimized execution timeline</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="space-y-8">
          {currentStep === 'input' && (
            <TransactionInputWizard onSubmit={handleTransactionSubmit} />
          )}
          
          {currentStep === 'analysis' && transactionData && (
            <TransactionAnalysis 
              transactionData={transactionData}
              onProceed={handleProceedToRecommendations}
            />
          )}
          
          {currentStep === 'recommendations' && transactionData && (
            <StructureRecommendations 
              transactionData={transactionData}
              onBack={() => setCurrentStep('analysis')}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DealStructuring;
