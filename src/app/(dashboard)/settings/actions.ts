"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateOrgAction(formData: FormData) {
  const supabase = await createClient();
  const orgId = formData.get("org_id") as string;
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  await supabase
    .from("organizations")
    .update({ name, slug, updated_at: new Date().toISOString() })
    .eq("id", orgId);

  revalidatePath("/settings");
}
