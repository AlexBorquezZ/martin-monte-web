import { useState } from 'react';
import { useApp, useQuery } from '../../app/AppContext';
import { href } from '../../app/router';
import { TransactionForm } from '../../components/TransactionForm';
import { PageHeader, Section, Switch, TextArea } from '../../components/ui';
import { formatMoney } from '../../domain/finance';
import type { DayEntry } from '../../domain/types';
import { nowIso } from '../../lib/date';
import { getDay, transactionsBetween, updateDay } from '../../storage/repo';

export function NightScreen() {
  const { today } = useApp();
  const { data, loaded } = useQuery(async () => {
    const [day, txs] = await Promise.all([getDay(today), transactionsBetween(today, today)]);
    return { day, txs };
  }, [today]);
  if (!loaded || !data) return <p className="muted">Cargando…</p>;
  return <NightForm key={today} today={today} day={data.day} txs={data.txs} />;
}

function NightForm({
  today,
  day,
  txs,
}: {
  today: string;
  day: DayEntry | undefined;
  txs: Awaited<ReturnType<typeof transactionsBetween>>;
}) {
  const { settings } = useApp();
  const n = day?.night;
  const [wentWell, setWentWell] = useState(n?.wentWell ?? '');
  const [learned, setLearned] = useState(n?.learned ?? '');
  const [improve, setImprove] = useState(n?.improve ?? '');
  const [grateful, setGrateful] = useState(n?.grateful ?? '');
  const [tomorrow, setTomorrow] = useState(n?.tomorrow ?? '');
  const [skipFinance, setSkipFinance] = useState(n?.financeSkipped ?? false);
  const [closed, setClosed] = useState(false);

  if (closed) {
    return (
      <div className="card card--soft fade-in" style={{ marginTop: 24, textAlign: 'center', padding: 28 }}>
        <h2>Día cerrado</h2>
        <p>Lo que hiciste hoy alcanza. Lo que quedó pendiente puede esperar a mañana.</p>
        <p className="muted small">Que descanses.</p>
        <a className="btn btn--primary" href={href('/')}>
          Volver a Hoy
        </a>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Noche · Cierre y calma"
        subtitle={`Unos ${settings.moments.noche.durationMin} minutos. Respondé solo lo que quieras.`}
        back
      />
      <form
        id="cierre-noche"
        className="card"
        onSubmit={async (e) => {
          e.preventDefault();
          await updateDay(today, {
            night: {
              wentWell: wentWell.trim(),
              learned: learned.trim(),
              improve: improve.trim(),
              grateful: grateful.trim(),
              tomorrow: tomorrow.trim(),
              financeSkipped: skipFinance,
              completedAt: nowIso(),
            },
          });
          setClosed(true);
        }}
      >
        <TextArea label="¿Qué salió bien hoy?" value={wentWell} onChange={setWentWell} rows={2} />
        <TextArea label="¿Qué aprendí?" value={learned} onChange={setLearned} rows={2} />
        <TextArea label="¿Qué puedo mejorar, sin castigarme?" value={improve} onChange={setImprove} rows={2} />
        <TextArea label="¿Qué agradezco?" value={grateful} onChange={setGrateful} rows={2} />
        <TextArea label="¿Qué es lo más importante de mañana?" value={tomorrow} onChange={setTomorrow} rows={2} />
      </form>

      <Section title="Dinero de hoy">
          <Switch
            label="Hoy no corresponde registrar"
            hint="Por ejemplo, si no hubo movimientos."
            checked={skipFinance}
            onChange={setSkipFinance}
          />
          {!skipFinance && (
            <div className="card card--flat" style={{ marginTop: 8 }}>
              {txs.length > 0 && (
                <ul className="list-plain small" style={{ marginBottom: 10 }}>
                  {txs.map((t) => (
                    <li key={t.id}>
                      {t.type === 'expense' ? '−' : '+'} {formatMoney(t.amountCents, t.currency)} · {t.category}
                      {t.description && ` · ${t.description}`}
                    </li>
                  ))}
                </ul>
              )}
              <TransactionForm compact />
            </div>
          )}
      </Section>

      <button type="submit" form="cierre-noche" className="btn btn--primary btn--block" style={{ marginTop: 12 }}>
        Cerrar el día
      </button>
    </>
  );
}
