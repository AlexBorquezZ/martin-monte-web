import { useState } from 'react';
import { useApp, useQuery } from '../../app/AppContext';
import { Icon } from '../../components/Icon';
import { ConfirmDialog, EmptyState, Modal, PageHeader, Section, TextArea } from '../../components/ui';
import { CONNECTION_CATEGORIES, CONNECTION_PROMPTS, type ConnectionPrompt } from '../../data/connection';
import { diffDays, formatShortDate, addDays } from '../../lib/date';
import { addConnectionLog, connectionsBetween, deleteConnectionLog } from '../../storage/repo';
import type { ConnectionLog } from '../../domain/types';

/** Tres propuestas distintas por día, rotando de forma estable. */
function dailyPrompts(date: string, shift: number): ConnectionPrompt[] {
  const n = CONNECTION_PROMPTS.length;
  const base = (diffDays('2024-01-01', date) * 3 + shift * 3) % n;
  return [0, 1, 2].map((i) => CONNECTION_PROMPTS[(base + i * 7) % n]);
}

export function ConnectionScreen() {
  const { today, toast } = useApp();
  const [shift, setShift] = useState(0);
  const [doing, setDoing] = useState<ConnectionPrompt | null>(null);
  const [toDelete, setToDelete] = useState<ConnectionLog | null>(null);
  const { data: logs } = useQuery(() => connectionsBetween(addDays(today, -60), today), [today]);
  const prompts = dailyPrompts(today, shift);

  return (
    <>
      <PageHeader
        title="Relaciones y curiosidad"
        subtitle="Propuestas pequeñas y voluntarias. No hace falta hacerlas todos los días."
        back
      />
      <ul className="list-plain">
        {prompts.map((p) => (
          <li key={p.id} className="card">
            <span className="badge">{CONNECTION_CATEGORIES[p.category]}</span>
            <p style={{ margin: '8px 0 10px' }}>{p.text}</p>
            <button type="button" className="btn btn--soft btn--sm" onClick={() => setDoing(p)}>
              Lo hice
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn--ghost btn--block" onClick={() => setShift((s) => s + 1)}>
        <Icon name="history" /> Ver otras propuestas
      </button>
      <button type="button" className="btn btn--block" style={{ marginTop: 8 }} onClick={() => setDoing({ id: 'propio', category: 'compartir', text: '' })}>
        <Icon name="plus" /> Registrar algo propio
      </button>

      <Section title="Momentos que registraste">
        {!logs || logs.length === 0 ? (
          <EmptyState title="Todavía nada por acá">
            <p className="small">Lo importante es la calidad del encuentro, no la cantidad.</p>
          </EmptyState>
        ) : (
          <ul className="card list-plain">
            {logs.map((l) => (
              <li key={l.id} className="tx">
                <span className="grow small">
                  <strong>{formatShortDate(l.date)}</strong> · {l.text}
                  {l.note && <span className="muted" style={{ display: 'block' }}>{l.note}</span>}
                </span>
                <button type="button" className="icon-btn" aria-label="Eliminar registro" onClick={() => setToDelete(l)}>
                  <Icon name="trash" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {doing && (
        <LogModal
          prompt={doing}
          onClose={() => setDoing(null)}
          onSave={async (text, note) => {
            await addConnectionLog({ date: today, promptId: doing.id, text, note });
            setDoing(null);
            toast('Qué lindo. Quedó registrado.');
          }}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          title="¿Eliminar este registro?"
          message="Se borrará este momento de tu historial."
          confirmLabel="Eliminar"
          danger
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteConnectionLog(toDelete.id);
            setToDelete(null);
          }}
        />
      )}
    </>
  );
}

function LogModal({
  prompt,
  onClose,
  onSave,
}: {
  prompt: ConnectionPrompt;
  onClose: () => void;
  onSave: (text: string, note: string) => Promise<void>;
}) {
  const [text, setText] = useState(prompt.text);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  return (
    <Modal title="Registrar" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) {
            setError('Contá brevemente qué hiciste.');
            return;
          }
          await onSave(text.trim().slice(0, 300), note.trim().slice(0, 1000));
        }}
      >
        <TextArea label="¿Qué hiciste?" value={text} onChange={setText} rows={2} maxLength={300} />
        {error && <p className="field__error" role="alert">{error}</p>}
        <TextArea label="¿Cómo te sentiste? (opcional)" value={note} onChange={setNote} rows={2} maxLength={1000} />
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
