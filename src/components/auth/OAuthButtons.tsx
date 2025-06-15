
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface OAuthButtonsProps {
  onGoogleLogin: () => void;
  loading: boolean;
}

const OAuthButtons = ({ onGoogleLogin, loading }: OAuthButtonsProps) => {
  return (
    <>
      <Button variant="outline" type="button" className="w-full" onClick={onGoogleLogin} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Continue with Google
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>
    </>
  );
};

export default OAuthButtons;
