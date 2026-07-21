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
    <div id="profile-dashboard" className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* 1. Header Profile Identity card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl flex flex-col md:flex-row items-center gap-8">
        <img 
          src={userProfile.photoURL} 
          alt={userProfile.displayName} 
          referrerPolicy="no-referrer"
          className="w-24 h-24 rounded-full border-2 border-amber-500/20 object-cover shrink-0 shadow-lg" 
        />
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
            <h1 className="text-2xl font-bold text-white">{userProfile.displayName}</h1>
            <span className="text-xs bg-neutral-950 border border-neutral-800 text-neutral-400 px-2.5 py-1 rounded-full font-mono">
              @{userProfile.username}
            </span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 shrink-0" />
              {userProfile.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 shrink-0" />
              Ro'yxatdan o'tilgan sana: {joinDate}
            </span>
          </div>
          
          <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2">
            {premiumDaysLeft > 0 ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>Premium ({premiumDaysLeft} kun qoldi)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-neutral-950 text-neutral-500 border border-neutral-850 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                <span>Free Trial yakunlangan</span>
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-5 py-2.5 bg-red-950/20 hover:bg-red-950/80 border border-red-500/10 hover:border-red-500/30 text-red-400 rounded-xl transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Tizimdan chiqish</span>
        </button>
      </div>

      {/* 2. Stats Grid block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-md">
          <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block mb-1">Maks Natija</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white">{userProfile.highestScore}</span>
            <span className="text-xs text-neutral-500">/ 90</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-md">
          <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block mb-1">O'rtacha ball</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white">{userProfile.avgScore}</span>
            <span className="text-xs text-neutral-500">/ 90</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-md">
          <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block mb-1">Jami imtihonlar</span>
          <span className="text-3xl font-extrabold text-white">{userProfile.examCount}</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-md">
          <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block mb-1">Yordam ishlatildi</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white">{userProfile.helpUsedTotal}</span>
            <span className="text-xs text-neutral-500">marta</span>
          </div>
        </div>
      </div>

      {/* 3. Promo Sharing Center */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Hamkorlik va Promo-kod tizimi</h3>
            <p className="text-xs text-neutral-500">Do'stlaringizni taklif qiling va bepul Premium kunlarga ega bo'ling!</p>
          </div>
        </div>

        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          Sizning shaxsiy promo kodingiz quyida keltirilgan. Ushbu kod orqali ro'yxatdan o'tgan har bir yangi foydalanuvchi <span className="text-amber-500 font-semibold">+1 kun</span> premium bonus oladi, taklif qilganingiz uchun sizga esa <span className="text-amber-500 font-semibold">+2 kun</span> premium taqdim etiladi!
        </p>

        <div className="flex items-center gap-3 max-w-md bg-neutral-950 p-3 rounded-xl border border-neutral-850">
          <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider pl-2">KODINGIZ:</span>
          <span className="text-base font-mono font-bold text-amber-500 flex-1">{userProfile.promoCode}</span>
          <button
            onClick={copyPromo}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:text-white text-neutral-400 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5"
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
        <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-500" />
          <span>Imtihonlar Tarixi</span>
        </h3>

        {completedExams.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500 text-xs">
            Hali yakunlangan imtihonlar mavjud emas. Birinchi urinishni boshlang!
          </div>
        ) : (
          <div className="space-y-3">
            {completedExams.map((exam) => (
              <div 
                key={exam.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-neutral-700 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-bold text-white">Imtihon natijasi</span>
                    <span className="text-[10px] bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-neutral-500 font-mono">
                      ID: {exam.id.substring(exam.id.length - 6)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Sarflandi: {formatTimeSpent(exam.timeSpent)}
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Yordam ishlatilgan: {exam.helpUsed} marta
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Sana: {new Date(exam.createdAt).toLocaleDateString("uz-UZ")}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-neutral-500 block mb-0.5">To'g'ri javob</span>
                  <span className="text-xl font-extrabold text-emerald-500 font-mono">{exam.score}</span>
                  <span className="text-xs text-neutral-500"> / 90</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
