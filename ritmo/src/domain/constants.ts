import type { AreaId, CheckIn, Currency, EnergyLevel, HabitStatus, LearningArea, MomentId, Settings } from './types';

export const AREAS: { id: AreaId; label: string; hint: string }[] = [
  { id: 'cuerpo', label: 'Cuerpo', hint: 'Salud, fuerza, energía, descanso y movimiento' },
  { id: 'mente', label: 'Mente', hint: 'Calma, atención y autoconocimiento' },
  { id: 'finanzas', label: 'Finanzas', hint: 'Orden económico e independencia' },
  { id: 'futuro', label: 'Futuro', hint: 'Aprendizaje, proyectos y crecimiento' },
  { id: 'relaciones', label: 'Relaciones', hint: 'Personas, curiosidad y experiencias' },
];

export const AREA_LABEL: Record<AreaId, string> = Object.fromEntries(AREAS.map((a) => [a.id, a.label])) as Record<
  AreaId,
  string
>;

export const MOMENTS: { id: MomentId; label: string; subtitle: string }[] = [
  { id: 'manana', label: 'Mañana', subtitle: 'Orientación' },
  { id: 'cuerpo', label: 'Cuerpo', subtitle: 'Movimiento y energía' },
  { id: 'tarde', label: 'Tarde', subtitle: 'Futuro y crecimiento' },
  { id: 'relaciones', label: 'Relaciones', subtitle: 'Conexión y curiosidad' },
  { id: 'noche', label: 'Noche', subtitle: 'Cierre y calma' },
];

export const MOMENT_LABEL: Record<MomentId, string> = Object.fromEntries(MOMENTS.map((m) => [m.id, m.label])) as Record<
  MomentId,
  string
>;

export const STATUS_LABEL: Record<HabitStatus, string> = {
  done: 'Completo',
  partial: 'Versión mínima',
  postponed: 'Pospuesto',
  skipped: 'Hoy no',
};

export const CHECKIN_OPTIONS: { id: CheckIn; label: string; hint: string }[] = [
  { id: 'energia', label: 'Con energía', hint: 'Puedo sumar un desafío' },
  { id: 'normal', label: 'Normal', hint: 'Un día común' },
  { id: 'cansado', label: 'Cansado', hint: 'Mejor lo mínimo' },
  { id: 'descanso', label: 'Necesito descansar', hint: 'Descansar también suma' },
];

export const ENERGY_OPTIONS: { id: EnergyLevel; label: string }[] = [
  { id: 'bajo', label: 'Baja' },
  { id: 'medio', label: 'Media' },
  { id: 'alto', label: 'Alta' },
];

export const LEARNING_AREAS: { id: LearningArea; label: string }[] = [
  { id: 'ingles', label: 'Inglés' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'ia', label: 'IA y automatización' },
  { id: 'finanzas', label: 'Finanzas personales' },
  { id: 'lectura', label: 'Lectura y cultura general' },
  { id: 'proyectos', label: 'Proyectos personales' },
];

export const CURRENCIES: Currency[] = ['ARS', 'USD', 'EUR'];

export const DEFAULT_SETTINGS: Settings = {
  appName: 'RITMO',
  userName: '',
  theme: 'auto',
  moments: {
    manana: { enabled: true, start: '06:30', durationMin: 5 },
    cuerpo: { enabled: true, start: '09:00', durationMin: 20 },
    tarde: { enabled: true, start: '15:00', durationMin: 30 },
    relaciones: { enabled: true, start: '19:00', durationMin: 15 },
    noche: { enabled: true, start: '21:30', durationMin: 5 },
  },
  reminders: {
    enabled: false,
    moments: { manana: true, cuerpo: false, tarde: true, relaciones: false, noche: true },
  },
  focusMinutes: 25,
  breakMinutes: 5,
  pauseMinutes: 2,
  breathing: { inhale: 4, hold: 2, exhale: 6 },
  defaultCurrency: 'ARS',
  expenseCategories: ['Comida', 'Casa', 'Transporte', 'Salud', 'Educación', 'Ocio', 'Servicios', 'Otros'],
  incomeCategories: ['Sueldo', 'Ventas', 'Trabajo independiente', 'Regalo', 'Otros'],
};
