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
  financialContentGenerator, 
  FinancialContentRequest 
} from '@/services/financial/financialContentGenerator';
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
  const [materialityAnalyses, setMaterialityAnalyses] = useState<MaterialityAnalysis[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadExistingAnalyses();
  }, [projectId]);

  const loadExistingAnalyses = async () => {
    try {
      const analyses = await materialityAnalyzer.getMaterialityAnalysis(projectId);
      setMaterialityAnalyses(analyses);
      
      if (analyses.length > 0) {
        setActiveTab('review');
      }
    } catch (error) {
      console.error('Failed to load existing analyses:', error);
    }
  };

  const handleFileProcessed = async (statementId: string, data: FinancialData) => {
    try {
      const businessData = await getBusinessData();
      
      const analysis = await materialityAnalyzer.analyzeFinancialStatement(
        projectId,
        statementId,
        businessData
      );

      setMaterialityAnalyses(prev => [...prev, analysis]);
      setActiveTab('review');

      toast({
        title: "Analysis completed",
        description: "Financial statement has been analyzed for materiality."
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Failed to analyze financial statement for materiality.",
        variant: "destructive"
      });
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
      setIsGenerating(true);
      const businessData = await getBusinessData();
      
      const request: FinancialContentRequest = {
        projectId,
        materialityAnalyses,
        businessContext: businessData
      };

      const result = await financialContentGenerator.generateFinancialInformation(request);
      setGeneratedContent(result.content);
      
      // Save the generated content to ipo_prospectus_sections
      await saveFinancialContent(result.content);
      
      setActiveTab('generate');

      if (onContentGenerated) {
        onContentGenerated(result.content);
      }

      toast({
        title: "Content generated",
        description: "Financial information section has been generated and saved successfully."
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate financial information content.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveFinancialContent = async (content: string) => {
    try {
      console.log('💾 Saving financial content for project:', projectId);
      
      // First, check if a record already exists
      const { data: existingData, error: selectError } = await supabase
        .from('ipo_prospectus_sections')
        .select('id')
        .eq('project_id', projectId)
        .eq('section_type', 'financial_information')
        .single();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing content:', selectError);
        throw selectError;
      }

      let result;
      if (existingData) {
        console.log('Updating existing financial section');
        // Update existing record
        result = await supabase
          .from('ipo_prospectus_sections')
          .update({
            title: 'Financial Information',
            content: content,
            status: 'draft',
            confidence_score: 0.85,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id)
          .select()
          .single();
      } else {
        console.log('Creating new financial section');
        // Insert new record
        result = await supabase
          .from('ipo_prospectus_sections')
          .insert({
            project_id: projectId,
            section_type: 'financial_information',
            title: 'Financial Information',
            content: content,
            status: 'draft',
            confidence_score: 0.85
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Error saving financial content:', result.error);
        throw result.error;
      }
      
      console.log('✅ Financial content saved successfully');
    } catch (error) {
      console.error('❌ Failed to save financial content:', error);
      throw error;
    }
  };

  const allItemsConfirmed = materialityAnalyses.every(analysis =>
    analysis.items.every(item => item.userConfirmed)
  );

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
                  {generatedContent ? (
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(generatedContent)}
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