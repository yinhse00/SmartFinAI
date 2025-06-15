
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange handles initial session and any subsequent changes.
    // The initial session is fired upon listener registration.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Supabase auth event: ${event}`);
      if (session?.expires_at) {
        const expirationDate = new Date(session.expires_at * 1000);
        console.log(`Session expires at: ${expirationDate.toLocaleString()}`);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // Set loading to false once we have a session or know there isn't one.
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
