import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_REDIRECTS = ["/candidate/dashboard", "/dashboard", "/candidate/login"];

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/candidate/dashboard";

  // Validate redirect target to prevent open redirect
  if (next) {
    try {
      const parsed = new URL(next, origin);
      if (parsed.origin !== origin || !ALLOWED_REDIRECTS.includes(parsed.pathname)) {
        next = "/candidate/dashboard";
      }
    } catch {
      next = "/candidate/dashboard";
    }
  }

  if (!code) {
    return NextResponse.redirect(new URL("/candidate/login?error=no_code", req.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/candidate/login?error=${encodeURIComponent(error.message)}`, req.url),
    );
  }

  // Link user_id to candidate record for matching
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    try {
      const admin = createAdminClient();
      await admin
        .from("candidates")
        .update({ user_id: user.id })
        .eq("email", user.email)
        .is("user_id", null);
    } catch {
      // non-fatal
    }
  }

  return NextResponse.redirect(new URL(next, req.url));
}
