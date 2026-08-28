import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, MapPin, Phone, Edit, Trash2, Clock, Eye, Download, UserPlus, HelpCircle, X, Mail } from 'lucide-react';
import { ProspectForm, type ProspectFormData } from '../components/ProspectForm';
import { ProspectTimeline, type FollowUp } from '../components/ProspectTimeline';
import { ProspectProfileModal } from '../components/ProspectProfileModal';
import { type Prospect, getMockProspects } from '../lib/mockProspects';
import { EventFormModal, type EventFormData } from '../components/EventFormModal';
import { useEvents } from '../contexts/EventsContext';
import { Calendar as CalendarIcon } from 'lucide-react';

export const SuiviProspect = () => {
  const { profile } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [viewingProspect, setViewingProspect] = useState<Prospect | null>(null);
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);
  const [prospectToConvert, setProspectToConvert] = useState<Prospect | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isStatusInfoOpen, setIsStatusInfoOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { addEvent } = useEvents();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventPrefill, setEventPrefill] = useState<Partial<EventFormData> | null>(null);

  useEffect(() => {
    setSelectedIds([]); // Reset selection when filters change
  }, [searchTerm, selectedRegion, selectedStatus]);

  useEffect(() => {
    fetchProspects();
  }, [profile]);

  const fetchProspects = async () => {
    setLoading(true);
    try {
      if (import.meta.env.VITE_SUPABASE_URL === undefined) {
        const localProspects = getMockProspects();
        if (profile?.role === 'regional' && profile.region) {
          setProspects(localProspects.filter(p => p.region === profile.region));
        } else {
          setProspects(localProspects);
        }
        setLoading(false);
        return;
      }

      let query = supabase.from('prospects').select('*');
      
      if (profile?.role === 'regional' && profile?.region) {
        query = query.eq('region', profile.region);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      if (data) setProspects(data as Prospect[]);
    } catch (error) {
      console.error('Error fetching prospects:', error);
      setProspects(getMockProspects());
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUps = async (prospectId: string) => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setFollowUps([
        { id: '1', prospect_id: prospectId, date: new Date(Date.now() - 86400000).toISOString(), type: 'Note', notes: 'Premier contact', visibility: 'public' }
      ]);
      return;
    }

    try {
      const { data, error } = await supabase.from('prospect_follow_ups').select('*').eq('prospect_id', prospectId);
      if (error) throw error;
      if (data) {
        let filteredData = data as FollowUp[];
        if (profile?.role === 'admin') {
          filteredData = filteredData.filter(fu => fu.visibility !== 'private');
        }
        setFollowUps(filteredData);
      }
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
    }
  };

  const handleOpenTimeline = (prospect: Prospect) => {
    setActiveProspect(prospect);
    setIsTimelineOpen(true);
    fetchFollowUps(prospect.id);
  };

  const handleAddFollowUp = async (prospectId: string, data: Partial<FollowUp>) => {
    const visibility = data.visibility || 'public';
    
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      const newFu = { ...data, visibility, id: Math.random().toString(), prospect_id: prospectId } as FollowUp;
      setFollowUps(prev => [...prev, newFu]);
      return;
    }

    try {
      const { error } = await supabase.from('prospect_follow_ups').insert([{ ...data, visibility, prospect_id: prospectId }]);
      if (error) throw error;
      fetchFollowUps(prospectId);
    } catch (error) {
      console.error('Error adding follow-up:', error);
    }
  };

  const handleUpdateFollowUp = (id: string, newNotes: string) => {
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, notes: newNotes } : f));
  };

  const handleDeleteFollowUp = (id: string) => {
    setFollowUps(prev => prev.filter(f => f.id !== id));
  };

  const confirmConvert = async () => {
    if (!prospectToConvert) return;

    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setProspects(prospects.map(p => p.id === prospectToConvert.id ? { ...p, statut_prospection: 'Converti' } : p));
      setProspectToConvert(null);
      return;
    }

    try {
      const { id, statut_prospection, origine, ...memberData } = prospectToConvert;
      const { error: insertError } = await supabase.from('members').insert([{ ...memberData, statut_cotisation: 'Non payé' }]);
      if (insertError) throw insertError;
      
      const { error: updateError } = await supabase.from('prospects').update({ statut_prospection: 'Converti' }).eq('id', prospectToConvert.id);
      if (updateError) throw updateError;
      
      fetchProspects();
      setProspectToConvert(null);
    } catch (error) {
      console.error('Error converting prospect:', error);
      alert('Une erreur est survenue lors de la conversion.');
      setProspectToConvert(null);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Nom Association', 'Statut Prospection', 'Origine', 'Région', 'Ville', 'Adresse',
      'Téléphone Asso', 'Email Asso',
      'Prénom Contact', 'Nom Contact', 'Email Contact', 'Téléphone Contact', 
      'Président', 'Représentant Légal', 'Nb Événements/an', 'SIRET',
      'Site Web', 'Page Facebook'
    ];
    
    const rows = filteredProspects.map(p => [
      `"${p.nom_association}"`,
      `"${p.statut_prospection}"`,
      `"${p.origine || ''}"`,
      `"${p.region}"`,
      `"${p.ville}"`,
      `"${p.adresse}"`,
      `"${p.telephone_asso}"`,
      `"${p.email_asso}"`,
      `"${p.prenom}"`,
      `"${p.nom}"`,
      `"${p.email_contact}"`,
      `"${p.telephone_contact}"`,
      `"${p.president}"`,
      `"${p.representant_legal}"`,
      `"${p.nb_evenements_an}"`,
      `"${p.siret}"`,
      `"${p.site_web}"`,
      `"${p.facebook}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `prospects_fcf_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProspects.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkEmail = () => {
    const emails = prospects
      .filter(p => selectedIds.includes(p.id))
      .map(p => p.email_contact || p.email_asso)
      .filter(Boolean);
    
    if (emails.length > 0) {
      window.location.href = `mailto:?bcc=${emails.join(',')}`;
    } else {
      alert("Aucune adresse e-mail trouvée pour la sélection.");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'Converti') return 'badge-ajour'; // green
    if (status === 'Perdu') return 'badge-nonpaye'; // red
    if (status === 'En négociation') return 'badge-relancer'; // orange
    return 'badge-relancer'; // 'Nouveau', 'Contacté' -> default warning style
  };

  const filteredProspects = useMemo(() => prospects.filter(p => {
    const matchesSearch = p.nom_association.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.ville.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion ? p.region === selectedRegion : true;
    const matchesStatus = selectedStatus ? p.statut_prospection === selectedStatus : true;
    return matchesSearch && matchesRegion && matchesStatus;
  }), [prospects, searchTerm, selectedRegion, selectedStatus]);

  const uniqueRegions = Array.from(new Set(prospects.map(p => p.region)));

  const handleFormSubmit = async (data: ProspectFormData) => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      if (editingProspect) {
        setProspects(prospects.map(p => p.id === editingProspect.id ? { ...p, ...data } : p));
      } else {
        const newProspect = { ...data, id: Math.random().toString(36).substr(2, 9) };
        setProspects([...prospects, newProspect]);
      }
      return;
    }

    try {
      if (editingProspect) {
        const { error } = await supabase.from('prospects').update(data).eq('id', editingProspect.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('prospects').insert([data]);
        if (error) throw error;
      }
      fetchProspects();
    } catch (error) {
      console.error('Error saving prospect:', error);
      alert('Une erreur est survenue lors de la sauvegarde.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce prospect ?')) return;

    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setProspects(prospects.filter(p => p.id !== id));
      return;
    }

    try {
      const { error } = await supabase.from('prospects').delete().eq('id', id);
      if (error) throw error;
      fetchProspects();
    } catch (error) {
      console.error('Error deleting prospect:', error);
    }
  };

  const handleStatusChange = async (prospect: Prospect, newStatus: string) => {
    if (newStatus === 'Converti') {
      setProspectToConvert(prospect);
      return;
    }

    // Mettre à jour localement tout de suite (optimistic UI)
    setProspects(prev => prev.map(p => p.id === prospect.id ? { ...p, statut_prospection: newStatus as Prospect['statut_prospection'] } : p));
    
    if (import.meta.env.VITE_SUPABASE_URL !== undefined) {
      try {
        const { error } = await supabase.from('prospects').update({ statut_prospection: newStatus }).eq('id', prospect.id);
        if (error) {
          // Annuler en cas d'erreur
          fetchProspects();
          throw error;
        }
      } catch (error) {
        console.error('Error updating status:', error);
        alert('Erreur lors de la mise à jour du statut.');
      }
    }
  };

  const handleOpenEventModal = (prospect: Prospect) => {
    setEventPrefill({
      title: `Relance Prospect : ${prospect.nom_association}`,
      description: `Contact: ${prospect.prenom} ${prospect.nom}\nTél: ${prospect.telephone_contact || prospect.telephone_asso}\nStatut: ${prospect.statut_prospection}`,
      region: prospect.region
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
      <ProspectForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleFormSubmit}
        initialData={editingProspect}
      />
      <ProspectTimeline
        isOpen={isTimelineOpen}
        onClose={() => {
          setIsTimelineOpen(false);
          setActiveProspect(null);
        }}
        prospect={activeProspect}
        followUps={profile?.role === 'admin' ? followUps.filter(f => f.visibility !== 'private') : followUps}
        onAddFollowUp={(data) => activeProspect && handleAddFollowUp(activeProspect.id, data)}
        onUpdateFollowUp={handleUpdateFollowUp}
        onDeleteFollowUp={handleDeleteFollowUp}
      />
      <ProspectProfileModal 
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setViewingProspect(null);
        }}
        prospect={viewingProspect}
      />

      {prospectToConvert && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'var(--bg-base)', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <UserPlus size={20} color="var(--primary)" /> Convertir le prospect
              </h3>
              <button onClick={() => setProspectToConvert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
              Voulez-vous vraiment convertir l'association <strong>{prospectToConvert.nom_association}</strong> en adhérent ?<br /><br />
              Cela l'ajoutera officiellement à votre base d'adhérents.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setProspectToConvert(null)} className="btn btn-secondary">
                Annuler
              </button>
              <button onClick={confirmConvert} className="btn btn-primary" style={{ backgroundColor: '#166534', borderColor: '#166534' }}>
                Oui, convertir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isStatusInfoOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'var(--bg-base)', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <HelpCircle size={20} color="var(--primary)" /> Légende des Statuts
              </h3>
              <button onClick={() => setIsStatusInfoOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span className="badge badge-relancer" style={{ minWidth: '120px', textAlign: 'center' }}>Nouveau</span> <span style={{ color: 'var(--text-secondary)' }}>Non contacté</span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span className="badge badge-relancer" style={{ minWidth: '120px', textAlign: 'center' }}>1er contact</span> <span style={{ color: 'var(--text-secondary)' }}>Prise de contact initiale</span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span className="badge badge-relancer" style={{ minWidth: '120px', textAlign: 'center' }}>2ème contact</span> <span style={{ color: 'var(--text-secondary)' }}>Relance par mail/téléphone</span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span className="badge badge-relancer" style={{ minWidth: '120px', textAlign: 'center' }}>3ème contact</span> <span style={{ color: 'var(--text-secondary)' }}>Dernière relance / appel</span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span className="badge badge-relancer" style={{ minWidth: '120px', textAlign: 'center', backgroundColor: '#fef3c7', color: '#92400e' }}>En négociation</span> <span style={{ color: 'var(--text-secondary)' }}>Échange en cours</span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span className="badge badge-ajour" style={{ minWidth: '120px', textAlign: 'center' }}>Converti</span> <span style={{ color: 'var(--text-secondary)' }}>Devenu adhérent</span></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><span className="badge badge-nonpaye" style={{ minWidth: '120px', textAlign: 'center' }}>Perdu</span> <span style={{ color: 'var(--text-secondary)' }}>Refus définitif</span></li>
            </ul>
          </div>
        </div>,
        document.body
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem' }}>Prospects</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Gestion des associations cibles et suivi des conversions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <Download size={18} />
            Exporter (CSV)
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingProspect(null); setIsFormOpen(true); }}>
            <Plus size={18} />
            Nouveau Prospect
          </button>
        </div>
      </div>

      <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', minHeight: '42px' }}>
            {selectedIds.length > 0 ? (
              <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', backgroundColor: '#EFF6FF', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  {selectedIds.length} prospect{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
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
                    placeholder="Rechercher un prospect..." 
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
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">Tous les statuts</option>
                    <option value="Nouveau">Nouveau</option>
                    <option value="1er contact">1er contact</option>
                    <option value="2ème contact">2ème contact</option>
                    <option value="3ème contact">3ème contact</option>
                    <option value="En négociation">En négociation</option>
                    <option value="Converti">Converti</option>
                    <option value="Perdu">Perdu</option>
                  </select>
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
                      checked={filteredProspects.length > 0 && selectedIds.length === filteredProspects.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Association</th>
                  <th>Contact</th>
                  <th>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Statut
                      <button onClick={() => setIsStatusInfoOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <HelpCircle size={14} style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</td>
                  </tr>
                ) : filteredProspects.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Aucun prospect trouvé.</td>
                  </tr>
                ) : (
                  filteredProspects.map((prospect) => (
                    <tr key={prospect.id}>
                      <td className="checkbox-cell">
                        <input 
                          type="checkbox" 
                          className="custom-checkbox"
                          checked={selectedIds.includes(prospect.id)}
                          onChange={() => handleSelectOne(prospect.id)}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{prospect.nom_association}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <MapPin size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                          {prospect.ville} ({prospect.region})
                        </div>
                      </td>
                      <td>
                        <div>{prospect.prenom} {prospect.nom}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <Phone size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                          {prospect.telephone_contact}
                        </div>
                      </td>
                      <td>
                        <select
                          value={prospect.statut_prospection}
                          onChange={(e) => handleStatusChange(prospect, e.target.value)}
                          className={`badge ${getStatusBadgeClass(prospect.statut_prospection)}`}
                          style={{ 
                            backgroundColor: prospect.statut_prospection === 'Converti' ? '#dcfce7' : prospect.statut_prospection === 'Perdu' ? '#fee2e2' : prospect.statut_prospection === 'En négociation' ? '#fef3c7' : '#e0e7ff', 
                            color: prospect.statut_prospection === 'Converti' ? '#166534' : prospect.statut_prospection === 'Perdu' ? '#991b1b' : prospect.statut_prospection === 'En négociation' ? '#92400e' : '#3730a3',
                            border: '1px solid transparent',
                            cursor: 'pointer',
                            outline: 'none',
                            fontWeight: 500,
                            fontFamily: 'inherit'
                          }}
                        >
                          <option value="Nouveau" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>Nouveau</option>
                          <option value="1er contact" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>1er contact</option>
                          <option value="2ème contact" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>2ème contact (Relance)</option>
                          <option value="3ème contact" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>3ème contact (Appel/Relance)</option>
                          <option value="En négociation" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>En négociation</option>
                          <option value="Converti" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Converti</option>
                          <option value="Perdu" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Perdu</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                          <button 
                            onClick={() => handleOpenEventModal(prospect)}
                            className="btn-icon primary" 
                            title="Créer un rappel dans l'agenda"
                          >
                            <CalendarIcon size={16} />
                          </button>
                          <button 
                            onClick={() => { setViewingProspect(prospect); setIsViewOpen(true); }}
                            className="btn-icon" 
                            title="Voir la fiche"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleOpenTimeline(prospect)}
                            className="btn-icon" 
                            title="Historique"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Clock size={16} />
                          </button>
                          <button onClick={() => { setEditingProspect(prospect); setIsFormOpen(true); }} className="btn-icon" title="Modifier">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(prospect.id)} className="btn-icon danger" title="Supprimer">
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
