-- CPA Planning Platform — Database Setup Script
-- Run this in pgAdmin: open Query Tool on the cpa_planning database and execute.

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "name_ar" text NOT NULL,
  "name_en" text,
  "username" text UNIQUE,
  "password_hash" text,
  "designation" text,
  "directorate" text,
  "department" text,
  "section" text,
  "role" text NOT NULL DEFAULT 'employee',
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "announcements" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "category" text NOT NULL DEFAULT 'announcement',
  "author_id" integer NOT NULL REFERENCES "users"("id"),
  "archived" boolean NOT NULL DEFAULT false,
  "flyer_path" text,
  "flyer_name" text,
  "flyer_mime_type" text,
  "flyer_size" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "discussions" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "status" text NOT NULL DEFAULT 'open',
  "author_id" integer NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comments" (
  "id" serial PRIMARY KEY,
  "discussion_id" integer NOT NULL REFERENCES "discussions"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "text" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "inquiries" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "subject" text NOT NULL,
  "details" text NOT NULL,
  "category" text DEFAULT 'other',
  "status" text NOT NULL DEFAULT 'open',
  "response" text,
  "responder_id" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "documents" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "category" text NOT NULL DEFAULT 'other',
  "description" text NOT NULL DEFAULT '',
  "storage_key" text,
  "file_name" text,
  "mime_type" text,
  "file_size" integer,
  "deletion_pending" boolean NOT NULL DEFAULT false,
  "file_url" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "faqs" (
  "id" serial PRIMARY KEY,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "suggestions" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "category" text NOT NULL DEFAULT 'feedback',
  "text" text NOT NULL,
  "status" text NOT NULL DEFAULT 'new',
  "feedback" text,
  "attachment" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" serial PRIMARY KEY,
  "user_id" integer REFERENCES "users"("id"),
  "user_name" text NOT NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" integer,
  "details" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "glossary" (
  "id" serial PRIMARY KEY,
  "term_ar" text NOT NULL,
  "term_en" text,
  "definition" text NOT NULL,
  "examples" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Flyer support for existing installations.
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "flyer_path" text;
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "flyer_name" text;
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "flyer_mime_type" text;
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "flyer_size" integer;

-- Private document storage support for existing installations.
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "storage_key" text;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "file_name" text;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "mime_type" text;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "file_size" integer;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "deletion_pending" boolean NOT NULL DEFAULT false;

-- One-time maintenance operations tracker, so destructive one-off scripts below
-- run exactly once and are safe to leave in this rerunnable setup script.
CREATE TABLE IF NOT EXISTS "maintenance_log" (
  "operation" text PRIMARY KEY,
  "executed_at" timestamp DEFAULT now() NOT NULL
);

-- One-time: archive then clear out test data from announcements/updates,
-- participatory discussions, inquiries, and suggestions so those sections
-- start fresh. Users and all other data are untouched. Archived copies are
-- kept in *_backup_2026_09_23 tables.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "maintenance_log" WHERE "operation" = 'wipe_test_data_2026_09_23') THEN
    CREATE TABLE IF NOT EXISTS "announcements_backup_2026_09_23" AS SELECT * FROM "announcements";
    CREATE TABLE IF NOT EXISTS "comments_backup_2026_09_23" AS SELECT * FROM "comments";
    CREATE TABLE IF NOT EXISTS "discussions_backup_2026_09_23" AS SELECT * FROM "discussions";
    CREATE TABLE IF NOT EXISTS "inquiries_backup_2026_09_23" AS SELECT * FROM "inquiries";
    CREATE TABLE IF NOT EXISTS "suggestions_backup_2026_09_23" AS SELECT * FROM "suggestions";

    DELETE FROM "comments";
    DELETE FROM "discussions";
    DELETE FROM "announcements";
    DELETE FROM "inquiries";
    DELETE FROM "suggestions";

    INSERT INTO "maintenance_log"("operation") VALUES ('wipe_test_data_2026_09_23');
  END IF;
END $$;
