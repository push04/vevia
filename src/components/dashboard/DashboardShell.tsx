"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type NavItem = {
  href: string;
  icon: string;
  label: string;
};

const NAV: NavItem[] = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/jobs", icon: "work", label: "Jobs" },
  { href: "/candidates", icon: "group", label: "Candidates" },
  { href: "/analytics", icon: "bar_chart", label: "Analytics" },
  { href: "/templates", icon: "description", label: "Templates" },
  { href: "/whatsapp", icon: "chat_bubble", label: "WhatsApp" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell(props: {
  children: React.ReactNode;
  headerTitle?: string;
  userLabel: string;
  orgLabel: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = useMemo(() => NAV.find((n) => isActive(pathname, n.href)) ?? NAV[0], [pathname]);

  return (
    <div className="bg-background text-text-primary font-body-base antialiased flex min-h-dvh">
      {/* Desktop nav */}
      <nav className="hidden md:flex bg-surface h-dvh w-64 fixed left-0 top-0 border-r border-outline-variant flex-col py-md px-sm z-50">
        <div className="mb-xl flex items-center gap-xs px-2xs">
          <div className="w-8 h-8 rounded bg-primary-container text-on-primary-container flex items-center justify-center font-display text-h2 font-bold">
            V
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-h2 font-bold text-primary-container leading-tight truncate">
              {props.orgLabel ?? "Vevia"}
            </h1>
            <p className="font-caption text-caption text-text-secondary truncate">{props.userLabel}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2xs">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                className={[
                  "flex items-center gap-xs px-sm py-2xs rounded transition-all font-body-base text-body-base",
                  active
                    ? "bg-surface-container-low text-primary font-semibold border-r-4 border-primary scale-[0.98]"
                    : "text-text-secondary hover:bg-surface-container-high",
                ].join(" ")}
                href={item.href}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        <form action="/auth/signout" className="mt-auto" method="post">
          <button className="w-full border border-outline-variant text-text-secondary font-label text-label py-xs px-sm rounded-lg hover:bg-surface-container-low transition-colors">
            Sign out
          </button>
        </form>
      </nav>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-outline-variant z-50 flex items-center justify-between px-sm">
        <button
          className="p-2 rounded hover:bg-surface-container-low transition"
          onClick={() => setMobileOpen(true)}
          type="button"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="min-w-0">
          <div className="font-label text-label text-text-secondary truncate">{activeItem.label}</div>
        </div>
        <button
          className="p-2 rounded hover:bg-surface-container-low transition"
          onClick={() => router.refresh()}
          type="button"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="md:hidden fixed inset-0 z-60">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-surface border-r border-outline-variant p-md animate-drawer-in">
            <div className="flex items-center justify-between mb-md">
              <div className="min-w-0">
                <div className="font-display text-h2 text-primary-container truncate">{props.orgLabel ?? "Vevia"}</div>
                <div className="font-caption text-caption text-text-secondary truncate">{props.userLabel}</div>
              </div>
              <button
                className="p-2 rounded hover:bg-surface-container-low transition"
                onClick={() => setMobileOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-2xs">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  className="flex items-center gap-xs px-sm py-2xs rounded text-text-secondary hover:bg-surface-container-low transition"
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            <form action="/auth/signout" className="mt-lg" method="post">
              <button className="w-full border border-outline-variant text-text-secondary font-label text-label py-xs px-sm rounded-lg hover:bg-surface-container-low transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <div className="flex-1 flex flex-col md:ml-64 w-full min-h-dvh">
        <div className="h-14 md:hidden" />
        {props.children}
      </div>
    </div>
  );
}
