import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  applied:           { label: "Applied",            color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  new:               { label: "New",                color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  screening:         { label: "Screening",          color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  screened:          { label: "Screened",           color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  test_pending:      { label: "Test Pending",       color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  test_done:         { label: "Test Done",          color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  interview_pending: { label: "Interview Pending",  color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  interview_done:    { label: "Interview Done",     color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  shortlisted:       { label: "Shortlisted",        color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
  offer_sent:        { label: "Offer Sent",         color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
  hired:             { label: "Hired",              color: "text-emerald-800",bg: "bg-emerald-100 border-emerald-300" },
  rejected:          { label: "Not Selected",       color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  withdrawn:         { label: "Withdrawn",          color: "text-gray-600",   bg: "bg-gray-100 border-gray-300" },
  on_hold:           { label: "On Hold",            color: "text-gray-600",   bg: "bg-gray-50 border-gray-200" },
};

export default async function CandidateDashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) redirect("/candidate/login");

  const userId = userData.user.id;
  const email = userData.user.email ?? "";
  const admin = createAdminClient();

  // Look up candidate by user_id (fallback to email)
  let { data: candidate } = await admin
    .from("candidates")
    .select("id, full_name, email, current_title, current_company, skills")
    .eq("user_id", userId)
    .maybeSingle();

  if (!candidate && email) {
    candidate = (await admin
      .from("candidates")
      .select("id, full_name, email, current_title, current_company, skills")
      .eq("email", email)
      .maybeSingle()).data ?? null;
  }

  // Get all applications for this candidate
  const applications = candidate ? await admin
    .from("applications")
    .select(`
      id, status, composite_score, resume_score, applied_at,
      jobs(id, title, location, employment_type, public_slug, organizations(name))
    `)
    .eq("candidate_id", candidate.id)
    .order("applied_at", { ascending: false })
    .then(r => r.data ?? []) : [];

  const displayName = candidate?.full_name ?? email.split("@")[0];

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hi, {displayName}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{email}</p>
          {candidate?.current_title && (
            <p className="text-gray-500 text-sm">{candidate.current_title}{candidate.current_company ? ` at ${candidate.current_company}` : ""}</p>
          )}
        </div>
        <Link
          href="/candidate/jobs"
          className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium text-sm px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">search</span>
          Browse Jobs
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Applied", value: applications.length, icon: "send" },
          { label: "In Progress", value: applications.filter(a => !["rejected","hired","withdrawn"].includes(a.status ?? "")).length, icon: "pending" },
          { label: "Shortlisted", value: applications.filter(a => ["shortlisted","offer_sent","hired"].includes(a.status ?? "")).length, icon: "star" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <span className="material-symbols-outlined text-blue-500 text-[24px]">{s.icon}</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Applications list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">My Applications</h2>
          <span className="text-sm text-gray-400">{applications.length} total</span>
        </div>

        {!applications.length ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-gray-200 text-[64px] block">assignment</span>
            <p className="text-gray-500 mt-3 font-medium">No applications yet</p>
            <p className="text-gray-400 text-sm mt-1">Browse open positions and submit your first application.</p>
            <Link href="/candidate/jobs" className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
              <span className="material-symbols-outlined text-[16px]">search</span>
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {applications.map((app) => {
              const job = (app.jobs as unknown as { id: string; title: string; location: string | null; employment_type: string | null; public_slug: string | null; organizations: { name: string } | null } | null);
              const statusCfg = STATUS_CONFIG[app.status ?? "applied"] ?? STATUS_CONFIG["applied"];
              const score = app.composite_score ?? app.resume_score;

              return (
                <div key={app.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 truncate">{job?.title ?? "Unknown Role"}</p>
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {(job?.organizations as { name: string } | null)?.name ?? "Company"}
                      {job?.location ? ` • ${job.location}` : ""}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </div>
                  {score != null && (
                    <div className="text-center shrink-0">
                      <div className={`text-lg font-bold ${score >= 70 ? "text-emerald-600" : score >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                        {Math.round(score)}
                      </div>
                      <div className="text-xs text-gray-400">AI Score</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form action="/auth/signout" method="post" className="mt-6 text-center">
        <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Sign out</button>
      </form>
    </main>
  );
}
