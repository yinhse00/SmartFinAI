
import MainLayout from '@/components/layout/MainLayout';
import { useState } from 'react';
import { EnhancedTransactionInput } from '@/components/dealStructuring/EnhancedTransactionInput';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { DealStructuringDashboard } from '@/components/dealStructuring/DealStructuringDashboard';
import { aiAnalysisService, TransactionAnalysisRequest } from '@/services/dealStructuring/aiAnalysisService';
import { useToast } from '@/hooks/use-toast';

// Export the TransactionData type for other components
export type { TransactionData } from '@/types/dealStructuring';

const DealStructuring = () => {
  const [currentStep, setCurrentStep] = useState<'input' | 'analysis'>('input');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleTransactionAnalysis = async (request: TransactionAnalysisRequest) => {
    setIsAnalyzing(true);
    
    try {
      const results = await aiAnalysisService.analyzeTransaction(request);
      setAnalysisResults(results);
      setCurrentStep('analysis');
      
      toast({
        title: "Analysis Complete",
        description: "Your transaction has been analyzed successfully.",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze transaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewAnalysis = () => {
    setCurrentStep('input');
    setAnalysisResults(null);
  };

  const handleResultsUpdate = (updatedResults: AnalysisResults) => {
    setAnalysisResults(updatedResults);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI-Powered Deal Structuring
          </h1>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {currentStep === 'input' && (
            <EnhancedTransactionInput
              onAnalyze={handleTransactionAnalysis}
              isAnalyzing={isAnalyzing}
            />
          )}
          
          {currentStep === 'analysis' && analysisResults && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Transaction Analysis Dashboard</h2>
                <button
                  onClick={handleNewAnalysis}
                  className="text-primary hover:underline"
                >
                  New Analysis
                </button>
              </div>
              <DealStructuringDashboard 
                results={analysisResults} 
                onResultsUpdate={handleResultsUpdate}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DealStructuring;
