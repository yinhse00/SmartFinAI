
import MainLayout from '@/components/layout/MainLayout';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calculator, FileText, Clock, Sparkles, Users } from 'lucide-react';
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
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-4xl">
            Get intelligent advisory for capital raising and M&A transactions. Our AI analyzes your requirements 
            and documents to provide professional-grade structuring advice, cost analysis, regulatory compliance 
            guidance, and execution timetables.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Sparkles className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">AI Analysis</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <FileText className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-sm font-medium">Document Intelligence</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Calculator className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm font-medium">Cost Analysis</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Clock className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <p className="text-sm font-medium">Timeline Planning</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <p className="text-sm font-medium">Shareholding Impact</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <TrendingUp className="h-8 w-8 mx-auto text-red-500 mb-2" />
              <p className="text-sm font-medium">Compliance Guide</p>
            </CardContent>
          </Card>
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
