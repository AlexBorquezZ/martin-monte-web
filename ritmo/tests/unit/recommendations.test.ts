import { describe, expect, it } from 'vitest';
import { recommend, type RecContext } from '../../src/domain/recommendations';
import type { AreaId, Habit, HabitLog } from '../../src/domain/types';
import { isScheduledOn, weeklyGoalMet, flexibleConsistency } from '../../src/domain/habits';

let order = 0;
function habit(p: Partial<Habit> & { category: AreaId }): Habit {
  order++;
  return {
    id: `h${order}`,
    name: `Hábito ${order}`,
    description: '',
    frequency: { type: 'daily' },
    moments: [],
    durationMin: 10,
    fullVersion: 'versión completa',
    minimalVersion: 'versión mínima',
    active: true,
    kind: 'permanent',
    startDate: '2026-01-01',
    order,
    createdAt: '',
    updatedAt: '',
    ...p,
  };
}

const log = (habitId: string, date: string, status: HabitLog['status']): HabitLog => ({
  id: `${habitId}|${date}`,
  habitId,
  date,
  status,
  updatedAt: '',
});

const habits = [
  habit({ category: 'cuerpo', name: 'Entrenar' }),
  habit({ category: 'futuro', name: 'Inglés', moments: ['tarde'] }),
  habit({ category: 'mente', name: 'Meditar' }),
  habit({ category: 'relaciones', name: 'Llamar' }),
  habit({ category: 'finanzas', name: 'Gastos' }),
];

function ctx(p: Partial<RecContext>): RecContext {
  return {
    date: '2026-10-23',
    moment: 'tarde',
    habits,
    logsToday: [],
    logsWeek: [],
    areasToday: new Set(),
    workoutDoneToday: false,
    daysSinceLastActivity: 0,
    ...p,
  };
}

describe('adaptación diaria', () => {
  it('con energía normal propone cuerpo, crecimiento y bienestar', () => {
    const r = recommend(ctx({ checkIn: 'normal' }));
    expect(r.items).toHaveLength(3);
    expect(r.items.map((i) => i.area)).toEqual(['cuerpo', 'futuro', 'mente']);
    expect(r.items.every((i) => !i.minimal)).toBe(true);
    expect(r.extraChallenge).toBeUndefined();
  });

  it('con cansancio reduce la cantidad y usa versiones mínimas', () => {
    const r = recommend(ctx({ checkIn: 'cansado' }));
    expect(r.items.length).toBeLessThanOrEqual(2);
    expect(r.items.every((i) => i.minimal)).toBe(true);
  });

  it('si necesito descansar, recomienda descanso y nunca un entrenamiento', () => {
    const r = recommend(ctx({ checkIn: 'descanso' }));
    expect(r.items[0].type).toBe('rest');
    expect(r.items.length).toBeLessThanOrEqual(2);
    expect(r.items.some((i) => i.area === 'cuerpo' && i.type !== 'rest')).toBe(false);
    expect(r.items.some((i) => i.type === 'workout')).toBe(false);
  });

  it('con mucha energía ofrece un desafío extra opcional', () => {
    const r = recommend(ctx({ checkIn: 'energia' }));
    expect(r.items).toHaveLength(3);
    expect(r.extraChallenge).toBeDefined();
    expect(r.items.map((i) => i.key)).not.toContain(r.extraChallenge!.key.replace('extra:', 'habit:'));
  });

  it('prioriza lo que todavía no se hizo', () => {
    const done = [log(habits[0].id, '2026-10-23', 'done'), log(habits[1].id, '2026-10-23', 'partial')];
    const r = recommend(ctx({ checkIn: 'normal', logsToday: done, areasToday: new Set(['cuerpo', 'futuro']) }));
    const ids = r.items.map((i) => i.habitId);
    expect(ids).not.toContain(habits[0].id);
    expect(ids).not.toContain(habits[1].id);
  });

  it('usa la energía de la mañana si no hay check-in', () => {
    expect(recommend(ctx({ morningEnergy: 'bajo' })).level).toBe('cansado');
    expect(recommend(ctx({ morningEnergy: 'alto' })).level).toBe('energia');
  });

  it('después de días sin registros propone retomar con lo mínimo, sin reproches', () => {
    const r = recommend(ctx({ checkIn: 'normal', daysSinceLastActivity: 4 }));
    expect(r.restarting).toBe(true);
    expect(r.items.length).toBeLessThanOrEqual(2);
    expect(r.items.every((i) => i.minimal)).toBe(true);
    expect(r.note).not.toMatch(/fall|perdi|racha/i);
  });

  it('si todo está hecho, no inventa tareas', () => {
    const all = habits.map((h) => log(h.id, '2026-10-23', 'done'));
    const r = recommend(
      ctx({ checkIn: 'normal', logsToday: all, areasToday: new Set(['cuerpo', 'mente', 'finanzas', 'futuro', 'relaciones']) }),
    );
    expect(r.items).toHaveLength(0);
  });
});

describe('programación de hábitos', () => {
  it('respeta días fijos, inactivos y hábitos temporales', () => {
    const lunes = habit({ category: 'mente', frequency: { type: 'weekdays', days: [1] } });
    expect(isScheduledOn(lunes, '2026-10-19')).toBe(true);
    expect(isScheduledOn(lunes, '2026-10-20')).toBe(false);
    expect(isScheduledOn({ ...lunes, active: false }, '2026-10-19')).toBe(false);
    const temp = habit({ category: 'futuro', kind: 'temporary', startDate: '2026-10-01', endDate: '2026-10-10' });
    expect(isScheduledOn(temp, '2026-10-05')).toBe(true);
    expect(isScheduledOn(temp, '2026-10-11')).toBe(false);
    expect(isScheduledOn(temp, '2026-09-30')).toBe(false);
  });

  it('cuenta la meta semanal de "N veces por semana"', () => {
    const h = habit({ category: 'cuerpo', frequency: { type: 'weekly', times: 2 } });
    const logs = [log(h.id, '2026-10-19', 'done'), log(h.id, '2026-10-21', 'partial')];
    expect(weeklyGoalMet(h, logs, '2026-10-23')).toBe(true);
    expect(weeklyGoalMet(h, logs.slice(0, 1), '2026-10-23')).toBe(false);
  });

  it('mide la continuidad de forma flexible (sin rachas)', () => {
    const h = habit({ category: 'mente' });
    const logs = [log(h.id, '2026-10-01', 'done'), log(h.id, '2026-10-05', 'partial'), log(h.id, '2026-10-06', 'skipped')];
    expect(flexibleConsistency(h, logs, '2026-10-01', '2026-10-10')).toEqual({ practiced: 2, available: 10 });
  });
});
