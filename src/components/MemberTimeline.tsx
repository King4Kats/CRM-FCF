import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, Mail, CheckCircle, Clock, FileText, Edit2, Trash2, Check, Lock, Globe } from 'lucide-react';

export type FollowUp = {
  id: string;
  member_id: string;
  date: string;
  type: 'Note' | 'Appel' | 'Email' | 'Paiement';
  notes: string;
  visibility?: 'public' | 'private';
  date_rappel?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  member: any | null; // using any temporarily, will type correctly
  followUps: FollowUp[];
  onAddFollowUp: (data: { date: string; type: FollowUp['type']; notes: string; visibility: 'public' | 'private'; date_rappel?: string }) => void;
  onUpdateFollowUp: (id: string, newNotes: string) => void;
  onDeleteFollowUp: (id: string) => void;
};

export const MemberTimeline: React.FC<Props> = ({ isOpen, onClose, member, followUps, onAddFollowUp, onUpdateFollowUp, onDeleteFollowUp }) => {
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<FollowUp['type']>('Note');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [dateRappel, setDateRappel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !member) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddFollowUp({
      date: new Date().toISOString(),
      type: noteType,
      notes: newNote.trim(),
      visibility,
      date_rappel: dateRappel || undefined
    });
    setNewNote('');
    setNoteType('Note');
    setVisibility('public');
    setDateRappel('');
  };

  const startEdit = (followUp: FollowUp) => {
    setEditingId(followUp.id);
    setEditNote(followUp.notes);
  };

  const handleSaveEdit = (id: string) => {
    if (editNote.trim()) {
      onUpdateFollowUp(id, editNote.trim());
    }
    setEditingId(null);
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'Appel': return <Phone size={16} color="var(--primary)" />;
      case 'Email': return <Mail size={16} color="var(--warning)" />;
      case 'Paiement': return <CheckCircle size={16} color="var(--success)" />;
      case 'Note': default: return <FileText size={16} color="var(--text-muted)" />;
    }
  };

  const sortedFollowUps = [...followUps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(17, 24, 39, 0.4)',
      display: 'flex', justifyContent: 'flex-end', zIndex: 60
    }} onClick={onClose}>
      <div className="card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ 
        width: '100%', maxWidth: '450px', height: '100%', 
        margin: 0, borderRadius: 0, borderLeft: '1px solid var(--border-light)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem' }}>{member.nom_association}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Contact : {member.prenom} {member.nom}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Timeline Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: 'var(--bg-base)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} /> Historique des actions
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            {/* Vertical Line */}
            <div style={{ position: 'absolute', left: '15px', top: '10px', bottom: 0, width: '2px', backgroundColor: 'var(--border-light)', zIndex: 0 }}></div>

            {sortedFollowUps.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', paddingLeft: '2.5rem' }}>Aucun historique enregistré.</p>
            )}

            {sortedFollowUps.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', padding: '0.25rem', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                  {getIconForType(item.type)}
                </div>
                <div style={{ flex: 1, backgroundColor: item.visibility === 'private' ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-base)', padding: '1rem', borderRadius: '8px', border: `1px solid ${item.visibility === 'private' ? '#fcd34d' : 'var(--border-light)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{item.type}</span>
                      {item.visibility === 'private' ? (
                        <span title="Note privée (visible uniquement par votre région)" style={{ display: 'inline-flex', alignItems: 'center', color: '#f59e0b', backgroundColor: '#fef3c7', padding: '0.125rem 0.375rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 600 }}>
                          <Lock size={10} style={{ marginRight: '0.125rem' }} /> Privé
                        </span>
                      ) : (
                        <span title="Note publique (partagée avec le national)" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--primary)', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.125rem 0.375rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 600 }}>
                          <Globe size={10} style={{ marginRight: '0.125rem' }} /> Public
                        </span>
                      )}
                      {item.date_rappel && (
                        <span title="Rappel planifié" style={{ display: 'inline-flex', alignItems: 'center', color: '#059669', backgroundColor: '#d1fae5', padding: '0.125rem 0.375rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 600 }}>
                          <Clock size={10} style={{ marginRight: '0.125rem' }} /> Rappel: {new Date(item.date_rappel).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => startEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }} title="Modifier">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => onDeleteFollowUp(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--danger)' }} title="Supprimer">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {editingId === item.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="input-field"
                        style={{ marginBottom: 0, padding: '0.25rem 0.5rem', fontSize: '0.875rem', flex: 1 }}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                      />
                      <button onClick={() => handleSaveEdit(item.id)} className="btn-icon success" style={{ width: '28px', height: '28px', cursor: 'pointer' }}>
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-icon danger" style={{ width: '28px', height: '28px', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Note Footer */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface)' }}>
          <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '-0.5rem' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Ajouter un suivi</h3>
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-base)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <button 
                  type="button"
                  onClick={() => setVisibility('public')}
                  style={{ display: 'flex', alignItems: 'center', background: visibility === 'public' ? 'var(--primary)' : 'transparent', color: visibility === 'public' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <Globe size={14} style={{ marginRight: '0.25rem' }} /> Public
                </button>
                <button 
                  type="button"
                  onClick={() => setVisibility('private')}
                  style={{ display: 'flex', alignItems: 'center', background: visibility === 'private' ? '#f59e0b' : 'transparent', color: visibility === 'private' ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <Lock size={14} style={{ marginRight: '0.25rem' }} /> Privé
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-base)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              {(['Note', 'Appel', 'Email', 'Paiement'] as FollowUp['type'][]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNoteType(type)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    background: noteType === type ? 'var(--bg-surface)' : 'transparent',
                    color: noteType === type ? 'var(--text-primary)' : 'var(--text-muted)',
                    border: 'none', borderRadius: '4px', padding: '0.375rem', fontSize: '0.75rem', fontWeight: noteType === type ? 600 : 500,
                    cursor: 'pointer', boxShadow: noteType === type ? 'var(--shadow-sm)' : 'none', transition: 'all 0.2s'
                  }}
                >
                  {type === 'Note' && <FileText size={14} />}
                  {type === 'Appel' && <Phone size={14} />}
                  {type === 'Email' && <Mail size={14} />}
                  {type === 'Paiement' && <CheckCircle size={14} />}
                  {type}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="date"
                className="input-field"
                title="Date de rappel (optionnel)"
                value={dateRappel}
                onChange={(e) => setDateRappel(e.target.value)}
                style={{ marginBottom: 0, padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
              />
            </div>

            <textarea 
              className="input-field" 
              placeholder="Saisissez votre note ici..." 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              style={{ minHeight: '80px', resize: 'vertical', marginTop: '-0.5rem' }}
            />
            <button type="submit" className="btn btn-primary" disabled={!newNote.trim()}>
              Ajouter la note
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
