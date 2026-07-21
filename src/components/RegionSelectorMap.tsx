import { useMemo, useState } from "react";
import { FR_VIEWBOX, FR_DEPT_PATHS } from "../data/fr-departements-paths";
import { FR_DROM_VIEWBOX, FR_DROM_PATHS } from "../data/fr-drom-paths";
import { COVERED } from "../data/departements";

interface RegionSelectorMapProps {
  onSelectRegion: (region: string) => void;
}

export function RegionSelectorMap({ onSelectRegion }: RegionSelectorMapProps) {
  const [hoverRegion, setHoverRegion] = useState<string | null>(null);
  
  const codes = useMemo(() => Object.keys(FR_DEPT_PATHS), []);
  const droms = useMemo(() => FR_DROM_PATHS.filter((d) => d.code in COVERED), []);

  const REGION_COLORS: Record<string, string> = {
    'Auvergne-Rhône-Alpes': '#FFB3BA',
    'Bourgogne-Franche-Comté': '#FFDFBA',
    'Bretagne': '#FFFFBA',
    'Centre-Val de Loire': '#BAFFC9',
    'Corse': '#BAE1FF',
    'Grand Est': '#D7BDE2',
    'Hauts-de-France': '#F9E79F',
    'Île-de-France': '#A9CCE3',
    'Normandie': '#F1948A',
    'Nouvelle-Aquitaine': '#73C6B6',
    'Occitanie': '#F8C471',
    'Pays de la Loire': '#ff2d78',
    'Provence-Alpes-Côte d\'Azur': '#E59866'
  };

  const getColor = (region: string, isHovered: boolean) => {
    const baseColor = REGION_COLORS[region] || '#2b59ff';
    return isHovered ? baseColor : `color-mix(in srgb, ${baseColor} 40%, white)`;
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        {hoverRegion ? (
          <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>
            {hoverRegion}
          </span>
        ) : (
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--muted)" }}>
            Cliquez sur une région pour accéder à sa carte
          </span>
        )}
      </div>

      <svg viewBox={FR_VIEWBOX} role="img" aria-label="Carte des régions"
        style={{ width: "100%", maxWidth: 600, height: "auto", maxHeight: "65vh", overflow: "visible" }}>
        {codes.map((code) => {
          const meta = COVERED[code];
          if (!meta) return null;
          
          const isH = hoverRegion === meta.region;
          const fill = getColor(meta.region, isH);
          
          return (
            <path
              key={code}
              d={FR_DEPT_PATHS[code]}
              onMouseEnter={() => setHoverRegion(meta.region)}
              onMouseLeave={() => setHoverRegion(null)}
              onClick={() => onSelectRegion(meta.region)}
              style={{
                fill: fill,
                stroke: "#ffffff",
                strokeWidth: 1.2,
                cursor: "pointer",
                transformBox: "fill-box",
                transformOrigin: "center",
                transform: isH ? "scale(1.02)" : "scale(1)",
                transition: "fill .2s, transform .2s",
                outline: "none",
              }}
            />
          );
        })}
      </svg>

      {droms.length > 0 && (
        <div style={{ marginTop: 24, width: "100%", maxWidth: 520 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18 }}>
            {droms.map(({ code, nom, d }) => {
              const m = COVERED[code];
              if (!m) return null;
              const isH = hoverRegion === 'OUTRE-MER';
              const fill = getColor(m.region, isH);
              
              return (
                <button
                  key={code}
                  onClick={() => onSelectRegion('OUTRE-MER')}
                  onMouseEnter={() => setHoverRegion('OUTRE-MER')}
                  onMouseLeave={() => setHoverRegion(null)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    border: "none", background: "none", cursor: "pointer", padding: 0,
                  }}
                >
                  <svg viewBox={FR_DROM_VIEWBOX} width={52} height={52} aria-hidden="true" style={{ overflow: "visible" }}>
                    <path
                      d={d}
                      style={{
                        fill: fill,
                        stroke: "#ffffff", strokeWidth: 1.4,
                        transformBox: "fill-box", transformOrigin: "center",
                        transform: isH ? "scale(1.1)" : "scale(1)",
                        transition: "fill .2s, transform .2s",
                      }}
                    />
                  </svg>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isH ? "var(--ink)" : "var(--ink-2)" }}>
                    {nom}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
