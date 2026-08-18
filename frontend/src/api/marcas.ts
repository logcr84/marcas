import api from './client';

export interface MarcaResponse {
  marcaID: number;
  codigoEmpleado: string;
  nombreEmpleado: string;
  fechaHoraServidor: string;
  tipoMarca: string;
  nombreTipoMarca: string;
  estadoMarca: string;
  observacionTecnica: string | null;
  justificacionID: number | null;
  estadoJustificacion: string | null;
  textoJustificacion: string | null;
  motivoJustificacion: string | null;
}

export interface ReporteMarcasResponse {
  marcas: MarcaResponse[];
  total: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface JustificacionResponse {
  justificacionID: number;
  codigoEmpleado: string;
  nombreEmpleado: string;
  departamento: string;
  motivo: string;
  fechaInicio: string;
  fechaFin: string;
  textoJustificacion: string;
  estadoJustificacion: string;
  fechaSolicitud: string;
  fechaHoraMarcaAsociada: string | null;
  tipoMarcaAsociada: string | null;
}

export interface EmpleadoResponse {
  empleadoID: number;
  codigoEmpleado: string;
  nombreCompleto: string;
  departamento: string;
  puesto: string;
  estado: string;
}

export const marcasApi = {
  reporteGeneral: (fechaInicio: string, fechaFin: string, departamentoId?: number, estadoMarca?: string) =>
    api.get<ReporteMarcasResponse>('/reportes/marcas', {
      params: { fechaInicio, fechaFin, departamentoId, estadoMarca }
    }).then(r => r.data),

  porEmpleado: (empleadoId: number, fechaInicio: string, fechaFin: string) =>
    api.get<MarcaResponse[]>(`/marcas/empleado/${empleadoId}`, {
      params: { fechaInicio, fechaFin }
    }).then(r => r.data),
};

export const justificacionesApi = {
  listar: (estado?: string, empleadoId?: number) =>
    api.get<JustificacionResponse[]>('/justificaciones', { params: { estado, empleadoId } }).then(r => r.data),

  crear: (data: { empleadoID: number; marcaID?: number; motivoID: number; fechaInicio: string; fechaFin: string; textoJustificacion: string }) =>
    api.post('/justificaciones', data).then(r => r.data),

  resolver: (id: number, nuevoEstado: string, comentarioResolucion?: string) =>
    api.put(`/justificaciones/${id}/estado`, { nuevoEstado, comentarioResolucion }).then(r => r.data),
};

export const empleadosApi = {
  listar: (busqueda?: string) => 
    api.get<EmpleadoResponse[]>('/empleados', { params: { busqueda } }).then(r => r.data),
  obtenerPorId: (id: number) =>
    api.get<EmpleadoResponse>(`/empleados/${id}`).then(r => r.data),
  actualizarPerfil: (data: { codigoEmpleado: string; nombreCompleto: string; departamento: string; puesto: string }) =>
    api.put('/empleados/perfil', data).then(r => r.data),
};
