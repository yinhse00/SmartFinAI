import MainLayout from '@/components/layout/MainLayout';
import { useState } from 'react';
import { EnhancedTransactionInput } from '@/components/dealStructuring/EnhancedTransactionInput';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { DealStructuringDashboard } from '@/components/dealStructuring/DealStructuringDashboard';
import { enhancedAiAnalysisService, EnhancedAnalysisResult } from '@/services/dealStructuring/enhancedAiAnalysisService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, FileText, Calculator, Clock, Users, Shield, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

// Export the TransactionData type for other components
export type { TransactionData } from '@/types/dealStructuring';

const DealStructuring = () => {
  const [currentStep, setCurrentStep] = useState<'input' | 'analysis'>('input');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [enhancedResults, setEnhancedResults] = useState<EnhancedAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleTransactionAnalysis = async (data: {
    description: string;
    uploadedFiles: File[];
    extractedContent?: string[];
    optimizationParameters?: OptimizationParameters;
  }) => {
    setIsAnalyzing(true);
    try {
      // Convert the input data to TransactionAnalysisRequest format
      const request = {
        transactionType: data.optimizationParameters ? 'Enhanced Transaction Analysis' : 'Transaction Analysis',
        description: data.description,
        documents: data.uploadedFiles,
        additionalContext: data.extractedContent?.join('\n\n'),
        // Extract amount from description or use default
        amount: optimizationEngine.extractAmountFromDescription(data.description) || 50000000
      };

      // Use the enhanced analysis method with optimization parameters
      const enhancedResult = await enhancedAiAnalysisService.analyzeTransactionWithValidation(
        request, 
        data.optimizationParameters
      );
      
      setAnalysisResults(enhancedResult.results);
      setEnhancedResults(enhancedResult);
      setCurrentStep('analysis');

      // Enhanced quality report with optimization context
      const qualityReport = enhancedAiAnalysisService.getAnalysisQualityReport(enhancedResult);
      const optimizationScore = (enhancedResult.optimization.recommendedStructure.optimizationScore * 100).toFixed(1);
      
      let toastVariant: 'default' | 'destructive' = 'default';
      let toastTitle = `Analysis Complete - ${optimizationScore}% Optimized`;
      let toastDescription = `Structure optimized for ${enhancedResult.optimizationParameters.priority} with ${qualityReport.overallQuality} quality rating`;
      
      if (enhancedResult.optimization.recommendedStructure.optimizationScore >= 0.95) {
        toastTitle = `Exceptional Optimization - ${optimizationScore}%`;
        toastDescription = "Structure achieves near-perfect alignment with your requirements";
      } else if (enhancedResult.optimization.recommendedStructure.optimizationScore >= 0.85) {
        toastTitle = `Strong Optimization - ${optimizationScore}%`;
        toastDescription = `Structure strongly aligned with ${enhancedResult.optimizationParameters.priority} priority`;
      }
      
      if (qualityReport.reconciliationNeeded) {
        toastDescription += " (Data reconciled for optimal results)";
      }
      
      if (qualityReport.overallQuality === 'poor') {
        toastVariant = 'destructive';
        toastDescription = "Analysis completed but optimization may be limited by available data.";
      }
      
      // Add key optimization insight to toast
      if (enhancedResult.optimization.optimizationInsights.length > 0) {
        const keyInsight = enhancedResult.optimization.optimizationInsights[0];
        if (keyInsight.length <= 80) {
          toastDescription += ` Key insight: ${keyInsight}`;
        }
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
        variant: toastVariant
      });

      // Enhanced logging for debugging
      console.log('Optimization score achieved:', optimizationScore + '%');
      console.log('Optimization parameters used:', enhancedResult.optimizationParameters);
      console.log('Dynamic weights applied:', enhancedResult.optimization.parameterAnalysis);
      console.log('Market intelligence quality:', qualityReport.marketDataQuality);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze transaction. Please try again with more details.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewAnalysis = () => {
    setCurrentStep('input');
    setAnalysisResults(null);
    setEnhancedResults(null);
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
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4">
          {/* Show introductory content only during input phase */}
          {currentStep === 'input' && (
            <>
              <p className="text-base text-gray-600 dark:text-gray-300 mb-4 max-w-4xl px-0 mx-0 font-normal">
                Get intelligent advisory for capital raising and M&A transactions with advanced AI optimization. 
                Our enhanced engine analyzes your requirements and documents to provide professional-grade structuring 
                advice with dynamic optimization scoring up to 100%, real-time market intelligence, and personalized 
                recommendations based on your specific priorities and constraints.
              </p>

              {/* Feature Overview Cards - Compact Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {featureCards.map((feature, index) => (
                  <Card key={index} className="h-full">
                    <CardContent className="p-3">
                      <div className="flex flex-col items-center text-center">
                        <feature.icon className="h-5 w-5 text-primary mb-2" />
                        <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-tight">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {currentStep === 'input' && (
            <EnhancedTransactionInput 
              onAnalyze={handleTransactionAnalysis} 
              isAnalyzing={isAnalyzing} 
            />
          )}
          
          {currentStep === 'analysis' && analysisResults && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold">Optimized Transaction Analysis Dashboard</h2>
                  {enhancedResults && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-blue-600 text-sm font-medium">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {(enhancedResults.optimization.recommendedStructure.optimizationScore * 100).toFixed(1)}% Optimized
                      </div>
                      
                      {enhancedResults.reconciliation.reconciliationApplied ? (
                        <div className="flex items-center text-orange-600 text-sm">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Data Reconciled
                        </div>
                      ) : enhancedResults.inputValidation.isValid ? (
                        <div className="flex items-center text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Input Validated
                        </div>
                      ) : null}
                      
                      {enhancedResults.optimization.marketIntelligence.precedentTransactions.length > 0 && (
                        <div className="flex items-center text-purple-600 text-sm">
                          <Brain className="h-4 w-4 mr-1" />
                          {enhancedResults.optimization.marketIntelligence.precedentTransactions.length} Precedents
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={handleNewAnalysis} className="text-primary hover:underline">
                  New Analysis
                </button>
              </div>
              
              {enhancedResults && (
                <div className="text-sm text-gray-600 mb-4">
                  Optimized for: <span className="font-medium capitalize">{enhancedResults.optimizationParameters.priority}</span> • 
                  Risk: <span className="font-medium capitalize">{enhancedResults.optimizationParameters.riskTolerance}</span> • 
                  Timeline: <span className="font-medium capitalize">{enhancedResults.optimizationParameters.timeConstraints}</span> • 
                  Budget: <span className="font-medium capitalize">{enhancedResults.optimizationParameters.budgetConstraints}</span>
                </div>
              )}
              
              <DealStructuringDashboard 
                results={analysisResults} 
                onResultsUpdate={handleResultsUpdate}
                optimizationResult={enhancedResults?.optimization}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DealStructuring;
