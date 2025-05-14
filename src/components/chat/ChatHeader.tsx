
import React, { useState } from 'react';
import { CardHeader } from '@/components/ui/card';
import { BookOpen, Languages, Settings, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  
  const handleLanguageChange = (newLanguage: 'en' | 'zh') => {
    setLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };
  
  return (
    <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5" />
        <h2 className="text-lg font-medium">Smart Finance Assistant</h2>
        {isOfflineMode && (
          <div className="flex items-center ml-2 text-yellow-500">
            <WifiOff className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">Offline Mode</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Languages className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className={language === 'en' ? 'bg-muted' : ''}
              onClick={() => handleLanguageChange('en')}
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={language === 'zh' ? 'bg-muted' : ''}
              onClick={() => handleLanguageChange('zh')}
            >
              中文 (Chinese)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {!isGrokApiKeySet && (
          <Button variant="outline" size="sm" onClick={onOpenApiKeyDialog}>
            <Settings className="h-4 w-4 mr-1" />
            Set API Key
          </Button>
        )}
      </div>
    </CardHeader>
  );
};

export default ChatHeader;
