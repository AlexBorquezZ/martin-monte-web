import { useState } from 'react';
import { useApp, useQuery } from '../../app/AppContext';
import { navigate } from '../../app/router';
import { MultiChips, PageHeader, Section, TextArea, TextInput } from '../../components/ui';
import { AREAS, AREA_LABEL } from '../../domain/constants';
import { activityByDay } from '../../domain/stats';
import type { AreaId, WeeklyReview } from '../../domain/types';
import { addDays, formatShortDate, rangeKeys, weekStart } from '../../lib/date';
import { getWeeklyReview, listWeeklyReviews, saveWeeklyReview } from '../../storage/repo';
import { loadActivity } from '../../storage/queries';

export function WeeklyReviewScreen() {
  const { today } = useApp();
  const ws = weekStart(today);
  const { data, loaded } = useQuery(async () => {
    const [review, activity, history] = await Promise.all([getWeeklyReview(ws), loadActivity(ws, today), listWeeklyReviews()]);
    return { review, activity, history };
  }, [ws, today]);
  if (!loaded || !data) return <p className="muted">Cargando…</p>;
  const byDay = activityByDay(data.activity, ws, today);
  const touched = AREAS.filter((a) => rangeKeys(ws, today).some((d) => byDay.get(d)?.areas.has(a.id)));
  const untouched = AREAS.filter((a) => !touched.includes(a));
  return (
    <>
      <PageHeader title="Revisión semanal" subtitle={`Semana del ${formatShortDate(ws)} al ${formatShortDate(addDays(ws, 6))} · unos 5 minutos`} back="/progreso" />
      <div className="card card--soft small">
        {touched.length > 0 ? (
          <>Esta semana atendiste: {touched.map((a) => a.label).join(', ')}.</>
        ) : (
          <>Esta semana todavía no hay registros. Está bien: la revisión también sirve para elegir por dónde empezar.</>
        )}
        {untouched.length > 0 && touched.length > 0 && (
          <> Si querés, la próxima podés darle un rato a {untouched.map((a) => a.label.toLowerCase()).join(', ')}.</>
        )}
      </div>
      <ReviewForm key={ws + (data.review?.updatedAt ?? '')} weekStart={ws} initial={data.review} />
      {data.history.filter((r) => r.weekStart !== ws).length > 0 && (
        <Section title="Revisiones anteriores">
          {data.history
            .filter((r) => r.weekStart !== ws)
            .slice(0, 12)
            .map((r) => (
              <details key={r.id} className="card card--flat">
                <summary>Semana del {formatShortDate(r.weekStart)}</summary>
                <div className="small">
                  {r.wentWell && <p><strong>Salió bien:</strong> {r.wentWell}</p>}
                  {r.learned && <p><strong>Aprendí:</strong> {r.learned}</p>}
                  {r.adjust && <p><strong>Ajustar:</strong> {r.adjust}</p>}
                  {r.priorities.filter(Boolean).length > 0 && <p><strong>Prioridades:</strong> {r.priorities.filter(Boolean).join(' · ')}</p>}
                  {r.focusAreas.length > 0 && <p><strong>Áreas:</strong> {r.focusAreas.map((a) => AREA_LABEL[a]).join(', ')}</p>}
                </div>
              </details>
            ))}
        </Section>
      )}
    </>
  );
}

function ReviewForm({ weekStart: ws, initial }: { weekStart: string; initial?: WeeklyReview }) {
  const { toast } = useApp();
  const [wentWell, setWentWell] = useState(initial?.wentWell ?? '');
  const [learned, setLearned] = useState(initial?.learned ?? '');
  const [adjust, setAdjust] = useState(initial?.adjust ?? '');
  const [p, setP] = useState<string[]>(initial?.priorities.concat(['', '', '']).slice(0, 3) ?? ['', '', '']);
  const [areas, setAreas] = useState<AreaId[]>(initial?.focusAreas ?? []);
  return (
    <form
      className="card"
      onSubmit={async (e) => {
        e.preventDefault();
        await saveWeeklyReview({
          weekStart: ws,
          wentWell: wentWell.trim(),
          learned: learned.trim(),
          adjust: adjust.trim(),
          priorities: p.map((x) => x.trim()).filter(Boolean),
          focusAreas: areas,
        });
        toast('Revisión guardada. Buena semana.');
        navigate('/progreso');
      }}
    >
      <TextArea label="¿Qué salió bien esta semana?" value={wentWell} onChange={setWentWell} rows={2} />
      <TextArea label="¿Qué aprendí?" value={learned} onChange={setLearned} rows={2} />
      <TextArea label="¿Qué quiero ajustar, con amabilidad?" value={adjust} onChange={setAdjust} rows={2} />
      <fieldset>
        <legend className="label" style={{ marginBottom: 8 }}>
          Hasta tres prioridades para la próxima semana
        </legend>
        {p.map((v, i) => (
          <TextInput key={i} label={`Prioridad ${i + 1}`} value={v} onChange={(nv) => setP(p.map((x, j) => (j === i ? nv : x)))} maxLength={120} />
        ))}
      </fieldset>
      <MultiChips legend="Áreas a las que quiero dar más espacio" values={areas} onChange={setAreas} options={AREAS.map((a) => ({ value: a.id, label: a.label }))} />
      <button type="submit" className="btn btn--primary btn--block">
        Guardar revisión
      </button>
    </form>
  );
}
