import type { ProspectFormData } from '../components/ProspectForm';

export type Prospect = ProspectFormData & { id: string, statut_prospection: 'Nouveau' | '1er contact' | '2ème contact' | '3ème contact' | 'En négociation' | 'Converti' | 'Perdu' };

const defaultExtra = {
  email_asso: 'contact@association.fr',
  telephone_asso: '01 23 45 67 89',
  adresse: '1 Place de la Mairie',
  site_web: 'https://association.fr',
  email_contact: 'president@association.fr',
  telephone_contact: '06 00 00 00 00',
  president: 'M. le Président',
  representant_legal: '',
  nb_evenements_an: 3,
  siret: '12345678900012',
  facebook: 'https://facebook.com/asso',
  origine: 'Site Web'
};

export const MOCK_PROSPECTS: Prospect[] = [
  // BOURGOGNE
  { id: 'p1', nom: 'Lefevre', prenom: 'Luc', nom_association: 'Amis de la Musique', ville: 'Dijon', region: 'BOURGOGNE', statut_prospection: 'Nouveau', ...defaultExtra, origine: 'Bouche-à-oreille' },
  // BRETAGNE
  { id: 'p2', nom: 'Morel', prenom: 'Anne', nom_association: 'Festival Celtique', ville: 'Brest', region: 'BRETAGNE', statut_prospection: '1er contact', ...defaultExtra, origine: 'Formulaire Web' },
  { id: 'p3', nom: 'Goulet', prenom: 'Yves', nom_association: 'Danse Bretonne', ville: 'Vannes', region: 'BRETAGNE', statut_prospection: 'En négociation', ...defaultExtra, origine: 'Salon' },
  // CENTRE
  { id: 'p4', nom: 'Dubois', prenom: 'Claire', nom_association: 'Théâtre en Fête', ville: 'Tours', region: 'CENTRE', statut_prospection: 'Converti', ...defaultExtra, origine: 'Web' },
  // CORSE
  { id: 'p5', nom: 'Paoli', prenom: 'Jean', nom_association: 'Polyphonies', ville: 'Bastia', region: 'CORSE', statut_prospection: 'Perdu', ...defaultExtra, origine: 'Prospection directe' },
];

export const getMockProspects = (): Prospect[] => {
  const stored = localStorage.getItem('crm_prospects');
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize if empty
  localStorage.setItem('crm_prospects', JSON.stringify(MOCK_PROSPECTS));
  return MOCK_PROSPECTS;
};

export const saveMockProspect = (prospect: Prospect) => {
  const current = getMockProspects();
  const updated = [prospect, ...current];
  localStorage.setItem('crm_prospects', JSON.stringify(updated));
};
