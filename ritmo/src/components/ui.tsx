import { useEffect, useId, useRef, type ReactNode } from 'react';
import type { AreaId } from '../domain/types';
import { AREA_LABEL } from '../domain/constants';
import { Icon } from './Icon';
import { goBack } from '../app/router';

export function PageHeader({ title, subtitle, back }: { title: string; subtitle?: string; back?: string | true }) {
  return (
    <div className="hero" style={{ paddingTop: 4 }}>
      {back && (
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          style={{ marginLeft: -12, marginBottom: 4 }}
          onClick={() => goBack(typeof back === 'string' ? back : '/')}
        >
          <Icon name="back" size={18} /> Volver
        </button>
      )}
      <h1>{title}</h1>
      {subtitle && <p className="muted">{subtitle}</p>}
    </div>
  );
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="section">
      <div className="row row--between">
        <h2 className="section__title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AreaTag({ area }: { area: AreaId }) {
  return (
    <span className="area-tag">
      <span className="area-dot" style={{ background: `var(--area-${area})` }} />
      {AREA_LABEL[area]}
    </span>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children(id, describedBy)}
      {hint && (
        <span id={hintId} className="field__hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={errId} className="field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  hint,
  error,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <input
          id={id}
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      )}
    </Field>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  rows = 3,
  placeholder,
  maxLength = 2000,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id, describedBy) => (
        <textarea
          id={id}
          className="textarea"
          value={value}
          rows={rows}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id, describedBy) => (
        <select
          id={id}
          className="select"
          value={value}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

/** Grupo de opciones únicas con aspecto de chips (radios nativos: accesibles con teclado). */
export function ChoiceChips<T extends string>({
  legend,
  value,
  onChange,
  options,
  name,
  hideLegend,
}: {
  legend: string;
  value: T | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  name?: string;
  hideLegend?: boolean;
}) {
  const auto = useId();
  return (
    <fieldset>
      <legend className={hideLegend ? 'sr-only' : 'label'} style={{ marginBottom: 8 }}>
        {legend}
      </legend>
      <div className="chips">
        {options.map((o) => (
          <label key={o.value} className="chip">
            <input
              type="radio"
              name={name ?? auto}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function MultiChips<T extends string>({
  legend,
  values,
  onChange,
  options,
}: {
  legend: string;
  values: T[];
  onChange: (v: T[]) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="label" style={{ marginBottom: 8 }}>
        {legend}
      </legend>
      <div className="chips">
        {options.map((o) => (
          <label key={o.value} className="chip">
            <input
              type="checkbox"
              checked={values.includes(o.value)}
              onChange={(e) =>
                onChange(e.target.checked ? [...values, o.value] : values.filter((v) => v !== o.value))
              }
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Switch({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="switch">
      <span>
        <span style={{ fontWeight: 600 }}>{label}</span>
        {hint && <span className="field__hint" style={{ display: 'block' }}>{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('input, textarea, select, button');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab' && ref.current) {
        const items = ref.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!items.length) return;
        const a = items[0];
        const z = items[items.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, []);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="muted" style={{ marginBottom: 16 }}>
        {message}
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className={danger ? 'btn btn--danger' : 'btn btn--primary'} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export function NumberStepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  const id = useId();
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="stepper">
        <button type="button" className="icon-btn" aria-label={`Restar ${label}`} onClick={() => set(value - step)}>
          −
        </button>
        <input
          id={id}
          className="input tabular"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) set(n);
          }}
        />
        <button type="button" className="icon-btn" aria-label={`Sumar ${label}`} onClick={() => set(value + step)}>
          +
        </button>
        {unit && <span className="muted stepper__unit">{unit}</span>}
      </div>
    </div>
  );
}
