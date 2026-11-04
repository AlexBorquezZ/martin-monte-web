import type { HabitInput } from '../storage/repo';
import type { DateKey } from '../lib/date';

/** Hábitos de ejemplo opcionales para empezar rápido. Se pueden editar o borrar. */
export function sampleHabits(today: DateKey): HabitInput[] {
  const base = { active: true, kind: 'permanent' as const, startDate: today };
  return [
    {
      ...base,
      name: 'Practicar inglés',
      description: 'Un poco cada día rinde más que mucho de vez en cuando.',
      category: 'futuro',
      frequency: { type: 'daily' },
      moments: ['tarde'],
      durationMin: 30,
      fullVersion: '30 minutos de práctica',
      minimalVersion: 'Aprender y pronunciar tres frases',
    },
    {
      ...base,
      name: 'Calmar la mente',
      description: 'Un rato para bajar el ritmo.',
      category: 'mente',
      frequency: { type: 'daily' },
      moments: ['manana', 'noche'],
      durationMin: 10,
      fullVersion: 'Meditar 10 minutos',
      minimalVersion: 'Respirar tranquilamente durante un minuto',
    },
    {
      ...base,
      name: 'Mover el cuerpo',
      description: 'Fuerza, caminata o movilidad: lo que el día permita.',
      category: 'cuerpo',
      frequency: { type: 'weekly', times: 4 },
      moments: ['cuerpo'],
      durationMin: 25,
      fullVersion: 'Rutina de fuerza o caminata de 25 minutos',
      minimalVersion: 'Cinco minutos de movilidad',
    },
    {
      ...base,
      name: 'Anotar gastos',
      description: 'Saber adónde va el dinero, sin juzgarse.',
      category: 'finanzas',
      frequency: { type: 'daily' },
      moments: ['noche'],
      durationMin: 3,
      fullVersion: 'Registrar todos los gastos del día',
      minimalVersion: 'Registrar el gasto más grande',
    },
    {
      ...base,
      name: 'Conectar con alguien',
      description: 'Una charla, un mensaje o un rato compartido.',
      category: 'relaciones',
      frequency: { type: 'weekly', times: 2 },
      moments: ['relaciones'],
      durationMin: 15,
      fullVersion: 'Una charla o encuentro sin apuro',
      minimalVersion: 'Un mensaje sincero a alguien importante',
    },
  ];
}
