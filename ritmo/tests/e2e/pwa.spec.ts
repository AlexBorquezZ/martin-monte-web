import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

async function waitForServiceWorker(page: Page) {
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!reg?.active && !!navigator.serviceWorker.controller;
  }, undefined, { timeout: 30_000 });
}

/** Carga los hábitos de ejemplo y espera a que estén guardados. */
async function useSamples(page: Page) {
  await page.getByRole('button', { name: 'Usar ejemplos' }).click();
  await expect(page.getByText('Agregamos hábitos de ejemplo')).toBeVisible();
}

/** Importa un archivo como lo haría una persona: botón → selector de archivos. */
async function importFile(page: Page, path: string) {
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Importar copia' }).click()]);
  await chooser.setFiles(path);
}

/** Primera carga + recarga para que el service worker controle la página. */
async function installApp(page: Page) {
  await page.goto('./');
  await page.waitForFunction(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await waitForServiceWorker(page);
}

test.describe('PWA y modo offline', () => {
  test('inicia, es instalable y registra el service worker', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.hostname !== 'localhost') external.push(r.url());
    });
    await installApp(page);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Buen día|Buenas tardes|Buenas noches/);

    // Manifest válido y criterios de instalación de Chrome.
    const manifest = await (await page.request.get('manifest.webmanifest')).json();
    expect(manifest).toMatchObject({ short_name: 'RITMO', display: 'standalone', start_url: '/ritmo/' });
    const cdp = await page.context().newCDPSession(page);
    const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
    expect(installabilityErrors).toEqual([]);

    // El precache contiene los recursos necesarios para abrir sin red.
    const cached = await page.evaluate(async () => {
      const keys: string[] = [];
      for (const name of await caches.keys()) {
        const c = await caches.open(name);
        keys.push(...(await c.keys()).map((r) => new URL(r.url).pathname));
      }
      return keys;
    });
    expect(cached).toEqual(expect.arrayContaining(['/ritmo/index.html', '/ritmo/manifest.webmanifest', '/ritmo/icons/icon-192.png']));
    expect(cached.some((p) => /\/ritmo\/assets\/index-.*\.js$/.test(p))).toBe(true);
    expect(cached.some((p) => /\/ritmo\/assets\/index-.*\.css$/.test(p))).toBe(true);

    // Ninguna petición a servidores externos (sin fuentes, CDNs ni analítica).
    expect(external).toEqual([]);
  });

  test('funciona en modo avión: abre, crea, completa, edita y elimina sin red', async ({ page, context }) => {
    await installApp(page);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('Sin conexión')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Crear hábito offline.
    await page.goto('./#/habitos/nuevo');
    await page.getByLabel('Nombre').fill('Caminar');
    await page.getByLabel('Versión mínima').fill('Cinco minutos');
    await page.getByRole('radio', { name: 'Cuerpo' }).check();
    await page.getByRole('button', { name: 'Crear hábito' }).click();
    const card = page.getByRole('article', { name: 'Caminar' });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Mínimo' }).click();
    await expect(card.getByRole('button', { name: 'Mínimo' })).toHaveAttribute('aria-pressed', 'true');

    // Editar offline.
    await card.getByRole('link', { name: 'Editar Caminar' }).click();
    await page.getByLabel('Nombre').fill('Caminar al aire libre');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByRole('article', { name: 'Caminar al aire libre' })).toBeVisible();

    // Gasto offline.
    await page.goto('./#/finanzas');
    await page.getByRole('button', { name: /Registrar gasto o ingreso/ }).click();
    await page.getByRole('dialog').getByLabel('Importe').fill('2500');
    await page.getByRole('dialog').getByLabel('Descripción').fill('Almacén');
    await page.getByRole('dialog').getByRole('button', { name: 'Guardar gasto' }).click();
    await expect(page.getByText('Almacén')).toBeVisible();

    // Reflexión nocturna offline.
    await page.goto('./#/momento/noche');
    await page.getByLabel('¿Qué salió bien hoy?').fill('Caminé');
    await page.getByRole('button', { name: 'Cerrar el día' }).click();
    await expect(page.getByRole('heading', { name: 'Día cerrado' })).toBeVisible();

    // Fichas de cultura offline.
    await page.goto('./#/cultura/geo-aconcagua');
    await expect(page.getByRole('heading', { name: 'El Aconcagua' })).toBeVisible();

    // Recargar sin red: los datos siguen ahí.
    await page.reload();
    await page.goto('./#/habitos');
    await page.getByRole('tab', { name: 'Todos' }).click();
    await expect(page.getByRole('article', { name: 'Caminar al aire libre' })).toBeVisible();
    await page.goto('./#/finanzas');
    await expect(page.getByText('Almacén')).toBeVisible();

    // Eliminar offline.
    await page.goto('./#/habitos');
    await page.getByRole('tab', { name: 'Todos' }).click();
    await page.getByRole('link', { name: 'Editar Caminar al aire libre' }).click();
    await page.getByRole('button', { name: 'Eliminar hábito' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Todavía no hay hábitos')).toBeVisible();
    await context.setOffline(false);
  });

  test('los datos sobreviven al cerrar y reabrir la app', async ({ page, context }) => {
    await installApp(page);
    await useSamples(page);
    await page.close();

    await context.setOffline(true);
    const again = await context.newPage();
    await again.goto('./#/habitos');
    await again.getByRole('tab', { name: 'Todos' }).click();
    await expect(again.getByRole('article', { name: 'Practicar inglés' })).toBeVisible();
    await expect(again.getByRole('article', { name: 'Calmar la mente' })).toBeVisible();
    await context.setOffline(false);
  });

  test('una actualización de la app (caché nueva) no borra los datos', async ({ page }) => {
    await installApp(page);
    await useSamples(page);
    // Simula el reemplazo completo de los archivos de la app: se borra la caché del
    // service worker y se desregistra, como ocurre al instalar una versión nueva.
    await page.evaluate(async () => {
      for (const name of await caches.keys()) await caches.delete(name);
      for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    });
    await page.reload();
    await page.goto('./#/habitos');
    await page.getByRole('tab', { name: 'Todos' }).click();
    await expect(page.getByRole('article', { name: 'Practicar inglés' })).toBeVisible();
  });
});

