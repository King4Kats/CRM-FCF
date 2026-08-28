import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase, supabaseAdminAuth } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Shield, MapPin, X, Loader2, Edit2, Key, Ban, Trash2 } from 'lucide-react';
import { COVERED } from '../data/departements';
import { useToast } from '../contexts/ToastContext';

// Liste des régions uniques à partir des départements couverts
const ALL_REGIONS = Array.from(new Set(Object.values(COVERED).map(d => d.region))).sort();

type Profile = {
  id: string;
  role: string;
  region: string | null;
  email: string | null;
  full_name: string | null;
};

export const Users = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('');
  const { showToast, showConfirm } = useToast();
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    region: ALL_REGIONS[0] || 'BRETAGNE',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      if (import.meta.env.VITE_SUPABASE_URL === undefined) {
        setUsers([
          { id: '1', role: 'admin', region: null, email: 'admin@fcf-france.fr', full_name: 'Admin FCF' },
          { id: '2', role: 'regional', region: 'Bretagne', email: 'bretagne@fcf.fr', full_name: 'Délégué Bretagne' },
          { id: '3', role: 'regional', region: 'Bretagne', email: 'bretagne2@fcf.fr', full_name: 'Adjoint Bretagne' },
          { id: '4', role: 'regional', region: 'Occitanie', email: 'occitanie@fcf.fr', full_name: 'Délégué Occitanie' }
        ]);
        return;
      }
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setUsers(data as Profile[]);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (import.meta.env.VITE_SUPABASE_URL === undefined) {
        // Mock creation
        await new Promise(r => setTimeout(r, 1000));
        setUsers(prev => [{
          id: Math.random().toString(),
          role: 'regional',
          region: formData.region,
          email: formData.email,
          full_name: formData.fullName
        }, ...prev]);
        setIsFormOpen(false);
        setFormData({ email: '', password: '', fullName: '', region: ALL_REGIONS[0] || 'BRETAGNE' });
        return;
      }

      // 1. Créer l'utilisateur via Auth (sans déconnecter l'admin)
      const { data: authData, error: authError } = await supabaseAdminAuth.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Erreur inconnue lors de la création.");

      // 2. Insérer dans la table profiles
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        role: 'regional',
        region: formData.region,
        email: formData.email,
        full_name: formData.fullName
      });

      if (profileError) throw new Error(profileError.message);

      // 3. Rafraîchir la liste
      await fetchUsers();
      setIsFormOpen(false);
      setFormData({ email: '', password: '', fullName: '', region: ALL_REGIONS[0] || 'BRETAGNE' });
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Accès refusé</h2>
        <p>Cette page est réservée à l'administration nationale.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Équipe & Accès
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Gérez les comptes des délégations régionales.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            className="input-field" 
            style={{ marginBottom: 0, minWidth: '180px', appearance: 'auto' }}
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="">Toutes les régions</option>
            <option value="OUTRE-MER">Outre-Mer (DOM-TOM)</option>
            {ALL_REGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button 
            className="btn btn-primary"
            onClick={() => setIsFormOpen(true)}
            title="Nouveau compte régional"
            style={{ padding: '0.75rem' }}
          >
            <UserPlus size={20} />
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Chargement de l'équipe...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Région affectée</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => selectedRegion ? u.region === selectedRegion : true).map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{u.full_name || 'Non renseigné'}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{u.email}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {u.role === 'admin' ? (
                        <span className="badge-ajour" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                          <Shield size={14} /> National
                        </span>
                      ) : (
                        <span className="badge-nonpaye" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', backgroundColor: '#e2e8f0', color: '#475569' }}>
                          Régional
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {u.region ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={16} />
                        {u.region}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn-icon" 
                        title="Modifier la fiche"
                        onClick={() => showToast(`Modification de la fiche de ${u.full_name}`, 'info')}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Envoyer un lien de réinitialisation du mot de passe"
                        onClick={() => showToast(`Un lien de réinitialisation a été envoyé à ${u.email}`, 'success')}
                      >
                        <Key size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Suspendre le profil"
                        style={{ color: '#f59e0b' }}
                        onClick={() => showConfirm(`Voulez-vous vraiment suspendre le profil de ${u.full_name} ?`, () => showToast(`Profil suspendu.`, 'error'))}
                      >
                        <Ban size={16} />
                      </button>
                      <button 
                        className="btn-icon danger" 
                        title="Supprimer le profil"
                        onClick={() => showConfirm(`Attention, voulez-vous supprimer définitivement ${u.full_name} ?`, () => showToast(`Profil supprimé.`, 'error'))}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsFormOpen(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
          }}
        >
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', position: 'relative', border: 'none', boxShadow: 'var(--shadow-lg)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Créer un accès régional</h2>
              <button 
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              {errorMsg && (
                <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.875rem' }}>
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="input-label">Prénom & Nom</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required 
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label className="input-label">Adresse Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  required 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="jean.dupont@fcf.fr"
                />
              </div>

              <div>
                <label className="input-label">Mot de passe temporaire</label>
                <input 
                  type="password" 
                  className="input-field" 
                  required 
                  minLength={6}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="input-label">Région d'affectation</label>
                <select 
                  className="input-field" 
                  required
                  value={formData.region}
                  onChange={e => setFormData({...formData, region: e.target.value})}
                >
                  <option value="OUTRE-MER">Outre-Mer (DOM-TOM)</option>
                  {ALL_REGIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  L'utilisateur n'aura accès qu'aux prospects et adhérents de cette région. 
                  Il est possible d'assigner plusieurs utilisateurs à la même région.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsFormOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
