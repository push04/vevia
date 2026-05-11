import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    if (!orgId) {
      return NextResponse.json({ success: false, error: "Missing org_id" }, { status: 400 });
    }
    const jobId = url.searchParams.get("job_id");

    const supabase = createAdminClient();
    
    const candidatesQuery = supabase
      .from("candidates")
      .select("id, current_location, total_experience, skills")
      .eq("org_id", orgId);
    
    const { data: candidates, error } = await candidatesQuery;
    if (error) throw new Error(error.message);

    const locationDistribution: Record<string, number> = {};
    const experienceBuckets = { "0-2": 0, "3-5": 0, "6-10": 0, "10+": 0 };
    const skillsSet = new Set<string>();
    const uniqueSkills: Record<string, number> = {};
    
    let appsWithData = 0;
    if (jobId) {
      const { data: apps } = await supabase
        .from("applications")
        .select("status")
        .eq("org_id", orgId)
        .eq("job_id", jobId);
      appsWithData = apps?.length ?? 0;
    }

    for (const c of candidates ?? []) {
      const loc = c.current_location ?? "Unknown";
      locationDistribution[loc] = (locationDistribution[loc] ?? 0) + 1;
      
      const exp = c.total_experience ?? 0;
      if (exp <= 2) experienceBuckets["0-2"]++;
      else if (exp <= 5) experienceBuckets["3-5"]++;
      else if (exp <= 10) experienceBuckets["6-10"]++;
      else experienceBuckets["10+"]++;
      
      for (const s of c.skills ?? []) {
        skillsSet.add(s.toLowerCase());
        uniqueSkills[s.toLowerCase()] = (uniqueSkills[s.toLowerCase()] ?? 0) + 1;
      }
    }

    const topLocations = Object.entries(locationDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));

    const skillDiversity = skillsSet.size;
    const topSkills = Object.entries(uniqueSkills)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, count }));

    const totalCandidates = candidates?.length ?? 0;
    
    const diversityScore = totalCandidates > 0 
      ? Math.round(
          (Object.keys(locationDistribution).length * 0.3 + 
           skillDiversity * 0.4 +
           Object.keys(experienceBuckets).filter(k => experienceBuckets[k as keyof typeof experienceBuckets] > 0).length * 0.3) * 10
        )
      : null;

    return NextResponse.json({
      success: true,
      metrics: {
        totalCandidates,
        locationDistribution: topLocations,
        experienceDistribution: experienceBuckets,
        skillsDiversity: {
          uniqueSkills: skillDiversity,
          topSkills
        },
        diversityScore,
        note: "Note: Gender, age, and disability status fields are not currently collected in the schema. This pipeline analysis uses available data (location, experience, skills) to measure candidate diversity."
      },
      pipelineAnalysis: {
        analyzedJobs: jobId ? 1 : null,
        applicationsAnalyzed: appsWithData
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}