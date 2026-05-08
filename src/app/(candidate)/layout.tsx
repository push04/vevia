import Link from "next/link";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}>
      {/* Minimal header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-[17px] text-gray-900">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">V</div>
          Vevia
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/candidate/jobs" className="text-gray-500 hover:text-gray-900 transition-colors">Browse Jobs</Link>
          <Link href="/candidate/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">My Applications</Link>
          <Link
            href="/candidate/login"
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </nav>
      </header>
      <div className="pt-14">{children}</div>
    </div>
  );
}
