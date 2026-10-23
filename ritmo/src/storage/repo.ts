import { addDays, diffDays, nowIso, type DateKey } from '../lib/date';
import { newId } from '../lib/id';
import { normalizeSettings } from '../domain/validation';
import type {
  CardState,
  CheckIn,
  ConnectionLog,
  DayEntry,
  FocusSession,
  Habit,
  HabitLog,
  HabitStatus,
  LearningGoal,
  LearningSession,
  PauseLog,
  SavingsGoal,
  Settings,
  Transaction,
  WeeklyReview,
  Workout,
} from '../domain/types';
import { getDB } from './db';
import { notifyChange } from './events';

/* ───────────── Configuración ───────────── */

export async function getSettings(): Promise<Settings> {
  const db = await getDB();
  const rec = await db.get('meta', 'settings');
  return normalizeSettings(rec?.value);
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  const clean = normalizeSettings(settings);
  const db = await getDB();
  await db.put('meta', { key: 'settings', value: clean });
  notifyChange();
  return clean;
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return (await db.get('meta', key))?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('meta', { key, value });
}

/* ───────────── Hábitos ───────────── */

export async function listHabits(): Promise<Habit[]> {
  const db = await getDB();
  const all = await db.getAll('habits');
  return all.sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export async function getHabit(id: string): Promise<Habit | undefined> {
  return (await getDB()).get('habits', id);
}

export type HabitInput = Omit<Habit, 'id' | 'order' | 'createdAt' | 'updatedAt'>;

export async function createHabit(input: HabitInput): Promise<Habit> {
  const db = await getDB();
  const existing = await db.getAll('habits');
  const now = nowIso();
  const habit: Habit = {
    ...input,
    id: newId('h'),
    order: existing.reduce((m, h) => Math.max(m, h.order), -1) + 1,
    createdAt: now,
    updatedAt: now,
  };
  await db.put('habits', habit);
  notifyChange();
  return habit;
}

export async function updateHabit(id: string, patch: Partial<HabitInput>): Promise<Habit> {
  const db = await getDB();
  const current = await db.get('habits', id);
  if (!current) throw new Error('El hábito ya no existe.');
  const next: Habit = { ...current, ...patch, id, updatedAt: nowIso() };
  await db.put('habits', next);
  notifyChange();
  return next;
}

/** Elimina el hábito y su historial (acción destructiva: la interfaz pide confirmación). */
export async function deleteHabit(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['habits', 'habitLogs'], 'readwrite');
  await tx.objectStore('habits').delete(id);
  const keys = await tx.objectStore('habitLogs').index('byHabit').getAllKeys(id);
  for (const k of keys) await tx.objectStore('habitLogs').delete(k);
  await tx.done;
  notifyChange();
}

/** Mueve un hábito una posición arriba (-1) o abajo (+1) y renumera el orden. */
export async function moveHabit(id: string, direction: -1 | 1): Promise<void> {
  const habits = await listHabits();
  const idx = habits.findIndex((h) => h.id === id);
  const target = idx + direction;
  if (idx < 0 || target < 0 || target >= habits.length) return;
  [habits[idx], habits[target]] = [habits[target], habits[idx]];
  const db = await getDB();
  const tx = db.transaction('habits', 'readwrite');
  await Promise.all(habits.map((h, i) => tx.store.put({ ...h, order: i })));
  await tx.done;
  notifyChange();
}

export const habitLogId = (habitId: string, date: DateKey) => `${habitId}|${date}`;

export async function setHabitStatus(
  habitId: string,
  date: DateKey,
  status: HabitStatus | null,
  note?: string,
): Promise<void> {
  const db = await getDB();
  const id = habitLogId(habitId, date);
  if (status === null) {
    await db.delete('habitLogs', id);
  } else {
    const log: HabitLog = { id, habitId, date, status, updatedAt: nowIso() };
    if (note) log.note = note;
    await db.put('habitLogs', log);
  }
  notifyChange();
}

export async function logsForDate(date: DateKey): Promise<HabitLog[]> {
  return (await getDB()).getAllFromIndex('habitLogs', 'byDate', date);
}

export async function logsBetween(from: DateKey, to: DateKey): Promise<HabitLog[]> {
  return (await getDB()).getAllFromIndex('habitLogs', 'byDate', IDBKeyRange.bound(from, to));
}

export async function logsForHabit(habitId: string): Promise<HabitLog[]> {
  const logs = await (await getDB()).getAllFromIndex('habitLogs', 'byHabit', habitId);
  return logs.sort((a, b) => b.date.localeCompare(a.date));
}

/* ───────────── Días (check-in, mañana, noche, cuerpo) ───────────── */

