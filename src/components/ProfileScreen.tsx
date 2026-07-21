import React, { useState } from "react";
import { UserProfile, ExamResult } from "../types";
import { motion } from "motion/react";
import { 
  User, 
  Mail, 
  Calendar, 
  Sparkles, 
  Award, 
  Clock, 
  HelpCircle, 
  Share2, 
  Copy, 
  Check, 
  Zap, 
  LogOut,
  Gift,
  Shield,
  Activity
} from "lucide-react";

interface ProfileScreenProps {
  userProfile: UserProfile;
  completedExams: ExamResult[];
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onLogout: () => void;
}

export default function ProfileScreen({ userProfile, completedExams, showToast, onLogout }: ProfileScreenProps) {
  const [copied, setCopied] = useState(false);

  const copyPromo = () => {
    navigator.clipboard.writeText(userProfile.promoCode);
    setCopied(true);
    showToast("Promo kod nusxalandi!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const getPremiumDaysLeft = () => {
    const diff = userProfile.premiumExpiresAt - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  };

  const formatTimeSpent = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}s ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const premiumDaysLeft = getPremiumDaysLeft();
  const joinDate = new Date(userProfile.createdAt).toLocaleDateString("uz-UZ");

  return (
    <div id="profile-dashboard" className="max-w-4xl mx-auto px-6 py-8 space-y-10">
      {/* 1. Header Profile Identity card */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-8 shadow-xl flex flex-col md:flex-row items-center gap-8 hover:border-zinc-700 transition-colors duration-300">
        <img 
          src={userProfile.photoURL} 
          alt={userProfile.displayName} 
          referrerPolicy="no-referrer"
          className="w-20 h-20 rounded-full border-2 border-amber-500/10 object-cover shrink-0 shadow-lg" 
        />
        <div className="flex-1 text-center md:text-left space-y-2.5">
          <div className="flex flex-col md:flex-row md:items-center gap-2.5 justify-center md:justify-start">
            <h1 className="text-2xl font-bold text-white tracking-tight font-display">{userProfile.displayName}</h1>
            <span className="text-[10px] bg-zinc-950 border border-zinc-850 text-zinc-400 px-3 py-1 rounded-full font-mono">
              @{userProfile.username}
            </span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[11px] text-zinc-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-zinc-600 shrink-0" />
              {userProfile.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-600 shrink-0" />
              Sana: {joinDate}
            </span>
          </div>
          
          <div className="pt-1 flex flex-wrap justify-center md:justify-start gap-2">
            {premiumDaysLeft > 0 ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>Premium ({premiumDaysLeft} kun qoldi)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-zinc-950 text-zinc-500 border border-zinc-900 px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider">
                <span>Free Trial yakunlangan</span>
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-5 py-3 bg-red-950/15 hover:bg-red-950/40 border border-red-500/15 hover:border-red-500/30 text-red-400 rounded-xl transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transform hover:-translate-y-0.5 active:translate-y-0 duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Chiqish</span>
        </button>
      </div>

      {/* 2. Stats Grid block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:border-zinc-700 transition-colors duration-300">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Maks Natija</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white font-mono">{userProfile.highestScore}</span>
            <span className="text-xs text-zinc-500">/ 90</span>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:border-zinc-700 transition-colors duration-300">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1 font-sans">O'rtacha ball</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white font-mono">{userProfile.avgScore}</span>
            <span className="text-xs text-zinc-500">/ 90</span>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:border-zinc-700 transition-colors duration-300">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Jami imtihonlar</span>
          <span className="text-3xl font-extrabold text-white font-mono">{userProfile.examCount}</span>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:border-zinc-700 transition-colors duration-300">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Yordam</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white font-mono">{userProfile.helpUsedTotal}</span>
            <span className="text-xs text-zinc-500">marta</span>
          </div>
        </div>
      </div>

      {/* 3. Promo Sharing Center */}
      <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 border border-zinc-800 rounded-2xl p-6.5 shadow-md hover:border-zinc-700 transition-colors duration-300">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20 shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Hamkorlik va Promo-kod tizimi</h3>
            <p className="text-xs text-zinc-500">Do'stlaringizni taklif qiling va bepul Premium kunlarga ega bo'ling!</p>
          </div>
        </div>

        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          Sizning shaxsiy promo kodingiz quyida keltirilgan. Ushbu kod orqali ro'yxatdan o'tgan har bir yangi foydalanuvchi <span className="text-amber-500 font-semibold">+1 kun</span> premium bonus oladi, taklif qilganingiz uchun sizga esa <span className="text-amber-500 font-semibold">+2 kun</span> premium taqdim etiladi!
        </p>

        <div className="flex items-center gap-3 max-w-md bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider pl-2">KODINGIZ:</span>
          <span className="text-base font-mono font-bold text-amber-500 flex-1">{userProfile.promoCode}</span>
          <button
            onClick={copyPromo}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:text-white text-zinc-400 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer transform active:scale-95 duration-100"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500">Nusxalandi!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Nusxalash</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Historic Exam Logs block */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-500" />
          <span>Imtihonlar Tarixi</span>
        </h3>

        {completedExams.length === 0 ? (
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-10 text-center text-zinc-500 text-xs font-medium">
            Hali yakunlangan imtihonlar mavjud emas. Birinchi urinishni boshlang!
          </div>
        ) : (
          <div className="space-y-4">
            {completedExams.map((exam) => (
              <div 
                key={exam.id}
                className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-zinc-700 transition-all duration-200 shadow-sm"
              >
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2.5 justify-center sm:justify-start mb-2">
                    <span className="text-sm font-bold text-white tracking-wide">Imtihon natijasi</span>
                    <span className="text-[9px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-500 font-mono uppercase">
                      ID: {exam.id.substring(exam.id.length - 6)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-[11px] text-zinc-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-600" />
                      Sarflandi: {formatTimeSpent(exam.timeSpent)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />
                      Yordam: {exam.helpUsed} marta
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                      {new Date(exam.createdAt).toLocaleDateString("uz-UZ")}
                    </span>
                  </div>
                </div>

                <div className="text-center sm:text-right shrink-0 bg-zinc-950/60 sm:bg-transparent px-4 py-2 sm:p-0 rounded-xl border border-zinc-900 sm:border-0">
                  <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wider font-bold">To'g'ri javob</span>
                  <span className="text-xl font-extrabold text-amber-500 font-mono">{exam.score}</span>
                  <span className="text-xs text-zinc-500 font-medium"> / 90</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
