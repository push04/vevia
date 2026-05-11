"use client";

import { useState } from "react";

type Props = {
  jobId: string;
  status: string;
  toggleStatusAction: (jobId: string, newStatus: string) => Promise<void>;
  deleteAction: (jobId: string) => Promise<void>;
};

export function JobActions({ jobId, status, toggleStatusAction, deleteAction }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleToggle() {
    try {
      const next = status === "active" ? "paused" : status === "paused" ? "active" : "active";
      await toggleStatusAction(jobId, next);
    } catch {
      // toggle failure is non-fatal
    }
    setOpen(false);
  }

  async function handleDelete() {
    try {
      await deleteAction(jobId);
    } catch {
      // delete failure is non-fatal
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 text-text-secondary hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
        title="Actions"
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-outline-variant rounded-lg shadow-lg py-1 min-w-[140px]">
            {(status === "active" || status === "paused") && (
              <button
                type="button"
                onClick={handleToggle}
                className="w-full flex items-center gap-2 px-sm py-2 text-sm text-text-secondary hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {status === "active" ? "pause_circle" : "play_circle"}
                </span>
                {status === "active" ? "Pause" : "Activate"}
              </button>
            )}

            {status === "draft" && (
              <button
                type="button"
                onClick={() => { toggleStatusAction(jobId, "active"); setOpen(false); }}
                className="w-full flex items-center gap-2 px-sm py-2 text-sm text-text-secondary hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">play_circle</span>
                Publish
              </button>
            )}

            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center gap-2 px-sm py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Delete
            </button>
          </div>
        </>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-xl shadow-xl p-md max-w-xs mx-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-primary text-sm mb-xs">Delete job?</h3>
            <p className="text-xs text-text-secondary mb-md">This action cannot be undone. All associated data will be removed.</p>
            <div className="flex items-center justify-end gap-sm">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-sm py-1 text-sm text-text-secondary hover:bg-surface-container-low rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-sm py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
