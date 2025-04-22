
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MessageAvatarProps {
  sender: 'user' | 'bot';
}

const MessageAvatar: React.FC<MessageAvatarProps> = ({ sender }) => {
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={sender === 'user' ? '/user-avatar.png' : '/bot-avatar.png'} />
      <AvatarFallback>{sender === 'user' ? 'U' : 'B'}</AvatarFallback>
    </Avatar>
  );
};

export default MessageAvatar;
