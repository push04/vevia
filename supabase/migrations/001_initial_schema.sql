-- Generated from top-level README.MD (Section 6: Database Schema)

-- ============================================================
-- SCHEMA: vevia
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy text search

-- ============================================================
-- TABLE: organizations
-- Multi-tenant: each company is one org
-- ============================================================
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,           -- used in URLs: vevia.ai/org/tcs
  logo_url      TEXT,
  plan          TEXT DEFAULT 'free'             -- 'free' | 'starter' | 'growth' | 'pro' | 'enterprise'
                CHECK (plan IN ('free', 'starter', 'growth', 'pro', 'enterprise')),
  plan_seats    INTEGER DEFAULT 1,
  whatsapp_phone_number_id  TEXT,               -- Meta WhatsApp Business API
  whatsapp_access_token     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: users (recruiters / admins)
-- Linked to Supabase Auth via id = auth.users.id
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  role          TEXT DEFAULT 'recruiter'
                CHECK (role IN ('superadmin', 'admin', 'recruiter', 'hiring_manager', 'viewer')),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: job_roles
-- Master list of role templates (e.g. "Software Engineer", "BDM")
-- ============================================================
CREATE TABLE job_roles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID REFERENCES organizations(id),   -- NULL = global template
  title         TEXT NOT NULL,
  category      TEXT,                                -- 'tech' | 'sales' | 'ops' | 'hr' | 'finance'
  description   TEXT,
  skills        TEXT[],                              -- ["React", "Node.js", "TypeScript"]
  screening_questions JSONB DEFAULT '[]',            -- [{q, type, weight, ideal_answer}]
  scoring_rubric      JSONB DEFAULT '{}',            -- {skills: 0.4, experience: 0.3, culture: 0.3}
  is_template   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: jobs
