
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface TextAlignmentControlsProps {
  onAlignText: (alignment: 'left' | 'center' | 'right') => void;
}

const TextAlignmentControls: React.FC<TextAlignmentControlsProps> = ({ onAlignText }) => {
  return (
    <div className="flex items-center gap-1">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onAlignText('left')}
        title="Align text left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onAlignText('center')}
        title="Align text center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onAlignText('right')}
        title="Align text right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default TextAlignmentControls;
