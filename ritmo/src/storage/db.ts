import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  CardState,
  ConnectionLog,
  DayEntry,
  FocusSession,
  Habit,
  HabitLog,
  LearningGoal,
  LearningSession,
  PauseLog,
  SavingsGoal,
  Transaction,
  WeeklyReview,
  Workout,
} from '../domain/types';

export const DB_NAME = 'ritmo';
/**
 * Historial de versiones del esquema local:
 *  v1 — almacenes base (hábitos, registros, días, finanzas, aprendizaje…).
 *  v2 — agrega fichas leídas (cardStates) y sesiones de enfoque (focusSessions);
 *       asigna `order` a hábitos antiguos que no lo tenían.
 * Las migraciones solo AGREGAN o completan datos: nunca borran registros.
 */
export const DB_VERSION = 2;

interface MetaRecord {
  key: string;
  value: unknown;
}

export interface RitmoDB extends DBSchema {
  habits: { key: string; value: Habit };
  habitLogs: { key: string; value: HabitLog; indexes: { byDate: string; byHabit: string } };
  days: { key: string; value: DayEntry };
  workouts: { key: string; value: Workout; indexes: { byDate: string } };
  learningGoals: { key: string; value: LearningGoal };
  learningSessions: { key: string; value: LearningSession; indexes: { byDate: string; byGoal: string } };
  transactions: { key: string; value: Transaction; indexes: { byDate: string } };
  savingsGoals: { key: string; value: SavingsGoal };
  connectionLogs: { key: string; value: ConnectionLog; indexes: { byDate: string } };
  pauses: { key: string; value: PauseLog; indexes: { byDate: string } };
  weeklyReviews: { key: string; value: WeeklyReview };
  meta: { key: string; value: MetaRecord };
  cardStates: { key: string; value: CardState };
  focusSessions: { key: string; value: FocusSession; indexes: { byDate: string } };
}

export type StoreName =
  | 'habits'
  | 'habitLogs'
  | 'days'
  | 'workouts'
  | 'learningGoals'
  | 'learningSessions'
  | 'transactions'
  | 'savingsGoals'
  | 'connectionLogs'
  | 'pauses'
  | 'weeklyReviews'
  | 'meta'
  | 'cardStates'
  | 'focusSessions';

/** Almacenes con datos del usuario que se incluyen en la copia de seguridad. */
export const DATA_STORES = [
  'habits',
  'habitLogs',
  'days',
  'workouts',
  'learningGoals',
  'learningSessions',
  'transactions',
  'savingsGoals',
  'connectionLogs',
  'pauses',
  'weeklyReviews',
  'cardStates',
  'focusSessions',
] as const satisfies readonly StoreName[];

export type DataStore = (typeof DATA_STORES)[number];

export function openRitmoDB(name = DB_NAME, version = DB_VERSION): Promise<IDBPDatabase<RitmoDB>> {
  return openDB<RitmoDB>(name, version, {
    async upgrade(db, oldVersion, _newVersion, tx) {
      if (oldVersion < 1) {
        db.createObjectStore('habits', { keyPath: 'id' });
        const logs = db.createObjectStore('habitLogs', { keyPath: 'id' });
        logs.createIndex('byDate', 'date');
        logs.createIndex('byHabit', 'habitId');
        db.createObjectStore('days', { keyPath: 'date' });
        db.createObjectStore('workouts', { keyPath: 'id' }).createIndex('byDate', 'date');
        db.createObjectStore('learningGoals', { keyPath: 'id' });
        const ls = db.createObjectStore('learningSessions', { keyPath: 'id' });
        ls.createIndex('byDate', 'date');
        ls.createIndex('byGoal', 'goalId');
        db.createObjectStore('transactions', { keyPath: 'id' }).createIndex('byDate', 'date');
        db.createObjectStore('savingsGoals', { keyPath: 'id' });
        db.createObjectStore('connectionLogs', { keyPath: 'id' }).createIndex('byDate', 'date');
        db.createObjectStore('pauses', { keyPath: 'id' }).createIndex('byDate', 'date');
        db.createObjectStore('weeklyReviews', { keyPath: 'id' });
        db.createObjectStore('meta', { keyPath: 'key' });
      }
      if (oldVersion < 2) {
        db.createObjectStore('cardStates', { keyPath: 'cardId' });
        db.createObjectStore('focusSessions', { keyPath: 'id' }).createIndex('byDate', 'date');
        // Migración de datos: hábitos creados antes de existir el orden manual.
        const habits = tx.objectStore('habits');
        let cursor = await habits.openCursor();
        let i = 0;
        while (cursor) {
          const h = cursor.value as Habit & { order?: number };
          if (typeof h.order !== 'number') await cursor.update({ ...h, order: i });
          i++;
          cursor = await cursor.continue();
        }
      }
    },
    blocked() {
      // Otra pestaña tiene abierta una versión anterior; se resolverá al cerrarla.
    },
    blocking() {
      // Una versión nueva de la app necesita actualizar el esquema: liberamos la conexión.
      dbPromise?.then((db) => db.close());
      dbPromise = null;
    },
  });
}

let dbPromise: Promise<IDBPDatabase<RitmoDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<RitmoDB>> {
  if (!dbPromise) {
    dbPromise = openRitmoDB().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

/** Solo para pruebas: cierra y olvida la conexión actual. */
export async function resetDBConnection(): Promise<void> {
  if (dbPromise) {
    try {
      (await dbPromise).close();
    } catch {
      /* ignorar */
    }
  }
  dbPromise = null;
}
