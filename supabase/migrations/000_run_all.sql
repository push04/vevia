-- =============================================================
-- VEVIA — MASTER DATABASE SETUP (idempotent, safe to re-run)
-- Run this in Supabase SQL Editor → "Run"
-- =============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ORGANIZATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  logo_url      TEXT,
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free','starter','growth','pro','enterprise')),
  plan_seats    INTEGER DEFAULT 1,
  whatsapp_phone_number_id TEXT,
  whatsapp_access_token    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- USERS (recruiters/admins) — linked to auth.users
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT DEFAULT 'recruiter' CHECK (role IN ('superadmin','admin','recruiter','hiring_manager','viewer')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- JOB_ROLES (templates)
-- =============================================================
CREATE TABLE IF NOT EXISTS job_roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID REFERENCES organizations(id),
  title       TEXT NOT NULL,
  category    TEXT,
  description TEXT,
  skills      TEXT[],
  screening_questions JSONB DEFAULT '[]',
  scoring_rubric      JSONB DEFAULT '{}',
  is_template BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- JOBS
-- =============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  created_by        UUID REFERENCES users(id),
  role_id           UUID REFERENCES job_roles(id),
  title             TEXT NOT NULL,
  department        TEXT,
  location          TEXT,
  employment_type   TEXT DEFAULT 'full_time'
                    CHECK (employment_type IN ('full_time','part_time','contract','internship','gig')),
  description       TEXT,
  requirements      TEXT[],
  nice_to_have      TEXT[],
  ctc_min           INTEGER,
  ctc_max           INTEGER,
  experience_min    DECIMAL(3,1),
  experience_max    DECIMAL(3,1),
  screening_questions JSONB DEFAULT '[]',
  status            TEXT DEFAULT 'draft'
                    CHECK (status IN ('draft','active','paused','closed','archived')),
  visibility        TEXT DEFAULT 'public'
                    CHECK (visibility IN ('public', 'link_only')),
  application_deadline DATE,
  chatbot_enabled   BOOLEAN DEFAULT TRUE,
  whatsapp_enabled  BOOLEAN DEFAULT FALSE,
  video_interview_required BOOLEAN DEFAULT FALSE,
  skills_test_required     BOOLEAN DEFAULT FALSE,
  application_count INTEGER DEFAULT 0,
  shortlisted_count INTEGER DEFAULT 0,
  public_slug       TEXT UNIQUE,
  jd_embedding      VECTOR(384),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- CANDIDATES
-- =============================================================
CREATE TABLE IF NOT EXISTS candidates (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id           UUID REFERENCES organizations(id),
  email            TEXT,
  phone            TEXT,
  full_name        TEXT,
  current_location TEXT,
  current_company  TEXT,
  current_title    TEXT,
  total_experience DECIMAL(4,1),
  skills           TEXT[],
  education        JSONB DEFAULT '[]',
  work_experience  JSONB DEFAULT '[]',
  resume_url       TEXT,
  resume_raw_text  TEXT,
  linkedin_url     TEXT,
  github_url       TEXT,
  portfolio_url    TEXT,
  languages        TEXT[] DEFAULT ARRAY['English'],
  resume_embedding VECTOR(384),
  source           TEXT DEFAULT 'application' CHECK (source IN ('application','sourced','referral','agency','walk_in')),
  whatsapp_number  TEXT,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en','hi','ta','te','bn','mr')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'candidates_email_unique'
  ) THEN
    ALTER TABLE candidates ADD CONSTRAINT candidates_email_unique UNIQUE (email);
  END IF;
END $$;

-- =============================================================
-- APPLICATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id    UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'applied'
                  CHECK (status IN ('applied','new','screening','screened','test_pending','test_done',
                    'interview_pending','interview_done','shortlisted','offer_sent','hired',
                    'rejected','withdrawn','on_hold')),
  resume_score    DECIMAL(5,2),
  screening_score DECIMAL(5,2),
  test_score      DECIMAL(5,2),
  video_score     DECIMAL(5,2),
  composite_score DECIMAL(5,2),
  score_breakdown JSONB DEFAULT '{}',
  score_explanation TEXT,
  screening_answers JSONB DEFAULT '[]',
  interview_video_url TEXT,
  transcribed_text TEXT,
  flagged         BOOLEAN DEFAULT FALSE,
  disqualification_reason TEXT,
  recruiter_notes TEXT,
  recruiter_rating INTEGER CHECK (recruiter_rating BETWEEN 1 AND 5),
  is_anonymized   BOOLEAN DEFAULT FALSE,
  applied_at      TIMESTAMPTZ DEFAULT NOW(),
  screened_at     TIMESTAMPTZ,
  shortlisted_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_job_candidate_unique'
  ) THEN
    ALTER TABLE applications ADD CONSTRAINT applications_job_candidate_unique UNIQUE (job_id, candidate_id);
  END IF;
