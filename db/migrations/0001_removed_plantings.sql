ALTER TYPE "planting_status" ADD VALUE IF NOT EXISTS 'REMOVED';
ALTER TYPE "care_event_type" ADD VALUE IF NOT EXISTS 'REMOVAL';
ALTER TABLE "plantings" ADD COLUMN IF NOT EXISTS "removed_at" timestamptz;
