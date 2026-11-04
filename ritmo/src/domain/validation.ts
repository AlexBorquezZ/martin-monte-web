import { isValidDateKey, parseHHMM } from '../lib/date';
import { AREAS, CURRENCIES, DEFAULT_SETTINGS, LEARNING_AREAS, MOMENTS } from './constants';
import type {
  AreaId,
  CardState,
  ConnectionLog,
  DayEntry,
  FocusSession,
  Frequency,
  Habit,
  HabitLog,
  LearningGoal,
  LearningSession,
  MomentId,
  PauseLog,
  SavingsGoal,
  Settings,
  Transaction,
  WeeklyReview,
  Workout,
} from './types';

type Rec = Record<string, unknown>;

const isObj = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isOptStr = (v: unknown) => v === undefined || isStr(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isInt = (v: unknown): v is number => Number.isInteger(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const oneOf = <T extends string>(v: unknown, list: readonly T[]): v is T => isStr(v) && list.includes(v as T);
const nonEmpty = (v: unknown): v is string => isStr(v) && v.trim().length > 0;
const optDate = (v: unknown) => v === undefined || isValidDateKey(v);
const optRange = (v: unknown, min: number, max: number) => v === undefined || (isNum(v) && v >= min && v <= max);

const AREA_IDS = AREAS.map((a) => a.id);
const MOMENT_IDS = MOMENTS.map((m) => m.id);

export function isFrequency(v: unknown): v is Frequency {
  if (!isObj(v)) return false;
  if (v.type === 'daily') return true;
  if (v.type === 'weekdays')
    return Array.isArray(v.days) && v.days.length > 0 && v.days.every((d) => isInt(d) && d >= 0 && d <= 6);
  if (v.type === 'weekly') return isInt(v.times) && v.times >= 1 && v.times <= 7;
  return false;
}

export function isHabit(v: unknown): v is Habit {
  return (
    isObj(v) &&
    nonEmpty(v.id) &&
    nonEmpty(v.name) &&
    isStr(v.description) &&
    oneOf(v.category, AREA_IDS) &&
    isFrequency(v.frequency) &&
    Array.isArray(v.moments) &&
    v.moments.every((m) => oneOf(m, MOMENT_IDS)) &&
    isNum(v.durationMin) &&
    v.durationMin >= 0 &&
    isStr(v.fullVersion) &&
    isStr(v.minimalVersion) &&
    isBool(v.active) &&
    oneOf(v.kind, ['permanent', 'temporary'] as const) &&
    isValidDateKey(v.startDate) &&
    optDate(v.endDate) &&
    isNum(v.order) &&
    isStr(v.createdAt) &&
    isStr(v.updatedAt)
  );
}

export function isHabitLog(v: unknown): v is HabitLog {
  return (
    isObj(v) &&
    nonEmpty(v.id) &&
    nonEmpty(v.habitId) &&
    isValidDateKey(v.date) &&
    oneOf(v.status, ['done', 'partial', 'postponed', 'skipped'] as const) &&
    isOptStr(v.note) &&
    isStr(v.updatedAt)
  );
}

export function isDayEntry(v: unknown): v is DayEntry {
  if (!isObj(v) || !isValidDateKey(v.date) || !isStr(v.updatedAt)) return false;
  if (v.checkIn !== undefined && !oneOf(v.checkIn, ['energia', 'normal', 'cansado', 'descanso'] as const)) return false;
  if (!isOptStr(v.reflection)) return false;
  if (v.morning !== undefined) {
    const m = v.morning;
    if (
      !isObj(m) ||
      !isStr(m.intention) ||
      !isStr(m.gratitude) ||
      !isStr(m.priority) ||
      !isStr(m.challenge) ||
      !oneOf(m.energy, ['bajo', 'medio', 'alto'] as const)
    )
      return false;
  }
  if (v.night !== undefined) {
    const n = v.night;
    if (
      !isObj(n) ||
      !isStr(n.wentWell) ||
      !isStr(n.learned) ||
      !isStr(n.improve) ||
      !isStr(n.grateful) ||
      !isStr(n.tomorrow) ||
      !isBool(n.financeSkipped)
    )
      return false;
  }
  if (v.body !== undefined) {
    const b = v.body;
    if (
      !isObj(b) ||
      !optRange(b.sleepHours, 0, 24) ||
      !optRange(b.sleepQuality, 1, 5) ||
      !optRange(b.energy, 1, 5) ||
      !optRange(b.recovery, 1, 5)
    )
      return false;
  }
  return true;
}

export function isWorkout(v: unknown): v is Workout {
  return (
    isObj(v) &&
    nonEmpty(v.id) &&
    isValidDateKey(v.date) &&
    isOptStr(v.routineId) &&
    nonEmpty(v.title) &&
    isNum(v.durationMin) &&
    v.durationMin >= 0 &&
    oneOf(v.status, ['completed', 'partial', 'postponed'] as const) &&
    isStr(v.notes) &&
    isStr(v.createdAt)
  );
}

export function isLearningGoal(v: unknown): v is LearningGoal {
  return (
    isObj(v) &&
    nonEmpty(v.id) &&
    nonEmpty(v.title) &&
    oneOf(
      v.area,
      LEARNING_AREAS.map((a) => a.id),
    ) &&
    isStr(v.why) &&
    isBool(v.priority) &&
    oneOf(v.status, ['active', 'archived'] as const) &&
    isNum(v.sessionMinutes) &&
    isStr(v.createdAt) &&
    isStr(v.updatedAt)
  );
}

export function isLearningSession(v: unknown): v is LearningSession {
  return (
    isObj(v) &&
    nonEmpty(v.id) &&
    nonEmpty(v.goalId) &&
    isValidDateKey(v.date) &&
    isStr(v.intended) &&
    isStr(v.did) &&
    isStr(v.learned) &&
    isStr(v.next) &&
    isNum(v.minutes) &&
    v.minutes >= 0 &&
    isStr(v.createdAt)
  );
}

export function isFocusSession(v: unknown): v is FocusSession {
  return (
    isObj(v) &&
    nonEmpty(v.id) &&
    isValidDateKey(v.date) &&
    isNum(v.minutes) &&
    v.minutes >= 0 &&
    isOptStr(v.goalId) &&
    isStr(v.label) &&
    isStr(v.completedAt)
  );
}

export function isTransaction(v: unknown): v is Transaction {
  return (
    isObj(v) &&
    nonEmpty(v.id) &&
    oneOf(v.type, ['income', 'expense'] as const) &&
    isInt(v.amountCents) &&
    v.amountCents > 0 &&
    oneOf(v.currency, CURRENCIES) &&
    nonEmpty(v.category) &&
    isValidDateKey(v.date) &&
    isStr(v.description) &&
    isStr(v.notes) &&
    isStr(v.createdAt) &&
    isStr(v.updatedAt)
  );
}

export function isSavingsGoal(v: unknown): v is SavingsGoal {
  return (
    isObj(v) &&
    nonEmpty(v.id) &&
    nonEmpty(v.name) &&
    isInt(v.targetCents) &&
    v.targetCents > 0 &&
    isInt(v.savedCents) &&
    v.savedCents >= 0 &&
    oneOf(v.currency, CURRENCIES) &&
    optDate(v.deadline) &&
    isStr(v.createdAt) &&
    isStr(v.updatedAt)
  );
}

export function isConnectionLog(v: unknown): v is ConnectionLog {
  return (
    isObj(v) &&
    nonEmpty(v.id) &&
    isValidDateKey(v.date) &&
    isStr(v.promptId) &&
    isStr(v.text) &&
    isStr(v.note) &&
    isStr(v.createdAt)
  );
}

export function isPauseLog(v: unknown): v is PauseLog {
  return (
    isObj(v) &&
    nonEmpty(v.id) &&
    isValidDateKey(v.date) &&
    oneOf(v.kind, ['respiracion', 'observacion', 'pensamientos', 'gratitud', 'nada'] as const) &&
    isNum(v.seconds) &&
    v.seconds >= 0 &&
    isOptStr(v.note) &&
    isStr(v.createdAt)
  );
}

export function isWeeklyReview(v: unknown): v is WeeklyReview {
  return (
    isObj(v) &&
    isValidDateKey(v.id) &&
    v.id === v.weekStart &&
    isStr(v.wentWell) &&
    isStr(v.learned) &&
    isStr(v.adjust) &&
    Array.isArray(v.priorities) &&
    v.priorities.every(isStr) &&
    Array.isArray(v.focusAreas) &&
    v.focusAreas.every((a) => oneOf(a, AREA_IDS)) &&
    isStr(v.createdAt) &&
    isStr(v.updatedAt)
  );
}

export function isCardState(v: unknown): v is CardState {
  return isObj(v) && nonEmpty(v.cardId) && isOptStr(v.readAt) && isBool(v.favorite);
}

const clampInt = (v: unknown, min: number, max: number, fallback: number) =>
  isNum(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;

function cleanCategories(v: unknown, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback;
  const list = Array.from(new Set(v.filter(nonEmpty).map((s) => s.trim().slice(0, 40))));
  return list.length ? list : fallback;
}

/**
 * Normaliza la configuración: completa los valores faltantes con los
 * predeterminados. Permite que versiones nuevas agreguen opciones sin romper
 * la configuración guardada por versiones anteriores.
 */
export function normalizeSettings(raw: unknown): Settings {
  const d = DEFAULT_SETTINGS;
  if (!isObj(raw)) return structuredClone(d);
  const moments = {} as Settings['moments'];
  const reminderMoments = {} as Settings['reminders']['moments'];
  const rawMoments = isObj(raw.moments) ? raw.moments : {};
  const rawRem = isObj(raw.reminders) ? raw.reminders : {};
  const rawRemMoments = isObj(rawRem.moments) ? rawRem.moments : {};
  for (const id of MOMENT_IDS as MomentId[]) {
    const m = isObj(rawMoments[id]) ? (rawMoments[id] as Rec) : {};
    moments[id] = {
      enabled: isBool(m.enabled) ? m.enabled : d.moments[id].enabled,
      start: isStr(m.start) && parseHHMM(m.start) !== null ? m.start : d.moments[id].start,
      durationMin: clampInt(m.durationMin, 1, 240, d.moments[id].durationMin),
    };
    reminderMoments[id] = isBool(rawRemMoments[id]) ? (rawRemMoments[id] as boolean) : d.reminders.moments[id];
  }
  const b = isObj(raw.breathing) ? raw.breathing : {};
  return {
    appName: nonEmpty(raw.appName) ? raw.appName.trim().slice(0, 30) : d.appName,
    userName: isStr(raw.userName) ? raw.userName.trim().slice(0, 40) : d.userName,
    theme: oneOf(raw.theme, ['auto', 'light', 'dark'] as const) ? raw.theme : d.theme,
    moments,
    reminders: { enabled: isBool(rawRem.enabled) ? rawRem.enabled : false, moments: reminderMoments },
    focusMinutes: clampInt(raw.focusMinutes, 1, 180, d.focusMinutes),
    breakMinutes: clampInt(raw.breakMinutes, 1, 60, d.breakMinutes),
    pauseMinutes: clampInt(raw.pauseMinutes, 1, 5, d.pauseMinutes),
    breathing: {
      inhale: clampInt(b.inhale, 2, 10, d.breathing.inhale),
      hold: clampInt(b.hold, 0, 10, d.breathing.hold),
      exhale: clampInt(b.exhale, 2, 12, d.breathing.exhale),
    },
    defaultCurrency: oneOf(raw.defaultCurrency, CURRENCIES) ? raw.defaultCurrency : d.defaultCurrency,
    expenseCategories: cleanCategories(raw.expenseCategories, d.expenseCategories),
    incomeCategories: cleanCategories(raw.incomeCategories, d.incomeCategories),
  };
}

export function isAreaId(v: unknown): v is AreaId {
  return oneOf(v, AREA_IDS);
}
