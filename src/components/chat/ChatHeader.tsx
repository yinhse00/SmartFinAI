
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
    <CardHeader className="pb-0 pt-3 px-4 flex justify-between items-center border-b">
      <div className="flex items-center">
        <BookOpen className="w-5 h-5 text-finance-medium-blue dark:text-finance-light-blue mr-2" />
        <h3 className="text-lg font-semibold">SmartFinAI Chat</h3>
      </div>
      
      <div className="flex gap-2">
        {onLanguageChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Languages size={18} className="mr-1" />
                {language === 'en' ? 'EN' : '中文'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange('zh')}>
                中文
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenApiKeyDialog}
          className="h-8 px-2"
        >
          <Settings size={18} className="mr-1" />
          API Key
        </Button>
        
        {isOfflineMode && (
          <span className="flex items-center text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">
            <WifiOff size={12} className="mr-1" />
            Offline
          </span>
        )}
      </div>
    </CardHeader>
  );
};

export default ChatHeader;
