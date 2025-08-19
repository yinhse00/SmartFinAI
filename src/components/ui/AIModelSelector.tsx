import React, { useState, useEffect } from 'react';
import { AIProvider } from '@/types/aiProvider';
import { AI_PROVIDERS, getModelsForProvider, getDefaultModel } from '@/config/aiModels';
import { hasGoogleApiKey } from '@/services/apiKey/keyStorage';
import { hasGrokApiKey } from '@/services/apiKeyService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIModelSelectorProps {
  selectedProvider: AIProvider;
  selectedModel: string;
  onProviderChange: (provider: AIProvider) => void;
  onModelChange: (model: string) => void;
  onOpenAPIKeyDialog?: () => void;
  className?: string;
  showStatus?: boolean;
}

const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  onOpenAPIKeyDialog,
  className = '',
  showStatus = true
}) => {
  const [apiKeyStatus, setApiKeyStatus] = useState<Record<AIProvider, boolean>>({
    [AIProvider.GROK]: false,
    [AIProvider.GOOGLE]: false
  });

  // Check API key status
  useEffect(() => {
    const checkKeys = () => {
      setApiKeyStatus({
        [AIProvider.GROK]: hasGrokApiKey(),
        [AIProvider.GOOGLE]: hasGoogleApiKey()
      });
    };
    
    checkKeys();
    
    // Recheck when component becomes visible
    const interval = setInterval(checkKeys, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleProviderChange = (value: string) => {
    const provider = value as AIProvider;
    onProviderChange(provider);
    
    // Set default model for the provider
    const defaultModel = getDefaultModel(provider);
    if (defaultModel) {
      onModelChange(defaultModel.modelId);
    }
  };

  const getProviderStatus = (provider: AIProvider) => {
    const hasKey = apiKeyStatus[provider];
    return hasKey ? (
      <CheckCircle className="h-4 w-4 text-emerald-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-amber-500" />
    );
  };

  const availableModels = getModelsForProvider(selectedProvider);
  const selectedProviderConfig = AI_PROVIDERS.find(p => p.provider === selectedProvider);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Provider Selection */}
      <div className="flex items-center gap-2">
        <Select value={selectedProvider} onValueChange={handleProviderChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select AI Provider" />
          </SelectTrigger>
          <SelectContent>
            {AI_PROVIDERS.map((provider) => (
              <SelectItem key={provider.provider} value={provider.provider}>
                <div className="flex items-center gap-2">
                  <span>{provider.displayName}</span>
                  {showStatus && getProviderStatus(provider.provider)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model Selection */}
      <div className="flex items-center gap-2">
        <Select 
          value={selectedModel} 
          onValueChange={onModelChange}
          disabled={!apiKeyStatus[selectedProvider]}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => (
              <SelectItem key={model.modelId} value={model.modelId}>
                <div className="flex flex-col">
                  <span>{model.displayName}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {model.maxTokens > 50000 ? '50K+' : `${model.maxTokens}`} tokens
                    </Badge>
                    {model.capabilities.includes('vision') && (
                      <Badge variant="outline" className="text-xs">Vision</Badge>
                    )}
                    {model.capabilities.includes('reasoning') && (
                      <Badge variant="outline" className="text-xs">Reasoning</Badge>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* API Key Status & Settings */}
      {showStatus && (
        <div className="flex items-center gap-2">
          {!apiKeyStatus[selectedProvider] && (
            <Badge variant="destructive" className="text-xs">
              No API Key
            </Badge>
          )}
          {apiKeyStatus[selectedProvider] && (
            <Badge variant="default" className="text-xs bg-emerald-100 text-emerald-800">
              ✓ Ready
            </Badge>
          )}
          
          {onOpenAPIKeyDialog && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenAPIKeyDialog}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default AIModelSelector;