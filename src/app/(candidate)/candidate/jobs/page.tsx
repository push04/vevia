import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CandidateJobsPage() {
  const admin = createAdminClient();

  const { data: jobs } = await admin
    .from("jobs")
    .select("id, title, description, location, employment_type, experience_min, experience_max, public_slug, created_at, organizations(name)")
    .eq("status", "active")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Open Positions</h1>
        <p className="text-gray-500 mt-1">Browse all available roles and apply directly.</p>
      </div>

      {!jobs?.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <span className="material-symbols-outlined text-gray-300 text-[64px] block">work_off</span>
          <p className="text-gray-500 mt-3">No open positions right now. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const org = job.organizations as unknown as { name: string } | null;
            return (
              <Link
                key={job.id}
                href={job.public_slug ? `/apply/${job.public_slug}` : "#"}
                className="group block bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors truncate">{job.title}</h2>
                    {org?.name && (
                      <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">business</span>
                        {org.name}
                      </p>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-blue-500 transition-colors shrink-0">arrow_forward</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {job.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-[12px]">location_on</span>
                      {job.location}
                    </span>
                  )}
                  {job.employment_type && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full capitalize">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {job.employment_type.replace("_", " ")}
                    </span>
                  )}
                  {job.experience_min != null && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-[12px]">work_history</span>
                      {job.experience_min}{job.experience_max ? `–${job.experience_max}` : "+"} yrs
                    </span>
                  )}
                </div>

                {job.description && (
                  <p className="text-gray-400 text-sm mt-3 line-clamp-2 leading-relaxed">{job.description}</p>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Posted {job.created_at ? new Date(job.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recently"}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 group-hover:underline">Apply Now</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
