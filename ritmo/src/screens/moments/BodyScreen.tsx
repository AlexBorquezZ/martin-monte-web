import { useState } from 'react';
import { useApp, useQuery } from '../../app/AppContext';
import { href } from '../../app/router';
import { Icon } from '../../components/Icon';
import { ChoiceChips, ConfirmDialog, EmptyState, Modal, NumberStepper, PageHeader, Section, TextArea, TextInput } from '../../components/ui';
import { ROUTINES, type Routine } from '../../data/routines';
import type { BodyEntry, CheckIn, Workout, WorkoutStatus } from '../../domain/types';
import { addDays, formatShortDate } from '../../lib/date';
import { addWorkout, deleteWorkout, getDay, updateDay, workoutsBetween } from '../../storage/repo';

const STATUS_TEXT: Record<WorkoutStatus, string> = {
  completed: 'Completado',
  partial: 'Parcial',
  postponed: 'Pospuesto',
};

const INTENSITY_TEXT = { suave: 'Suave', media: 'Media', exigente: 'Exigente' } as const;

function suggestedRoutines(checkIn?: CheckIn): Routine[] {
  // Con poca energía, por defecto se muestran primero las opciones suaves.
  if (checkIn === 'cansado' || checkIn === 'descanso') {
    return [...ROUTINES].sort((a, b) => (a.intensity === 'suave' ? -1 : 0) - (b.intensity === 'suave' ? -1 : 0));
  }
  return ROUTINES;
}

