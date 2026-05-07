import { requireRecruiterContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createJobFromTemplateAction } from "./actions";

export default async function TemplatesPage() {
  const ctx = await requireRecruiterContext();
  const supabase = await createClient();

  // Global templates (org_id IS NULL) + org-specific templates
  const { data: templates, error } = await supabase
    .from("job_roles")
    .select("*")
    .or(`org_id.is.null,org_id.eq.${ctx.orgId}`)
    .eq("is_template", true)
    .order("category");

  if (error) throw new Error(error.message);

  const categoryIcon: Record<string, string> = {
    tech: "code",
    sales: "trending_up",
    ops: "settings",
    hr: "people",
    finance: "account_balance",
  };

  const categoryColor: Record<string, string> = {
    tech: "from-blue-500/20 to-indigo-500/10",
    sales: "from-emerald-500/20 to-teal-500/10",
    ops: "from-orange-500/20 to-amber-500/10",
    hr: "from-violet-500/20 to-purple-500/10",
    finance: "from-sky-500/20 to-cyan-500/10",
  };

  const byCategory = (templates ?? []).reduce<Record<string, typeof templates>>((acc, t) => {
    const cat = t.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(t);
    return acc;
  }, {});

  return (
    <main className="flex-1 overflow-y-auto bg-surface-base p-md">
      <div className="mb-lg">
        <h2 className="font-display text-[28px] font-bold text-primary">Role Templates</h2>
        <p className="text-text-secondary text-sm mt-1">
          Pre-built screening question sets for 50+ roles. Use a template to create a job instantly.
        </p>
      </div>

      {Object.entries(byCategory).map(([category, roles]) => (
        <div key={category} className="mb-xl">
          <div className="flex items-center gap-xs mb-md">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[18px]">
                {categoryIcon[category] ?? "folder"}
              </span>
            </div>
            <h3 className="font-semibold text-primary capitalize">{category}</h3>
            <span className="ml-auto text-text-secondary text-xs">{roles?.length} template{(roles?.length ?? 0) !== 1 ? "s" : ""}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm">
            {roles?.map((role) => (
              <div
                key={role.id}
                className={`group relative overflow-hidden rounded-2xl border border-outline-variant bg-gradient-to-br ${categoryColor[category] ?? "from-surface to-surface-container-low"} p-md hover:shadow-lg hover:-translate-y-0.5 transition-all`}
              >
                <div className="flex items-start justify-between gap-sm mb-sm">
                  <div>
                    <h4 className="font-semibold text-primary text-sm">{role.title}</h4>
                    {role.description && (
                      <p className="text-text-secondary text-xs mt-1 leading-relaxed line-clamp-2">{role.description}</p>
                    )}
                  </div>
                </div>

                {(role.skills?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-xs mb-sm">
                    {(role.skills as string[]).slice(0, 4).map((s) => (
                      <span key={s} className="px-xs py-0.5 rounded-full bg-white/60 border border-outline-variant text-primary text-[10px] font-medium">
                        {s}
                      </span>
                    ))}
                    {role.skills!.length > 4 && (
                      <span className="text-[10px] text-text-secondary">+{role.skills!.length - 4} more</span>
                    )}
                  </div>
                )}

                {role.screening_questions && (
                  <div className="text-xs text-text-secondary mb-md">
                    {(role.screening_questions as unknown[]).length} screening question{(role.screening_questions as unknown[]).length !== 1 ? "s" : ""}
                  </div>
                )}

                <form action={createJobFromTemplateAction}>
                  <input type="hidden" name="role_id" value={role.id} />
                  <input type="hidden" name="org_id" value={ctx.orgId} />
                  <input type="hidden" name="created_by" value={ctx.userId} />
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center gap-xs bg-primary text-white font-medium text-xs py-xs px-sm rounded-xl hover:opacity-90 transition-all shadow-sm group-hover:shadow-md"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Use this template
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      ))}

      {(!templates || templates.length === 0) && (
        <div className="bg-surface rounded-2xl border border-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-[48px] text-text-secondary/40 block mb-md">folder_open</span>
          <h3 className="font-semibold text-primary mb-xs">No templates yet</h3>
          <p className="text-text-secondary text-sm">
            Templates appear here after you run the database seed SQL. Check the setup guide.
          </p>
        </div>
      )}
    </main>
  );
}
