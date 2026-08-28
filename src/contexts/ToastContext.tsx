import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Info, AlertCircle, X, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'info' | 'error';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; message: string; onConfirm: () => void } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const showConfirm = useCallback((message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, message, onConfirm });
  }, []);

  const handleConfirmAction = () => {
    if (confirmState) {
      confirmState.onConfirm();
    }
    setConfirmState(null);
  };

  const getToastIcon = (type: ToastType) => {
    if (type === 'success') return <CheckCircle size={20} color="#10b981" />;
    if (type === 'error') return <AlertCircle size={20} color="#ef4444" />;
    return <Info size={20} color="#3b82f6" />;
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      
      {/* Container des Toasts */}
      {createPortal(
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem', pointerEvents: 'none' }}>
          {toasts.map(t => (
            <div key={t.id} className="animate-slide-up" style={{ 
              pointerEvents: 'auto',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              backgroundColor: 'white', color: '#1f2937',
              padding: '1rem 1.25rem', borderRadius: '8px', 
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              borderLeft: `4px solid ${t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#3b82f6'}`,
              minWidth: '300px'
            }}>
              {getToastIcon(t.type)}
              <span style={{ flex: 1, fontWeight: 500, fontSize: '0.95rem' }}>{t.message}</span>
              <button 
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Modale de Confirmation */}
      {confirmState?.isOpen && createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 24, 39, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="animate-scale-in" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '50%', color: '#dc2626' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#111827' }}>Confirmation requise</h3>
                <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.5 }}>{confirmState.message}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setConfirmState(null)} className="btn btn-secondary">
                Annuler
              </button>
              <button onClick={handleConfirmAction} className="btn btn-primary" style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: 'white' }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