END $$;

-- =============================================================
-- SCREENING_SESSIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS screening_sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id         UUID REFERENCES organizations(id),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  channel        TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web','whatsapp','email','sms')),
  status         TEXT DEFAULT 'in_progress' CHECK (status IN ('pending','in_progress','completed','abandoned','expired')),
  messages       JSONB DEFAULT '[]',
  questions_asked INTEGER DEFAULT 0,
  questions_total INTEGER DEFAULT 0,
  session_score  DECIMAL(5,2),
  state          JSONB DEFAULT '{}',
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ DEFAULT NOW() + INTERVAL '72 hours',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- VIDEO_INTERVIEWS
-- =============================================================
CREATE TABLE IF NOT EXISTS video_interviews (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id),
  questions      JSONB NOT NULL DEFAULT '[]',
  recordings     JSONB DEFAULT '[]',
  transcripts    JSONB DEFAULT '[]',
  video_score    DECIMAL(5,2),
  evaluation     JSONB DEFAULT '{}',
  evaluation_notes TEXT,
  status         TEXT DEFAULT 'pending'
                 CHECK (status IN ('pending','link_sent','in_progress','submitted','evaluated','expired')),
  link_token     TEXT UNIQUE DEFAULT encode(gen_random_bytes(32),'hex'),
  expires_at     TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 days',
  submitted_at   TIMESTAMPTZ,
  evaluated_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- SKILLS_TESTS
-- =============================================================
CREATE TABLE IF NOT EXISTS skills_tests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id         UUID REFERENCES organizations(id),
  job_id         UUID REFERENCES jobs(id),
  title          TEXT NOT NULL,
  description    TEXT,
  questions      JSONB NOT NULL DEFAULT '[]',
  total_marks    INTEGER DEFAULT 100,
  pass_marks     INTEGER DEFAULT 60,
  time_limit_minutes INTEGER DEFAULT 60,
  is_proctored   BOOLEAN DEFAULT FALSE,
  randomize_questions BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id        UUID NOT NULL REFERENCES skills_tests(id),
  application_id UUID NOT NULL REFERENCES applications(id),
  answers        JSONB DEFAULT '[]',
  score          DECIMAL(5,2),
  percentage     DECIMAL(5,2),
  passed         BOOLEAN,
  ai_evaluation  JSONB DEFAULT '{}',
  plagiarism_score DECIMAL(5,2),
  started_at     TIMESTAMPTZ,
  submitted_at   TIMESTAMPTZ,
  time_taken_seconds INTEGER,
  link_token     TEXT UNIQUE DEFAULT encode(gen_random_bytes(32),'hex'),
  expires_at     TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- EMAIL_LOGS
-- =============================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id         UUID REFERENCES organizations(id),
  application_id UUID REFERENCES applications(id),
  recipient_email TEXT NOT NULL,
  template       TEXT NOT NULL,
  resend_id      TEXT,
  status         TEXT DEFAULT 'queued',
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- AUDIT_LOGS
-- =============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  actor_type  TEXT NOT NULL CHECK (actor_type IN ('ai','recruiter','candidate','system')),
  actor_id    TEXT,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- INDEXES (idempotent)
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_composite_score ON applications(composite_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_jobs_org_status ON jobs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_public_slug ON jobs(public_slug);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(org_id, created_at DESC);

-- Vector index (skip if no rows yet — recreate after first load)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_candidates_embedding'
  ) THEN
    CREATE INDEX idx_candidates_embedding ON candidates
      USING ivfflat (resume_embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- =============================================================
-- FUNCTION: match_resume_to_jd
-- =============================================================
CREATE OR REPLACE FUNCTION match_resume_to_jd(resume_embedding VECTOR(384), job_id UUID)
RETURNS REAL
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN resume_embedding IS NULL THEN 0.5
      WHEN (SELECT jd_embedding FROM jobs WHERE id = job_id) IS NULL THEN 0.5
      ELSE GREATEST(0, LEAST(1, 1 - (resume_embedding <=> (SELECT jd_embedding FROM jobs WHERE id = job_id))))
    END;
$$;

-- =============================================================
-- FUNCTION: auto-update updated_at
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orgs_updated_at') THEN
    CREATE TRIGGER update_orgs_updated_at BEFORE UPDATE ON organizations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_jobs_updated_at') THEN
    CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =============================================================
-- FUNCTION: handle_new_auth_user → auto-create users row
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users: can read own row; service role bypasses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='users_self' AND tablename='users') THEN
    CREATE POLICY users_self ON users FOR SELECT USING (id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='users_self_update' AND tablename='users') THEN
    CREATE POLICY users_self_update ON users FOR UPDATE USING (id = auth.uid());
  END IF;
