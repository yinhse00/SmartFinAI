import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AIModelSelector from '@/components/ui/AIModelSelector';
import { AIProvider } from '@/types/aiProvider';
import { getAIPreferences, saveAIPreferences } from '@/services/ai/aiPreferences';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Zap, Settings2 } from 'lucide-react';

const AIPreferencesTab = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(getAIPreferences());
  const [applyToAll, setApplyToAll] = useState(true);

  const handleProviderChange = (provider: AIProvider) => {
    setPreferences(prev => ({ ...prev, defaultProvider: provider }));
  };

  const handleModelChange = (model: string) => {
    setPreferences(prev => ({ ...prev, defaultModel: model }));
  };

  const handleSave = () => {
    const updatedPrefs = { ...preferences };
    
    if (applyToAll) {
      updatedPrefs.perFeaturePreferences = {
        chat: { provider: preferences.defaultProvider, model: preferences.defaultModel },
        ipo: { provider: preferences.defaultProvider, model: preferences.defaultModel },
        translation: { provider: preferences.defaultProvider, model: preferences.defaultModel }
      };
    }
    
    saveAIPreferences(updatedPrefs);
    toast({
      title: "Success",
      description: applyToAll ? "AI preferences applied to all features" : "Default AI preferences saved",
    });
  };

  const handleReset = () => {
    const defaultPrefs = {
      defaultProvider: AIProvider.GROK,
      defaultModel: 'grok-4-0709',
      perFeaturePreferences: {
        chat: { provider: AIProvider.GROK, model: 'grok-4-0709' },
        ipo: { provider: AIProvider.GROK, model: 'grok-4-0709' },
        translation: { provider: AIProvider.GROK, model: 'grok-3-mini-beta' }
      }
    };
    setPreferences(defaultPrefs);
    saveAIPreferences(defaultPrefs);
    toast({
      title: "Reset Complete",
      description: "AI preferences reset to defaults",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Global AI Model Selection
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose which AI provider and model to use across the platform
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <AIModelSelector
              selectedProvider={preferences.defaultProvider}
              selectedModel={preferences.defaultModel}
              onProviderChange={handleProviderChange}
              onModelChange={handleModelChange}
              showStatus={true}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="apply-all" className="text-base">Apply to All Features</Label>
              <p className="text-sm text-muted-foreground">
                Use this AI model for chat, IPO analysis, and translation
              </p>
            </div>
            <Switch
              id="apply-all"
              checked={applyToAll}
              onCheckedChange={setApplyToAll}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              Save Preferences
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Current Feature Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(preferences.perFeaturePreferences || {}).map(([feature, pref]) => (
              <div key={feature} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium capitalize">{feature}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{pref.provider}</Badge>
                  <Badge variant="outline">{pref.model}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIPreferencesTab;
