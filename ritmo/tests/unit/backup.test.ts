import { beforeEach, describe, expect, it } from 'vitest';
import { freshDB } from './helpers';
import { createBackup, parseBackupText, restoreBackup, validateBackup, wipeAllData } from '../../src/storage/backup';
import {
  addLearningSession,
  createHabit,
  getSettings,
  listHabits,
  listTransactions,
  logsForDate,
  saveLearningGoal,
  saveSettings,
  saveTransaction,
  setHabitStatus,
  updateDay,
  getDay,
} from '../../src/storage/repo';
import { DEFAULT_SETTINGS } from '../../src/domain/constants';

beforeEach(freshDB);

async function seed() {
  const h = await createHabit({
    name: 'Practicar inglés',
    description: '',
    category: 'futuro',
    frequency: { type: 'weekdays', days: [1, 3, 5] },
    moments: ['tarde'],
    durationMin: 30,
    fullVersion: '30 minutos',
    minimalVersion: 'tres frases',
    active: true,
    kind: 'permanent',
    startDate: '2026-10-01',
  });
  await setHabitStatus(h.id, '2026-10-23', 'done');
  await updateDay('2026-10-23', {
    checkIn: 'normal',
    night: { wentWell: 'todo', learned: '', improve: '', grateful: 'familia', tomorrow: '', financeSkipped: false, completedAt: 'x' },
  });
  await saveTransaction({ type: 'income', amountCents: 123456, currency: 'USD', category: 'Sueldo', date: '2026-10-01', description: 'pago', notes: '' });
  const g = await saveLearningGoal({ title: 'Inglés B1', area: 'ingles', why: '', priority: true, status: 'active', sessionMinutes: 30 });
  await addLearningSession({ goalId: g.id, date: '2026-10-23', intended: 'a', did: 'b', learned: 'c', next: 'd', minutes: 30 });
  await saveSettings({ ...DEFAULT_SETTINGS, userName: 'Martín', theme: 'dark' });
  return h;
}

describe('copias de seguridad', () => {
  it('exportar e importar preserva todos los datos', async () => {
    const h = await seed();
    const backup = await createBackup('1.0.0');
    const text = JSON.stringify(backup);

    await wipeAllData();
    expect(await listHabits()).toHaveLength(0);

    const parsed = parseBackupText(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    await restoreBackup(parsed.backup);

    expect((await listHabits())[0]).toEqual((backup.data.habits as unknown[])[0]);
    expect((await logsForDate('2026-10-23'))[0]).toMatchObject({ habitId: h.id, status: 'done' });
    expect((await getDay('2026-10-23'))?.night?.grateful).toBe('familia');
    expect((await listTransactions())[0]).toMatchObject({ amountCents: 123456, currency: 'USD' });
    expect((await getSettings()).userName).toBe('Martín');
    expect(JSON.stringify(await createBackup('1.0.0')).length).toBeGreaterThan(0);
    const again = await createBackup('1.0.0');
    expect(again.data).toEqual(backup.data);
  });

  it.each([
    ['texto que no es JSON', 'hola'],
    ['JSON de otra app', JSON.stringify({ app: 'otra', data: {} })],
    ['formato futuro', JSON.stringify({ app: 'ritmo', format: 99, data: {} })],
    ['sección con tipo incorrecto', JSON.stringify({ app: 'ritmo', format: 1, data: { habits: 'no' } })],
    [
      'hábito inválido',
      JSON.stringify({ app: 'ritmo', format: 1, data: { habits: [{ id: 'x', name: '' }] } }),
    ],
    [
      'movimiento con importe negativo',
      JSON.stringify({
        app: 'ritmo',
        format: 1,
        data: {
          transactions: [
            { id: 't', type: 'expense', amountCents: -5, currency: 'ARS', category: 'C', date: '2026-01-01', description: '', notes: '', createdAt: '', updatedAt: '' },
          ],
        },
      }),
    ],
    [
      'registro de un hábito inexistente',
      JSON.stringify({ app: 'ritmo', format: 1, data: { habitLogs: [{ id: 'a|2026-01-01', habitId: 'a', date: '2026-01-01', status: 'done', updatedAt: '' }] } }),
    ],
  ])('rechaza %s sin tocar los datos existentes', async (_name, text) => {
    await seed();
    const before = await createBackup('1.0.0');
    const result = parseBackupText(text);
    expect(result.ok).toBe(false);
    const after = await createBackup('1.0.0');
    expect(after.data).toEqual(before.data);
  });

  it('acepta copias de versiones anteriores sin almacenes nuevos', () => {
    const r = validateBackup({ app: 'ritmo', format: 1, schemaVersion: 1, data: { habits: [], habitLogs: [] } });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.backup.data.cardStates).toEqual([]);
  });

  it('si la restauración falla a mitad de camino, no se pierde nada', async () => {
    await seed();
    const before = await createBackup('1.0.0');
    const good = await createBackup('1.0.0');
    // Forzamos un error dentro de la transacción: una clave inválida para IndexedDB.
    (good.data.transactions as unknown[]).push({ ...good.data.transactions[0], id: undefined });
    await expect(restoreBackup(good)).rejects.toBeTruthy();
    const after = await createBackup('1.0.0');
    expect(after.data).toEqual(before.data);
  });
});
