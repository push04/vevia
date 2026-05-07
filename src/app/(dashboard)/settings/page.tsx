import { requireRecruiterContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { updateOrgAction } from "./actions";

export default async function SettingsPage() {
  const ctx = await requireRecruiterContext();
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", ctx.orgId)
    .single();

  const { data: members } = await supabase
    .from("users")
    .select("id, email, full_name, role, is_active, created_at")
    .eq("org_id", ctx.orgId)
    .order("created_at");

  const PLAN_COLORS: Record<string, string> = {
    free: "bg-surface-container-high text-text-secondary",
    starter: "bg-blue-100 text-blue-700",
    growth: "bg-emerald-100 text-emerald-700",
    pro: "bg-violet-100 text-violet-700",
    enterprise: "bg-amber-100 text-amber-700",
  };

  return (
    <main className="flex-1 overflow-y-auto bg-surface-base p-md">
      <div className="mb-lg">
        <h2 className="font-display text-[28px] font-bold text-primary">Settings</h2>
        <p className="text-text-secondary text-sm mt-1">Manage your organization and team.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        <div className="lg:col-span-2 space-y-md">
          {/* Org details */}
          <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
            <h3 className="font-semibold text-primary mb-md">Organization</h3>
            <form action={updateOrgAction} className="space-y-sm">
              <input type="hidden" name="org_id" value={ctx.orgId} />
              <label className="block">
                <span className="text-xs text-text-secondary font-medium">Organization name</span>
                <input
                  name="name"
                  defaultValue={org?.name ?? ""}
                  required
                  className="mt-1 w-full bg-surface-container-low border border-outline-variant rounded-xl px-sm py-xs text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </label>
              <label className="block">
                <span className="text-xs text-text-secondary font-medium">Slug (URL identifier)</span>
                <input
                  name="slug"
                  defaultValue={org?.slug ?? ""}
                  required
                  pattern="[a-z0-9-]+"
                  className="mt-1 w-full bg-surface-container-low border border-outline-variant rounded-xl px-sm py-xs text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-xs bg-primary text-white font-medium text-sm px-md py-xs rounded-xl hover:opacity-90 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                Save changes
              </button>
            </form>
          </div>

          {/* Team members */}
          <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="px-md py-sm bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-semibold text-primary text-sm">Team members ({members?.length ?? 0})</h3>
            </div>
            {members?.length ? (
              <div className="divide-y divide-outline-variant">
                {members.map((m) => (
                  <div key={m.id} className="px-md py-sm flex items-center gap-md">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {(m.full_name ?? m.email ?? "?")[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-primary text-sm truncate">
                        {m.full_name ?? m.email}
                      </div>
                      <div className="text-text-secondary text-xs truncate">{m.email}</div>
                    </div>
                    <div className="flex items-center gap-xs shrink-0">
                      <span className="px-xs py-0.5 rounded-full bg-surface-container-high text-text-secondary text-xs capitalize">
                        {m.role}
                      </span>
                      {!m.is_active && (
                        <span className="px-xs py-0.5 rounded-full bg-red-100 text-red-600 text-xs">inactive</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-md text-text-secondary text-sm">No team members yet.</div>
            )}
          </div>
        </div>

        {/* Sidebar: plan info */}
        <div className="space-y-md">
          <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
            <h3 className="font-semibold text-primary mb-md">Current plan</h3>
            <div className={`inline-flex px-sm py-xs rounded-full text-sm font-semibold capitalize mb-md ${PLAN_COLORS[org?.plan ?? "free"]}`}>
              {org?.plan ?? "Free"}
            </div>
            <dl className="space-y-xs text-sm">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Seats</dt>
                <dd className="text-primary font-medium">{org?.plan_seats ?? 1}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Team size</dt>
                <dd className="text-primary font-medium">{members?.length ?? 0}</dd>
              </div>
            </dl>
            <div className="mt-md border-t border-outline-variant pt-md">
              <p className="text-xs text-text-secondary">
                Need more seats or features? Contact support to upgrade your plan.
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
            <h3 className="font-semibold text-primary mb-sm">Your account</h3>
            <dl className="space-y-xs text-sm">
              <div className="flex justify-between gap-sm">
                <dt className="text-text-secondary">Email</dt>
                <dd className="text-primary text-right truncate max-w-[160px]">{ctx.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Role</dt>
                <dd className="text-primary capitalize">{ctx.role}</dd>
              </div>
            </dl>
            <div className="mt-md">
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="w-full border border-outline-variant text-text-secondary text-sm font-medium py-xs px-sm rounded-xl hover:bg-surface-container-low transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
