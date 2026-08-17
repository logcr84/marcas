import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import api from './api/client';

// Disparamos un ping silencioso a la API al abrir la página para "despertar"
// el servidor gratuito de Render mientras el usuario interactúa con la UI.
api.get('/health').catch(() => { /* Ignorar errores de red del ping */ });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
