import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ClipboardCheck,
  Clock, Users, Fingerprint, LogOut, Settings, User
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
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();
  const initials = user?.login.slice(0, 2).toUpperCase() ?? 'US';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <div className="dropdown" ref={menuRef} style={{ width: '100%' }}>
            <button
              className="user-info"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ width: '100%', background: menuOpen ? 'var(--color-surface-hover)' : 'transparent', textAlign: 'left', border: 'none' }}
            >
              <div className="user-avatar">{initials}</div>
              <div className="user-details">
                <div className="user-name">{user?.login}</div>
                <div className="user-role">{user?.roles[0]}</div>
              </div>
            </button>
            {menuOpen && (
              <div className="dropdown-menu dropdown-menu-up">
                <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/perfil'); }}>
                  <span className="dropdown-icon"><User size={15} /></span> Mi Perfil
                </button>
                <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/configuracion'); }}>
                  <span className="dropdown-icon"><Settings size={15} /></span> Configuración
                </button>
                <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
                <button className="dropdown-item danger" onClick={() => { setMenuOpen(false); logout(); }}>
                  <span className="dropdown-icon"><LogOut size={15} /></span> Cerrar sesión
                </button>
              </div>
            )}
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
