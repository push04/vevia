"use client";

import { useState } from "react";

export function ShareLinkButton({ slug, size = "md" }: { slug: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/apply/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (size === "sm") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleCopy();
        }}
        className="inline-flex items-center gap-1 text-primary hover:text-primary-container transition-colors font-medium text-xs bg-surface-container-low px-2 py-1 rounded-md"
        title="Copy public link"
      >
        <span className="material-symbols-outlined text-[14px]">
          {copied ? "check" : "content_copy"}
        </span>
        {copied ? "Copied!" : "Copy Link"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleCopy();
      }}
      className="inline-flex items-center gap-xs border border-outline-variant text-primary font-medium text-sm px-md py-xs rounded-xl hover:bg-surface-container-low transition-colors bg-surface shadow-sm"
      title="Copy public application link"
    >
      <span className="material-symbols-outlined text-[16px]">
        {copied ? "check" : "share"}
      </span>
      {copied ? "Copied!" : "Share Link"}
    </button>
  );
}
