import { createClient } from '@supabase/supabase-js';

// These should be set in .env file
// VITE_SUPABASE_URL=your_supabase_url
// VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client d'authentification secondaire (sans persistance de session)
// Utilisé EXCLUSIVEMENT par l'admin pour créer de nouveaux comptes 
// sans être déconnecté de sa propre session.
export const supabaseAdminAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
