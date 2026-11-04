import { rangeKeys, type DateKey } from '../lib/date';
import { isPracticed } from './habits';
import type {
  AreaId,
  ConnectionLog,
  DayEntry,
  FocusSession,
  Habit,
  HabitLog,
  LearningGoal,
  LearningSession,
  PauseLog,
  Transaction,
  Workout,
} from './types';

export interface ActivityData {
  habits: Habit[];
  logs: HabitLog[];
  workouts: Workout[];
  sessions: LearningSession[];
  focus: FocusSession[];
  pauses: PauseLog[];
  connections: ConnectionLog[];
  days: DayEntry[];
  transactions: Transaction[];
  goals: LearningGoal[];
}

export interface DayActivity {
  date: DateKey;
  count: number;
  areas: Set<AreaId>;
}

/** Actividad por día: cuántas prácticas y qué áreas se atendieron. */
export function activityByDay(data: ActivityData, from: DateKey, to: DateKey): Map<DateKey, DayActivity> {
  const map = new Map<DateKey, DayActivity>();
  for (const d of rangeKeys(from, to)) map.set(d, { date: d, count: 0, areas: new Set() });
  const habitArea = new Map(data.habits.map((h) => [h.id, h.category]));
  const goalArea = new Map(data.goals.map((g) => [g.id, g.area === 'finanzas' ? ('finanzas' as const) : ('futuro' as const)]));
  const touch = (date: DateKey, area: AreaId | undefined) => {
    const e = map.get(date);
    if (!e) return;
    e.count++;
    if (area) e.areas.add(area);
  };
  for (const l of data.logs) if (isPracticed(l.status)) touch(l.date, habitArea.get(l.habitId));
  for (const w of data.workouts) if (w.status !== 'postponed') touch(w.date, 'cuerpo');
  for (const s of data.sessions) touch(s.date, goalArea.get(s.goalId) ?? 'futuro');
  for (const f of data.focus) touch(f.date, (f.goalId && goalArea.get(f.goalId)) || 'futuro');
  for (const p of data.pauses) touch(p.date, 'mente');
  for (const c of data.connections) touch(c.date, 'relaciones');
  for (const d of data.days) {
    if (d.morning) touch(d.date, 'mente');
    if (d.night) touch(d.date, 'mente');
  }
  // Registrar movimientos de dinero es atender las finanzas (una vez por día).
  const txDays = new Set(data.transactions.map((t) => t.date));
  for (const d of txDays) touch(d, 'finanzas');
  return map;
}

export function topHabits(habits: Habit[], logs: HabitLog[], limit = 5): { habit: Habit; full: number; minimal: number }[] {
  const counts = new Map<string, { full: number; minimal: number }>();
  for (const l of logs) {
    if (!isPracticed(l.status)) continue;
    const c = counts.get(l.habitId) ?? { full: 0, minimal: 0 };
    if (l.status === 'done') c.full++;
    else c.minimal++;
    counts.set(l.habitId, c);
  }
  return habits
    .filter((h) => counts.has(h.id))
    .map((h) => ({ habit: h, ...counts.get(h.id)! }))
    .sort((a, b) => b.full + b.minimal - (a.full + a.minimal))
    .slice(0, limit);
}

export function learningMinutes(sessions: LearningSession[], focus: FocusSession[]): number {
  return sessions.reduce((s, x) => s + x.minutes, 0) + focus.reduce((s, x) => s + x.minutes, 0);
}

export function activeDays(activity: Map<DateKey, DayActivity>): number {
  let n = 0;
  for (const a of activity.values()) if (a.count > 0) n++;
  return n;
}
