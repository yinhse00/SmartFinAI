
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
    <CardHeader className="px-4 py-3 border-b flex justify-between items-center">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="font-medium">Chat</span>
        {isOfflineMode && (
          <span className="inline-flex items-center ml-2">
            <WifiOff className="h-4 w-4 text-amber-500 mr-1" />
            <span className="text-xs text-amber-500">Offline</span>
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Languages className="h-4 w-4" />
              <span className="sr-only">Language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => handleLanguageChange('en')}
              className={language === 'en' ? 'bg-accent text-accent-foreground' : ''}
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleLanguageChange('zh')}
              className={language === 'zh' ? 'bg-accent text-accent-foreground' : ''}
            >
              中文
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={onOpenApiKeyDialog}
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </div>
    </CardHeader>
  );
};

export default ChatHeader;
