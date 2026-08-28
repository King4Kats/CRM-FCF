import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'national' | 'regional' | 'rappel';
  region?: string;
  description?: string;
  isAllDay?: boolean;
  isDone?: boolean;
};

// Initial mock data
const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Congrès National FCF',
    start: new Date(new Date().setHours(9, 0, 0, 0)),
    end: new Date(new Date().setHours(18, 0, 0, 0)),
    type: 'national',
    description: 'Rassemblement de toutes les régions FCF',
    isDone: false,
  },
  {
    id: '2',
    title: 'Relance: Festival Celtique',
    start: new Date(new Date().getTime() + 86400000), // Demain
    end: new Date(new Date().getTime() + 86400000 + 3600000),
    type: 'rappel',
    region: 'BRETAGNE',
    description: 'Relancer le président pour la cotisation',
    isDone: false,
  }
];

interface EventsContextType {
  events: CalendarEvent[];
  loading: boolean;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [profile]);

  const fetchEvents = async () => {
    setLoading(true);
    // TODO: When connecting to real backend, fetch from Supabase.
    // For now, use local state initialized with mocks.
    
    // Si on a un environnement mock, on garde simplement notre state local.
    // Au premier chargement, on l'initialise s'il est vide.
    setEvents((prev) => prev.length > 0 ? prev : MOCK_EVENTS);
    setLoading(false);
  };

  const addEvent = async (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Math.random().toString(36).substring(2, 9),
    };
    
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setEvents((prev) => [...prev, newEvent]);
      return;
    }

    // TODO: Supabase integration
    setEvents((prev) => [...prev, newEvent]);
  };

  const updateEvent = async (id: string, eventData: Partial<CalendarEvent>) => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...eventData } : e)));
      return;
    }

    // TODO: Supabase integration
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...eventData } : e)));
  };

  const deleteEvent = async (id: string) => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      return;
    }

    // TODO: Supabase integration
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <EventsContext.Provider value={{ events, loading, addEvent, updateEvent, deleteEvent }}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};
