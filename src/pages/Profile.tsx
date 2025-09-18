import React, { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  hasGrokApiKey,
  hasGoogleApiKey,
  setGrokApiKey,
  setGoogleApiKey
} from '@/services/apiKeyService';

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [grokKey, setGrokKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');

  const saveGrokKey = async () => {
    if (!grokKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Grok API key",
        variant: "destructive"
      });
      return;
    }

    try {
      setGrokApiKey(grokKey);
      setGrokKey('');
      toast({
        title: "Success",
        description: "Grok API key saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save Grok API key",
        variant: "destructive"
      });
    }
  };

  const saveGoogleKey = async () => {
    if (!googleKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Google API key",
        variant: "destructive"
      });
      return;
    }

    try {
      setGoogleApiKey(googleKey);
      setGoogleKey('');
      toast({
        title: "Success",
        description: "Google API key saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save Google API key",
        variant: "destructive"
      });
    }
  };

  return (
    <SidebarLayout>
      <div className="container mx-auto py-10 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and profile information</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id">User ID</Label>
                    <Input id="id" value={user?.id || ''} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="grok-key">Grok API Key</Label>
                    <Input
                      id="grok-key"
                      type="password"
                      value={grokKey}
                      onChange={(e) => setGrokKey(e.target.value)}
                      placeholder="Enter your Grok API key"
                    />
                    <Button onClick={saveGrokKey}>Save Grok Key</Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google-key">Google API Key</Label>
                    <Input
                      id="google-key"
                      type="password"
                      value={googleKey}
                      onChange={(e) => setGoogleKey(e.target.value)}
                      placeholder="Enter your Google API key"
                    />
                    <Button onClick={saveGoogleKey}>Save Google Key</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
};

export default ProfilePage;