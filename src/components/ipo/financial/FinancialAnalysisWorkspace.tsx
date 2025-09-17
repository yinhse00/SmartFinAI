import React, { useState, useEffect } from 'react';
import { FinancialStatementUploader } from './FinancialStatementUploader';
import { MaterialityReviewPanel } from './MaterialityReviewPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calculator, CheckCircle } from 'lucide-react';
import { 
  MaterialityAnalysis, 
  materialityAnalyzer 
} from '@/services/financial/materialityAnalyzer';
import { 
  EnhancedMaterialityAnalysis, 
  enhancedMaterialityAnalyzer 
} from '@/services/financial/enhancedMaterialityAnalyzer';
import { useIPOContentGeneration } from '@/hooks/useIPOContentGeneration';
import { IPOContentGenerationRequest } from '@/types/ipo';
import { FinancialData } from '@/services/financial/financialDataExtractor';
import { supabase } from '@/integrations/supabase/client';

interface FinancialAnalysisWorkspaceProps {
  projectId: string;
  businessContext?: {
    businessContent?: string;
    userInputs?: any;
  };
  onContentGenerated?: (content: string) => void;
}

export const FinancialAnalysisWorkspace: React.FC<FinancialAnalysisWorkspaceProps> = ({
  projectId,
  businessContext,
  onContentGenerated
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'review' | 'generate'>('upload');
  const [materialityAnalyses, setMaterialityAnalyses] = useState<EnhancedMaterialityAnalysis[]>([]);
  const { toast } = useToast();
  
  const {
    generateContent,
    isGenerating,
    generatedContent: ipoGeneratedContent,
    lastGeneratedResponse
  } = useIPOContentGeneration();

  useEffect(() => {
    loadExistingAnalyses();
  }, [projectId]);

  const loadExistingAnalyses = async () => {
    try {
      const analyses = await enhancedMaterialityAnalyzer.getEnhancedMaterialityAnalysis(projectId);
      setMaterialityAnalyses(analyses);
      
      if (analyses.length > 0) {
        setActiveTab('review');
      }
    } catch (error) {
      console.error('Failed to load existing analyses:', error);
    }
  };

  const handleFileProcessed = async (statementId: string, data: FinancialData, documentContent?: string) => {
    try {
      console.log('🔍 Starting enhanced materiality analysis...');
      console.log('📊 Financial data extracted:', {
        statementType: data.statementType,
        lineItemsCount: data.lineItems.length,
        totalRevenue: data.totalRevenue,
        totalAssets: data.totalAssets,
        totalLiabilities: data.totalLiabilities,
        hasComparativeData: !!data.comparativeData
      });

      const businessData = await getBusinessData();
      
      // Use enhanced materiality analyzer with document content for NLP analysis
      const analysis = await enhancedMaterialityAnalyzer.analyzeFinancialStatementEnhanced(
        projectId,
        statementId,
        businessData?.businessContent || '',
        documentContent
      );

      console.log('✅ Enhanced materiality analysis completed:', {
        totalItems: analysis.items.length,
        materialItems: analysis.items.filter(item => item.isMaterial).length,
        qualitativeFactors: analysis.qualitativeFactors?.length || 0
      });

      setMaterialityAnalyses(prev => [...prev, analysis]);
      setActiveTab('review');

      toast({
        title: "Enhanced analysis completed",
        description: `Analyzed ${analysis.items.length} financial items (${analysis.items.filter(item => item.isMaterial).length} material).`
      });
    } catch (error) {
      console.error('Enhanced analysis failed, falling back to basic analyzer:', error);
      
      // Fallback to basic analyzer
      try {
        const businessData = await getBusinessData();
        const basicAnalysis = await materialityAnalyzer.analyzeFinancialStatement(
          projectId,
          statementId,
          businessData
        );
        
        // Convert to enhanced format
        const enhancedAnalysis: EnhancedMaterialityAnalysis = {
          projectId: basicAnalysis.projectId,
          financialStatementId: basicAnalysis.financialStatementId,
          items: basicAnalysis.items.map(item => ({
            itemName: item.itemName,
            itemType: item.itemType as any,
            amount: item.amount,
            baseAmount: item.baseAmount,
            percentage: item.percentage,
            yoyPercentage: 0,
            materialityThreshold: item.materialityThreshold,
            yoyThreshold: 20,
            isMaterial: item.isMaterial,
            aiSuggested: item.aiSuggested,
            userConfirmed: item.userConfirmed,
            aiReasoning: item.aiReasoning,
            section: 'P/L',
            currency: 'Unknown',
            auditStatus: 'Unknown',
            businessContext: item.businessContext
          })),
          qualitativeFactors: [],
          summaryData: {
            totalRevenue: data.totalRevenue || 0,
            totalAssets: data.totalAssets || 0,
            totalLiabilities: data.totalLiabilities || 0
          },
          thresholds: {
            materiality: 5.0,
            yoyChange: 20.0
          },
          extractedPeriods: []
        };
        
        setMaterialityAnalyses(prev => [...prev, enhancedAnalysis]);
        setActiveTab('review');

        toast({
          title: "Basic analysis completed",
          description: "Financial statement analyzed with basic materiality detection."
        });
      } catch (fallbackError) {
        console.error('Both enhanced and basic analysis failed:', fallbackError);
        toast({
          title: "Analysis failed",
          description: "Failed to analyze financial statement for materiality.",
          variant: "destructive"
        });
      }
    }
  };

  const getBusinessData = async () => {
    try {
      const { data: businessSection } = await supabase
        .from('ipo_prospectus_sections')
        .select('content')
        .eq('project_id', projectId)
        .eq('section_type', 'business')
        .maybeSingle();

      return {
        businessContent: businessSection?.content || businessContext?.businessContent,
        userInputs: businessContext?.userInputs
      };
    } catch (error) {
      console.error('Failed to fetch business data:', error);
      return businessContext || {};
    }
  };

  const handleGenerateContent = async () => {
    if (!allItemsConfirmed) {
      toast({
        title: "Confirmation required",
        description: "Please confirm all materiality items before generating content",
        variant: "destructive"
      });
      return;
    }

    try {
      const businessData = await getBusinessData();
      
      const request: IPOContentGenerationRequest = {
        project_id: projectId,
        section_type: 'financial_information',
        key_elements: {
          materialityAnalyses,
          businessContext: businessData
        }
      };

      const result = await generateContent(request);
      
      if (result) {
        setActiveTab('generate');

        if (onContentGenerated) {
          onContentGenerated(result.content || '');
        }

        toast({
          title: "Content generated",
          description: "Financial information section has been generated and saved successfully."
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate financial information content.",
        variant: "destructive"
      });
    }
  };


  const allItemsConfirmed = materialityAnalyses.every(analysis =>
    analysis.items.every(item => item.userConfirmed)
  );

  // Debug information for troubleshooting
  useEffect(() => {
    if (materialityAnalyses.length > 0) {
      console.log('📋 Current materiality analyses:', materialityAnalyses.map(analysis => ({
        projectId: analysis.projectId,
        totalItems: analysis.items.length,
        materialItems: analysis.items.filter(item => item.isMaterial).length,
        confirmedItems: analysis.items.filter(item => item.userConfirmed).length,
        qualitativeFactors: analysis.qualitativeFactors?.length || 0
      })));
    }
  }, [materialityAnalyses]);

  const hasUploadedFiles = materialityAnalyses.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Information Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Upload & Extract
              </TabsTrigger>
              <TabsTrigger 
                value="review" 
                disabled={!hasUploadedFiles}
                className="flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Review Materiality
              </TabsTrigger>
              <TabsTrigger 
                value="generate" 
                disabled={!allItemsConfirmed}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Generate Content
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-6">
              <FinancialStatementUploader
                projectId={projectId}
                onFileProcessed={handleFileProcessed}
              />
            </TabsContent>

            <TabsContent value="review" className="mt-6">
              {hasUploadedFiles ? (
                <MaterialityReviewPanel
                  analyses={materialityAnalyses}
                  onAnalysisUpdate={setMaterialityAnalyses}
                  onConfirmAll={handleGenerateContent}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Please upload financial statements first
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="generate" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Financial Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {ipoGeneratedContent ? (
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">{ipoGeneratedContent}</pre>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(ipoGeneratedContent)}
                        >
                          Copy to Clipboard
                        </Button>
                        <Button onClick={handleGenerateContent} disabled={isGenerating}>
                          {isGenerating ? 'Regenerating...' : 'Regenerate'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Button 
                        onClick={handleGenerateContent}
                        disabled={isGenerating || !allItemsConfirmed}
                        size="lg"
                      >
                        {isGenerating ? 'Generating...' : 'Generate Financial Information'}
                      </Button>
                      {!allItemsConfirmed && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Please confirm all materiality decisions first
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};