-- =============================================================
-- VEVIA — RUN THIS IN SUPABASE DASHBOARD SQL EDITOR
-- Copy and paste this entire file into:
--   https://supabase.com/dashboard/project/uarkrflngwwnhsqnahbz/sql/new
-- Run all migrations in order: 000 through 008
-- =============================================================

-- Migration 000: Master schema setup (idempotent)
-- Already run? If yes, skip. Run if starting fresh.
--\i 000_run_all.sql

-- Migration 001-007: Incremental migrations
-- Already applied. 008 contains all remaining fixes.

-- =============================================================
-- Migration 008: Final fixes
-- =============================================================

-- 1. Fix applications.status CHECK constraint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_status_check'
    AND pg_get_constraintdef(oid) NOT LIKE '%test_pending%'
  ) THEN
    ALTER TABLE applications DROP CONSTRAINT applications_status_check;
    ALTER TABLE applications ADD CONSTRAINT applications_status_check
      CHECK (status IN ('applied','new','screening','screened','test_pending','test_done',
        'interview_pending','interview_done','shortlisted','offer_sent','hired',
        'rejected','withdrawn','on_hold'));
  END IF;
END $$;

-- 2. Fix screening_sessions.status CHECK constraint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'screening_sessions_status_check'
    AND pg_get_constraintdef(oid) NOT LIKE '%abandoned%'
  ) THEN
    ALTER TABLE screening_sessions DROP CONSTRAINT screening_sessions_status_check;
    ALTER TABLE screening_sessions ADD CONSTRAINT screening_sessions_status_check
      CHECK (status IN ('pending','in_progress','completed','abandoned','expired'));
  END IF;
END $$;

-- 3. Fix screening_sessions.channel CHECK constraint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'screening_sessions_channel_check'
    AND pg_get_constraintdef(oid) NOT LIKE '%email%'
  ) THEN
    ALTER TABLE screening_sessions DROP CONSTRAINT screening_sessions_channel_check;
    ALTER TABLE screening_sessions ADD CONSTRAINT screening_sessions_channel_check
      CHECK (channel IN ('web','whatsapp','email','sms'));
  END IF;
END $$;

-- 4. Add jd_embedding column if missing, then vector index
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'jd_embedding'
  ) THEN
    ALTER TABLE jobs ADD COLUMN jd_embedding VECTOR(384);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_jobs_jd_embedding'
  ) THEN
    CREATE INDEX idx_jobs_jd_embedding ON jobs
      USING ivfflat (jd_embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- 5. CHECK constraints on score columns
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_resume_score_check') THEN ALTER TABLE applications ADD CONSTRAINT applications_resume_score_check CHECK (resume_score IS NULL OR (resume_score >= 0 AND resume_score <= 100)); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_screening_score_check') THEN ALTER TABLE applications ADD CONSTRAINT applications_screening_score_check CHECK (screening_score IS NULL OR (screening_score >= 0 AND screening_score <= 100)); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_test_score_check') THEN ALTER TABLE applications ADD CONSTRAINT applications_test_score_check CHECK (test_score IS NULL OR (test_score >= 0 AND test_score <= 100)); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_video_score_check') THEN ALTER TABLE applications ADD CONSTRAINT applications_video_score_check CHECK (video_score IS NULL OR (video_score >= 0 AND video_score <= 100)); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_composite_score_check') THEN ALTER TABLE applications ADD CONSTRAINT applications_composite_score_check CHECK (composite_score IS NULL OR (composite_score >= 0 AND composite_score <= 100)); END IF; END $$;

-- 6. Candidate self-access RLS policies
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='candidates_self_access' AND tablename='candidates') THEN CREATE POLICY candidates_self_access ON candidates FOR SELECT USING (user_id = auth.uid() OR email = auth.email()); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='applications_candidate_self' AND tablename='applications') THEN CREATE POLICY applications_candidate_self ON applications FOR SELECT USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = auth.uid() OR email = auth.email())); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='screening_candidate_self' AND tablename='screening_sessions') THEN CREATE POLICY screening_candidate_self ON screening_sessions FOR SELECT USING (application_id IN (SELECT a.id FROM applications a JOIN candidates c ON c.id = a.candidate_id WHERE c.user_id = auth.uid() OR c.email = auth.email())); END IF; END $$;

-- 7. ON DELETE CASCADE for missing FKs
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'video_interviews_application_id_fkey' AND constraint_type = 'FOREIGN KEY') THEN ALTER TABLE video_interviews DROP CONSTRAINT video_interviews_application_id_fkey; ALTER TABLE video_interviews ADD CONSTRAINT video_interviews_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'test_attempts_test_id_fkey' AND constraint_type = 'FOREIGN KEY') THEN ALTER TABLE test_attempts DROP CONSTRAINT test_attempts_test_id_fkey; ALTER TABLE test_attempts ADD CONSTRAINT test_attempts_test_id_fkey FOREIGN KEY (test_id) REFERENCES skills_tests(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'test_attempts_application_id_fkey' AND constraint_type = 'FOREIGN KEY') THEN ALTER TABLE test_attempts DROP CONSTRAINT test_attempts_application_id_fkey; ALTER TABLE test_attempts ADD CONSTRAINT test_attempts_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'email_logs_application_id_fkey' AND constraint_type = 'FOREIGN KEY') THEN ALTER TABLE email_logs DROP CONSTRAINT email_logs_application_id_fkey; ALTER TABLE email_logs ADD CONSTRAINT email_logs_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE; END IF; END $$;

-- 8. apply_score_and_audit RPC with auth check
CREATE OR REPLACE FUNCTION public.apply_score_and_audit(
  p_application_id UUID,
  p_org_id UUID,
  p_resume_score DECIMAL,
  p_composite_score DECIMAL,
  p_score_breakdown JSONB,
  p_score_explanation TEXT,
  p_actor_type TEXT,
  p_actor_id TEXT,
  p_metadata JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND org_id = p_org_id
    AND role IN ('admin', 'recruiter', 'hiring_manager', 'superadmin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: caller does not belong to target org';
  END IF;
  UPDATE applications SET
    resume_score = p_resume_score, composite_score = p_composite_score,
    score_breakdown = p_score_breakdown, score_explanation = p_score_explanation,
    screened_at = NOW()
  WHERE id = p_application_id;
  INSERT INTO audit_logs (org_id, actor_type, actor_id, action, target_type, target_id, metadata)
  VALUES (p_org_id, p_actor_type, p_actor_id, 'composite_score_calculated', 'application', p_application_id, p_metadata);
END;
$$;

SELECT 'Migration 008 applied successfully' AS status;
