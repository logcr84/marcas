import { useEffect, useState } from 'react';
import { empleadosApi } from '../api/marcas';
import type { EmpleadoResponse } from '../api/marcas';
import { Search, Users } from 'lucide-react';

function estadoBadge(estado: string) {
  return (
    <span className={`badge ${estado === 'ACTIVO' ? 'badge-green' : 'badge-gray'}`}>
      {estado}
    </span>
  );
}

export default function EmpleadosPage() {
  const [lista, setLista] = useState<EmpleadoResponse[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const cargar = async (b?: string) => {
    setLoading(true);
    try {
      const data = await empleadosApi.listar(b || undefined);
      setLista(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    cargar(busqueda);
  };

  return (
    <>
      <div className="page-header">
        <h1>Empleados</h1>
        <p>Directorio de empleados activos en el sistema</p>
      </div>
      <div className="page-body">
        <form className="filters-bar" onSubmit={handleSearch} id="form-buscar-empleados">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" htmlFor="input-busqueda-empleado">Buscar</label>
            <input
              id="input-busqueda-empleado"
              className="form-input"
              type="text"
              placeholder="Nombre, código o identificación..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <button type="submit" id="btn-buscar-empleado" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
            <Search size={16} /> Buscar
          </button>
        </form>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : lista.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <p>No se encontraron empleados.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre completo</th>
                    <th>Departamento</th>
                    <th>Puesto</th>
                    <th style={{ width: 100 }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(e => (
                    <tr key={e.empleadoID}>
                      <td><code style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{e.codigoEmpleado}</code></td>
                      <td style={{ fontWeight: 500 }}>{e.nombreCompleto}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{e.departamento}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{e.puesto}</td>
                      <td>{estadoBadge(e.estado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
