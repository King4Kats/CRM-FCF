import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../contexts/AuthContext';
import { useEvents, type CalendarEvent } from '../contexts/EventsContext';
import { Calendar as CalendarIcon, MapPin, Plus, X, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { EventFormModal } from '../components/EventFormModal';
import { useToast } from '../contexts/ToastContext';

const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const CustomToolbar = (toolbar: any) => {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToCurrent = () => toolbar.onNavigate('TODAY');

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button onClick={goToCurrent} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}>Aujourd'hui</button>
        <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <button onClick={goToBack} style={{ padding: '0.375rem 0.5rem', background: 'white', border: 'none', borderRight: '1px solid var(--border-light)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={18} color="var(--text-secondary)" />
          </button>
          <button onClick={goToNext} style={{ padding: '0.375rem 0.5rem', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={18} color="var(--text-secondary)" />
          </button>
        </div>
      </div>
      
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize', margin: 0 }}>
        {toolbar.label}
      </h2>

      <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface-hover)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
        {toolbar.views.map((v: string) => {
          const isSelected = toolbar.view === v;
          return (
            <button 
              key={v}
              onClick={() => toolbar.onView(v)}
              style={{
                padding: '0.375rem 1rem',
                background: isSelected ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: isSelected ? 600 : 500,
                color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: '0.875rem',
                boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
               {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : v === 'day' ? 'Jour' : 'Agenda'}
            </button>
          )
        })}
      </div>
    </div>
  );
};

export const Agenda = () => {
  const { profile } = useAuth();
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { showConfirm, showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Filtrer les événements selon le rôle
  const filteredEvents = events.filter(e => {
    if (profile?.role === 'regional' && profile.region) {
      return e.type === 'national' || e.region === profile.region;
    }
    return true;
  });

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6'; // default blue
    let borderColor = '#2563eb';

    switch (event.type) {
      case 'national':
        backgroundColor = '#10b981'; // emerald
        borderColor = '#059669';
        break;
      case 'rappel':
        backgroundColor = '#f59e0b'; // amber
        borderColor = '#d97706';
        break;
      case 'regional':
        backgroundColor = '#8b5cf6'; // violet
        borderColor = '#7c3aed';
        break;
    }

    if (event.isDone) {
      backgroundColor = 'var(--bg-surface-hover)';
      borderColor = 'var(--border-light)';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: event.isDone ? 'var(--text-muted)' : 'white',
        borderRadius: '6px',
        border: '1px solid',
        display: 'block',
        textDecoration: event.isDone ? 'line-through' : 'none',
        opacity: event.isDone ? 0.8 : 1
      }
    };
  };

  const handleFormSubmit = async (data: Omit<CalendarEvent, 'id'>) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
    } else {
      await addEvent(data);
    }
  };

  const handleDelete = () => {
    if (selectedEvent) {
      showConfirm("Êtes-vous sûr de vouloir supprimer cet événement ?", async () => {
        await deleteEvent(selectedEvent.id);
        setSelectedEvent(null);
        showToast("Événement supprimé", "error");
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <EventFormModal 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); setEditingEvent(null); }} 
        onSubmit={handleFormSubmit}
        initialData={editingEvent}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem' }}>Agenda</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Gestion des événements et suivi des relances.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingEvent(null); setIsFormOpen(true); }}>
          <Plus size={18} />
          Nouvel Événement
        </button>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Événements Nationaux</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#8b5cf6' }}></div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Événements Régionaux</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Relances & Rappels</span>
        </div>
      </div>

      <div className="card" style={{ height: '700px', padding: '1rem' }}>
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', fontFamily: 'inherit' }}
          culture="fr"
          date={currentDate}
          onNavigate={(newDate: Date) => setCurrentDate(newDate)}
          view={currentView as any}
          onView={(newView: any) => setCurrentView(newView)}
          messages={{
            next: "Suivant",
            previous: "Précédent",
            today: "Aujourd'hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            agenda: "Agenda",
            date: "Date",
            time: "Heure",
            event: "Événement",
            noEventsInRange: "Aucun événement dans cette période."
          }}
          components={{
            toolbar: CustomToolbar
          }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event: any) => setSelectedEvent(event as CalendarEvent)}
        />
      </div>

      {selectedEvent && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-base)', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '90%', position: 'relative' }}>
            <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} color="var(--text-muted)" />
            </button>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: selectedEvent.isDone ? 'line-through' : 'none' }}>
              <CalendarIcon size={20} color={selectedEvent.isDone ? "var(--text-muted)" : "var(--primary)"} /> 
              {selectedEvent.title}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', backgroundColor: selectedEvent.isDone ? '#f0fdf4' : 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <input 
                  type="checkbox" 
                  className="custom-checkbox" 
                  checked={selectedEvent.isDone} 
                  onChange={async (e) => {
                    const isDone = e.target.checked;
                    await updateEvent(selectedEvent.id, { isDone });
                    setSelectedEvent(prev => prev ? { ...prev, isDone } : null);
                  }}
                />
                <span style={{ fontWeight: 500, color: selectedEvent.isDone ? '#166534' : 'var(--text-primary)' }}>
                  Marquer comme fait
                </span>
              </label>

              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <strong>Début :</strong> {format(selectedEvent.start, 'PPp', { locale: fr })}<br/>
                <strong>Fin :</strong> {format(selectedEvent.end, 'PPp', { locale: fr })}
              </p>
              {selectedEvent.region && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <MapPin size={16} /> Région {selectedEvent.region}
                </div>
              )}
              {selectedEvent.description && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-muted)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {selectedEvent.description}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => { setEditingEvent(selectedEvent); setIsFormOpen(true); setSelectedEvent(null); }} 
                  className="btn-icon"
                  title="Modifier"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={handleDelete} 
                  className="btn-icon danger"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="btn btn-secondary">
                Fermer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
