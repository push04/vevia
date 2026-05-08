import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ApplyForm } from "@/components/apply/ApplyForm";
import { SaveJobOnView } from "@/components/apply/SaveJobOnView";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: job } = await supabase.from("jobs").select("title").eq("public_slug", slug).single();
  return { title: job ? `Apply for ${job.title} | Vevia` : "Apply | Vevia" };
}

export default async function ApplyPage({ params }: Props) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: job, error } = await admin
    .from("jobs")
    .select("id, title, description, location, employment_type, experience_min, experience_max, requirements, screening_questions, status, visibility, org_id")
    .eq("public_slug", slug)
    .not("status", "eq", "archived")
    .single();

  if (error || !job) notFound();

  const { data: org } = await admin
    .from("organizations")
    .select("name, logo_url")
    .eq("id", job.org_id)
    .single();

  // If job is link_only and user is logged in as candidate → record view in their dashboard
  if (job.status === "active" && job.visibility === "link_only") {
    try {
      const supabase = await createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email) {
        // Find the candidate record by email
        const { data: candidate } = await admin
          .from("candidates")
          .select("id")
          .eq("email", userData.user.email)
          .maybeSingle();

        if (candidate) {
          // Upsert a "saved job" entry — we'll store it as a special interest in applications
          // Only if they haven't already applied
          const { data: existing } = await admin
            .from("applications")
            .select("id")
            .eq("job_id", job.id)
            .eq("candidate_id", candidate.id)
            .maybeSingle();

          // We just note the view — actual application is on submit.
          // For now, save to localStorage via a client-side mechanism.
          // The full auto-save happens server-side on apply submit.
          void existing; // suppress unused variable
        }
      }
    } catch {
      // Silent fail — don't block page load
    }
  }

  const isAccepting = job.status === "active";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#eff6ff] py-lg px-sm">
      <div className="max-w-2xl mx-auto">
        {/* Auto-save to candidate dashboard for link_only jobs */}
      {job.visibility === "link_only" && job.status === "active" && (
        <SaveJobOnView slug={slug} jobTitle={job.title} />
      )}

      {/* Not accepting banner */}
        {!isAccepting && (
          <div className={`mb-md rounded-2xl border p-md flex items-start gap-sm ${
            job.status === "draft"
              ? "bg-amber-50 border-amber-200"
              : "bg-gray-50 border-gray-200"
          }`}>
            <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">warning</span>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {job.status === "paused" ? "Applications paused" : job.status === "closed" ? "Position closed" : "Not yet published"}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {job.status === "paused"
                  ? "This role is temporarily not accepting new applications."
                  : job.status === "closed"
                  ? "This position is no longer accepting applications."
                  : "This job listing is not yet live. Check back later."}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-lg">
          <div className="inline-flex items-center gap-xs px-sm py-2xs rounded-full border border-outline-variant bg-white text-text-secondary text-xs mb-md shadow-sm">
            <span className="material-symbols-outlined text-[14px] text-primary">smart_toy</span>
            AI-powered screening: results in minutes
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
              <p className="text-text-secondary text-sm leading-relaxed">{job.description}</p>
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
            {isAccepting ? (
              <>
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
              </>
            ) : (
              <div className="text-center py-md">
                <span className="material-symbols-outlined text-gray-300 text-[48px] block">lock</span>
                <p className="text-gray-500 font-medium mt-2">Applications not currently open</p>
                <Link href="/candidate/jobs" className="mt-md inline-flex items-center gap-xs text-primary text-sm hover:underline">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Browse other openings
                </Link>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-text-secondary mt-md">
          Powered by Vevia, India&apos;s agentic hiring intelligence platform
        </p>
      </div>
    </div>
  );
}
