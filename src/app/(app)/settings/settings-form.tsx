"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateSettings, type SettingsState } from "./actions";
import { Button, Input, Select, Field } from "@/components/ui";
import type { Settings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateSettings,
    {},
  );

  return (
    <form action={action} className="space-y-5">
      <Field
        label="Rate theo giờ"
        hint="Áp dụng mặc định cho task on-demand mới. Đổi rate không làm thay đổi task đã tạo trước đó."
      >
        <Input
          name="hourly_rate"
          type="number"
          min={0}
          step={1000}
          defaultValue={settings.hourly_rate}
          className="font-mono"
        />
      </Field>

      <Field label="Đơn vị tiền">
        <Select name="currency" defaultValue={settings.currency}>
          <option value="VND">VND — Việt Nam Đồng</option>
          <option value="USD">USD — US Dollar</option>
        </Select>
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Đang lưu…" : "Lưu cài đặt"}
        </Button>
        {state.ok && (
          <span className="inline-flex items-center gap-1 text-sm text-teal">
            <Check size={15} /> Đã lưu
          </span>
        )}
        {state.error && <span className="text-sm text-rose">{state.error}</span>}
      </div>
    </form>
  );
}
