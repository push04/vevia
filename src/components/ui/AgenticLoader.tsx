"use client";

import { motion } from "framer-motion";

export function AgenticLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  const containerClass = fullScreen
    ? "fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
    : "flex w-full items-center justify-center p-xl min-h-[400px]";

  return (
    <div className={containerClass}>
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.7, 0.3],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          className="absolute h-32 w-32 rounded-full border border-blue-500/30"
          style={{ borderTopColor: "rgba(0, 82, 255, 0.8)", borderBottomColor: "rgba(0, 82, 255, 0.8)" }}
        />

        {/* Inner fast spinning dashed ring */}
        <motion.div
          animate={{
            rotate: [360, 0],
          }}
          transition={{
            duration: 2,
            ease: "linear",
            repeat: Infinity,
          }}
          className="absolute h-24 w-24 rounded-full border-2 border-dashed border-primary/40"
        />

        {/* Core glowing orb */}
        <motion.div
          animate={{
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 shadow-[0_0_40px_rgba(0,82,255,0.6)]"
        />
        
        {/* Brain Icon overlay */}
        <span className="material-symbols-outlined absolute text-white text-[24px] pointer-events-none drop-shadow-md">
          psychology
        </span>
      </div>
    </div>
  );
}
