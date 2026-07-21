import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Building, ChevronRight } from 'lucide-react';
import type { Suggestion } from '../lib/gemenskarteApi';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  suggestions: Suggestion[];
  cities: { name: string; count: number }[];
  onPickCity: (city: string) => void;
  onPickAsso: (id: string) => void;
  onSubmit: () => void;
}

export const SearchBar = ({ value, onChange, suggestions, cities, onPickCity, onPickAsso, onSubmit }: SearchBarProps) => {
  const [focused, setFocused] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFocused(false);
    onSubmit();
  };

  const showDropdown = focused && (suggestions.length > 0 || cities.length > 0 || value.trim().length > 0);

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-base)',
        border: focused ? '2px solid var(--primary)' : '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '0 1rem',
        boxShadow: focused ? '0 0 0 4px rgba(37, 99, 235, 0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s',
        height: '3rem'
      }}>
        <Search size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Rechercher une association, un mot-clé ou une ville..."
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            padding: '0 0.75rem',
            fontSize: '1rem',
            outline: 'none',
            color: 'var(--text-primary)'
          }}
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', height: 'auto' }}
        >
          Chercher
        </button>
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'var(--bg-base)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          zIndex: 2000
        }}>
          
          {/* Villes matchées */}
          {cities.length > 0 && (
            <div style={{ padding: '0.5rem 0', borderBottom: suggestions.length > 0 ? '1px solid var(--border-light)' : 'none' }}>
              <div style={{ padding: '0.25rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Villes
              </div>
              {cities.map(c => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => { onPickCity(c.name); setFocused(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '0.5rem 1rem', border: 'none', background: 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-soft)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={16} color="var(--primary)" />
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.count} associations</span>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions d'associations */}
          {suggestions.length > 0 && (
            <div style={{ padding: '0.5rem 0' }}>
              <div style={{ padding: '0.25rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Associations
              </div>
              {suggestions.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { onPickAsso(s.id); setFocused(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '0.5rem 1rem', border: 'none', background: 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-soft)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <Building size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.25rem' }}>
                        {s.city} {s.department ? `(${s.department})` : ''}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--border-light)" />
                </button>
              ))}
            </div>
          )}

          {/* Appuyer sur Entrée pour filtrer */}
          {suggestions.length === 0 && cities.length === 0 && value.trim().length > 0 && (
            <button
              type="button"
              onClick={() => { onSubmit(); setFocused(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'var(--bg-soft)',
                cursor: 'pointer', textAlign: 'left', color: 'var(--primary)', fontWeight: 500
              }}
            >
              <Search size={16} />
              Filtrer la carte pour "{value}"
            </button>
          )}

        </div>
      )}
    </form>
  );
};
