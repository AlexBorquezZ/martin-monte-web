/**
 * Sistema de adaptación diaria basado en reglas locales (sin IA externa).
 * Solo usa lo que la persona declaró (check-in / energía) y lo que registró.
 * No infiere emociones ni diagnósticos.
 */
import type { DateKey } from '../lib/date';
import { isScheduledOn, weeklyGoalMet } from './habits';
import type { AreaId, CheckIn, EnergyLevel, Habit, HabitLog, MomentId } from './types';
import { checkInFromEnergy } from './day';

export type Level = CheckIn | 'sin-dato';

export interface Recommendation {
  key: string;
  type: 'habit' | 'rest' | 'workout' | 'learning' | 'connection' | 'pause';
  title: string;
  detail: string;
  area?: AreaId;
  habitId?: string;
  minimal: boolean;
  to?: string;
}

export interface RecContext {
  date: DateKey;
  moment: MomentId;
  checkIn?: CheckIn;
  morningEnergy?: EnergyLevel;
  habits: Habit[];
  logsToday: HabitLog[];
  logsWeek: HabitLog[];
  areasToday: Set<AreaId>;
  workoutDoneToday: boolean;
  daysSinceLastActivity: number | null;
}

export interface RecResult {
  level: Level;
  items: Recommendation[];
  extraChallenge?: Recommendation;
  restarting: boolean;
  note: string;
}

const GROUPS: { id: string; areas: AreaId[] }[] = [
  { id: 'cuerpo', areas: ['cuerpo'] },
  { id: 'crecimiento', areas: ['futuro', 'finanzas'] },
  { id: 'bienestar', areas: ['mente', 'relaciones'] },
];

export function effectiveLevel(checkIn?: CheckIn, energy?: EnergyLevel): Level {
  if (checkIn) return checkIn;
  if (energy) return checkInFromEnergy(energy);
  return 'sin-dato';
}

function habitRec(h: Habit, minimal: boolean): Recommendation {
  const version = minimal ? h.minimalVersion || h.fullVersion : h.fullVersion || h.minimalVersion;
  return {
    key: `habit:${h.id}`,
    type: 'habit',
    title: h.name,
    detail: version || h.description || (h.durationMin ? `${h.durationMin} min` : ''),
    area: h.category,
    habitId: h.id,
    minimal,
  };
}

const FALLBACK: Record<string, (minimal: boolean) => Recommendation> = {
  cuerpo: (minimal) => ({
    key: 'fallback:cuerpo',
    type: 'workout',
    title: minimal ? 'Movilidad suave' : 'Mover el cuerpo',
    detail: minimal ? 'Cinco minutos de estiramientos o una caminata corta.' : 'Una rutina corta de fuerza o una caminata de 20 minutos.',
    area: 'cuerpo',
    minimal,
    to: '/momento/cuerpo',
  }),
  crecimiento: (minimal) => ({
    key: 'fallback:crecimiento',
    type: 'learning',
    title: minimal ? 'Aprender algo breve' : 'Sesión de aprendizaje',
    detail: minimal ? 'Diez minutos con tu objetivo de aprendizaje o una ficha de cultura.' : 'Un bloque de enfoque con tu objetivo prioritario.',
    area: 'futuro',
    minimal,
    to: '/momento/tarde',
  }),
  bienestar: (minimal) => ({
    key: 'fallback:bienestar',
    type: minimal ? 'pause' : 'connection',
    title: minimal ? 'Una pausa consciente' : 'Un momento de conexión',
    detail: minimal ? 'Uno a cinco minutos para respirar u observar.' : 'Escribirle a alguien o hacer algo placentero sin pantallas.',
    area: minimal ? 'mente' : 'relaciones',
    minimal,
    to: minimal ? '/pausa' : '/momento/relaciones',
  }),
};

const REST_REC: Recommendation = {
  key: 'rest',
  type: 'rest',
  title: 'Descansar de verdad',
  detail: 'Hoy el objetivo es recuperar energía. Descansar también es avanzar.',
  area: 'cuerpo',
  minimal: true,
};

