
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftRight, Eye, Download } from 'lucide-react';

interface TransactionFlowControlsProps {
  showBefore: boolean;
  onToggleView: (showBefore: boolean) => void;
  onExport?: () => void;
}

const TransactionFlowControls: React.FC<TransactionFlowControlsProps> = ({
  showBefore,
  onToggleView,
  onExport,
}) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={showBefore ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleView(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Before Transaction
            </Button>
            
            <ArrowLeftRight className="h-4 w-4 text-gray-400" />
            
            <Button
              variant={!showBefore ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleView(false)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              After Transaction
            </Button>
          </div>
          
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionFlowControls;
