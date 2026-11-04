import { describe, expect, it } from 'vitest';
import {
  filterTransactions,
  formatMoney,
  monthlyEvolution,
  parseAmount,
  summarize,
  transactionsToCSV,
} from '../../src/domain/finance';
import type { Transaction } from '../../src/domain/types';

let n = 0;
function tx(p: Partial<Transaction>): Transaction {
  n++;
  return {
    id: `t${n}`,
    type: 'expense',
    amountCents: 1000,
    currency: 'ARS',
    category: 'Comida',
    date: '2026-10-10',
    description: '',
    notes: '',
    createdAt: `2026-10-10T10:00:0${n % 10}Z`,
    updatedAt: '',
    ...p,
  };
}

describe('parseAmount', () => {
  it.each([
    ['1500', 150000],
    ['1.500', 150000],
    ['1.500,50', 150050],
    ['1,500.50', 150050],
    ['12,5', 1250],
    ['12.5', 1250],
    ['0,99', 99],
    ['$ 2.000', 200000],
    ['1.234.567', 123456700],
  ])('%s → %i centavos', (input, cents) => {
    expect(parseAmount(input)).toBe(cents);
  });

  it.each(['', '0', '-5', 'abc', '1,2345', '1.2.3', '12,,5'])('rechaza %s', (input) => {
    expect(parseAmount(input)).toBeNull();
  });
});

describe('resúmenes', () => {
  const list = [
    tx({ type: 'income', amountCents: 500000, category: 'Sueldo' }),
    tx({ amountCents: 120000, category: 'Comida' }),
    tx({ amountCents: 30000, category: 'Comida' }),
    tx({ amountCents: 50000, category: 'Transporte' }),
    tx({ amountCents: 99999, currency: 'USD' }), // otra moneda: no se mezcla
    tx({ amountCents: 70000, date: '2026-09-30' }), // fuera del período
  ];

  it('calcula balance, ingresos y gastos de una sola moneda', () => {
    const s = summarize(list, { from: '2026-10-01', to: '2026-10-31', currency: 'ARS' });
    expect(s.incomeCents).toBe(500000);
    expect(s.expenseCents).toBe(200000);
    expect(s.balanceCents).toBe(300000);
    expect(s.count).toBe(4);
  });

  it('agrupa gastos por categoría con su proporción', () => {
    const s = summarize(list, { from: '2026-10-01', to: '2026-10-31', currency: 'ARS' });
    expect(s.expensesByCategory).toEqual([
      { category: 'Comida', cents: 150000, share: 0.75 },
      { category: 'Transporte', cents: 50000, share: 0.25 },
    ]);
  });

  it('no suma monedas distintas', () => {
    const usd = summarize(list, { from: '2026-10-01', to: '2026-10-31', currency: 'USD' });
    expect(usd.expenseCents).toBe(99999);
    expect(usd.incomeCents).toBe(0);
  });

  it('filtra por categoría y tipo', () => {
    expect(filterTransactions(list, { from: '2026-01-01', to: '2026-12-31', currency: 'ARS', category: 'Comida' })).toHaveLength(3);
    expect(filterTransactions(list, { from: '2026-01-01', to: '2026-12-31', currency: 'ARS', type: 'income' })).toHaveLength(1);
  });

  it('arma la evolución mensual', () => {
    const evo = monthlyEvolution(list, 'ARS', '2026-10', 3);
    expect(evo.map((p) => p.month)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(evo[1].expenseCents).toBe(70000);
    expect(evo[2]).toMatchObject({ incomeCents: 500000, expenseCents: 200000 });
  });

  it('suma sin errores de coma flotante', () => {
    const many = Array.from({ length: 10 }, () => tx({ amountCents: 10 })); // 10 × 0,10
    expect(summarize(many, { from: '2026-10-01', to: '2026-10-31', currency: 'ARS' }).expenseCents).toBe(100);
  });

  it('formatea importes en es-AR', () => {
    expect(formatMoney(150050, 'ARS').replace(/\s/g, ' ')).toMatch(/1\.500,50/);
  });

  it('exporta CSV con escapado', () => {
    const csv = transactionsToCSV([tx({ description: 'Café, "doble"', amountCents: 2550 })]);
    expect(csv.split('\n')[1]).toBe('2026-10-10,gasto,25.50,ARS,Comida,"Café, ""doble""",');
  });
});
