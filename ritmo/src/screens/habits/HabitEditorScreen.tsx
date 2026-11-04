import { useEffect, useState } from 'react';
import { useApp } from '../../app/AppContext';
import { navigate } from '../../app/router';
import {
  ChoiceChips,
  ConfirmDialog,
  MultiChips,
  NumberStepper,
  PageHeader,
  Switch,
  TextArea,
  TextInput,
} from '../../components/ui';
import { AREAS, MOMENTS } from '../../domain/constants';
import { validateHabitForm, type HabitFormErrors, type HabitFormValues } from '../../domain/habitForm';
import type { Habit } from '../../domain/types';
import { WEEKDAY_SHORT, addDays } from '../../lib/date';
import { createHabit, deleteHabit, getHabit, updateHabit } from '../../storage/repo';

function toForm(h: Habit | undefined, today: string): HabitFormValues {
  return {
    name: h?.name ?? '',
    description: h?.description ?? '',
    category: h?.category ?? 'mente',
    freqType: h?.frequency.type ?? 'daily',
    days: h?.frequency.type === 'weekdays' ? h.frequency.days : [1, 2, 3, 4, 5],
    times: h?.frequency.type === 'weekly' ? h.frequency.times : 3,
    moments: h?.moments ?? [],
    durationMin: h?.durationMin ?? 10,
    fullVersion: h?.fullVersion ?? '',
    minimalVersion: h?.minimalVersion ?? '',
    active: h?.active ?? true,
    kind: h?.kind ?? 'permanent',
    startDate: h?.startDate ?? today,
    endDate: h?.endDate ?? addDays(today, 30),
  };
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function HabitEditorScreen({ id }: { id?: string }) {
  const { today, toast } = useApp();
  const [form, setForm] = useState<HabitFormValues | null>(id ? null : toForm(undefined, today));
  const [missing, setMissing] = useState(false);
  const [errors, setErrors] = useState<HabitFormErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getHabit(id).then((h) => (h ? setForm(toForm(h, today)) : setMissing(true)));
  }, [id, today]);

  if (missing) return <PageHeader title="No encontramos ese hábito" back="/habitos" />;
  if (!form) return <p className="muted">Cargando…</p>;

  const set = <K extends keyof HabitFormValues>(k: K, v: HabitFormValues[K]) => setForm({ ...form, [k]: v });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { errors: errs, input } = validateHabitForm(form);
    setErrors(errs);
    if (!input) {
      toast('Revisá los campos marcados.');
      return;
    }
    setSaving(true);
    try {
      if (id) await updateHabit(id, input);
      else await createHabit(input);
      toast(id ? 'Cambios guardados.' : 'Hábito creado.');
      navigate('/habitos');
    } catch {
      toast('No se pudo guardar. Probá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title={id ? 'Editar hábito' : 'Nuevo hábito'} back="/habitos" />
      <form onSubmit={onSubmit} noValidate className="card">
        <TextInput label="Nombre" value={form.name} onChange={(v) => set('name', v)} error={errors.name} maxLength={80} required placeholder="Ej.: practicar inglés" />
        <TextArea label="Descripción (opcional)" value={form.description} onChange={(v) => set('description', v)} rows={2} maxLength={500} />
        <ChoiceChips
          legend="Área"
          value={form.category}
          onChange={(v) => set('category', v)}
          options={AREAS.map((a) => ({ value: a.id, label: a.label }))}
        />
        <TextInput
          label="Versión completa"
          value={form.fullVersion}
          onChange={(v) => set('fullVersion', v)}
          placeholder="Ej.: 30 minutos de práctica"
          maxLength={200}
        />
        <TextInput
          label="Versión mínima"
          value={form.minimalVersion}
          onChange={(v) => set('minimalVersion', v)}
          placeholder="Ej.: pronunciar tres frases"
          hint="Lo más pequeño que igual cuenta. Sirve para los días difíciles."
          maxLength={200}
        />
        <NumberStepper label="Duración estimada" value={form.durationMin} onChange={(v) => set('durationMin', v)} min={0} max={600} step={5} unit="min" />
        <ChoiceChips
          legend="Frecuencia"
          value={form.freqType}
          onChange={(v) => set('freqType', v)}
          options={[
            { value: 'daily', label: 'Todos los días' },
            { value: 'weekdays', label: 'Días fijos' },
            { value: 'weekly', label: 'Veces por semana' },
          ]}
        />
        {form.freqType === 'weekdays' && (
          <>
            <MultiChips
              legend="¿Qué días?"
              values={form.days.map(String)}
              onChange={(v) => set('days', v.map(Number))}
              options={DAY_ORDER.map((d) => ({ value: String(d), label: WEEKDAY_SHORT[d] }))}
            />
            {errors.days && <p className="field__error" role="alert">{errors.days}</p>}
          </>
        )}
        {form.freqType === 'weekly' && (
          <NumberStepper label="Veces por semana" value={form.times} onChange={(v) => set('times', v)} min={1} max={7} />
        )}
        <MultiChips
          legend="Momento del día (podés elegir más de uno)"
          values={form.moments}
          onChange={(v) => set('moments', v)}
          options={MOMENTS.map((m) => ({ value: m.id, label: m.label }))}
        />
        <ChoiceChips
          legend="Duración del hábito"
          value={form.kind}
          onChange={(v) => set('kind', v)}
          options={[
            { value: 'permanent', label: 'Permanente' },
            { value: 'temporary', label: 'Temporal' },
          ]}
        />
        <div className="grid-2">
          <TextInput label="Empieza" type="date" value={form.startDate} onChange={(v) => set('startDate', v)} error={errors.startDate} />
          {form.kind === 'temporary' && (
            <TextInput label="Termina" type="date" value={form.endDate} onChange={(v) => set('endDate', v)} error={errors.endDate} />
          )}
        </div>
        <Switch
          label="Activo"
          hint="Pausarlo lo saca de tus días sin borrar su historial."
          checked={form.active}
          onChange={(v) => set('active', v)}
        />
        <div className="stack" style={{ marginTop: 12 }}>
          <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
            {id ? 'Guardar cambios' : 'Crear hábito'}
          </button>
          {id && (
            <button type="button" className="btn btn--danger-ghost btn--block" onClick={() => setConfirmDelete(true)}>
              Eliminar hábito
            </button>
          )}
        </div>
      </form>
      {confirmDelete && id && (
        <ConfirmDialog
          title="¿Eliminar este hábito?"
          message="Se borrará el hábito y todo su historial. Si solo querés dejarlo de lado, mejor pausalo: así conservás el historial."
          confirmLabel="Eliminar"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteHabit(id);
            toast('Hábito eliminado.');
            navigate('/habitos');
          }}
        />
      )}
    </>
  );
}
