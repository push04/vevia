"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateOrgAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const orgId = formData.get("org_id") as string;
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  if (!orgId || !name) throw new Error("Missing required fields");

  const { data: currentOrg } = await admin
    .from("organizations")
    .select("slug")
    .eq("id", orgId)
    .single();

  if (currentOrg && currentOrg.slug !== slug) {
    const { data: existing } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .neq("id", orgId)
      .single();
    
    if (existing) {
      throw new Error("Organization slug already exists. Please choose a different slug.");
    }
  }

  const { error } = await supabase
    .from("organizations")
    .update({ name, slug, updated_at: new Date().toISOString() })
    .eq("id", orgId);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}
