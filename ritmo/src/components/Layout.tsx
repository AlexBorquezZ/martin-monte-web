import { useEffect, useState, type ReactNode } from 'react';
import { useApp } from '../app/AppContext';
import { href } from '../app/router';
import { applyUpdate, dismissOfflineReady, getSWState, onSWState, type SWState } from '../pwa/register';
import { Icon, type IconName } from './Icon';

const NAV: { path: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { path: '/', label: 'Hoy', icon: 'home', match: (p) => p === '/' || p.startsWith('/momento') },
  { path: '/habitos', label: 'Hábitos', icon: 'list', match: (p) => p.startsWith('/habitos') },
  { path: '/finanzas', label: 'Finanzas', icon: 'wallet', match: (p) => p.startsWith('/finanzas') },
  { path: '/progreso', label: 'Progreso', icon: 'chart', match: (p) => p.startsWith('/progreso') },
  {
    path: '/mas',
    label: 'Más',
    icon: 'more',
    match: (p) => ['/mas', '/cultura', '/ajustes', '/privacidad', '/pausa', '/foco'].some((x) => p.startsWith(x)),
  },
];

export function Layout({ path, children }: { path: string; children: ReactNode }) {
  const { settings, online, toastMessage } = useApp();
  const [sw, setSw] = useState<SWState>(getSWState);
  useEffect(() => onSWState(setSw), []);

  return (
    <div className="app">
      <a className="skip-link" href="#contenido" onClick={(e) => {
        e.preventDefault();
        document.getElementById('contenido')?.focus();
      }}>
        Ir al contenido
      </a>
      <header className="topbar">
        <span className="topbar__title">{settings.appName.toUpperCase()}</span>
        <span className={online ? 'net' : 'net net--offline'} role="status" aria-live="polite">
          {online ? 'En línea' : 'Sin conexión'}
        </span>
        <a className="icon-btn" href={href('/pausa')} aria-label="Pausa consciente">
          <Icon name="leaf" />
        </a>
      </header>

      <main id="contenido" className="main fade-in" tabIndex={-1} key={path}>
        {sw.needRefresh && (
          <div className="banner" role="status">
            <span className="grow">Hay una versión nueva de la app. Tus datos se conservan.</span>
            <button type="button" className="btn btn--primary btn--sm" onClick={() => void applyUpdate()}>
              Actualizar
            </button>
          </div>
        )}
        {sw.offlineReady && (
          <div className="banner" role="status">
            <span className="grow">Lista para usarse sin conexión.</span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={dismissOfflineReady}>
              Entendido
            </button>
          </div>
        )}
        {children}
      </main>

      <nav className="bottom-nav" aria-label="Secciones principales">
        <div className="bottom-nav__inner">
          {NAV.map((n) => {
            const active = n.match(path);
            return (
              <a key={n.path} href={href(n.path)} aria-current={active ? 'page' : undefined}>
                <span className="nav-pill">
                  <Icon name={n.icon} />
                </span>
                {n.label}
              </a>
            );
          })}
        </div>
      </nav>

      {toastMessage && (
        <div className="toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
