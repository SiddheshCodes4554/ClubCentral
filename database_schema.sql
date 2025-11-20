-- =====================================================
-- ClubCentral Database Schema
-- Complete PostgreSQL DDL
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- INSTITUTION TABLES (Enterprise Layer)
-- =====================================================

-- Institutions table
CREATE TABLE IF NOT EXISTS "institutions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "type" text NOT NULL, -- College / University
  "code" varchar(12) NOT NULL,
  "phone" text,
  "admin_email" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "institutions_code_idx" ON "institutions" ("code");

-- Institution users table (admins, coordinators, department heads)
CREATE TABLE IF NOT EXISTS "institution_users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "institution_id" varchar NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "phone" text,
  "role" text NOT NULL, -- Institution Admin, Faculty Coordinator, Department Head
  "department" text,
  "permissions" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "status" text NOT NULL DEFAULT 'active',
  "last_login_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "institution_users_institution_id_fkey" 
    FOREIGN KEY ("institution_id") 
    REFERENCES "institutions" ("id") 
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "institution_users_institution_idx" ON "institution_users" ("institution_id");

-- Institution analytics table
CREATE TABLE IF NOT EXISTS "institution_analytics" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "institution_id" varchar NOT NULL,
  "snapshot_date" timestamp with time zone NOT NULL DEFAULT now(),
  "metrics" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "heatmap" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "institution_analytics_institution_id_fkey" 
    FOREIGN KEY ("institution_id") 
    REFERENCES "institutions" ("id") 
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "institution_analytics_institution_idx" ON "institution_analytics" ("institution_id");

-- =====================================================
-- CLUB TABLES
-- =====================================================

-- Clubs table
CREATE TABLE IF NOT EXISTS "clubs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "institution_id" varchar,
  "name" text NOT NULL,
  "college_name" text NOT NULL,
  "department" text,
  "logo_url" text,
  "description" text,
  "performance_index" numeric(5,2) NOT NULL DEFAULT 0,
  "club_code" varchar(8) NOT NULL UNIQUE,
  "president_password" text, -- Encrypted password for admin viewing
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "clubs_institution_id_fkey" 
    FOREIGN KEY ("institution_id") 
    REFERENCES "institutions" ("id") 
    ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "clubs_club_code_idx" ON "clubs" ("club_code");
CREATE INDEX IF NOT EXISTS "clubs_institution_id_idx" ON "clubs" ("institution_id");

-- =====================================================
-- USER TABLES
-- =====================================================

-- Custom roles table (created before users to avoid circular dependency)
CREATE TABLE IF NOT EXISTS "roles" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "club_id" varchar NOT NULL,
  "name" text NOT NULL, -- e.g., "Content Head", "Finance Head", "Event Head"
  "permissions" jsonb NOT NULL, -- JSON object with permission flags
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "roles_club_id_fkey" 
    FOREIGN KEY ("club_id") 
    REFERENCES "clubs" ("id") 
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "roles_club_id_idx" ON "roles" ("club_id");

-- Users table (approved members with login access)
CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "club_id" varchar NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "phone" text,
  "id_number" text,
  "linkedin" text,
  "portfolio" text,
  "role" text NOT NULL, -- President, Vice-President, Council Head, Member
  "role_id" varchar,
  "is_president" boolean NOT NULL DEFAULT false,
  "is_approved" boolean NOT NULL DEFAULT true,
  "can_login" boolean NOT NULL DEFAULT true, -- Only President/VP/Heads can login
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "users_club_id_fkey" 
    FOREIGN KEY ("club_id") 
    REFERENCES "clubs" ("id") 
    ON DELETE CASCADE,
  CONSTRAINT "users_role_id_fkey" 
    FOREIGN KEY ("role_id") 
    REFERENCES "roles" ("id")
);

CREATE INDEX IF NOT EXISTS "users_club_id_idx" ON "users" ("club_id");
CREATE INDEX IF NOT EXISTS "users_role_id_idx" ON "users" ("role_id");

