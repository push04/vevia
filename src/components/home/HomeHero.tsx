"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { label: "Time saved per hire", value: "73%", suffix: "" },
  { label: "Faster screening", value: "10", suffix: "x" },
  { label: "Cost reduction", value: "60%", suffix: "" },
  { label: "Accuracy vs humans", value: "94%", suffix: "" },
];

const FEATURES = [
  {
    icon: "description",
    title: "Resume Intelligence",
    body: "AI parses any PDF or DOCX resume into structured candidate profiles in under 3 seconds using Groq LLaMA 3.3.",
    color: "from-blue-500/20 to-indigo-500/10",
  },
  {
    icon: "smart_toy",
    title: "AI Screening Chatbot",
    body: "Role-specific chatbot screens candidates 24/7 via web widget or WhatsApp. No manual effort.",
    color: "from-violet-500/20 to-purple-500/10",
  },
  {
    icon: "leaderboard",
    title: "Composite Scoring",
    body: "Weighted composite score (0-100) from resume match, screening answers, test, and video — with explainable breakdown.",
    color: "from-emerald-500/20 to-teal-500/10",
  },
  {
    icon: "videocam",
    title: "Async Video Interviews",
    body: "Candidates record video answers on their schedule. Groq Whisper transcribes, AI scores confidence and content.",
    color: "from-orange-500/20 to-amber-500/10",
  },
  {
    icon: "quiz",
    title: "Skills Assessments",
    body: "MCQ, coding challenges, and open-text tests — AI graded with plagiarism detection built in.",
    color: "from-rose-500/20 to-pink-500/10",
  },
  {
    icon: "shield_person",
    title: "Bias Mitigation",
    body: "Anonymous review mode hides name, gender cues, and college tier for fair, unbiased shortlisting.",
    color: "from-cyan-500/20 to-sky-500/10",
  },
];

const PIPELINE_STEPS = [
  { icon: "upload_file", label: "Resume Upload" },
  { icon: "psychology", label: "AI Parsing" },
  { icon: "chat", label: "Screening Chat" },
  { icon: "bar_chart", label: "Composite Score" },
  { icon: "checklist", label: "Shortlist" },
];

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        let start = 0;
        const step = target / 40;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setVal(target); clearInterval(timer); }
          else setVal(Math.floor(start));
        }, 30);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{val}{suffix}</span>;
}

