import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../app/AppContext';
import { href } from '../../app/router';
import { Icon } from '../../components/Icon';
import { ChoiceChips, ConfirmDialog, Modal, NumberStepper, PageHeader, Section, Select, Switch, TextInput } from '../../components/ui';
import { CURRENCIES, MOMENTS } from '../../domain/constants';
import type { MomentId, Settings } from '../../domain/types';
import { downloadFile } from '../../lib/download';
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
  showLocalNotification,
} from '../../pwa/notifications';
import { backupFileName, createBackup, parseBackupText, restoreBackup, wipeAllData, type Backup } from '../../storage/backup';
import { setMeta } from '../../storage/repo';

export function SettingsScreen() {
  const { settings, updateSettings, toast } = useApp();
  const save = async (patch: Partial<Settings>) => {
    try {
      await updateSettings(patch);
    } catch {
      toast('No se pudo guardar la configuración.');
    }
  };

  return (
    <>
      <PageHeader title="Ajustes" back />
      <Section title="General">
        <div className="card">
          <BlurInput label="Nombre visible de la app" value={settings.appName} maxLength={30} onCommit={(v) => save({ appName: v || 'RITMO' })} />
          <BlurInput label="¿Cómo te llamo? (opcional)" value={settings.userName} maxLength={40} onCommit={(v) => save({ userName: v })} />
          <ChoiceChips
            legend="Tema"
            value={settings.theme}
            onChange={(theme) => save({ theme })}
            options={[
              { value: 'auto', label: 'Automático' },
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
            ]}
          />
        </div>
      </Section>

      <Section title="Momentos del día">
        <div className="card">
          <p className="small muted">Los horarios definen qué bloque te muestro en Hoy. Usan la hora local de tu teléfono.</p>
          {MOMENTS.map((m) => (
            <MomentRow key={m.id} id={m.id} label={`${m.label} · ${m.subtitle}`} settings={settings} onChange={save} />
          ))}
        </div>
      </Section>

      <RemindersSection settings={settings} onChange={save} />

      <Section title="Duraciones">
        <div className="card">
          <div className="fit-grid">
            <NumberStepper label="Enfoque" value={settings.focusMinutes} onChange={(v) => save({ focusMinutes: v })} min={1} max={180} step={5} unit="min" />
            <NumberStepper label="Descanso" value={settings.breakMinutes} onChange={(v) => save({ breakMinutes: v })} min={1} max={60} unit="min" />
          </div>
          <NumberStepper label="Pausa consciente" value={settings.pauseMinutes} onChange={(v) => save({ pauseMinutes: v })} min={1} max={5} unit="min" />
          <div className="fit-grid">
            <NumberStepper label="Inhalar" value={settings.breathing.inhale} onChange={(v) => save({ breathing: { ...settings.breathing, inhale: v } })} min={2} max={10} unit="s" />
            <NumberStepper label="Sostener" value={settings.breathing.hold} onChange={(v) => save({ breathing: { ...settings.breathing, hold: v } })} min={0} max={10} unit="s" />
            <NumberStepper label="Exhalar" value={settings.breathing.exhale} onChange={(v) => save({ breathing: { ...settings.breathing, exhale: v } })} min={2} max={12} unit="s" />
          </div>
        </div>
      </Section>

      <Section title="Finanzas">
        <div className="card">
          <Select label="Moneda predeterminada" value={settings.defaultCurrency} onChange={(defaultCurrency) => save({ defaultCurrency })} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
          <CategoryEditor title="Categorías de gastos" list={settings.expenseCategories} onChange={(expenseCategories) => save({ expenseCategories })} />
          <CategoryEditor title="Categorías de ingresos" list={settings.incomeCategories} onChange={(incomeCategories) => save({ incomeCategories })} />
        </div>
      </Section>

      <Section title="Hábitos y categorías">
        <div className="card">
          <p className="small muted" style={{ marginTop: 0 }}>
            Los hábitos se organizan en cinco áreas fijas: Cuerpo, Mente, Finanzas, Futuro y Relaciones.
          </p>
          <a className="btn btn--sm" href={href('/habitos')}>
            Gestionar hábitos
          </a>
        </div>
      </Section>

      <BackupSection />

      <Section title="Acerca de">
        <div className="card small">
          <p>
            Versión <strong>{__APP_VERSION__}</strong>
          </p>
          <StorageInfo />
          <a href={href('/privacidad')}>Privacidad y datos</a>
        </div>
      </Section>
    </>
  );
}

function BlurInput({ label, value, onCommit, maxLength }: { label: string; value: string; onCommit: (v: string) => void; maxLength: number }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <TextInput
      label={label}
      value={v}
      maxLength={maxLength}
      onChange={setV}
      onBlur={() => v.trim() !== value && onCommit(v.trim())}
    />
  );
}

