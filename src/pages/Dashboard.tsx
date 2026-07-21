import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, TrendingUp, AlertTriangle, Map } from 'lucide-react';
import { type Member, MOCK_MEMBERS } from '../lib/mockData';

export const Dashboard = () => {
  const { profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [profile]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      if (import.meta.env.VITE_SUPABASE_URL === undefined) {
        // Mock data logic
        if (profile?.role === 'regional' && profile.region) {
          setMembers(MOCK_MEMBERS.filter(m => m.region === profile.region));
        } else {
          setMembers(MOCK_MEMBERS);
        }
        setLoading(false);
        return;
      }

      let query = supabase.from('members').select('*');
      if (profile?.role === 'regional' && profile?.region) {
        query = query.eq('region', profile.region);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data) setMembers(data as Member[]);
    } catch (error) {
      console.error('Error fetching members:', error);
      // Fallback
      if (profile?.role === 'regional' && profile.region) {
        setMembers(MOCK_MEMBERS.filter(m => m.region === profile.region));
      } else {
        setMembers(MOCK_MEMBERS);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des statistiques...</div>;
  }

  const totalMembers = members.length;
  const upToDate = members.filter(m => m.statut_cotisation === 'A jour').length;
  const needsFollowUp = members.filter(m => m.statut_cotisation === 'A relancer' || m.statut_cotisation === 'Non payé').length;

  // National specific stats
  const regionStats = profile?.role === 'admin' ? members.reduce((acc, m) => {
    if (!acc[m.region]) acc[m.region] = { total: 0, aJour: 0 };
    acc[m.region].total += 1;
    if (m.statut_cotisation === 'A jour') acc[m.region].aJour += 1;
    return acc;
  }, {} as Record<string, { total: number, aJour: number }>) : null;

  const sortedRegions = regionStats 
    ? Object.entries(regionStats).sort((a, b) => b[1].total - a[1].total)
    : [];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem' }}>Tableau de Bord</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Bienvenue, voici un résumé de l'activité {profile?.role === 'admin' ? 'Nationale (FCF France)' : `de la région ${profile?.region || ''}`}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Metric 1 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="metric-icon-bg-blue" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <Users size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Adhérents</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalMembers}</h3>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--status-ajour-bg)', color: 'var(--status-ajour-text)' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Cotisations à jour</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{upToDate}</h3>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--status-relancer-bg)', color: 'var(--status-relancer-text)' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>A relancer / Non payé</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{needsFollowUp}</h3>
            </div>
          </div>
        </div>
      </div>

      {profile?.role === 'admin' ? (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Map size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.25rem' }}>Dynamisme des Régions</h3>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Région</th>
                  <th>Adhérents</th>
                  <th>Cotisations à jour</th>
                  <th>Progression</th>
                </tr>
              </thead>
              <tbody>
                {sortedRegions.map(([region, stats]) => {
                  const percentage = stats.total > 0 ? Math.round((stats.aJour / stats.total) * 100) : 0;
                  return (
                    <tr key={region}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{region}</td>
                      <td>{stats.total}</td>
                      <td>
                        <span className="badge badge-ajour">{stats.aJour}</span>
                      </td>
                      <td style={{ width: '30%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-base)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: 'var(--success)' }}></div>
                          </div>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', width: '40px' }}>{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Mes Actions Récentes</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Les graphiques et statistiques détaillées de votre région seront ajoutés ici prochainement.</p>
        </div>
      )}
    </div>
  );
};
