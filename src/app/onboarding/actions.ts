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

function generateUniqueSlug(baseSlug: string): string {
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${suffix}`;
}

async function ensureUniqueSlug(admin: ReturnType<typeof createAdminClient>, slug: string): Promise<string> {
  const { data: existing } = await admin
    .from("organizations")
    .select("slug")
    .eq("slug", slug)
    .single();
  
  if (existing) {
    return generateUniqueSlug(slug);
  }
  return slug;
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

  let slug = slugify(slugInput || name);
  if (!slug) throw new Error("Invalid slug");

  const admin = createAdminClient();
  
  slug = await ensureUniqueSlug(admin, slug);

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