test.describe('experiencia móvil', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('no hay desplazamiento horizontal en pantallas estrechas', async ({ page }) => {
    await page.goto('./');
    await useSamples(page);
    const routes = [
      '#/',
      '#/habitos',
      '#/habitos/nuevo',
      '#/momento/manana',
      '#/momento/cuerpo',
      '#/momento/tarde',
      '#/momento/relaciones',
      '#/momento/noche',
      '#/pausa',
      '#/foco',
      '#/finanzas',
      '#/cultura',
      '#/cultura/eco-compuesto',
      '#/progreso',
      '#/progreso/semana',
      '#/ajustes',
      '#/privacidad',
      '#/mas',
    ];
    for (const r of routes) {
      await page.goto(`./${r}`);
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `desborde horizontal en ${r}`).toBeLessThanOrEqual(0);
    }
  });

  test('los objetivos táctiles principales miden al menos 40 px', async ({ page }) => {
    await page.goto('./');
    await useSamples(page);
    await page.goto('./#/habitos');
    const sizes = await page.locator('.status-btn, .bottom-nav a, .btn').evaluateAll((els) =>
      els.filter((e) => (e as HTMLElement).offsetParent).map((e) => e.getBoundingClientRect().height),
    );
    expect(sizes.length).toBeGreaterThan(5);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(40);
  });
});

