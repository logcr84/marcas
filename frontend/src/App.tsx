import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ReportesPage from './pages/ReportesPage';
import JustificacionesPage from './pages/JustificacionesPage';
import MisMarcasPage from './pages/MisMarcasPage';
import EmpleadosPage from './pages/EmpleadosPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children, roles, fallback = '/' }: { children: React.ReactNode, roles?: string[], fallback?: string }) {
  const { user, hasRole } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (roles && roles.length > 0) {
    const isAuthorized = roles.some(role => hasRole(role));
    if (!isAuthorized) return <Navigate to={fallback} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ProtectedRoute roles={['RRHH_ADMIN', 'JEFATURA', 'AUDITOR']} fallback="/mis-marcas"><Dashboard /></ProtectedRoute>} />
        <Route path="reportes" element={<ProtectedRoute roles={['RRHH_ADMIN', 'JEFATURA', 'AUDITOR']} fallback="/mis-marcas"><ReportesPage /></ProtectedRoute>} />
        <Route path="justificaciones" element={<JustificacionesPage />} />
        <Route path="mis-marcas" element={<MisMarcasPage />} />
        <Route path="empleados" element={<ProtectedRoute roles={['RRHH_ADMIN']} fallback="/mis-marcas"><EmpleadosPage /></ProtectedRoute>} />
        <Route path="configuracion" element={<SettingsPage />} />
        <Route path="perfil" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
