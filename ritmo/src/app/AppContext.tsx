import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { toDateKey, type DateKey } from '../lib/date';
import type { Settings } from '../domain/types';
import { DEFAULT_SETTINGS } from '../domain/constants';
import { getSettings, saveSettings } from '../storage/repo';
import { subscribe } from '../storage/events';
import { applyTheme } from './theme';

interface AppState {
  ready: boolean;
  error: string | null;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  /** Fecha local actual; cambia sola al pasar la medianoche. */
  today: DateKey;
  /** Hora actual, refrescada cada 30 segundos. */
  now: Date;
  /** Se incrementa con cada cambio guardado: las consultas se vuelven a ejecutar. */
  dataVersion: number;
  online: boolean;
  toast: (message: string) => void;
  toastMessage: string | null;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [dataVersion, setDataVersion] = useState(0);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    getSettings()
      .then((s) => {
        if (!alive) return;
        setSettings(s);
        applyTheme(s.theme);
        setReady(true);
      })
      .catch(() => {
        if (!alive) return;
        setError(
          'No se pudo abrir el almacenamiento local. Revisá que el navegador no esté en modo incógnito estricto y que haya espacio disponible.',
        );
        setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => subscribe(() => setDataVersion((v) => v + 1)), []);

  // Reloj: detecta el cambio de fecha aunque la app quede abierta toda la noche.
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 30_000);
    const onVisible = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
    };
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const saved = await saveSettings({ ...settings, ...patch });
      setSettings(saved);
      applyTheme(saved.theme);
    },
    [settings],
  );

  const toast = useCallback((message: string) => {
    setToastMessage(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMessage(null), 3200);
  }, []);

  const today = toDateKey(now);

  return (
    <Ctx.Provider
      value={{ ready, error, settings, updateSettings, today, now, dataVersion, online, toast, toastMessage }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp debe usarse dentro de AppProvider');
  return v;
}

/**
 * Ejecuta una consulta asíncrona y la repite cuando cambian los datos o las dependencias.
 * Devuelve `undefined` mientras carga.
 */
export function useQuery<T>(
  fn: () => Promise<T>,
  deps: unknown[],
): { data: T | undefined; error: boolean; loaded: boolean } {
  const { dataVersion } = useApp();
  const [state, setState] = useState<{ data: T | undefined; error: boolean; loaded: boolean }>({
    data: undefined,
    error: false,
    loaded: false,
  });
  useEffect(() => {
    let alive = true;
    fn().then(
      (data) => alive && setState({ data, error: false, loaded: true }),
      () => alive && setState((s) => ({ data: s.data, error: true, loaded: true })),
    );
    return () => {
      alive = false;
    };
  }, [dataVersion, ...deps]);
  return state;
}
