import { beforeEach, describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { freshDB } from './helpers';
import { DB_NAME, DB_VERSION, getDB, resetDBConnection } from '../../src/storage/db';
import {
  createHabit,
  deleteHabit,
  getSettings,
  listHabits,
  logsForDate,
  logsForHabit,
  moveHabit,
  saveSettings,
  saveTransaction,
  listTransactions,
  setHabitStatus,
  updateDay,
  getDay,
  updateHabit,
  daysSinceLastActivity,
  type HabitInput,
} from '../../src/storage/repo';
import { DEFAULT_SETTINGS } from '../../src/domain/constants';

const input = (name: string): HabitInput => ({
  name,
  description: '',
  category: 'mente',
  frequency: { type: 'daily' },
  moments: ['manana'],
  durationMin: 10,
  fullVersion: 'Meditar 10 minutos',
  minimalVersion: 'Respirar un minuto',
  active: true,
  kind: 'permanent',
  startDate: '2026-10-01',
});

beforeEach(freshDB);

describe('persistencia local', () => {
  it('los hábitos y registros sobreviven a cerrar y reabrir la base', async () => {
    const h = await createHabit(input('Calmar la mente'));
    await setHabitStatus(h.id, '2026-10-23', 'partial');
    await updateDay('2026-10-23', { checkIn: 'cansado' });
    await saveTransaction({
      type: 'expense',
      amountCents: 1500,
      currency: 'ARS',
      category: 'Comida',
      date: '2026-10-23',
      description: 'pan',
      notes: '',
    });

    await resetDBConnection(); // simula cerrar la app

    const habits = await listHabits();
    expect(habits.map((x) => x.name)).toEqual(['Calmar la mente']);
    expect((await logsForDate('2026-10-23'))[0]).toMatchObject({ habitId: h.id, status: 'partial' });
    expect((await getDay('2026-10-23'))?.checkIn).toBe('cansado');
    expect(await listTransactions()).toHaveLength(1);
  });

  it('separa correctamente los registros de días distintos', async () => {
    const h = await createHabit(input('Inglés'));
    await setHabitStatus(h.id, '2026-10-23', 'done');
    await setHabitStatus(h.id, '2026-10-24', 'postponed');
    await updateDay('2026-10-23', { reflection: 'día 23' });
    await updateDay('2026-10-24', { reflection: 'día 24' });

    expect((await logsForDate('2026-10-23')).map((l) => l.status)).toEqual(['done']);
    expect((await logsForDate('2026-10-24')).map((l) => l.status)).toEqual(['postponed']);
    expect((await getDay('2026-10-23'))?.reflection).toBe('día 23');
    expect((await getDay('2026-10-24'))?.reflection).toBe('día 24');
    expect(await logsForDate('2026-10-25')).toEqual([]);
  });

  it('un solo registro por hábito y día: marcar de nuevo lo reemplaza, null lo quita', async () => {
    const h = await createHabit(input('Inglés'));
    await setHabitStatus(h.id, '2026-10-23', 'postponed');
    await setHabitStatus(h.id, '2026-10-23', 'done');
    expect(await logsForHabit(h.id)).toHaveLength(1);
    expect((await logsForHabit(h.id))[0].status).toBe('done');
    await setHabitStatus(h.id, '2026-10-23', null);
    expect(await logsForHabit(h.id)).toHaveLength(0);
  });

  it('desactivar un hábito conserva su historial; eliminarlo lo borra', async () => {
    const h = await createHabit(input('Leer'));
    await setHabitStatus(h.id, '2026-10-20', 'done');
    await updateHabit(h.id, { active: false });
    expect((await listHabits())[0].active).toBe(false);
    expect(await logsForHabit(h.id)).toHaveLength(1);
    await deleteHabit(h.id);
    expect(await listHabits()).toHaveLength(0);
    expect(await logsForHabit(h.id)).toHaveLength(0);
  });

  it('reordena hábitos', async () => {
    const a = await createHabit(input('A'));
    await createHabit(input('B'));
    await createHabit(input('C'));
    await moveHabit(a.id, 1);
    expect((await listHabits()).map((h) => h.name)).toEqual(['B', 'A', 'C']);
    await moveHabit(a.id, -1);
    await moveHabit(a.id, -1); // ya está primero: no hace nada
    expect((await listHabits()).map((h) => h.name)).toEqual(['A', 'B', 'C']);
  });

  it('la configuración se guarda normalizada', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
    await saveSettings({ ...DEFAULT_SETTINGS, userName: '  Martín  ', focusMinutes: 999 });
    const s = await getSettings();
    expect(s.userName).toBe('Martín');
    expect(s.focusMinutes).toBe(180);
  });

  it('calcula los días desde la última actividad', async () => {
    expect(await daysSinceLastActivity('2026-10-23')).toBeNull();
    const h = await createHabit(input('Inglés'));
    await setHabitStatus(h.id, '2026-10-20', 'done');
    await setHabitStatus(h.id, '2026-10-22', 'skipped'); // "hoy no" no cuenta como práctica
    expect(await daysSinceLastActivity('2026-10-23')).toBe(3);
  });
});

describe('migraciones del esquema', () => {
  it('actualizar de v1 a la versión actual conserva los datos y completa campos nuevos', async () => {
    // Base creada por la versión 1 de la app (sin `order` en hábitos ni almacenes nuevos).
    const old = await openDB(DB_NAME, 1, {
      upgrade(db) {
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
      },
    });
    const { order: _o, ...legacy } = { ...input('Hábito viejo'), id: 'h_old', createdAt: 'x', updatedAt: 'x', order: 0 };
    void _o;
    await old.put('habits', legacy);
    await old.put('habitLogs', { id: 'h_old|2026-01-01', habitId: 'h_old', date: '2026-01-01', status: 'done', updatedAt: 'x' });
    await old.put('meta', { key: 'settings', value: { ...DEFAULT_SETTINGS, userName: 'Ana' } });
    old.close();

    await resetDBConnection();
    const db = await getDB();
    expect(db.version).toBe(DB_VERSION);
    expect([...db.objectStoreNames]).toEqual(expect.arrayContaining(['cardStates', 'focusSessions']));
    const habits = await listHabits();
    expect(habits).toHaveLength(1);
    expect(habits[0]).toMatchObject({ id: 'h_old', name: 'Hábito viejo', order: 0 });
    expect(await logsForHabit('h_old')).toHaveLength(1);
    expect((await getSettings()).userName).toBe('Ana');
  });
});
