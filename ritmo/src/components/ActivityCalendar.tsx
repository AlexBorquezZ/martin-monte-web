import { addDays, formatShortDate, parseDateKey, weekStart, type DateKey } from '../lib/date';

const HEAD = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * Calendario de las últimas semanas. `level(date)` devuelve 0–3 (intensidad).
 * Los días sin actividad se ven neutros: no hay colores de "fallo".
 */
export function ActivityCalendar({
  today,
  weeks = 5,
  level,
  describe,
}: {
  today: DateKey;
  weeks?: number;
  level: (date: DateKey) => number;
  describe: (date: DateKey) => string;
}) {
  const start = addDays(weekStart(today), -(weeks - 1) * 7);
  const cells: DateKey[] = [];
  for (let i = 0; i < weeks * 7; i++) cells.push(addDays(start, i));
  return (
    <div>
      <div className="cal" aria-hidden="true" style={{ marginBottom: 4 }}>
        {HEAD.map((h, i) => (
          <div key={i} className="cal__head">
            {h}
          </div>
        ))}
      </div>
      <div className="cal" role="list" aria-label="Calendario de actividad">
        {cells.map((d) => {
          if (d > today) return <div key={d} className="cal__cell cal__cell--empty" role="presentation" />;
          const l = Math.min(3, Math.max(0, level(d)));
          return (
            <div
              key={d}
              role="listitem"
              className={`cal__cell${l ? ` cal__cell--l${l}` : ''}${d === today ? ' cal__cell--today' : ''}`}
              aria-label={`${formatShortDate(d)}: ${describe(d)}`}
              title={`${formatShortDate(d)}: ${describe(d)}`}
            >
              {parseDateKey(d).getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
