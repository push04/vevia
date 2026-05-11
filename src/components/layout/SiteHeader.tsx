"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export function SiteHeader() {
  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createClient();
  }, []);

  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch {
      // logout failure is non-fatal
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant transition-all">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-2xl text-primary flex items-center gap-2 hover:opacity-80 transition-opacity">
           <span className="material-symbols-outlined text-blue-600 text-[28px]">psychology</span>
           Vevia
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/how-it-works" className="text-sm font-semibold text-text-secondary hover:text-primary transition-colors hidden sm:block">
            How it works
          </Link>
          {loading ? (
             <div className="w-32 h-8 bg-slate-100 animate-pulse rounded-md"></div>
          ) : user ? (
            <div className="flex items-center gap-5">
              <span className="text-sm font-medium text-text-secondary hidden md:block">
                Hi, <span className="font-bold text-primary">{user.email?.split('@')[0]}</span>
              </span>
              <Link href="/dashboard" className="text-sm font-bold bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold text-text-secondary hover:text-primary transition-colors">
                Sign in
              </Link>
              <Link href="/login" className="text-sm font-bold bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
