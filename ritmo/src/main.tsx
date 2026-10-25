import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyStoredTheme } from './app/theme';
import { initServiceWorker } from './pwa/register';
import './styles/global.css';

applyStoredTheme();

// Pedir almacenamiento persistente reduce el riesgo de que el navegador borre
// los datos cuando falta espacio. El navegador puede aceptarlo o no.
if (navigator.storage?.persist) {
  navigator.storage.persisted().then((p) => (p ? undefined : navigator.storage.persist())).catch(() => undefined);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

initServiceWorker();
