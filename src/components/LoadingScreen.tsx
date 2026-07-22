import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Shield, Sparkles, Cpu, Trophy } from "lucide-react";

interface LoadingScreenProps {
  onComplete?: () => void;
  message?: string;
}

export default function LoadingScreen({ onComplete, message = "DTM MASTER platformasi yuklanmoqda..." }: LoadingScreenProps) {
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1200; // 1.2 seconds smooth loading

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 20);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6"
      >
        {/* Logo Badge */}
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-tr from-primary-600 via-primary-500 to-blue-400 rounded-3xl p-0.5 shadow-2xl shadow-primary-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900/90 rounded-[22px] flex items-center justify-center">
              <Shield className="w-10 h-10 text-primary-400 stroke-[2.2]" />
            </div>
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute -bottom-1 -right-1 p-2 bg-amber-500 text-slate-950 rounded-xl shadow-lg"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
          </motion.div>
        </div>

        {/* Title */}
        <div>
          <h2 className="font-display text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            DTM MASTER
          </h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            {message}
          </p>
        </div>

        {/* Progress Bar & Percentage Number */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-bold font-mono text-slate-300 px-1">
            <span className="flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-primary-400 animate-pulse" />
              <span className="text-slate-400 font-sans">Tizim holati</span>
            </span>
            <span className="text-amber-400 text-sm font-black">{progress}%</span>
          </div>

          <div className="w-full h-3 bg-slate-800/80 rounded-full p-0.5 border border-slate-700/50 shadow-inner overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary-500 via-blue-500 to-amber-400 rounded-full shadow-lg"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Security / Badge notice */}
        <div className="pt-4 text-[11px] font-semibold text-slate-400 flex items-center space-x-2 bg-slate-800/50 px-3.5 py-1.5 rounded-full border border-slate-700/50">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>O'zbekiston OTMlariga kirish imtihonlari platformasi</span>
        </div>
      </motion.div>
    </div>
  );
}
