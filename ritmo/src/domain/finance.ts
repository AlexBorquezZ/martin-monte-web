import { addMonths, monthBounds, monthKey, type DateKey, type MonthKey } from '../lib/date';
import type { Currency, Transaction } from './types';

/**
 * Convierte un importe escrito a mano en centavos (entero).
 * Acepta formato argentino ("1.234,56"), internacional ("1,234.56") o simple ("1234.5").
 * Devuelve null si no es un número positivo válido.
 */
export function parseAmount(input: string): number | null {
  let s = input.trim().replace(/[\s$€]|ARS|USD|EUR|US/gi, '');
  if (!s || /[^\d.,]/.test(s)) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    // El separador que aparece último es el decimal.
    const dec = lastComma > lastDot ? ',' : '.';
    const thou = dec === ',' ? '.' : ',';
    s = s.split(thou).join('').replace(dec, '.');
  } else if (lastComma >= 0) {
    const parts = s.split(',');
    // "1,5" o "10,25" → decimal. "1,234" o "1,234,567" → miles.
    if (parts.length === 2 && parts[1].length <= 2) s = parts.join('.');
    else if (parts.slice(1).every((p) => p.length === 3)) s = parts.join('');
    else return null;
  } else if (lastDot >= 0) {
    const parts = s.split('.');
    // "1.234" o "1.234.567" → miles (uso local). "12.5" o "12.50" → decimal.
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      if (!parts.slice(1).every((p) => p.length === 3)) return null;
      s = parts.join('');
    }
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [int, frac = ''] = s.split('.');
  const cents = Number(int) * 100 + Number(frac.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0) return null;
  return cents;
}

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(cents: number, currency: Currency): string {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 });
    formatters.set(currency, f);
  }
  return f.format(cents / 100);
}

/** Valor para un campo de edición, en formato local ("1234,50"). */
export function centsToInput(cents: number): string {
  const int = Math.floor(cents / 100);
  const frac = cents % 100;
  return frac ? `${int},${String(frac).padStart(2, '0')}` : String(int);
}

export interface PeriodFilter {
  from: DateKey;
  to: DateKey;
  currency: Currency;
  category?: string;
  type?: 'income' | 'expense';
}

export function filterTransactions(list: Transaction[], f: PeriodFilter): Transaction[] {
  return list.filter(
    (t) =>
      t.currency === f.currency &&
      t.date >= f.from &&
      t.date <= f.to &&
      (!f.category || t.category === f.category) &&
      (!f.type || t.type === f.type),
  );
}

export interface Summary {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  count: number;
  expensesByCategory: { category: string; cents: number; share: number }[];
}

/**
 * Resumen de UNA moneda. Nunca suma monedas distintas: sin internet no hay una
 * tasa de cambio confiable, así que cada moneda se muestra por separado.
 */
export function summarize(list: Transaction[], f: PeriodFilter): Summary {
  const items = filterTransactions(list, f);
  let income = 0;
  let expense = 0;
  const byCat = new Map<string, number>();
  for (const t of items) {
    if (t.type === 'income') income += t.amountCents;
    else {
      expense += t.amountCents;
      byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amountCents);
    }
  }
  const expensesByCategory = [...byCat.entries()]
    .map(([category, cents]) => ({ category, cents, share: expense ? cents / expense : 0 }))
    .sort((a, b) => b.cents - a.cents);
  return { incomeCents: income, expenseCents: expense, balanceCents: income - expense, count: items.length, expensesByCategory };
}

export interface MonthPoint {
  month: MonthKey;
  incomeCents: number;
  expenseCents: number;
}

export function monthlyEvolution(list: Transaction[], currency: Currency, lastMonth: MonthKey, months = 6): MonthPoint[] {
  const out: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const m = addMonths(lastMonth, -i);
    out.push({ month: m, incomeCents: 0, expenseCents: 0 });
  }
  const idx = new Map(out.map((p, i) => [p.month, i]));
  for (const t of list) {
    if (t.currency !== currency) continue;
    const i = idx.get(monthKey(t.date));
    if (i === undefined) continue;
    if (t.type === 'income') out[i].incomeCents += t.amountCents;
    else out[i].expenseCents += t.amountCents;
  }
  return out;
}

/** Monedas que tienen movimientos (para mostrar solo las relevantes). */
export function currenciesUsed(list: Transaction[]): Currency[] {
  return [...new Set(list.map((t) => t.currency))];
}

export function periodBounds(period: 'month' | 'prev-month' | 'year' | 'all', today: DateKey): { from: DateKey; to: DateKey } {
  const m = monthKey(today);
  if (period === 'month') return monthBounds(m);
  if (period === 'prev-month') return monthBounds(addMonths(m, -1));
  if (period === 'year') return { from: `${today.slice(0, 4)}-01-01`, to: `${today.slice(0, 4)}-12-31` };
  return { from: '0000-01-01', to: '9999-12-31' };
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function transactionsToCSV(list: Transaction[]): string {
  const header = ['fecha', 'tipo', 'importe', 'moneda', 'categoria', 'descripcion', 'notas'];
  const rows = [...list]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) =>
      [
        t.date,
        t.type === 'income' ? 'ingreso' : 'gasto',
        (t.amountCents / 100).toFixed(2),
        t.currency,
        t.category,
        t.description,
        t.notes,
      ]
        .map(csvCell)
        .join(','),
    );
  return [header.join(','), ...rows].join('\n');
}
