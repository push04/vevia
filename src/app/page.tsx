import { HomeHero } from "@/components/home/HomeHero";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { createAdminClient } from "@/lib/supabase/admin";

type PublicJob = {
  id: string;
  title: string;
  description: string | null;
  public_slug: string | null;
  location: string | null;
  employment_type: string | null;
  experience_min: number | null;
  experience_max: number | null;
  created_at: string | null;
};

export default async function Home() {
  let jobs: PublicJob[] = [];
  let liveJobCount = 0;
  let liveCandidateCount = 0;
  let liveApplicationCount = 0;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createAdminClient();
      const [jobsRes, candRes, appRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("id, title, description, public_slug, location, employment_type, experience_min, experience_max, created_at, status")
          .eq("status", "active")
          .not("public_slug", "is", null)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase.from("candidates").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
      ]);

      jobs = (jobsRes.data ?? []).map((j) => ({
        id: j.id,
        title: j.title,
        description: j.description,
        public_slug: j.public_slug,
        location: j.location,
        employment_type: j.employment_type,
        experience_min: j.experience_min,
        experience_max: j.experience_max,
        created_at: j.created_at,
      }));

      liveJobCount = jobs.length;
      liveCandidateCount = candRes.count ?? 0;
      liveApplicationCount = appRes.count ?? 0;
    } catch {
      /* silent — show zeros */
    }
  }

  return (
    <div className="flex-1 relative z-0 pt-16">
      <SiteHeader />
      <div className="fixed inset-0 pointer-events-none -z-10" style={{ backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-lg relative z-10">
        <HomeHero
          primaryCtaHref="/login"
          secondaryCtaHref="/how-it-works"
          liveJobCount={liveJobCount}
          liveCandidateCount={liveCandidateCount}
          liveApplicationCount={liveApplicationCount}
        />

        {/* Live Jobs Section */}
        {jobs.length > 0 && (
          <section className="mt-xl" id="jobs">
            <div className="flex items-end justify-between gap-sm flex-wrap mb-md">
              <div>
                <h2 className="font-display text-[24px] font-bold text-primary">Live openings</h2>
                <p className="text-text-secondary text-sm mt-1">
                  Real-time from Supabase, apply directly, AI screens you instantly.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm">
              {jobs.map((j) => (
                <div
                  key={j.id}
                  className="group bg-surface rounded-2xl border border-outline-variant shadow-sm p-md hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-start justify-between gap-sm mb-sm">
                    <div className="min-w-0">
                      <div className="font-semibold text-primary text-base truncate">{j.title}</div>
                      {j.location && (
                        <div className="flex items-center gap-1 text-text-secondary text-xs mt-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {j.location}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[16px]">work</span>
                    </div>
                  </div>

                  {j.description && (
                    <p className="text-text-secondary text-xs leading-relaxed line-clamp-2 mb-sm">
                      {j.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2xs mb-sm">
                    {j.employment_type && (
                      <span className="px-xs py-1 rounded-full bg-surface-container-low border border-outline-variant text-text-secondary text-[11px] capitalize">
                        {j.employment_type.replace("_", " ")}
                      </span>
                    )}
                    {(j.experience_min != null || j.experience_max != null) && (
                      <span className="px-xs py-1 rounded-full bg-surface-container-low border border-outline-variant text-text-secondary text-[11px]">
                        {j.experience_min ?? 0}
                        {j.experience_max ? `–${j.experience_max}` : "+"} yrs
                      </span>
                    )}
                  </div>

                  {j.public_slug && (
                    <a
                      className="inline-flex w-full justify-center items-center gap-xs bg-primary text-white font-medium text-sm px-md py-xs rounded-xl hover:opacity-90 transition-all group-hover:shadow-md"
                      href={`/apply/${j.public_slug}`}
                    >
                      Apply now
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
