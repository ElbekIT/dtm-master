import React from "react";
import { motion } from "motion/react";
import { Sparkles, Trophy, Gift, CheckCircle2, Star, Zap } from "lucide-react";

interface ReferralRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  rewardText?: string;
  badgeText?: string;
}

export default function ReferralRewardModal({
  isOpen,
  onClose,
  title = "TABRIKLAYMIZ! 🎉",
  message,
  rewardText = "+2 Kunlik Bepul VIP Premium",
  badgeText = "Do'st taklifi bonusi"
}: ReferralRewardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-amber-200 overflow-hidden text-center space-y-6"
      >
        {/* Glowing Top Decoration */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-primary-500 to-amber-500" />
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Big Icon Banner */}
        <div className="relative inline-block mx-auto pt-2">
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-amber-400 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/30 mx-auto transform -rotate-3 hover:rotate-0 transition-transform">
            <Gift className="w-10 h-10 text-slate-950 stroke-[2.2]" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="absolute -top-2 -right-2 p-1.5 bg-primary-600 text-white rounded-xl shadow-lg"
          >
            <Sparkles className="w-5 h-5 fill-white" />
          </motion.div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center space-x-1.5 bg-amber-100/80 text-amber-900 border border-amber-300/60 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
          <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
          <span>{badgeText}</span>
        </div>

        {/* Title & Message */}
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">
            {title}
          </h2>

          <p className="text-slate-600 text-sm font-semibold leading-relaxed px-2">
            {message}
          </p>
        </div>

        {/* Reward Highlight Box */}
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-center space-x-3 shadow-inner">
          <Trophy className="w-6 h-6 text-amber-600 shrink-0" />
          <span className="font-extrabold text-amber-950 text-sm sm:text-base font-display">
            {rewardText}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
        >
          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          <span>Rahmat, Tushundim! 🚀</span>
        </button>
      </motion.div>
    </div>
  );
}
