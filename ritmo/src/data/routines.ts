/**
 * Rutinas de peso corporal para casa y espacios pequeños.
 * Son propuestas generales, no prescripciones: cada persona ajusta según su cuerpo.
 */
export interface Exercise {
  name: string;
  dose: string;
  easier?: string;
}

export interface Routine {
  id: string;
  title: string;
  kind: 'fuerza' | 'movilidad' | 'caminata';
  intensity: 'suave' | 'media' | 'exigente';
  minutes: number;
  description: string;
  exercises: Exercise[];
}

export const ROUTINES: Routine[] = [
  {
    id: 'movilidad-5',
    title: 'Movilidad de 5 minutos',
    kind: 'movilidad',
    intensity: 'suave',
    minutes: 5,
    description: 'Para despertar el cuerpo o cortar un rato largo sentado.',
    exercises: [
      { name: 'Círculos de hombros', dose: '10 hacia adelante y 10 hacia atrás' },
      { name: 'Rotaciones de cuello suaves', dose: '5 por lado, sin forzar' },
      { name: 'Gato-vaca en cuatro apoyos', dose: '8 repeticiones lentas' },
      { name: 'Estocada con apertura de pecho', dose: '5 por lado' },
      { name: 'Sentadilla profunda sostenida', dose: '30 segundos', easier: 'Agarrado de una mesa' },
    ],
  },
  {
    id: 'fuerza-basica',
    title: 'Fuerza básica en casa',
    kind: 'fuerza',
    intensity: 'media',
    minutes: 20,
    description: 'Tres vueltas. Descansá entre 60 y 90 segundos entre vueltas.',
    exercises: [
      { name: 'Sentadillas', dose: '10–15', easier: 'Sentarse y pararse de una silla' },
      { name: 'Flexiones de brazos', dose: '6–12', easier: 'Con manos en una mesa o en la pared' },
      { name: 'Puente de glúteos', dose: '12–15' },
      { name: 'Remo invertido bajo una mesa firme', dose: '6–10', easier: 'Remo con una toalla en una puerta' },
      { name: 'Plancha', dose: '20–40 segundos', easier: 'Con rodillas apoyadas' },
    ],
  },
  {
    id: 'calistenia-completa',
    title: 'Calistenia completa',
    kind: 'fuerza',
    intensity: 'exigente',
    minutes: 35,
    description: 'Cuatro vueltas para días con energía. Priorizá la técnica antes que la cantidad.',
    exercises: [
      { name: 'Sentadilla búlgara (pie atrás en una silla)', dose: '8–10 por pierna' },
      { name: 'Flexiones (o flexiones con pies elevados)', dose: '10–15' },
      { name: 'Fondos en silla estable', dose: '8–12', easier: 'Con piernas flexionadas' },
      { name: 'Zancadas alternadas', dose: '10 por pierna' },
      { name: 'Plancha lateral', dose: '20–30 segundos por lado' },
      { name: 'Escaladores', dose: '30 segundos' },
    ],
  },
  {
    id: 'espacio-chico',
    title: 'Rutina para espacios chicos',
    kind: 'fuerza',
    intensity: 'media',
    minutes: 12,
    description: 'Cabe en un metro cuadrado. 40 segundos de trabajo y 20 de descanso, dos vueltas.',
    exercises: [
      { name: 'Sentadilla con pausa abajo', dose: '40 s' },
      { name: 'Flexiones inclinadas', dose: '40 s' },
      { name: 'Elevaciones de talones', dose: '40 s' },
      { name: 'Bicho muerto (dead bug)', dose: '40 s' },
      { name: 'Marcha en el lugar con rodillas altas', dose: '40 s' },
    ],
  },
  {
    id: 'caminata-20',
    title: 'Caminata de 20 minutos',
    kind: 'caminata',
    intensity: 'suave',
    minutes: 20,
    description: 'A un ritmo en el que puedas conversar. Si podés, sin auriculares un rato y mirando alrededor.',
    exercises: [
      { name: 'Primeros 5 minutos', dose: 'Ritmo tranquilo' },
      { name: 'Siguientes 10 minutos', dose: 'Ritmo un poco más vivo' },
      { name: 'Últimos 5 minutos', dose: 'Ritmo tranquilo y respiración lenta' },
    ],
  },
  {
    id: 'pausa-activa',
    title: 'Pausa activa de 3 minutos',
    kind: 'movilidad',
    intensity: 'suave',
    minutes: 3,
    description: 'Para hacer entre tareas. Levantarse ya es la mitad.',
    exercises: [
      { name: 'Pararse y estirar los brazos hacia arriba', dose: '3 respiraciones' },
      { name: 'Inclinaciones laterales', dose: '5 por lado' },
      { name: 'Sentadillas lentas', dose: '10' },
      { name: 'Caminar por la casa', dose: '1 minuto' },
    ],
  },
];
