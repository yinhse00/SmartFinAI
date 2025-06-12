
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Maximize } from 'lucide-react';

interface EnlargedContentDialogProps {
  title: string;
  children: React.ReactNode;
  enlargedContent?: React.ReactNode;
  size?: 'default' | 'large' | 'full';
}

export const EnlargedContentDialog: React.FC<EnlargedContentDialogProps> = ({
  title,
  children,
  enlargedContent,
  size = 'large'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'full':
        return 'max-w-screen max-h-screen h-[95vh] w-[95vw]';
      case 'large':
        return 'max-w-4xl w-[90vw] max-h-[85vh]';
      default:
        return 'max-w-2xl max-h-[70vh]';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100"
          title={`Enlarge ${title}`}
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className={`${getSizeClasses()} flex flex-col`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {enlargedContent || children}
        </div>
      </DialogContent>
    </Dialog>
  );
};
