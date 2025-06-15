
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface LoginFormProps {
  onLogin: (e: React.FormEvent) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  loading: boolean;
  onShowReset: () => void;
}

const LoginForm = ({ onLogin, email, setEmail, password, setPassword, loading, onShowReset }: LoginFormProps) => {
  return (
    <form onSubmit={onLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="login-password">Password</Label>
          <button
            type="button"
            onClick={onShowReset}
            className="ml-auto inline-block text-sm underline"
          >
            Forgot your password?
          </button>
        </div>
        <Input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Login
      </Button>
    </form>
  );
};

export default LoginForm;
