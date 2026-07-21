import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Users, LayoutDashboard, LogOut, Settings, Target, ChevronDown, ChevronRight, UserCog, Folder } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

export const Layout = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isProspectsActive = location.pathname.startsWith('/prospects');
  const [isProspectsOpen, setIsProspectsOpen] = useState(isProspectsActive);

  useEffect(() => {
    if (isProspectsActive) setIsProspectsOpen(true);
  }, [isProspectsActive]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ padding: '0 1rem 2rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
            F
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {profile?.role === 'admin' ? 'FCF France' : `FCF ${profile?.region || ''}`}
          </h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <NavLink 
            to="/" 
            className={({isActive}) => `btn btn-secondary ${isActive ? 'active' : ''}`}
            style={({isActive}) => ({
              justifyContent: 'flex-start',
              padding: '0.75rem 1rem',
              border: 'none',
              backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)'
            })}
          >
            <LayoutDashboard size={18} />
            Tableau de Bord
          </NavLink>
          
          <NavLink 
            to="/members" 
            className={({isActive}) => `btn btn-secondary ${isActive ? 'active' : ''}`}
            style={({isActive}) => ({
              justifyContent: 'flex-start',
              padding: '0.75rem 1rem',
              border: 'none',
              backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)'
            })}
          >
            <Users size={18} />
            Adhérents
          </NavLink>

          <NavLink 
            to="/documents" 
            className={({isActive}) => `btn btn-secondary ${isActive ? 'active' : ''}`}
            style={({isActive}) => ({
              justifyContent: 'flex-start',
              padding: '0.75rem 1rem',
              border: 'none',
              backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)'
            })}
          >
            <Folder size={18} />
            Documents
          </NavLink>

          {profile?.role === 'admin' && (
            <NavLink 
              to="/users" 
              className={({isActive}) => `btn btn-secondary ${isActive ? 'active' : ''}`}
              style={({isActive}) => ({
                justifyContent: 'flex-start',
                padding: '0.75rem 1rem',
                border: 'none',
                backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)'
              })}
            >
              <UserCog size={18} />
              Équipe & Accès
            </NavLink>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setIsProspectsOpen(!isProspectsOpen)}
              className={`btn btn-secondary ${isProspectsActive ? 'active' : ''}`}
              style={{
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                border: 'none',
                backgroundColor: isProspectsActive ? 'var(--bg-surface-hover)' : 'transparent',
                color: isProspectsActive ? 'var(--primary)' : 'var(--text-secondary)',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={18} />
                Prospects
              </div>
              {isProspectsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {isProspectsOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '2.5rem', marginTop: '0.25rem', gap: '0.25rem' }}>
                <NavLink 
                  to="/prospects/suivi" 
                  className={({isActive}) => `btn btn-secondary ${isActive ? 'active' : ''}`}
                  style={({isActive}) => ({
                    justifyContent: 'flex-start',
                    padding: '0.5rem',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '0.875rem'
                  })}
                >
                  Suivi prospect
                </NavLink>
                <NavLink 
                  to="/prospects/recherche" 
                  className={({isActive}) => `btn btn-secondary ${isActive ? 'active' : ''}`}
                  style={({isActive}) => ({
                    justifyContent: 'flex-start',
                    padding: '0.5rem',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '0.875rem'
                  })}
                >
                  Recherche prospect
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Connecté en tant que:<br/>
            <strong style={{ color: 'var(--text-primary)' }}>{profile?.role === 'admin' ? 'Administrateur National' : `Adhérent ${profile?.region || ''}`}</strong>
          </div>
          <button 
            onClick={handleSignOut}
            className="btn btn-secondary" 
            style={{ justifyContent: 'flex-start', border: 'none', color: 'var(--danger)' }}
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div></div> {/* For spacing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NavLink to="/settings" className="btn btn-secondary" style={{ padding: '0.5rem', border: 'none' }} title="Paramètres du compte">
              <Settings size={20} color="var(--text-secondary)" />
            </NavLink>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-light)' }}></div>
          </div>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
