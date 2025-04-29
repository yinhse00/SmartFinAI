
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ImportErrorDisplayProps {
  error: string | null;
}

const ImportErrorDisplay = ({ error }: ImportErrorDisplayProps) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};

export default ImportErrorDisplay;
