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

  let profile = null;

  // Attempt 1: Fetch with regular client (respects RLS)
  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .select("org_id, full_name, role, is_active")
    .eq("id", userId)
    .single();

  if (profileError && profileError.code === "PGRST116") {
    // Attempt 2: Fallback to Admin Client (bypasses RLS)
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createAdminClient();
    
    // First check if it actually exists but was hidden by RLS
    const { data: adminProfileData } = await adminSupabase
      .from("users")
      .select("org_id, full_name, role, is_active")
      .eq("id", userId)
      .single();

    if (adminProfileData) {
      // It existed, RLS just hid it. We will use it.
      profile = adminProfileData;
    } else {
      // It truly does not exist. Create it via Upsert.
      const { data: newProfile, error: upsertError } = await adminSupabase
        .from("users")
        .upsert({
          id: userId,
          email: email,
        })
        .select("org_id, full_name, role, is_active")
        .single();

      if (upsertError) {
        console.error("[Auth] Failed to auto-create profile via Upsert:", upsertError);
        redirect(`/login?error=profile_creation_failed&details=${encodeURIComponent(upsertError.message)}`);
      }
      profile = newProfile;
    }
  } else if (profileError) {
    console.error("[Auth] Failed to fetch profile:", profileError);
    redirect("/login?error=profile_fetch_failed");
  } else {
    profile = profileData;
  }

  if (profile?.is_active === false) {
    redirect("/login?error=account_disabled");
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
