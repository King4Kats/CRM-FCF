import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { mockSignIn } = useAuth();
  const isDemo = import.meta.env.VITE_SUPABASE_URL === undefined;
  const [demoRegion, setDemoRegion] = useState('BRETAGNE');
  const FCF_REGIONS = [
    'BOURGOGNE', 'BRETAGNE', 'CENTRE', 'CORSE', 'DRÔME ARDÈCHE', 
    'FESTIV\' 44', 'FRANCHE-COMTÉ', 'GRAND EST', 'HAUTS-DE-FRANCE', 
    'HÉRAULT', 'MAINE ET LOIRE', 'NOUVELLE AQUITAINE', 'OCCITANIE', 
    'OUTRE-MER', 'RHÔNE ISÈRE', 'UDOM', 'VENDÉE'
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'admin' | 'regional', region?: string) => {
    mockSignIn(role, region);
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', border: '1px solid var(--border-light)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHG8GhH50HdgC_i4bm3UehsbK_PHHMYXVu3u_2npzFBA&s=10" 
            alt="Logo FCF" 
            style={{ height: '80px', objectFit: 'contain', margin: '0 auto 1rem auto', display: 'block' }} 
          />
          <h2>Connexion CRM FCF</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            Accédez à votre espace de gestion
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Adresse Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="email"
                type="email"
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="votre@email.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label htmlFor="password">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="password"
                type="password"
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {isDemo && (
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-light)' }}>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Mode Démonstration - Choisissez un profil :
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => handleDemoLogin('admin')}
                style={{ justifyContent: 'center' }}
              >
                Connexion FCF France (Nationale)
              </button>
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <select 
                  className="input-field" 
                  value={demoRegion}
                  onChange={(e) => setDemoRegion(e.target.value)}
                  style={{ appearance: 'auto', flex: 1 }}
                >
                  {FCF_REGIONS.map(reg => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => handleDemoLogin('regional', demoRegion)}
                >
                  Connexion Région
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
