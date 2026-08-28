import { createPortal } from 'react-dom';
import { X, Download, FileText, Image as ImageIcon, FileArchive, FileSpreadsheet } from 'lucide-react';
import { type FileNode } from '../pages/Documents';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileNode | null;
  onDownload: (name: string) => void;
}

export const DocumentViewerModal = ({ isOpen, onClose, file, onDownload }: DocumentViewerModalProps) => {
  if (!isOpen || !file) return null;

  const isPDF = file.name.endsWith('.pdf');
  const isImage = file.name.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
  const isZip = file.name.endsWith('.zip') || file.name.endsWith('.rar');
  const isOffice = file.name.match(/\.(docx|xlsx|pptx)$/i) != null;

  const getIcon = () => {
    if (isImage) return <ImageIcon size={24} color="#3b82f6" />;
    if (isZip) return <FileArchive size={24} color="#f59e0b" />;
    if (isOffice) return <FileSpreadsheet size={24} color="#10b981" />;
    return <FileText size={24} color="#ef4444" />;
  };

  return createPortal(
    <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
      
      {/* Topbar */}
      <div style={{ height: '64px', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {getIcon()}
          <span style={{ fontSize: '1.125rem', fontWeight: 500 }}>{file.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => onDownload(file.name)}
            className="btn" 
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          >
            <Download size={18} /> Télécharger
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)' }}></div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseOver={(e) => e.currentTarget.style.color = 'white'}
            onMouseOut={(e) => e.currentTarget.style.color = '#9CA3AF'}
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Viewer Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        
        {isZip && (
          <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
            <FileArchive size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
            <h2 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 600 }}>Archive compressée</h2>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.6 }}>Cet aperçu n'est pas disponible pour les archives.<br/>Veuillez télécharger le fichier pour en extraire le contenu.</p>
          </div>
        )}

        {(isPDF || isOffice || (!isZip && !isImage)) && (
          <div style={{ width: '100%', maxWidth: '900px', height: '100%', backgroundColor: '#F9FAFB', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            {/* Fake header Collabora / Viewer */}
            <div style={{ height: '48px', backgroundColor: '#E5E7EB', borderBottom: '1px solid #D1D5DB', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: isPDF ? '#ef4444' : '#2563eb', borderRadius: '4px' }}></div>
              <div style={{ height: '8px', width: '200px', backgroundColor: '#9CA3AF', borderRadius: '4px', opacity: 0.5 }}></div>
              
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#D1D5DB', borderRadius: '4px' }}></div>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#D1D5DB', borderRadius: '4px' }}></div>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#D1D5DB', borderRadius: '4px' }}></div>
              </div>
            </div>
            
            {/* Fake Content Document */}
            <div style={{ flex: 1, padding: '4rem 5rem', overflowY: 'auto', backgroundColor: '#F3F4F6' }}>
              <div style={{ backgroundColor: 'white', padding: '4rem', minHeight: '100%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}>
                <div style={{ width: '100%', height: '40px', backgroundColor: '#E5E7EB', borderRadius: '4px', marginBottom: '3rem' }}></div>
                <div style={{ width: '100%', height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', marginBottom: '1rem' }}></div>
                <div style={{ width: '90%', height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', marginBottom: '1rem' }}></div>
                <div style={{ width: '95%', height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', marginBottom: '1rem' }}></div>
                <div style={{ width: '80%', height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', marginBottom: '3rem' }}></div>
                
                <div style={{ width: '100%', height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', marginBottom: '1rem' }}></div>
                <div style={{ width: '85%', height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', marginBottom: '1rem' }}></div>
                <div style={{ width: '90%', height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', marginBottom: '1rem' }}></div>

                <div style={{ marginTop: '5rem', textAlign: 'center', color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>
                  Aperçu Intégré (Simulation {isPDF ? 'PDF Viewer' : 'Collabora Online'})<br/>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, marginTop: '0.5rem', display: 'inline-block' }}>Un serveur externe est requis pour la version finale.</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
