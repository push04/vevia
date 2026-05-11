-- =============================================================
-- VEVIA — AUDIT FIXES (idempotent, safe to re-run)
-- Run this in Supabase SQL Editor after 000_run_all.sql
-- =============================================================

-- =============================================================
-- 1. RPC: apply_score_and_audit (transactional scoring)
-- =============================================================
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
  UPDATE applications
  SET
    resume_score = p_resume_score,
    composite_score = p_composite_score,
    score_breakdown = p_score_breakdown,
    score_explanation = p_score_explanation,
    screened_at = NOW()
  WHERE id = p_application_id;

  INSERT INTO audit_logs (org_id, actor_type, actor_id, action, target_type, target_id, metadata)
  VALUES (p_org_id, p_actor_type, p_actor_id, 'composite_score_calculated', 'application', p_application_id, p_metadata);
END;
$$;

-- =============================================================
-- 2. Enable RLS on unprotected tables
-- =============================================================
ALTER TABLE IF EXISTS job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS video_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS skills_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='job_roles_org_isolation' AND tablename='job_roles') THEN
    CREATE POLICY job_roles_org_isolation ON job_roles
      FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='video_interviews_app_isolation' AND tablename='video_interviews') THEN
    CREATE POLICY video_interviews_app_isolation ON video_interviews
      FOR ALL USING (
        application_id IN (
          SELECT id FROM applications WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='skills_tests_org_isolation' AND tablename='skills_tests') THEN
    CREATE POLICY skills_tests_org_isolation ON skills_tests
      FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='test_attempts_app_isolation' AND tablename='test_attempts') THEN
    CREATE POLICY test_attempts_app_isolation ON test_attempts
      FOR ALL USING (
        application_id IN (
          SELECT id FROM applications WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='email_logs_org_isolation' AND tablename='email_logs') THEN
    CREATE POLICY email_logs_org_isolation ON email_logs
      FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- =============================================================
-- 3. Missing FK indexes
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_applications_org_id ON applications(org_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidates_org_id ON candidates(org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org_id ON jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_screening_sessions_org_id ON screening_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_screening_sessions_application_id ON screening_sessions(application_id);
CREATE INDEX IF NOT EXISTS idx_video_interviews_application_id ON video_interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_skills_tests_org_id ON skills_tests(org_id);
CREATE INDEX IF NOT EXISTS idx_skills_tests_job_id ON skills_tests(job_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_application_id ON test_attempts(application_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_org_id ON email_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_application_id ON email_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);

-- =============================================================
-- 4. Add updated_at triggers for tables missing them
-- =============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_candidates_updated_at') THEN
    CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_applications_updated_at') THEN
    CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_screening_sessions_updated_at') THEN
    CREATE TRIGGER update_screening_sessions_updated_at BEFORE UPDATE ON screening_sessions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =============================================================
-- DONE
-- =============================================================
SELECT 'Audit fixes applied successfully' AS status;
