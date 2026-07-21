import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { CATEGORIES, catById } from '../lib/categories';

interface GeoPoint {
  id: string;
  name: string;
  categoryId: string;
  city: string | null;
  lng: number;
  lat: number;
  approx?: boolean;
}

interface ProspectMapProps {
  userRegion?: string;
  points: GeoPoint[];
  loading: boolean;
  keywordIds: Set<string> | null;
  categoryId: string | null;
  selectedAssoId: string | null;
  onSelectAsso: (id: string | null) => void;
  cityToZoom: string | null;
}

export const ProspectMap = ({ 
  userRegion, 
  points, 
  loading, 
  keywordIds, 
  categoryId,
  selectedAssoId, 
  onSelectAsso,
  cityToZoom 
}: ProspectMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapElRef = useRef<HTMLDivElement>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersMapRef = useRef<Record<string, L.Marker>>({});

  // 1. Initialiser la carte Leaflet (exécuté une seule fois)
  useEffect(() => {
    if (mapRef.current || !mapElRef.current) return;
    
    let center: [number, number] = [46.67, 2.0];
    let zoom = 6;
    if (userRegion === 'BRETAGNE') { center = [48.2, -2.9]; zoom = 8; }
    if (userRegion === 'PAYS DE LA LOIRE') { center = [47.3, -0.6]; zoom = 8; }
    if (userRegion === 'NORMANDIE') { center = [49.1, 0.3]; zoom = 8; }

    const map = L.map(mapElRef.current, { center, zoom, zoomControl: false });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    
    // Fond de carte BLANC (CartoDB Positron) comme demandé
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors, © CARTO",
      maxZoom: 19,
    }).addTo(map);
    
    mapRef.current = map;
    return () => { 
      map.remove(); 
      mapRef.current = null;
      clusterRef.current = null;
      markersMapRef.current = {};
    };
  }, [userRegion]);

  // 2. Mettre à jour les marqueurs en fonction des filtres (points, keywordIds, categoryId)
  const filteredPoints = useMemo(() => {
    return points.filter(p => 
      (keywordIds === null || keywordIds.has(p.id)) &&
      (categoryId === null || p.categoryId === categoryId)
    );
  }, [points, keywordIds, categoryId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!clusterRef.current) {
      clusterRef.current = L.markerClusterGroup({
        chunkedLoading: false,
        removeOutsideVisibleBounds: true,
        maxClusterRadius: 50,
        iconCreateFunction: (cluster) => {
          const markers = cluster.getAllChildMarkers();
          const counts: Record<string, number> = {};
          let maxCount = 0;
          let dominantCatId = CATEGORIES[0].id;
          
          for (const m of markers) {
            const catId = (m as any).options.catId;
            if (catId) {
              counts[catId] = (counts[catId] || 0) + 1;
              if (counts[catId] > maxCount) {
                maxCount = counts[catId];
                dominantCatId = catId;
              }
            }
          }
          
          const cat = catById(dominantCatId);
          const size = cluster.getChildCount();
          let c = 'marker-cluster-small';
          let dim = 30;
          let fontSize = 12;
          if (size >= 100) { c = 'marker-cluster-large'; dim = 46; fontSize = 14; }
          else if (size >= 10) { c = 'marker-cluster-medium'; dim = 38; fontSize = 13; }

          return L.divIcon({
            html: `<div style="background-color: ${cat.color}; width: ${dim}px; height: ${dim}px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: ${fontSize}px; font-family: sans-serif;">${size}</div>`,
            className: `marker-cluster custom-cluster ${c}`,
            iconSize: L.point(dim, dim),
            iconAnchor: L.point(dim / 2, dim / 2)
          });
        }
      });
      map.addLayer(clusterRef.current);
    }
    const group = clusterRef.current;
    group.clearLayers();
    markersMapRef.current = {};

    const markers = filteredPoints.map(p => {
      const cat = catById(p.categoryId);
      
      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background-color: ${cat.color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      const marker = L.marker([p.lat, p.lng], { icon, catId: cat.id } as any);

      marker.on('click', () => {
        onSelectAsso(p.id);
      });

      markersMapRef.current[p.id] = marker;
      return marker;
    });

    group.addLayers(markers);
  }, [filteredPoints, onSelectAsso]);

  // 3. Auto-cadrage de la carte selon les points chargés (particulièrement utile pour l'Outre-mer dispersé)
  useEffect(() => {
    const map = mapRef.current;
    if (map && points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [points]); // Se déclenche quand la liste principale de points est mise à jour depuis l'API

  // 4. Zoomer sur une association si sélectionnée depuis la recherche
  useEffect(() => {
    if (!selectedAssoId) return;
    const map = mapRef.current;
    const marker = markersMapRef.current[selectedAssoId];
    
    if (map && marker) {
      const p = filteredPoints.find(x => x.id === selectedAssoId);
      if (!p) return;
      
      // Zoome doucement vers le point
      map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 14), { duration: 0.5 });
    }
  }, [selectedAssoId, filteredPoints]);

  // 4. Zoomer sur une ville choisie
  useEffect(() => {
    if (!cityToZoom) return;
    const map = mapRef.current;
    if (!map) return;
    
    // Trouver tous les points de cette ville
    const cityPts = filteredPoints.filter(p => p.city?.toLowerCase().includes(cityToZoom.toLowerCase()));
    if (cityPts.length > 0) {
      const bounds = L.latLngBounds(cityPts.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true, duration: 0.7 });
    }
  }, [cityToZoom, filteredPoints]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)', zIndex: 1 }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1000, background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="spinner"></div>
            <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Chargement de la carte (RNA)...</p>
          </div>
        </div>
      )}
      <div ref={mapElRef} style={{ width: '100%', height: '100%', zIndex: 1, background: '#f8f9fa' }} />
    </div>
  );
};
