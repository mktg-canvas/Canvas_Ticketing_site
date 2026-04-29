-- Remove building_id from companies (it's now in company_locations)
ALTER TABLE "companies" DROP COLUMN IF EXISTS "building_id";

-- Create company_locations join table
CREATE TABLE "company_locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "building_id" UUID NOT NULL,
    "floor_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_locations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_locations_company_id_building_id_floor_id_key"
    ON "company_locations"("company_id", "building_id", "floor_id");

ALTER TABLE "company_locations"
    ADD CONSTRAINT "company_locations_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_locations"
    ADD CONSTRAINT "company_locations_building_id_fkey"
    FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_locations"
    ADD CONSTRAINT "company_locations_floor_id_fkey"
    FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
