
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import OAuthButtons from '@/components/auth/OAuthButtons';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showResetForm, setShowResetForm] = useState(false);

  // Get the intended destination or default to home
  const from = location.state?.from?.pathname || '/';

  const handleTabChange = (value: string) => {
    setEmail('');
    setPassword('');
    setActiveTab(value);
    setShowResetForm(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Error logging in", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logged in successfully" });
      navigate(from, { replace: true });
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast({ title: "Error signing up", description: error.message, variant: "destructive" });
    } else if (data.user && !data.session) {
        toast({ title: "Signup successful!", description: "Please check your email to verify your account." });
    } else {
      toast({ title: "Signup successful!", description: "Please check your email to verify your account." });
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password reset link sent", description: "Please check your email to continue." });
      setShowResetForm(false);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${from}`,
      },
    });
    if (error) {
      toast({ title: "Error with Google login", description: error.message, variant: "destructive" });
      setLoading(false);
    }
    // On success, Supabase handles the redirect.
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center py-12">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{showResetForm ? "Reset Password" : "Login"}</CardTitle>
                <CardDescription>
                  {showResetForm
                    ? "Enter your email to receive a password reset link."
                    : "Enter your credentials to access your account."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showResetForm ? (
                  <ResetPasswordForm
                    onReset={handlePasswordReset}
                    email={email}
                    setEmail={setEmail}
                    loading={loading}
                    onBackToLogin={() => setShowResetForm(false)}
                  />
                ) : (
                  <div className="grid gap-4">
                    <OAuthButtons onGoogleLogin={handleGoogleLogin} loading={loading} />
                    <LoginForm
                      onLogin={handleLogin}
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      loading={loading}
                      onShowReset={() => {
                        setShowResetForm(true);
                        setPassword('');
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>Create a new account to get started.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <OAuthButtons onGoogleLogin={handleGoogleLogin} loading={loading} />
                <SignupForm
                  onSignup={handleSignup}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AuthPage;
