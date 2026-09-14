CREATE TYPE "planting_status" AS ENUM ('ACTIVE', 'HARVESTED', 'REMOVED');
CREATE TYPE "care_event_type" AS ENUM ('WATERING', 'FERTILIZING', 'HARVEST', 'REMOVAL');

CREATE TABLE "gardens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" text NOT NULL,
  "rows" integer NOT NULL, "columns" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "crop_types" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" text NOT NULL UNIQUE,
  "default_harvest_days" integer NOT NULL, "default_watering_interval_days" integer NOT NULL,
  "default_fertilizing_interval_days" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "plots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "garden_id" uuid NOT NULL REFERENCES "gardens"("id") ON DELETE CASCADE,
  "row" integer NOT NULL, "column" integer NOT NULL,
  CONSTRAINT "plots_garden_position_idx" UNIQUE ("garden_id", "row", "column")
);
CREATE TABLE "plantings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "plot_id" uuid NOT NULL REFERENCES "plots"("id") ON DELETE CASCADE,
  "crop_type_id" uuid NOT NULL REFERENCES "crop_types"("id"), "planted_at" timestamptz NOT NULL,
  "expected_harvest_at" timestamptz NOT NULL, "harvested_at" timestamptz, "removed_at" timestamptz,
  "status" "planting_status" NOT NULL DEFAULT 'ACTIVE',
  "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "one_active_planting_per_plot_idx" ON "plantings" ("plot_id") WHERE "status" = 'ACTIVE';
CREATE TABLE "care_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "planting_id" uuid NOT NULL REFERENCES "plantings"("id") ON DELETE CASCADE,
  "type" "care_event_type" NOT NULL, "performed_at" timestamptz NOT NULL,
  "notes" text, "created_at" timestamptz NOT NULL DEFAULT now()
);
