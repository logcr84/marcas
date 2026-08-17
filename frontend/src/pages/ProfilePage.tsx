import { User, Shield, Building, CreditCard, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const initials = user?.login.slice(0, 2).toUpperCase() ?? 'US';

  return (
    <>
      <div className="page-header">
        <h1>Mi Perfil</h1>
        <p>Información de tu cuenta y roles en el sistema</p>
      </div>
      
      <div className="page-body">
        <div className="card" style={{ maxWidth: 800 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, paddingBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 700, color: '#fff',
              boxShadow: 'var(--shadow-md)'
            }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{user?.login}</h2>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-surface-hover)', padding: '4px 10px', borderRadius: 20, fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                <Shield size={14} />
                {user?.roles?.join(', ')}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginTop: 24 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14}/> Usuario Windows</label>
              <div style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, color: 'var(--color-text)' }}>
                {user?.login}
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CreditCard size={14}/> ID de Empleado</label>
              <div style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, color: 'var(--color-text)' }}>
                {user?.empleadoID ? user.empleadoID.toString() : 'No asignado'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building size={14}/> Departamento</label>
              <div style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, color: 'var(--color-text)' }}>
                Obtenido por Directorio Activo
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14}/> Horario Base</label>
              <div style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, color: 'var(--color-text)' }}>
                08:00 - 17:00 L-V (Ejemplo)
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
