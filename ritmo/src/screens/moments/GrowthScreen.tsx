import { useState } from 'react';
import { useApp, useQuery } from '../../app/AppContext';
import { href } from '../../app/router';
import { Icon } from '../../components/Icon';
import {
  ChoiceChips,
  ConfirmDialog,
  EmptyState,
  Modal,
  NumberStepper,
  PageHeader,
  Section,
  Select,
  TextArea,
  TextInput,
} from '../../components/ui';
import { LEARNING_AREAS } from '../../domain/constants';
import type { LearningArea, LearningGoal, LearningSession } from '../../domain/types';
import { formatShortDate } from '../../lib/date';
import {
  addLearningSession,
  deleteLearningGoal,
  deleteLearningSession,
  listLearningGoals,
  saveLearningGoal,
  sessionsForGoal,
} from '../../storage/repo';

const AREA_TEXT = Object.fromEntries(LEARNING_AREAS.map((a) => [a.id, a.label])) as Record<LearningArea, string>;

export function GrowthScreen() {
  const { settings } = useApp();
  const { data: goals } = useQuery(listLearningGoals, []);
  const [editing, setEditing] = useState<LearningGoal | 'new' | null>(null);
  const [deleting, setDeleting] = useState<LearningGoal | null>(null);
  const { toast } = useApp();

  if (!goals) return <p className="muted">Cargando…</p>;
  const active = goals.filter((g) => g.status === 'active');
  const priority = active.find((g) => g.priority) ?? active[0];
  const others = goals.filter((g) => g.id !== priority?.id);

  return (
    <>
      <PageHeader
        title="Tarde · Futuro y crecimiento"
        subtitle={`Un objetivo prioritario, dividido en sesiones de ${settings.moments.tarde.durationMin} a 60 minutos.`}
        back
      />

      {!priority ? (
        <div className="card card--soft">
          <h3>Elegí un objetivo de aprendizaje</h3>
          <p className="small">
            Uno solo a la vez: inglés, ventas, IA y automatización, finanzas, lectura o un proyecto personal.
          </p>
          <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
            <Icon name="target" /> Definir objetivo
          </button>
        </div>
      ) : (
        <GoalPanel goal={priority} onEdit={() => setEditing(priority)} />
      )}

      <Section
        title="Otros objetivos"
        action={
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing('new')}>
            <Icon name="plus" size={18} /> Nuevo
          </button>
        }
      >
        {others.length === 0 ? (
          <p className="small muted">Por ahora, uno alcanza. Concentrarse también es avanzar.</p>
        ) : (
          <ul className="list-plain">
            {others.map((g) => (
              <li key={g.id} className="card row">
                <span className="grow">
                  <strong>{g.title}</strong>
                  <br />
                  <span className="small muted">
                    {AREA_TEXT[g.area]}
                    {g.status === 'archived' && ' · archivado'}
                  </span>
                </span>
                {g.status === 'active' && (
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={async () => {
                      await saveLearningGoal({ ...g, priority: true });
                      toast('Ahora es tu objetivo prioritario.');
                    }}
                  >
                    Priorizar
                  </button>
                )}
                <button type="button" className="icon-btn" aria-label={`Editar ${g.title}`} onClick={() => setEditing(g)}>
                  <Icon name="edit" size={18} />
                </button>
                <button type="button" className="icon-btn" aria-label={`Eliminar ${g.title}`} onClick={() => setDeleting(g)}>
                  <Icon name="trash" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {editing && (
        <GoalModal
          goal={editing === 'new' ? undefined : editing}
          isFirst={active.length === 0}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="¿Eliminar este objetivo?"
          message="También se borrarán sus sesiones registradas. Si solo querés pausarlo, podés archivarlo desde Editar."
          confirmLabel="Eliminar"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteLearningGoal(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}

function GoalPanel({ goal, onEdit }: { goal: LearningGoal; onEdit: () => void }) {
  const { data: sessions } = useQuery(() => sessionsForGoal(goal.id), [goal.id]);
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<LearningSession | null>(null);
  const total = sessions?.reduce((s, x) => s + x.minutes, 0) ?? 0;
  const lastNext = sessions?.[0]?.next;

  return (
    <>
      <div className="card">
        <div className="row">
          <span className="grow">
            <span className="badge badge--accent">Prioritario · {AREA_TEXT[goal.area]}</span>
            <h2 style={{ marginTop: 6 }}>{goal.title}</h2>
          </span>
          <button type="button" className="icon-btn" aria-label="Editar objetivo" onClick={onEdit}>
            <Icon name="edit" />
          </button>
        </div>
        {goal.why && <p className="small muted">Para qué: {goal.why}</p>}
        <p className="small">
          {sessions?.length ?? 0} sesiones · {total} minutos en total
        </p>
        {lastNext && (
          <p className="small">
            <strong>Próximo paso:</strong> {lastNext}
          </p>
        )}
        <div className="row row--wrap">
          <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
            Registrar sesión
          </button>
          <a className="btn" href={href(`/foco?objetivo=${goal.id}`)}>
            <Icon name="timer" /> Modo enfoque
          </a>
        </div>
      </div>

      <Section title="Sesiones">
        {!sessions || sessions.length === 0 ? (
          <EmptyState title="Sin sesiones todavía">
            <p className="small">Una sesión corta y concreta es un gran comienzo.</p>
          </EmptyState>
        ) : (
          <ul className="list-plain">
            {sessions.slice(0, 30).map((s) => (
              <li key={s.id} className="card small">
                <div className="row row--between">
                  <strong>
                    {formatShortDate(s.date)} · {s.minutes} min
                  </strong>
                  <button type="button" className="icon-btn" aria-label="Eliminar sesión" onClick={() => setToDelete(s)}>
                    <Icon name="trash" size={18} />
                  </button>
                </div>
                {s.intended && <div><span className="muted">Quería:</span> {s.intended}</div>}
                {s.did && <div><span className="muted">Hice:</span> {s.did}</div>}
                {s.learned && <div><span className="muted">Aprendí:</span> {s.learned}</div>}
                {s.next && <div><span className="muted">Próximo paso:</span> {s.next}</div>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {adding && <SessionModal goal={goal} suggestedIntent={lastNext ?? ''} onClose={() => setAdding(false)} />}
      {toDelete && (
        <ConfirmDialog
          title="¿Eliminar esta sesión?"
          message="Se borrará el registro de esta sesión."
          confirmLabel="Eliminar"
          danger
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteLearningSession(toDelete.id);
            setToDelete(null);
          }}
        />
      )}
    </>
  );
}

function GoalModal({ goal, isFirst, onClose }: { goal?: LearningGoal; isFirst: boolean; onClose: () => void }) {
  const { toast, settings } = useApp();
  const [title, setTitle] = useState(goal?.title ?? '');
  const [area, setArea] = useState<LearningArea>(goal?.area ?? 'ingles');
  const [why, setWhy] = useState(goal?.why ?? '');
  const [minutes, setMinutes] = useState(goal?.sessionMinutes ?? Math.max(25, settings.moments.tarde.durationMin));
  const [archived, setArchived] = useState(goal?.status === 'archived');
  const [error, setError] = useState('');
  return (
    <Modal title={goal ? 'Editar objetivo' : 'Nuevo objetivo'} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) {
            setError('Describí el objetivo en pocas palabras.');
            return;
          }
          await saveLearningGoal({
            id: goal?.id,
            title: title.trim().slice(0, 120),
            area,
            why: why.trim().slice(0, 300),
            sessionMinutes: minutes,
            status: archived ? 'archived' : 'active',
            priority: archived ? false : (goal?.priority ?? isFirst),
          });
          toast('Objetivo guardado.');
          onClose();
        }}
      >
        <TextInput label="Objetivo" value={title} onChange={setTitle} error={error} placeholder="Ej.: mantener una conversación simple en inglés" maxLength={120} />
        <ChoiceChips legend="Bloque" value={area} onChange={setArea} options={LEARNING_AREAS.map((a) => ({ value: a.id, label: a.label }))} />
        <TextInput label="¿Para qué? (opcional)" value={why} onChange={setWhy} maxLength={300} />
        <NumberStepper label="Duración de cada sesión" value={minutes} onChange={setMinutes} min={10} max={120} step={5} unit="min" />
        {goal && (
          <label className="switch">
            <span style={{ fontWeight: 600 }}>Archivado</span>
            <input type="checkbox" role="switch" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
          </label>
        )}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
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

function SessionModal({ goal, suggestedIntent, onClose }: { goal: LearningGoal; suggestedIntent: string; onClose: () => void }) {
  const { today, toast } = useApp();
  const { data: goals } = useQuery(listLearningGoals, []);
  const [goalId, setGoalId] = useState(goal.id);
  const [intended, setIntended] = useState(suggestedIntent);
  const [did, setDid] = useState('');
  const [learned, setLearned] = useState('');
  const [next, setNext] = useState('');
  const [minutes, setMinutes] = useState(goal.sessionMinutes);
  return (
    <Modal title="Registrar sesión" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await addLearningSession({
            goalId,
            date: today,
            intended: intended.trim(),
            did: did.trim(),
            learned: learned.trim(),
            next: next.trim(),
            minutes,
          });
          toast('Sesión registrada.');
          onClose();
        }}
      >
        {goals && goals.filter((g) => g.status === 'active').length > 1 && (
          <Select
            label="Objetivo"
            value={goalId}
            onChange={setGoalId}
            options={goals.filter((g) => g.status === 'active').map((g) => ({ value: g.id, label: g.title }))}
          />
        )}
        <TextArea label="¿Qué quería aprender?" value={intended} onChange={setIntended} rows={2} />
        <TextArea label="¿Qué hice?" value={did} onChange={setDid} rows={2} />
        <TextArea label="¿Qué aprendí?" value={learned} onChange={setLearned} rows={2} />
        <TextArea label="¿Cuál es el próximo paso?" value={next} onChange={setNext} rows={2} />
        <NumberStepper label="Minutos" value={minutes} onChange={setMinutes} min={1} max={300} step={5} />
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
