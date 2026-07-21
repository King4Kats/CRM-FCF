import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building, Contact, Network, CheckSquare, MapPin, Phone, Mail, Globe, Calendar, Briefcase, User, Link } from 'lucide-react';
import type { ProspectFormData } from './ProspectForm';

type Prospect = ProspectFormData & { id: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  prospect: Prospect | null;
};

export const ProspectProfileModal: React.FC<Props> = ({ isOpen, onClose, prospect }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !prospect) return null;

  const StatusBadge = ({ status }: { status: string }) => {
    let badgeClass = 'badge-relancer';
    if (status === 'Converti') badgeClass = 'badge-ajour';
    if (status === 'Perdu') badgeClass = 'badge-nonpaye';
    if (status === 'En négociation') badgeClass = 'badge-relancer';
    if (status === 'Nouveau' || status === '1er contact' || status === '2ème contact' || status === '3ème contact') badgeClass = 'badge-relancer'; // we can style these specifically later
    
    return (
      <span className={`badge ${badgeClass}`} style={{ backgroundColor: status === 'Converti' ? '#dcfce7' : status === 'Perdu' ? '#fee2e2' : status === 'En négociation' ? '#fef3c7' : '#e0e7ff', color: status === 'Converti' ? '#166534' : status === 'Perdu' ? '#991b1b' : status === 'En négociation' ? '#92400e' : '#3730a3' }}>
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
                {prospect.nom_association}
              </h2>
              <StatusBadge status={prospect.statut_prospection} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14} /> {prospect.region}</span>
              {prospect.siret && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Briefcase size={14} /> SIRET: {prospect.siret}</span>}
              {prospect.origine && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Globe size={14} /> Origine: {prospect.origine}</span>}
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
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.125rem' }}>{prospect.prenom} {prospect.nom}</div>
                {prospect.email_contact && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Mail size={16} /> <a href={`mailto:${prospect.email_contact}`} style={{ color: 'inherit', textDecoration: 'none' }}>{prospect.email_contact}</a>
                  </div>
                )}
                {prospect.telephone_contact && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Phone size={16} /> <a href={`tel:${prospect.telephone_contact}`} style={{ color: 'inherit', textDecoration: 'none' }}>{prospect.telephone_contact}</a>
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
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{prospect.president || '-'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <User size={16} color="var(--text-muted)" style={{ marginTop: '0.125rem' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Représentant Légal</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{prospect.representant_legal || '-'}</div>
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
                    {prospect.adresse ? (
                      <>
                        {prospect.adresse}<br />
                        {prospect.ville}
                      </>
                    ) : (
                      prospect.ville
                    )}
                  </div>
                </div>
                {(prospect.email_asso || prospect.telephone_asso) && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Contact Générique</div>
                    <div style={{ color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {prospect.email_asso && <span>{prospect.email_asso}</span>}
                      {prospect.telephone_asso && <span>{prospect.telephone_asso}</span>}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Événements</div>
                  <div style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Calendar size={14} color="var(--text-muted)" /> {prospect.nb_evenements_an ? `${prospect.nb_evenements_an} événements/an` : 'Non renseigné'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Web & Social */}
          {(prospect.site_web || prospect.facebook) && (
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                <Network size={18} /> En ligne
              </h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {prospect.site_web && (
                  <a href={prospect.site_web} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                    <Globe size={18} color="var(--primary)" /> Site Web Officiel
                  </a>
                )}
                {prospect.facebook && (
                  <a href={prospect.facebook} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
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