export function HomeHero(props: {
  primaryCtaHref: string;
  secondaryCtaHref: string;
  liveJobCount?: number;
  liveCandidateCount?: number;
  liveApplicationCount?: number;
}) {
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      el!.style.setProperty("--mx", String((e.clientX - rect.left) / rect.width));
      el!.style.setProperty("--my", String((e.clientY - rect.top) / rect.height));
    }
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="flex flex-col gap-0">
      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden rounded-2xl border border-outline-variant bg-gradient-to-br from-[#00355f] via-[#0a4a7a] to-[#0f5a9a] px-md py-xl sm:px-xl"
        style={{ minHeight: "520px" }}
      >
        {/* Animated orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl animate-float-slow" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl animate-float-slower" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-sky-400/10 blur-2xl" />
          {/* Mouse-follow gradient */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(500px circle at calc(var(--mx,0.5)*100%) calc(var(--my,0.3)*100%), rgba(100,180,255,0.15), transparent 60%)",
            }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2xs px-sm py-2xs rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium mb-md">
            <span className="material-symbols-outlined text-[14px] text-sky-300">auto_awesome</span>
            India&apos;s first end-to-end agentic hiring intelligence platform
          </div>

          <h1 className="font-display text-[48px] sm:text-[64px] leading-[1.05] text-white font-bold">
            Hire smarter.<br />
            <span className="text-sky-300">10x faster.</span>
          </h1>
          <p className="mt-sm max-w-2xl text-white/70 text-lg leading-relaxed">
            Vevia automates your entire recruitment funnel — resume parsing, AI screening, composite scoring, and ranked shortlists — so recruiters focus on the top 5%, not all 100%.
          </p>

          <div className="mt-lg flex flex-wrap gap-sm">
            <Link
              href={props.primaryCtaHref}
              className="inline-flex items-center gap-xs bg-white text-[#00355f] font-semibold px-lg py-xs rounded-xl hover:bg-sky-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
              Start hiring for free
            </Link>
            <Link
              href={props.secondaryCtaHref}
              className="inline-flex items-center gap-xs border border-white/30 text-white/90 font-medium px-lg py-xs rounded-xl hover:bg-white/10 transition-all text-sm backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              See how it works
            </Link>
          </div>

          {/* Live stats */}
          <div className="mt-xl flex flex-wrap gap-lg">
            {[
              { label: "Active jobs", value: props.liveJobCount ?? 0, live: true },
              { label: "Candidates processed", value: props.liveCandidateCount ?? 0, live: true },
              { label: "Applications", value: props.liveApplicationCount ?? 0, live: true },
            ].map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="text-2xl font-bold text-white font-display tabular-nums">
                  {s.live ? (
                    <AnimatedCounter target={s.value} suffix="" />
                  ) : (
                    s.value
                  )}
                </span>
                <span className="text-white/60 text-xs mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="mt-lg grid grid-cols-2 md:grid-cols-4 gap-sm">
        {STATS.map((s) => {
          const numeric = parseInt(s.value.replace(/\D/g, ""), 10);
          return (
            <div
              key={s.label}
              className="bg-surface border border-outline-variant rounded-xl p-md text-center hover:shadow-md transition-all hover:-translate-y-0.5 group"
            >
              <div className="font-display text-[32px] font-bold text-primary tabular-nums group-hover:text-sky-700 transition-colors">
                <AnimatedCounter target={numeric} suffix={s.suffix} />
              </div>
              <div className="text-text-secondary text-xs mt-1">{s.label}</div>
            </div>
          );
        })}
      </section>

      {/* ── PIPELINE FLOW ── */}
      <section className="mt-xl">
        <div className="text-center mb-lg">
          <h2 className="font-display text-[28px] font-bold text-primary">The Vevia Pipeline</h2>
          <p className="text-text-secondary text-sm mt-xs max-w-xl mx-auto">
            From resume to shortlist — fully automated. Recruiters only see the top candidates.
          </p>
        </div>
        <div className="relative flex items-center justify-between gap-sm overflow-x-auto pb-sm">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-sm shrink-0">
              <div className="flex flex-col items-center gap-xs">
                <div
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[#1565C0] flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-1 transition-all cursor-default"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="material-symbols-outlined text-white text-[24px]">{step.icon}</span>
                </div>
                <span className="text-xs text-text-secondary text-center leading-tight max-w-[72px]">{step.label}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="flex items-center mb-5">
                  <div className="h-0.5 w-8 bg-gradient-to-r from-primary/40 to-primary/20 rounded" />
                  <span className="material-symbols-outlined text-primary/40 text-[18px] -ml-1">chevron_right</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="mt-xl">
        <div className="text-center mb-lg">
          <h2 className="font-display text-[28px] font-bold text-primary">Everything you need to hire right</h2>
          <p className="text-text-secondary text-sm mt-xs max-w-xl mx-auto">
            Built for Indian recruiters handling high-volume hiring across any role.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sm">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`group relative overflow-hidden rounded-2xl border border-outline-variant bg-gradient-to-br ${f.color} p-md hover:shadow-lg hover:-translate-y-1 transition-all cursor-default`}
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-outline-variant flex items-center justify-center mb-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary">{f.icon}</span>
              </div>
              <h3 className="font-semibold text-primary text-base mb-2xs">{f.title}</h3>
              <p className="text-text-secondary text-xs leading-relaxed">{f.body}</p>
              <span className="material-symbols-outlined absolute bottom-md right-md text-text-secondary/30 text-[32px] group-hover:text-text-secondary/60 group-hover:scale-110 transition-all">
                arrow_forward
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="mt-xl bg-surface border border-outline-variant rounded-2xl p-lg">
        <div className="text-center mb-lg">
          <h2 className="font-display text-[28px] font-bold text-primary">Up and running in minutes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg relative">
          {[
            { step: "01", icon: "business", title: "Create your org", body: "Sign up, create your organization, and post your first job in under 5 minutes." },
            { step: "02", icon: "link", title: "Share the apply link", body: "Share the public apply link on LinkedIn, Naukri, or WhatsApp. Candidates apply directly." },
            { step: "03", icon: "trophy", title: "Review ranked shortlist", body: "AI screens, scores, and ranks every candidate. You get a clean shortlist with full explanations." },
          ].map((step, i) => (
            <div key={step.step} className="flex flex-col items-center text-center gap-sm relative">
              {i < 2 && (
                <div className="hidden md:block absolute right-0 top-8 w-full h-0.5 bg-gradient-to-r from-primary/20 to-transparent translate-x-1/2" />
              )}
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-white text-[28px]">{step.icon}</span>
              </div>
              <div className="text-xs font-bold text-primary/40 tracking-widest">{step.step}</div>
              <h3 className="font-semibold text-primary text-base">{step.title}</h3>
              <p className="text-text-secondary text-xs leading-relaxed max-w-xs">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="mt-xl" id="pricing">
        <div className="text-center mb-lg">
          <h2 className="font-display text-[28px] font-bold text-primary">Simple, honest pricing</h2>
          <p className="text-text-secondary text-sm mt-xs">Built for Indian SMBs and staffing firms. No dollar pricing.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
          {[
            { plan: "Free", price: "0", period: "/month", highlight: false, features: ["1 active job", "50 candidates/month", "AI resume parsing", "Screening chatbot", "Email notifications"] },
            { plan: "Starter", price: "2,999", period: "/month", highlight: true, features: ["10 active jobs", "500 candidates/month", "Everything in Free", "Composite scoring", "WhatsApp screening", "Analytics dashboard"] },
            { plan: "Growth", price: "8,999", period: "/month", highlight: false, features: ["Unlimited jobs", "Unlimited candidates", "Everything in Starter", "Video interviews", "Skills assessments", "Priority support", "API access"] },
          ].map((tier) => (
            <div
              key={tier.plan}
              className={`rounded-2xl border p-lg flex flex-col gap-sm transition-all hover:-translate-y-1 hover:shadow-xl ${
                tier.highlight
                  ? "bg-gradient-to-br from-[#00355f] to-[#0a4a7a] border-primary text-white shadow-lg scale-[1.02]"
                  : "bg-surface border-outline-variant"
              }`}
            >
              {tier.highlight && (
                <div className="inline-flex self-start px-sm py-2xs rounded-full bg-white/20 text-white text-xs font-medium">
                  Most popular
                </div>
              )}
              <div>
                <div className={`text-lg font-semibold ${tier.highlight ? "text-white/80" : "text-text-secondary"}`}>{tier.plan}</div>
                <div className={`font-display text-[36px] font-bold ${tier.highlight ? "text-white" : "text-primary"}`}>
                  Rs {tier.price}
                  <span className={`text-sm font-normal ${tier.highlight ? "text-white/60" : "text-text-secondary"}`}>{tier.period}</span>
                </div>
              </div>
              <ul className="flex flex-col gap-xs">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-xs text-sm">
                    <span className={`material-symbols-outlined text-[16px] ${tier.highlight ? "text-sky-300" : "text-primary"}`}>check_circle</span>
                    <span className={tier.highlight ? "text-white/80" : "text-text-secondary"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={props.primaryCtaHref}
                className={`mt-auto inline-flex justify-center items-center gap-xs py-xs px-md rounded-xl font-medium text-sm transition-all hover:opacity-90 ${
                  tier.highlight
                    ? "bg-white text-[#00355f]"
                    : "bg-primary text-white"
                }`}
              >
                Get started
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FOOTER ── */}
      <section className="mt-xl bg-gradient-to-r from-[#00355f] to-[#0a4a7a] rounded-2xl p-xl text-center">
        <h2 className="font-display text-[32px] font-bold text-white">Ready to transform your hiring?</h2>
        <p className="text-white/70 mt-xs max-w-lg mx-auto text-sm">
          Join recruiters already using Vevia to cut time-to-hire by 73% and hiring costs by 60%.
        </p>
        <Link
          href={props.primaryCtaHref}
          className="mt-md inline-flex items-center gap-xs bg-white text-[#00355f] font-bold px-xl py-sm rounded-xl hover:bg-sky-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <span className="material-symbols-outlined">rocket_launch</span>
          Start for free — no credit card needed
        </Link>
      </section>
    </div>
  );
}
