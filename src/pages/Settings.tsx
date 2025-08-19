
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
import { getAIPreferences, saveAIPreferences } from '@/services/ai/aiPreferences';
import { AI_PROVIDERS, getAllModels } from '@/config/aiModels';
import { AIProvider, UserAIPreferences } from '@/types/aiProvider';
import AIModelSelector from '@/components/ui/AIModelSelector';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Key, Brain, Bot } from 'lucide-react';

const SettingsPage = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserAIPreferences>(getAIPreferences());
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

  const handleDefaultProviderChange = (provider: AIProvider) => {
    const newPreferences = { ...preferences, defaultProvider: provider };
    setPreferences(newPreferences);
    saveAIPreferences(newPreferences);
    toast({
      title: "Updated",
      description: `Default AI provider set to ${provider === AIProvider.GROK ? 'Grok' : 'Google Gemini'}`,
    });
  };

  const handleDefaultModelChange = (model: string) => {
    const newPreferences = { ...preferences, defaultModel: model };
    setPreferences(newPreferences);
    saveAIPreferences(newPreferences);
    toast({
      title: "Updated", 
      description: "Default AI model updated",
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-10 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your AI preferences and API keys</p>
          </div>

          <Tabs defaultValue="ai-models" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai-models" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Models
              </TabsTrigger>
              <TabsTrigger value="api-keys" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai-models" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Default AI Model
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose your default AI provider and model for new features
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <AIModelSelector
                      selectedProvider={preferences.defaultProvider}
                      selectedModel={preferences.defaultModel}
                      onProviderChange={handleDefaultProviderChange}
                      onModelChange={handleDefaultModelChange}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">Feature-Specific Preferences</h3>
                    <div className="space-y-3">
                      {(['chat', 'ipo', 'translation'] as const).map((feature) => {
                        const featurePreference = preferences.perFeaturePreferences?.[feature];
                        return (
                          <div key={feature} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium capitalize">{feature}</p>
                              <p className="text-sm text-muted-foreground">
                                {featurePreference ? 
                                  `${featurePreference.provider === AIProvider.GROK ? 'Grok' : 'Google'} - ${featurePreference.model}` :
                                  'Using default settings'
                                }
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {featurePreference?.provider === AIProvider.GROK ? 'Grok' : 'Google'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api-keys" className="space-y-6">
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
