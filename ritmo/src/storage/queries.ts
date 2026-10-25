import { addDays, weekStart, type DateKey } from '../lib/date';
import { activityByDay, type ActivityData } from '../domain/stats';
import type { AreaId } from '../domain/types';
import {
  connectionsBetween,
  daysBetween,
  daysSinceLastActivity,
  focusBetween,
  getDay,
  listHabits,
  listLearningGoals,
  logsBetween,
  pausesBetween,
  sessionsBetween,
  transactionsBetween,
  workoutsBetween,
} from './repo';

/** Carga toda la actividad de un rango (para estadísticas y calendario). */
export async function loadActivity(from: DateKey, to: DateKey): Promise<ActivityData> {
  const [habits, logs, workouts, sessions, focus, pauses, connections, days, transactions, goals] = await Promise.all([
    listHabits(),
    logsBetween(from, to),
    workoutsBetween(from, to),
    sessionsBetween(from, to),
    focusBetween(from, to),
    pausesBetween(from, to),
    connectionsBetween(from, to),
    daysBetween(from, to),
    transactionsBetween(from, to),
    listLearningGoals(),
  ]);
  return { habits, logs, workouts, sessions, focus, pauses, connections, days, transactions, goals };
}

export async function loadToday(date: DateKey) {
  const ws = weekStart(date);
  const [activity, weekLogs, day, sinceLast] = await Promise.all([
    loadActivity(date, date),
    logsBetween(ws, date),
    getDay(date),
    daysSinceLastActivity(addDays(date, -1)).then((n) => (n === null ? null : n + 1)),
  ]);
  const areasToday: Set<AreaId> = activityByDay(activity, date, date).get(date)?.areas ?? new Set();
  return {
    habits: activity.habits,
    logsToday: activity.logs,
    logsWeek: weekLogs,
    day,
    areasToday,
    workoutsToday: activity.workouts,
    activityCountToday: activityByDay(activity, date, date).get(date)?.count ?? 0,
    daysSinceLastActivity: sinceLast,
  };
}