export async function getDay(date: DateKey): Promise<DayEntry | undefined> {
  return (await getDB()).get('days', date);
}

export async function daysBetween(from: DateKey, to: DateKey): Promise<DayEntry[]> {
  return (await getDB()).getAll('days', IDBKeyRange.bound(from, to));
}

export async function updateDay(date: DateKey, patch: Partial<Omit<DayEntry, 'date' | 'updatedAt'>>): Promise<DayEntry> {
  const db = await getDB();
  const current = (await db.get('days', date)) ?? { date, updatedAt: nowIso() };
  const next: DayEntry = { ...current, ...patch, date, updatedAt: nowIso() };
  await db.put('days', next);
  notifyChange();
  return next;
}

export function setCheckIn(date: DateKey, checkIn: CheckIn | undefined) {
  return updateDay(date, { checkIn });
}

/* ───────────── Entrenamientos ───────────── */

export async function addWorkout(input: Omit<Workout, 'id' | 'createdAt'>): Promise<Workout> {
  const w: Workout = { ...input, id: newId('w'), createdAt: nowIso() };
  await (await getDB()).put('workouts', w);
  notifyChange();
  return w;
}

export async function updateWorkout(w: Workout): Promise<void> {
  await (await getDB()).put('workouts', w);
  notifyChange();
}

export async function deleteWorkout(id: string): Promise<void> {
  await (await getDB()).delete('workouts', id);
  notifyChange();
}

