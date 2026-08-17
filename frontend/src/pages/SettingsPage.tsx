import { useState } from 'react';
import { Settings, Check, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setSaved(false);

    // Simular un guardado en API
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      
      // Ocultar el mensaje de éxito después de 3 segundos
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

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

          {saved && (
            <div style={{ marginBottom: 16, padding: '12px 16px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderRadius: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={16} /> Configuración guardada correctamente.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
            <button className="btn btn-secondary" disabled={isSaving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="spinner" /> : <Settings size={16}/>}
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