-- Pending members table (applications awaiting approval)
CREATE TABLE IF NOT EXISTS "pending_members" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "club_id" varchar NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "password" text NOT NULL,
  "phone" text,
  "id_number" text,
  "linkedin" text,
  "portfolio" text,
  "applied_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "pending_members_club_id_fkey" 
    FOREIGN KEY ("club_id") 
    REFERENCES "clubs" ("id") 
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "pending_members_club_id_idx" ON "pending_members" ("club_id");

-- =====================================================
-- EVENT TABLES
-- =====================================================

-- Events table
CREATE TABLE IF NOT EXISTS "events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "club_id" varchar NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "date" timestamp with time zone NOT NULL,
  "budget" numeric(10,2),
  "status" text NOT NULL DEFAULT 'Planning', -- Planning, Ongoing, Completed
  "assigned_to_id" varchar,
  "created_by_id" varchar NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "events_club_id_fkey" 
    FOREIGN KEY ("club_id") 
    REFERENCES "clubs" ("id") 
    ON DELETE CASCADE,
  CONSTRAINT "events_assigned_to_id_fkey" 
    FOREIGN KEY ("assigned_to_id") 
    REFERENCES "users" ("id"),
  CONSTRAINT "events_created_by_id_fkey" 
    FOREIGN KEY ("created_by_id") 
    REFERENCES "users" ("id")
);

CREATE INDEX IF NOT EXISTS "events_club_id_idx" ON "events" ("club_id");
CREATE INDEX IF NOT EXISTS "events_assigned_to_id_idx" ON "events" ("assigned_to_id");
CREATE INDEX IF NOT EXISTS "events_created_by_id_idx" ON "events" ("created_by_id");

-- =====================================================
-- TEAM TABLES
-- =====================================================

-- Teams table
CREATE TABLE IF NOT EXISTS "teams" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "club_id" varchar NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "captain_id" varchar,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "teams_club_id_fkey" 
    FOREIGN KEY ("club_id") 
    REFERENCES "clubs" ("id") 
    ON DELETE CASCADE,
  CONSTRAINT "teams_captain_id_fkey" 
    FOREIGN KEY ("captain_id") 
    REFERENCES "users" ("id") 
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "teams_club_id_idx" ON "teams" ("club_id");
CREATE INDEX IF NOT EXISTS "teams_captain_id_idx" ON "teams" ("captain_id");

-- Team members table
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "team_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "member_role" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "team_members_team_id_fkey" 
    FOREIGN KEY ("team_id") 
    REFERENCES "teams" ("id") 
    ON DELETE CASCADE,
  CONSTRAINT "team_members_user_id_fkey" 
    FOREIGN KEY ("user_id") 
    REFERENCES "users" ("id") 
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "team_members_team_user_idx" ON "team_members" ("team_id", "user_id");
CREATE INDEX IF NOT EXISTS "team_members_team_id_idx" ON "team_members" ("team_id");
CREATE INDEX IF NOT EXISTS "team_members_user_id_idx" ON "team_members" ("user_id");

-- =====================================================
-- TASK TABLES
-- =====================================================

-- Tasks table
CREATE TABLE IF NOT EXISTS "tasks" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" varchar NOT NULL,
  "club_id" varchar NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "assigned_to_id" varchar,
  "team_id" varchar,
  "due_date" timestamp with time zone,
  "status" text NOT NULL DEFAULT 'Pending', -- Pending, In Progress, Done
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "tasks_event_id_fkey" 
    FOREIGN KEY ("event_id") 
    REFERENCES "events" ("id") 
    ON DELETE CASCADE,
  CONSTRAINT "tasks_club_id_fkey" 
    FOREIGN KEY ("club_id") 
    REFERENCES "clubs" ("id") 
    ON DELETE CASCADE,
  CONSTRAINT "tasks_assigned_to_id_fkey" 
    FOREIGN KEY ("assigned_to_id") 
    REFERENCES "users" ("id"),
  CONSTRAINT "tasks_team_id_fkey" 
    FOREIGN KEY ("team_id") 
    REFERENCES "teams" ("id") 
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "tasks_event_id_idx" ON "tasks" ("event_id");
CREATE INDEX IF NOT EXISTS "tasks_club_id_idx" ON "tasks" ("club_id");
CREATE INDEX IF NOT EXISTS "tasks_assigned_to_id_idx" ON "tasks" ("assigned_to_id");
CREATE INDEX IF NOT EXISTS "tasks_team_id_idx" ON "tasks" ("team_id");

