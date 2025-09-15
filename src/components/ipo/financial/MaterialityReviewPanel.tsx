import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, TrendingUp, Building, CreditCard } from 'lucide-react';
import { MaterialityAnalysis, MaterialityItem, materialityAnalyzer } from '@/services/financial/materialityAnalyzer';

interface MaterialityReviewPanelProps {
  analyses: MaterialityAnalysis[];
  onAnalysisUpdate: (updatedAnalyses: MaterialityAnalysis[]) => void;
  onConfirmAll: () => void;
}

export const MaterialityReviewPanel: React.FC<MaterialityReviewPanelProps> = ({
  analyses,
  onAnalysisUpdate,
  onConfirmAll
}) => {
  const [threshold, setThreshold] = useState(5);
  const [selectedAnalysisIndex, setSelectedAnalysisIndex] = useState(0);
  const { toast } = useToast();

  const currentAnalysis = analyses[selectedAnalysisIndex];
  const totalItems = currentAnalysis?.items.length || 0;
  const materialItems = currentAnalysis?.items.filter(item => item.isMaterial).length || 0;
  const confirmedItems = currentAnalysis?.items.filter(item => item.userConfirmed).length || 0;

  const handleItemToggle = async (itemIndex: number, isMaterial: boolean) => {
    if (!currentAnalysis) return;

    const updatedAnalyses = [...analyses];
    const updatedItem = { ...updatedAnalyses[selectedAnalysisIndex].items[itemIndex] };
    updatedItem.isMaterial = isMaterial;
    updatedItem.userConfirmed = true;
    updatedAnalyses[selectedAnalysisIndex].items[itemIndex] = updatedItem;

    try {
      if (updatedItem.id) {
        await materialityAnalyzer.updateUserConfirmation(
          updatedItem.id,
          true,
          isMaterial
        );
      }

      onAnalysisUpdate(updatedAnalyses);

      toast({
        title: "Item updated",
        description: `${updatedItem.itemName} ${isMaterial ? 'marked as material' : 'marked as non-material'}`
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update item materiality",
        variant: "destructive"
      });
    }
  };

  const handleBulkConfirm = async (acceptAISuggestions: boolean) => {
    if (!currentAnalysis) return;

    const updatedAnalyses = [...analyses];
    const currentItems = updatedAnalyses[selectedAnalysisIndex].items;

    for (let i = 0; i < currentItems.length; i++) {
      const item = currentItems[i];
      if (!item.userConfirmed) {
        item.isMaterial = acceptAISuggestions ? item.aiSuggested : !item.aiSuggested;
        item.userConfirmed = true;

        try {
          if (item.id) {
            await materialityAnalyzer.updateUserConfirmation(
              item.id,
              true,
              item.isMaterial
            );
          }
        } catch (error) {
          console.error('Failed to update item:', error);
        }
      }
    }

    onAnalysisUpdate(updatedAnalyses);

    toast({
      title: "Bulk update completed",
      description: `${acceptAISuggestions ? 'Accepted' : 'Rejected'} all AI suggestions`
    });
  };

  const getItemTypeIcon = (itemType: MaterialityItem['itemType']) => {
    switch (itemType) {
      case 'revenue_item':
        return <TrendingUp className="w-4 h-4" />;
      case 'asset_item':
        return <Building className="w-4 h-4" />;
      case 'liability_item':
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getItemTypeLabel = (itemType: MaterialityItem['itemType']) => {
    switch (itemType) {
      case 'revenue_item':
        return 'Revenue';
      case 'asset_item':
        return 'Asset';
      case 'liability_item':
        return 'Liability';
    }
  };

  if (!currentAnalysis) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No financial statements uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Selection and Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Materiality Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analyses.length > 1 && (
            <div className="flex gap-2">
              {analyses.map((analysis, index) => (
                <Button
                  key={analysis.financialStatementId}
                  variant={index === selectedAnalysisIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAnalysisIndex(index)}
                >
                  Statement {index + 1}
                </Button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{materialItems}</p>
              <p className="text-sm text-muted-foreground">Material Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{confirmedItems}</p>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Materiality Threshold: {threshold}%
            </label>
            <Slider
              value={[threshold]}
              onValueChange={(value) => setThreshold(value[0])}
              max={20}
              min={1}
              step={0.5}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleBulkConfirm(true)}
            >
              Accept All AI Suggestions
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleBulkConfirm(false)}
            >
              Reject All AI Suggestions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items Review */}
      <Card>
        <CardHeader>
          <CardTitle>Item Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentAnalysis.items.map((item, index) => (
              <div
                key={`${item.itemName}-${index}`}
                className={`p-4 border rounded-lg ${
                  item.userConfirmed 
                    ? item.isMaterial 
                      ? 'border-success bg-success/5' 
                      : 'border-muted bg-muted/5'
                    : item.aiSuggested 
                      ? 'border-orange-300 bg-orange-50' 
                      : 'border-muted'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getItemTypeIcon(item.itemType)}
                      <h4 className="font-medium">{item.itemName}</h4>
                      <Badge variant="outline" className="text-xs">
                        {getItemTypeLabel(item.itemType)}
                      </Badge>
                      {item.userConfirmed && (
                        <CheckCircle className="w-4 h-4 text-success" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-2">
                      <div>Amount: {item.amount.toLocaleString()}</div>
                      <div>Percentage: {item.percentage.toFixed(1)}%</div>
                    </div>

                    {item.aiReasoning && (
                      <p className="text-sm text-muted-foreground italic mb-2">
                        AI: {item.aiReasoning}
                      </p>
                    )}

                    {item.businessContext?.relatedSegments?.length > 0 && (
                      <div className="flex gap-1 mb-2">
                        {item.businessContext.relatedSegments.map((segment: string) => (
                          <Badge key={segment} variant="secondary" className="text-xs">
                            {segment}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Material</span>
                    <Switch
                      checked={item.isMaterial}
                      onCheckedChange={(checked) => handleItemToggle(index, checked)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              onClick={onConfirmAll}
              disabled={confirmedItems < totalItems}
              className="min-w-32"
            >
              {confirmedItems < totalItems 
                ? `Confirm ${confirmedItems}/${totalItems}` 
                : 'Generate Financial Information'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};