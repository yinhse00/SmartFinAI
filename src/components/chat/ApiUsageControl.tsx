import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Zap, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { useApiUsageSettings, ApiUsageMode } from '@/hooks/useApiUsageSettings';
import { connectionTester } from '@/services/api/grok/connectionTester';
import { useToast } from '@/hooks/use-toast';

interface ApiUsageControlProps {
  onTestConnection?: () => Promise<void>;
  connectionStatus?: {
    success: boolean | null;
    message: string;
    loading: boolean;
  };
}

export const ApiUsageControl = ({ 
  onTestConnection,
  connectionStatus 
}: ApiUsageControlProps) => {
  const { 
    settings, 
    updateMode, 
    resetApiCallCounter, 
    updateSetting,
    apiCallsToday 
  } = useApiUsageSettings();
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  const handleTestConnection = async () => {
    if (onTestConnection) {
      await onTestConnection();
      return;
    }

    setIsTestingConnection(true);
    try {
      const result = await connectionTester.testApiConnection();
      toast({
        title: result.success ? "Connection Successful" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: "Unable to test API connection",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleForceResetConnection = () => {
    connectionTester.resetConnectionCache();
    toast({
      title: "Connection Cache Cleared",
      description: "All connection caches have been reset"
    });
  };

  const getModeDescription = (mode: ApiUsageMode) => {
    switch (mode) {
      case 'economy':
        return 'Manual controls only - Minimal API usage';
      case 'balanced':
        return 'Some automatic features - Moderate API usage';
      case 'automatic':
        return 'Full automatic features - Higher API usage';
    }
  };

  const getModeColor = (mode: ApiUsageMode) => {
    switch (mode) {
      case 'economy':
        return 'bg-green-500';
      case 'balanced':
        return 'bg-yellow-500';
      case 'automatic':
        return 'bg-red-500';
    }
  };

  // Calculate usage level
  const usageLevel = Math.min((apiCallsToday / 100) * 100, 100); // Cap at 100 calls for display

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          API Usage Control
        </CardTitle>
        <CardDescription>
          Manage your API usage and connection settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Mode Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">API Usage Mode</Label>
          <Select value={settings.mode} onValueChange={updateMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Economy Mode
                </div>
              </SelectItem>
              <SelectItem value="balanced">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Balanced Mode
                </div>
              </SelectItem>
              <SelectItem value="automatic">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Automatic Mode
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {getModeDescription(settings.mode)}
          </p>
        </div>

        {/* API Call Counter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">API Calls Today</Label>
            <Badge variant={apiCallsToday > 50 ? "destructive" : "default"}>
              {apiCallsToday} calls
            </Badge>
          </div>
          <Progress value={usageLevel} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>100+ calls</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetApiCallCounter}
            className="w-full"
          >
            Reset Counter
          </Button>
        </div>

        {/* Manual Connection Testing */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Connection Testing</Label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="manual-connection" className="text-sm">
                Manual Testing Only
              </Label>
              {connectionStatus?.success === true && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {connectionStatus?.success === false && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <Switch
              id="manual-connection"
              checked={settings.manualConnectionTesting}
              onCheckedChange={(checked) => 
                updateSetting('manualConnectionTesting', checked)
              }
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestConnection}
              disabled={isTestingConnection || connectionStatus?.loading}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${
                (isTestingConnection || connectionStatus?.loading) ? 'animate-spin' : ''
              }`} />
              Test Connection
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleForceResetConnection}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              Reset Cache
            </Button>
          </div>
          
          {connectionStatus?.message && (
            <p className="text-xs text-muted-foreground">
              {connectionStatus.message}
            </p>
          )}
        </div>

        {/* Manual Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Manual Controls</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="manual-content" className="text-sm">
              Manual Content Loading
            </Label>
            <Switch
              id="manual-content"
              checked={settings.manualContentLoading}
              onCheckedChange={(checked) => 
                updateSetting('manualContentLoading', checked)
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="manual-background" className="text-sm">
              Manual Background Checks
            </Label>
            <Switch
              id="manual-background"
              checked={settings.manualBackgroundChecks}
              onCheckedChange={(checked) => 
                updateSetting('manualBackgroundChecks', checked)
              }
            />
          </div>
        </div>

        {/* Current Mode Indicator */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
          <div className={`w-3 h-3 rounded-full ${getModeColor(settings.mode)}`} />
          <span className="text-sm font-medium">
            Current Mode: {settings.mode.charAt(0).toUpperCase() + settings.mode.slice(1)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};