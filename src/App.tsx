
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { SuiviProspect } from './pages/SuiviProspect';
import { RechercheProspect } from './pages/RechercheProspect';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Documents } from './pages/Documents';

/**
 * Le composant ProtectedRoute agit comme un "gardien".
 * Son rôle est d'empêcher un utilisateur non connecté d'accéder aux pages internes du CRM.
 * S'il n'y a pas de session active, il redirige de force vers la page de login.
 * 
 * @param children - Les composants enfants qui seront affichés si l'utilisateur est autorisé.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;
  }
  
  if (!session) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

/**
 * AppRoutes centralise toutes les routes (URL) de l'application.
 * On utilise react-router-dom pour gérer la navigation sans recharger la page (Single Page Application).
 */
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="documents" element={<Documents />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
        <Route path="prospects">
          <Route path="suivi" element={<SuiviProspect />} />
          <Route path="recherche" element={<RechercheProspect />} />
          <Route index element={<Navigate to="suivi" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

/**
 * Composant Racine de l'application.
 * Il enveloppe toute l'application avec les "Providers" (fournisseurs de contexte) nécessaires :
 * - AuthProvider : Pour rendre les infos de l'utilisateur disponibles partout.
 * - BrowserRouter : Pour activer le système de routage.
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
