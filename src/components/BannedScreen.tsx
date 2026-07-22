import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ShieldAlert, AlertTriangle, LogOut, Clock, MessageSquare, AlertCircle } from "lucide-react";
import { User } from "../types";

interface BannedScreenProps {
  currentUser: User;
  onLogout: () => void;
}

export default function BannedScreen({ currentUser, onLogout }: BannedScreenProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isPermanent = currentUser.bannedUntil === "permanent" || !currentUser.bannedUntil;
  const bannedUntilMs = !isPermanent && currentUser.bannedUntil ? new Date(currentUser.bannedUntil).getTime() : 0;
  const diffMs = Math.max(0, bannedUntilMs - now);

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const bannedReason = currentUser.bannedReason || "Tizim qoidalarini va foydalanish shartlarini buzganingiz sababli akkauntingiz bloklandi.";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10 text-center space-y-6"
      >
        {/* Animated Warning Shield */}
        <div className="relative inline-block">
          <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/40 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-lg shadow-red-500/20 animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            BLOK
          </span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
            AKKAUNTINGIZ BLOKLANDI!
          </h1>
          <p className="text-xs font-bold text-red-400 mt-1 uppercase tracking-wider">
            Kirish va test yechish cheklangan
          </p>
        </div>

        {/* User Info & Reason Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3 font-semibold text-xs text-slate-300">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400">Abituriyent:</span>
            <span className="font-extrabold text-white text-sm">{currentUser.nickname}</span>
          </div>

          <div className="space-y-1">
            <div className="text-slate-400 flex items-center space-x-1 font-bold text-[11px] uppercase tracking-wider text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Bloklanish sababi:</span>
            </div>
            <p className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 font-medium text-xs leading-relaxed">
              "{bannedReason}"
            </p>
          </div>
        </div>

        {/* Duration / Countdown Widget */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="text-slate-400 text-xs font-bold flex items-center justify-center space-x-1.5 text-slate-400">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>BLOKLASH MUDDATI:</span>
          </div>

          {isPermanent ? (
            <div className="py-2 text-center">
              <span className="text-lg font-black text-red-500 uppercase tracking-widest font-mono">
                UMRBOD (PERMANENT)
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Ushbu taqiq muddatsiz o'rnatilgan.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="bg-slate-900 rounded-xl p-2 border border-slate-800">
                  <div className="text-lg font-black text-amber-400 font-mono leading-none">{days}</div>
                  <div className="text-[9px] text-slate-500 font-bold mt-1">KUN</div>
                </div>
                <div className="bg-slate-900 rounded-xl p-2 border border-slate-800">
                  <div className="text-lg font-black text-amber-400 font-mono leading-none">{hours.toString().padStart(2, '0')}</div>
                  <div className="text-[9px] text-slate-500 font-bold mt-1">SOAT</div>
                </div>
                <div className="bg-slate-900 rounded-xl p-2 border border-slate-800">
                  <div className="text-lg font-black text-amber-400 font-mono leading-none">{minutes.toString().padStart(2, '0')}</div>
                  <div className="text-[9px] text-slate-500 font-bold mt-1">DAQ</div>
                </div>
                <div className="bg-slate-900 rounded-xl p-2 border border-slate-800">
                  <div className="text-lg font-black text-amber-400 font-mono leading-none">{seconds.toString().padStart(2, '0')}</div>
                  <div className="text-[9px] text-slate-500 font-bold mt-1">SON</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono text-center">
                Tugash vaqti: {currentUser.bannedUntil && !isNaN(new Date(currentUser.bannedUntil).getTime())
                  ? new Date(currentUser.bannedUntil).toLocaleString('uz-UZ')
                  : "Muddatsiz"}
              </p>
            </div>
          )}
        </div>

        {/* Contact Support and Logout Actions */}
        <div className="space-y-2.5 pt-2">
          <a
            href="https://t.me/dtm_master_admin"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>Ma'murbilan bog'lanish (Telegram)</span>
          </a>

          <button
            onClick={onLogout}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Tizimdan chiqish</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