function MomentRow({ id, label, settings, onChange }: { id: MomentId; label: string; settings: Settings; onChange: (p: Partial<Settings>) => void }) {
  const m = settings.moments[id];
  const set = (patch: Partial<typeof m>) => onChange({ moments: { ...settings.moments, [id]: { ...m, ...patch } } });
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
      <Switch label={label} checked={m.enabled} onChange={(enabled) => set({ enabled })} />
      {m.enabled && (
        <div className="fit-grid">
          <TextInput label="Empieza" type="time" value={m.start} onChange={(start) => start && set({ start })} />
          <NumberStepper label="Duración" value={m.durationMin} onChange={(durationMin) => set({ durationMin })} min={1} max={240} step={5} unit="min" />
        </div>
      )}
    </div>
  );
}

function RemindersSection({ settings, onChange }: { settings: Settings; onChange: (p: Partial<Settings>) => Promise<void> }) {
  const { toast } = useApp();
  const [perm, setPerm] = useState(notificationPermission());
  const supported = notificationsSupported();
  return (
    <Section title="Recordatorios">
      <div className="card">
        {!supported ? (
          <p className="small">Este navegador no permite notificaciones locales. La app funciona igual sin ellas.</p>
        ) : (
          <>
            <Switch
              label="Activar recordatorios"
              hint="Te pedimos permiso solo al activarlos."
              checked={settings.reminders.enabled && perm === 'granted'}
              onChange={async (on) => {
                if (!on) {
                  await onChange({ reminders: { ...settings.reminders, enabled: false } });
                  return;
                }
                const p = await requestNotificationPermission();
                setPerm(p);
                if (p === 'granted') {
                  await onChange({ reminders: { ...settings.reminders, enabled: true } });
                  toast('Recordatorios activados.');
                } else {
                  toast('Sin permiso de notificaciones. Podés habilitarlo en los ajustes del navegador.');
                }
              }}
            />
            {perm === 'denied' && (
              <p className="small field__error">
                Las notificaciones están bloqueadas para este sitio. Para usarlas, habilitalas desde los ajustes del
                navegador o de Android.
              </p>
            )}
            {settings.reminders.enabled && perm === 'granted' && (
              <>
                {MOMENTS.map((m) => (
                  <Switch
                    key={m.id}
                    label={`${m.label} (${settings.moments[m.id].start})`}
                    checked={settings.reminders.moments[m.id]}
                    onChange={(v) => onChange({ reminders: { ...settings.reminders, moments: { ...settings.reminders.moments, [m.id]: v } } })}
                  />
                ))}
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={async () => {
                    const ok = await showLocalNotification(settings.appName, 'Así se ven los recordatorios.', 'ritmo-test');
                    if (!ok) toast('No se pudo mostrar la notificación.');
                  }}
                >
                  <Icon name="bell" size={18} /> Probar notificación
                </button>
              </>
            )}
          </>
        )}
        <details style={{ marginTop: 8 }}>
          <summary>Limitaciones (importante)</summary>
          <div className="small muted">
            <p>
              RITMO no usa servidores, así que los recordatorios se generan en tu teléfono mientras la app está abierta o
              en segundo plano reciente. Si cerrás la app o Android la suspende para ahorrar batería, el aviso puede
              llegar tarde o no llegar.
            </p>
            <p>
              Para mejorar la fiabilidad: instalá la app en la pantalla de inicio, excluila de la optimización de batería
              y, si un horario es importante, usá también una alarma del sistema.
            </p>
          </div>
        </details>
      </div>
    </Section>
  );
}

function CategoryEditor({ title, list, onChange }: { title: string; list: string[]; onChange: (l: string[]) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  return (
    <div style={{ marginTop: 10 }}>
      <div className="label">{title}</div>
      <ul className="chips list-plain" style={{ margin: '8px 0' }}>
        {list.map((c) => (
          <li key={c} className="chip">
            <span>
              {c}
              <button
                type="button"
                className="icon-btn"
                style={{ width: 28, height: 28 }}
                aria-label={`Quitar categoría ${c}`}
                disabled={list.length <= 1}
                onClick={() => onChange(list.filter((x) => x !== c))}
              >
                <Icon name="x" size={14} />
              </button>
            </span>
          </li>
        ))}
      </ul>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          const v = value.trim();
          if (!v) return;
          if (list.some((x) => x.toLowerCase() === v.toLowerCase())) {
            setError('Esa categoría ya existe.');
            return;
          }
          setError('');
          onChange([...list, v.slice(0, 40)]);
          setValue('');
        }}
      >
        <div className="grow">
          <TextInput label={`Nueva categoría (${title.toLowerCase()})`} value={value} onChange={setValue} error={error} maxLength={40} />
        </div>
        <button type="submit" className="btn btn--sm" style={{ marginTop: 14 }}>
          Agregar
        </button>
      </form>
      <p className="tiny muted">Quitar una categoría no modifica los movimientos ya registrados.</p>
    </div>
  );
}

