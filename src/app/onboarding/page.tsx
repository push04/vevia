import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { createOrgAndBindAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", userData.user.id)
    .single();

  if (profile?.org_id) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-sm py-lg">
      <div className="w-full max-w-lg bg-surface rounded-xl border border-outline-variant shadow-sm p-lg">
        <div className="mb-md">
          <h1 className="font-display text-display text-primary">Set up your organization</h1>
          <p className="font-body-base text-body-base text-text-secondary mt-2xs">
            This binds your Supabase Auth user to an `organizations` row and unlocks the recruiter portal.
          </p>
        </div>

        <form action={createOrgAndBindAction} className="space-y-sm">
          <label className="block">
            <span className="font-label text-label text-text-secondary">Organization name</span>
            <input
              className="mt-2xs w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs outline-none focus:ring-2 focus:ring-primary-container transition"
              name="org_name"
              placeholder="Company name"
              required
              type="text"
            />
          </label>

          <label className="block">
            <span className="font-label text-label text-text-secondary">Slug (optional)</span>
            <input
              className="mt-2xs w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs outline-none focus:ring-2 focus:ring-primary-container transition"
              name="org_slug"
              placeholder="company-name"
              type="text"
            />
          </label>

          <button className="w-full bg-primary text-on-primary font-label text-label py-xs rounded-lg hover:bg-surface-tint transition-colors shadow-sm">
            Continue
          </button>
        </form>

        <div className="mt-md">
          <Link className="text-primary hover:underline font-label text-label" href="/login">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

