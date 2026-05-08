import Link from "next/link";

import { requireRecruiterContext } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

function formatMaybe(v: string | null | undefined) {
  return v && v.trim() ? v : null;
}

export default async function CandidatesPage() {
  const ctx = await requireRecruiterContext();
  const supabase = createAdminClient();

  const { data: candidates, error } = await supabase
    .from("candidates")
    .select(
      "id, full_name, email, current_title, current_company, total_experience, skills, created_at",
    )
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

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
        <div className="grid grid-cols-12 gap-2xs px-md py-sm bg-surface-container-low border-b border-outline-variant font-label text-label text-text-secondary uppercase tracking-wide">
          <div className="col-span-5">Candidate</div>
          <div className="col-span-4 hidden sm:block">Role</div>
          <div className="col-span-3 text-right">Experience</div>
        </div>

        {candidates?.length ? (
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
        ) : (
          <div className="p-md">
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md">
              <p className="font-body-base text-body-base text-text-primary">No candidates yet.</p>
              <p className="font-caption text-caption text-text-secondary mt-2xs">
                Candidates appear after applications are submitted through `/api/apply/:slug` or `/api/parse-resume`.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
