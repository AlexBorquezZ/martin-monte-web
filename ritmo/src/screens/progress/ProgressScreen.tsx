import { useApp, useQuery } from '../../app/AppContext';
import { href } from '../../app/router';
import { ActivityCalendar } from '../../components/ActivityCalendar';
import { Icon } from '../../components/Icon';
import { PageHeader, Section } from '../../components/ui';
import { AREAS } from '../../domain/constants';
import { formatMoney } from '../../domain/finance';
import { activeDays, activityByDay, learningMinutes, topHabits } from '../../domain/stats';
import { addDays, rangeKeys, weekStart, WEEKDAY_SHORT, weekday } from '../../lib/date';
import { plural } from '../../lib/text';
import { listSavingsGoals } from '../../storage/repo';
import { loadActivity } from '../../storage/queries';

export function ProgressScreen() {
  const { today } = useApp();
  const from = addDays(weekStart(today), -28); // cubre el calendario de 5 semanas
  const { data } = useQuery(async () => {
    const [activity, savings] = await Promise.all([loadActivity(from, today), listSavingsGoals()]);
    return { activity, savings };
  }, [today]);

  if (!data) return <p className="muted">Cargando…</p>;
  const { activity, savings } = data;
  const byDay = activityByDay(activity, from, today);
  const last30 = addDays(today, -29);
  const ws = weekStart(today);
  const week = rangeKeys(ws, today);
  const days30 = new Map([...byDay].filter(([d]) => d >= last30));
  const active30 = activeDays(days30);
  const in30 = <T extends { date: string }>(list: T[]) => list.filter((x) => x.date >= last30);
  const inWeek = <T extends { date: string }>(list: T[]) => list.filter((x) => x.date >= ws);
  const learnWeek = learningMinutes(inWeek(activity.sessions), inWeek(activity.focus));
  const learn30 = learningMinutes(in30(activity.sessions), in30(activity.focus));
  const workouts30 = in30(activity.workouts).filter((w) => w.status !== 'postponed');
  const workoutsWeek = inWeek(activity.workouts).filter((w) => w.status !== 'postponed');
  const top = topHabits(activity.habits, in30(activity.logs));
  const sleeps = activity.days.filter((d) => d.date >= addDays(today, -6) && d.body?.sleepHours !== undefined);
  const avgSleep = sleeps.length ? sleeps.reduce((s, d) => s + (d.body!.sleepHours ?? 0), 0) / sleeps.length : null;

  const goalStats = activity.goals
    .filter((g) => g.status === 'active')
    .map((g) => {
      const s = activity.sessions.filter((x) => x.goalId === g.id);
      const f = activity.focus.filter((x) => x.goalId === g.id);
      return { goal: g, sessions: s.length, minutes: learningMinutes(s, f) };
    });

  return (
    <>
      <PageHeader title="Progreso" subtitle="Una mirada amable a lo que venís haciendo. Sin puntajes ni rachas." />

      <div className="card card--soft">
        <strong>
          {active30 === 0
            ? 'Este es un buen momento para empezar.'
            : `Practicaste algo en ${plural(active30, 'día', 'días')} de los últimos 30.`}
        </strong>
        <p className="small" style={{ margin: 0 }}>
          La continuidad se mira a lo largo del tiempo: un día sin registro no borra nada.
        </p>
      </div>

      <Section title="Calendario de actividad">
        <div className="card">
          <ActivityCalendar
            today={today}
            level={(d) => {
              const c = byDay.get(d)?.count ?? 0;
              return c === 0 ? 0 : c <= 2 ? 1 : c <= 4 ? 2 : 3;
            }}
            describe={(d) => {
              const a = byDay.get(d);
              return a && a.count ? `${plural(a.count, 'práctica', 'prácticas')}` : 'sin registros';
            }}
          />
          <p className="tiny muted" style={{ margin: '8px 0 0' }}>
            Más intenso = más prácticas registradas ese día.
          </p>
        </div>
      </Section>

      <Section title="Áreas atendidas esta semana">
        <ul className="card list-plain stack">
          {AREAS.map((a) => {
            const days = week.filter((d) => byDay.get(d)?.areas.has(a.id));
            return (
              <li key={a.id} className="row">
                <span className="grow small">
                  <span className="area-dot" style={{ background: `var(--area-${a.id})`, marginRight: 8 }} />
                  {a.label}
                </span>
                <span className="row" style={{ gap: 4 }} aria-label={`${a.label}: ${plural(days.length, 'día', 'días')} esta semana`}>
                  {week.map((d) => (
                    <span
                      key={d}
                      title={WEEKDAY_SHORT[weekday(d)]}
                      className="area-dot"
                      style={{ background: days.includes(d) ? `var(--area-${a.id})` : 'var(--surface-2)', width: 12, height: 12 }}
                    />
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Aprendizaje y cuerpo">
        <div className="grid-2">
          <div className="card">
            <div className="small muted">Aprendizaje</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{learnWeek} min</div>
            <div className="tiny muted">esta semana · {learn30} min en 30 días</div>
          </div>
          <div className="card">
            <div className="small muted">Entrenamientos</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{workoutsWeek.length}</div>
            <div className="tiny muted">esta semana · {workouts30.length} en 30 días</div>
          </div>
        </div>
        {avgSleep !== null && (
          <p className="small muted">Sueño registrado esta semana: promedio de {avgSleep.toFixed(1).replace('.', ',')} h.</p>
        )}
      </Section>

      <Section title="Hábitos más practicados (30 días)">
        {top.length === 0 ? (
          <p className="small muted">Cuando registres hábitos, vas a ver acá los que más practicás.</p>
        ) : (
          <ul className="card list-plain">
            {top.map((t) => (
              <li key={t.habit.id} className="tx">
                <span className="grow">{t.habit.name}</span>
                <span className="small muted tabular">
                  {t.full} completos · {t.minimal} mínimos
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Objetivos personales">
        {goalStats.length === 0 && savings.length === 0 ? (
          <p className="small muted">Podés definir un objetivo de aprendizaje en Tarde o uno de ahorro en Finanzas.</p>
        ) : (
          <ul className="card list-plain stack">
            {goalStats.map((g) => (
              <li key={g.goal.id}>
                <strong>{g.goal.title}</strong>
                <div className="small muted">
                  {plural(g.sessions, 'sesión', 'sesiones')} y {g.minutes} min en las últimas 5 semanas
                </div>
              </li>
            ))}
            {savings.map((s) => {
              const pct = Math.min(100, Math.round((s.savedCents / s.targetCents) * 100));
              return (
                <li key={s.id}>
                  <strong>{s.name}</strong>
                  <div className="small muted tabular">
                    {formatMoney(s.savedCents, s.currency)} de {formatMoney(s.targetCents, s.currency)}
                  </div>
                  <div className="bar" aria-hidden="true" style={{ marginTop: 4 }}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <a className="btn btn--primary btn--block" href={href('/progreso/semana')}>
        <Icon name="calendar" /> Revisión semanal (5 min)
      </a>
    </>
  );
}
