import api from './client';

export interface LoginRequest { login: string; password: string; }
export interface LoginResponse {
  token: string;
  expiracion: string;
  login: string;
  roles: string[];
  empleadoID: number | null;
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then(r => r.data),
};
