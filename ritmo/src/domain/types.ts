import type { DateKey } from '../lib/date';

export type AreaId = 'cuerpo' | 'mente' | 'finanzas' | 'futuro' | 'relaciones';
export type MomentId = 'manana' | 'cuerpo' | 'tarde' | 'relaciones' | 'noche';
export type HabitStatus = 'done' | 'partial' | 'postponed' | 'skipped';
export type CheckIn = 'energia' | 'normal' | 'cansado' | 'descanso';
export type EnergyLevel = 'bajo' | 'medio' | 'alto';

export type Frequency =
  | { type: 'daily' }
  | { type: 'weekdays'; days: number[] } // 0 = domingo … 6 = sábado
  | { type: 'weekly'; times: number }; // N veces por semana, cualquier día

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: AreaId;
  frequency: Frequency;
  moments: MomentId[];
  durationMin: number;
  fullVersion: string;
  minimalVersion: string;
  active: boolean;
  kind: 'permanent' | 'temporary';
  startDate: DateKey;
  endDate?: DateKey;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  /** `${habitId}|${date}`: un único registro por hábito y día. */
  id: string;
  habitId: string;
  date: DateKey;
  status: HabitStatus;
  note?: string;
  updatedAt: string;
}

export interface MorningEntry {
  intention: string;
  gratitude: string;
  priority: string;
  challenge: string;
  energy: EnergyLevel;
  completedAt: string;
}

export interface NightEntry {
  wentWell: string;
  learned: string;
  improve: string;
  grateful: string;
  tomorrow: string;
  financeSkipped: boolean;
  completedAt: string;
}

export interface BodyEntry {
  sleepHours?: number;
  sleepQuality?: number; // 1–5
  energy?: number; // 1–5
  recovery?: number; // 1–5
}

export interface DayEntry {
  date: DateKey;
  checkIn?: CheckIn;
  reflection?: string; // respuesta opcional a la pregunta del día
  morning?: MorningEntry;
  night?: NightEntry;
  body?: BodyEntry;
  updatedAt: string;
}

export type WorkoutStatus = 'completed' | 'partial' | 'postponed';

export interface Workout {
  id: string;
  date: DateKey;
  routineId?: string;
  title: string;
  durationMin: number;
  status: WorkoutStatus;
  notes: string;
  createdAt: string;
}

export type LearningArea = 'ingles' | 'ventas' | 'ia' | 'finanzas' | 'lectura' | 'proyectos';

export interface LearningGoal {
  id: string;
  title: string;
  area: LearningArea;
  why: string;
  priority: boolean;
  status: 'active' | 'archived';
  sessionMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningSession {
  id: string;
  goalId: string;
  date: DateKey;
  intended: string;
  did: string;
  learned: string;
  next: string;
  minutes: number;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  date: DateKey;
  minutes: number;
  goalId?: string;
  label: string;
  completedAt: string;
}

export type Currency = 'ARS' | 'USD' | 'EUR';
export type TxType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TxType;
  /** Importe en centavos (entero positivo) para evitar errores de coma flotante. */
  amountCents: number;
  currency: Currency;
  category: string;
  date: DateKey;
  description: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetCents: number;
  savedCents: number;
  currency: Currency;
  deadline?: DateKey;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionLog {
  id: string;
  date: DateKey;
  promptId: string;
  text: string;
  note: string;
  createdAt: string;
}

export type PauseKind = 'respiracion' | 'observacion' | 'pensamientos' | 'gratitud' | 'nada';

export interface PauseLog {
  id: string;
  date: DateKey;
  kind: PauseKind;
  seconds: number;
  note?: string;
  createdAt: string;
}

export interface WeeklyReview {
  /** Lunes de la semana revisada. */
  id: DateKey;
  weekStart: DateKey;
  wentWell: string;
  learned: string;
  adjust: string;
  priorities: string[];
  focusAreas: AreaId[];
  createdAt: string;
  updatedAt: string;
}

export interface CardState {
  cardId: string;
  readAt?: string;
  favorite: boolean;
}

export interface MomentConfig {
  enabled: boolean;
  start: string; // HH:MM
  durationMin: number;
}

export type ThemePref = 'auto' | 'light' | 'dark';

export interface Settings {
  appName: string;
  userName: string;
  theme: ThemePref;
  moments: Record<MomentId, MomentConfig>;
  reminders: { enabled: boolean; moments: Record<MomentId, boolean> };
  focusMinutes: number;
  breakMinutes: number;
  pauseMinutes: number;
  breathing: { inhale: number; hold: number; exhale: number };
  defaultCurrency: Currency;
  expenseCategories: string[];
  incomeCategories: string[];
}
