import { COVERED } from '../data/departements';

export interface Suggestion {
  id: string;
  name: string;
  city: string | null;
  department?: string;
  highlight?: string;
}

const BASE = "/gemenskarte-api";

const cache = new Map<string, any>();

async function getJSON<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  cache.set(path, data);
  return data as T;
}

export const api = {
  suggest: (q: string, limit = 6, department?: string) =>
    getJSON<Suggestion[]>(
      `/search/suggest?q=${encodeURIComponent(q)}&limit=${limit}${department ? `&department=${department}` : ""}`,
    ),

  matchIds: (q: string, department?: string) =>
    getJSON<string[]>(
      `/search/match?q=${encodeURIComponent(q)}${department ? `&department=${department}` : ""}`,
    ),

  getAssociation: (id: string) => getJSON<any>(`/associations/${id}`),
    
  geojson: (located: boolean = true, department?: string) => 
    getJSON<any>(`/associations/geojson?located=${located}${department ? `&department=${department}` : ""}`),
    
  geojsonByRegion: async (regionName?: string) => {
    // Normaliser le nom
    const norm = (s: string) => s.toUpperCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const regionToDepts: Record<string, string[]> = {};
    for (const [code, meta] of Object.entries(COVERED)) {
      const r = norm(meta.region);
      if (!regionToDepts[r]) regionToDepts[r] = [];
      regionToDepts[r].push(code);
    }
    
    // Mapping des noms du CRM (qui sont parfois des départements ou des anciennes régions) vers les grandes Régions
    const regionAliases: Record<string, string> = {
      'CENTRE': 'CENTRE-VAL DE LOIRE',
      'PACA': 'PROVENCE-ALPES-COTE D\'AZUR',
      'NOUVELLE AQUITAINE': 'NOUVELLE-AQUITAINE',
      'BOURGOGNE': 'BOURGOGNE-FRANCHE-COMTE',
      'FRANCHE-COMTE': 'BOURGOGNE-FRANCHE-COMTE',
      'DROME ARDECHE': 'AUVERGNE-RHONE-ALPES',
      'RHONE ISERE': 'AUVERGNE-RHONE-ALPES',
      'FESTIV 44': 'PAYS DE LA LOIRE',
      'MAINE ET LOIRE': 'PAYS DE LA LOIRE',
      'VENDEE': 'PAYS DE LA LOIRE',
      'HERAULT': 'OCCITANIE'
    };

    const requested = regionName ? norm(regionName) : null;
    
    // Cas spécial: OUTRE-MER ou UDOM doivent charger tous les DOM-TOM
    if (requested === 'OUTRE-MER' || requested === 'UDOM') {
      const domDepts = ['971', '972', '973', '974', '976'];
      const results = await Promise.all(domDepts.map(d => api.geojson(true, d)));
      return { type: "FeatureCollection", features: results.flatMap(res => res.features || []) };
    }

    const targetRegion = requested ? (regionAliases[requested] || requested) : null;

    if (!targetRegion || !regionToDepts[targetRegion]) {
      // Retourne vide si non trouvé pour éviter de crasher le navigateur avec toute la France
      return { type: "FeatureCollection", features: [] };
    }
    
    // Charger chaque département de la région ciblée
    const depts = regionToDepts[targetRegion];
    const results = await Promise.all(depts.map(d => api.geojson(true, d)));
    
    const allFeatures = results.flatMap(res => res.features || []);
    return { type: "FeatureCollection", features: allFeatures };
  }
};
