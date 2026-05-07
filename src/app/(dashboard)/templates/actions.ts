"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createJobFromTemplateAction(formData: FormData) {
  const supabase = await createClient();
  const roleId = formData.get("role_id") as string;
  const orgId = formData.get("org_id") as string;
  const createdBy = formData.get("created_by") as string;

  const { data: role } = await supabase
    .from("job_roles")
    .select("*")
    .eq("id", roleId)
    .single();

  if (!role) return;

  const slug = `${role.title.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;

  const { data: job } = await supabase
    .from("jobs")
    .insert({
      org_id: orgId,
      created_by: createdBy,
      role_id: roleId,
      title: role.title,
      description: role.description,
      screening_questions: role.screening_questions ?? [],
      status: "draft",
      public_slug: slug,
    } as any)
    .select()
    .single();

  if (job) redirect(`/jobs/${job.id}`);
}