END $$;

-- Organizations: own org only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='organizations_self' AND tablename='organizations') THEN
    CREATE POLICY organizations_self ON organizations
      FOR SELECT USING (id = (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='organizations_self_update' AND tablename='organizations') THEN
    CREATE POLICY organizations_self_update ON organizations
      FOR UPDATE USING (id = (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Jobs: org isolation
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='org_isolation' AND tablename='jobs') THEN
    CREATE POLICY org_isolation ON jobs
      FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Applications: org isolation
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='org_isolation' AND tablename='applications') THEN
    CREATE POLICY org_isolation ON applications
      FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Candidates: org isolation
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='candidates_org_isolation' AND tablename='candidates') THEN
    CREATE POLICY candidates_org_isolation ON candidates
      FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Screening sessions: org isolation
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='screening_org_isolation' AND tablename='screening_sessions') THEN
    CREATE POLICY screening_org_isolation ON screening_sessions
      FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Audit logs: org read-only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='audit_org_read' AND tablename='audit_logs') THEN
    CREATE POLICY audit_org_read ON audit_logs
      FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- =============================================================
-- STORAGE BUCKET: vevia-files (resumes, videos, etc.)
-- Run via Supabase dashboard or this SQL block
-- =============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('vevia-files', 'vevia-files', false)
ON CONFLICT (id) DO NOTHING;

-- Allow service role full access (already implied)
-- Allow authenticated users to upload their own resumes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='allow_auth_upload' AND tablename='objects'
      AND schemaname='storage'
  ) THEN
    CREATE POLICY allow_auth_upload ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'vevia-files');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='allow_auth_read' AND tablename='objects'
      AND schemaname='storage'
  ) THEN
    CREATE POLICY allow_auth_read ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'vevia-files');
  END IF;
END $$;

-- =============================================================
-- SEED: global job_role templates
-- =============================================================
INSERT INTO job_roles (title, category, description, skills, screening_questions, is_template, org_id)
VALUES
  ('Software Engineer', 'tech',
   'Full-stack software engineer role for product teams.',
   ARRAY['JavaScript','TypeScript','React','Node.js','PostgreSQL'],
   '[{"q":"How many years of professional coding experience do you have?","type":"number","weight":0.3},{"q":"Are you comfortable working remotely?","type":"yes_no","weight":0.1,"preferred_yes":true},{"q":"Which of these best describes your React experience?","type":"mcq","weight":0.4,"options":[{"id":"a","title":"< 1 year","ideal":false},{"id":"b","title":"1-3 years","ideal":false},{"id":"c","title":"3+ years","ideal":true}]}]'::jsonb,
   true, NULL),

  ('Business Development Manager', 'sales',
   'BD role focused on enterprise client acquisition.',
   ARRAY['B2B Sales','CRM','Negotiation','Lead Generation'],
   '[{"q":"Have you handled enterprise accounts with ARR above ₹50L?","type":"yes_no","weight":0.4,"preferred_yes":true},{"q":"What CRM tools have you used?","type":"short_text","weight":0.2}]'::jsonb,
   true, NULL),

  ('HR Executive', 'hr',
   'HR generalist role covering recruitment and employee relations.',
   ARRAY['Recruitment','Payroll','HRMS','Compliance'],
   '[{"q":"Are you currently in Bengaluru or willing to relocate?","type":"yes_no","weight":0.3,"preferred_yes":true}]'::jsonb,
   true, NULL),

  ('Operations Manager', 'ops',
   'Operations leadership for logistics or service business.',
   ARRAY['Process Improvement','Logistics','ERP','P&L Management'],
   '[{"q":"Have you managed a team of 20+ people?","type":"yes_no","weight":0.5,"preferred_yes":true}]'::jsonb,
   true, NULL),

  ('Data Analyst', 'tech',
   'Data analyst for business intelligence and reporting.',
   ARRAY['SQL','Python','Excel','Tableau','Power BI'],
   '[{"q":"Are you proficient in SQL?","type":"yes_no","weight":0.4,"preferred_yes":true},{"q":"Years of data analysis experience?","type":"number","weight":0.3}]'::jsonb,
   true, NULL),

  ('Product Manager', 'tech',
   'Product manager to define roadmap and drive delivery.',
   ARRAY['Roadmapping','User Research','Agile','Data Analysis','Stakeholder Management'],
   '[{"q":"Have you shipped a product from 0 to 1?","type":"yes_no","weight":0.5,"preferred_yes":true}]'::jsonb,
   true, NULL)

ON CONFLICT DO NOTHING;

-- =============================================================
-- DONE
-- =============================================================
SELECT 'Vevia schema setup complete' AS status;
