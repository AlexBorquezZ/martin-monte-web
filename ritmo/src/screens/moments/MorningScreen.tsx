import { useState } from 'react';
import { useApp, useQuery } from '../../app/AppContext';
import { navigate } from '../../app/router';
import { ChoiceChips, PageHeader, TextInput } from '../../components/ui';
import { ENERGY_OPTIONS } from '../../domain/constants';
import { checkInFromEnergy, energyFromCheckIn } from '../../domain/day';
import type { EnergyLevel } from '../../domain/types';
import { nowIso } from '../../lib/date';
import { getDay, updateDay } from '../../storage/repo';

const CHALLENGES = [
  'Hablar con alguien nuevo',
  'Caminar 10 minutos sin el teléfono',
  'Aprender una palabra nueva en inglés',
  'Ordenar un espacio pequeño',
  'Tomar agua antes de cada comida',
  'Hacer una pausa de respiración a media tarde',
];

const LOAD_HINT: Record<EnergyLevel, string> = {
  bajo: 'Hoy vamos con lo mínimo: una o dos acciones pequeñas, y descanso si hace falta.',
  medio: 'Un día normal: una acción para el cuerpo, una para crecer y una para el bienestar.',
  alto: 'Buen día para avanzar. Si querés, sumá un desafío extra (sin obligación).',
};

export function MorningScreen() {
  const { today, settings } = useApp();
  const { data: day, loaded } = useQuery(() => getDay(today), [today]);
  if (!loaded) return <p className="muted">Cargando…</p>;
  return <MorningForm key={`${today}-${day?.updatedAt ?? 'nuevo'}`} today={today} minutes={settings.moments.manana.durationMin} initial={day} />;
}

function MorningForm({
  today,
  minutes,
  initial,
}: {
  today: string;
  minutes: number;
  initial: Awaited<ReturnType<typeof getDay>>;
}) {
  const { toast } = useApp();
  const m = initial?.morning;
  const [intention, setIntention] = useState(m?.intention ?? '');
  const [gratitude, setGratitude] = useState(m?.gratitude ?? '');
  const [priority, setPriority] = useState(m?.priority ?? '');
  const [challenge, setChallenge] = useState(m?.challenge ?? '');
  const [energy, setEnergy] = useState<EnergyLevel | undefined>(
    m?.energy ?? (initial?.checkIn ? energyFromCheckIn(initial.checkIn) : undefined),
  );

  return (
    <>
      <PageHeader title="Mañana · Orientación" subtitle={`Entre 3 y ${Math.max(3, minutes)} minutos. Todo es opcional.`} back />
      <p className="hero__phrase" style={{ marginTop: 0 }}>
        Hoy no necesito resolver toda mi vida. Solo necesito dar el siguiente paso.
      </p>
      <form
        className="card"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!energy) {
            toast('Elegí tu nivel de energía para ajustar el día.');
            return;
          }
          await updateDay(today, {
            morning: {
              intention: intention.trim(),
              gratitude: gratitude.trim(),
              priority: priority.trim(),
              challenge: challenge.trim(),
              energy,
              completedAt: nowIso(),
            },
            // La energía declarada ajusta las sugerencias, salvo que ya haya un check-in.
            checkIn: initial?.checkIn ?? checkInFromEnergy(energy),
          });
          toast('Listo. Que tengas un buen día.');
          navigate('/');
        }}
      >
        <ChoiceChips
          legend="¿Con qué energía empezás?"
          value={energy}
          onChange={setEnergy}
          options={ENERGY_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
        />
        {energy && <p className="small muted" style={{ marginTop: -6 }}>{LOAD_HINT[energy]}</p>}
        <TextInput label="Mi intención para hoy" value={intention} onChange={setIntention} placeholder="Ej.: estar presente en lo que hago" maxLength={200} />
        <TextInput label="Algo que agradezco" value={gratitude} onChange={setGratitude} maxLength={200} />
        <TextInput label="Una prioridad importante" value={priority} onChange={setPriority} maxLength={200} />
        <TextInput
          label="Un pequeño desafío"
          value={challenge}
          onChange={setChallenge}
          maxLength={200}
          list="desafios"
          hint={energy === 'bajo' ? 'Con poca energía, podés dejarlo vacío.' : 'Algo chico y concreto.'}
        />
        <datalist id="desafios">
          {CHALLENGES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <button type="submit" className="btn btn--primary btn--block">
          {initial?.morning ? 'Actualizar' : 'Empezar el día'}
        </button>
      </form>
    </>
  );
}
