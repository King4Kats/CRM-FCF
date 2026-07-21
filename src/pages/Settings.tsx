import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';

export const Settings = () => {
  const { profile, updateProfile, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || session?.user?.email || '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateProfile({ full_name: formData.fullName });
      showSuccess("Profil mis à jour avec succès.");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (import.meta.env.VITE_SUPABASE_URL === undefined) {
        await new Promise(r => setTimeout(r, 500));
        await updateProfile({ email: formData.email });
        showSuccess("Simulé : Email mis à jour avec succès.");
      } else {
        const { error } = await supabase.auth.updateUser({ email: formData.email });
        if (error) throw error;
        await updateProfile({ email: formData.email });
        showSuccess("Veuillez vérifier vos e-mails pour confirmer le changement.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du changement d'e-mail.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (import.meta.env.VITE_SUPABASE_URL === undefined) {
        await new Promise(r => setTimeout(r, 500));
        setFormData({ ...formData, password: '', confirmPassword: '' });
        showSuccess("Simulé : Mot de passe mis à jour avec succès.");
      } else {
        const { error } = await supabase.auth.updateUser({ password: formData.password });
        if (error) throw error;
        setFormData({ ...formData, password: '', confirmPassword: '' });
        showSuccess("Mot de passe mis à jour avec succès.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du changement de mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Paramètres du compte
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Gérez vos informations personnelles et vos paramètres de sécurité.
        </p>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} />
          {success}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Informations personnelles */}
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', color: 'var(--primary)' }}>
              <User size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Informations personnelles</h2>
          </div>
          
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="input-label">Prénom & Nom</label>
              <input 
                type="text" 
                name="fullName"
                className="input-field" 
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Votre nom complet"
              />
            </div>
            <div>
              <label className="input-label">Région assignée</label>
              <input 
                type="text" 
                className="input-field" 
                value={profile?.role === 'admin' ? 'National (Toutes régions)' : profile?.region || 'Aucune'}
                disabled
                style={{ backgroundColor: 'var(--bg-body)', cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                La région est gérée par l'administration nationale.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Enregistrer les infos
              </button>
            </div>
          </form>
        </section>

        {/* Adresse E-mail */}
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', color: 'var(--primary)' }}>
              <Mail size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Adresse E-mail</h2>
          </div>
          
          <form onSubmit={handleUpdateEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="input-label">Nouvelle adresse e-mail</label>
              <input 
                type="email" 
                name="email"
                className="input-field" 
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="nouvelle.adresse@fcf.fr"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-secondary" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Mettre à jour l\'e-mail'}
              </button>
            </div>
          </form>
        </section>

        {/* Sécurité */}
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', color: 'var(--primary)' }}>
              <Lock size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Sécurité</h2>
          </div>
          
          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="input-label">Nouveau mot de passe</label>
              <input 
                type="password" 
                name="password"
                className="input-field" 
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                required
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="input-label">Confirmer le nouveau mot de passe</label>
              <input 
                type="password" 
                name="confirmPassword"
                className="input-field" 
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={6}
                required
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-secondary" disabled={loading} style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Changer le mot de passe'}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
};
