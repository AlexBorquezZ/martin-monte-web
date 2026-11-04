import { WEEKDAY_SHORT, diffDays, rangeKeys, weekStart, weekday, type DateKey } from '../lib/date';
import type { Frequency, Habit, HabitLog, HabitStatus } from './types';

/** ¿El hábito está disponible para esa fecha? (activo, vigente y según su frecuencia) */
export function isScheduledOn(habit: Habit, date: DateKey): boolean {
  if (!habit.active) return false;
  if (date < habit.startDate) return false;
  if (habit.kind === 'temporary' && habit.endDate && date > habit.endDate) return false;
  const f = habit.frequency;
  if (f.type === 'weekdays') return f.days.includes(weekday(date));
  return true;
}

/** Cuenta los días con práctica (completa o mínima) en la semana de la fecha. */
export function practicedThisWeek(habitId: string, logs: HabitLog[], date: DateKey): number {
  const start = weekStart(date);
  return logs.filter(
    (l) => l.habitId === habitId && l.date >= start && l.date <= date && (l.status === 'done' || l.status === 'partial'),
  ).length;
}

/** Para hábitos "N veces por semana": ¿ya se alcanzó la meta semanal antes de hoy? */
export function weeklyGoalMet(habit: Habit, weekLogs: HabitLog[], date: DateKey): boolean {
  if (habit.frequency.type !== 'weekly') return false;
  const before = weekLogs.filter((l) => l.date !== date);
  return practicedThisWeek(habit.id, before, date) >= habit.frequency.times;
}

export function isPracticed(status: HabitStatus | undefined): boolean {
  return status === 'done' || status === 'partial';
}

export function describeFrequency(f: Frequency): string {
  if (f.type === 'daily') return 'Todos los días';
  if (f.type === 'weekly') return f.times === 1 ? '1 vez por semana' : `${f.times} veces por semana`;
  const days = [...f.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'De lunes a viernes';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Fines de semana';
  return days.map((d) => WEEKDAY_SHORT[d]).join(', ');
}

/**
 * Continuidad flexible: días con práctica sobre días disponibles en una
 * ventana. No es una racha: un día sin práctica no "rompe" nada.
 */
export function flexibleConsistency(
  habit: Habit,
  logs: HabitLog[],
  from: DateKey,
  to: DateKey,
): { practiced: number; available: number } {
  const practiced = new Set(
    logs
      .filter((l) => l.habitId === habit.id && isPracticed(l.status) && l.date >= from && l.date <= to)
      .map((l) => l.date),
  ).size;
  const span = diffDays(from, to) + 1;
  const available =
    habit.frequency.type === 'weekly'
      ? Math.max(1, Math.round((span / 7) * habit.frequency.times))
      : rangeKeys(from, to).filter((d) => isScheduledOn({ ...habit, active: true }, d)).length;
  return { practiced, available: Math.max(available, practiced) };
}
