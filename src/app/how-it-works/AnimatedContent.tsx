"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";

const STEPS = [
  {
    id: "01",
    title: "Instant Resume Parsing",
    desc: "Candidates upload their resume. Our LLM-powered parser instantly extracts skills, experience, and education, normalizing the data into a structured profile in milliseconds.",
    icon: "document_scanner",
    color: "text-blue-600",
    bg: "bg-blue-50",
    mockup: (
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant p-[40px] w-full max-w-[600px]">
        <div className="flex gap-[24px] items-center mb-[32px]">
          <div className="w-[64px] h-[64px] rounded-xl bg-slate-100 flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-slate-400 text-[32px]">picture_as_pdf</span>
          </div>
          <div>
            <div className="h-[16px] w-[140px] bg-slate-200 rounded mb-[10px]"></div>
            <div className="h-[10px] w-[80px] bg-slate-100 rounded"></div>
          </div>
        </div>
        <div className="space-y-[20px]">
          <motion.div initial={{ width: 0 }} whileInView={{ width: "100%" }} transition={{ duration: 1 }} className="h-[12px] bg-blue-100 rounded-full overflow-hidden">
            <motion.div initial={{ x: "-100%" }} whileInView={{ x: "0%" }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-blue-500"></motion.div>
          </motion.div>
          <div className="grid grid-cols-2 gap-[16px] mt-[24px]">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="bg-slate-50 p-[16px] rounded-xl border border-slate-100 shadow-sm">
              <div className="text-xs text-slate-400 font-bold mb-[8px] tracking-widest">SKILLS</div>
              <div className="flex flex-wrap gap-[8px]">
                <span className="px-[10px] py-[4px] bg-blue-100 text-blue-700 rounded-md text-[11px] font-semibold">React</span>
                <span className="px-[10px] py-[4px] bg-blue-100 text-blue-700 rounded-md text-[11px] font-semibold">Node.js</span>
                <span className="px-[10px] py-[4px] bg-blue-100 text-blue-700 rounded-md text-[11px] font-semibold">TypeScript</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="bg-slate-50 p-[16px] rounded-xl border border-slate-100 shadow-sm">
              <div className="text-xs text-slate-400 font-bold mb-[8px] tracking-widest">EXPERIENCE</div>
              <div className="text-sm font-bold text-slate-700">5+ Years Senior</div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "02",
    title: "Autonomous AI Screening",
    desc: "No more scheduling initial calls. The AI acts as your recruiter, instantly chatting with candidates via web or WhatsApp to validate requirements and culture fit.",
    icon: "forum",
    color: "text-purple-600",
    bg: "bg-purple-50",
    mockup: (
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-[600px] overflow-hidden flex flex-col h-[380px]">
        <div className="bg-purple-600 p-[16px] text-white flex items-center gap-[12px] shadow-md z-10">
          <div className="w-[32px] h-[32px] rounded-full bg-white/20 flex items-center justify-center"><span className="material-symbols-outlined text-[18px]">smart_toy</span></div>
          <span className="text-base font-semibold">Vevia AI Screen</span>
        </div>
        <div className="flex-1 p-[24px] flex flex-col gap-[16px] overflow-hidden bg-slate-50">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="self-start bg-white p-[16px] rounded-2xl rounded-tl-sm border border-slate-200 text-sm shadow-sm max-w-[85%] leading-relaxed text-slate-700">
            Hi! Could you tell me about a time you optimized a React application?
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }} className="self-end bg-purple-600 text-white p-[16px] rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[85%] leading-relaxed">
            Sure, at my last job I implemented virtualized lists and code splitting, reducing load time by 40%.
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 3 }} className="self-start bg-white p-[16px] rounded-2xl rounded-tl-sm border border-slate-200 text-sm shadow-sm max-w-[85%] leading-relaxed text-slate-700">
            That&apos;s impressive! Did you use any specific libraries for virtualization?
          </motion.div>
        </div>
      </div>
    )
  },
  {
    id: "03",
    title: "Composite Scoring & Ranking",
    desc: "Vevia consolidates the parsed resume, chat answers, and test results into a single, explainable 0-100 score. It automatically ranks candidates so you only look at the top 5%.",
    icon: "insert_chart",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    mockup: (
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant p-[32px] w-full max-w-[600px]">
        <div className="flex items-center justify-between mb-[24px] border-b border-slate-100 pb-[16px]">
          <div className="text-base font-bold text-slate-800">Candidate Ranking</div>
          <span className="material-symbols-outlined text-slate-400 text-[24px]">filter_list</span>
        </div>
        <div className="space-y-[16px]">
          {[
            { name: "Arjun Mehta", score: 96, delay: 0.2 },
            { name: "Priya Sharma", score: 92, delay: 0.4 },
            { name: "Rahul Verma", score: 85, delay: 0.6 }
          ].map((c, i) => (
            <motion.div 
              key={c.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: c.delay }}
              className="flex items-center justify-between p-[12px] rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors"
            >
              <div className="flex items-center gap-[16px]">
                <div className="w-[32px] h-[32px] rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                  {i+1}
                </div>
                <span className="text-base font-semibold text-slate-700">{c.name}</span>
              </div>
              <div className="flex items-center gap-[12px]">
                <div className="w-[100px] h-[8px] bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${c.score}%` }}
                    transition={{ duration: 1, delay: c.delay + 0.2, ease: "easeOut" }}
                    className={`h-full ${i === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  ></motion.div>
                </div>
                <span className="text-sm font-bold text-slate-700 w-[32px] text-right">{c.score}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }
];

export default function AnimatedContent() {
  const containerRef = useRef(null);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden selection:bg-primary/20 relative z-0 pt-16" ref={containerRef}>
      <SiteHeader />
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-background" style={{ backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>

      {/* Hero Section */}
      <section className="relative pt-[128px] pb-[80px] px-[32px] sm:px-[64px] max-w-[1600px] mx-auto text-center flex flex-col items-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-[8px] px-[16px] py-[8px] rounded-full bg-primary/5 text-primary border border-primary/10 text-sm font-semibold mb-[32px]"
        >
          <span className="material-symbols-outlined text-[18px]">psychology</span>
          The Future of Hiring is Agentic
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display text-[56px] sm:text-[80px] font-bold text-primary leading-[1.1] max-w-[1000px]"
        >
          How <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-400">Vevia</span> automates your hiring.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-[32px] text-2xl text-text-secondary max-w-[800px] leading-relaxed"
        >
          Stop reading resumes. Stop scheduling preliminary calls. Let AI build your shortlist while you focus on closing the best talent.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 2, delay: 1, repeat: Infinity, ease: "easeInOut" }}
          className="mt-[64px] text-primary/40 flex flex-col items-center gap-[8px]"
        >
          <span className="text-sm font-medium uppercase tracking-widest">Scroll to explore</span>
          <span className="material-symbols-outlined text-[32px]">keyboard_double_arrow_down</span>
        </motion.div>
      </section>

      {/* Steps Section */}
      <section className="py-[100px] px-[32px] md:px-[64px] lg:px-[128px] max-w-full mx-auto relative z-10">
        {/* Vertical line connecting steps */}
        <div className="absolute left-[64px] md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-slate-200 to-transparent -translate-x-1/2 z-0 hidden md:block"></div>

        <div className="flex flex-col gap-[160px] relative z-10">
          {STEPS.map((step, i) => {
            const isEven = i % 2 === 0;
            return (
              <div key={step.id} className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-[64px] md:gap-[120px]`}>
                
                {/* Text Content */}
                <motion.div 
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="flex-1 w-full"
                >
                  <div className={`inline-flex items-center justify-center w-[64px] h-[64px] rounded-2xl ${step.bg} ${step.color} mb-[32px] shadow-sm`}>
                    <span className="material-symbols-outlined text-[32px]">{step.icon}</span>
                  </div>
                  <div className="text-base font-bold text-slate-400 tracking-widest mb-[12px]">STEP {step.id}</div>
                  <h2 className="font-display text-[40px] sm:text-[48px] font-bold text-primary mb-[24px] leading-tight">{step.title}</h2>
                  <p className="text-xl text-text-secondary leading-relaxed max-w-[600px]">{step.desc}</p>
                </motion.div>

                {/* Mockup Animation */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, rotate: isEven ? 2 : -2 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
                  className="flex-1 w-full flex justify-center perspective-1000"
                >
                  <motion.div 
                    whileHover={{ scale: 1.05, rotateY: isEven ? -5 : 5, rotateX: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{ transformStyle: "preserve-3d" }}
                    className="w-full flex justify-center"
                  >
                    {step.mockup}
                  </motion.div>
                </motion.div>

              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-[160px] px-[32px] text-center z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-[1000px] mx-auto bg-gradient-to-br from-[#00355f] to-[#0a4a7a] rounded-[40px] p-[64px] sm:p-[100px] shadow-2xl relative overflow-hidden cursor-light"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <h2 className="relative z-10 font-display text-[36px] sm:text-[48px] font-bold text-white mb-[24px] max-w-[800px] mx-auto leading-tight">Ready to hire smarter?</h2>
          <p className="relative z-10 text-white/80 text-xl mb-[48px] max-w-[600px] mx-auto">
            Join hundreds of recruiters who have automated their top-of-funnel hiring with Vevia.
          </p>
          <Link
            href="/login"
            className="relative z-10 inline-flex items-center gap-[12px] bg-white text-[#00355f] font-bold px-[40px] py-[20px] rounded-2xl hover:bg-sky-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 text-xl"
          >
            <span className="material-symbols-outlined text-[24px]">rocket_launch</span>
            Get Started For Free
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
