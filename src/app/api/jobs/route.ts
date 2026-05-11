import { z } from "zod";

import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);
}

function randomSuffix() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 6);
}

const JobCreateSchema = z
  .object({
    org_id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    requirements: z.array(z.string()).optional().nullable(),
    status: z.string().optional().nullable(),
    public_slug: z.string().optional().nullable(),
  })
  .strict();

export async function GET(req: NextRequest) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    if (!orgId) {
      return NextResponse.json({ success: false, error: "Missing org_id" }, { status: 400 });
    }

    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
    const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);
    const status = url.searchParams.get("status")?.trim() ?? "";

    const supabase = createAdminClient();
    let query = supabase.from("jobs").select("*").eq("org_id", orgId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, jobs: data ?? [], page: { limit, offset } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const parsed = JobCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid body", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const requestedSlug = parsed.data.public_slug?.trim() || null;
    const computedSlug = slugify(requestedSlug ?? parsed.data.title);
    const finalSlug = computedSlug ? `${computedSlug}-${randomSuffix()}` : null;

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        org_id: parsed.data.org_id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        requirements: parsed.data.requirements ?? null,
        status: parsed.data.status ?? "draft",
        public_slug: finalSlug,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? "Create job failed");

    return NextResponse.json({ success: true, job: data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

