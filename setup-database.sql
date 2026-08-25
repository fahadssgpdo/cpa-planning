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
