import { href } from '../app/router';
import { Icon, type IconName } from '../components/Icon';
import { PageHeader } from '../components/ui';

const ITEMS: { path: string; label: string; hint: string; icon: IconName }[] = [
  { path: '/momento/manana', label: 'Mañana', hint: 'Intención, gratitud y prioridad', icon: 'sunrise' },
  { path: '/momento/cuerpo', label: 'Cuerpo', hint: 'Rutinas y registro de entrenamientos', icon: 'body' },
  { path: '/momento/tarde', label: 'Tarde', hint: 'Objetivo de aprendizaje y sesiones', icon: 'book' },
  { path: '/momento/relaciones', label: 'Relaciones', hint: 'Propuestas de conexión y curiosidad', icon: 'users' },
  { path: '/momento/noche', label: 'Noche', hint: 'Cierre del día y gastos', icon: 'moon' },
  { path: '/pausa', label: 'Pausa', hint: 'Uno a cinco minutos para vos', icon: 'leaf' },
  { path: '/foco', label: 'Modo enfoque', hint: 'Temporizador configurable', icon: 'timer' },
  { path: '/cultura', label: 'Cultura y conocimiento', hint: 'Fichas para leer offline', icon: 'sparkle' },
  { path: '/progreso/semana', label: 'Revisión semanal', hint: 'Cinco minutos para mirar la semana', icon: 'calendar' },
  { path: '/ajustes', label: 'Ajustes', hint: 'Horarios, recordatorios, tema y copias', icon: 'settings' },
  { path: '/privacidad', label: 'Privacidad', hint: 'Dónde viven tus datos', icon: 'shield' },
];

export function MoreScreen() {
  return (
    <>
      <PageHeader title="Más" />
      <ul className="list-plain">
        {ITEMS.map((i) => (
          <li key={i.path}>
            <a className="card card-link" href={href(i.path)} style={{ marginBottom: 8 }}>
              <Icon name={i.icon} />
              <span className="grow">
                <strong>{i.label}</strong>
                <br />
                <span className="small muted">{i.hint}</span>
              </span>
              <Icon name="chevron" />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
