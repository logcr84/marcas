import { User, Shield, Building, CreditCard, Clock, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { empleadosApi } from '../api/marcas';

export default function ProfilePage() {
  const { user } = useAuth();
  const initials = user?.login.slice(0, 2).toUpperCase() ?? 'US';

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    codigoEmpleado: '',
    nombreCompleto: '',
    departamento: '',
    puesto: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.empleadoID) {
      empleadosApi.obtenerPorId(user.empleadoID).then(data => {
        setFormData({
          codigoEmpleado: data.codigoEmpleado || '',
          nombreCompleto: data.nombreCompleto || '',
          departamento: data.departamento || '',
          puesto: data.puesto || '',
          email: data.email || ''
        });
      }).catch(err => {
        console.error("Error al obtener empleado:", err);
      });
    }
  }, [user?.empleadoID]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await empleadosApi.actualizarPerfil(formData);
      alert('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error) {
      alert('Error al actualizar el perfil');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Mi Perfil</h1>
        <p>Información de tu cuenta y roles en el sistema</p>
      </div>
      
      <div className="page-body">
        <div className="card" style={{ maxWidth: 800 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
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
            
            {user?.empleadoID && (
              <div>
                {!isEditing ? (
                  <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                    <Edit2 size={16} /> Editar
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={isLoading}>
                      <X size={16} /> Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={isLoading}>
                      <Save size={16} /> {isLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginTop: 24 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14}/> Usuario Windows</label>
              <div style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, color: 'var(--color-text-muted)' }}>
                {user?.login}
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14}/> Nombre Completo</label>
              {isEditing ? (
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.nombreCompleto} 
                  onChange={e => setFormData({...formData, nombreCompleto: e.target.value})} 
                />
              ) : (
                <div style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, color: 'var(--color-text)' }}>
                  {formData.nombreCompleto || 'No asignado'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CreditCard size={14}/> Código de Empleado</label>
              {isEditing ? (
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.codigoEmpleado} 
                  onChange={e => setFormData({...formData, codigoEmpleado: e.target.value})} 
                />
              ) : (
                <div style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, color: 'var(--color-text)' }}>
                  {formData.codigoEmpleado || 'No asignado'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building size={14}/> Departamento</label>
              {isEditing ? (
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.departamento} 
                  onChange={e => setFormData({...formData, departamento: e.target.value})} 
                />
              ) : (
                <div style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, color: 'var(--color-text)' }}>
                  {formData.departamento || 'Sin Asignar'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building size={14}/> Puesto</label>
              {isEditing ? (
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.puesto} 
                  onChange={e => setFormData({...formData, puesto: e.target.value})} 
                />
              ) : (
                <div style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, color: 'var(--color-text)' }}>
                  {formData.puesto || 'Sin Asignar'}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14}/> Email / UPN</label>
              {isEditing ? (
                <input 
                  type="email" 
                  className="form-control" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              ) : (
                <div style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, color: 'var(--color-text)' }}>
                  {formData.email || 'Sin Asignar'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14}/> Horario Base</label>
              <div style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, color: 'var(--color-text-muted)' }}>
                Configuración administrada por RRHH
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
