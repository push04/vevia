import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CandidateContext = {
  authUserId: string;
  email: string;
  candidateId: string | null;
  fullName: string | null;
};

export async function getCandidateContext(): Promise<CandidateContext> {
  const supabase = await createClient();
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) redirect("/candidate/login");

  const email = userData.user.email ?? "";
  const authUserId = userData.user.id;

  // Look up candidate by email (no org_id required)
  const admin = createAdminClient();
  const { data: candidate } = await admin
    .from("candidates")
    .select("id, full_name")
    .eq("email", email)
    .maybeSingle();

  return {
    authUserId,
    email,
    candidateId: candidate?.id ?? null,
    fullName: candidate?.full_name ?? null,
  };
}

export async function getOptionalCandidateContext(): Promise<CandidateContext | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;

  const email = userData.user.email ?? "";
  const admin = createAdminClient();
  const { data: candidate } = await admin
    .from("candidates")
    .select("id, full_name")
    .eq("email", email)
    .maybeSingle();

  return {
    authUserId: userData.user.id,
    email,
    candidateId: candidate?.id ?? null,
    fullName: candidate?.full_name ?? null,
  };
}