-- =====================================================
-- FINANCE TABLES
-- =====================================================

-- Finance table
CREATE TABLE IF NOT EXISTS "finance" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "club_id" varchar NOT NULL,
  "transaction_name" text NOT NULL,
  "type" text NOT NULL, -- income, expense
  "amount" numeric(10,2) NOT NULL,
  "receipt_url" text,
  "status" text NOT NULL DEFAULT 'Pending', -- Pending, Approved
  "approved_by_id" varchar,
  "created_by_id" varchar NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "finance_club_id_fkey" 
    FOREIGN KEY ("club_id") 
    REFERENCES "clubs" ("id") 
    ON DELETE CASCADE,
  CONSTRAINT "finance_approved_by_id_fkey" 
    FOREIGN KEY ("approved_by_id") 
    REFERENCES "users" ("id"),
  CONSTRAINT "finance_created_by_id_fkey" 
    FOREIGN KEY ("created_by_id") 
    REFERENCES "users" ("id")
);

CREATE INDEX IF NOT EXISTS "finance_club_id_idx" ON "finance" ("club_id");
CREATE INDEX IF NOT EXISTS "finance_approved_by_id_idx" ON "finance" ("approved_by_id");
CREATE INDEX IF NOT EXISTS "finance_created_by_id_idx" ON "finance" ("created_by_id");

-- =====================================================
-- SOCIAL MEDIA TABLES
-- =====================================================

-- Social posts table
CREATE TABLE IF NOT EXISTS "social_posts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "club_id" varchar NOT NULL,
  "caption" text NOT NULL,
  "image_url" text,
  "platform" text NOT NULL, -- Instagram, Twitter, Facebook, LinkedIn
  "scheduled_date" timestamp with time zone,
  "status" text NOT NULL DEFAULT 'Draft', -- Draft, Scheduled, Posted
  "created_by_id" varchar NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "social_posts_club_id_fkey" 
    FOREIGN KEY ("club_id") 
    REFERENCES "clubs" ("id") 
    ON DELETE CASCADE,
  CONSTRAINT "social_posts_created_by_id_fkey" 
    FOREIGN KEY ("created_by_id") 
    REFERENCES "users" ("id")
);

CREATE INDEX IF NOT EXISTS "social_posts_club_id_idx" ON "social_posts" ("club_id");
CREATE INDEX IF NOT EXISTS "social_posts_created_by_id_idx" ON "social_posts" ("created_by_id");
CREATE INDEX IF NOT EXISTS "social_posts_status_idx" ON "social_posts" ("status");
CREATE INDEX IF NOT EXISTS "social_posts_scheduled_date_idx" ON "social_posts" ("scheduled_date");

-- =====================================================
-- COMMENTS / NOTES
-- =====================================================

-- This schema supports:
-- 1. Institution mode: Institutions can create and manage multiple clubs
-- 2. Club management: Clubs can operate independently or under an institution
-- 3. User roles: President, VP, Council Heads, Members with custom roles
-- 4. Event management: Events with tasks and team assignments
-- 5. Finance tracking: Income/expense transactions with approval workflow
-- 6. Social media: Scheduled posts across multiple platforms
-- 7. Team organization: Teams with captains and members
-- 8. Analytics: Institution-level analytics snapshots

-- =====================================================
-- END OF SCHEMA
-- =====================================================