test.describe('flujos principales', () => {
  test('rutina diaria completa: check-in, mañana, hábito, pausa y noche', async ({ page }) => {
    await page.goto('./');
    await useSamples(page);
    await page.getByRole('radio', { name: 'Cansado' }).click();
    await expect(page.getByText('Hoy me siento')).toBeVisible();
    await expect(page.getByText('versión mínima').first()).toBeVisible();

    await page.goto('./#/momento/manana');
    await page.getByRole('radio', { name: 'Media' }).click();
    await page.getByLabel('Mi intención para hoy').fill('Estar presente');
    await page.getByLabel('Una prioridad importante').fill('Terminar el informe');
    await page.getByRole('button', { name: 'Empezar el día' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Buen|Buenas/);

    // Marcar un hábito sugerido.
    const rec = page.locator('.card').filter({ has: page.getByRole('button', { name: 'Completo' }) }).first();
    const name = (await rec.locator('.rec__title').innerText()).replace(/versión mínima/, '').trim();
    await rec.getByRole('button', { name: 'Completo' }).click();
    // Pasa a "Ya hiciste hoy", donde se puede corregir.
    const done = page.getByRole('listitem', { name: `Hecho: ${name}` });
    await expect(done.getByRole('button', { name: 'Completo' })).toHaveAttribute('aria-pressed', 'true');

    // Pausa de observación.
    await page.goto('./#/pausa');
    await page.getByRole('button', { name: /Observar el entorno/ }).click();
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: 'Terminar' }).click();
    await expect(page.getByRole('heading', { name: 'Gracias por la pausa' })).toBeVisible();

    // Cierre con "hoy no corresponde" en finanzas.
    await page.goto('./#/momento/noche');
    await page.getByLabel('¿Qué agradezco?').fill('Un buen día');
    await page.getByRole('switch', { name: /Hoy no corresponde registrar/ }).check();
    await page.getByRole('button', { name: 'Cerrar el día' }).click();
    await expect(page.getByRole('heading', { name: 'Día cerrado' })).toBeVisible();

    // Áreas del día y progreso.
    await page.goto('./');
    await expect(page.locator('.area-pill--on').first()).toBeVisible();
    await page.goto('./#/progreso');
    await expect(page.getByText(/Practicaste algo en 1 día de los últimos 30/)).toBeVisible();
  });

  test('exportar e importar una copia desde Ajustes; un archivo inválido no cambia nada', async ({ page }) => {
    // Directorio con nombre ASCII: Chromium no lee archivos de rutas con acentos en este entorno.
    const dir = mkdtempSync(join(tmpdir(), 'ritmo-e2e-'));
    await page.goto('./');
    await useSamples(page);
    await page.goto('./#/ajustes');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Exportar copia/ }).click()]);
    const file = join(dir, 'copia.json');
    await download.saveAs(file);
    await expect(page.getByText('Copia exportada.')).toBeVisible();

    // Archivo inválido: error claro y datos intactos.
    const bad = join(dir, 'mala.json');
    writeFileSync(bad, JSON.stringify({ app: 'ritmo', format: 1, data: { habits: [{ id: 1 }] } }));
    await importFile(page, bad);
    await expect(page.getByRole('alert')).toContainText('No se modificó ningún dato');

    // Borrar todo y restaurar la copia válida.
    await page.getByRole('button', { name: 'Borrar todos los datos' }).click();
    await page.getByRole('dialog').getByLabel(/Escribí "BORRAR"/).fill('BORRAR');
    await page.getByRole('dialog').getByRole('button', { name: 'Borrar todo' }).click();
    await expect(page.getByText('Empecemos con calma')).toBeVisible();

    await page.goto('./#/ajustes');
    await importFile(page, file);
    await page.getByRole('dialog').getByRole('button', { name: 'Reemplazar' }).click();
    await page.waitForLoadState('load');
    await page.goto('./#/habitos');
    await page.getByRole('tab', { name: 'Todos' }).click();
    await expect(page.getByRole('article')).toHaveCount(5);
  });

  test('el cambio de fecha no mezcla registros de días distintos', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-23T23:58:00-03:00') });
    await page.goto('./');
    await useSamples(page);
    await page.goto('./#/habitos');
    const card = page.getByRole('article', { name: 'Calmar la mente' });
    await card.getByRole('button', { name: 'Completo' }).click();
    await expect(card.getByRole('button', { name: 'Completo' })).toHaveAttribute('aria-pressed', 'true');

    // Pasa la medianoche con la app abierta.
    await page.clock.runFor(3 * 60 * 1000);
    await expect(page.getByRole('article', { name: 'Calmar la mente' }).getByRole('button', { name: 'Completo' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    // El registro del día anterior sigue en el historial.
    await page.getByRole('article', { name: 'Calmar la mente' }).getByRole('link', { name: 'Ver historial' }).click();
    await expect(page.getByText(/viernes, 23 de octubre|viernes 23 de octubre/i)).toBeVisible();
  });
});
