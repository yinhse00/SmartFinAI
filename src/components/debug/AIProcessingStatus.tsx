import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { hasGrokApiKey, hasPerplexityApiKey, hasGoogleApiKey } from '@/services/apiKeyService';
import { grokService } from '@/services/grokService';
import { CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';

export const AIProcessingStatus = () => {
  const [status, setStatus] = useState<{
    apiKeys: Record<string, boolean>;
    grokService: boolean;
    timestamp: string;
  } | null>(null);

  const checkSystemStatus = async () => {
    console.log('🔍 [SYSTEM CHECK] Checking AI processing system status...');
    
    const apiKeys = {
      grok: hasGrokApiKey(),
      perplexity: hasPerplexityApiKey(),
      google: hasGoogleApiKey()
    };
    
    const grokServiceStatus = grokService.hasApiKey();
    
    console.log('📊 [SYSTEM CHECK] API Key Status:', apiKeys);
    console.log('🤖 [SYSTEM CHECK] Grok Service Status:', grokServiceStatus);
    
    setStatus({
      apiKeys,
      grokService: grokServiceStatus,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const StatusIcon = ({ isActive }: { isActive: boolean }) => (
    isActive ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  );

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          AI-First Processing System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={checkSystemStatus} variant="outline" className="w-full">
          Check System Status
        </Button>
        
        {status && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Last checked: {status.timestamp}
              </span>
            </div>
            
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <StatusIcon isActive={status.apiKeys.grok} />
                  <span className="font-medium">Grok/X.AI API Key</span>
                </div>
                <Badge variant={status.apiKeys.grok ? "default" : "destructive"}>
                  {status.apiKeys.grok ? "Configured" : "Missing"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <StatusIcon isActive={status.grokService} />
                  <span className="font-medium">Grok Service</span>
                </div>
                <Badge variant={status.grokService ? "default" : "destructive"}>
                  {status.grokService ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <StatusIcon isActive={status.apiKeys.google} />
                  <span className="font-medium">Google API Key</span>
                </div>
                <Badge variant={status.apiKeys.google ? "default" : "destructive"}>
                  {status.apiKeys.google ? "Configured" : "Missing"}
                </Badge>
              </div>
            </div>
            
            {!status.apiKeys.grok && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">AI Table Detection Disabled</p>
                  <p className="text-yellow-700">
                    Configure your X.AI/Grok API key in Settings to enable AI-first financial processing.
                    Without it, the system will fall back to basic regex parsing.
                  </p>
                </div>
              </div>
            )}
            
            {status.apiKeys.grok && status.grokService && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">AI-First Processing Active</p>
                  <p className="text-green-700">
                    Your system is configured for AI-enhanced table detection and financial analysis.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};