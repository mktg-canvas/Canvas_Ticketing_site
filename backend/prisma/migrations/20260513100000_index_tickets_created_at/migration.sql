-- Index to speed up date-range queries used by kanban board and tickets list
CREATE INDEX IF NOT EXISTS "tickets_created_at_idx" ON "tickets"("created_at" DESC);
