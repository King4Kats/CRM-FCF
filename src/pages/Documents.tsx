import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Folder, FileText, Download, Upload, Trash2, FilePlus, Loader2, CheckCircle2 } from 'lucide-react';

type Document = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
};

// Documents fictifs pour la démo
const INITIAL_DOCS: Document[] = [
  { id: '1', name: 'Dossier_adhesion_FCF_2024.pdf', type: 'application/pdf', size: '2.4 MB', uploadDate: '10/05/2024' },
  { id: '2', name: 'CR_Reunion_Nationale_Juin.docx', type: 'application/msword', size: '850 KB', uploadDate: '15/06/2024' },
  { id: '3', name: 'Charte_Graphique_Logos.zip', type: 'application/zip', size: '15.2 MB', uploadDate: '01/02/2024' },
  { id: '4', name: 'Mode_opératoire_CRM.pdf', type: 'application/pdf', size: '4.1 MB', uploadDate: '20/07/2024' },
];

export const Documents = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCS);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploading(true);
      
      // Simulation d'un upload de 1 seconde
      await new Promise(r => setTimeout(r, 1000));
      
      const newDoc: Document = {
        id: Math.random().toString(),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        uploadDate: new Date().toLocaleDateString('fr-FR')
      };
      
      setDocuments([newDoc, ...documents]);
      setUploading(false);
      setSuccessMsg("Document mis en ligne avec succès.");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce document pour toutes les régions ?")) {
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  const handleDownload = (name: string) => {
    // Simuler un téléchargement
    alert(`(Simulation) Le téléchargement de ${name} commence...`);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'color-mix(in srgb, var(--primary) 10%, white)', borderRadius: '12px', color: 'var(--primary)' }}>
              <Folder size={28} />
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Documents & Ressources
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Retrouvez ici tous les documents officiels partagés par FCF France.
          </p>
        </div>
        
        {isAdmin && (
          <div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
            <button 
              onClick={handleUploadClick}
              className="btn btn-primary"
              disabled={uploading}
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              Mettre en ligne
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} />
          {successMsg}
        </div>
      )}

      {/* Liste des documents */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom du document</th>
              <th>Date d'ajout</th>
              <th>Taille</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <FilePlus size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                  Aucun document disponible pour le moment.
                </td>
              </tr>
            ) : (
              documents.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ color: doc.name.endsWith('.pdf') ? '#ef4444' : doc.name.endsWith('.zip') ? '#f59e0b' : '#3b82f6' }}>
                        <FileText size={20} />
                      </div>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{doc.name}</span>
                    </div>
                  </td>
                  <td>{doc.uploadDate}</td>
                  <td>{doc.size}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleDownload(doc.name)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem' }} 
                        title="Télécharger"
                      >
                        <Download size={18} color="var(--primary)" />
                      </button>
                      
                      {isAdmin && (
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.5rem' }} 
                          title="Supprimer"
                        >
                          <Trash2 size={18} color="var(--danger)" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
