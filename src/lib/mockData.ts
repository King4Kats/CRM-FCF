import type { MemberFormData } from '../components/MemberForm';

export type Member = MemberFormData & { id: string };

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
  facebook: 'https://facebook.com/asso'
};

export const MOCK_MEMBERS: Member[] = [
  // BOURGOGNE
  { id: '1', nom: 'Girard', prenom: 'Paul', nom_association: 'Carnaval de Chalon', ville: 'Chalon-sur-Saône', region: 'BOURGOGNE', statut_cotisation: 'A jour', ...defaultExtra, email_asso: 'chalon@carnaval.fr', telephone_contact: '06 11 22 33 44', nb_evenements_an: 5 },
  // BRETAGNE
  { id: '2', nom: 'Le Goff', prenom: 'Yann', nom_association: 'Festival des Filets Bleus', ville: 'Concarneau', region: 'BRETAGNE', statut_cotisation: 'A jour', ...defaultExtra, email_asso: 'filets.bleus@bzh.fr', telephone_contact: '06 22 33 44 55' },
  { id: '3', nom: 'Kermadec', prenom: 'Loïc', nom_association: 'Fête de la Bretagne', ville: 'Rennes', region: 'BRETAGNE', statut_cotisation: 'A relancer', ...defaultExtra, president: 'Mme Kermadec', telephone_contact: '06 99 88 77 66' },
  // CENTRE
  { id: '4', nom: 'Moreau', prenom: 'Lucie', nom_association: 'Fêtes Johanniques', ville: 'Orléans', region: 'CENTRE', statut_cotisation: 'A jour', ...defaultExtra, email_asso: 'johanniques@orleans.fr', telephone_contact: '06 33 44 55 66', nb_evenements_an: 2 },
  // CORSE
  { id: '5', nom: 'Rossi', prenom: 'Marc', nom_association: 'Carnaval de Sartène', ville: 'Sartène', region: 'CORSE', statut_cotisation: 'Non payé', ...defaultExtra, telephone_contact: '06 44 55 66 77' },
  // DRÔME ARDÈCHE
  { id: '6', nom: 'Roux', prenom: 'Sophie', nom_association: 'Fête de la Lavande', ville: 'Montélimar', region: 'DRÔME ARDÈCHE', statut_cotisation: 'A jour', ...defaultExtra, telephone_contact: '06 55 66 77 88' },
  // FESTIV' 44
  { id: '7', nom: 'Dubois', prenom: 'Alain', nom_association: 'Carnaval de Nantes', ville: 'Nantes', region: 'FESTIV\' 44', statut_cotisation: 'A relancer', ...defaultExtra, telephone_contact: '06 66 77 88 99' },
  // FRANCHE-COMTÉ
  { id: '8', nom: 'Lefebvre', prenom: 'Marie', nom_association: 'Carnaval de Montbéliard', ville: 'Montbéliard', region: 'FRANCHE-COMTÉ', statut_cotisation: 'A jour', ...defaultExtra, telephone_contact: '06 77 88 99 00' },
  // GRAND EST
  { id: '9', nom: 'Muller', prenom: 'Jean', nom_association: 'Carnaval Vénitien', ville: 'Remiremont', region: 'GRAND EST', statut_cotisation: 'A jour', ...defaultExtra, telephone_contact: '06 88 99 00 11' },
  // HAUTS-DE-FRANCE
  { id: '10', nom: 'Petit', prenom: 'Thomas', nom_association: 'Carnaval de Dunkerque', ville: 'Dunkerque', region: 'HAUTS-DE-FRANCE', statut_cotisation: 'Non payé', ...defaultExtra, telephone_contact: '06 99 00 11 22' },
  // HÉRAULT
  { id: '11', nom: 'Blanc', prenom: 'Pierre', nom_association: 'Carnaval de Pézenas', ville: 'Pézenas', region: 'HÉRAULT', statut_cotisation: 'A jour', ...defaultExtra, telephone_contact: '06 00 11 22 33' },
  // MAINE ET LOIRE
  { id: '12', nom: 'Garnier', prenom: 'Julie', nom_association: 'Fête du Vélo', ville: 'Angers', region: 'MAINE ET LOIRE', statut_cotisation: 'A jour', ...defaultExtra, telephone_contact: '06 12 34 56 78' },
  // NOUVELLE AQUITAINE
  { id: '13', nom: 'Martin', prenom: 'Jacques', nom_association: 'Fêtes de Bayonne', ville: 'Bayonne', region: 'NOUVELLE AQUITAINE', statut_cotisation: 'A relancer', ...defaultExtra, telephone_contact: '06 23 45 67 89' },
  // OCCITANIE
  { id: '14', nom: 'Garcia', prenom: 'Antoine', nom_association: 'Carnaval de Toulouse', ville: 'Toulouse', region: 'OCCITANIE', statut_cotisation: 'A jour', ...defaultExtra, telephone_contact: '06 34 56 78 90' },
  // OUTRE-MER
  { id: '15', nom: 'Hoarau', prenom: 'Valérie', nom_association: 'Carnaval de Guyane', ville: 'Cayenne', region: 'OUTRE-MER', statut_cotisation: 'A relancer', ...defaultExtra, telephone_contact: '06 45 67 89 01' },
  // RHÔNE ISÈRE
  { id: '16', nom: 'Bernard', prenom: 'Claude', nom_association: 'Fête des Lumières', ville: 'Lyon', region: 'RHÔNE ISÈRE', statut_cotisation: 'A jour', ...defaultExtra, telephone_contact: '06 56 78 90 12' },
  // UDOM
  { id: '17', nom: 'Richard', prenom: 'Nicolas', nom_association: 'Corsos Fleuris', ville: 'Le Mans', region: 'UDOM', statut_cotisation: 'Non payé', ...defaultExtra, telephone_contact: '06 67 89 01 23' },
  // VENDÉE
  { id: '18', nom: 'Simon', prenom: 'Camille', nom_association: 'Festival de Poupet', ville: 'Saint-Malô-du-Bois', region: 'VENDÉE', statut_cotisation: 'A jour', ...defaultExtra, telephone_contact: '06 78 90 12 34' }
];
