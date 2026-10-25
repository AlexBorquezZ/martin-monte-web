# RITMO — Una vida en equilibrio

**Crecer sin dejar de vivir.**

RITMO es una aplicación web progresiva (PWA) personal de hábitos. Se instala en Android desde Chrome, funciona **sin conexión**, no usa cuentas ni servidores y guarda todo en tu teléfono.

Te acompaña en cinco dimensiones —**Cuerpo, Mente, Finanzas, Futuro y Relaciones**— con acciones pequeñas a lo largo del día, versiones mínimas para los días difíciles y estadísticas que no generan culpa.

---

## Índice

1. [Funciones](#funciones)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Requisitos](#requisitos)
4. [Desarrollo](#desarrollo)
5. [Versión de producción](#versión-de-producción)
6. [Publicar con HTTPS](#publicar-con-https)
7. [Instalar en Android y comprobar el modo avión](#instalar-en-android-y-comprobar-el-modo-avión)
8. [Copias de seguridad](#copias-de-seguridad)
9. [Limitaciones reales](#limitaciones-reales)
10. [Pruebas](#pruebas)
11. [Pendientes y cosas a verificar en un teléfono real](#pendientes-y-cosas-a-verificar-en-un-teléfono-real)

---

## Funciones

### Hoy (pantalla principal)
- Saludo según la hora local, fecha y una frase breve que cambia una vez por día (nunca la misma dos días seguidos).
- Pregunta de reflexión opcional, con respuesta guardada por día.
- **Check-in**: «Con energía», «Normal», «Cansado» o «Necesito descansar».
- **Bloque del día** según tus horarios (Mañana, Cuerpo, Tarde, Relaciones o Noche).
- **Entre una y tres acciones recomendadas**, priorizando lo que todavía no hiciste, y la sección «Ya hiciste hoy» para corregir un registro.
- Botón de pausa consciente, resumen discreto de las áreas atendidas y accesos rápidos.
- Si pasaron días sin registros: mensaje amable para **retomar** con la versión mínima. Nunca mensajes de fracaso.

### Adaptación diaria (reglas locales, sin IA)
| Estado declarado | Qué sugiere |
|---|---|
| Necesito descansar | Descansar + como mucho una acción mínima tranquila. Nunca entrenamiento. |
| Cansado | Hasta 2 acciones, siempre en versión mínima. |
| Normal | 3 acciones: una corporal, una de crecimiento y una de bienestar o conexión. |
| Con energía | Las 3 anteriores + un desafío extra **opcional** (plegado). |
| Sin dato | 2 acciones y una invitación a contar cómo estás. |

Solo usa lo que vos declarás y lo que registraste. No infiere emociones ni diagnósticos.

### Momentos del día (horarios y duraciones configurables)
- **Mañana · Orientación**: energía (baja/media/alta), intención, gratitud, prioridad y pequeño desafío. La energía ajusta las sugerencias.
- **Cuerpo**: 6 rutinas de peso corporal (movilidad, fuerza básica, calistenia, espacios chicos, caminata, pausa activa) con variantes más fáciles; registro como **completado, parcial o pospuesto**; registro opcional de sueño, energía y recuperación. Con poca energía se muestran primero las rutinas suaves.
- **Tarde · Futuro**: un **único objetivo prioritario** (inglés, ventas, IA y automatización, finanzas, lectura, proyectos) dividido en sesiones que registran *qué quería aprender, qué hice, qué aprendí y el próximo paso*. **Modo enfoque** con temporizador configurable.
- **Relaciones y curiosidad**: 19 propuestas pequeñas y voluntarias (3 por día, rotando), registro opcional. No se cuentan contactos.
- **Noche · Cierre**: cinco preguntas opcionales, registro rápido de gastos/ingresos (o «hoy no corresponde») y un cierre tranquilo.

### Hábitos
Crear, editar y eliminar; nombre, descripción, área, frecuencia (todos los días, días fijos o N veces por semana), uno o más momentos, duración, **versión completa y versión mínima**, permanentes o temporales (con fecha de fin), activar/pausar sin perder historial, reordenar, marcar **completo / mínimo / más tarde / hoy no**, historial por fecha con calendario y corrección de días anteriores.

### Pausa (1 a 5 minutos)
Respiración con ritmo configurable (inhalar/sostener/exhalar), observación 5-4-3-2-1, ordenar pensamientos, gratitud y «no hacer nada». Respeta «reducir movimiento». Sin promesas fisiológicas ni mensajes místicos.

### Finanzas (100 % offline)
Ingresos y gastos con categoría, fecha, descripción, moneda (ARS, USD, EUR) y notas. Balance del período, ingresos y gastos, gastos por categoría, evolución de 6 meses, objetivos de ahorro y exportación CSV/JSON. Importes guardados en centavos (sin errores de redondeo). **Nunca se suman monedas distintas** y no hay cotizaciones, recomendaciones de inversión ni conexiones bancarias.

### Cultura y conocimiento
**33 fichas originales** en 8 categorías (historia, ciencia, filosofía, geografía, economía, arte, psicología y cultura general), cada una con explicación, ejemplo cotidiano, pregunta y sugerencia para profundizar. Incluidas en la app; sin citas inventadas. Se marcan como leídas y se pueden guardar.

### Progreso sin culpa
Calendario de actividad de 5 semanas, áreas atendidas en la semana, minutos de aprendizaje, entrenamientos, hábitos más practicados (completos y mínimos), evolución de objetivos de aprendizaje y ahorro. **Sin puntaje único, rankings ni rachas.** Revisión semanal de ~5 minutos con hasta tres prioridades.

### Ajustes
Nombre visible de la app y tu nombre, tema claro/oscuro/automático, horarios y duraciones de cada momento, recordatorios, duraciones de enfoque/descanso/pausa y ritmo de respiración, moneda y categorías financieras, exportar/importar copia JSON, borrar todo (hay que escribir «BORRAR»), uso de almacenamiento y versión.

### Privacidad
Sin cuentas, autenticación, analítica, rastreadores, claves API ni peticiones a terceros (verificado por prueba automática). Pantalla de privacidad que explica dónde viven los datos y cómo pueden perderse.

---

## Estructura del proyecto

```
ritmo/
├── index.html                 Página base
├── vite.config.ts             Vite + PWA (manifest y service worker)
├── vitest.config.ts           Pruebas unitarias
├── playwright.config.ts       Pruebas en navegador (móvil emulado)
├── public/
│   ├── .htaccess              Cabeceras de caché y HTTPS para Apache/Hostinger
│   ├── favicon.svg
│   └── icons/                 Iconos PNG (192, 512, maskable, apple-touch)
├── scripts/generate-icons.mjs Genera los iconos sin dependencias
├── src/
│   ├── main.tsx               Arranque, tema y registro del service worker
│   ├── App.tsx                Rutas (#/…)
│   ├── app/                   Estado global, enrutado por hash, tema
│   ├── components/            Componentes de interfaz reutilizables e iconos
│   ├── screens/               Pantallas (Hoy, hábitos, momentos, finanzas, …)
│   ├── domain/                Lógica de negocio pura: tipos, validación,
│   │                          recomendaciones, hábitos, finanzas, estadísticas
│   ├── data/                  Contenido incluido: fichas, rutinas, frases…
│   ├── storage/               IndexedDB (esquema y migraciones), repositorio,
│   │                          copias de seguridad
│   ├── pwa/                   Service worker, notificaciones y recordatorios
│   ├── lib/                   Fechas locales, ids, utilidades
│   └── styles/global.css      Estilos (tokens claro/oscuro)
└── tests/
    ├── unit/                  Vitest + Testing Library + fake-indexeddb
    └── e2e/                   Playwright contra la build de producción
```

**Decisiones técnicas**
- **React 19 + TypeScript + Vite 7**, CSS propio sin frameworks.
- **vite-plugin-pwa (Workbox)** en modo `generateSW` con precache de todos los archivos. Actualización en modo *prompt*: la app avisa «Hay una versión nueva» y la persona decide cuándo recargar.
- **IndexedDB** mediante `idb` (≈1 kB). Esquema versionado (`src/storage/db.ts`) con migraciones que solo agregan datos. `localStorage` únicamente para tema, temporizador en curso y avisos ya enviados.
- **Enrutado por hash** (`#/habitos`): no requiere configuración del servidor y funciona offline.
- Tipografía del sistema (Roboto en Android) e iconos SVG en el código: nada se descarga de terceros.

---

## Requisitos

- Node.js 20 o superior (probado con Node 22) y npm.
- Para publicar: un hosting con **HTTPS**.

---

## Desarrollo

```bash
cd ritmo
npm install
npm run dev
```

Abrí `http://localhost:5173/ritmo/`. En modo desarrollo el service worker está desactivado a propósito; para probar el funcionamiento offline usá la versión de producción.

Otros comandos:

```bash
npm run typecheck   # TypeScript
npm test            # pruebas unitarias (Vitest)
npm run test:e2e    # pruebas en navegador (Playwright; compila y levanta la app)
npm run icons       # regenera los iconos
```

---

## Versión de producción

```bash
npm run build       # genera ritmo/dist/
npm run preview     # sirve dist/ en http://localhost:4173/ritmo/
```

Por defecto la app se compila para vivir en la subcarpeta **`/ritmo/`** de un dominio (por ejemplo `https://tudominio.com/ritmo/`). Para otra ruta:

```bash
RITMO_BASE=/ npm run build            # raíz del dominio
RITMO_BASE=/otra-carpeta/ npm run build
```

> La ruta debe empezar y terminar con `/`, y tiene que coincidir con la carpeta donde subas los archivos.

---

## Publicar con HTTPS

La **primera instalación necesita HTTPS** (o `localhost`) y conexión: el navegador descarga todos los archivos de la app y el service worker los guarda. Después funciona sin internet.

### Opción A — Hostinger (mismo hosting del sitio actual)
1. `npm run build`.
2. En el Administrador de archivos de Hostinger, dentro de `public_html`, creá la carpeta **`ritmo`**.
3. Subí **todo el contenido** de `ritmo/dist/` (incluido el archivo oculto `.htaccess`, `sw.js` y las carpetas `assets` e `icons`) a `public_html/ritmo/`.
4. Verificá que el dominio tenga SSL activo (Hostinger → Seguridad → SSL).
5. Abrí `https://tudominio.com/ritmo/`.

El `.htaccess` incluido evita que `sw.js`, `index.html` y el manifest queden en caché del navegador (así las actualizaciones llegan) y fuerza HTTPS.

### Opción B — Netlify, Cloudflare Pages o Vercel (gratis)
Compilá con `RITMO_BASE=/ npm run build` y publicá la carpeta `dist/` (arrastrándola al panel o conectando el repositorio con directorio base `ritmo`, comando `RITMO_BASE=/ npm run build` y carpeta de salida `dist`). Todos ofrecen HTTPS automático.

### Opción C — GitHub Pages
Compilá con `RITMO_BASE=/<nombre-del-repo>/ npm run build` y publicá `dist/`.

### Actualizar la app publicada
Volvé a compilar y reemplazá los archivos. Al abrir la app con conexión, aparece «Hay una versión nueva de la app. Tus datos se conservan» → **Actualizar**. Los datos personales están en IndexedDB y el service worker solo reemplaza los archivos de la app.

---

## Instalar en Android y comprobar el modo avión

1. Abrí la dirección HTTPS en **Chrome para Android** (con internet).
2. Esperá el aviso «Lista para usarse sin conexión» (indica que se descargó todo).
3. Menú ⋮ → **Instalar aplicación** (o «Agregar a la pantalla principal»). Aparece el ícono de RITMO.
4. Abrí RITMO desde el ícono **una vez con conexión**.
5. Cerrala por completo, activá el **modo avión** y volvé a abrirla:
   - debe cargar la interfaz y mostrar «Sin conexión» arriba;
   - creá un hábito, marcálo, registrá un gasto y leé una ficha;
   - cerrá y reabrí la app: todo debe seguir ahí.
6. Desactivá el modo avión: el indicador vuelve a «En línea».

---

## Copias de seguridad

- **Ajustes → Copia de seguridad → Exportar copia (JSON)** descarga un archivo `ritmo-copia-AAAA-MM-DD.json` con todos tus datos y ajustes.
- **Importar copia**: el archivo se **valida por completo antes de tocar nada** (formato, cada registro, duplicados y coherencia). Si algo falla, se muestra el motivo y **no se modifica ningún dato**. Si es válido, se muestra un resumen y se pide confirmación. La restauración se hace en una única transacción: si falla a mitad de camino, los datos anteriores quedan intactos.
- **Finanzas → Exportar** genera además un CSV (para planillas) o un JSON solo con movimientos.
- El archivo de copia contiene información personal legible: guardalo en un lugar seguro.

Recomendación: exportá una copia cada semana o antes de cambiar de teléfono, borrar datos del navegador o desinstalar la app.

---

## Limitaciones reales

### Notificaciones
- Solo se pide permiso cuando activás los recordatorios en Ajustes.
- No hay servidor de notificaciones *push*. Los recordatorios se generan en el teléfono **mientras la app está abierta o en segundo plano reciente**. Si cerrás la app o Android la suspende (ahorro de batería, «Doze»), el aviso puede llegar tarde o **no llegar**.
- Para no avisar cosas viejas, cada recordatorio solo se dispara dentro de los 30 minutos posteriores a su horario y una vez por día.
- El navegador no ofrece hoy una API estable para programar notificaciones locales con la app cerrada. Si un horario es importante, usá también una alarma del sistema.
- El temporizador de enfoque se basa en marcas de tiempo: aunque apagues la pantalla o cierres la app, al volver muestra el tiempo correcto y registra el bloque; el aviso sonoro/visual al terminar depende de las mismas limitaciones.
- La app funciona completa sin notificaciones.

### Almacenamiento local
- Los datos viven **solo en ese navegador de ese teléfono**. No se sincronizan entre dispositivos.
- Se pierden si: borrás los datos del sitio o de Chrome, desinstalás la app (Android puede borrar su almacenamiento) o el sistema libera espacio cuando el teléfono está casi lleno.
- RITMO pide **almacenamiento persistente** al navegador; Chrome puede concederlo o no (se ve en Ajustes → Acerca de). Aun así, la única protección real es la **copia de seguridad**.
- Si usás Chrome en modo incógnito, todo se borra al cerrar la pestaña.

### Otras
- Las monedas no se convierten entre sí (no hay cotización confiable sin internet).
- Las rutinas, pausas y fichas son información general: no son diagnósticos, tratamientos ni asesoramiento financiero.
- Las áreas de los hábitos son cinco y fijas; las categorías financieras sí se pueden editar.

---

## Pruebas

### Pruebas unitarias y de componentes (Vitest) — `npm test`
**72 pruebas, todas pasan.** También se ejecutaron con las zonas horarias `America/Argentina/Mendoza`, `Pacific/Kiritimati` y `America/Los_Angeles` (72/72 en cada una).

| Archivo | Qué verifica |
|---|---|
| `date.test.ts` | Fechas locales cerca de medianoche, meses, años bisiestos, lunes de la semana, saludo, momento del día, frase sin repetir. |
| `finance.test.ts` | Lectura de importes (`1.500,50`, `1,500.50`, `12,5`…), rechazo de inválidos, balance, categorías, monedas sin mezclar, evolución mensual, sin errores de coma flotante, CSV. |
| `recommendations.test.ts` | Reglas de adaptación por energía, descanso sin entrenamiento, desafío extra opcional, prioridad de pendientes, retomar sin reproches, frecuencias, hábitos temporales y continuidad flexible. |
| `storage.test.ts` | Persistencia al cerrar y reabrir, registros de días distintos separados, un registro por hábito y día, pausar conserva historial, reordenar, ajustes normalizados, **migración del esquema v1 → v2 sin pérdida de datos**. |
| `backup.test.ts` | Exportar → borrar → importar preserva todo; 7 tipos de archivos inválidos rechazados **sin modificar los datos**; compatibilidad con copias antiguas; restauración fallida a mitad de camino no pierde nada. |
| `app.test.tsx` | La app inicia en Hoy; crear hábito con validación y marcarlo; registrar gasto sin conexión y verlo en el resumen; rechazo de importes inválidos; fichas offline; borrado exige «BORRAR». |
| `content.test.ts` | ≥ 30 fichas completas en las 8 categorías, sin citas atribuidas ni URLs externas. |

### Pruebas en navegador (Playwright + Chromium, emulando un Pixel 7) — `npm run test:e2e`
Se ejecutan contra la **build de producción** servida en `localhost` con el service worker real. **9 pruebas, todas pasan:**

1. Inicia, el manifest es válido, **Chrome no informa errores de instalabilidad** (`Page.getInstallabilityErrors` vacío), el service worker controla la página y el precache contiene HTML, JS, CSS, manifest e iconos. **Cero peticiones a dominios externos.**
2. **Modo avión** (red desactivada tras instalar): abre, muestra «Sin conexión», crea, completa, edita y elimina hábitos, registra un gasto y el cierre nocturno, lee fichas y recarga sin red conservando todo.
3. Cerrar la pestaña y abrir otra **sin red**: los hábitos siguen.
4. Simulación de actualización (se borra la caché y se desregistra el service worker): **los datos se conservan**.
5. Pantalla de **320 px**: ninguna de las 18 pantallas tiene desplazamiento horizontal.
6. Botones principales de al menos 40 px de alto.
7. Rutina diaria completa: check-in, mañana, hábito sugerido, pausa y cierre nocturno; luego Hoy y Progreso reflejan la actividad.
8. Exportar copia, importar un archivo inválido (error claro, datos intactos), borrar todo e importar la copia válida.
9. **Cambio de fecha con la app abierta** (23:58 → 00:01): el hábito del día anterior no aparece marcado hoy y sigue en el historial del 23.

Errores reales encontrados y corregidos gracias a estas pruebas: desborde horizontal de 74 px en la pantalla de enfoque a 320 px; encabezado fijo que tapaba el elemento enfocado al desplazarse (se agregó `scroll-padding`); una sugerencia marcada como completa desaparecía sin forma visible de deshacerlo (se agregó «Ya hiciste hoy»); un rechazo de promesa sin manejar al abortar una restauración.

---

## Pendientes y cosas a verificar en un teléfono real

Lo siguiente **no se pudo comprobar en este entorno** (no hay un teléfono Android físico):

- [ ] Instalación real desde Chrome para Android vía HTTPS y apariencia del ícono adaptable (maskable) en el lanzador.
- [ ] Modo avión real del sistema (se probó desactivando la red del navegador, que es el mismo mecanismo para la app, pero no el modo avión de Android).
- [ ] Recepción de notificaciones con la app en segundo plano o cerrada, y el comportamiento del ahorro de batería de cada fabricante.
- [ ] Vibración al terminar el temporizador de enfoque.
- [ ] Comportamiento de la actualización con dos versiones reales publicadas (se probó la conservación de datos al reemplazar la caché y la migración del esquema, pero no el aviso «Actualizar» entre dos despliegues).
- [ ] Conservación de datos al desinstalar/reinstalar (depende de Android; por eso se recomienda la copia de seguridad).

Limitaciones de diseño conocidas: no hay sincronización entre dispositivos (por privacidad) y los recordatorios no son fiables con la app cerrada (limitación de la plataforma web).

---

Iconos, rutinas, frases y fichas: contenido original incluido en este repositorio.

---

## Versión publicada en GitHub Pages

La carpeta `ritmo-app/` (en la raíz del repositorio) contiene la app **ya compilada** para GitHub Pages, que en este repositorio publica desde `main`. Una vez fusionada en `main`, la app queda en:

**https://alexborquezz.github.io/martin-monte-web/ritmo-app/**

Para actualizarla después de cambiar el código:

```bash
cd ritmo
RITMO_BASE=/martin-monte-web/ritmo-app/ npx vite build --outDir ../ritmo-app --emptyOutDir
rm -f ../ritmo-app/.htaccess
```

y hacer commit de `ritmo-app/`.
