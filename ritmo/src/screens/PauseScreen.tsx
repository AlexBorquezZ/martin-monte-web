import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { goBack, href } from '../app/router';
import { Icon, type IconName } from '../components/Icon';
import { NumberStepper, PageHeader, TextArea } from '../components/ui';
import { breathPhaseAt } from '../domain/breathing';
import type { PauseKind } from '../domain/types';
import { formatClock, useTicker } from '../lib/useNow';
import { addPause } from '../storage/repo';

const KINDS: { id: PauseKind; title: string; text: string; icon: IconName }[] = [
  { id: 'respiracion', title: 'Respirar tranquilo', text: 'Seguí un ritmo suave, a tu manera.', icon: 'wind' },
  { id: 'observacion', title: 'Observar el entorno', text: 'Volver al presente con los sentidos.', icon: 'eye' },
  { id: 'pensamientos', title: 'Ordenar pensamientos', text: 'Tres preguntas para aclarar la cabeza.', icon: 'list' },
  { id: 'gratitud', title: 'Gratitud', text: 'Tres cosas, grandes o pequeñas.', icon: 'heart' },
  { id: 'nada', title: 'No hacer nada', text: 'Un minuto sin tareas. O volver al día.', icon: 'coffee' },
];

export function PauseScreen() {
  const [kind, setKind] = useState<PauseKind | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="card card--soft fade-in" style={{ marginTop: 24, textAlign: 'center', padding: 28 }}>
        <h2>Gracias por la pausa</h2>
        <p>Volvé al día a tu ritmo.</p>
        <a className="btn btn--primary" href={href('/')}>
          Volver a Hoy
        </a>
      </div>
    );
  }

  if (!kind) {
    return (
      <>
        <PageHeader title="Pausa" subtitle="Entre uno y cinco minutos, cuando quieras. Nada es obligatorio." back />
        <ul className="list-plain">
          {KINDS.map((k) => (
            <li key={k.id}>
              <button type="button" className="card card-link" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => setKind(k.id)}>
                <span className="nav-pill" style={{ background: 'var(--accent-soft)', width: 48, height: 48 }}>
                  <Icon name={k.icon} />
                </span>
                <span className="grow">
                  <strong>{k.title}</strong>
                  <br />
                  <span className="small muted">{k.text}</span>
                </span>
                <Icon name="chevron" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn--ghost btn--block" onClick={() => goBack('/')}>
          Volver al día
        </button>
        <p className="tiny muted" style={{ marginTop: 12 }}>
          Estas pausas son un momento para vos. No reemplazan la ayuda de un profesional si la necesitás.
        </p>
      </>
    );
  }

  const finish = () => setDone(true);
  const title = KINDS.find((k) => k.id === kind)!.title;
  return (
    <>
      <div className="row" style={{ marginTop: 4 }}>
        <button type="button" className="btn btn--ghost btn--sm" style={{ marginLeft: -12 }} onClick={() => setKind(null)}>
          <Icon name="back" size={18} /> Pausas
        </button>
      </div>
      <h1>{title}</h1>
      {kind === 'respiracion' && <Breathing onFinish={finish} />}
      {kind === 'observacion' && <Observation onFinish={finish} />}
      {kind === 'pensamientos' && (
        <Prompts
          kind="pensamientos"
          questions={['¿Qué es lo que más ocupa tu mente ahora?', '¿Qué parte de eso depende de vos?', '¿Cuál sería un próximo paso pequeño?']}
          onFinish={finish}
        />
      )}
      {kind === 'gratitud' && (
        <Prompts kind="gratitud" questions={['Algo que agradezco', 'Otra cosa', 'Una más, aunque sea pequeña']} onFinish={finish} />
      )}
      {kind === 'nada' && <DoNothing onFinish={finish} />}
    </>
  );
}

function useLogPause() {
  const { today } = useApp();
  const started = useRef(Date.now());
  return (kind: PauseKind, note?: string) =>
    addPause({ date: today, kind, seconds: Math.round((Date.now() - started.current) / 1000), note });
}

function Breathing({ onFinish }: { onFinish: () => void }) {
  const { settings, updateSettings } = useApp();
  const [rhythm, setRhythm] = useState(settings.breathing);
  const [minutes, setMinutes] = useState(settings.pauseMinutes);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const now = useTicker(startedAt !== null, 200);
  const log = useLogPause();
  const total = minutes * 60;
  const elapsed = startedAt ? (now - startedAt) / 1000 : 0;
  const finished = startedAt !== null && elapsed >= total;

  useEffect(() => {
    if (finished) {
      void log('respiracion');
      onFinish();
    }
  }, [finished]);

  if (startedAt === null) {
    return (
      <div className="card">
        <p className="small muted">
          Ajustá el ritmo hasta que te resulte cómodo. Si en algún momento te sentís incómodo, volvé a respirar como
          siempre.
        </p>
        <div className="fit-grid">
          <NumberStepper label="Inhalar" value={rhythm.inhale} onChange={(v) => setRhythm({ ...rhythm, inhale: v })} min={2} max={10} unit="s" />
          <NumberStepper label="Sostener" value={rhythm.hold} onChange={(v) => setRhythm({ ...rhythm, hold: v })} min={0} max={10} unit="s" />
          <NumberStepper label="Exhalar" value={rhythm.exhale} onChange={(v) => setRhythm({ ...rhythm, exhale: v })} min={2} max={12} unit="s" />
        </div>
        <NumberStepper label="Duración" value={minutes} onChange={setMinutes} min={1} max={5} unit="min" />
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => {
            void updateSettings({ breathing: rhythm, pauseMinutes: minutes });
            setStartedAt(Date.now());
          }}
        >
          <Icon name="play" /> Empezar
        </button>
      </div>
    );
  }

  const phase = breathPhaseAt(elapsed, rhythm);
  const progress = phase.duration ? phase.elapsed / phase.duration : 1;
  // Con "reducir movimiento" activo, el círculo queda quieto y solo cambia el texto.
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const scale = reduced
    ? 0.85
    : phase.name === 'inhale'
      ? 0.6 + 0.4 * progress
      : phase.name === 'hold'
        ? 1
        : 1 - 0.4 * progress;
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="breath" aria-hidden="true">
        <div className="breath__circle" style={{ ['--s' as string]: scale.toFixed(3), transitionDuration: '200ms' }} />
        <div className="breath__label">{phase.label}</div>
      </div>
      <p className="sr-only" aria-live="polite">
        {phase.label}
      </p>
      <p className="muted tabular">{formatClock(total - elapsed)}</p>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => {
          void log('respiracion');
          onFinish();
        }}
      >
        Terminar ahora
      </button>
    </div>
  );
}

