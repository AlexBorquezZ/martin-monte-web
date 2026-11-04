import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';
import { freshDB } from './helpers';
import { listCardStates, listHabits, listTransactions, logsForDate } from '../../src/storage/repo';
import { toDateKey } from '../../src/lib/date';

beforeEach(async () => {
  await freshDB();
  window.location.hash = '#/';
});
afterEach(cleanup);

describe('interfaz', () => {
  it('inicia en Hoy con saludo, fecha y navegación', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: /Buen día|Buenas tardes|Buenas noches/ })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Secciones principales' })).toBeInTheDocument();
    expect(screen.getByText('Empecemos con calma')).toBeInTheDocument();
    expect(screen.getByText('En línea')).toBeInTheDocument();
  });

  it('crea un hábito desde el formulario y lo marca como completo', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/habitos/nuevo';
    render(<App />);
    await screen.findByRole('heading', { name: 'Nuevo hábito' });

    // Validación: el nombre es obligatorio.
    await user.click(screen.getByRole('button', { name: 'Crear hábito' }));
    expect(await screen.findByText('Poné un nombre corto para el hábito.')).toBeInTheDocument();
    expect(await listHabits()).toHaveLength(0);

    await user.type(screen.getByLabelText('Nombre'), 'Practicar inglés');
    await user.type(screen.getByLabelText('Versión mínima'), 'Tres frases');
    await user.click(screen.getByRole('radio', { name: 'Futuro' }));
    await user.click(screen.getByRole('button', { name: 'Crear hábito' }));

    const card = await screen.findByRole('article', { name: 'Practicar inglés' });
    expect((await listHabits())[0]).toMatchObject({ name: 'Practicar inglés', category: 'futuro', minimalVersion: 'Tres frases' });

    await user.click(within(card).getByRole('button', { name: 'Completo' }));
    await within(card).findByRole('button', { name: 'Completo', pressed: true });
    expect((await logsForDate(toDateKey()))[0].status).toBe('done');
  });

  it('registra un gasto sin conexión y lo muestra en el resumen', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    window.location.hash = '#/finanzas';
    render(<App />);
    expect(await screen.findByText('Sin conexión')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: /Registrar gasto o ingreso/ }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Importe'), '1.500,50');
    await user.type(within(dialog).getByLabelText('Descripción'), 'Verdulería');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar gasto' }));
    expect(await screen.findByText('Verdulería')).toBeInTheDocument();
    expect((await listTransactions())[0]).toMatchObject({ amountCents: 150050, currency: 'ARS', type: 'expense' });

    await user.click(screen.getByRole('tab', { name: 'Resumen' }));
    expect((await screen.findByTestId('gastos')).textContent?.replace(/\s/g, ' ')).toMatch(/1\.500,50/);
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('rechaza importes inválidos', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/finanzas';
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /Registrar gasto o ingreso/ }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Importe'), 'abc');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar gasto' }));
    expect(await within(dialog).findByText(/Escribí un importe mayor a cero/)).toBeInTheDocument();
    expect(await listTransactions()).toHaveLength(0);
  });

  it('las fichas de cultura se leen desde el paquete', async () => {
    window.location.hash = '#/cultura/cien-cielo';
    render(<App />);
    expect(await screen.findByRole('heading', { name: '¿Por qué el cielo es azul?' })).toBeInTheDocument();
    expect(screen.getAllByText(/dispersión de Rayleigh/).length).toBeGreaterThan(0);
    // Al abrirla queda marcada como leída.
    await waitFor(async () => expect((await listCardStates())[0]).toMatchObject({ cardId: 'cien-cielo' }));
  });

  it('borrar todo exige escribir BORRAR', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/ajustes';
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Borrar todos los datos' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Borrar todo' });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Escribí "BORRAR"/), 'borrar');
    expect(confirm).toBeEnabled();
  });
});
