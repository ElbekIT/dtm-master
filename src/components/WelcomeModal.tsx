import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Award, Heart, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const WelcomeModal: React.FC = () => {
  const { userProfile, confirmWelcome } = useAuth();

  if (!userProfile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-100 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400" />

        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-inner">
          <Award className="w-10 h-10" />
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">
          Assalomu alaykum, <span className="text-blue-600">{userProfile.nickname}</span>!
        </h2>

        <div className="my-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 text-sm leading-relaxed space-y-2">
          <p>
            Siz bizning <strong className="text-slate-800">DTM MASTER</strong> platformamizga muvaffaqiyatli a'zo bo'ldingiz. Bizning platformamiz orqali DTM va Perevod imtihonlariga professional darajada tayyorgarlik ko'rishingiz mumkin.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sizga 2 kunlik Bepul Sinov Muddati berildi!</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-6">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>Talabalik sari birinchi qadamingiz muborak bo'lsin!</span>
        </div>

        <button
          onClick={confirmWelcome}
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer text-base"
        >
          <span>Tasdiqlash va Boshlash</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};
