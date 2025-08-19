
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { hasGrokApiKey, hasGoogleApiKey, setGrokApiKey, setGoogleApiKey } from '@/services/apiKeyService';
import { AI_PROVIDERS } from '@/config/aiModels';
import { AIProvider } from '@/types/aiProvider';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Key } from 'lucide-react';

const SettingsPage = () => {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState({
    grok: '',
    google: ''
  });
  const [apiKeyStatus, setApiKeyStatus] = useState({
    grok: hasGrokApiKey(),
    google: hasGoogleApiKey()
  });

  useEffect(() => {
    const checkApiKeys = () => {
      setApiKeyStatus({
        grok: hasGrokApiKey(),
        google: hasGoogleApiKey()
      });
    };
    
    checkApiKeys();
    const interval = setInterval(checkApiKeys, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveApiKey = (provider: 'grok' | 'google') => {
    const key = apiKeys[provider].trim();
    if (!key) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }

    try {
      if (provider === 'grok') {
        setGrokApiKey(key);
      } else {
        setGoogleApiKey(key);
      }
      
      setApiKeys({ ...apiKeys, [provider]: '' });
      toast({
        title: "Success",
        description: `${provider === 'grok' ? 'Grok' : 'Google'} API key saved successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive"
      });
    }
  };


  return (
    <MainLayout>
      <div className="container mx-auto py-10 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Technical settings and API key management</p>
          </div>

          <Tabs defaultValue="api-keys" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="api-keys" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Account
              </TabsTrigger>
            </TabsList>


          <TabsContent value="api-keys" className="space-y-6">
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> AI model preferences have been moved to your <a href="/profile" className="text-primary hover:underline">User Profile</a>. 
                Use this page only for technical API key configuration.
              </p>
            </div>
              {AI_PROVIDERS.map((provider) => (
                <Card key={provider.provider}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{provider.displayName} API Key</span>
                      <Badge variant={apiKeyStatus[provider.provider === AIProvider.GROK ? 'grok' : 'google'] ? 'default' : 'secondary'}>
                        {apiKeyStatus[provider.provider === AIProvider.GROK ? 'grok' : 'google'] ? '✓ Configured' : 'Not Set'}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      API key must start with "{provider.apiKeyPrefix}" and be at least 20 characters
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Label htmlFor={`${provider.provider}-key`}>API Key</Label>
                        <Input
                          id={`${provider.provider}-key`}
                          type="password"
                          placeholder={`Enter your ${provider.displayName} API key...`}
                          value={apiKeys[provider.provider === AIProvider.GROK ? 'grok' : 'google']}
                          onChange={(e) => setApiKeys({
                            ...apiKeys,
                            [provider.provider === AIProvider.GROK ? 'grok' : 'google']: e.target.value
                          })}
                        />
                      </div>
                      <Button
                        onClick={() => handleSaveApiKey(provider.provider === AIProvider.GROK ? 'grok' : 'google')}
                        className="mt-6"
                      >
                        Save
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Available Models:</h4>
                      <div className="flex flex-wrap gap-2">
                        {provider.models.map((model) => (
                          <Badge key={model.modelId} variant="outline" className="text-xs">
                            {model.displayName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Additional account settings will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
