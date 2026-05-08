"use client";

import { useState } from "react";
import { ScreeningFlow } from "./ScreeningFlow";

type AppSummary = {
  id: string;
  status: string | null;
  jobTitle: string;
  hasScreeningQuestions: boolean;
  existingAnswerCount: number;
  questionCount: number;
};

export function DashboardScreening({ applications }: { applications: AppSummary[] }) {
  const [activeAppId, setActiveAppId] = useState<string | null>(null);

  const needsScreening = applications.filter(
    (a) => a.hasScreeningQuestions && a.existingAnswerCount < a.questionCount,
  );

  if (needsScreening.length === 0) return null;

  return (
    <>
      {needsScreening.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <h3 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">rate_review</span>
            Complete your screening
          </h3>
          <p className="text-amber-700 text-xs mt-1">
            {needsScreening.length} application{needsScreening.length > 1 ? "s" : ""} ha{needsScreening.length > 1 ? "ve" : "s"} pending screening questions.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {needsScreening.map((app) => (
              <button
                key={app.id}
                onClick={() => setActiveAppId(app.id)}
                className="inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-amber-100 transition"
              >
                <span className="material-symbols-outlined text-[14px]">edit_note</span>
                {app.jobTitle} ({app.existingAnswerCount}/{app.questionCount})
              </button>
            ))}
          </div>
        </div>
      )}

      {activeAppId && (
        <ScreeningFlow applicationId={activeAppId} onClose={() => setActiveAppId(null)} />
      )}
    </>
  );
}
