import { useState } from 'react';
import { useApp, useQuery } from '../app/AppContext';
import { href, navigate } from '../app/router';
import { Icon, type IconName } from '../components/Icon';
import { HabitStatusButtons } from '../components/HabitStatusButtons';
import { AreaTag, ChoiceChips, Section } from '../components/ui';
import { AREAS, CHECKIN_OPTIONS, MOMENTS } from '../domain/constants';
import { currentMoment, greeting, pickByDay } from '../domain/day';
import { recommend, type Recommendation } from '../domain/recommendations';
import type { CheckIn, HabitStatus, MomentId } from '../domain/types';
import { PHRASES, REFLECTION_QUESTIONS } from '../data/phrases';
import { sampleHabits } from '../data/sampleHabits';
import { formatLongDate } from '../lib/date';
import { createHabit, setCheckIn, updateDay } from '../storage/repo';
import { loadToday } from '../storage/queries';

const MOMENT_ICON: Record<MomentId, IconName> = {
  manana: 'sunrise',
  cuerpo: 'body',
  tarde: 'book',
  relaciones: 'users',
  noche: 'moon',
};

export function TodayScreen() {
  const { settings, today, now, toast } = useApp();
  const { data } = useQuery(() => loadToday(today), [today]);
  const moment = currentMoment(now, settings);
  const momentInfo = MOMENTS.find((m) => m.id === moment)!;

  if (!data) return <p className="muted">Cargando…</p>;

  const checkIn = data.day?.checkIn;
  const statusById = new Map(data.logsToday.map((l) => [l.habitId, l.status]));
  const rec = recommend({
    date: today,
    moment,
    checkIn,
    morningEnergy: data.day?.morning?.energy,
    habits: data.habits,
    logsToday: data.logsToday,
    logsWeek: data.logsWeek,
    areasToday: data.areasToday,
    workoutDoneToday: data.workoutsToday.some((w) => w.status !== 'postponed'),
    daysSinceLastActivity: data.activityCountToday > 0 ? 0 : data.daysSinceLastActivity,
  });

  const doneToday = data.habits.filter((h) => {
    const st = statusById.get(h.id);
    return st === 'done' || st === 'partial';
  });

  const momentDone =
    (moment === 'manana' && !!data.day?.morning) || (moment === 'noche' && !!data.day?.night);

  return (
    <>
      <section className="hero" aria-labelledby="saludo">
        <h1 id="saludo">{greeting(now, settings.userName || undefined)}</h1>
        <p className="hero__date">{formatLongDate(today)}</p>
        <p className="hero__phrase">{pickByDay(PHRASES, today)}</p>
      </section>

      {rec.restarting && (
        <div className="card card--soft" role="note">
          <strong>Retomar es fácil.</strong>
          <p className="small" style={{ margin: '4px 0 0' }}>
            Pasaron unos días, y está perfecto. Elegí una sola acción mínima y listo.
          </p>
        </div>
      )}

      <CheckInCard value={checkIn} onChange={(c) => void setCheckIn(today, c)} />

      <Section title="Ahora">
        <a className="card card-link" href={href(`/momento/${moment}`)}>
          <span className="nav-pill" style={{ background: 'var(--accent-soft)', width: 48, height: 48 }}>
            <Icon name={MOMENT_ICON[moment]} />
          </span>
          <span className="grow">
            <span style={{ fontWeight: 650, display: 'block' }}>
              {momentInfo.label} · {momentInfo.subtitle}
            </span>
            <span className="muted small">
              {momentDone ? 'Ya lo hiciste hoy. Podés revisarlo.' : `Unos ${settings.moments[moment].durationMin} minutos`}
            </span>
          </span>
          <Icon name="chevron" />
        </a>
      </Section>

      <Section title="Para hoy">
        <p className="small muted" style={{ marginTop: -4 }}>
          {rec.note}
        </p>
        {data.habits.length === 0 && <StarterCard onCreate={async () => {
          for (const h of sampleHabits(today)) await createHabit(h);
          toast('Agregamos hábitos de ejemplo. Podés editarlos cuando quieras.');
        }} />}
        <ul className="list-plain">
          {rec.items.map((r) => (
            <li key={r.key}>
              <RecommendationCard rec={r} today={today} status={r.habitId ? statusById.get(r.habitId) : undefined} />
            </li>
          ))}
        </ul>
        {rec.extraChallenge && (
          <details className="card card--flat">
            <summary>¿Querés un desafío extra? (opcional)</summary>
            <RecommendationCard rec={rec.extraChallenge} today={today} status={undefined} bare />
          </details>
        )}
      </Section>

      {doneToday.length > 0 && (
        <Section title="Ya hiciste hoy">
          <ul className="list-plain">
            {doneToday.map((h) => (
              <li key={h.id} className="card card--flat stack" aria-label={`Hecho: ${h.name}`}>
                <div className="row">
                  <span className="grow" style={{ fontWeight: 600 }}>
                    {h.name}
                  </span>
                  <AreaTag area={h.category} />
                </div>
                <HabitStatusButtons habitId={h.id} habitName={h.name} date={today} current={statusById.get(h.id)} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <a className="btn btn--soft btn--block" href={href('/pausa')} style={{ marginTop: 4 }}>
        <Icon name="leaf" /> Tomar una pausa consciente
      </a>

      <ReflectionCard key={today} today={today} saved={data.day?.reflection ?? ''} />

      <Section title="Áreas que atendiste hoy">
        <div className="areas-today" aria-label="Áreas atendidas hoy">
          {AREAS.map((a) => {
            const on = data.areasToday.has(a.id);
            return (
              <span key={a.id} className={on ? 'area-pill area-pill--on' : 'area-pill'}>
                <span className="area-dot" style={{ background: on ? `var(--area-${a.id})` : 'var(--border)' }} />
                {a.label}
                <span className="sr-only">{on ? ' (atendida)' : ' (todavía no)'}</span>
              </span>
            );
          })}
        </div>
        <p className="tiny muted" style={{ marginTop: 8 }}>
          No hace falta atender todas cada día: el equilibrio se mira a lo largo de la semana.
        </p>
      </Section>

      <Section title="Accesos rápidos">
        <div className="quick-grid">
          {MOMENTS.map((m) => (
            <a key={m.id} className="quick" href={href(`/momento/${m.id}`)}>
              <Icon name={MOMENT_ICON[m.id]} />
              {m.label}
            </a>
          ))}
          <a className="quick" href={href('/habitos')}>
            <Icon name="list" />
            Hábitos
          </a>
          <a className="quick" href={href('/foco')}>
            <Icon name="timer" />
            Enfoque
          </a>
          <a className="quick" href={href('/finanzas')}>
            <Icon name="wallet" />
            Finanzas
          </a>
          <a className="quick" href={href('/cultura')}>
            <Icon name="sparkle" />
            Cultura
          </a>
          <a className="quick" href={href('/progreso')}>
            <Icon name="chart" />
            Progreso
          </a>
          <a className="quick" href={href('/ajustes')}>
            <Icon name="settings" />
            Ajustes
          </a>
        </div>
      </Section>
    </>
  );
}

function CheckInCard({ value, onChange }: { value: CheckIn | undefined; onChange: (c: CheckIn) => void }) {
  const [editing, setEditing] = useState(false);
  const current = CHECKIN_OPTIONS.find((o) => o.id === value);
  if (current && !editing) {
    return (
      <div className="card card--flat row">
        <span className="grow">
          <span className="muted small">Hoy me siento</span>
          <br />
          <strong>{current.label}</strong> <span className="muted small">· {current.hint}</span>
        </span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(true)}>
          Cambiar
        </button>
      </div>
    );
  }
  return (
    <div className="card">
      <ChoiceChips
        legend="¿Cómo estás hoy?"
        value={value}
        options={CHECKIN_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
        onChange={(c) => {
          onChange(c);
          setEditing(false);
        }}
      />
      <p className="tiny muted" style={{ margin: 0 }}>
        Con tu respuesta ajusto cuántas acciones te sugiero y de qué tamaño.
      </p>
    </div>
  );
}

function RecommendationCard({
  rec,
  today,
  status,
  bare,
}: {
  rec: Recommendation;
  today: string;
  status: HabitStatus | undefined;
  bare?: boolean;
}) {
  const body = (
    <div className="stack">
      <div className="rec">
        <div className="rec__body">
          <div className="rec__title">
            {rec.title}{' '}
            {rec.minimal && rec.type !== 'rest' && <span className="badge badge--accent">versión mínima</span>}
          </div>
          {rec.detail && <div className="small muted">{rec.detail}</div>}
          {rec.area && <AreaTag area={rec.area} />}
        </div>
        {rec.to && (
          <button type="button" className="btn btn--soft btn--sm" onClick={() => navigate(rec.to!)}>
            Ir
          </button>
        )}
      </div>
      {rec.habitId && <HabitStatusButtons habitId={rec.habitId} habitName={rec.title} date={today} current={status} />}
    </div>
  );
  return bare ? <div style={{ marginTop: 8 }}>{body}</div> : <div className="card">{body}</div>;
}

function StarterCard({ onCreate }: { onCreate: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="card card--soft">
      <h3>Empecemos con calma</h3>
      <p className="small">
        Todavía no tenés hábitos. Podés crear el tuyo o sumar cinco ejemplos (inglés, calma, movimiento, gastos y
        conexión) y adaptarlos.
      </p>
      <div className="row row--wrap">
        <a className="btn btn--primary btn--sm" href={href('/habitos/nuevo')}>
          <Icon name="plus" size={18} /> Crear un hábito
        </a>
        <button
          type="button"
          className="btn btn--sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onCreate();
            setBusy(false);
          }}
        >
          Usar ejemplos
        </button>
      </div>
    </div>
  );
}

function ReflectionCard({ today, saved }: { today: string; saved: string }) {
  const [text, setText] = useState(saved);
  const [open, setOpen] = useState(Boolean(saved));
  const { toast } = useApp();
  const question = pickByDay(REFLECTION_QUESTIONS, today, 7);
  return (
    <div className="card card--flat" style={{ marginTop: 12 }}>
      <div className="row">
        <span className="grow">
          <span className="tiny muted">Pregunta del día (opcional)</span>
          <br />
          <strong>{question}</strong>
        </span>
      </div>
      {open ? (
        <form
          className="stack"
          style={{ marginTop: 10 }}
          onSubmit={async (e) => {
            e.preventDefault();
            await updateDay(today, { reflection: text.trim() });
            toast('Guardado.');
          }}
        >
          <label className="sr-only" htmlFor="reflexion">
            Tu respuesta
          </label>
          <textarea
            id="reflexion"
            className="textarea"
            rows={3}
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="btn btn--soft btn--sm" style={{ alignSelf: 'flex-end' }}>
            Guardar
          </button>
        </form>
      ) : (
        <button type="button" className="btn btn--ghost btn--sm" style={{ marginTop: 6 }} onClick={() => setOpen(true)}>
          Responder
        </button>
      )}
    </div>
  );
}
