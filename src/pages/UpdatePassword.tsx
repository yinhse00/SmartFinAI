
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { Loader2 } from 'lucide-react';

const UpdatePasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExists, setSessionExists] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionExists(true);
      }
    });

    // Also check if there's an active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
        if(session) {
            // This case handles when the page is refreshed after the token is processed.
            setSessionExists(true);
        }
    })

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionExists) {
      toast({ title: "Invalid session", description: "No active password recovery session. Please request a new reset link.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      toast({ title: "Error updating password", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully", description: "You can now log in with your new password." });
      await supabase.auth.signOut();
      navigate('/auth');
    }
    setLoading(false);
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center py-12">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Update Password</CardTitle>
            <CardDescription>Enter your new password below. You must be logged in from a password reset link.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || !sessionExists}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default UpdatePasswordPage;
