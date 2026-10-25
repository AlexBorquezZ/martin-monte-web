import { useEffect, useRef, useState } from 'react';
import { useApp, useQuery } from '../app/AppContext';
import { routeQuery } from '../app/router';
import { Icon } from '../components/Icon';
import { NumberStepper, PageHeader, Select, TextInput } from '../components/ui';
import {
  isFinished,
  loadTimer,
  pauseTimer,
  remainingMs,
  resumeTimer,
  startTimer,
  storeTimer,
  workedMinutes,
  type FocusTimerState,
} from '../domain/focusTimer';
import { toDateKey, nowIso } from '../lib/date';
import { formatClock, useTicker } from '../lib/useNow';
import { showLocalNotification } from '../pwa/notifications';
import { addFocusSession, listLearningGoals } from '../storage/repo';

export function FocusScreen() {
  const { settings, updateSettings, toast } = useApp();
  const { data: goals } = useQuery(listLearningGoals, []);
  const [timer, setTimer] = useState<FocusTimerState | null>(loadTimer);
  const [minutes, setMinutes] = useState(settings.focusMinutes);
  const [breakMin, setBreakMin] = useState(settings.breakMinutes);
  const [goalId, setGoalId] = useState(routeQuery().get('objetivo') ?? '');
  const [label, setLabel] = useState('');
  const running = !!timer && timer.pausedRemaining === undefined;
  const now = useTicker(running, 500);
  const handled = useRef(false);
  const [offerBreak, setOfferBreak] = useState(false);

  const activeGoals = (goals ?? []).filter((g) => g.status === 'active');
  useEffect(() => {
    if (!goalId && activeGoals.length) setGoalId((activeGoals.find((g) => g.priority) ?? activeGoals[0]).id);
  }, [goals]); // eslint-disable-line

  const update = (t: FocusTimerState | null) => {
    storeTimer(t);
    setTimer(t);
  };

  // Al terminar (aunque la app haya estado cerrada), se registra la sesión una sola vez.
  useEffect(() => {
    if (!timer || handled.current || !isFinished(timer, Date.now())) return;
    handled.current = true;
    const t = timer;
    (async () => {
      if (t.mode === 'focus') {
        await addFocusSession({
          date: toDateKey(new Date(t.startedAt)),
          minutes: t.minutes,
          goalId: t.goalId,
          label: t.label,
          completedAt: nowIso(),
        });
        void showLocalNotification('Bloque de enfoque terminado', 'Buen trabajo. Tomate un descanso corto.', 'ritmo-focus');
        toast('Bloque terminado y registrado.');
        setOfferBreak(true);
      } else {
        void showLocalNotification('Descanso terminado', 'Cuando quieras, seguimos.', 'ritmo-focus');
        toast('Descanso terminado.');
      }
      navigator.vibrate?.([200, 100, 200]);
      update(null);
      handled.current = false;
    })();
  }, [now, timer]); // eslint-disable-line

  if (!timer) {
    return (
      <>
        <PageHeader
          title="Modo enfoque"
          subtitle="Un temporizador que sigue contando aunque apagues la pantalla o cierres la app."
          back
        />
        {offerBreak && (
          <div className="card card--soft row row--wrap">
            <span className="grow">Terminaste un bloque. ¿Un descanso de {settings.breakMinutes} min?</span>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                setOfferBreak(false);
                update(startTimer('break', settings.breakMinutes, 'Descanso', undefined, Date.now()));
              }}
            >
              Descansar
            </button>
          </div>
        )}
        <div className="card">
          {activeGoals.length > 0 && (
            <Select
              label="Objetivo"
              value={goalId}
              onChange={setGoalId}
              options={[{ value: '', label: 'Sin objetivo' }, ...activeGoals.map((g) => ({ value: g.id, label: g.title }))]}
            />
          )}
          <TextInput label="¿En qué vas a enfocarte? (opcional)" value={label} onChange={setLabel} maxLength={120} />
          <div className="fit-grid">
            <NumberStepper label="Enfoque" value={minutes} onChange={setMinutes} min={1} max={180} step={5} unit="min" />
            <NumberStepper label="Descanso" value={breakMin} onChange={setBreakMin} min={1} max={60} unit="min" />
          </div>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => {
              void updateSettings({ focusMinutes: minutes, breakMinutes: breakMin });
              setOfferBreak(false);
              update(startTimer('focus', minutes, label.trim(), goalId || undefined, Date.now()));
            }}
          >
            <Icon name="play" /> Empezar
          </button>
          <p className="tiny muted" style={{ marginTop: 10 }}>
            No hace falta dejar la pantalla encendida. Si activaste los recordatorios, al terminar intentamos avisarte con
            una notificación; Android puede demorarla si la app está cerrada. Al volver a abrirla, el bloque se registra
            igual.
          </p>
        </div>
      </>
    );
  }

  const remaining = remainingMs(timer, now) / 1000;
  const paused = timer.pausedRemaining !== undefined;
  return (
    <>
      <PageHeader title={timer.mode === 'focus' ? 'Enfocado' : 'Descanso'} subtitle={timer.label || undefined} />
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="timer" role="timer" aria-live="off">
          {formatClock(remaining)}
        </div>
        <p className="muted small">{paused ? 'En pausa' : timer.mode === 'focus' ? 'Una cosa a la vez.' : 'Estirate, tomá agua, mirá lejos.'}</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          {paused ? (
            <button type="button" className="btn btn--primary" onClick={() => update(resumeTimer(timer, Date.now()))}>
              <Icon name="play" /> Seguir
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => update(pauseTimer(timer, Date.now()))}>
              <Icon name="pause" /> Pausar
            </button>
          )}
          <button
            type="button"
            className="btn btn--ghost"
            onClick={async () => {
              const worked = workedMinutes(timer, Date.now());
              if (timer.mode === 'focus' && worked > 0) {
                await addFocusSession({
                  date: toDateKey(new Date(timer.startedAt)),
                  minutes: worked,
                  goalId: timer.goalId,
                  label: timer.label,
                  completedAt: nowIso(),
                });
                toast(`Registramos ${worked} min de enfoque.`);
              }
              update(null);
            }}
          >
            <Icon name="stop" /> Terminar
          </button>
        </div>
      </div>
    </>
  );
}
