import { useState } from 'react';
import { useApp, useQuery } from '../../app/AppContext';
import { href } from '../../app/router';
import { HabitStatusButtons } from '../../components/HabitStatusButtons';
import { Icon } from '../../components/Icon';
import { AreaTag, EmptyState, PageHeader } from '../../components/ui';
import { MOMENT_LABEL } from '../../domain/constants';
import { describeFrequency, isScheduledOn, practicedThisWeek } from '../../domain/habits';
import type { Habit, HabitStatus } from '../../domain/types';
import { listHabits, logsBetween, moveHabit } from '../../storage/repo';
import { weekStart } from '../../lib/date';

type Filter = 'hoy' | 'activos' | 'pausados';

export function HabitsScreen() {
  const { today } = useApp();
  const [filter, setFilter] = useState<Filter>('hoy');
  const { data } = useQuery(async () => {
    const [habits, logs] = await Promise.all([listHabits(), logsBetween(weekStart(today), today)]);
    return { habits, logs };
  }, [today]);

  if (!data) return <p className="muted">Cargando…</p>;
  const { habits, logs } = data;
  const status = new Map(logs.filter((l) => l.date === today).map((l) => [l.habitId, l.status]));
  const shown = habits.filter((h) =>
    filter === 'hoy' ? isScheduledOn(h, today) : filter === 'activos' ? h.active : !h.active,
  );

  return (
    <>
      <PageHeader title="Hábitos" subtitle="Cada hábito tiene una versión completa y una mínima. Las dos cuentan." />
      <div className="row row--between" style={{ marginBottom: 12 }}>
        <div className="tabs grow" role="tablist" aria-label="Filtrar hábitos" style={{ marginBottom: 0 }}>
          {(
            [
              ['hoy', 'Hoy'],
              ['activos', 'Todos'],
              ['pausados', 'Pausados'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <a className="btn btn--primary btn--block" href={href('/habitos/nuevo')} style={{ marginBottom: 14 }}>
        <Icon name="plus" /> Nuevo hábito
      </a>

      {shown.length === 0 ? (
        <EmptyState
          title={
            filter === 'hoy'
              ? habits.length
                ? 'Hoy no hay hábitos programados'
                : 'Todavía no hay hábitos'
              : filter === 'pausados'
                ? 'No hay hábitos pausados'
                : 'Todavía no hay hábitos'
          }
        >
          <p className="small">
            {habits.length
              ? 'Podés descansar o mirar la lista completa.'
              : 'Creá uno pequeño: algo que puedas hacer incluso en un día difícil.'}
          </p>
        </EmptyState>
      ) : (
        <ul className="list-plain">
          {shown.map((h) => (
            <li key={h.id}>
              <HabitCard
                habit={h}
                today={today}
                status={status.get(h.id)}
                weekCount={practicedThisWeek(h.id, logs, today)}
                showStatus={filter === 'hoy'}
                canMove={filter !== 'hoy'}
                isFirst={habits[0]?.id === h.id}
                isLast={habits.at(-1)?.id === h.id}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function HabitCard({
  habit,
  today,
  status,
  weekCount,
  showStatus,
  canMove,
  isFirst,
  isLast,
}: {
  habit: Habit;
  today: string;
  status: HabitStatus | undefined;
  weekCount: number;
  showStatus: boolean;
  canMove: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <article className={habit.active ? 'card habit' : 'card habit habit--inactive'} aria-label={habit.name}>
      <div className="habit__head">
        <div className="grow">
          <div className="habit__name">{habit.name}</div>
          <div className="small muted">
            {describeFrequency(habit.frequency)}
            {habit.moments.length > 0 && ` · ${habit.moments.map((m) => MOMENT_LABEL[m]).join(' o ')}`}
            {habit.durationMin > 0 && ` · ${habit.durationMin} min`}
          </div>
          <AreaTag area={habit.category} />
          {habit.kind === 'temporary' && habit.endDate && (
            <span className="badge" style={{ marginLeft: 8 }}>
              hasta {habit.endDate.split('-').reverse().join('/')}
            </span>
          )}
        </div>
        <div className="row" style={{ gap: 0 }}>
          {canMove && (
            <>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Subir ${habit.name}`}
                disabled={isFirst}
                onClick={() => void moveHabit(habit.id, -1)}
              >
                <Icon name="up" />
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Bajar ${habit.name}`}
                disabled={isLast}
                onClick={() => void moveHabit(habit.id, 1)}
              >
                <Icon name="down" />
              </button>
            </>
          )}
          <a className="icon-btn" href={href(`/habitos/${habit.id}`)} aria-label={`Editar ${habit.name}`}>
            <Icon name="edit" />
          </a>
        </div>
      </div>
      {(habit.fullVersion || habit.minimalVersion) && (
        <div className="small">
          {habit.fullVersion && (
            <div>
              <span className="muted">Completa:</span> {habit.fullVersion}
            </div>
          )}
          {habit.minimalVersion && (
            <div>
              <span className="muted">Mínima:</span> {habit.minimalVersion}
            </div>
          )}
        </div>
      )}
      {habit.frequency.type === 'weekly' && (
        <div className="tiny muted">
          Esta semana: {weekCount} de {habit.frequency.times}
        </div>
      )}
      {showStatus && <HabitStatusButtons habitId={habit.id} habitName={habit.name} date={today} current={status} />}
      <a className="small" href={href(`/habitos/${habit.id}/historial`)}>
        Ver historial
      </a>
    </article>
  );
}
