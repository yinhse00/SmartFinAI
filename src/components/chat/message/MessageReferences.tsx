
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface MessageReferencesProps {
  references?: string[];
  isTypingComplete: boolean;
}

const MessageReferences: React.FC<MessageReferencesProps> = ({ references, isTypingComplete }) => {
  if (!references?.length || !isTypingComplete) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {references.map((ref, i) => (
        <Badge 
          key={i} 
          variant="outline" 
          className="text-xs bg-finance-light-blue/20 dark:bg-finance-medium-blue/20"
        >
          {ref}
        </Badge>
      ))}
    </div>
  );
};

export default MessageReferences;