const SENSES = [
  { n: 5, text: 'Nombrá cinco cosas que podés ver.' },
  { n: 4, text: 'Notá cuatro cosas que podés tocar o sentir en el cuerpo.' },
  { n: 3, text: 'Escuchá tres sonidos, cercanos o lejanos.' },
  { n: 2, text: 'Identificá dos olores (o recordá dos que te gusten).' },
  { n: 1, text: 'Notá un sabor, o simplemente cómo está tu boca ahora.' },
];

function Observation({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const log = useLogPause();
  const s = SENSES[step];
  return (
    <div className="card" style={{ textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: '3rem', fontWeight: 300 }} aria-hidden="true">
        {s.n}
      </div>
      <p style={{ fontSize: '1.1rem' }} aria-live="polite">
        {s.text}
      </p>
      <p className="small muted">Sin apuro. Cuando estés, pasá al siguiente.</p>
      <button
        type="button"
        className="btn btn--primary"
        onClick={async () => {
          if (step < SENSES.length - 1) setStep(step + 1);
          else {
            await log('observacion');
            onFinish();
          }
        }}
      >
        {step < SENSES.length - 1 ? 'Siguiente' : 'Terminar'}
      </button>
    </div>
  );
}

function Prompts({ kind, questions, onFinish }: { kind: PauseKind; questions: string[]; onFinish: () => void }) {
  const [answers, setAnswers] = useState(questions.map(() => ''));
  const [keep, setKeep] = useState(false);
  const log = useLogPause();
  return (
    <form
      className="card"
      onSubmit={async (e) => {
        e.preventDefault();
        const note = keep
          ? questions
              .map((q, i) => (answers[i].trim() ? `${q}: ${answers[i].trim()}` : ''))
              .filter(Boolean)
              .join('\n')
          : undefined;
        await log(kind, note || undefined);
        onFinish();
      }}
    >
      {questions.map((q, i) => (
        <TextArea key={q} label={q} value={answers[i]} rows={2} onChange={(v) => setAnswers(answers.map((a, j) => (j === i ? v : a)))} />
      ))}
      <label className="switch">
        <span>Guardar lo que escribí</span>
        <input type="checkbox" role="switch" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
      </label>
      <p className="tiny muted">Si no lo guardás, solo queda registrado que hiciste la pausa.</p>
      <button type="submit" className="btn btn--primary btn--block">
        Terminar
      </button>
    </form>
  );
}

function DoNothing({ onFinish }: { onFinish: () => void }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const now = useTicker(startedAt !== null, 500);
  const log = useLogPause();
  const remaining = startedAt ? 60 - (now - startedAt) / 1000 : 60;
  useEffect(() => {
    if (startedAt && remaining <= 0) {
      void log('nada');
      onFinish();
    }
  }, [remaining <= 0]);
  return (
    <div className="card" style={{ textAlign: 'center', padding: 24 }}>
      <p>Un minuto para no hacer nada. Mirá por la ventana, estirate o simplemente quedate.</p>
      {startedAt ? (
        <div className="timer">{formatClock(remaining)}</div>
      ) : (
        <button type="button" className="btn btn--primary" onClick={() => setStartedAt(Date.now())}>
          Empezar un minuto
        </button>
      )}
      <div style={{ marginTop: 12 }}>
        <button type="button" className="btn btn--ghost" onClick={() => goBack('/')}>
          Volver al día
        </button>
      </div>
    </div>
  );
}
