import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Fingerprint } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [loginStr, setLoginStr] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginStr, password);
    } catch {
      setError('Credenciales inválidas. Verifique su usuario y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Fingerprint size={26} color="white" />
          </div>
          <div>
            <div className="login-title">Control de Marcas</div>
            <div className="login-subtitle">Portal de Asistencia Corporativo</div>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit} id="login-form">
          {error && <div className="error-msg" role="alert">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="login-input">Correo / Usuario</label>
            <input
              id="login-input"
              className="form-input"
              type="text"
              placeholder="usuario@empresa.com"
              value={loginStr}
              onChange={e => setLoginStr(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Contraseña</label>
            <input
              id="password-input"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="btn-login"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Iniciar sesión'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          La hora oficial de cada marca es registrada por el servidor.
        </p>
      </div>
    </div>
  );
}
