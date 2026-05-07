"use server";

import { revalidatePath } from "next/cache";

import { requireRecruiterContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

export async function createJobAction(formData: FormData) {
  const ctx = await requireRecruiterContext();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const requirementsRaw = String(formData.get("requirements") ?? "").trim();

  if (!title) throw new Error("Missing title");

  const requirements = requirementsRaw
    ? requirementsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 50)
    : null;

  const publicSlug = `${slugify(title)}-${randomSuffix()}`;

  const now = new Date().toISOString();
  const { error } = await supabase.from("jobs").insert({
    org_id: ctx.orgId,
    title,
    description: description || null,
    requirements,
    status: "draft",
    public_slug: publicSlug,
    created_at: now,
    updated_at: now,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/jobs");
}

