import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { type CalendarEvent } from '../contexts/EventsContext';
import { format } from 'date-fns';

export type EventFormData = {
  title: string;
  start: string;
  end: string;
  type: 'national' | 'regional' | 'rappel';
  region?: string;
  description?: string;
  isAllDay: boolean;
};

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CalendarEvent, 'id'>) => void;
  initialData?: CalendarEvent | null;
  // Permet de pré-remplir depuis les pages Adhérents/Prospects
  prefillData?: Partial<EventFormData>;
}

export const EventFormModal = ({ isOpen, onClose, onSubmit, initialData, prefillData }: EventFormModalProps) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"), // +1 heure
    type: profile?.role === 'admin' ? 'national' : 'rappel',
    region: profile?.region || '',
    description: '',
    isAllDay: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        start: format(initialData.start, "yyyy-MM-dd'T'HH:mm"),
        end: format(initialData.end, "yyyy-MM-dd'T'HH:mm"),
        type: initialData.type,
        region: initialData.region || profile?.region || '',
        description: initialData.description || '',
        isAllDay: initialData.isAllDay || false,
      });
    } else if (prefillData) {
      setFormData(prev => ({
        ...prev,
        ...prefillData,
        // Si admin pré-remplit un rappel pour une asso, le forcer en rappel
        type: prefillData.type || (profile?.role === 'admin' ? 'national' : 'rappel'),
      }));
    } else {
      // Reset
      setFormData({
        title: '',
        start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"),
        type: profile?.role === 'admin' ? 'national' : 'rappel',
        region: profile?.region || '',
        description: '',
        isAllDay: false,
      });
    }
  }, [initialData, prefillData, isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventToSubmit: Omit<CalendarEvent, 'id'> = {
      title: formData.title,
      start: new Date(formData.start),
      end: new Date(formData.end),
      type: formData.type,
      region: formData.type !== 'national' ? formData.region : undefined,
      description: formData.description,
      isAllDay: formData.isAllDay,
      isDone: initialData?.isDone || false,
    };
    
    onSubmit(eventToSubmit);
    onClose();
  };

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-base)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
            <Calendar size={20} color="var(--primary)" />
            {initialData ? "Modifier l'événement" : "Nouvel événement"}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label>Titre de l'événement</label>
            <input 
              type="text" 
              required 
              className="input-field" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Réunion de bureau"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Date de début</label>
              <input 
                type={formData.isAllDay ? "date" : "datetime-local"} 
                required 
                className="input-field" 
                value={formData.isAllDay ? formData.start.split('T')[0] : formData.start} 
                onChange={e => setFormData({...formData, start: e.target.value + (formData.isAllDay ? 'T00:00' : '')})}
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Date de fin</label>
              <input 
                type={formData.isAllDay ? "date" : "datetime-local"} 
                required 
                className="input-field" 
                value={formData.isAllDay ? formData.end.split('T')[0] : formData.end} 
                onChange={e => setFormData({...formData, end: e.target.value + (formData.isAllDay ? 'T23:59' : '')})}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="isAllDay"
              checked={formData.isAllDay}
              onChange={e => setFormData({...formData, isAllDay: e.target.checked})}
              className="custom-checkbox"
            />
            <label htmlFor="isAllDay" style={{ fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>Journée entière</label>
          </div>

          <div className="input-group">
            <label>Type d'événement</label>
            <select 
              className="input-field" 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value as 'national'|'regional'|'rappel'})}
            >
              {profile?.role === 'admin' && <option value="national">National (visible par tous)</option>}
              <option value="regional">Régional</option>
              <option value="rappel">Appel / Relance</option>
            </select>
          </div>

          {formData.type !== 'national' && profile?.role === 'admin' && (
            <div className="input-group">
              <label>Région (Optionnel)</label>
              <input 
                type="text" 
                className="input-field" 
                value={formData.region} 
                onChange={e => setFormData({...formData, region: e.target.value})}
                placeholder="Ex: BRETAGNE"
              />
            </div>
          )}

          <div className="input-group">
            <label>Description</label>
            <textarea 
              className="input-field" 
              rows={3} 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Notes, lien visio, détails..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {initialData ? "Enregistrer" : "Créer l'événement"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