export function BodyScreen() {
  const { today } = useApp();
  const { data } = useQuery(async () => {
    const [day, workouts] = await Promise.all([getDay(today), workoutsBetween(addDays(today, -30), today)]);
    return { day, workouts };
  }, [today]);
  const [logging, setLogging] = useState<{ title: string; routineId?: string; minutes: number } | null>(null);
  const [toDelete, setToDelete] = useState<Workout | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const { toast } = useApp();

  if (!data) return <p className="muted">Cargando…</p>;
  const checkIn = data.day?.checkIn;
  const lowEnergy = checkIn === 'cansado' || checkIn === 'descanso';

  return (
    <>
      <PageHeader title="Cuerpo · Movimiento y energía" subtitle="Moverte un poco ya cuenta. Escuchá a tu cuerpo." back />
      {lowEnergy && (
        <div className="card card--soft" role="note">
          Hoy dijiste que estás {checkIn === 'descanso' ? 'necesitando descanso' : 'con poca energía'}. Una caminata suave,
          movilidad o simplemente descansar son buenas opciones.
        </div>
      )}

      <Section title="Rutinas">
        <ul className="list-plain">
          {suggestedRoutines(checkIn).map((r) => (
            <li key={r.id} className="card">
              <div className="row">
                <div className="grow">
                  <div style={{ fontWeight: 650 }}>{r.title}</div>
                  <div className="small muted">
                    {r.minutes} min · {INTENSITY_TEXT[r.intensity]}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  aria-expanded={open === r.id}
                  onClick={() => setOpen(open === r.id ? null : r.id)}
                >
                  {open === r.id ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {open === r.id && (
                <div className="small" style={{ marginTop: 8 }}>
                  <p className="muted">{r.description}</p>
                  <ol style={{ paddingLeft: '1.2rem', margin: '0 0 10px' }}>
                    {r.exercises.map((e) => (
                      <li key={e.name} style={{ marginBottom: 4 }}>
                        <strong>{e.name}</strong> — {e.dose}
                        {e.easier && <span className="muted"> (más fácil: {e.easier})</span>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <button
                type="button"
                className="btn btn--soft btn--sm"
                style={{ marginTop: 8 }}
                onClick={() => setLogging({ title: r.title, routineId: r.id, minutes: r.minutes })}
              >
                Registrar
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn--block" onClick={() => setLogging({ title: '', minutes: 20 })}>
          <Icon name="plus" /> Registrar otra actividad
        </button>
        <p className="tiny muted" style={{ marginTop: 8 }}>
          Son propuestas generales, no indicaciones médicas. Si sentís dolor o tenés una condición de salud, consultá a un
          profesional y adaptá los ejercicios.
        </p>
      </Section>

      <BodyLog key={today + (data.day?.updatedAt ?? '')} today={today} initial={data.day?.body} />

      <Section title="Últimos entrenamientos">
        {data.workouts.length === 0 ? (
          <EmptyState title="Sin registros todavía">
            <p className="small">Cuando registres una actividad, aparece acá.</p>
          </EmptyState>
        ) : (
          <ul className="card list-plain">
            {data.workouts.slice(0, 20).map((w) => (
              <li key={w.id} className="tx">
                <span className="grow">
                  <strong>{w.title}</strong>
                  <br />
                  <span className="small muted">
                    {formatShortDate(w.date)} · {w.durationMin} min · {STATUS_TEXT[w.status]}
                  </span>
                  {w.notes && <span className="small muted" style={{ display: 'block' }}>{w.notes}</span>}
                </span>
                <button type="button" className="icon-btn" aria-label={`Eliminar ${w.title}`} onClick={() => setToDelete(w)}>
                  <Icon name="trash" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="small">
          <a href={href('/ajustes')}>Configurar recordatorios de movimiento</a>
        </p>
      </Section>

      {logging && (
        <WorkoutModal
          initial={logging}
          onClose={() => setLogging(null)}
          onSave={async (w) => {
            await addWorkout({ ...w, date: today });
            setLogging(null);
            toast(w.status === 'postponed' ? 'Queda pospuesto, sin problema.' : 'Entrenamiento registrado.');
          }}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          title="¿Eliminar este registro?"
          message={`Se borrará «${toDelete.title}» del ${formatShortDate(toDelete.date)}.`}
          confirmLabel="Eliminar"
          danger
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteWorkout(toDelete.id);
            setToDelete(null);
          }}
        />
      )}
    </>
  );
}

function WorkoutModal({
  initial,
  onClose,
  onSave,
}: {
  initial: { title: string; routineId?: string; minutes: number };
  onClose: () => void;
  onSave: (w: Omit<Workout, 'id' | 'createdAt' | 'date'>) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial.title);
  const [minutes, setMinutes] = useState(initial.minutes);
  const [status, setStatus] = useState<WorkoutStatus>('completed');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  return (
    <Modal title="Registrar actividad" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) {
            setError('Poné un nombre a la actividad.');
            return;
          }
          await onSave({ title: title.trim().slice(0, 80), routineId: initial.routineId, durationMin: minutes, status, notes: notes.trim() });
        }}
      >
        <TextInput label="Actividad" value={title} onChange={setTitle} error={error} maxLength={80} />
        <ChoiceChips
          legend="¿Cómo fue?"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'completed', label: 'Completado' },
            { value: 'partial', label: 'Parcial' },
            { value: 'postponed', label: 'Pospuesto' },
          ]}
        />
        <NumberStepper label="Minutos" value={minutes} onChange={setMinutes} min={0} max={300} step={5} />
        <TextArea label="Notas (opcional)" value={notes} onChange={setNotes} rows={2} maxLength={500} />
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}

const SCALE = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }));

function BodyLog({ today, initial }: { today: string; initial?: BodyEntry }) {
  const { toast } = useApp();
  const [sleep, setSleep] = useState(initial?.sleepHours !== undefined ? String(initial.sleepHours) : '');
  const [quality, setQuality] = useState(initial?.sleepQuality ? String(initial.sleepQuality) : undefined);
  const [energy, setEnergy] = useState(initial?.energy ? String(initial.energy) : undefined);
  const [recovery, setRecovery] = useState(initial?.recovery ? String(initial.recovery) : undefined);
  const [error, setError] = useState('');
  return (
    <Section title="Registro opcional de hoy">
      <details className="card" open={Boolean(initial)}>
        <summary>Sueño, energía y recuperación</summary>
        <form
          style={{ marginTop: 10 }}
          onSubmit={async (e) => {
            e.preventDefault();
            const h = sleep.trim() === '' ? undefined : Number(sleep.replace(',', '.'));
            if (h !== undefined && !(Number.isFinite(h) && h >= 0 && h <= 24)) {
              setError('Escribí horas entre 0 y 24.');
              return;
            }
            setError('');
            await updateDay(today, {
              body: {
                sleepHours: h,
                sleepQuality: quality ? Number(quality) : undefined,
                energy: energy ? Number(energy) : undefined,
                recovery: recovery ? Number(recovery) : undefined,
              },
            });
            toast('Registro guardado.');
          }}
        >
          <TextInput label="Horas de sueño" inputMode="decimal" value={sleep} onChange={setSleep} error={error} placeholder="Ej.: 7,5" />
          <ChoiceChips legend="Calidad del sueño (1 a 5)" value={quality} onChange={setQuality} options={SCALE} />
          <ChoiceChips legend="Energía (1 a 5)" value={energy} onChange={setEnergy} options={SCALE} />
          <ChoiceChips legend="Recuperación (1 a 5)" value={recovery} onChange={setRecovery} options={SCALE} />
          <p className="tiny muted">Es solo un registro personal para ver tendencias. No es una evaluación de salud.</p>
          <button type="submit" className="btn btn--soft btn--block">
            Guardar registro
          </button>
        </form>
      </details>
    </Section>
  );
}
