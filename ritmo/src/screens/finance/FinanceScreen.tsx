import { useState } from 'react';
import { useApp, useQuery } from '../../app/AppContext';
import { Icon } from '../../components/Icon';
import { TransactionForm } from '../../components/TransactionForm';
import { ConfirmDialog, EmptyState, Modal, PageHeader, Section, Select, TextInput } from '../../components/ui';
import { CURRENCIES } from '../../domain/constants';
import {
  centsToInput,
  filterTransactions,
  formatMoney,
  monthlyEvolution,
  parseAmount,
  periodBounds,
  summarize,
  transactionsToCSV,
} from '../../domain/finance';
import type { Currency, SavingsGoal, Transaction } from '../../domain/types';
import { downloadFile } from '../../lib/download';
import { formatMonth, formatMonthShort, formatShortDate, monthBounds, monthKey } from '../../lib/date';
import { deleteSavingsGoal, deleteTransaction, listSavingsGoals, listTransactions, saveSavingsGoal } from '../../storage/repo';

type Tab = 'movimientos' | 'resumen' | 'ahorro';
type Period = 'month' | 'prev-month' | 'year' | 'all' | 'custom';

export function FinanceScreen() {
  const { settings, today } = useApp();
  const [tab, setTab] = useState<Tab>('movimientos');
  const [period, setPeriod] = useState<Period>('month');
  const [customMonth, setCustomMonth] = useState(monthKey(today));
  const [currency, setCurrency] = useState<Currency>(settings.defaultCurrency);
  const [category, setCategory] = useState('');
  const { data } = useQuery(async () => {
    const [txs, goals] = await Promise.all([listTransactions(), listSavingsGoals()]);
    return { txs, goals };
  }, []);

  if (!data) return <p className="muted">Cargando…</p>;
  const bounds = period === 'custom' ? monthBounds(customMonth) : periodBounds(period, today);
  const filter = { ...bounds, currency, category: category || undefined };
  const allCats = [...new Set([...settings.expenseCategories, ...settings.incomeCategories, ...data.txs.map((t) => t.category)])];

  return (
    <>
      <PageHeader title="Finanzas" subtitle="Registro manual y privado. Funciona sin conexión." />
      <div className="tabs" role="tablist" aria-label="Secciones de finanzas">
        {(
          [
            ['movimientos', 'Movimientos'],
            ['resumen', 'Resumen'],
            ['ahorro', 'Ahorro'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab !== 'ahorro' && (
        <div className="card card--flat">
          <div className="grid-2">
            <Select
              label="Período"
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'month', label: 'Este mes' },
                { value: 'prev-month', label: 'Mes anterior' },
                { value: 'year', label: 'Este año' },
                { value: 'all', label: 'Todo' },
                { value: 'custom', label: 'Elegir mes' },
              ]}
            />
            <Select label="Moneda" value={currency} onChange={setCurrency} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </div>
          {period === 'custom' && (
            <TextInput label="Mes" type="month" value={customMonth} onChange={(v) => v && setCustomMonth(v)} />
          )}
          {tab === 'movimientos' && (
            <Select
              label="Categoría"
              value={category}
              onChange={setCategory}
              options={[{ value: '', label: 'Todas' }, ...allCats.map((c) => ({ value: c, label: c }))]}
            />
          )}
          <p className="tiny muted" style={{ margin: 0 }}>
            Cada moneda se muestra por separado: sin conexión no hay una cotización confiable para convertir.
          </p>
        </div>
      )}

      {tab === 'movimientos' && <Movements txs={filterTransactions(data.txs, filter)} all={data.txs} />}
      {tab === 'resumen' && <SummaryView txs={data.txs} filter={filter} currency={currency} today={today} />}
      {tab === 'ahorro' && <Savings goals={data.goals} />}
    </>
  );
}

