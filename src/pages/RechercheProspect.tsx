import { useState, useEffect, useMemo, useCallback } from 'react';
import { ProspectMap } from '../components/ProspectMap';
import { SearchBar } from '../components/SearchBar';
import { api, type Suggestion } from '../lib/gemenskarteApi';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, Globe, MapPin, ExternalLink, CalendarDays, Search } from 'lucide-react';
import { RegionSelectorMap } from '../components/RegionSelectorMap';
import { CATEGORIES } from '../lib/categories';
import { useAuth } from '../contexts/AuthContext';
import { saveMockProspect } from '../lib/mockProspects';
import { useToast } from '../contexts/ToastContext';

export const RechercheProspect = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Etats pour la carte
  const [points, setPoints] = useState<any[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(true);
  
  // Etats pour la recherche
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwIds, setKwIds] = useState<Record<string, string[]>>({});
  
  // Interactions carte
  const [selectedAssoId, setSelectedAssoId] = useState<string | null>(null);
  const [selectedAssoData, setSelectedAssoData] = useState<any | null>(null);
  const [cityToZoom, setCityToZoom] = useState<string | null>(null);
  const [nationalSelectedRegion, setNationalSelectedRegion] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const activeRegion = profile?.role === 'admin' ? nationalSelectedRegion : profile?.region;
  const { showToast } = useToast();

  // useEffect : Permet d'exécuter des effets de bord dans les composants fonctionnels.
  // Ici, il se déclenche à chaque fois que la variable 'activeRegion' change (déclarée dans le tableau de dépendances à la fin).
  // Ce bloc charge les données géographiques (au format GeoJSON) pour peupler la carte (qui utilise Leaflet en interne via le composant ProspectMap).
  // Charger les points de la région une seule fois (ou à chaque changement de région)
  useEffect(() => {
    if (!activeRegion) {
      setPoints([]);
      setLoadingPoints(false);
      return;
    }
    
    setLoadingPoints(true);
    api.geojsonByRegion(activeRegion)
      .then(data => {
        const pts = data.features.map((f: any) => ({
          ...f.properties,
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1]
        }));
        setPoints(pts);
        setLoadingPoints(false);
      })
      .catch(err => {
        console.error('Error fetching map data:', err);
        setLoadingPoints(false);
      });
  }, [activeRegion]);

  // Un autre useEffect : Celui-ci écoute les changements sur 'selectedAssoId'.
  // Dès qu'une association est cliquée sur la carte (gérée par Leaflet), son ID est mis à jour, ce qui déclenche ici un appel API pour récupérer ses détails complets et les afficher dans le panneau latéral.
  // Charger les données de l'asso sélectionnée pour le panneau latéral
  useEffect(() => {
    if (!selectedAssoId) {
      setSelectedAssoData(null);
      return;
    }
    setSelectedAssoData(null);
    api.getAssociation(selectedAssoId)
      .then(setSelectedAssoData)
      .catch(console.error);
  }, [selectedAssoId]);

  // Normalisation de ville pour la recherche
  const normCity = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
  const cleanCity = (s: string) => s.replace(/\s+/g, " ").trim();

  // useMemo : Permet de mémoriser une valeur calculée pour éviter de la recalculer à chaque rendu du composant.
  // Ce recalcul n'aura lieu que si la variable 'points' change.
  // Ici, on construit un index (un dictionnaire) qui regroupe les points (associations) par ville, ce qui rendra la recherche par ville beaucoup plus rapide.
  const cityIndex = useMemo(() => {
    const m = new Map<string, { name: string; pts: any[] }>();
    for (const p of points) {
      if (!p.city) continue;
      const key = normCity(p.city);
      if (!key) continue;
      let e = m.get(key);
      if (!e) { e = { name: cleanCity(p.city), pts: [] }; m.set(key, e); }
      e.pts.push(p);
    }
    return m;
  }, [points]);

  // Encore un useMemo : Celui-ci filtre l'index des villes (cityIndex) en fonction de la requête de recherche 'q'.
  // Il retourne une liste de correspondances (autocomplétion) triée selon que le nom de la ville commence par ou contient la recherche.
  const cityMatches = useMemo(() => {
    const t = normCity(q);
    if (t.length < 2) return [] as { name: string; count: number }[];
    const out: { name: string; count: number; starts: boolean }[] = [];
    for (const [key, e] of cityIndex) {
      if (key.includes(t)) out.push({ name: e.name, count: e.pts.length, starts: key.startsWith(t) });
    }
    out.sort((a, b) => (a.starts === b.starts ? b.count - a.count : a.starts ? -1 : 1));
    return out.slice(0, 4).map(({ name, count }) => ({ name, count }));
  }, [q, cityIndex]);

  // Set of all current point IDs for fast lookup
  const pointIds = useMemo(() => new Set(points.map(p => p.id)), [points]);

  // Suggestions Meilisearch
  // Ce useEffect met en place un "debounce" (délai de 160ms) pour éviter d'appeler l'API de recherche à chaque frappe de clavier.
  useEffect(() => {
    const t = q.trim();
    if (!t) { setSuggestions([]); return; }
    const id = setTimeout(() => { 
      api.suggest(t, 6).then(setSuggestions).catch(() => setSuggestions([])); 
    }, 160);
    return () => clearTimeout(id);
  }, [q]);

  // Gestion des mots-clés
  const addKeyword = useCallback((raw: string) => {
    const w = raw.trim();
    if (!w) return;
    const key = w.toLowerCase();
    setKeywords((ks) => (ks.some((k) => k.toLowerCase() === key) ? ks : [...ks, w]));
    setQ("");
    if (!(key in kwIds)) {
      api.matchIds(w).then((ids) => setKwIds((m) => ({ ...m, [key]: ids }))).catch(() => {});
    }
  }, [kwIds]);

  const removeKeyword = useCallback((w: string) => {
    setKeywords((ks) => ks.filter((k) => k !== w));
  }, []);

  const onSearchSubmit = useCallback(() => {
    if (cityMatches.length > 0) {
      setCityToZoom(cityMatches[0].name);
      setSelectedAssoId(null);
      setQ("");
    } else if (q.trim()) {
      addKeyword(q);
    }
  }, [cityMatches, q, addKeyword]);

  // Ce useMemo effectue l'intersection des résultats de recherche par mots-clés.
  // Il combine les IDs retournés pour chaque mot-clé et ne garde que ceux qui sont communs à tous les mots-clés (filtrage cumulatif).
  const keywordIds = useMemo(() => {
    if (keywords.length === 0) return null;
    let acc: Set<string> | null = null;
    for (const w of keywords) {
      const ids = kwIds[w.toLowerCase()];
      if (!ids) continue;
      const s = new Set(ids);
      acc = acc === null ? s : new Set(Array.from<string>(acc).filter((id) => s.has(id)));
    }
    return acc;
  }, [keywords, kwIds]);

  const handleAddProspect = async (asso: any) => {
    const newProspect = {
      nom: 'À définir',
      prenom: 'Contact',
      nom_association: asso.name,
      telephone_asso: asso.social?.phone || '',
      email_asso: asso.social?.email || '',
      adresse: asso.address?.street || '',
      ville: asso.city || '',
      region: activeRegion || 'BRETAGNE',
      statut_prospection: 'Nouveau' as const,
      origine: 'Recherche Carte (GemensKarte)',
      site_web: asso.social?.website || '',
      telephone_contact: '',
      email_contact: '',
      president: '',
      representant_legal: '',
      nb_evenements_an: 0,
      siret: '',
      facebook: asso.social?.facebook || ''
    };

    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      saveMockProspect({ id: Math.random().toString(), ...newProspect });
      showToast(`L'association ${asso.name} a été ajoutée à vos prospects.`, "success");
      navigate('/prospects/suivi');
      return;
    }

    try {
      const { error } = await supabase.from('prospects').insert([newProspect]);

      if (error) throw error;
      
      showToast('Prospect ajouté avec succès !', "success");
      navigate('/prospects/suivi');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l\'ajout du prospect', "error");
    }
  };

  if (profile?.role === 'admin' && !nationalSelectedRegion) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', paddingTop: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Sélection du territoire</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Choisissez une région pour y prospecter des associations.</p>
        <RegionSelectorMap onSelectRegion={setNationalSelectedRegion} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>
      {/* En-tête avec barre de recherche au centre */}
      <div style={{ marginBottom: '1rem', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {profile?.role === 'admin' && (
                <button 
                  onClick={() => setNationalSelectedRegion(null)}
                  className="btn btn-sm" 
                  style={{ padding: '0.5rem', height: 'auto', background: 'var(--bg-base)', border: '1px solid var(--border-light)' }}
                  title="Retour à la carte nationale"
                >
                  <ArrowLeft size={16} color="var(--text-primary)" />
                </button>
              )}
              <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Recherche RNA</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
              Explorez et ajoutez des associations {activeRegion ? `en ${activeRegion}` : ''}.
            </p>
          </div>
          <div style={{ flex: 1, maxWidth: '600px', marginLeft: '2rem' }}>
            <SearchBar 
              value={q} 
              onChange={setQ} 
              suggestions={suggestions}
              cities={cityMatches}
              onPickCity={(city) => { setCityToZoom(city); setQ(""); }}
              onPickAsso={(id) => { setSelectedAssoId(id); setQ(""); }}
              onSubmit={onSearchSubmit}
            />
          </div>
        </div>
        
        {/* Chips des mots-clés */}
        {keywords.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Filtres :</span>
            {keywords.map(w => {
              const kwArr = kwIds[w.toLowerCase()];
              const count = kwArr ? kwArr.filter(id => pointIds.has(id)).length : undefined;
              return (
                <div key={w} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'color-mix(in srgb, var(--primary) 12%, white)',
                  color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 30%, white)',
                  padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.875rem', fontWeight: 500
                }}>
                  {w} {count !== undefined ? `(${count})` : '...'}
                  <button
                    onClick={() => removeKeyword(w)}
                    style={{
                      background: 'none', border: 'none', padding: 0, margin: 0, display: 'flex',
                      color: 'var(--primary)', cursor: 'pointer', opacity: 0.7
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Catégories Rapides */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginRight: '0.25rem' }}>Catégories :</span>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: '6px',
                  height: 32, padding: "0 12px 0 10px", borderRadius: "100px",
                  border: isSelected ? `2px solid ${cat.color}` : "1px solid var(--border-light)", 
                  background: isSelected ? `color-mix(in srgb, ${cat.color} 10%, white)` : "var(--bg-base)",
                  cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600, fontSize: 13,
                  color: "var(--text-primary)",
                  boxShadow: isSelected ? `0 2px 8px color-mix(in srgb, ${cat.color} 20%, transparent)` : 'none',
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = cat.color;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "var(--border-light)";
                    e.currentTarget.style.transform = "none";
                  }
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: '1rem' }}>
        {/* 
          C'est ici que la carte Leaflet est intégrée indirectement !
          Le composant enfant ProspectMap va se charger d'initialiser Leaflet et d'afficher les 'points' transmis en props,
          en appliquant éventuellement des filtres (keywordIds, categoryId) calculés plus haut avec useMemo.
        */}
        <div className="card" style={{ flex: 1, minHeight: 0, padding: 0, overflow: 'hidden' }}>
          <ProspectMap 
            userRegion={activeRegion || undefined} 
            points={points}
            loading={loadingPoints}
            keywordIds={keywordIds}
            categoryId={selectedCategory}
            selectedAssoId={selectedAssoId}
            onSelectAsso={setSelectedAssoId}
            cityToZoom={cityToZoom}
          />
        </div>

        {/* Panneau latéral (Détails Asso) */}
        {selectedAssoId && (
          <div className="card animate-slide-in-right" style={{ 
            width: '400px', flexShrink: 0, display: 'flex', flexDirection: 'column', 
            overflowY: 'auto', borderLeft: '1px solid var(--border-light)' 
          }}>
            {!selectedAssoData ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ color: 'var(--text-muted)' }}>Chargement des infos...</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {selectedAssoData.name}
                  </h2>
                  <button 
                    onClick={() => setSelectedAssoId(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                  >
                    <X size={20} />
                  </button>
                </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                <span>{selectedAssoData.address || selectedAssoData.city}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <CalendarDays size={16} style={{ color: 'var(--text-muted)' }} />
                <span>Créée en {selectedAssoData.creationDate?.split('-')[0] || "Année inconnue"}</span>
              </div>
              <a 
                href={`https://www.google.com/search?q=${encodeURIComponent(selectedAssoData.name + " " + (selectedAssoData.city || ""))}`} 
                target="_blank" 
                rel="noreferrer" 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', 
                  padding: '0.5rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', 
                  borderRadius: '6px', color: '#475569', textDecoration: 'none', fontWeight: 600, width: 'fit-content'
                }}
              >
                <Search size={16} /> Rechercher sur Google
              </a>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Objet de l'association
              </h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                {selectedAssoData.description || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Aucune description renseignée.</span>}
              </p>
            </div>

            {(selectedAssoData.social?.website || selectedAssoData.social?.facebook || selectedAssoData.social?.instagram || selectedAssoData.social?.helloasso) && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  Liens & Contacts
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {selectedAssoData.social?.website && (
                    <a href={selectedAssoData.social.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', color: '#3b82f6', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                      <Globe size={16} /> Site web
                    </a>
                  )}
                  {selectedAssoData.social?.facebook && (
                    <a href={selectedAssoData.social.facebook} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#e0f2fe', color: '#1877f2', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                      <Globe size={16} /> Facebook
                    </a>
                  )}
                  {selectedAssoData.social?.instagram && (
                    <a href={selectedAssoData.social.instagram} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#fce7f3', color: '#ec4899', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                      <Globe size={16} /> Instagram
                    </a>
                  )}
                  {selectedAssoData.social?.helloasso && (
                    <a href={selectedAssoData.social.helloasso} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#fef08a', color: '#ca8a04', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                      <ExternalLink size={16} /> HelloAsso
                    </a>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  handleAddProspect(selectedAssoData);
                  setSelectedAssoId(null);
                }}
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1rem' }}
              >
                Ajouter aux prospects
              </button>
            </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
