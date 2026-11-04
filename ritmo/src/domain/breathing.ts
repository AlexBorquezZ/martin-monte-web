export interface BreathPhase {
  name: 'inhale' | 'hold' | 'exhale';
  label: string;
  /** Segundos transcurridos dentro de la fase. */
  elapsed: number;
  duration: number;
}

/** Fase de respiración para un instante dado, según un ritmo inhalar/sostener/exhalar. */
export function breathPhaseAt(seconds: number, rhythm: { inhale: number; hold: number; exhale: number }): BreathPhase {
  const cycle = rhythm.inhale + rhythm.hold + rhythm.exhale;
  const t = ((seconds % cycle) + cycle) % cycle;
  if (t < rhythm.inhale) return { name: 'inhale', label: 'Inhalá', elapsed: t, duration: rhythm.inhale };
  if (t < rhythm.inhale + rhythm.hold)
    return { name: 'hold', label: 'Sostené', elapsed: t - rhythm.inhale, duration: rhythm.hold };
  return { name: 'exhale', label: 'Exhalá', elapsed: t - rhythm.inhale - rhythm.hold, duration: rhythm.exhale };
}
