import Link from "next/link";

import { requireRecruiterContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import { createJobAction } from "./actions";

export default async function JobsPage() {
  const ctx = await requireRecruiterContext();
  const supabase = await createClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, title, status, public_slug, created_at")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (
    <main className="flex-1 overflow-y-auto bg-surface-base p-md">
      <div className="flex items-start justify-between gap-sm flex-wrap">
        <div>
          <h2 className="font-h1 text-h1 text-primary">Jobs</h2>
          <p className="font-body-base text-body-base text-text-secondary mt-2xs">
            Create openings and manage your pipeline.
          </p>
        </div>
        <a
          className="inline-flex bg-primary text-on-primary font-label text-label px-md py-xs rounded hover:bg-surface-tint transition-colors shadow-sm"
          href="#new-job"
        >
          New job
        </a>
      </div>

      <div className="mt-md grid grid-cols-1 lg:grid-cols-3 gap-md">
        <section className="lg:col-span-2 bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-md py-sm bg-surface-container-low border-b border-outline-variant font-label text-label text-text-secondary uppercase tracking-wide">
            Openings
          </div>

          {jobs?.length ? (
            <div className="divide-y divide-outline-variant">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  className="block px-md py-sm hover:bg-surface-elevated transition-colors"
                  href={`/jobs/${job.id}/candidates`}
                >
                  <div className="flex items-center justify-between gap-sm">
                    <div className="min-w-0">
                      <div className="font-body-large text-body-large text-primary truncate">
                        {job.title}
                      </div>
                      <div className="font-caption text-caption text-text-secondary truncate">
                        Status: {job.status ?? "unknown"}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-text-secondary">
                      chevron_right
                    </span>
                  </div>
                  {job.public_slug ? (
                    <div className="mt-2xs font-caption text-caption text-text-secondary truncate">
                      Apply link:{" "}
                      <span className="text-text-primary">/api/apply/{job.public_slug}</span>
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-md">
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md">
                <p className="font-body-base text-body-base text-text-primary">
                  No jobs yet.
                </p>
                <p className="font-caption text-caption text-text-secondary mt-2xs">
                  Create your first opening to start receiving applications.
                </p>
              </div>
            </div>
          )}
        </section>

        <aside
          id="new-job"
          className="bg-surface rounded-lg border border-outline-variant shadow-sm p-md"
        >
          <h3 className="font-h2 text-h2 text-primary">Create job</h3>
          <p className="font-caption text-caption text-text-secondary mt-2xs">
            Job creation writes directly to Supabase.
          </p>

          <form action={createJobAction} className="mt-sm space-y-sm">
            <label className="block">
              <span className="font-label text-label text-text-secondary">Title</span>
              <input
                className="mt-2xs w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs outline-none focus:ring-2 focus:ring-primary-container transition"
                name="title"
                placeholder="Senior Frontend Engineer"
                required
                type="text"
              />
            </label>

            <label className="block">
              <span className="font-label text-label text-text-secondary">Description</span>
              <textarea
                className="mt-2xs w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs outline-none focus:ring-2 focus:ring-primary-container transition min-h-28"
                name="description"
                placeholder="Role overview, responsibilities, and requirements."
              />
            </label>

            <label className="block">
              <span className="font-label text-label text-text-secondary">Requirements (one per line)</span>
              <textarea
                className="mt-2xs w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs outline-none focus:ring-2 focus:ring-primary-container transition min-h-24"
                name="requirements"
                placeholder={"React\nTypeScript\nSystem design"}
              />
            </label>

            <button className="w-full bg-primary text-on-primary font-label text-label py-xs rounded-lg hover:bg-surface-tint transition-colors shadow-sm">
              Create
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}

