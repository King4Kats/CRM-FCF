import { useState, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Folder, FileText, Download, Upload, Trash2, Loader2, CheckCircle2, ChevronRight, FolderPlus, ArrowLeft, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { useToast } from '../contexts/ToastContext';

export type FileNode = {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  size?: string;
  uploadDate: string;
  parentId: string | null;
  region: string | 'national';
};

const INITIAL_NODES: FileNode[] = [
  // Racines
  { id: 'nat_root', name: 'Espace National', type: 'folder', uploadDate: '01/01/2024', parentId: null, region: 'national' },
  { id: 'bretagne_root', name: 'Région Bretagne', type: 'folder', uploadDate: '01/01/2024', parentId: null, region: 'BRETAGNE' },
  { id: 'paca_root', name: 'Région PACA', type: 'folder', uploadDate: '01/01/2024', parentId: null, region: 'PACA' },
  { id: 'idf_root', name: 'Région Ile-de-France', type: 'folder', uploadDate: '01/01/2024', parentId: null, region: 'ILE-DE-FRANCE' },
  
  // Sous-dossiers National
  { id: 'nat_2024', name: '2024', type: 'folder', uploadDate: '01/01/2024', parentId: 'nat_root', region: 'national' },
  { id: 'nat_templates', name: 'Modèles & Templates', type: 'folder', uploadDate: '01/01/2024', parentId: 'nat_root', region: 'national' },
  
  // Fichiers National
  { id: 'f1', name: 'Dossier_adhesion_FCF_2024.pdf', type: 'file', mimeType: 'application/pdf', size: '2.4 MB', uploadDate: '10/05/2024', parentId: 'nat_2024', region: 'national' },
  { id: 'f2', name: 'Charte_Graphique_Logos.zip', type: 'file', mimeType: 'application/zip', size: '15.2 MB', uploadDate: '01/02/2024', parentId: 'nat_templates', region: 'national' },
  { id: 'f3', name: 'Mode_opératoire_CRM.pdf', type: 'file', mimeType: 'application/pdf', size: '4.1 MB', uploadDate: '20/07/2024', parentId: 'nat_root', region: 'national' },
  
  // Sous-dossiers Bretagne
  { id: 'bretagne_adhesions', name: 'Adhésions 2024', type: 'folder', uploadDate: '15/05/2024', parentId: 'bretagne_root', region: 'BRETAGNE' },
  { id: 'bretagne_f1', name: 'Adhesion_Festival_Celtique.pdf', type: 'file', mimeType: 'application/pdf', size: '1.1 MB', uploadDate: '16/05/2024', parentId: 'bretagne_adhesions', region: 'BRETAGNE' },
];

export const Documents = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const userRegion = profile?.region;

  const [nodes, setNodes] = useState<FileNode[]>(INITIAL_NODES);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [viewingFile, setViewingFile] = useState<FileNode | null>(null);
  
  const { showToast, showConfirm } = useToast();

  const currentFolder = nodes.find(n => n.id === currentFolderId);
  
  // RBAC for write operations
  const canWrite = useMemo(() => {
    if (isAdmin) return true;
    if (profile?.role === 'regional') {
      return currentFolder !== undefined && currentFolder.region === userRegion;
    }
    return false;
  }, [isAdmin, profile, currentFolder, userRegion]);

  // Breadcrumb path
  const breadcrumb = useMemo(() => {
    const path: FileNode[] = [];
    let current = currentFolder;
    while (current) {
      path.unshift(current);
      current = nodes.find(n => n.id === current?.parentId) || undefined;
    }
    return path;
  }, [currentFolderId, nodes]);

  const visibleNodes = useMemo(() => {
    let filtered = nodes.filter(n => n.parentId === currentFolderId);
    
    if (currentFolderId === null) {
      if (!isAdmin) {
        // Régional voit son propre dossier racine ET le dossier national
        filtered = filtered.filter(n => n.region === 'national' || n.region === userRegion);
      }
    }
    
    // Trier : Dossiers d'abord, par ordre alphabétique
    return filtered.sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [nodes, currentFolderId, isAdmin, userRegion]);


  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploading(true);
      
      await new Promise(r => setTimeout(r, 1000));
      
      const newDoc: FileNode = {
        id: Math.random().toString(),
        name: file.name,
        type: 'file',
        mimeType: file.type || 'application/octet-stream',
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        uploadDate: new Date().toLocaleDateString('fr-FR'),
        parentId: currentFolderId,
        region: currentFolder?.region || (isAdmin ? 'national' : userRegion || 'national')
      };
      
      setNodes([...nodes, newDoc]);
      setUploading(false);
      setSuccessMsg("Document mis en ligne avec succès.");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    const newFolder: FileNode = {
      id: Math.random().toString(),
      name: newFolderName,
      type: 'folder',
      uploadDate: new Date().toLocaleDateString('fr-FR'),
      parentId: currentFolderId,
      region: currentFolder?.region || (isAdmin ? 'national' : userRegion || 'national')
    };

    setNodes([...nodes, newFolder]);
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
    setSuccessMsg("Dossier créé.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDelete = (id: string) => {
    showConfirm("Êtes-vous sûr de vouloir supprimer cet élément ? (S'il s'agit d'un dossier, tout son contenu sera perdu)", () => {
      const recursiveDelete = (nodeId: string, currentNodes: FileNode[]): FileNode[] => {
        let newNodes = currentNodes.filter(n => n.id !== nodeId);
        const children = currentNodes.filter(n => n.parentId === nodeId);
        for (const child of children) {
          newNodes = recursiveDelete(child.id, newNodes);
        }
        return newNodes;
      };
      
      setNodes(prev => recursiveDelete(id, prev));
      showToast("Élément supprimé", "error");
    });
  };

  const handleDownload = (name: string) => {
    showToast(`Le téléchargement de ${name} commence...`, "info");
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      <DocumentViewerModal 
        isOpen={viewingFile !== null}
        onClose={() => setViewingFile(null)}
        file={viewingFile}
        onDownload={handleDownload}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
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
            Espace de stockage partagé et sécurisé.
          </p>
        </div>
        
        {canWrite && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setIsNewFolderModalOpen(true)}
              className="btn btn-secondary"
            >
              <FolderPlus size={18} />
              Nouveau Dossier
            </button>
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
        <div className="animate-fade-in" style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} />
          {successMsg}
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
        {currentFolderId !== null && (
          <button 
            onClick={() => setCurrentFolderId(currentFolder?.parentId || null)} 
            className="btn-icon"
            style={{ marginRight: '0.5rem' }}
            title="Retour au dossier parent"
          >
            <ArrowLeft size={20} color="var(--text-secondary)" />
          </button>
        )}
        
        <button 
          onClick={() => setCurrentFolderId(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: currentFolderId === null ? 'var(--text-primary)' : 'var(--primary)', fontWeight: currentFolderId === null ? 600 : 500, fontSize: '1rem' }}
        >
          Accueil
        </button>

        {breadcrumb.map((node, index) => (
          <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChevronRight size={16} color="var(--text-muted)" />
            <button 
              onClick={() => setCurrentFolderId(node.id)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: index === breadcrumb.length - 1 ? 'var(--text-primary)' : 'var(--primary)', 
                fontWeight: index === breadcrumb.length - 1 ? 600 : 500,
                fontSize: '1rem'
              }}
            >
              {node.name}
            </button>
          </div>
        ))}
      </div>

      {/* Liste des documents */}
      <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Propriétaire</th>
              <th>Date d'ajout</th>
              <th>Taille</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleNodes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <FolderPlus size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                  Ce dossier est vide.
                </td>
              </tr>
            ) : (
              visibleNodes.map(node => (
                <tr key={node.id} style={{ cursor: 'pointer' }} onClick={(e) => {
                  if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).closest('button') === null) {
                    if (node.type === 'folder') {
                      setCurrentFolderId(node.id);
                    } else {
                      setViewingFile(node);
                    }
                  }
                }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        color: node.type === 'folder' ? '#fbbf24' : node.name.endsWith('.pdf') ? '#ef4444' : node.name.endsWith('.zip') ? '#f59e0b' : '#3b82f6',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {node.type === 'folder' ? <Folder size={24} fill="#fde68a" /> : <FileText size={20} />}
                      </div>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{node.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: node.region === 'national' ? '#e0e7ff' : '#fce7f3', color: node.region === 'national' ? '#3730a3' : '#9d174d' }}>
                      {node.region === 'national' ? 'National' : node.region}
                    </span>
                  </td>
                  <td>{node.uploadDate}</td>
                  <td>{node.size || '--'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      {node.type === 'file' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDownload(node.name); }}
                          className="btn-icon" 
                          style={{ color: 'var(--primary)' }}
                          title="Télécharger"
                        >
                          <Download size={18} />
                        </button>
                      )}
                      
                      {canWrite && (node.region === userRegion || isAdmin) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }}
                          className="btn-icon danger" 
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
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

      {/* Modal Création Dossier */}
      {isNewFolderModalOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-base)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <FolderPlus size={20} color="var(--primary)" /> Nouveau dossier
              </h3>
              <button onClick={() => setIsNewFolderModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>
            
            <form onSubmit={handleCreateFolder}>
              <div className="input-group">
                <label>Nom du dossier</label>
                <input 
                  type="text"
                  autoFocus
                  required
                  className="input-field"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="ex: Adhésions 2024"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsNewFolderModalOpen(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={!newFolderName.trim()}>
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
