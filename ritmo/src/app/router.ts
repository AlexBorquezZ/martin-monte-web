import { useEffect, useState } from 'react';

/** Enrutado por hash (#/ruta): no necesita configuración del servidor y funciona offline. */
export function currentPath(): string {
  const raw = window.location.hash.replace(/^#/, '');
  return raw.startsWith('/') ? raw.split('?')[0] : '/';
}

export function useRoute(): string {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onChange = () => {
      setPath(currentPath());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

export function navigate(path: string): void {
  window.location.hash = path;
}

export function goBack(fallback = '/'): void {
  if (window.history.length > 1) window.history.back();
  else navigate(fallback);
}

export const href = (path: string) => `#${path}`;

export function routeQuery(): URLSearchParams {
  const raw = window.location.hash.replace(/^#/, '');
  const i = raw.indexOf('?');
  return new URLSearchParams(i >= 0 ? raw.slice(i + 1) : '');
}
