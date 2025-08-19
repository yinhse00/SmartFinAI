
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Brain, 
  Key, 
  Settings, 
  Check, 
  X, 
  ExternalLink, 
  AlertCircle, 
  Info 
} from 'lucide-react';
import AIModelSelector from '@/components/ui/AIModelSelector';
import { AIProvider } from '@/types/aiProvider';
import { 
  getAIPreferences, 
  saveAIPreferences, 
  getFeatureAIPreference, 
  updateFeatureAIPreference,
  updateDefaultAIPreference 
} from '@/services/ai/aiPreferences';
import { 
  getGrokApiKey, 
  setGrokApiKey, 
  hasGrokApiKey,
  getGoogleApiKey,
  setGoogleApiKey,
  hasGoogleApiKey 
} from '@/services/apiKeyService';
import { useAuth } from '@/components/auth/AuthProvider';
import { validateApiKey, getDefaultModel } from '@/config/aiModels';

const ProfilePage = () => {
  const { user } = useAuth();
  const [aiPreferences, setAiPreferences] = useState(() => getAIPreferences());
  const [grokApiKey, setGrokApiKeyInput] = useState('');
  const [googleApiKey, setGoogleApiKeyInput] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState({
    grok: false,
    google: false
  });
  const [keyErrors, setKeyErrors] = useState({
    grok: '',
    google: ''
  });

  useEffect(() => {
    const checkApiKeyStatus = () => {
      setApiKeyStatus({
        grok: hasGrokApiKey(),
        google: hasGoogleApiKey()
      });
    };
    
    checkApiKeyStatus();
    const interval = setInterval(checkApiKeyStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const validateAndSaveGrokKey = () => {
    if (!grokApiKey.startsWith('xai-')) {
      setKeyErrors(prev => ({ ...prev, grok: "Invalid API key format. Grok API keys should start with 'xai-'" }));
      return;
    }
    
    setKeyErrors(prev => ({ ...prev, grok: '' }));
    setGrokApiKey(grokApiKey);  // Service function to save to localStorage
    setGrokApiKeyInput('');
  };

  const validateAndSaveGoogleKey = () => {
    if (!validateApiKey(AIProvider.GOOGLE, googleApiKey)) {
      setKeyErrors(prev => ({ ...prev, google: "Invalid API key format. Google API keys should start with 'AIza'" }));
      return;
    }
    
    setKeyErrors(prev => ({ ...prev, google: '' }));
    setGoogleApiKey(googleApiKey);  // Service function to save to localStorage
    setGoogleApiKeyInput('');
  };

  const handleDefaultProviderChange = (provider: AIProvider) => {
    // Just update the provider - AIModelSelector will handle the model selection
    const preferences = getAIPreferences();
    preferences.defaultProvider = provider;
    setAiPreferences(preferences);
  };

  const handleDefaultModelChange = (model: string) => {
    updateDefaultAIPreference(aiPreferences.defaultProvider, model);
    setAiPreferences(getAIPreferences());
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <MainLayout>
      <div className="container mx-auto py-10 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">User Profile</h1>
          <p className="text-muted-foreground">Manage your profile information, AI preferences, and API keys</p>
        </div>

        <Tabs defaultValue="personal-info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal-info" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="ai-preferences" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Preferences
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="account-settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Account Settings
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal-info">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl} alt="User avatar" />
                    <AvatarFallback className="text-lg">{getInitials(fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{fullName || 'No name set'}</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ''} disabled />
                  </div>
                  <div>
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input id="full-name" value={fullName || ''} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Preferences */}
          <TabsContent value="ai-preferences">
            <Card>
              <CardHeader>
                <CardTitle>AI Model Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Default AI Provider & Model</h3>
                  <AIModelSelector
                    selectedProvider={aiPreferences.defaultProvider}
                    selectedModel={aiPreferences.defaultModel}
                    onProviderChange={handleDefaultProviderChange}
                    onModelChange={handleDefaultModelChange}
                    className="w-full"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Feature-Specific Preferences</h3>
                  <div className="space-y-4">
                    {Object.entries({
                      chat: { name: 'Chat Interface', icon: '💬' },
                      ipo: { name: 'IPO Prospectus', icon: '📊' },
                      translation: { name: 'Translation', icon: '🌐' }
                    }).map(([feature, { name, icon }]) => {
                      const preference = getFeatureAIPreference(feature as any);
                      return (
                        <div key={feature} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{icon}</span>
                            <div>
                              <h4 className="font-medium">{name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {preference.provider === AIProvider.GROK ? 'Grok (X.AI)' : 'Google Gemini'} - {preference.model}
                              </p>
                            </div>
                          </div>
                          <AIModelSelector
                            selectedProvider={preference.provider}
                            selectedModel={preference.model}
                            onProviderChange={(provider) => updateFeatureAIPreference(feature as any, provider, preference.model)}
                            onModelChange={(model) => updateFeatureAIPreference(feature as any, preference.provider, model)}
                            className="flex-shrink-0"
                            showStatus={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="api-keys">
            <Card>
              <CardHeader>
                <CardTitle>API Key Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-800 dark:text-blue-300">
                    Your API keys are stored only in your browser's local storage. We do not store them on our servers.
                  </AlertDescription>
                </Alert>

                {/* Grok API Key */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="grok-key">Grok API Key</Label>
                      <p className="text-xs text-muted-foreground">
                        Get your API key from <a href="https://x.ai/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                          Grok AI <ExternalLink size={10} />
                        </a>
                      </p>
                    </div>
                    <Badge variant={apiKeyStatus.grok ? "default" : "destructive"}>
                      {apiKeyStatus.grok ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                      {apiKeyStatus.grok ? 'Connected' : 'Not Set'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="grok-key"
                      type="password"
                      placeholder="Enter your Grok API key (starts with xai-)"
                      value={grokApiKey}
                      onChange={(e) => {
                        setGrokApiKeyInput(e.target.value);
                        setKeyErrors(prev => ({ ...prev, grok: '' }));
                      }}
                      className={keyErrors.grok ? "border-red-500" : ""}
                    />
                    <Button onClick={validateAndSaveGrokKey} disabled={!grokApiKey.trim()}>
                      Save
                    </Button>
                  </div>
                  {keyErrors.grok && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{keyErrors.grok}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Google API Key */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="google-key">Google Gemini API Key</Label>
                      <p className="text-xs text-muted-foreground">
                        Get your API key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                          Google AI Studio <ExternalLink size={10} />
                        </a>
                      </p>
                    </div>
                    <Badge variant={apiKeyStatus.google ? "default" : "destructive"}>
                      {apiKeyStatus.google ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                      {apiKeyStatus.google ? 'Connected' : 'Not Set'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="google-key"
                      type="password"
                      placeholder="Enter your Google API key (starts with AIza)"
                      value={googleApiKey}
                      onChange={(e) => {
                        setGoogleApiKeyInput(e.target.value);
                        setKeyErrors(prev => ({ ...prev, google: '' }));
                      }}
                      className={keyErrors.google ? "border-red-500" : ""}
                    />
                    <Button onClick={validateAndSaveGoogleKey} disabled={!googleApiKey.trim()}>
                      Save
                    </Button>
                  </div>
                  {keyErrors.google && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{keyErrors.google}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account-settings">
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
    </MainLayout>
  );
};

export default ProfilePage;
