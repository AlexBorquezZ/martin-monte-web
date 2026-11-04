import { useState } from 'react';
import { useApp, useQuery } from '../../app/AppContext';
import { ActivityCalendar } from '../../components/ActivityCalendar';
import { HabitStatusButtons } from '../../components/HabitStatusButtons';
import { EmptyState, PageHeader, Section, TextInput } from '../../components/ui';
import { STATUS_LABEL } from '../../domain/constants';
import { flexibleConsistency, isScheduledOn } from '../../domain/habits';
import { addDays, formatLongDate, isValidDateKey } from '../../lib/date';
import { getHabit, logsForHabit } from '../../storage/repo';

export function HabitHistoryScreen({ id }: { id: string }) {
  const { today } = useApp();
  const [date, setDate] = useState(today);
  const { data } = useQuery(async () => {
    const [habit, logs] = await Promise.all([getHabit(id), logsForHabit(id)]);
    return { habit, logs };
  }, [id]);

  if (!data) return <p className="muted">Cargando…</p>;
  const { habit, logs } = data;
  if (!habit) return <PageHeader title="No encontramos ese hábito" back="/habitos" />;

  const byDate = new Map(logs.map((l) => [l.date, l.status]));
  const from30 = addDays(today, -29);
  const c = flexibleConsistency(habit, logs, from30 < habit.startDate ? habit.startDate : from30, today);
  const validDate = isValidDateKey(date) && date <= today;

  return (
    <>
      <PageHeader title={habit.name} subtitle="Historial" back="/habitos" />
      <div className="card card--soft">
        <strong>
          {c.practiced} {c.practiced === 1 ? 'día' : 'días'} con práctica en los últimos 30
        </strong>
        <p className="small" style={{ margin: 0 }}>
          Lo que importa es la tendencia, no la perfección. Los días sin registro no restan nada.
        </p>
      </div>

      <Section title="Últimas semanas">
        <div className="card">
          <ActivityCalendar
            today={today}
            level={(d) => {
              const s = byDate.get(d);
              return s === 'done' ? 3 : s === 'partial' ? 2 : 0;
            }}
            describe={(d) => {
              const s = byDate.get(d);
              return s ? STATUS_LABEL[s] : 'sin registro';
            }}
          />
        </div>
      </Section>

      <Section title="Registrar o corregir un día">
        <div className="card">
          <TextInput label="Fecha" type="date" value={date} max={today} onChange={setDate} />
          {validDate ? (
            <>
              <p className="small muted">
                {formatLongDate(date)}
                {!isScheduledOn({ ...habit, active: true }, date) && ' · no estaba programado'}
              </p>
              <HabitStatusButtons habitId={habit.id} habitName={habit.name} date={date} current={byDate.get(date)} />
            </>
          ) : (
            <p className="field__error">Elegí una fecha de hoy o anterior.</p>
          )}
        </div>
      </Section>

      <Section title="Registros">
        {logs.length === 0 ? (
          <EmptyState title="Sin registros todavía" />
        ) : (
          <ul className="card list-plain">
            {logs.slice(0, 60).map((l) => (
              <li key={l.id} className="tx">
                <span className="grow">
                  {formatLongDate(l.date)}
                </span>
                <span className="badge">{STATUS_LABEL[l.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
