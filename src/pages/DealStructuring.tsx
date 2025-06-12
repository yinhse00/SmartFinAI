
import MainLayout from '@/components/layout/MainLayout';
import { useState } from 'react';
import { EnhancedTransactionInput } from '@/components/dealStructuring/EnhancedTransactionInput';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { DealStructuringDashboard } from '@/components/dealStructuring/DealStructuringDashboard';
import { aiAnalysisService, TransactionAnalysisRequest } from '@/services/dealStructuring/aiAnalysisService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, FileText, Calculator, Clock, Users, Shield } from 'lucide-react';

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

  const featureCards = [
    {
      icon: Brain,
      title: "AI Analysis",
      description: "Advanced AI processes your transaction requirements and provides intelligent structuring recommendations."
    },
    {
      icon: FileText,
      title: "Document Intelligence",
      description: "Upload and analyze transaction documents with AI-powered extraction and interpretation."
    },
    {
      icon: Calculator,
      title: "Cost Analysis",
      description: "Comprehensive breakdown of regulatory, professional, and timing costs for your transaction."
    },
    {
      icon: Clock,
      title: "Timeline Planning",
      description: "Detailed execution timetable with key milestones and critical path analysis."
    },
    {
      icon: Users,
      title: "Shareholding Impact",
      description: "Before and after shareholding analysis with dilution impact assessment."
    },
    {
      icon: Shield,
      title: "Compliance Guide",
      description: "Regulatory compliance requirements including listing rules and takeovers code."
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI-Powered Deal Structuring
          </h1>
          
          {/* Show introductory content only during input phase */}
          {currentStep === 'input' && (
            <>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-4xl">
                Get intelligent advisory for capital raising and M&A transactions. Our AI analyzes your requirements 
                and documents to provide professional-grade structuring advice, cost analysis, regulatory compliance 
                guidance, and execution timetables.
              </p>

              {/* Feature Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {featureCards.map((feature, index) => (
                  <Card key={index} className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <feature.icon className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
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
