/**
 * Temporizador de enfoque basado en marcas de tiempo (no en contar segundos):
 * sigue siendo correcto aunque la pantalla se apague, la pestaña quede en segundo
 * plano o la app se cierre y se vuelva a abrir.
 */
export interface FocusTimerState {
  mode: 'focus' | 'break';
  minutes: number;
  label: string;
  goalId?: string;
  /** Momento de fin (ms). Ausente si está en pausa. */
  endAt?: number;
  /** Milisegundos restantes cuando está en pausa. */
  pausedRemaining?: number;
  startedAt: number;
}

export function startTimer(
  mode: FocusTimerState['mode'],
  minutes: number,
  label: string,
  goalId: string | undefined,
  now: number,
): FocusTimerState {
  return { mode, minutes, label, goalId, endAt: now + minutes * 60_000, startedAt: now };
}

export function remainingMs(t: FocusTimerState, now: number): number {
  if (t.pausedRemaining !== undefined) return t.pausedRemaining;
  return Math.max(0, (t.endAt ?? now) - now);
}

export function isFinished(t: FocusTimerState, now: number): boolean {
  return t.pausedRemaining === undefined && t.endAt !== undefined && now >= t.endAt;
}

export function pauseTimer(t: FocusTimerState, now: number): FocusTimerState {
  return { ...t, pausedRemaining: remainingMs(t, now), endAt: undefined };
}

export function resumeTimer(t: FocusTimerState, now: number): FocusTimerState {
  if (t.pausedRemaining === undefined) return t;
  return { ...t, endAt: now + t.pausedRemaining, pausedRemaining: undefined };
}

/** Minutos efectivamente trabajados (para registrar si se termina antes). */
export function workedMinutes(t: FocusTimerState, now: number): number {
  return Math.max(0, Math.round((t.minutes * 60_000 - remainingMs(t, now)) / 60_000));
}

const KEY = 'ritmo.focusTimer';

export function loadTimer(): FocusTimerState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as FocusTimerState;
    return typeof t.minutes === 'number' && typeof t.startedAt === 'number' ? t : null;
  } catch {
    return null;
  }
}

export function storeTimer(t: FocusTimerState | null): void {
  try {
    if (t) localStorage.setItem(KEY, JSON.stringify(t));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignorar */
  }
}
