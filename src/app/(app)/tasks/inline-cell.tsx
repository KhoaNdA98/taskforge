'use client';

import { useEffect, useRef, useState } from 'react';

/* ── Editable text ───────────────────────────────────────────────────── */
export function EditableText({
  value,
  placeholder,
  onSave,
  bold,
}: {
  value: string;
  placeholder?: string;
  onSave: (v: string) => void;
  bold?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setDraft(value); }, [value]);

  function commit() {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== value) onSave(v);
    else setDraft(value);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter')  { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        style={{
          width: '100%', border: '1px solid var(--mantine-color-indigo-4)',
          borderRadius: 6, padding: '2px 6px', fontSize: 14,
          outline: 'none', boxShadow: '0 0 0 2px var(--mantine-color-indigo-1)',
          background: 'white', fontWeight: bold ? 500 : undefined,
        }}
      />
    );
  }
  return (
    <span
      onClick={() => setEditing(true)}
      style={{
        cursor: 'text', display: 'block', padding: '2px 6px',
        borderRadius: 6, fontSize: 14, fontWeight: bold ? 500 : undefined,
        color: value ? undefined : 'var(--mantine-color-gray-5)',
      }}
    >
      {value || placeholder || '—'}
    </span>
  );
}

/* ── Editable number ─────────────────────────────────────────────────── */
export function EditableNumber({
  value,
  step = 0.25,
  min  = 0,
  onSave,
}: {
  value: number | null;
  step?: number;
  min?: number;
  onSave: (v: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value?.toString() ?? '');
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setDraft(value?.toString() ?? ''); }, [value]);

  function commit() {
    setEditing(false);
    const n = parseFloat(draft);
    if (draft === '' || isNaN(n)) onSave(null);
    else if (n !== value) onSave(n);
    else setDraft(value?.toString() ?? '');
  }

  const display = value != null ? `${value}h` : '—';

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step={step}
        min={min}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter')  { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { setDraft(value?.toString() ?? ''); setEditing(false); }
        }}
        style={{
          width: 72, border: '1px solid var(--mantine-color-indigo-4)',
          borderRadius: 6, padding: '2px 6px', fontSize: 13, textAlign: 'right',
          outline: 'none', boxShadow: '0 0 0 2px var(--mantine-color-indigo-1)',
          background: 'white', fontFamily: 'monospace',
        }}
      />
    );
  }
  return (
    <span
      onClick={() => setEditing(true)}
      style={{
        cursor: 'text', display: 'block', padding: '2px 6px',
        borderRadius: 6, fontSize: 13, textAlign: 'right',
        fontFamily: 'monospace',
        color: value ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-5)',
      }}
    >
      {display}
    </span>
  );
}

/* ── Editable date ───────────────────────────────────────────────────── */
export function EditableDate({
  value,
  onSave,
  formatFn,
}: {
  value: string;
  onSave: (v: string) => void;
  formatFn: (v: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.showPicker?.(); }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="date"
        defaultValue={value}
        autoFocus
        onChange={e => {
          if (e.target.value) { onSave(e.target.value); setEditing(false); }
        }}
        onBlur={() => setEditing(false)}
        onKeyDown={e => { if (e.key === 'Escape') setEditing(false); }}
        style={{
          border: '1px solid var(--mantine-color-indigo-4)',
          borderRadius: 6, padding: '2px 6px', fontSize: 12,
          outline: 'none', boxShadow: '0 0 0 2px var(--mantine-color-indigo-1)',
          background: 'white', fontFamily: 'monospace',
        }}
      />
    );
  }
  return (
    <span
      onClick={() => setEditing(true)}
      style={{
        cursor: 'text', display: 'block', padding: '2px 6px',
        borderRadius: 6, fontSize: 12, fontFamily: 'monospace',
        color: 'var(--mantine-color-dark-4)',
      }}
    >
      {formatFn(value)}
    </span>
  );
}

/* ── Editable select ─────────────────────────────────────────────────── */
export function EditableSelect<T extends string>({
  value,
  options,
  renderValue,
  onSave,
}: {
  value: T;
  options: { value: T; label: string }[];
  renderValue: (v: T) => React.ReactNode;
  onSave: (v: T) => void;
}) {
  const [editing,  setEditing] = useState(false);
  const selectRef              = useRef<HTMLSelectElement>(null);

  useEffect(() => { if (editing) selectRef.current?.focus(); }, [editing]);

  if (editing) {
    return (
      <select
        ref={selectRef}
        defaultValue={value}
        autoFocus
        onChange={e => { onSave(e.target.value as T); setEditing(false); }}
        onBlur={() => setEditing(false)}
        onKeyDown={e => { if (e.key === 'Escape') setEditing(false); }}
        style={{
          border: '1px solid var(--mantine-color-indigo-4)',
          borderRadius: 6, padding: '2px 6px', fontSize: 13,
          outline: 'none', background: 'white', cursor: 'pointer',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
  return (
    <span
      onClick={() => setEditing(true)}
      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: '2px 4px', borderRadius: 6 }}
    >
      {renderValue(value)}
    </span>
  );
}
