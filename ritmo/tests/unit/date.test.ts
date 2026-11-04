import { describe, expect, it } from 'vitest';
import { addDays, addMonths, diffDays, isValidDateKey, monthBounds, parseHHMM, toDateKey, weekStart } from '../../src/lib/date';
import { currentMoment, greeting, pickByDay } from '../../src/domain/day';
import { DEFAULT_SETTINGS } from '../../src/domain/constants';

describe('fechas locales', () => {
  it('usa la fecha LOCAL, no UTC, cerca de medianoche', () => {
    expect(toDateKey(new Date(2026, 9, 23, 23, 59, 59))).toBe('2026-10-23');
    expect(toDateKey(new Date(2026, 9, 24, 0, 0, 1))).toBe('2026-10-24');
  });

  it('suma días cruzando meses y años', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(diffDays('2026-10-01', '2026-10-23')).toBe(22);
  });

  it('valida claves de fecha', () => {
    expect(isValidDateKey('2026-02-29')).toBe(false);
    expect(isValidDateKey('2024-02-29')).toBe(true);
    expect(isValidDateKey('2026-1-1')).toBe(false);
    expect(isValidDateKey(20261010)).toBe(false);
  });

  it('calcula el lunes de la semana', () => {
    expect(weekStart('2026-10-23')).toBe('2026-10-19'); // viernes → lunes
    expect(weekStart('2026-10-25')).toBe('2026-10-19'); // domingo → lunes anterior
    expect(weekStart('2026-10-19')).toBe('2026-10-19');
  });

  it('maneja meses', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(monthBounds('2024-02')).toEqual({ from: '2024-02-01', to: '2024-02-29' });
  });

  it('parsea horarios HH:MM', () => {
    expect(parseHHMM('06:30')).toBe(390);
    expect(parseHHMM('24:00')).toBeNull();
    expect(parseHHMM('7:00')).toBeNull();
  });
});

describe('día', () => {
  it('saluda según la hora', () => {
    expect(greeting(new Date(2026, 0, 1, 8))).toBe('Buen día');
    expect(greeting(new Date(2026, 0, 1, 15), 'Ana')).toBe('Buenas tardes, Ana');
    expect(greeting(new Date(2026, 0, 1, 22))).toBe('Buenas noches');
  });

  it('elige el momento según los horarios configurados', () => {
    const s = DEFAULT_SETTINGS;
    expect(currentMoment(new Date(2026, 0, 1, 7, 0), s)).toBe('manana');
    expect(currentMoment(new Date(2026, 0, 1, 16, 0), s)).toBe('tarde');
    expect(currentMoment(new Date(2026, 0, 1, 23, 0), s)).toBe('noche');
    expect(currentMoment(new Date(2026, 0, 1, 3, 0), s)).toBe('noche'); // madrugada
  });

  it('no repite la frase del día dos días seguidos', () => {
    const items = ['a', 'b', 'c'];
    expect(pickByDay(items, '2026-10-23')).not.toBe(pickByDay(items, '2026-10-24'));
    expect(pickByDay(items, '2026-10-23')).toBe(pickByDay(items, '2026-10-23'));
  });
});
