"use client";

import { useEffect } from "react";

/**
 * When a logged-in candidate views a link_only job,
 * this component saves the job slug to localStorage so it
 * appears in their "Saved Jobs" section on the candidate dashboard.
 */
export function SaveJobOnView({ slug, jobTitle }: { slug: string; jobTitle: string }) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vevia_viewed_jobs");
      const viewed: Array<{ slug: string; title: string; viewedAt: string }> = stored ? JSON.parse(stored) : [];

      // Avoid duplicates
      const already = viewed.some((j) => j.slug === slug);
      if (!already) {
        viewed.unshift({ slug, title: jobTitle, viewedAt: new Date().toISOString() });
        localStorage.setItem("vevia_viewed_jobs", JSON.stringify(viewed.slice(0, 20)));
      }
    } catch {
      // localStorage not available (SSR) — silently ignore
    }
  }, [slug, jobTitle]);

  return null;
}
