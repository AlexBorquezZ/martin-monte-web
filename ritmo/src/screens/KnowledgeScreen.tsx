import { useEffect, useState } from 'react';
import { useApp, useQuery } from '../app/AppContext';
import { href } from '../app/router';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/ui';
import { KNOWLEDGE_CARDS, KNOWLEDGE_CATEGORIES, type KnowledgeCategory } from '../data/knowledge';
import { pickByDay } from '../domain/day';
import { nowIso } from '../lib/date';
import { listCardStates, updateCardState } from '../storage/repo';

const CAT_LABEL = Object.fromEntries(KNOWLEDGE_CATEGORIES.map((c) => [c.id, c.label])) as Record<KnowledgeCategory, string>;

export function KnowledgeScreen() {
  const { today } = useApp();
  const [cat, setCat] = useState<KnowledgeCategory | 'todas' | 'favoritas'>('todas');
  const { data: states } = useQuery(listCardStates, []);
  const byId = new Map((states ?? []).map((s) => [s.cardId, s]));
  const daily = pickByDay(KNOWLEDGE_CARDS, today, 3);
  const cards = KNOWLEDGE_CARDS.filter((c) =>
    cat === 'todas' ? true : cat === 'favoritas' ? byId.get(c.id)?.favorite : c.category === cat,
  );
  const read = (states ?? []).filter((s) => s.readAt).length;

  return (
    <>
      <PageHeader title="Cultura y conocimiento" subtitle={`${KNOWLEDGE_CARDS.length} fichas breves para leer sin conexión. Leíste ${read}.`} back />
      <a className="card card--soft card-link" href={href(`/cultura/${daily.id}`)}>
        <span className="grow">
          <span className="tiny muted">Ficha del día · {CAT_LABEL[daily.category]}</span>
          <br />
          <strong>{daily.title}</strong>
        </span>
        <Icon name="chevron" />
      </a>
      <div className="chips" role="group" aria-label="Filtrar por categoría" style={{ margin: '8px 0 14px' }}>
        {[{ id: 'todas', label: 'Todas' }, ...KNOWLEDGE_CATEGORIES, { id: 'favoritas', label: '★ Guardadas' }].map((c) => (
          <label key={c.id} className="chip">
            <input type="radio" name="cat" checked={cat === c.id} onChange={() => setCat(c.id as typeof cat)} />
            <span>{c.label}</span>
          </label>
        ))}
      </div>
      {cards.length === 0 ? (
        <p className="muted small">Todavía no guardaste fichas.</p>
      ) : (
        <ul className="list-plain">
          {cards.map((c) => (
            <li key={c.id}>
              <a className="card card-link" href={href(`/cultura/${c.id}`)}>
                <span className="grow">
                  <span className="tiny muted">{CAT_LABEL[c.category]}</span>
                  <br />
                  <strong>{c.title}</strong>
                </span>
                {byId.get(c.id)?.readAt && <span className="badge">leída</span>}
                <Icon name="chevron" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function KnowledgeCardScreen({ id }: { id: string }) {
  const card = KNOWLEDGE_CARDS.find((c) => c.id === id);
  const { data: states } = useQuery(listCardStates, []);
  const state = states?.find((s) => s.cardId === id);

  useEffect(() => {
    if (card && states && !state?.readAt) void updateCardState(card.id, { readAt: nowIso() });
  }, [card, states, state?.readAt]);

  if (!card) return <PageHeader title="No encontramos esa ficha" back="/cultura" />;
  const idx = KNOWLEDGE_CARDS.indexOf(card);
  const next = KNOWLEDGE_CARDS[(idx + 1) % KNOWLEDGE_CARDS.length];

  return (
    <>
      <PageHeader title={card.title} subtitle={CAT_LABEL[card.category]} back="/cultura" />
      <article className="card prose">
        <p>{card.body}</p>
        <h3>En la vida cotidiana</h3>
        <p>{card.example}</p>
        <h3>Para pensar</h3>
        <p>{card.question}</p>
        <h3>Para profundizar (opcional)</h3>
        <p className="muted">{card.deeper}</p>
      </article>
      <div className="row row--wrap">
        <button
          type="button"
          className="btn btn--soft"
          aria-pressed={!!state?.favorite}
          onClick={() => void updateCardState(card.id, { favorite: !state?.favorite })}
        >
          <Icon name="star" /> {state?.favorite ? 'Guardada' : 'Guardar'}
        </button>
        <a className="btn" href={href(`/cultura/${next.id}`)}>
          Siguiente ficha <Icon name="chevron" />
        </a>
      </div>
    </>
  );
}
