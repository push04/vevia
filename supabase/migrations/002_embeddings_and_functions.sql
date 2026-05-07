-- Add embeddings support for resume↔JD matching

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS jd_embedding VECTOR(384);

-- Similarity helper: 1 - cosine distance = cosine similarity (range ~[-1, 1])
CREATE OR REPLACE FUNCTION match_resume_to_jd(resume_embedding VECTOR(384), job_id UUID)
RETURNS REAL
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN resume_embedding IS NULL THEN 0
      WHEN (SELECT jd_embedding FROM jobs WHERE id = job_id) IS NULL THEN 0
      ELSE 1 - (resume_embedding <=> (SELECT jd_embedding FROM jobs WHERE id = job_id))
    END;
$$;

