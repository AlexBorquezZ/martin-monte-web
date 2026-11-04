/**
 * Utilidades de fecha basadas SIEMPRE en la hora local del dispositivo.
 * Los registros diarios se identifican con una clave YYYY-MM-DD local,
 * nunca con toISOString() (que usa UTC y mezclaría días cerca de medianoche).
 */
export type DateKey = string;

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toDateKey(d: Date = new Date()): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isValidDateKey(value: unknown): value is DateKey {
  if (typeof value !== 'string' || !DATE_KEY_RE.test(value)) return false;
  const d = parseDateKey(value);
  return toDateKey(d) === value;
}

/** Medianoche local del día indicado. */
export function parseDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DateKey, n: number): DateKey {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

/** Diferencia en días calendario (b - a). Robusto frente a cambios de horario de verano. */
export function diffDays(a: DateKey, b: DateKey): number {
  const da = parseDateKey(a);
  const db = parseDateKey(b);
  const ua = Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
  const ub = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate());
  return Math.round((ub - ua) / 86_400_000);
}

/** 0 = domingo … 6 = sábado (como Date#getDay). */
export function weekday(key: DateKey): number {
  return parseDateKey(key).getDay();
}

/** Lunes de la semana que contiene la fecha. */
export function weekStart(key: DateKey): DateKey {
  const wd = weekday(key);
  const offset = wd === 0 ? -6 : 1 - wd;
  return addDays(key, offset);
}

export function rangeKeys(from: DateKey, to: DateKey): DateKey[] {
  const out: DateKey[] = [];
  const n = diffDays(from, to);
  for (let i = 0; i <= n; i++) out.push(addDays(from, i));
  return out;
}

export type MonthKey = string; // YYYY-MM

export function monthKey(key: DateKey): MonthKey {
  return key.slice(0, 7);
}

export function addMonths(month: MonthKey, n: number): MonthKey {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthBounds(month: MonthKey): { from: DateKey; to: DateKey } {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${pad(last)}` };
}

const LOCALE = 'es-AR';

/** "Viernes, 23 de octubre" (solo la primera letra en mayúscula). */
export function formatLongDate(key: DateKey): string {
  const s = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' }).format(parseDateKey(key));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatShortDate(key: DateKey): string {
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' }).format(parseDateKey(key));
}

export function formatMonth(month: MonthKey): string {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
}

export function formatMonthShort(month: MonthKey): string {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(LOCALE, { month: 'short' }).format(new Date(y, m - 1, 1));
}

export const WEEKDAY_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** "HH:MM" → minutos desde medianoche, o null si es inválido. */
export function parseHHMM(value: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function nowIso(): string {
  return new Date().toISOString();
}
