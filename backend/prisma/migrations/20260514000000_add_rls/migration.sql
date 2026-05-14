-- Enable Row Level Security on ticket-related tables.
-- NOTE: RLS policies are bypassed for superuser connections (e.g. the postgres role).
-- For full DB-level enforcement, the app should connect as a non-superuser role.
-- The application layer (listTickets, etc.) already enforces access control;
-- these policies provide defense-in-depth when running under a restricted role.

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- tickets: super_admin sees all; cem sees only their own
CREATE POLICY tickets_isolation ON tickets
  FOR ALL
  USING (
    current_setting('app.current_user_role', TRUE) = 'super_admin'
    OR raised_by::text = current_setting('app.current_user_id', TRUE)
  )
  WITH CHECK (
    current_setting('app.current_user_role', TRUE) = 'super_admin'
    OR raised_by::text = current_setting('app.current_user_id', TRUE)
  );

-- ticket_activities: super_admin sees all; cem sees only activities on their tickets
CREATE POLICY ticket_activities_isolation ON ticket_activities
  FOR ALL
  USING (
    current_setting('app.current_user_role', TRUE) = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_activities.ticket_id
        AND tickets.raised_by::text = current_setting('app.current_user_id', TRUE)
    )
  )
  WITH CHECK (
    current_setting('app.current_user_role', TRUE) = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_activities.ticket_id
        AND tickets.raised_by::text = current_setting('app.current_user_id', TRUE)
    )
  );

-- attachments: super_admin sees all; cem sees only attachments on their tickets
CREATE POLICY attachments_isolation ON attachments
  FOR ALL
  USING (
    current_setting('app.current_user_role', TRUE) = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = attachments.ticket_id
        AND tickets.raised_by::text = current_setting('app.current_user_id', TRUE)
    )
  )
  WITH CHECK (
    current_setting('app.current_user_role', TRUE) = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = attachments.ticket_id
        AND tickets.raised_by::text = current_setting('app.current_user_id', TRUE)
    )
  );
