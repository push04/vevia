-- Security + constraints added after initial schema generation

-- ============================================================
-- RLS: users (self-access) + organizations (own org) + candidates (org isolation)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'users_self'
  ) THEN
    CREATE POLICY "users_self" ON public.users
      FOR SELECT USING (id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'organizations_self'
  ) THEN
    CREATE POLICY "organizations_self" ON public.organizations
      FOR SELECT USING (
        id = (SELECT org_id FROM public.users WHERE id = auth.uid())
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'candidates'
      AND policyname = 'candidates_org_isolation'
  ) THEN
    CREATE POLICY "candidates_org_isolation" ON public.candidates
      FOR ALL USING (
        org_id = (SELECT org_id FROM public.users WHERE id = auth.uid())
      );
  END IF;
END $$;

-- ============================================================
-- Constraints: prevent duplicate applications per job+candidate
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'applications_job_candidate_unique'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_job_candidate_unique UNIQUE (job_id, candidate_id);
  END IF;
END $$;

