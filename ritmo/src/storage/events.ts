/** Aviso simple de cambios: la interfaz vuelve a leer los datos cuando algo se guarda. */
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notifyChange(): void {
  for (const fn of listeners) fn();
}
