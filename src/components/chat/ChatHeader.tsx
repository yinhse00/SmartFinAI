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
    <CardHeader className="border-b px-6 py-4 flex flex-row items-center justify-between">
      <div className="flex items-center space-x-2">
        <BookOpen className="h-5 w-5" />
        <h2 className="text-xl font-semibold">SmartFinAI Chat</h2>
        {isOfflineMode && <WifiOff className="h-4 w-4 text-amber-500" />}
      </div>
      
    </CardHeader>
  );
};
export default ChatHeader;