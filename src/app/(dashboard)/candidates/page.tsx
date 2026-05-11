import Link from "next/link";

import { requireRecruiterContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function formatMaybe(v: string | null | undefined) {
  return v && v.trim() ? v : null;
}

type Props = {
  searchParams: Promise<{ search?: string; status?: string; job_id?: string; page?: string }>;
};

export default async function CandidatesPage({ searchParams }: Props) {
  const { search, status, job_id, page } = await searchParams;
  const ctx = await requireRecruiterContext();
  const supabase = await createClient();

  const pageNum = Math.max(1, parseInt(page ?? "1", 10));
  const PAGE_SIZE = 20;
  const offset = (pageNum - 1) * PAGE_SIZE;

  let candidatesQuery = supabase
    .from("candidates")
    .select(
      "id, full_name, email, current_title, current_company, total_experience, skills, created_at",
      { count: "exact" }
    )
    .eq("org_id", ctx.orgId);

  if (search) {
    candidatesQuery = candidatesQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: candidatesData, error, count } = await candidatesQuery
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) throw new Error(error.message);

  let candidates = candidatesData;

  if (status || job_id) {
    const appsQuery = supabase
      .from("applications")
      .select("candidate_id, status, job_id")
      .eq("org_id", ctx.orgId);
    
    if (status && status !== "all") {
      appsQuery.eq("status", status);
    }
    if (job_id) {
      appsQuery.eq("job_id", job_id);
    }
    
    const { data: appsData } = await appsQuery;
    const candidateIds = new Set((appsData ?? []).map((a) => a.candidate_id));
    candidates = (candidates ?? []).filter((c) => candidateIds.has(c.id));
  }

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("org_id", ctx.orgId)
    .order("title");

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <main className="flex-1 overflow-y-auto bg-surface-base p-md">
      <div className="flex items-start justify-between gap-sm flex-wrap">
        <div>
          <h2 className="font-h1 text-h1 text-primary">Candidates</h2>
          <p className="font-body-base text-body-base text-text-secondary mt-2xs">
            Live candidate directory for your organization.
          </p>
        </div>
        <Link
          className="inline-flex border border-outline-variant text-primary font-label text-label px-md py-xs rounded hover:bg-surface-container-low transition-colors"
          href="/jobs"
        >
          Open jobs
        </Link>
      </div>

      <div className="mt-md bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-md py-sm bg-surface-container-low border-b border-outline-variant">
          <div className="flex items-center gap-sm flex-wrap mb-sm">
            <form className="flex items-center gap-xs flex-1 min-w-[200px]">
              <input
                type="text"
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search by name or email..."
                className="flex-1 min-w-[120px] bg-surface border border-outline-variant rounded-lg px-sm py-xs text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              {job_id && <input type="hidden" name="job_id" value={job_id} />}
              {status && status !== "all" && <input type="hidden" name="status" value={status} />}
              <button
                type="submit"
                className="px-sm py-xs bg-primary text-white text-sm rounded-lg hover:opacity-90"
              >
                Search
              </button>
            </form>
            <form className="flex items-center gap-xs">
              <input type="hidden" name="search" value={search ?? ""} />
              <select
                name="job_id"
                defaultValue={job_id ?? ""}
                onChange={(e) => e.target.form?.submit()}
                className="bg-surface border border-outline-variant rounded-lg px-sm py-xs text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All jobs</option>
                {jobs?.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </form>
            <form className="flex items-center gap-xs">
              <input type="hidden" name="search" value={search ?? ""} />
              {job_id && <input type="hidden" name="job_id" value={job_id} />}
              <select
                name="status"
                defaultValue={status ?? "all"}
                onChange={(e) => e.target.form?.submit()}
                className="bg-surface border border-outline-variant rounded-lg px-sm py-xs text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All status</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_pending">Interview</option>
                <option value="offer_sent">Offer Sent</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </form>
            {(search || status || job_id) && (
              <a
                href="?"
                className="text-sm text-primary hover:underline"
              >
                Clear
              </a>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-label text-label text-text-secondary uppercase tracking-wide">Candidates</span>
            <span className="font-caption text-caption text-text-secondary">{count ?? 0} total</span>
          </div>
        </div>

        {candidates?.length ? (
          <>
            <div className="divide-y divide-outline-variant">
              {candidates.map((c) => {
                const title = formatMaybe(c.current_title);
                const company = formatMaybe(c.current_company);
                const subtitle = [title, company].filter(Boolean).join(" - ");
                const exp =
                  typeof c.total_experience === "number" ? `${c.total_experience}y` : "--";

                return (
                  <Link
                    key={c.id}
                    className="grid grid-cols-12 gap-2xs px-md py-sm items-center hover:bg-surface-elevated transition-colors"
                    href={`/candidates/${c.id}`}
                  >
                    <div className="col-span-5 min-w-0">
                      <div className="font-body-base text-body-base text-primary truncate">
                        {c.full_name ?? c.email ?? "Unnamed candidate"}
                      </div>
                      <div className="font-caption text-caption text-text-secondary truncate">
                        {c.email ?? "No email"}
                      </div>
                    </div>

                    <div className="col-span-4 hidden sm:block min-w-0">
                      <div className="font-caption text-caption text-text-secondary truncate">
                        {subtitle || "--"}
                      </div>
                    </div>

                    <div className="col-span-3 text-right font-caption text-caption text-text-secondary tabular-nums">
                      {exp}
                    </div>
                  </Link>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="px-md py-sm border-t border-outline-variant flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Page {pageNum} of {totalPages}
                </span>
                <div className="flex items-center gap-xs">
                  {pageNum > 1 && (
                    <a
                      href={`?page=${pageNum - 1}&search=${search ?? ""}&status=${status ?? ""}&job_id=${job_id ?? ""}`}
                      className="px-sm py-xs text-sm text-primary hover:bg-surface-container-low rounded-lg"
                    >
                      Previous
                    </a>
                  )}
                  {pageNum < totalPages && (
                    <a
                      href={`?page=${pageNum + 1}&search=${search ?? ""}&status=${status ?? ""}&job_id=${job_id ?? ""}`}
                      className="px-sm py-xs text-sm text-primary hover:bg-surface-container-low rounded-lg"
                    >
                      Next
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-md">
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md">
              <p className="font-body-base text-body-base text-text-primary">No candidates found.</p>
              {(search || status || job_id) && (
                <a href="?" className="mt-sm inline-flex text-primary text-sm hover:underline">
                  Clear filters
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}