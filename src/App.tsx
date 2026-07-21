
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
