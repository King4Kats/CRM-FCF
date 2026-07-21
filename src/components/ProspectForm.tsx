import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building, Contact, Network, CheckSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const FCF_REGIONS = [
  'BOURGOGNE', 'BRETAGNE', 'CENTRE', 'CORSE', 'DRÔME ARDÈCHE', 
  'FESTIV\' 44', 'FRANCHE-COMTÉ', 'GRAND EST', 'HAUTS-DE-FRANCE', 
  'HÉRAULT', 'MAINE ET LOIRE', 'NOUVELLE AQUITAINE', 'OCCITANIE', 
  'OUTRE-MER', 'RHÔNE ISÈRE', 'UDOM', 'VENDÉE'
];

export type ProspectFormData = {
  nom: string;
  prenom: string;
  nom_association: string;
  telephone_asso: string;
  email_asso: string;
  adresse: string;
  ville: string;
  region: string;
  statut_prospection: 'Nouveau' | '1er contact' | '2ème contact' | '3ème contact' | 'En négociation' | 'Converti' | 'Perdu';
  origine: string;
  site_web: string;
  telephone_contact: string;
  email_contact: string;
  president: string;
  representant_legal: string;
  nb_evenements_an: number | '';
  siret: string;
  facebook: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProspectFormData) => void;
  initialData?: ProspectFormData | null;
};

export const ProspectForm: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<ProspectFormData>({
    nom: '', prenom: '', nom_association: '', telephone_asso: '', email_asso: '', adresse: '', ville: '',
    region: profile?.role === 'regional' && profile.region ? profile.region : '',
    statut_prospection: 'Nouveau', origine: '',
    site_web: '', telephone_contact: '', email_contact: '', president: '', representant_legal: '', nb_evenements_an: '', siret: '', facebook: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        nom: '', prenom: '', nom_association: '', telephone_asso: '', email_asso: '', adresse: '', ville: '',
        region: profile?.role === 'regional' && profile.region ? profile.region : '',
        statut_prospection: 'Nouveau', origine: '',
        site_web: '', telephone_contact: '', email_contact: '', president: '', representant_legal: '', nb_evenements_an: '', siret: '', facebook: ''
      });
    }
  }, [initialData, isOpen, profile]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'nb_evenements_an' ? (value ? parseInt(value) : '') : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(17, 24, 39, 0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', margin: '1rem', position: 'relative', border: 'none', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        
        {/* Header Fixed */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface)', zIndex: 10 }}>
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
            {initialData ? 'Modifier le prospect' : 'Nouveau prospect'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: 0 }}>
            Remplissez les informations du prospect.
          </p>
        </div>

        <div style={{ overflowY: 'auto', padding: '2rem', flex: 1, backgroundColor: 'var(--bg-base)' }}>
          <form id="prospect-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Section 1: Association */}
            <div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Building size={18} /> Informations Générales
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div className="input-group">
                  <label>Nom de l'association *</label>
                  <input required type="text" name="nom_association" className="input-field" value={formData.nom_association} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Numéro SIRET</label>
                  <input type="text" name="siret" className="input-field" value={formData.siret} onChange={handleChange} placeholder="Ex: 123 456 789 00012" />
                </div>
                <div className="input-group">
                  <label>Nombre d'événements par an</label>
                  <input type="number" min="0" name="nb_evenements_an" className="input-field" value={formData.nb_evenements_an} onChange={handleChange} placeholder="Ex: 3" />
                </div>
                <div className="input-group">
                  <label>Statut Prospection *</label>
                  <select name="statut_prospection" className="input-field" value={formData.statut_prospection} onChange={handleChange} style={{ appearance: 'auto' }} required>
                    <option value="Nouveau">Nouveau</option>
                    <option value="1er contact">1er contact</option>
                    <option value="2ème contact">2ème contact (Relance)</option>
                    <option value="3ème contact">3ème contact (Appel/Relance)</option>
                    <option value="En négociation">En négociation</option>
                    <option value="Converti">Converti</option>
                    <option value="Perdu">Perdu</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Origine du contact</label>
                  <input type="text" name="origine" className="input-field" value={formData.origine} onChange={handleChange} placeholder="Ex: Web, Bouche-à-oreille..." />
                </div>
              </div>
            </div>

            {/* Section 2: Contact & Adresse */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Contact size={18} /> Coordonnées & Adresse
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Adresse postale complète</label>
                  <input type="text" name="adresse" className="input-field" value={formData.adresse} onChange={handleChange} placeholder="Ex: 12 Rue des Fêtes" />
                </div>
                <div className="input-group">
                  <label>Ville *</label>
                  <input required type="text" name="ville" className="input-field" value={formData.ville} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Région (FCF) *</label>
                  <select 
                    name="region" className="input-field" value={formData.region} onChange={handleChange} 
                    style={{ 
                      appearance: (initialData || profile?.role === 'regional') ? 'none' : 'auto', 
                      backgroundColor: (initialData || profile?.role === 'regional') ? 'var(--bg-base)' : 'var(--bg-surface)',
                      color: (initialData || profile?.role === 'regional') ? 'var(--text-muted)' : 'var(--text-primary)'
                    }} 
                    required disabled={!!initialData || profile?.role === 'regional'}
                  >
                    <option value="" disabled>Sélectionner une région...</option>
                    {FCF_REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Téléphone de l'association</label>
                  <input type="tel" name="telephone_asso" className="input-field" value={formData.telephone_asso} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Email de l'association</label>
                  <input type="email" name="email_asso" className="input-field" value={formData.email_asso} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Section 3: Gouvernance */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <CheckSquare size={18} /> Gouvernance & Contact Principal
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div className="input-group">
                  <label>Prénom (Contact Principal) *</label>
                  <input required type="text" name="prenom" className="input-field" value={formData.prenom} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Nom (Contact Principal) *</label>
                  <input required type="text" name="nom" className="input-field" value={formData.nom} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Email du Contact *</label>
                  <input required type="email" name="email_contact" className="input-field" value={formData.email_contact} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Téléphone du Contact *</label>
                  <input required type="tel" name="telephone_contact" className="input-field" value={formData.telephone_contact} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Nom du Président</label>
                  <input type="text" name="president" className="input-field" value={formData.president} onChange={handleChange} placeholder="Si différent du contact" />
                </div>
                <div className="input-group">
                  <label>Représentant Légal</label>
                  <input type="text" name="representant_legal" className="input-field" value={formData.representant_legal} onChange={handleChange} placeholder="Si différent du président" />
                </div>
              </div>
            </div>

            {/* Section 4: Web & Réseaux */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Network size={18} /> Présence en ligne
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div className="input-group">
                  <label>Site Web</label>
                  <input type="url" name="site_web" className="input-field" value={formData.site_web} onChange={handleChange} placeholder="https://..." />
                </div>
                <div className="input-group">
                  <label>Lien Page Facebook</label>
                  <input type="url" name="facebook" className="input-field" value={formData.facebook} onChange={handleChange} placeholder="https://facebook.com/..." />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer Fixed */}
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', backgroundColor: 'var(--bg-surface)', zIndex: 10 }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Annuler
          </button>
          <button type="submit" form="prospect-form" className="btn btn-primary">
            {initialData ? 'Enregistrer les modifications' : 'Créer le prospect'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
