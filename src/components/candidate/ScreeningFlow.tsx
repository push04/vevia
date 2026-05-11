"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Question = { q: string; type: string; options?: { id: string; title: string; ideal: boolean }[]; preferred_yes?: boolean };
type ExistingAnswer = { question: string; answer: string; score: number };

type Props = {
  applicationId: string;
  onClose: () => void;
};

export function ScreeningFlow({ applicationId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [unansweredIndices, setUnansweredIndices] = useState<number[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState({ answered: 0, total: 0 });
  const mountedRef = useRef(true);

  useEffect(() => {
    const ctrl = new AbortController();
    mountedRef.current = true;

    fetch(`/api/screening/${applicationId}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        if (!mountedRef.current) return;
        if (data.error) { setError(data.error); setLoading(false); return; }
        setQuestions(data.questions);
        setUnansweredIndices(data.unansweredIndices);
        setProgress({ answered: data.existingAnswers?.length ?? 0, total: data.questions.length });
        if (data.unansweredIndices.length > 0) {
          setCurrentIdx(0);
          fetch(`/api/screening/${applicationId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "start" }),
            signal: ctrl.signal,
          }).catch(() => {});
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!mountedRef.current || err?.name === "AbortError") return;
        setError("Failed to load screening");
        setLoading(false);
      });

    return () => {
      mountedRef.current = false;
      ctrl.abort();
    };
  }, [applicationId]);

  const submitAnswer = useCallback(async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    try {
      const questionIdx = unansweredIndices[currentIdx];
      const res = await fetch(`/api/screening/${applicationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", questionIndex: questionIdx, answer: answer.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error ?? "Failed to save"); return; }

      setProgress((prev) => ({ answered: prev.answered + 1, total: prev.total }));

      if (data.isComplete) {
        setCompleted(true);
      } else {
        setCurrentIdx((prev) => prev + 1);
        setAnswer("");
      }
    } catch {
      setError("Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  }, [answer, submitting, unansweredIndices, currentIdx, applicationId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full text-center shadow-xl">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 text-sm mt-3">Loading screening...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={onClose} className="mt-4 text-sm text-gray-500 hover:underline">Close</button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-emerald-600 text-[32px]">check_circle</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Screening Complete!</h3>
          <p className="text-sm text-gray-500">Your answers have been saved and scored.</p>
          <button onClick={onClose} className="mt-6 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition">
            Done
          </button>
        </div>
      </div>
    );
  }

  if (unansweredIndices.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 text-[32px]">task_alt</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">All questions answered</h3>
          <p className="text-sm text-gray-500">You have completed all screening questions for this application.</p>
          <button onClick={onClose} className="mt-6 w-full bg-gray-900 text-white font-semibold py-2.5 rounded-xl hover:bg-gray-800 transition">
            Close
          </button>
        </div>
      </div>
    );
  }

  const question = questions[unansweredIndices[currentIdx]];
  if (!question) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl">
          <p className="text-gray-500 text-sm">No more questions available.</p>
          <button onClick={onClose} className="mt-4 text-sm text-gray-500 hover:underline">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-gray-400">
            Question {progress.answered + 1} of {questions.length}
          </span>
          <span className="text-xs text-gray-400">
            {Math.round(((progress.answered) / questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(progress.answered / questions.length) * 100}%` }}
          />
        </div>

        <h3 className="text-base font-semibold text-gray-900 mb-4">{question.q}</h3>

        {question.type === "yes_no" ? (
          <div className="flex gap-3">
            {["yes", "no"].map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswer(opt)}
                className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  answer === opt
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {opt === "yes" ? "Yes" : "No"}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
          />
        )}

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={submitAnswer}
            disabled={!answer.trim() || submitting}
            className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : currentIdx >= unansweredIndices.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
