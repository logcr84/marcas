import { useState } from 'react';
import { Settings, Check, Loader2, ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        <div className="card" style={{ maxWidth: 640 }}>
          
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Preferencias Generales</h2>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Tema visual</label>
              <select className="form-select">
                <option>Oscuro (Predeterminado)</option>
                <option>Claro</option>
                <option>Automático</option>
              </select>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>El tema oscuro reduce la fatiga visual en ambientes de poca luz.</span>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Alertas de Notificación</label>
              <select className="form-select">
                <option>Solo anomalías (Recomendado)</option>
                <option>Todas las marcas</option>
                <option>Desactivado</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 32, borderTop: '1px solid var(--color-border)', paddingTop: 24 }}>
            <button 
              type="button" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer', padding: '8px 0', fontSize: 16, fontWeight: 600 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={18} style={{ color: 'var(--color-accent)' }} />
                Configuración Avanzada
              </div>
              {showAdvanced ? <ChevronDown size={20} color="var(--color-text-muted)" /> : <ChevronRight size={20} color="var(--color-text-muted)" />}
            </button>
            
            {showAdvanced && (
              <div style={{ marginTop: 20, animation: 'fadeIn 0.2s ease-in-out' }}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Tolerancia de gracia por llegada tardía (minutos)</label>
                  <input type="number" className="form-input" defaultValue={15} />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>Tiempo permitido antes de marcar una entrada como "Tardía".</span>
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Cálculo de Horas Extras</label>
                  <select className="form-select">
                    <option>Automático según horario base</option>
                    <option>Requiere autorización previa</option>
                    <option>Deshabilitado</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Sincronización de Base de Datos</label>
                  <select className="form-select">
                    <option>Tiempo Real</option>
                    <option>Lotes (Cada 15 min)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {saved && (
            <div style={{ marginBottom: 24, padding: '12px 16px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success-text)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={16} /> Configuración actualizada y guardada correctamente.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 24 }}>
            <button className="btn btn-secondary" disabled={isSaving}>Restaurar Valores</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="spinner" /> : <Settings size={16}/>}
              {isSaving ? 'Aplicando cambios...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
