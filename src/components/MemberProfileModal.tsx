import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building, Contact, Network, CheckSquare, MapPin, Phone, Mail, Globe, Calendar, Briefcase, User, Link } from 'lucide-react';
import type { MemberFormData } from './MemberForm';

type Member = MemberFormData & { id: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
};

export const MemberProfileModal: React.FC<Props> = ({ isOpen, onClose, member }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !member) return null;

  const StatusBadge = ({ status }: { status: string }) => {
    let badgeClass = 'badge-ajour';
    if (status === 'A relancer') badgeClass = 'badge-relancer';
    if (status === 'Non payé') badgeClass = 'badge-nonpaye';
    
    return (
      <span className={`badge ${badgeClass}`}>
        {status}
      </span>
    );
  };

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(17, 24, 39, 0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', margin: '1rem', position: 'relative', border: 'none', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
                {member.nom_association}
              </h2>
              <StatusBadge status={member.statut_cotisation} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14} /> {member.region}</span>
              {member.siret && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Briefcase size={14} /> SIRET: {member.siret}</span>}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="btn-icon"
            style={{ width: '32px', height: '32px', padding: 0 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ overflowY: 'auto', padding: '2rem', flex: 1, backgroundColor: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            
            {/* Contact Principal */}
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                <Contact size={18} /> Contact Principal
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.125rem' }}>{member.prenom} {member.nom}</div>
                {member.email_contact && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Mail size={16} /> <a href={`mailto:${member.email_contact}`} style={{ color: 'inherit', textDecoration: 'none' }}>{member.email_contact}</a>
                  </div>
                )}
                {member.telephone_contact && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Phone size={16} /> <a href={`tel:${member.telephone_contact}`} style={{ color: 'inherit', textDecoration: 'none' }}>{member.telephone_contact}</a>
                  </div>
                )}
              </div>
            </div>

            {/* Gouvernance */}
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                <CheckSquare size={18} /> Gouvernance
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <User size={16} color="var(--text-muted)" style={{ marginTop: '0.125rem' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Président</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{member.president || '-'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <User size={16} color="var(--text-muted)" style={{ marginTop: '0.125rem' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Représentant Légal</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{member.representant_legal || '-'}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Coordonnées de l'association */}
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
              <Building size={18} /> L'Association
            </h3>
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Adresse Postale</div>
                  <div style={{ color: 'var(--text-primary)' }}>
                    {member.adresse ? (
                      <>
                        {member.adresse}<br />
                        {member.ville}
                      </>
                    ) : (
                      member.ville
                    )}
                  </div>
                </div>
                {(member.email_asso || member.telephone_asso) && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Contact Générique</div>
                    <div style={{ color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {member.email_asso && <span>{member.email_asso}</span>}
                      {member.telephone_asso && <span>{member.telephone_asso}</span>}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Événements</div>
                  <div style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Calendar size={14} color="var(--text-muted)" /> {member.nb_evenements_an ? `${member.nb_evenements_an} événements/an` : 'Non renseigné'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Web & Social */}
          {(member.site_web || member.facebook) && (
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                <Network size={18} /> En ligne
              </h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {member.site_web && (
                  <a href={member.site_web} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                    <Globe size={18} color="var(--primary)" /> Site Web Officiel
                  </a>
                )}
                {member.facebook && (
                  <a href={member.facebook} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                    <Link size={18} color="#1877F2" /> Page Facebook
                  </a>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
};
