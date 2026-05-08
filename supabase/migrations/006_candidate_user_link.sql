-- Link candidates to auth.users so dashboard matching is by user_id, not email

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);

-- When a new auth user signs up, link any existing candidate record with matching email
CREATE OR REPLACE FUNCTION public.link_candidate_to_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.candidates
  SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_link_candidate ON auth.users;
CREATE TRIGGER on_auth_user_created_link_candidate
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_candidate_to_user();