export async function workoutsBetween(from: DateKey, to: DateKey): Promise<Workout[]> {
  const list = await (await getDB()).getAllFromIndex('workouts', 'byDate', IDBKeyRange.bound(from, to));
  return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

/* ───────────── Aprendizaje ───────────── */

export async function listLearningGoals(): Promise<LearningGoal[]> {
  const list = await (await getDB()).getAll('learningGoals');
  return list.sort((a, b) => Number(b.priority) - Number(a.priority) || b.createdAt.localeCompare(a.createdAt));
}

export async function saveLearningGoal(
  input: Omit<LearningGoal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<LearningGoal> {
  const db = await getDB();
  const now = nowIso();
  const existing = input.id ? await db.get('learningGoals', input.id) : undefined;
  const goal: LearningGoal = {
    ...input,
    id: existing?.id ?? newId('g'),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const tx = db.transaction('learningGoals', 'readwrite');
  if (goal.priority) {
    // Un único objetivo prioritario a la vez.
    for (const g of await tx.store.getAll()) {
      if (g.id !== goal.id && g.priority) await tx.store.put({ ...g, priority: false, updatedAt: now });
    }
  }
  await tx.store.put(goal);
  await tx.done;
  notifyChange();
  return goal;
}

export async function deleteLearningGoal(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['learningGoals', 'learningSessions'], 'readwrite');
  await tx.objectStore('learningGoals').delete(id);
  const keys = await tx.objectStore('learningSessions').index('byGoal').getAllKeys(id);
  for (const k of keys) await tx.objectStore('learningSessions').delete(k);
  await tx.done;
  notifyChange();
}

export async function addLearningSession(input: Omit<LearningSession, 'id' | 'createdAt'>): Promise<LearningSession> {
  const s: LearningSession = { ...input, id: newId('ls'), createdAt: nowIso() };
  await (await getDB()).put('learningSessions', s);
  notifyChange();
  return s;
}

export async function deleteLearningSession(id: string): Promise<void> {
  await (await getDB()).delete('learningSessions', id);
  notifyChange();
}

export async function sessionsForGoal(goalId: string): Promise<LearningSession[]> {
  const list = await (await getDB()).getAllFromIndex('learningSessions', 'byGoal', goalId);
  return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function sessionsBetween(from: DateKey, to: DateKey): Promise<LearningSession[]> {
  return (await getDB()).getAllFromIndex('learningSessions', 'byDate', IDBKeyRange.bound(from, to));
}

export async function addFocusSession(input: Omit<FocusSession, 'id'>): Promise<FocusSession> {
  const s: FocusSession = { ...input, id: newId('f') };
  await (await getDB()).put('focusSessions', s);
  notifyChange();
  return s;
}

export async function focusBetween(from: DateKey, to: DateKey): Promise<FocusSession[]> {
  return (await getDB()).getAllFromIndex('focusSessions', 'byDate', IDBKeyRange.bound(from, to));
}

/* ───────────── Finanzas ───────────── */

export async function listTransactions(): Promise<Transaction[]> {
  const list = await (await getDB()).getAll('transactions');
  return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function transactionsBetween(from: DateKey, to: DateKey): Promise<Transaction[]> {
  return (await getDB()).getAllFromIndex('transactions', 'byDate', IDBKeyRange.bound(from, to));
}

export async function saveTransaction(
  input: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<Transaction> {
  const db = await getDB();
  const now = nowIso();
  const existing = input.id ? await db.get('transactions', input.id) : undefined;
  const tx: Transaction = {
    ...input,
    id: existing?.id ?? newId('t'),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.put('transactions', tx);
  notifyChange();
  return tx;
}

export async function deleteTransaction(id: string): Promise<void> {
  await (await getDB()).delete('transactions', id);
  notifyChange();
}

export async function listSavingsGoals(): Promise<SavingsGoal[]> {
  const list = await (await getDB()).getAll('savingsGoals');
  return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function saveSavingsGoal(
  input: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<SavingsGoal> {
  const db = await getDB();
  const now = nowIso();
  const existing = input.id ? await db.get('savingsGoals', input.id) : undefined;
  const goal: SavingsGoal = {
    ...input,
    id: existing?.id ?? newId('s'),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.put('savingsGoals', goal);
  notifyChange();
  return goal;
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  await (await getDB()).delete('savingsGoals', id);
  notifyChange();
}

/* ───────────── Relaciones, pausas, revisión semanal, cultura ───────────── */

export async function addConnectionLog(input: Omit<ConnectionLog, 'id' | 'createdAt'>): Promise<ConnectionLog> {
  const log: ConnectionLog = { ...input, id: newId('c'), createdAt: nowIso() };
  await (await getDB()).put('connectionLogs', log);
  notifyChange();
  return log;
}

export async function deleteConnectionLog(id: string): Promise<void> {
  await (await getDB()).delete('connectionLogs', id);
  notifyChange();
}

export async function connectionsBetween(from: DateKey, to: DateKey): Promise<ConnectionLog[]> {
  const list = await (await getDB()).getAllFromIndex('connectionLogs', 'byDate', IDBKeyRange.bound(from, to));
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addPause(input: Omit<PauseLog, 'id' | 'createdAt'>): Promise<PauseLog> {
  const p: PauseLog = { ...input, id: newId('p'), createdAt: nowIso() };
  await (await getDB()).put('pauses', p);
  notifyChange();
  return p;
}

export async function pausesBetween(from: DateKey, to: DateKey): Promise<PauseLog[]> {
  return (await getDB()).getAllFromIndex('pauses', 'byDate', IDBKeyRange.bound(from, to));
}

export async function getWeeklyReview(weekStart: DateKey): Promise<WeeklyReview | undefined> {
  return (await getDB()).get('weeklyReviews', weekStart);
}

export async function listWeeklyReviews(): Promise<WeeklyReview[]> {
  const list = await (await getDB()).getAll('weeklyReviews');
  return list.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

export async function saveWeeklyReview(
  input: Omit<WeeklyReview, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<WeeklyReview> {
  const db = await getDB();
  const existing = await db.get('weeklyReviews', input.weekStart);
  const now = nowIso();
  const r: WeeklyReview = { ...input, id: input.weekStart, createdAt: existing?.createdAt ?? now, updatedAt: now };
  await db.put('weeklyReviews', r);
  notifyChange();
  return r;
}

export async function listCardStates(): Promise<CardState[]> {
  return (await getDB()).getAll('cardStates');
}

export async function updateCardState(cardId: string, patch: Partial<Omit<CardState, 'cardId'>>): Promise<void> {
  const db = await getDB();
  const current = (await db.get('cardStates', cardId)) ?? { cardId, favorite: false };
  await db.put('cardStates', { ...current, ...patch, cardId });
  notifyChange();
}

/* ───────────── Actividad reciente ───────────── */

/**
 * Días desde la última práctica registrada (hábito, entrenamiento, sesión,
 * pausa, conexión o reflexión), mirando hasta 60 días atrás. null = sin registros.
 */
export async function daysSinceLastActivity(today: DateKey): Promise<number | null> {
  const from = addDays(today, -60);
  const [logs, workouts, sessions, pauses, conns, days] = await Promise.all([
    logsBetween(from, today),
    workoutsBetween(from, today),
    sessionsBetween(from, today),
    pausesBetween(from, today),
    connectionsBetween(from, today),
    daysBetween(from, today),
  ]);
  const dates = [
    ...logs.filter((l) => l.status === 'done' || l.status === 'partial').map((l) => l.date),
    ...workouts.filter((w) => w.status !== 'postponed').map((w) => w.date),
    ...sessions.map((s) => s.date),
    ...pauses.map((p) => p.date),
    ...conns.map((c) => c.date),
    ...days.filter((d) => d.morning || d.night).map((d) => d.date),
  ];
  if (!dates.length) return null;
  const last = dates.sort().at(-1)!;
  return diffDays(last, today);
}
