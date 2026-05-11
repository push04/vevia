-- Add visibility column to jobs table (public | link_only)
-- Planned in issue #4: Job Visibility (3-State Model)

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public'
  CHECK (visibility IN ('draft', 'public', 'link_only'));
