-- ARDNET RabbitMQ notification reliability fields.
-- This extends the already-approved notifications table; it does not create a new table.
-- Run against Farm_to_Market_Exchange_DB after confirming the existing table is named public.notifications.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS event_id TEXT,
  ADD COLUMN IF NOT EXISTS email_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS email_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_last_error TEXT,
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- A RabbitMQ event can create at most one in-app notification row.
CREATE UNIQUE INDEX IF NOT EXISTS ux_notifications_event_id
  ON public.notifications (event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_notifications_user_created
  ON public.notifications (user_id, created_at DESC);
