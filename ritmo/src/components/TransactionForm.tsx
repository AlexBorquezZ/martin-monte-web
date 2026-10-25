import { useState } from 'react';
import { useApp } from '../app/AppContext';
import { CURRENCIES } from '../domain/constants';
import { centsToInput, parseAmount } from '../domain/finance';
import type { Currency, Transaction, TxType } from '../domain/types';
import { isValidDateKey } from '../lib/date';
import { saveTransaction } from '../storage/repo';
import { ChoiceChips, Select, TextArea, TextInput } from './ui';

export function TransactionForm({
  initial,
  onDone,
  compact,
}: {
  initial?: Transaction;
  onDone?: () => void;
  compact?: boolean;
}) {
  const { settings, today, toast } = useApp();
  const [type, setType] = useState<TxType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial ? centsToInput(initial.amountCents) : '');
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? settings.defaultCurrency);
  const cats = type === 'expense' ? settings.expenseCategories : settings.incomeCategories;
  const [category, setCategory] = useState(initial?.category ?? cats[0]);
  const [date, setDate] = useState(initial?.date ?? today);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [errors, setErrors] = useState<{ amount?: string; date?: string }>({});
  const [saving, setSaving] = useState(false);

  const categoryOptions = cats.includes(category) ? cats : [category, ...cats];

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const cents = parseAmount(amount);
        const errs: typeof errors = {};
        if (cents === null) errs.amount = 'Escribí un importe mayor a cero (por ejemplo 1500 o 1.500,50).';
        if (!isValidDateKey(date)) errs.date = 'Elegí una fecha válida.';
        setErrors(errs);
        if (cents === null || errs.date) return;
        setSaving(true);
        try {
          await saveTransaction({
            id: initial?.id,
            type,
            amountCents: cents,
            currency,
            category,
            date,
            description: description.trim().slice(0, 120),
            notes: notes.trim().slice(0, 500),
          });
          toast(initial ? 'Movimiento actualizado.' : type === 'expense' ? 'Gasto guardado.' : 'Ingreso guardado.');
          if (!initial) {
            setAmount('');
            setDescription('');
            setNotes('');
          }
          onDone?.();
        } catch {
          toast('No se pudo guardar. Probá de nuevo.');
        } finally {
          setSaving(false);
        }
      }}
    >
      <ChoiceChips
        legend="Tipo"
        value={type}
        onChange={(t) => {
          setType(t);
          setCategory((t === 'expense' ? settings.expenseCategories : settings.incomeCategories)[0]);
        }}
        options={[
          { value: 'expense', label: 'Gasto' },
          { value: 'income', label: 'Ingreso' },
        ]}
      />
      <div className="grid-2">
        <TextInput
          label="Importe"
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          onChange={setAmount}
          error={errors.amount}
          placeholder="0,00"
        />
        <Select label="Moneda" value={currency} onChange={setCurrency} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
      </div>
      <Select label="Categoría" value={category} onChange={setCategory} options={categoryOptions.map((c) => ({ value: c, label: c }))} />
      <TextInput label="Descripción" value={description} onChange={setDescription} maxLength={120} placeholder="Ej.: verdulería" />
      {!compact && (
        <>
          <TextInput label="Fecha" type="date" value={date} onChange={setDate} error={errors.date} />
          <TextArea label="Notas (opcional)" value={notes} onChange={setNotes} rows={2} maxLength={500} />
        </>
      )}
      <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
        {initial ? 'Guardar cambios' : type === 'expense' ? 'Guardar gasto' : 'Guardar ingreso'}
      </button>
    </form>
  );
}
