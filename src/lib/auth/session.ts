import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type RecruiterContext = {
  userId: string;
  email: string;
  orgId: string;
  fullName: string | null;
  role: string | null;
  orgName: string | null;
};

export async function requireRecruiterContext(): Promise<RecruiterContext> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect("/login");

  const userId = userData.user.id;
  const email = userData.user.email ?? "";

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("org_id, full_name, role, is_active")
    .eq("id", userId)
    .single();

  if (profileError || profile?.is_active === false) {
    redirect("/login?error=profile");
  }

  if (!profile?.org_id) {
    redirect("/onboarding");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", profile.org_id)
    .single();

  return {
    userId,
    email,
    orgId: profile.org_id,
    fullName: profile.full_name,
    role: profile.role,
    orgName: org?.name ?? null,
  };
}