function Movements({ txs, all }: { txs: Transaction[]; all: Transaction[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  return (
    <>
      <button type="button" className="btn btn--primary btn--block" onClick={() => setAdding(true)}>
        <Icon name="plus" /> Registrar gasto o ingreso
      </button>
      <Section title={`${txs.length} ${txs.length === 1 ? 'movimiento' : 'movimientos'}`}>
        {txs.length === 0 ? (
          <EmptyState title="Sin movimientos en este período">
            <p className="small">Anotar aunque sea el gasto más grande del día ya da claridad.</p>
          </EmptyState>
        ) : (
          <ul className="card list-plain">
            {txs.map((t) => (
              <li key={t.id} className="tx">
                <span className="grow">
                  <span style={{ fontWeight: 600 }}>{t.description || t.category}</span>
                  <br />
                  <span className="small muted">
                    {formatShortDate(t.date)} · {t.category}
                  </span>
                </span>
                <span className={`tabular ${t.type === 'income' ? 'money-in' : 'money-out'}`} style={{ fontWeight: 650 }}>
                  {t.type === 'income' ? '+' : '−'}
                  {formatMoney(t.amountCents, t.currency)}
                </span>
                <button type="button" className="icon-btn" aria-label={`Editar ${t.description || t.category}`} onClick={() => setEditing(t)}>
                  <Icon name="edit" size={18} />
                </button>
                <button type="button" className="icon-btn" aria-label={`Eliminar ${t.description || t.category}`} onClick={() => setDeleting(t)}>
                  <Icon name="trash" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Exportar">
        <div className="row row--wrap">
          <button
            type="button"
            className="btn btn--sm"
            disabled={!all.length}
            onClick={() => downloadFile('ritmo-finanzas.csv', '﻿' + transactionsToCSV(all), 'text/csv;charset=utf-8')}
          >
            <Icon name="download" size={18} /> CSV (planilla)
          </button>
          <button
            type="button"
            className="btn btn--sm"
            disabled={!all.length}
            onClick={() =>
              downloadFile(
                'ritmo-finanzas.json',
                JSON.stringify({ app: 'ritmo', tipo: 'finanzas', exportedAt: new Date().toISOString(), transactions: all }, null, 2),
                'application/json',
              )
            }
          >
            <Icon name="download" size={18} /> JSON
          </button>
        </div>
        <p className="tiny muted">Para una copia completa de todos tus datos, usá Ajustes → Copia de seguridad.</p>
      </Section>

      {(adding || editing) && (
        <Modal title={editing ? 'Editar movimiento' : 'Nuevo movimiento'} onClose={() => (setAdding(false), setEditing(null))}>
          <TransactionForm initial={editing ?? undefined} onDone={() => (setAdding(false), setEditing(null))} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="¿Eliminar este movimiento?"
          message={`${deleting.type === 'income' ? 'Ingreso' : 'Gasto'} de ${formatMoney(deleting.amountCents, deleting.currency)} del ${formatShortDate(deleting.date)}.`}
          confirmLabel="Eliminar"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteTransaction(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}

function SummaryView({
  txs,
  filter,
  currency,
  today,
}: {
  txs: Transaction[];
  filter: { from: string; to: string; currency: Currency };
  currency: Currency;
  today: string;
}) {
  const s = summarize(txs, filter);
  const evo = monthlyEvolution(txs, currency, monthKey(today), 6);
  const max = Math.max(1, ...evo.map((p) => Math.max(p.incomeCents, p.expenseCents)));
  return (
    <>
      <div className="card">
        <div className="small muted">Balance del período</div>
        <div className={`balance ${s.balanceCents >= 0 ? 'money-in' : 'money-out'}`} data-testid="balance">
          {formatMoney(s.balanceCents, currency)}
        </div>
        <div className="grid-2" style={{ marginTop: 10 }}>
          <div>
            <div className="small muted">Ingresos</div>
            <div className="tabular money-in" style={{ fontWeight: 650 }} data-testid="ingresos">
              {formatMoney(s.incomeCents, currency)}
            </div>
          </div>
          <div>
            <div className="small muted">Gastos</div>
            <div className="tabular money-out" style={{ fontWeight: 650 }} data-testid="gastos">
              {formatMoney(s.expenseCents, currency)}
            </div>
          </div>
        </div>
      </div>

      <Section title="Gastos por categoría">
        {s.expensesByCategory.length === 0 ? (
          <p className="small muted">No hay gastos en este período.</p>
        ) : (
          <ul className="card list-plain stack">
            {s.expensesByCategory.map((c) => (
              <li key={c.category}>
                <div className="row row--between small">
                  <span>{c.category}</span>
                  <span className="tabular">
                    {formatMoney(c.cents, currency)} · {Math.round(c.share * 100)} %
                  </span>
                </div>
                <div className="bar bar--expense" aria-hidden="true">
                  <span style={{ width: `${Math.max(2, c.share * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Evolución mensual">
        <div className="card">
          <div className="chart-months" role="img" aria-label={`Ingresos y gastos de los últimos 6 meses en ${currency}`}>
            {evo.map((p) => (
              <div key={p.month} className="chart-months__col">
                <div className="chart-months__bars">
                  <span style={{ height: `${(p.incomeCents / max) * 100}%`, background: 'var(--accent)' }} />
                  <span style={{ height: `${(p.expenseCents / max) * 100}%`, background: 'var(--area-cuerpo)' }} />
                </div>
                <span className="tiny muted">{formatMonthShort(p.month)}</span>
              </div>
            ))}
          </div>
          <div className="legend" style={{ marginTop: 10 }}>
            <span>
              <i style={{ background: 'var(--accent)' }} />
              Ingresos
            </span>
            <span>
              <i style={{ background: 'var(--area-cuerpo)' }} />
              Gastos
            </span>
          </div>
          <table className="sr-only">
            <caption>Evolución mensual en {currency}</caption>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Ingresos</th>
                <th>Gastos</th>
              </tr>
            </thead>
            <tbody>
              {evo.map((p) => (
                <tr key={p.month}>
                  <td>{formatMonth(p.month)}</td>
                  <td>{formatMoney(p.incomeCents, currency)}</td>
                  <td>{formatMoney(p.expenseCents, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

function Savings({ goals }: { goals: SavingsGoal[] }) {
  const [editing, setEditing] = useState<SavingsGoal | 'new' | null>(null);
  const [moving, setMoving] = useState<SavingsGoal | null>(null);
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null);
  return (
    <>
      <button type="button" className="btn btn--primary btn--block" onClick={() => setEditing('new')}>
        <Icon name="plus" /> Nuevo objetivo de ahorro
      </button>
      <Section title="Objetivos">
        {goals.length === 0 ? (
          <EmptyState title="Sin objetivos todavía">
            <p className="small">Por ejemplo: un fondo para imprevistos, un viaje o un curso.</p>
          </EmptyState>
        ) : (
          <ul className="list-plain">
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.savedCents / g.targetCents) * 100));
              return (
                <li key={g.id} className="card">
                  <div className="row">
                    <strong className="grow">{g.name}</strong>
                    <button type="button" className="icon-btn" aria-label={`Editar ${g.name}`} onClick={() => setEditing(g)}>
                      <Icon name="edit" size={18} />
                    </button>
                    <button type="button" className="icon-btn" aria-label={`Eliminar ${g.name}`} onClick={() => setDeleting(g)}>
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                  <div className="small tabular">
                    {formatMoney(g.savedCents, g.currency)} de {formatMoney(g.targetCents, g.currency)} · {pct} %
                  </div>
                  <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Progreso de ${g.name}`} style={{ margin: '8px 0' }}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  {g.deadline && <div className="tiny muted">Fecha objetivo: {formatShortDate(g.deadline)}</div>}
                  <button type="button" className="btn btn--soft btn--sm" style={{ marginTop: 8 }} onClick={() => setMoving(g)}>
                    Sumar o restar
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
      {editing && <GoalModal goal={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {moving && <ContributionModal goal={moving} onClose={() => setMoving(null)} />}
      {deleting && (
        <ConfirmDialog
          title="¿Eliminar este objetivo?"
          message={`Se borrará «${deleting.name}». Tus movimientos no se modifican.`}
          confirmLabel="Eliminar"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteSavingsGoal(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}

function GoalModal({ goal, onClose }: { goal?: SavingsGoal; onClose: () => void }) {
  const { settings, toast } = useApp();
  const [name, setName] = useState(goal?.name ?? '');
  const [target, setTarget] = useState(goal ? centsToInput(goal.targetCents) : '');
  const [currency, setCurrency] = useState<Currency>(goal?.currency ?? settings.defaultCurrency);
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');
  const [errors, setErrors] = useState<{ name?: string; target?: string }>({});
  return (
    <Modal title={goal ? 'Editar objetivo' : 'Nuevo objetivo de ahorro'} onClose={onClose}>
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const cents = parseAmount(target);
          const errs: typeof errors = {};
          if (!name.trim()) errs.name = 'Poné un nombre.';
          if (cents === null) errs.target = 'Escribí un monto mayor a cero.';
          setErrors(errs);
          if (errs.name || cents === null) return;
          await saveSavingsGoal({
            id: goal?.id,
            name: name.trim().slice(0, 80),
            targetCents: cents,
            savedCents: goal?.savedCents ?? 0,
            currency,
            deadline: deadline || undefined,
          });
          toast('Objetivo guardado.');
          onClose();
        }}
      >
        <TextInput label="Nombre" value={name} onChange={setName} error={errors.name} maxLength={80} placeholder="Ej.: fondo para imprevistos" />
        <div className="grid-2">
          <TextInput label="Meta" inputMode="decimal" value={target} onChange={setTarget} error={errors.target} />
          <Select label="Moneda" value={currency} onChange={setCurrency} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
        </div>
        <TextInput label="Fecha objetivo (opcional)" type="date" value={deadline} onChange={setDeadline} />
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ContributionModal({ goal, onClose }: { goal: SavingsGoal; onClose: () => void }) {
  const { toast } = useApp();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const apply = async (sign: 1 | -1) => {
    const cents = parseAmount(amount);
    if (cents === null) {
      setError('Escribí un monto mayor a cero.');
      return;
    }
    await saveSavingsGoal({ ...goal, savedCents: Math.max(0, goal.savedCents + sign * cents) });
    toast(sign > 0 ? 'Ahorro sumado.' : 'Monto restado.');
    onClose();
  };
  return (
    <Modal title={goal.name} onClose={onClose}>
      <p className="small muted">Llevás {formatMoney(goal.savedCents, goal.currency)}.</p>
      <TextInput label={`Monto (${goal.currency})`} inputMode="decimal" value={amount} onChange={setAmount} error={error} />
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--ghost" onClick={() => void apply(-1)}>
          Restar
        </button>
        <button type="button" className="btn btn--primary" onClick={() => void apply(1)}>
          Sumar
        </button>
      </div>
    </Modal>
  );
}
