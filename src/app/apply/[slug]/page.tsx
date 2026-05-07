import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApplyForm } from "@/components/apply/ApplyForm";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: job } = await supabase.from("jobs").select("title").eq("public_slug", slug).single();
  return { title: job ? `Apply for ${job.title} — Vevia` : "Apply — Vevia" };
}

export default async function ApplyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, title, description, location, employment_type, experience_min, experience_max, requirements, screening_questions, status, org_id")
    .eq("public_slug", slug)
    .eq("status", "active")
    .single();

  if (error || !job) notFound();

  const { data: org } = await supabase
    .from("organizations")
    .select("name, logo_url")
    .eq("id", job.org_id)
    .single();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#eff6ff] py-lg px-sm">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-lg">
          <div className="inline-flex items-center gap-xs px-sm py-2xs rounded-full border border-outline-variant bg-white text-text-secondary text-xs mb-md shadow-sm">
            <span className="material-symbols-outlined text-[14px] text-primary">smart_toy</span>
            AI-powered screening — results in minutes
          </div>
          <h1 className="font-display text-[32px] font-bold text-primary leading-tight">{job.title}</h1>
          {org?.name && (
            <div className="flex items-center justify-center gap-xs text-text-secondary text-sm mt-xs">
              <span className="material-symbols-outlined text-[16px]">business</span>
              {org.name}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-sm mt-sm">
            {job.location && (
              <span className="flex items-center gap-1 text-text-secondary text-xs">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                {job.location}
              </span>
            )}
            {job.employment_type && (
              <span className="flex items-center gap-1 text-text-secondary text-xs capitalize">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {job.employment_type.replace("_", " ")}
              </span>
            )}
            {(job.experience_min != null || job.experience_max != null) && (
              <span className="flex items-center gap-1 text-text-secondary text-xs">
                <span className="material-symbols-outlined text-[14px]">work_history</span>
                {job.experience_min ?? 0}{job.experience_max ? `–${job.experience_max}` : "+"} yrs exp
              </span>
            )}
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl border border-outline-variant shadow-lg p-lg">
          {job.description && (
            <div className="mb-lg">
              <h2 className="font-semibold text-primary text-base mb-xs">About this role</h2>
              <p className="text-text-secondary text-sm leading-relaxed line-clamp-4">{job.description}</p>
            </div>
          )}

          {(job.requirements?.length ?? 0) > 0 && (
            <div className="mb-lg">
              <h2 className="font-semibold text-primary text-base mb-xs">Requirements</h2>
              <ul className="space-y-xs">
                {job.requirements!.slice(0, 6).map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-xs text-sm text-text-secondary">
                    <span className="material-symbols-outlined text-primary text-[14px] mt-0.5">check_circle</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-outline-variant pt-lg">
            <h2 className="font-semibold text-primary text-base mb-md">Apply now</h2>
            <ApplyForm
              job={{
                id: job.id,
                title: job.title,
                description: job.description,
                location: job.location,
                employment_type: job.employment_type,
                experience_min: job.experience_min,
                experience_max: job.experience_max,
                requirements: job.requirements,
                screening_questions: Array.isArray(job.screening_questions) ? (job.screening_questions as { q: string; type: string }[]) : [],
              }}
              slug={slug}
            />
          </div>
        </div>

        <p className="text-center text-xs text-text-secondary mt-md">
          Powered by Vevia — India&apos;s agentic hiring intelligence platform
        </p>
      </div>
    </div>
  );
}
