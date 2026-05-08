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
  const admin = createAdminClient();

  let candidate = await admin
    .from("candidates")
    .select("id, full_name")
    .eq("user_id", authUserId)
    .maybeSingle().then(r => r.data);

  if (!candidate && email) {
    candidate = await admin
      .from("candidates")
      .select("id, full_name")
      .eq("email", email)
      .maybeSingle().then(r => r.data ?? null);
  }

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
  const authUserId = userData.user.id;
  const admin = createAdminClient();

  let candidate = await admin
    .from("candidates")
    .select("id, full_name")
    .eq("user_id", authUserId)
    .maybeSingle().then(r => r.data);

  if (!candidate && email) {
    candidate = await admin
      .from("candidates")
      .select("id, full_name")
      .eq("email", email)
      .maybeSingle().then(r => r.data ?? null);
  }

  return {
    authUserId,
    email,
    candidateId: candidate?.id ?? null,
    fullName: candidate?.full_name ?? null,
  };
}
