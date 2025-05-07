
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
    <CardHeader className="border-b flex flex-row items-center justify-between p-4">
      <div className="flex items-center space-x-2">
        <BookOpen className="h-5 w-5" />
        <h2 className="font-semibold text-lg">SmartFinAI Chat</h2>
        {isOfflineMode && (
          <div className="flex items-center ml-2 text-yellow-600 dark:text-yellow-400">
            <WifiOff className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">Offline</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Languages className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => handleLanguageChange('en')}
              className={language === 'en' ? 'bg-accent' : ''}
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleLanguageChange('zh')}
              className={language === 'zh' ? 'bg-accent' : ''}
            >
              中文
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {!isGrokApiKeySet && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onOpenApiKeyDialog}
            className="h-8 w-8"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </CardHeader>
  );
};

export default ChatHeader;
