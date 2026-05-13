-- Drop the old unique index on the VARCHAR ticket_number
DROP INDEX IF EXISTS "tickets_ticket_number_key";

-- Add a new integer column (nullable while we backfill)
ALTER TABLE "tickets" ADD COLUMN "ticket_number_new" INTEGER;

-- Backfill: assign sequential integers in created_at order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM tickets
)
UPDATE tickets
SET ticket_number_new = numbered.rn::INTEGER
FROM numbered
WHERE tickets.id = numbered.id;

-- Create sequence and advance it past the highest backfilled number
CREATE SEQUENCE "tickets_ticket_number_seq";
SELECT setval('"tickets_ticket_number_seq"', COALESCE((SELECT MAX(ticket_number_new) FROM tickets), 0) + 1, false);

-- Wire the sequence as the column default
ALTER TABLE "tickets"
  ALTER COLUMN "ticket_number_new" SET DEFAULT nextval('"tickets_ticket_number_seq"');

-- Drop the old VARCHAR column
ALTER TABLE "tickets" DROP COLUMN "ticket_number";

-- Rename the new column into place
ALTER TABLE "tickets" RENAME COLUMN "ticket_number_new" TO "ticket_number";

-- Enforce NOT NULL
ALTER TABLE "tickets" ALTER COLUMN "ticket_number" SET NOT NULL;

-- Recreate the unique index
CREATE UNIQUE INDEX "tickets_ticket_number_key" ON "tickets"("ticket_number");
