import { isValidDateKey } from '../lib/date';
import type { AreaId, Frequency, MomentId } from './types';
import type { HabitInput } from '../storage/repo';

export interface HabitFormValues {
  name: string;
  description: string;
  category: AreaId;
  freqType: Frequency['type'];
  days: number[];
  times: number;
  moments: MomentId[];
  durationMin: number;
  fullVersion: string;
  minimalVersion: string;
  active: boolean;
  kind: 'permanent' | 'temporary';
  startDate: string;
  endDate: string;
}

export type HabitFormErrors = Partial<Record<keyof HabitFormValues, string>>;

export function validateHabitForm(v: HabitFormValues): { errors: HabitFormErrors; input?: HabitInput } {
  const errors: HabitFormErrors = {};
  const name = v.name.trim();
  if (!name) errors.name = 'Poné un nombre corto para el hábito.';
  else if (name.length > 80) errors.name = 'El nombre es muy largo (máximo 80 caracteres).';
  if (v.freqType === 'weekdays' && v.days.length === 0) errors.days = 'Elegí al menos un día.';
  if (v.freqType === 'weekly' && !(Number.isInteger(v.times) && v.times >= 1 && v.times <= 7))
    errors.times = 'Elegí entre 1 y 7 veces por semana.';
  if (!(Number.isFinite(v.durationMin) && v.durationMin >= 0 && v.durationMin <= 600))
    errors.durationMin = 'La duración debe estar entre 0 y 600 minutos.';
  if (!isValidDateKey(v.startDate)) errors.startDate = 'Elegí una fecha de inicio válida.';
  if (v.kind === 'temporary') {
    if (!isValidDateKey(v.endDate)) errors.endDate = 'Un hábito temporal necesita fecha de fin.';
    else if (v.endDate < v.startDate) errors.endDate = 'La fecha de fin debe ser posterior al inicio.';
  }
  if (Object.keys(errors).length) return { errors };
  const frequency: Frequency =
    v.freqType === 'daily'
      ? { type: 'daily' }
      : v.freqType === 'weekdays'
        ? { type: 'weekdays', days: [...v.days].sort() }
        : { type: 'weekly', times: v.times };
  const input: HabitInput = {
    name,
    description: v.description.trim().slice(0, 500),
    category: v.category,
    frequency,
    moments: v.moments,
    durationMin: Math.round(v.durationMin),
    fullVersion: v.fullVersion.trim().slice(0, 200),
    minimalVersion: v.minimalVersion.trim().slice(0, 200),
    active: v.active,
    kind: v.kind,
    startDate: v.startDate,
    ...(v.kind === 'temporary' ? { endDate: v.endDate } : {}),
  };
  return { errors, input };
}
