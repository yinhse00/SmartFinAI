import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, AlertCircle } from 'lucide-react';
import { useApiUsageSettings } from '@/hooks/useApiUsageSettings';

interface ManualContentLoaderProps {
  sectionType: string;
  onLoadContent: () => Promise<void>;
  onRefreshContent: () => Promise<void>;
  isLoading?: boolean;
  hasContent?: boolean;
  lastUpdated?: string;
  contentPreview?: string;
}

export const ManualContentLoader = ({
  sectionType,
  onLoadContent,
  onRefreshContent,
  isLoading = false,
  hasContent = false,
  lastUpdated,
  contentPreview
}: ManualContentLoaderProps) => {
  const { settings, incrementApiCallCounter } = useApiUsageSettings();
  const [estimatedCost, setEstimatedCost] = useState(1);

  const handleLoadContent = async () => {
    if (settings.manualContentLoading) {
      incrementApiCallCounter();
    }
    await onLoadContent();
  };

  const handleRefreshContent = async () => {
    if (settings.manualContentLoading) {
      incrementApiCallCounter();
    }
    await onRefreshContent();
  };

  const getSectionDisplayName = (type: string) => {
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {getSectionDisplayName(sectionType)}
            </CardTitle>
            <CardDescription>
              {hasContent ? 'Content loaded' : 'No content loaded yet'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasContent && (
              <Badge variant="outline" className="text-green-600">
                Loaded
              </Badge>
            )}
            {settings.manualContentLoading && (
              <Badge variant="secondary">
                Manual Mode
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Content Preview */}
        {contentPreview && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Preview:</p>
            <p className="text-sm line-clamp-3">
              {contentPreview}
            </p>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        )}

        {/* API Cost Warning */}
        {settings.manualContentLoading && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">
              This action will use ~{estimatedCost} API call{estimatedCost > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!hasContent ? (
            <Button 
              onClick={handleLoadContent}
              disabled={isLoading}
              className="flex-1"
            >
              <Download className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Load Content'}
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={handleRefreshContent}
              disabled={isLoading}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh Content'}
            </Button>
          )}
        </div>

        {/* Auto-loading disabled notice */}
        {!settings.manualContentLoading && (
          <p className="text-xs text-muted-foreground">
            Auto-loading is enabled. Content will load automatically.
          </p>
        )}
      </CardContent>
    </Card>
  );
};