/** Candidatos: hábitos de hoy que todavía no se hicieron (ni se decidió saltear). */
export function pendingHabits(ctx: Pick<RecContext, 'habits' | 'logsToday' | 'logsWeek' | 'date' | 'moment'>): Habit[] {
  const statusById = new Map(ctx.logsToday.map((l) => [l.habitId, l.status]));
  return ctx.habits
    .filter((h) => isScheduledOn(h, ctx.date))
    .filter((h) => {
      const s = statusById.get(h.id);
      return s === undefined || s === 'postponed';
    })
    .filter((h) => !weeklyGoalMet(h, ctx.logsWeek, ctx.date))
    .map((h) => ({ h, score: score(h, ctx.moment, statusById.get(h.id)) }))
    .sort((a, b) => b.score - a.score || a.h.order - b.h.order)
    .map((x) => x.h);
}

function score(h: Habit, moment: MomentId, status?: string): number {
  let s = 0;
  if (h.moments.includes(moment)) s += 3;
  if (h.moments.length === 0) s += 1;
  if (status === 'postponed') s -= 2;
  return s;
}

export function recommend(ctx: RecContext): RecResult {
  const level = effectiveLevel(ctx.checkIn, ctx.morningEnergy);
  const restarting = ctx.daysSinceLastActivity === null ? false : ctx.daysSinceLastActivity >= 2;
  const pending = pendingHabits(ctx);
  const items: Recommendation[] = [];
  const used = new Set<string>();
  const add = (r: Recommendation) => {
    if (!used.has(r.key)) {
      used.add(r.key);
      items.push(r);
    }
  };

  if (level === 'descanso') {
    add(REST_REC);
    // Una sola acción mínima y tranquila (nunca entrenamiento).
    const calm = pending.find((h) => h.category === 'mente' || h.category === 'relaciones');
    add(calm ? habitRec(calm, true) : FALLBACK.bienestar(true));
    return { level, items, restarting, note: 'Hoy toca cuidarte. Todo lo demás puede esperar.' };
  }

  if (level === 'cansado' || restarting) {
    const max = 2;
    for (const h of pending) {
      if (items.length >= max) break;
      add(habitRec(h, true));
    }
    if (items.length < max && !ctx.areasToday.has('mente')) add(FALLBACK.bienestar(true));
    if (items.length < max && !ctx.workoutDoneToday && !ctx.areasToday.has('cuerpo')) add(FALLBACK.cuerpo(true));
    return {
      level,
      items: items.slice(0, max),
      restarting,
      note: restarting
        ? 'Volver también es parte del ritmo. Empezá con la versión mínima.'
        : 'Con poca energía, la versión mínima es una gran elección.',
    };
  }

  // Normal, con energía o sin dato: una acción corporal, una de crecimiento y una de bienestar.
  const max = level === 'sin-dato' ? 2 : 3;
  for (const g of GROUPS) {
    if (items.length >= max) break;
    const h = pending.find((p) => g.areas.includes(p.category) && !used.has(`habit:${p.id}`));
    if (h) add(habitRec(h, false));
    else if (!g.areas.some((a) => ctx.areasToday.has(a))) {
      if (g.id === 'cuerpo' && ctx.workoutDoneToday) continue;
      add(FALLBACK[g.id](false));
    }
  }
  for (const h of pending) {
    if (items.length >= max) break;
    add(habitRec(h, false));
  }

  let extraChallenge: Recommendation | undefined;
  if (level === 'energia') {
    const extra = pending.find((h) => !used.has(`habit:${h.id}`));
    extraChallenge = extra
      ? { ...habitRec(extra, false), key: `extra:${extra.id}` }
      : {
          key: 'extra:enfoque',
          type: 'learning',
          title: 'Un bloque extra de enfoque',
          detail: 'Si te dan ganas: 25 minutos más con tu objetivo de aprendizaje. Es opcional.',
          area: 'futuro',
          minimal: false,
          to: '/foco',
        };
  }

  const note =
    items.length === 0
      ? 'Ya atendiste lo que te propusiste. Disfrutá el resto del día.'
      : level === 'energia'
        ? 'Buen día para avanzar. El desafío extra es opcional.'
        : level === 'sin-dato'
          ? 'Contame cómo estás y ajusto las sugerencias.'
          : 'Una acción para el cuerpo, una para crecer y una para el bienestar.';

  return { level, items, extraChallenge, restarting, note };
}
