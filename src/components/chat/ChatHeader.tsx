import React from 'react';
import { CardHeader } from '@/components/ui/card';
import { BookOpen, Settings, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface ChatHeaderProps {
  isGrokApiKeySet: boolean;
  onOpenApiKeyDialog: () => void;
  isOfflineMode?: boolean; // New prop for offline mode
}
const ChatHeader: React.FC<ChatHeaderProps> = ({
  isGrokApiKeySet,
  onOpenApiKeyDialog,
  isOfflineMode = false
}) => {
  return;
};
export default ChatHeader;