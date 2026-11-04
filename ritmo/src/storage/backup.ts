import { nowIso } from '../lib/date';
import {
  isCardState,
  isConnectionLog,
  isDayEntry,
  isFocusSession,
  isHabit,
  isHabitLog,
  isLearningGoal,
  isLearningSession,
  isPauseLog,
  isSavingsGoal,
  isTransaction,
  isWeeklyReview,
  isWorkout,
  normalizeSettings,
} from '../domain/validation';
import type { Settings } from '../domain/types';
import { DATA_STORES, DB_VERSION, getDB, type DataStore, type RitmoDB } from './db';
import { notifyChange } from './events';

export const BACKUP_APP_ID = 'ritmo';
export const BACKUP_FORMAT = 1;

export type BackupData = { [K in DataStore]: RitmoDB[K]['value'][] };

export interface Backup {
  app: typeof BACKUP_APP_ID;
  format: number;
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  settings: Settings;
  data: BackupData;
}

const VALIDATORS: Record<DataStore, (v: unknown) => boolean> = {
  habits: isHabit,
  habitLogs: isHabitLog,
  days: isDayEntry,
  workouts: isWorkout,
  learningGoals: isLearningGoal,
  learningSessions: isLearningSession,
  transactions: isTransaction,
  savingsGoals: isSavingsGoal,
  connectionLogs: isConnectionLog,
  pauses: isPauseLog,
  weeklyReviews: isWeeklyReview,
  cardStates: isCardState,
  focusSessions: isFocusSession,
};

const KEY_OF: Record<DataStore, string> = {
  habits: 'id',
  habitLogs: 'id',
  days: 'date',
  workouts: 'id',
  learningGoals: 'id',
  learningSessions: 'id',
  transactions: 'id',
  savingsGoals: 'id',
  connectionLogs: 'id',
  pauses: 'id',
  weeklyReviews: 'id',
  cardStates: 'cardId',
  focusSessions: 'id',
};

const STORE_LABEL: Record<DataStore, string> = {
  habits: 'hábitos',
  habitLogs: 'registros de hábitos',
  days: 'días',
  workouts: 'entrenamientos',
  learningGoals: 'objetivos de aprendizaje',
  learningSessions: 'sesiones de aprendizaje',
  transactions: 'movimientos',
  savingsGoals: 'objetivos de ahorro',
  connectionLogs: 'conexiones',
  pauses: 'pausas',
  weeklyReviews: 'revisiones semanales',
  cardStates: 'fichas',
  focusSessions: 'sesiones de enfoque',
};

export async function createBackup(appVersion: string): Promise<Backup> {
  const db = await getDB();
  const tx = db.transaction([...DATA_STORES, 'meta'], 'readonly');
  const data = {} as BackupData;
  for (const store of DATA_STORES) {
    (data as Record<string, unknown[]>)[store] = await tx.objectStore(store).getAll();
  }
  const settingsRec = await tx.objectStore('meta').get('settings');
  await tx.done;
  return {
    app: BACKUP_APP_ID,
    format: BACKUP_FORMAT,
    schemaVersion: DB_VERSION,
    appVersion,
    exportedAt: nowIso(),
    settings: normalizeSettings(settingsRec?.value),
    data,
  };
}

export type ValidationResult = { ok: true; backup: Backup; counts: Record<DataStore, number> } | { ok: false; error: string };

/**
 * Valida por completo un archivo de copia de seguridad ANTES de tocar el
 * almacenamiento. Si algo no es válido, devuelve un error y no modifica nada.
 * Los almacenes ausentes (copias de versiones anteriores) se toman como vacíos.
 */
export function validateBackup(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'El archivo no tiene el formato de una copia de RITMO.' };
  }
  const r = raw as Record<string, unknown>;
  if (r.app !== BACKUP_APP_ID) return { ok: false, error: 'El archivo no parece una copia de seguridad de RITMO.' };
  if (typeof r.format !== 'number' || r.format > BACKUP_FORMAT) {
    return { ok: false, error: 'La copia fue creada por una versión más nueva de RITMO. Actualizá la app e intentá de nuevo.' };
  }
  if (typeof r.data !== 'object' || r.data === null || Array.isArray(r.data)) {
    return { ok: false, error: 'La copia no contiene datos.' };
  }
  const src = r.data as Record<string, unknown>;
  const data = {} as BackupData;
  const counts = {} as Record<DataStore, number>;
  for (const store of DATA_STORES) {
    const list = src[store] ?? [];
    if (!Array.isArray(list)) return { ok: false, error: `La sección «${STORE_LABEL[store]}» no es válida.` };
    const seen = new Set<unknown>();
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!VALIDATORS[store](item)) {
        return { ok: false, error: `Hay un elemento inválido en «${STORE_LABEL[store]}» (posición ${i + 1}).` };
      }
      const key = (item as Record<string, unknown>)[KEY_OF[store]];
      if (seen.has(key)) return { ok: false, error: `Hay elementos duplicados en «${STORE_LABEL[store]}».` };
      seen.add(key);
    }
    (data as Record<string, unknown[]>)[store] = list;
    counts[store] = list.length;
  }
  // Coherencia: cada registro de hábito debe pertenecer a un hábito existente.
  const habitIds = new Set(data.habits.map((h) => h.id));
  if (data.habitLogs.some((l) => !habitIds.has(l.habitId))) {
    return { ok: false, error: 'Hay registros de hábitos que no corresponden a ningún hábito.' };
  }
  return {
    ok: true,
    counts,
    backup: {
      app: BACKUP_APP_ID,
      format: BACKUP_FORMAT,
      schemaVersion: typeof r.schemaVersion === 'number' ? r.schemaVersion : 1,
      appVersion: typeof r.appVersion === 'string' ? r.appVersion : 'desconocida',
      exportedAt: typeof r.exportedAt === 'string' ? r.exportedAt : '',
      settings: normalizeSettings(r.settings),
      data,
    },
  };
}

export function parseBackupText(text: string): ValidationResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }
  return validateBackup(raw);
}

/**
 * Reemplaza todos los datos por los de la copia, en UNA sola transacción:
 * si algo falla a mitad de camino, IndexedDB revierte todo y los datos
 * anteriores quedan intactos.
 */
export async function restoreBackup(backup: Backup): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([...DATA_STORES, 'meta'], 'readwrite');
  // Evita un rechazo sin manejar si la transacción se aborta: el error se propaga abajo.
  tx.done.catch(() => undefined);
  try {
    for (const store of DATA_STORES) {
      const os = tx.objectStore(store);
      await os.clear();
      for (const item of backup.data[store] as never[]) await os.put(item);
    }
    await tx.objectStore('meta').put({ key: 'settings', value: backup.settings });
    await tx.done;
  } catch (err) {
    try {
      tx.abort();
    } catch {
      /* ya abortada */
    }
    throw err;
  }
  notifyChange();
}

/** Borra todos los datos personales (la interfaz exige confirmación explícita). */
export async function wipeAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([...DATA_STORES, 'meta'], 'readwrite');
  for (const store of DATA_STORES) await tx.objectStore(store).clear();
  await tx.objectStore('meta').clear();
  await tx.done;
  notifyChange();
}

export function backupFileName(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `ritmo-copia-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.json`;
}
