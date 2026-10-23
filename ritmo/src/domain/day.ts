import { diffDays, minutesOfDay, parseHHMM, type DateKey } from '../lib/date';
import { MOMENTS } from './constants';
import type { CheckIn, EnergyLevel, MomentId, Settings } from './types';

export function greeting(now: Date, name?: string): string {
  const h = now.getHours();
  const base = h >= 5 && h < 12 ? 'Buen día' : h >= 12 && h < 20 ? 'Buenas tardes' : 'Buenas noches';
  return name ? `${base}, ${name}` : base;
}

/**
 * Momento del día según los horarios configurados: el último momento activo
 * cuyo inicio ya pasó. Antes del primero, se considera la noche anterior.
 */
export function currentMoment(now: Date, settings: Settings): MomentId {
  const mins = minutesOfDay(now);
  const enabled = MOMENTS.filter((m) => settings.moments[m.id].enabled)
    .map((m) => ({ id: m.id, start: parseHHMM(settings.moments[m.id].start) ?? 0 }))
    .sort((a, b) => a.start - b.start);
  if (!enabled.length) return 'manana';
  let current = enabled[enabled.length - 1].id;
  for (const m of enabled) if (m.start <= mins) current = m.id;
  // Madrugada (antes del primer momento): seguimos en el último momento del día.
  return current;
}

/** Elige un elemento según el número de día: nunca repite el mismo dos días seguidos. */
export function pickByDay<T>(items: readonly T[], date: DateKey, offset = 0): T {
  const n = diffDays('2024-01-01', date) + offset;
  return items[((n % items.length) + items.length) % items.length];
}

export function energyFromCheckIn(c: CheckIn): EnergyLevel {
  return c === 'energia' ? 'alto' : c === 'normal' ? 'medio' : 'bajo';
}

export function checkInFromEnergy(e: EnergyLevel): CheckIn {
  return e === 'alto' ? 'energia' : e === 'medio' ? 'normal' : 'cansado';
}
