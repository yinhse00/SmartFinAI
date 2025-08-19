import React, { useState } from 'react';
import { CardHeader } from '@/components/ui/card';
import { BookOpen, Languages, Settings, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AIModelSelector from '@/components/ui/AIModelSelector';
import { AIProvider } from '@/types/aiProvider';
import { getFeatureAIPreference, updateFeatureAIPreference } from '@/services/ai/aiPreferences';
interface ChatHeaderProps {
  isGrokApiKeySet: boolean;
  onOpenApiKeyDialog: () => void;
  isOfflineMode?: boolean;
  currentLanguage?: 'en' | 'zh';
  onLanguageChange?: (language: 'en' | 'zh') => void;
}
const ChatHeader: React.FC<ChatHeaderProps> = ({
  isGrokApiKeySet,
  onOpenApiKeyDialog,
  isOfflineMode = false,
  currentLanguage = 'en',
  onLanguageChange
}) => {
  const [language, setLanguage] = useState<'en' | 'zh'>(currentLanguage);
  
  // AI Model Selection State
  const [aiPreference, setAiPreference] = useState(() => getFeatureAIPreference('chat'));
  
  const handleLanguageChange = (newLanguage: 'en' | 'zh') => {
    setLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  const handleProviderChange = (provider: AIProvider) => {
    const newPreference = { ...aiPreference, provider };
    setAiPreference(newPreference);
    updateFeatureAIPreference('chat', provider, newPreference.model);
  };

  const handleModelChange = (model: string) => {
    const newPreference = { ...aiPreference, model };
    setAiPreference(newPreference);
    updateFeatureAIPreference('chat', newPreference.provider, model);
  };
  
  return (
    <CardHeader className="border-b px-6 py-4 flex flex-row items-center justify-between">
      <div className="flex items-center space-x-2">
        <BookOpen className="h-5 w-5" />
        <h2 className="text-xl font-semibold">SmartFinAI Chat</h2>
        {isOfflineMode && <WifiOff className="h-4 w-4 text-amber-500" />}
      </div>
      
      <div className="flex items-center gap-4">
        <AIModelSelector
          selectedProvider={aiPreference.provider}
          selectedModel={aiPreference.model}
          onProviderChange={handleProviderChange}
          onModelChange={handleModelChange}
          onOpenAPIKeyDialog={onOpenApiKeyDialog}
          className="hidden md:flex"
        />
      </div>
    </CardHeader>
  );
};
export default ChatHeader;