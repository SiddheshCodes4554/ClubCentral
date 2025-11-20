CREATE TABLE IF NOT EXISTS "institutions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "type" text NOT NULL,
  "code" varchar(12) NOT NULL,
  "phone" text,
  "admin_email" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "institutions_code_idx" ON "institutions" ("code");

CREATE TABLE IF NOT EXISTS "institution_users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "institution_id" varchar NOT NULL REFERENCES "institutions" ("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "phone" text,
  "role" text NOT NULL,
  "department" text,
  "permissions" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "status" text NOT NULL DEFAULT 'active',
  "last_login_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "institution_users_institution_idx" ON "institution_users" ("institution_id");

CREATE TABLE IF NOT EXISTS "institution_analytics" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "institution_id" varchar NOT NULL REFERENCES "institutions" ("id") ON DELETE CASCADE,
  "snapshot_date" timestamp with time zone NOT NULL DEFAULT now(),
  "metrics" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "heatmap" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "institution_analytics_institution_idx" ON "institution_analytics" ("institution_id");

ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "institution_id" varchar;
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "department" text;
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "performance_index" numeric(5,2);

UPDATE "clubs" SET "performance_index" = 0 WHERE "performance_index" IS NULL;

ALTER TABLE "clubs"
  ALTER COLUMN "performance_index" SET DEFAULT 0,
  ALTER COLUMN "performance_index" SET NOT NULL;

ALTER TABLE "clubs"
  ADD CONSTRAINT IF NOT EXISTS "clubs_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "institutions" ("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "clubs_institution_id_idx" ON "clubs" ("institution_id");

