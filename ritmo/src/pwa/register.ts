import { registerSW } from 'virtual:pwa-register';

type Listener = (state: SWState) => void;
export interface SWState {
  needRefresh: boolean;
  offlineReady: boolean;
}

let state: SWState = { needRefresh: false, offlineReady: false };
const listeners = new Set<Listener>();
let updateFn: ((reload?: boolean) => Promise<void>) | null = null;

function set(patch: Partial<SWState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

/**
 * Registra el service worker. Las actualizaciones NO se aplican solas: se muestra
 * un aviso y la persona decide cuándo recargar. El service worker solo administra
 * archivos de la app; los datos personales viven en IndexedDB y no se tocan.
 */
export function initServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  updateFn = registerSW({
    immediate: true,
    onNeedRefresh: () => set({ needRefresh: true }),
    onOfflineReady: () => set({ offlineReady: true }),
    onRegisteredSW(_url, registration) {
      // Buscar actualizaciones cada hora mientras la app está abierta (solo si hay red).
      if (!registration) return;
      window.setInterval(() => {
        if (navigator.onLine) registration.update().catch(() => undefined);
      }, 60 * 60 * 1000);
    },
  });
}

export function getSWState(): SWState {
  return state;
}

export function onSWState(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function applyUpdate(): Promise<void> {
  await updateFn?.(true);
}

export function dismissOfflineReady(): void {
  set({ offlineReady: false });
}
