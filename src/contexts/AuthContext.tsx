import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Profile = {
  id: string;
  role: 'admin' | 'regional';
  region?: string;
  email?: string | null;
  full_name?: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
  mockSignIn: (role: 'admin' | 'regional', region?: string) => void;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      const stored = localStorage.getItem('fcf_mock_auth');
      if (stored) {
        try {
          const mockProfile = JSON.parse(stored);
          const mockUser = { id: mockProfile.id } as User;
          setSession({ user: mockUser } as Session);
          setUser(mockUser);
          setProfile(mockProfile);
        } catch(e) {}
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setSession(null);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('fcf_mock_auth');
      return;
    }
    await supabase.auth.signOut();
  };

  const mockSignIn = (role: 'admin' | 'regional', region?: string) => {
    const mockUser = { id: 'mock-id' } as User;
    const mockProfile: Profile = { id: 'mock-id', role, region, email: 'user@fcf.fr', full_name: 'Utilisateur Démo' };
    setSession({ user: mockUser } as Session);
    setUser(mockUser);
    setProfile(mockProfile);
    localStorage.setItem('fcf_mock_auth', JSON.stringify(mockProfile));
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (profile) {
      const updatedProfile = { ...profile, ...data };
      setProfile(updatedProfile);
      
      if (import.meta.env.VITE_SUPABASE_URL === undefined) {
        localStorage.setItem('fcf_mock_auth', JSON.stringify(updatedProfile));
      } else {
        await supabase.from('profiles').update({
          full_name: data.full_name
        }).eq('id', profile.id);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, signOut, mockSignIn, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
