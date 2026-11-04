import { href } from '../../app/router';
import { PageHeader } from '../../components/ui';

export function PrivacyScreen() {
  return (
    <>
      <PageHeader title="Privacidad" subtitle="Tus datos son tuyos y se quedan en tu teléfono." back />
      <div className="card prose">
        <h3>Qué guardamos y dónde</h3>
        <p>
          Todo lo que registrás (hábitos, reflexiones, finanzas, sesiones, ajustes) se guarda en el almacenamiento local de
          este navegador (IndexedDB). No hay cuentas, servidores, analítica ni rastreadores. RITMO no envía tus datos a
          ningún lado.
        </p>
        <h3>Conexión a internet</h3>
        <p>
          Solo se usa internet para descargar la app la primera vez y para buscar actualizaciones de la propia app. Tus
          datos nunca viajan en esas descargas.
        </p>
        <h3>Riesgo de pérdida</h3>
        <ul>
          <li>Si borrás los datos del sitio o del navegador, se borran tus registros.</li>
          <li>Si desinstalás la app, Android puede borrar sus datos.</li>
          <li>Si el teléfono se queda sin espacio, el navegador podría liberar datos de sitios.</li>
          <li>Los datos no se sincronizan entre dispositivos.</li>
        </ul>
        <p>
          Por eso conviene <a href={href('/ajustes')}>exportar una copia de seguridad</a> de vez en cuando y guardarla en un
          lugar seguro. La copia es un archivo JSON legible: tratala como información personal.
        </p>
        <h3>Notificaciones</h3>
        <p>Solo te pedimos permiso si activás los recordatorios. Se generan en tu dispositivo.</p>
        <h3>Contenido</h3>
        <p>
          Las rutinas, pausas y fichas son información general. No son diagnósticos ni tratamientos, y no reemplazan la
          consulta con profesionales de la salud o de las finanzas.
        </p>
      </div>
    </>
  );
}
