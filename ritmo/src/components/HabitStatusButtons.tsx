import type { HabitStatus } from '../domain/types';
import { setHabitStatus } from '../storage/repo';
import type { DateKey } from '../lib/date';
import { useApp } from '../app/AppContext';

const OPTIONS: { status: HabitStatus; label: string; toast: string }[] = [
  { status: 'done', label: 'Completo', toast: 'Registrado. ¡Bien ahí!' },
  { status: 'partial', label: 'Mínimo', toast: 'La versión mínima también cuenta.' },
  { status: 'postponed', label: 'Más tarde', toast: 'Queda para más tarde.' },
  { status: 'skipped', label: 'Hoy no', toast: 'Está bien. Mañana es otro día.' },
];

/** Botones para marcar un hábito. Tocar de nuevo el estado activo lo desmarca. */
export function HabitStatusButtons({
  habitId,
  habitName,
  date,
  current,
}: {
  habitId: string;
  habitName: string;
  date: DateKey;
  current: HabitStatus | undefined;
}) {
  const { toast } = useApp();
  return (
    <div className="status-row" role="group" aria-label={`Registrar «${habitName}»`}>
      {OPTIONS.map((o) => {
        const pressed = current === o.status;
        return (
          <button
            key={o.status}
            type="button"
            className={`status-btn status-btn--${o.status}`}
            aria-pressed={pressed}
            onClick={async () => {
              try {
                await setHabitStatus(habitId, date, pressed ? null : o.status);
                toast(pressed ? 'Registro quitado.' : o.toast);
              } catch {
                toast('No se pudo guardar. Probá de nuevo.');
              }
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
