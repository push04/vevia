import Link from "next/link";
import { requireRecruiterContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createJobAction, toggleJobStatusAction, deleteJobAction } from "./actions";
import { CreateJobForm } from "@/components/dashboard/CreateJobForm";
import { ShareLinkButton } from "@/components/dashboard/ShareLinkButton";
import { JobActions } from "@/components/dashboard/JobActions";

const STATUS_BADGE: Record<string, string> = {
  draft:    "bg-gray-100 text-gray-600",
  active:   "bg-emerald-100 text-emerald-700",
  paused:   "bg-amber-100 text-amber-700",
  closed:   "bg-red-100 text-red-600",
  archived: "bg-gray-100 text-gray-500",
};

const VISIBILITY_BADGE: Record<string, { label: string; icon: string; cls: string }> = {
  public:    { label: "Public",    icon: "public", cls: "text-blue-600 bg-blue-50" },
  link_only: { label: "Link Only", icon: "link",   cls: "text-purple-600 bg-purple-50" },
};

type Props = {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
};

export default async function JobsPage({ searchParams }: Props) {
  const { status, search, page } = await searchParams;
  const ctx = await requireRecruiterContext();
  const supabase = await createClient();

  const pageNum = Math.max(1, parseInt(page ?? "1", 10));
  const PAGE_SIZE = 20;
  const offset = (pageNum - 1) * PAGE_SIZE;

  let query = supabase
    .from("jobs")
    .select("id, title, status, visibility, public_slug, created_at, application_deadline", { count: "exact" })
    .eq("org_id", ctx.orgId);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data: jobs, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) throw new Error(error.message);

  return (
    <main className="flex-1 overflow-y-auto bg-surface-base p-md">
      <div className="flex items-start justify-between gap-sm flex-wrap">
        <div>
          <h2 className="font-h1 text-h1 text-primary">Jobs</h2>
          <p className="font-body-base text-body-base text-text-secondary mt-2xs">
            Create openings and manage your hiring pipeline.
          </p>
        </div>
        <a
          className="inline-flex items-center gap-xs bg-primary text-on-primary font-label text-label px-md py-xs rounded hover:bg-surface-tint transition-colors shadow-sm"
          href="#new-job"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Job
        </a>
      </div>

      <div className="mt-md grid grid-cols-1 lg:grid-cols-3 gap-md">
        <section className="lg:col-span-2 bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-md py-sm bg-surface-container-low border-b border-outline-variant">
            <div className="flex items-center justify-between gap-sm mb-sm">
              <span className="font-label text-label text-text-secondary uppercase tracking-wide">Openings</span>
              <span className="font-caption text-caption text-text-secondary">{count ?? 0} total</span>
            </div>
            <div className="flex items-center gap-sm">
              <form className="flex items-center gap-xs flex-1">
                <input type="hidden" name="status" value={status ?? ""} />
                <input
                  type="text"
                  name="search"
                  defaultValue={search ?? ""}
                  placeholder="Search by title..."
                  className="flex-1 min-w-[120px] bg-surface border border-outline-variant rounded-lg px-sm py-xs text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="submit"
                  className="px-sm py-xs bg-primary text-white text-sm rounded-lg hover:opacity-90"
                >
                  Search
                </button>
              </form>
              <form className="flex items-center gap-xs">
                {search && <input type="hidden" name="search" value={search} />}
                <select
                  name="status"
                  defaultValue={status ?? "all"}
                  onChange={(e) => e.target.form?.submit()}
                  className="bg-surface border border-outline-variant rounded-lg px-sm py-xs text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="all">All status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </form>
            </div>
          </div>

          {jobs?.length ? (
            <div className="divide-y divide-outline-variant">
              {jobs.map((job) => {
                const vis = VISIBILITY_BADGE[job.visibility ?? "public"];
                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}/candidates`}
                    className="px-md py-sm hover:bg-surface-elevated transition-colors flex items-center justify-between gap-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-body-large text-body-large text-primary truncate">{job.title}</div>
                      <div className="flex items-center gap-xs mt-1 flex-wrap">
                        <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[job.status ?? "draft"]}`}>
                          {job.status}
                        </span>
                        {vis ? (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${vis.cls}`}>
                            <span className="material-symbols-outlined text-[11px]">{vis.icon}</span>
                            {vis.label}
                          </span>
                        ) : null}
                        <span className="font-caption text-caption text-text-secondary">
                          {job.created_at ? new Date(job.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "---"}
                        </span>
                        {job.application_deadline ? (
                          <span className={`font-caption text-caption ${new Date(job.application_deadline) < new Date() ? "text-red-500" : "text-text-secondary"}`}>
                            Closes {new Date(job.application_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-xs shrink-0">
                      <span
                        className="p-1.5 text-text-secondary hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                        title="View pipeline"
                      >
                        <span className="material-symbols-outlined text-[18px]">group</span>
                      </span>
                      {job.public_slug ? (
                        <ShareLinkButton slug={job.public_slug} size="sm" />
                      ) : null}
                      <JobActions
                        jobId={job.id}
                        status={job.status ?? "draft"}
                        toggleStatusAction={toggleJobStatusAction}
                        deleteAction={deleteJobAction}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-lg text-center">
              <span className="material-symbols-outlined text-text-secondary/30 text-[48px] block">work_off</span>
              <p className="font-body-base text-body-base text-text-secondary mt-sm">No jobs found.</p>
              {(status !== "all" || search) ? (
                <a href="?" className="mt-sm inline-flex text-primary text-sm hover:underline">
                  Clear filters
                </a>
              ) : null}
            </div>
          )}
        </section>

        <aside id="new-job" className="bg-surface rounded-lg border border-outline-variant shadow-sm p-md">
          <h3 className="font-h2 text-h2 text-primary mb-2xs">Create job</h3>
          <p className="font-caption text-caption text-text-secondary mb-sm">
            Use AI to generate a professional description instantly.
          </p>
          <CreateJobForm action={createJobAction} />
        </aside>
      </div>
    </main>
  );
}
