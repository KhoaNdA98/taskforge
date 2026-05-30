-- Add position column for drag-and-drop ordering.
-- Run in Supabase SQL Editor.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS position numeric;

-- Seed position from created_at so existing tasks keep their order.
UPDATE public.tasks
  SET position = extract(epoch from created_at)
  WHERE position IS NULL;

CREATE INDEX IF NOT EXISTS tasks_user_position_idx
  ON public.tasks (user_id, position);
