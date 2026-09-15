ALTER TABLE "crop_types"
  ADD COLUMN IF NOT EXISTS "emoji" text NOT NULL DEFAULT '🌱';
ALTER TABLE "crop_types"
  ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;

ALTER TABLE "crop_types" DROP CONSTRAINT IF EXISTS "crop_types_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "crop_types_name_ci_idx" ON "crop_types" (lower("name"));
