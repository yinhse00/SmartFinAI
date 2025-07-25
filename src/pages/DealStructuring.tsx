
import MainLayout from '@/components/layout/MainLayout';
import { useState } from 'react';
import { EnhancedTransactionInput } from '@/components/dealStructuring/EnhancedTransactionInput';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { DealStructuringDashboard } from '@/components/dealStructuring/DealStructuringDashboard';
import { enhancedAiAnalysisService, EnhancedAnalysisResult, ExtractedUserInputs } from '@/services/dealStructuring/enhancedAiAnalysisService';
import { executionPlanExtractor } from '@/services/execution/executionPlanExtractor';
import { executionProjectService } from '@/services/execution/executionProjectService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, FileText, Calculator, Clock, Users, Shield, AlertTriangle, CheckCircle, TrendingUp, Play } from 'lucide-react';

// Export the TransactionData type for other components
export type { TransactionData } from '@/types/dealStructuring';

const DealStructuring = () => {
  const [currentStep, setCurrentStep] = useState<'input' | 'analysis'>('input');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [enhancedResults, setEnhancedResults] = useState<EnhancedAnalysisResult | null>(null);
  const [userInputs, setUserInputs] = useState<ExtractedUserInputs | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [analysisKey, setAnalysisKey] = useState(0); // Key for resetting input component
  const [transactionDescription, setTransactionDescription] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTransactionAnalysis = async (data: {
    description: string;
    uploadedFiles: File[];
    extractedContent?: string[];
  }) => {
    setIsAnalyzing(true);
    setTransactionDescription(data.description); // Store description for components
    try {
      // Convert the input data to TransactionAnalysisRequest format
      const request = {
        transactionType: 'Transaction Analysis',
        description: data.description,
        documents: data.uploadedFiles,
        additionalContext: data.extractedContent?.join('\n\n')
      };

      // Use the enhanced analysis method with validation and reconciliation
      const enhancedResult = await enhancedAiAnalysisService.analyzeTransactionWithValidation(request);
      
      // Extract and store user inputs for data consistency
      const extractedUserInputs = enhancedAiAnalysisService.extractUserInputs(request);
      console.log('=== DealStructuring Page ===');
      console.log('Extracted user inputs:', extractedUserInputs);
      
      setAnalysisResults(enhancedResult.results);
      setEnhancedResults(enhancedResult);
      setUserInputs(extractedUserInputs);
      setCurrentStep('analysis');

      // Show analysis quality report
      const qualityReport = enhancedAiAnalysisService.getAnalysisQualityReport(enhancedResult);
      let toastVariant: 'default' | 'destructive' = 'default';
      let toastTitle = "Analysis Complete";
      let toastDescription = `Analysis quality: ${qualityReport.overallQuality}`;
      
      if (qualityReport.reconciliationNeeded) {
        toastVariant = 'default';
        toastTitle = "Analysis Complete (Data Reconciled)";
        toastDescription = "Analysis completed with data reconciliation to match your inputs.";
      }
      if (qualityReport.overallQuality === 'poor') {
        toastVariant = 'destructive';
        toastDescription = "Analysis completed but may not be fully accurate. Consider providing more specific details.";
      }

      // Add optimization insights to toast
      if (enhancedResult.optimization.optimizationInsights.length > 0) {
        toastDescription += ` Key insight: ${enhancedResult.optimization.optimizationInsights[0]}`;
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
        variant: toastVariant
      });

      // Log quality report for debugging
      console.log('Analysis quality report:', qualityReport);
      console.log('Optimization results:', enhancedResult.optimization);
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
    setEnhancedResults(null);
    setUserInputs(null);
    setAnalysisKey(prev => prev + 1); // Increment key to force component reset
  };

  const handleExecuteTransaction = async () => {
    if (!analysisResults || !enhancedResults) return;

    setIsExecuting(true);
    try {
      // Generate execution plan automatically
      const chatAnalysisContext = {
        originalAnalysis: analysisResults,
        chatHistory: [], // Empty for now, could be populated if chat is integrated
        transactionType: analysisResults.transactionType || 'Transaction',
        targetCompany: userInputs?.targetCompanyName || 'Target Company',
        acquiringCompany: userInputs?.acquiringCompanyName || 'Acquiring Company'
      };

      const executionPlan = await executionPlanExtractor.extractExecutionPlan(chatAnalysisContext);
      
      // Create project automatically
      const projectName = `${analysisResults.transactionType || 'Transaction'} - ${userInputs?.targetCompanyName || 'Target'} - ${new Date().toLocaleDateString()}`;
      const projectDescription = `Execution plan for ${analysisResults.transactionType} involving ${userInputs?.targetCompanyName}`;
      
      const project = await executionProjectService.createProject(
        projectName,
        projectDescription,
        analysisResults.transactionType || 'Transaction',
        executionPlan
      );

      toast({
        title: "Execution Plan Generated",
        description: `Project "${projectName}" created successfully. Navigating to execution center.`,
        variant: "default"
      });

      // Navigate to execution page with project loaded
      navigate('/execution');
    } catch (error) {
      console.error('Error generating execution plan:', error);
      toast({
        title: "Execution Plan Failed",
        description: "Unable to generate execution plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
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
                Get intelligent advisory for capital raising and M&A transactions. Our AI analyzes your requirements 
                and documents to provide professional-grade structuring advice, cost analysis, regulatory compliance 
                guidance, and execution timetables with real-time market intelligence and optimization.
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
              key={analysisKey} 
              onAnalyze={handleTransactionAnalysis} 
              isAnalyzing={isAnalyzing} 
            />
          )}
          
          {currentStep === 'analysis' && analysisResults && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold">Transaction Analysis</h2>
                  {enhancedResults && (
                    <div className="flex items-center gap-2">
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
                        <div className="flex items-center text-blue-600 text-sm">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Market Data: {enhancedResults.optimization.marketIntelligence.precedentTransactions.length} precedents
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleExecuteTransaction}
                    disabled={isExecuting}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <Play className="h-4 w-4" />
                    {isExecuting ? 'Generating Plan...' : 'Execute Transaction'}
                  </button>
                  <button onClick={handleNewAnalysis} className="text-primary hover:underline">
                    New Analysis
                  </button>
                </div>
              </div>
              <DealStructuringDashboard 
                results={analysisResults} 
                onResultsUpdate={handleResultsUpdate} 
                optimizationResult={enhancedResults?.optimization}
                userInputs={userInputs}
                transactionDescription={transactionDescription}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DealStructuring;
