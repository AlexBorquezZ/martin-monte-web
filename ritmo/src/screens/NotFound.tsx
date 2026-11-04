import { href } from '../app/router';
import { PageHeader } from '../components/ui';

export function NotFound() {
  return (
    <>
      <PageHeader title="Esta sección no existe" />
      <a className="btn btn--primary" href={href('/')}>
        Ir a Hoy
      </a>
    </>
  );
}
