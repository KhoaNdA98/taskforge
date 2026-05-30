"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Shared wrapper — shows value text; click → becomes editable; Escape cancels.
 */
function CellWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("group/cell relative w-full", className)}>{children}</div>
  );
}

/* shared input class */
const inputCls =
  "w-full rounded-lg border border-accent/50 bg-panel-2 px-2 py-1 text-sm text-fg " +
  "outline-none ring-2 ring-accent/30 transition-colors placeholder:text-muted";

/* shared display class */
const displayCls =
  "cursor-text select-none rounded-lg px-2 py-1 text-sm transition-colors " +
  "hover:bg-panel-2 group-hover/cell:bg-panel-2/60";

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
  const [draft, setDraft]     = useState(value);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  function commit() {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== value) onSave(v);
    else setDraft(value);
  }

  return (
    <CellWrap>
      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.input
            key="input"
            ref={inputRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className={inputCls}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === "Enter")  { e.preventDefault(); commit(); }
              if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
          />
        ) : (
          <motion.span
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={() => setEditing(true)}
            className={cn(displayCls, bold && "font-medium text-fg", !value && "text-muted")}
          >
            {value || placeholder || "—"}
          </motion.span>
        )}
      </AnimatePresence>
    </CellWrap>
  );
}

/* ── Editable number ─────────────────────────────────────────────────── */
export function EditableNumber({
  value,
  placeholder,
  step = 0.25,
  min = 0,
  onSave,
}: {
  value: number | null;
  placeholder?: string;
  step?: number;
  min?: number;
  onSave: (v: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value?.toString() ?? "");
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  useEffect(() => { setDraft(value?.toString() ?? ""); }, [value]);

  function commit() {
    setEditing(false);
    const n = parseFloat(draft);
    if (draft === "" || isNaN(n)) onSave(null);
    else if (n !== value) onSave(n);
    else setDraft(value?.toString() ?? "");
  }

  const display = value != null ? `${value}h` : "—";

  return (
    <CellWrap className="max-w-[80px]">
      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.input
            key="input"
            ref={inputRef}
            type="number"
            step={step}
            min={min}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className={cn(inputCls, "font-mono text-right")}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === "Enter")  { e.preventDefault(); commit(); }
              if (e.key === "Escape") { setDraft(value?.toString() ?? ""); setEditing(false); }
            }}
          />
        ) : (
          <motion.span
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={() => setEditing(true)}
            className={cn(displayCls, "font-mono text-right text-fg-2", !value && "text-muted")}
          >
            {display}
          </motion.span>
        )}
      </AnimatePresence>
    </CellWrap>
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

  return (
    <CellWrap className="max-w-[110px]">
      {editing ? (
        <input
          ref={inputRef}
          type="date"
          defaultValue={value}
          autoFocus
          className={cn(inputCls, "font-mono text-xs")}
          onChange={e => {
            if (e.target.value) { onSave(e.target.value); setEditing(false); }
          }}
          onBlur={() => setEditing(false)}
          onKeyDown={e => { if (e.key === "Escape") setEditing(false); }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={cn(displayCls, "font-mono text-xs text-fg-2")}
        >
          {formatFn(value)}
        </span>
      )}
    </CellWrap>
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
  const [editing, setEditing] = useState(false);
  const selectRef             = useRef<HTMLSelectElement>(null);

  useEffect(() => { if (editing) selectRef.current?.focus(); }, [editing]);

  return (
    <CellWrap>
      {editing ? (
        <select
          ref={selectRef}
          defaultValue={value}
          autoFocus
          size={1}
          className={cn(inputCls, "cursor-pointer appearance-none")}
          onChange={e => { onSave(e.target.value as T); setEditing(false); }}
          onBlur={() => setEditing(false)}
          onKeyDown={e => { if (e.key === "Escape") setEditing(false); }}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={cn(displayCls, "inline-flex items-center gap-1")}
        >
          {renderValue(value)}
        </span>
      )}
    </CellWrap>
  );
}
