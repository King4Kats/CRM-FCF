/**
 * @file AuthContext.tsx
 * @description Contexte d'authentification et de gestion de l'état utilisateur global.
 * 
 * 💡 CONCEPT SENIOR POUR JUNIOR :
 * 1. **Gestion de l'état global (Context API)** : Permet d'injecter la session et les infos utilisateur
 *    partout dans l'application sans "prop drilling" (passer des props de composant parent en composant enfant).
 * 2. **Architecture hybride Mock vs Supabase** : Si la variable d'environnement `VITE_SUPABASE_URL` n'est pas définie,
 *    l'application bascule automatiquement en "Mode Mock" (données factices stockées en localStorage). Sinon,
 *    elle se connecte au véritable backend Supabase.
 * 3. **Custom Hook (`useAuth`)** : Simplifie la consommation du contexte et garantit la présence du Provider.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * Structure d'un profil utilisateur étendu (rôle, région, nom complet).
 */
type Profile = {
  id: string;
  role: 'admin' | 'regional';
  region?: string;
  email?: string | null;
  full_name?: string | null;
};

/**
 * Interface définissant tout ce qui est exposé aux composants enfants via le contexte.
 */
type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
  mockSignIn: (role: 'admin' | 'regional', region?: string) => void;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  loading: boolean;
};

// Création du contexte React. La valeur initiale est `undefined` afin de pouvoir
// détecter si `useAuth` est appelé en dehors du `AuthProvider`.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Composant Provider d'authentification.
 * Il enveloppe l'application (ou une partie de celle-ci) pour distribuer l'état global d'authentification.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // États React locaux gérant la session, l'utilisateur courant, son profil et l'état de chargement initial
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 💡 Détection du Mode Mock : Si la clé Supabase n'est pas configurée dans le fichier .env
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      // Récupération de la session factice enregistrée dans le navigateur
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

    // 💡 Mode Supabase actif : Récupération initiale de la session Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Écouteur en temps réel des changements d'état d'authentification (connexion, déconnexion, etc.)
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

    // Nettoyage de l'écouteur lors du démontage du composant (prévention des fuites de mémoire)
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Charge la fiche de profil de l'utilisateur depuis la table PostgreSQL 'profiles' de Supabase.
   */
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

  /**
   * Déconnecte l'utilisateur courant.
   * Gère à la fois le nettoyage local en Mode Mock et l'appel Supabase en Mode Réel.
   */
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

  /**
   * Simule une connexion utilisateur (Mode Mock uniquement).
   * Permet aux développeurs de tester les rôles 'admin' ou 'regional' sans backend.
   */
  const mockSignIn = (role: 'admin' | 'regional', region?: string) => {
    const mockUser = { id: 'mock-id' } as User;
    const mockProfile: Profile = { id: 'mock-id', role, region, email: 'user@fcf.fr', full_name: 'Utilisateur Démo' };
    setSession({ user: mockUser } as Session);
    setUser(mockUser);
    setProfile(mockProfile);
    localStorage.setItem('fcf_mock_auth', JSON.stringify(mockProfile));
  };

  /**
   * Met à jour les informations du profil utilisateur en local et dans la base de données.
   */
  const updateProfile = async (data: Partial<Profile>) => {
    if (profile) {
      const updatedProfile = { ...profile, ...data };
      setProfile(updatedProfile); // Mise à jour optimiste de l'IHM
      
      if (import.meta.env.VITE_SUPABASE_URL === undefined) {
        localStorage.setItem('fcf_mock_auth', JSON.stringify(updatedProfile));
      } else {
        await supabase.from('profiles').update({
          full_name: data.full_name
        }).eq('id', profile.id);
      }
    }
  };

  // Distribution des données d'état et des méthodes via la valeur du Provider
  return (
    <AuthContext.Provider value={{ session, user, profile, signOut, mockSignIn, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 💡 Hook personnalisé `useAuth` :
 * Permet aux composants enfants d'accéder aux données d'authentification de manière simple et sécurisée.
 * Exemple d'utilisation dans un composant : `const { user, signOut } = useAuth();`
 * 
 * @throws {Error} Si le hook est utilisé en dehors d'un `<AuthProvider>`
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Garde-fou de sécurité : S'assure que le composant est bien encapsulé par un AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