function BackupSection() {
  const { toast } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ backup: Backup; counts: Record<string, number> } | null>(null);
  const [importError, setImportError] = useState('');
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeText, setWipeText] = useState('');

  return (
    <Section title="Copia de seguridad">
      <div className="card">
        <p className="small">
          Tus datos viven solo en este dispositivo. Si borrás los datos del navegador o desinstalás la app sin una copia,
          se pierden. Te recomendamos exportar una copia cada tanto y guardarla en un lugar seguro.
        </p>
        <div className="stack">
          <button
            type="button"
            className="btn btn--primary"
            onClick={async () => {
              try {
                const backup = await createBackup(__APP_VERSION__);
                downloadFile(backupFileName(), JSON.stringify(backup, null, 2), 'application/json');
                await setMeta('lastBackupAt', new Date().toISOString());
                toast('Copia exportada.');
              } catch {
                toast('No se pudo crear la copia.');
              }
            }}
          >
            <Icon name="download" /> Exportar copia (JSON)
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" /> Importar copia
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Elegir archivo de copia de seguridad"
            data-testid="import-file"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              setImportError('');
              if (file.size > 50 * 1024 * 1024) {
                setImportError('El archivo es demasiado grande para ser una copia de RITMO.');
                return;
              }
              const result = parseBackupText(await file.text());
              if (!result.ok) {
                setImportError(`${result.error} No se modificó ningún dato.`);
                return;
              }
              setPending({ backup: result.backup, counts: result.counts });
            }}
          />
          {importError && (
            <p className="field__error" role="alert">
              {importError}
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Restablecer</h3>
        <p className="small muted">Borra todos tus hábitos, registros, finanzas y ajustes de este dispositivo.</p>
        <button type="button" className="btn btn--danger-ghost" onClick={() => setWipeOpen(true)}>
          Borrar todos los datos
        </button>
      </div>

      {pending && (
        <ConfirmDialog
          title="¿Reemplazar tus datos?"
          message={
            <>
              <p>
                La copia es válida
                {pending.backup.exportedAt && ` (creada el ${new Date(pending.backup.exportedAt).toLocaleDateString('es-AR')})`}{' '}
                y contiene {pending.counts.habits} hábitos, {pending.counts.habitLogs} registros y {pending.counts.transactions}{' '}
                movimientos.
              </p>
              <p>Los datos actuales de este dispositivo se reemplazarán por los de la copia.</p>
            </>
          }
          confirmLabel="Reemplazar"
          danger
          onCancel={() => setPending(null)}
          onConfirm={async () => {
            try {
              await restoreBackup(pending.backup);
              toast('Copia restaurada.');
              setTimeout(() => window.location.reload(), 600);
            } catch {
              toast('No se pudo restaurar. Tus datos anteriores siguen intactos.');
            }
            setPending(null);
          }}
        />
      )}

      {wipeOpen && (
        <Modal title="¿Borrar todos los datos?" onClose={() => (setWipeOpen(false), setWipeText(''))}>
          <p className="small">
            Esta acción no se puede deshacer. Si no exportaste una copia, vas a perder tu historial.
          </p>
          <TextInput label='Escribí "BORRAR" para confirmar' value={wipeText} onChange={setWipeText} autoComplete="off" />
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn--ghost" onClick={() => (setWipeOpen(false), setWipeText(''))}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn--danger"
              disabled={wipeText.trim().toUpperCase() !== 'BORRAR'}
              onClick={async () => {
                await wipeAllData();
                try {
                  ['ritmo.theme', 'ritmo.focusTimer', 'ritmo.reminders.sent'].forEach((k) => localStorage.removeItem(k));
                } catch {
                  /* ignorar */
                }
                window.location.hash = '/';
                window.location.reload();
              }}
            >
              Borrar todo
            </button>
          </div>
        </Modal>
      )}
    </Section>
  );
}

function StorageInfo() {
  const [info, setInfo] = useState<{ usage?: number; persisted?: boolean } | null>(null);
  useEffect(() => {
    (async () => {
      const est = await navigator.storage?.estimate?.().catch(() => undefined);
      const persisted = await navigator.storage?.persisted?.().catch(() => undefined);
      setInfo({ usage: est?.usage, persisted });
    })();
  }, []);
  if (!info) return null;
  return (
    <p className="muted">
      {info.usage !== undefined && <>Espacio usado: {(info.usage / 1024 / 1024).toFixed(1).replace('.', ',')} MB. </>}
      {info.persisted === true && 'Almacenamiento persistente concedido.'}
      {info.persisted === false && 'El navegador podría liberar espacio si el dispositivo se queda sin lugar: exportá copias.'}
    </p>
  );
}
