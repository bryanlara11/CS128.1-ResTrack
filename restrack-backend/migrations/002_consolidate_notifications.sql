BEGIN;

-- Ensure the canonical table exists (plural form).
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    research_id     INTEGER REFERENCES research_studies(research_id),
    user_id         INTEGER REFERENCES users(user_id),
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    date_sent       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- If legacy table `notification` exists, copy its rows into `notifications`.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notification'
  ) THEN
    INSERT INTO notifications (research_id, user_id, message, is_read, date_sent)
    SELECT
      n.research_id,
      n.user_id,
      n.message,
      COALESCE(n.is_read, false),
      COALESCE(n.date_sent, NOW())
    FROM notification n
    WHERE NOT EXISTS (
      SELECT 1
      FROM notifications nn
      WHERE nn.research_id IS NOT DISTINCT FROM n.research_id
        AND nn.user_id    IS NOT DISTINCT FROM n.user_id
        AND nn.message    = n.message
        AND nn.is_read    = COALESCE(n.is_read, false)
        AND nn.date_sent  = COALESCE(n.date_sent, NOW())
    );

    -- Drop legacy table once copied.
    DROP TABLE notification;
  END IF;
END $$;

COMMIT;

