"use server";

import { redirect } from "next/navigation";

import { requireEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);
}

export async function createOrgAndBindAction(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const name = String(formData.get("org_name") ?? "").trim();
  const slugInput = String(formData.get("org_slug") ?? "").trim();
  if (!name) throw new Error("Missing organization name");

  const slug = slugify(slugInput || name);
  if (!slug) throw new Error("Invalid slug");

  const admin = createAdminClient();

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name, slug })
    .select("id")
    .single();
  if (orgError || !org) throw new Error(orgError?.message ?? "Failed to create org");

  const { error: userError } = await admin
    .from("users")
    .update({ org_id: org.id, is_active: true, role: "admin" })
    .eq("id", user.id);
  if (userError) throw new Error(userError.message);

  redirect("/dashboard");
}

