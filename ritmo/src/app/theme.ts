import type { ThemePref } from '../domain/types';

const KEY = 'ritmo.theme';

/** El tema se refleja en localStorage para aplicarlo antes de que cargue la app (sin parpadeo). */
export function applyTheme(theme: ThemePref): void {
  const root = document.documentElement;
  if (theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* almacenamiento no disponible: no es grave */
  }
  const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#151714' : '#F6F3EE');
}

export function applyStoredTheme(): void {
  try {
    const t = localStorage.getItem(KEY);
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  } catch {
    /* ignorar */
  }
}
