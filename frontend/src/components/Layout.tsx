import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ClipboardCheck,
  Clock, Users, Fingerprint, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={17} />, end: true },
  { to: '/reportes', label: 'Reportes', icon: <FileText size={17} />, roles: ['RRHH_ADMIN','JEFATURA','AUDITOR'] },
  { to: '/justificaciones', label: 'Justificaciones', icon: <ClipboardCheck size={17} /> },
  { to: '/mis-marcas', label: 'Mis Marcas', icon: <Clock size={17} /> },
  { to: '/empleados', label: 'Empleados', icon: <Users size={17} />, roles: ['RRHH_ADMIN'] },
];

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const initials = user?.login.slice(0, 2).toUpperCase() ?? 'US';

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Fingerprint size={20} color="white" />
          </div>
          <div className="sidebar-logo-text">
            Marcas
            <span>Control de Asistencia</span>
          </div>
        </div>

        <nav className="sidebar-nav" role="navigation" aria-label="Menú principal">
          <div className="nav-section-label">Menú</div>
          {navItems.map(item => {
            if (item.roles && !item.roles.some(r => hasRole(r))) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                {item.icon}
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <div className="user-name">{user?.login}</div>
              <div className="user-role">{user?.roles[0]}</div>
            </div>
            <button
              className="btn-logout"
              onClick={logout}
              title="Cerrar sesión"
              id="btn-logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
