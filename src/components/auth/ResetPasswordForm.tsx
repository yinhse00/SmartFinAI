
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface ResetPasswordFormProps {
  onReset: (e: React.FormEvent) => void;
  email: string;
  setEmail: (email: string) => void;
  loading: boolean;
  onBackToLogin: () => void;
}

const ResetPasswordForm = ({ onReset, email, setEmail, loading, onBackToLogin }: ResetPasswordFormProps) => {
  return (
    <form onSubmit={onReset} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send Reset Link
      </Button>
      <Button variant="link" className="p-0 w-full" type="button" onClick={onBackToLogin}>
        Back to login
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
