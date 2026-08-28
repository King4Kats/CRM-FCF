import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, MapPin, Phone, Edit, Trash2, Clock, Eye, Download, Mail } from 'lucide-react';
import { MemberForm, type MemberFormData } from '../components/MemberForm';
import { MemberTimeline, type FollowUp } from '../components/MemberTimeline';
import { MemberProfileModal } from '../components/MemberProfileModal';
import { type Member, MOCK_MEMBERS } from '../lib/mockData';
import { EventFormModal, type EventFormData } from '../components/EventFormModal';
import { useEvents } from '../contexts/EventsContext';
import { Calendar as CalendarIcon } from 'lucide-react';

export const Members = () => {
  const { profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { addEvent } = useEvents();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventPrefill, setEventPrefill] = useState<Partial<EventFormData> | null>(null);

  useEffect(() => {
    setSelectedIds([]); // Reset selection when filters change
  }, [searchTerm, selectedRegion]);

  useEffect(() => {
    fetchMembers();
  }, [profile]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      if (import.meta.env.VITE_SUPABASE_URL === undefined) {
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
      // Fallback to mock on error for visual demonstration
      setMembers(MOCK_MEMBERS);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUps = async (memberId: string) => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      // Mock follow-ups
      setFollowUps([
        { id: '1', member_id: memberId, date: new Date(Date.now() - 86400000).toISOString(), type: 'Note', notes: 'Premier contact établi', visibility: 'public' },
        { id: '2', member_id: memberId, date: new Date().toISOString(), type: 'Appel', notes: 'Appel téléphonique passé', visibility: 'public' }
      ]);
      return;
    }

    try {
      const { data, error } = await supabase.from('follow_ups').select('*').eq('member_id', memberId);
      if (error) throw error;
      if (data) {
        // En mode démo, filtrer les notes privées si on est National
        let filteredData = data as FollowUp[];
        if (profile?.role === 'admin') {
          // Hypothèse simplifiée : l'admin national ne voit pas les notes privées (puisqu'elles sont propres aux régions)
          filteredData = filteredData.filter(fu => fu.visibility !== 'private');
        }
        setFollowUps(filteredData);
      }
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
    }
  };

  const handleOpenTimeline = (member: Member) => {
    setActiveMember(member);
    setIsTimelineOpen(true);
    fetchFollowUps(member.id);
  };

  const handleAddFollowUp = async (memberId: string, data: Partial<FollowUp>) => {
    // Default to public if not provided
    const visibility = data.visibility || 'public';
    
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      const newFu = { ...data, visibility, id: Math.random().toString(), member_id: memberId } as FollowUp;
      setFollowUps(prev => [...prev, newFu]);
      
      // If it's a payment, update member status locally
      if (data.type === 'Paiement') {
        setMembers(members.map(m => m.id === memberId ? { ...m, statut_cotisation: 'A jour' } : m));
      }
      return;
    }

    try {
      const { error } = await supabase.from('follow_ups').insert([{ ...data, visibility, member_id: memberId }]);
      if (error) throw error;
      fetchFollowUps(memberId);

      if (data.type === 'Paiement') {
        await supabase.from('members').update({ statut_cotisation: 'A jour' }).eq('id', memberId);
        fetchMembers();
      }
    } catch (error) {
      console.error('Error adding follow-up:', error);
    }
  };

  const exportToCSV = () => {
    // 1. Create CSV header
    const headers = [
      'Nom Association', 'Statut Cotisation', 'Région', 'Ville', 'Adresse',
      'Téléphone Asso', 'Email Asso',
      'Prénom Contact', 'Nom Contact', 'Email Contact', 'Téléphone Contact', 
      'Président', 'Représentant Légal', 'Nb Événements/an', 'SIRET',
      'Site Web', 'Page Facebook'
    ];
    
    // 2. Map data to rows
    const rows = filteredMembers.map(m => [
      `"${m.nom_association}"`,
      `"${m.statut_cotisation}"`,
      `"${m.region}"`,
      `"${m.ville}"`,
      `"${m.adresse}"`,
      `"${m.telephone_asso}"`,
      `"${m.email_asso}"`,
      `"${m.prenom}"`,
      `"${m.nom}"`,
      `"${m.email_contact}"`,
      `"${m.telephone_contact}"`,
      `"${m.president}"`,
      `"${m.representant_legal}"`,
      `"${m.nb_evenements_an}"`,
      `"${m.siret}"`,
      `"${m.site_web}"`,
      `"${m.facebook}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `adherents_fcf_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredMembers.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkEmail = () => {
    const emails = members
      .filter(m => selectedIds.includes(m.id))
      .map(m => m.email_contact || m.email_asso)
      .filter(Boolean); // Remove empty emails
    
    if (emails.length > 0) {
      window.location.href = `mailto:?bcc=${emails.join(',')}`;
    } else {
      alert("Aucune adresse e-mail trouvée pour la sélection.");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'A jour': return 'badge-ajour';
      case 'A relancer': return 'badge-relancer';
      case 'Non payé': return 'badge-nonpaye';
      default: return '';
    }
  };

  const handleUpdateFollowUp = (id: string, newNotes: string) => {
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, notes: newNotes } : f));
  };

  const handleDeleteFollowUp = (id: string) => {
    setFollowUps(prev => prev.filter(f => f.id !== id));
  };

  const filteredMembers = useMemo(() => members.filter(m => {
    const matchesSearch = m.nom_association.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.ville.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion ? m.region === selectedRegion : true;
    return matchesSearch && matchesRegion;
  }), [members, searchTerm, selectedRegion]);

  // Extract unique regions for the filter dropdown
  const uniqueRegions = Array.from(new Set(members.map(m => m.region)));

  const handleOpenNew = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleOpenView = (member: Member) => {
    setViewingMember(member);
    setIsViewOpen(true);
  };

  const handleFormSubmit = async (data: MemberFormData) => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      // Mock save
      if (editingMember) {
        setMembers(members.map(m => m.id === editingMember.id ? { ...m, ...data } : m));
      } else {
        const newMember = { ...data, id: Math.random().toString(36).substr(2, 9) };
        setMembers([...members, newMember]);
      }
      return;
    }

    try {
      if (editingMember) {
        const { error } = await supabase.from('members').update(data).eq('id', editingMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('members').insert([data]);
        if (error) throw error;
      }
      fetchMembers(); // Refresh
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Une erreur est survenue lors de la sauvegarde.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet adhérent ?')) return;

    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setMembers(members.filter(m => m.id !== id));
      return;
    }

    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
      fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Une erreur est survenue.');
    }
  };

  const handleOpenEventModal = (member: Member) => {
    setEventPrefill({
      title: `Relance : ${member.nom_association}`,
      description: `Contact: ${member.prenom} ${member.nom}\nTél: ${member.telephone_contact || member.telephone_asso}`,
      region: member.region
    });
    setIsEventModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <EventFormModal
        isOpen={isEventModalOpen}
        onClose={() => { setIsEventModalOpen(false); setEventPrefill(null); }}
        onSubmit={async (data) => {
          await addEvent(data);
        }}
        prefillData={eventPrefill || undefined}
      />
      <MemberForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleFormSubmit}
        initialData={editingMember}
      />
      <MemberTimeline
        isOpen={isTimelineOpen}
        onClose={() => {
          setIsTimelineOpen(false);
          setActiveMember(null);
        }}
        member={activeMember}
        followUps={profile?.role === 'admin' ? followUps.filter(f => f.visibility !== 'private') : followUps}
        onAddFollowUp={(data) => activeMember && handleAddFollowUp(activeMember.id, data)}
        onUpdateFollowUp={handleUpdateFollowUp}
        onDeleteFollowUp={handleDeleteFollowUp}
      />
      <MemberProfileModal 
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setViewingMember(null);
        }}
        member={viewingMember}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem' }}>Adhérents</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Gestion des associations et de leurs cotisations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <Download size={18} />
            Exporter (CSV)
          </button>
          <button className="btn btn-primary" onClick={handleOpenNew}>
            <Plus size={18} />
            Nouvel Adhérent
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', minHeight: '42px' }}>
          {selectedIds.length > 0 ? (
            <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', backgroundColor: '#EFF6FF', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                {selectedIds.length} adhérent{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedIds([])} style={{ backgroundColor: 'white' }}>
                  Annuler
                </button>
                <button className="btn btn-primary" onClick={handleBulkEmail}>
                  <Mail size={18} />
                  Contacter par e-mail
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Rechercher un adhérent..." 
                  className="input-field"
                  style={{ paddingLeft: '2.5rem', marginBottom: 0, minWidth: '300px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <select 
                  className="input-field" 
                  style={{ marginBottom: 0, minWidth: '180px', appearance: 'auto' }}
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                >
                  <option value="">Toutes les régions</option>
                  {uniqueRegions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input 
                    type="checkbox" 
                    className="custom-checkbox"
                    checked={filteredMembers.length > 0 && selectedIds.length === filteredMembers.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Association</th>
                <th>Contact</th>
                <th>Cotisation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Aucun adhérent trouvé.</td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="checkbox-cell">
                      <input 
                        type="checkbox" 
                        className="custom-checkbox"
                        checked={selectedIds.includes(member.id)}
                        onChange={() => handleSelectOne(member.id)}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{member.nom_association}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        {member.ville} ({member.region})
                      </div>
                    </td>
                    <td>
                      <div>{member.prenom} {member.nom}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Phone size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        {member.telephone_contact}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(member.statut_cotisation)}`}>
                        {member.statut_cotisation}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                        <button 
                          onClick={() => handleOpenEventModal(member)}
                          className="btn-icon primary" 
                          title="Créer un rappel dans l'agenda"
                        >
                          <CalendarIcon size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenView(member)}
                          className="btn-icon" 
                          title="Voir la fiche complète"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenTimeline(member)}
                          className="btn-icon" 
                          title="Historique"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Clock size={16} />
                        </button>
                        <button onClick={() => handleOpenEdit(member)} className="btn-icon" title="Modifier">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(member.id)} className="btn-icon danger" title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
