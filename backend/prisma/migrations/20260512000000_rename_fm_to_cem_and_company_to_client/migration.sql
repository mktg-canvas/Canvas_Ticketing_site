-- Rename "FM" terminology to "CEM" and "Company" terminology to "Client".
-- This migration is data-preserving: every existing row, FK and index survives.
--
-- Strategy:
--   1) ALTER TYPE ... RENAME VALUE  for the two enums  (Role, TicketSource)
--   2) ALTER TABLE ... RENAME TO    for the two tables (companies, company_locations)
--   3) ALTER TABLE ... RENAME COLUMN company_id → client_id everywhere
--   4) Rename PK / FK constraints + the unique index so future Prisma migrations
--      diff cleanly against the new naming.
--
-- Requires PostgreSQL 10+ (for ALTER TYPE ... RENAME VALUE). Supabase is fine.

-- 1) Enum values --------------------------------------------------------------
ALTER TYPE "Role"         RENAME VALUE 'fm' TO 'cem';
ALTER TYPE "TicketSource" RENAME VALUE 'fm' TO 'cem';

-- 2) Tables -------------------------------------------------------------------
ALTER TABLE "companies"          RENAME TO "clients";
ALTER TABLE "company_locations"  RENAME TO "client_locations";

-- 3) Columns ------------------------------------------------------------------
ALTER TABLE "tickets"          RENAME COLUMN "company_id" TO "client_id";
ALTER TABLE "client_locations" RENAME COLUMN "company_id" TO "client_id";

-- 4) Constraint + index names -------------------------------------------------

-- Primary keys
ALTER TABLE "clients"
  RENAME CONSTRAINT "companies_pkey" TO "clients_pkey";

ALTER TABLE "client_locations"
  RENAME CONSTRAINT "company_locations_pkey" TO "client_locations_pkey";

-- Foreign keys: tickets.client_id → clients.id
ALTER TABLE "tickets"
  RENAME CONSTRAINT "tickets_company_id_fkey" TO "tickets_client_id_fkey";

-- Foreign keys: client_locations
ALTER TABLE "client_locations"
  RENAME CONSTRAINT "company_locations_company_id_fkey" TO "client_locations_client_id_fkey";

ALTER TABLE "client_locations"
  RENAME CONSTRAINT "company_locations_building_id_fkey" TO "client_locations_building_id_fkey";

ALTER TABLE "client_locations"
  RENAME CONSTRAINT "company_locations_floor_id_fkey" TO "client_locations_floor_id_fkey";

-- Unique composite index on (client_id, building_id, floor_id)
ALTER INDEX "company_locations_company_id_building_id_floor_id_key"
  RENAME TO "client_locations_client_id_building_id_floor_id_key";
