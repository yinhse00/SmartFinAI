
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RegulationProvision } from '@/services/database/types';

interface ProvisionDialogProps {
  provision: RegulationProvision | null;
  onClose: () => void;
}

const ProvisionDialog = ({ provision, onClose }: ProvisionDialogProps) => {
  const isOpen = !!provision;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {provision?.rule_number} - {provision?.title}
          </DialogTitle>
          <DialogDescription>
            Regulatory Provision
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-2">
            <div className="prose dark:prose-invert max-w-none">
              {provision?.content.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ProvisionDialog;
