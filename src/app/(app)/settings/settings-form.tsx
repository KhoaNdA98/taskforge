"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { updateSettings, type SettingsState } from "./actions";
import { Button, Input, Select, Field } from "@/components/ui";
import { SETTINGS } from "@/lib/strings";
import { fadeUp } from "@/lib/motion";
import type { Settings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateSettings, {});

  return (
    <form action={action} className="space-y-5">
      <Field label={SETTINGS.fields.rate} hint={SETTINGS.fields.rateHint}>
        <Input
          name="hourly_rate"
          type="number"
          min={0}
          step={1000}
          defaultValue={settings.hourly_rate}
          className="font-mono"
        />
      </Field>
      <Field label={SETTINGS.fields.currency}>
        <Select name="currency" defaultValue={settings.currency}>
          <option value="VND">{SETTINGS.currencies.VND}</option>
          <option value="USD">{SETTINGS.currencies.USD}</option>
        </Select>
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? SETTINGS.saving : SETTINGS.save}
        </Button>
        <AnimatePresence>
          {state.ok && (
            <motion.span {...fadeUp} className="inline-flex items-center gap-1 text-sm text-teal">
              <Check size={14} /> {SETTINGS.saved}
            </motion.span>
          )}
          {state.error && (
            <motion.span {...fadeUp} className="text-sm text-rose">{state.error}</motion.span>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
