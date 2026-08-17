import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <>
      <div className="page-header">
        <h1>Configuración</h1>
        <p>Ajustes generales del sistema y preferencias de usuario</p>
      </div>
      <div className="page-body">
        <div className="card" style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>Preferencias de Notificaciones</h2>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Alertas por llegadas tardías</label>
            <select className="form-select">
              <option>Activado</option>
              <option>Desactivado</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Tolerancia de gracia (minutos)</label>
            <input type="number" className="form-input" defaultValue={15} />
          </div>

          <h2 style={{ fontSize: 16, marginBottom: 16, borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>Aspecto de la Interfaz</h2>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Tema visual</label>
            <select className="form-select">
              <option>Oscuro (Predeterminado)</option>
              <option>Claro</option>
              <option>Automático</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
            <button className="btn btn-secondary">Cancelar</button>
            <button className="btn btn-primary"><Settings size={16}/> Guardar cambios</button>
          </div>
        </div>
      </div>
    </>
  );
}