-- Individual job postings
-- ============================================================
CREATE TABLE jobs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  created_by        UUID REFERENCES users(id),
  role_id           UUID REFERENCES job_roles(id),
  title             TEXT NOT NULL,
  department        TEXT,
  location          TEXT,                            -- "Remote" | "Bengaluru, Karnataka" | "Hybrid - Mumbai"
  employment_type   TEXT DEFAULT 'full_time'
                    CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'gig')),
  description       TEXT,                            -- Rich text / Markdown
  requirements      TEXT[],
  nice_to_have      TEXT[],
  ctc_min           INTEGER,                         -- In INR (annual)
  ctc_max           INTEGER,
  experience_min    DECIMAL(3,1),                    -- years
  experience_max    DECIMAL(3,1),
  screening_questions JSONB DEFAULT '[]',            -- Overrides role template if set
  status            TEXT DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'paused', 'closed', 'archived')),
  application_deadline  DATE,
  chatbot_enabled   BOOLEAN DEFAULT TRUE,
  whatsapp_enabled  BOOLEAN DEFAULT FALSE,
  video_interview_required BOOLEAN DEFAULT FALSE,
  skills_test_required     BOOLEAN DEFAULT FALSE,
  application_count INTEGER DEFAULT 0,
  shortlisted_count INTEGER DEFAULT 0,
  public_slug       TEXT UNIQUE,                     -- for shareable link: vevia.ai/apply/xyz
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: candidates
-- Anyone who has applied or been sourced
-- ============================================================
CREATE TABLE candidates (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id            UUID REFERENCES organizations(id),
  email           TEXT,
  phone           TEXT,
  full_name       TEXT,
  current_location TEXT,
  current_company TEXT,
  current_title   TEXT,
  total_experience DECIMAL(4,1),                    -- years
  skills          TEXT[],
  education       JSONB DEFAULT '[]',               -- [{degree, institution, year, percentage}]
  work_experience JSONB DEFAULT '[]',               -- [{company, title, duration, responsibilities}]
  resume_url      TEXT,                             -- Supabase storage path
  resume_raw_text TEXT,                             -- Extracted text for LLM processing
  linkedin_url    TEXT,
  github_url      TEXT,
  portfolio_url   TEXT,
  languages       TEXT[] DEFAULT ARRAY['English'],  -- Spoken languages
  resume_embedding VECTOR(384),                     -- all-MiniLM-L6-v2 embeddings (384 dims)
  source          TEXT DEFAULT 'application'
                  CHECK (source IN ('application', 'sourced', 'referral', 'agency', 'walk_in')),
  whatsapp_number TEXT,
  preferred_language TEXT DEFAULT 'en'
                  CHECK (preferred_language IN ('en', 'hi', 'ta', 'te', 'bn', 'mr')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE candidates
  ADD CONSTRAINT candidates_email_unique UNIQUE (email);

-- ============================================================
-- TABLE: applications
-- Candidate applies to a job
-- ============================================================
CREATE TABLE applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id    UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'applied'
                  CHECK (status IN ('applied', 'screening', 'interview', 'test', 'shortlisted', 'rejected', 'hired')),
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
  flagged          BOOLEAN DEFAULT FALSE,
  disqualification_reason TEXT,
  applied_at       TIMESTAMPTZ DEFAULT NOW(),
  screened_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: screening_sessions
-- Track chatbot/WhatsApp screening state for an application
-- ============================================================
CREATE TABLE screening_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  channel         TEXT NOT NULL CHECK (channel IN ('web', 'whatsapp')),
  status          TEXT DEFAULT 'in_progress'
                  CHECK (status IN ('in_progress', 'completed', 'expired')),
  state           JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: video_interviews
-- Video interview sessions + evaluation
-- ============================================================
CREATE TABLE video_interviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id),
  questions       JSONB NOT NULL DEFAULT '[]',      -- [{question, time_limit_seconds}]
  recordings      JSONB DEFAULT '[]',               -- [{question_idx, storage_path, duration_s}]
  transcripts     JSONB DEFAULT '[]',               -- [{question_idx, transcript, groq_response}]
  video_score     DECIMAL(5,2),
  evaluation      JSONB DEFAULT '{}',               -- {communication: 80, confidence: 75, ...}
  evaluation_notes TEXT,
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending', 'link_sent', 'in_progress', 'submitted', 'evaluated', 'expired')),
  link_token      TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 days',
  submitted_at    TIMESTAMPTZ,
  evaluated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: skills_tests
-- Coding/MCQ/open-ended assessments
-- ============================================================
CREATE TABLE skills_tests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID REFERENCES organizations(id),
  job_id          UUID REFERENCES jobs(id),
  title           TEXT NOT NULL,
  description     TEXT,
  questions       JSONB NOT NULL DEFAULT '[]',
  total_marks     INTEGER DEFAULT 100,
  pass_marks      INTEGER DEFAULT 60,
  time_limit_minutes INTEGER DEFAULT 60,
  is_proctored    BOOLEAN DEFAULT FALSE,
  randomize_questions BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE test_attempts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id         UUID NOT NULL REFERENCES skills_tests(id),
  application_id  UUID NOT NULL REFERENCES applications(id),
  answers         JSONB DEFAULT '[]',
  score           DECIMAL(5,2),
  percentage      DECIMAL(5,2),
  passed          BOOLEAN,
  ai_evaluation   JSONB DEFAULT '{}',
  plagiarism_score DECIMAL(5,2),
  started_at      TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ,
  time_taken_seconds INTEGER,
  link_token      TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: email_logs
-- Track all outbound emails
-- ============================================================
CREATE TABLE email_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID REFERENCES organizations(id),
  application_id  UUID REFERENCES applications(id),
  recipient_email TEXT NOT NULL,
  template        TEXT NOT NULL,
  resend_id       TEXT,
  status          TEXT DEFAULT 'queued',
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: audit_logs
-- Compliance: track every AI decision + recruiter action
-- ============================================================
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('ai', 'recruiter', 'candidate', 'system')),
  actor_id        TEXT,
  action          TEXT NOT NULL,
  target_type     TEXT,
  target_id       UUID,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_composite_score ON applications(composite_score DESC);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX idx_jobs_org_status ON jobs(org_id, status);
CREATE INDEX idx_jobs_public_slug ON jobs(public_slug);

CREATE INDEX idx_candidates_embedding ON candidates
  USING ivfflat (resume_embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Multi-tenant isolation
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON jobs
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_isolation" ON applications
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "candidate_self" ON applications
  FOR SELECT USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE email = auth.email()
    )
  );
