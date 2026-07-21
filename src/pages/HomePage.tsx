import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Play, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Award, 
  Brain, 
  CheckCircle, 
  HelpCircle, 
  Zap, 
  Crown,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';

interface HomePageProps {
  onStartTest: () => void;
  onOpenPremium: () => void;
  onOpenRanking: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartTest, onOpenPremium, onOpenRanking }) => {
  const { userProfile, loginWithGoogle, isTrialActive, isPremiumActive, canTakeTest } = useAuth();

  return (
    <div className="space-y-12 py-6">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-white rounded-3xl p-8 md:p-12 border border-blue-100 shadow-sm text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/80 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>DTM 2026 Respublika Standarti</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight"
          >
            Assalomu alaykum! <br />
            <span className="text-blue-600">DTM MASTER</span> platformasiga xush kelibsiz.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-medium"
          >
            Bu yerda siz DTM, Perevod va Universitet kirish testlariga professional, aniq va adolatli tayyorgarlik ko'rishingiz mumkin.
          </motion.p>

          {/* Trial / Premium Banner */}
          {userProfile && (
            <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 bg-white p-3 px-5 rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto">
              {isPremiumActive ? (
                <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                  <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>Sizda PREMIUM obuna faol! Cheksiz test yechishingiz mumkin.</span>
                </div>
              ) : isTrialActive ? (
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>2 Kunlik Bepul Sinov Muddati faol!</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-rose-700 font-bold text-sm">
                  <Clock className="w-5 h-5 text-rose-500" />
                  <span>Sinov muddati tugadi! Test yechish uchun Premium oling.</span>
                  <button 
                    onClick={onOpenPremium} 
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
                  >
                    Premium
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Large Start Button */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="pt-4"
          >
            {userProfile ? (
              <button
                onClick={onStartTest}
                className="group relative inline-flex items-center justify-center gap-3 py-5 px-10 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg md:text-xl rounded-2xl shadow-2xl shadow-blue-500/30 hover:scale-102 active:scale-98 transition cursor-pointer"
              >
                <Play className="w-7 h-7 fill-white group-hover:translate-x-1 transition-transform" />
                <span>TESTNI BOSHLASH</span>
              </button>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="inline-flex items-center gap-3 py-4 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-500/25 transition cursor-pointer"
              >
                <Sparkles className="w-6 h-6" />
                <span>Google orqali kiring va Testni Boshlang</span>
              </button>
            )}
          </motion.div>

        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">90 ta Savol & 4 Soat Vaqt</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Haqiqiy DTM formatida 90 ta test savollari va 4 soatlik imtihon vaqti. Avto-saqlash bilan birgalikda.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">3 ta Yordam Imkoniyati</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Qiyin savollarga tushganda 3 marta 'Yordam' funksiyasidan foydalanib to'g'ri javobni tanlash imkoniyati.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Peshqadamlar Reytingi</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Barcha abituriyentlar o'rtasida shaffof reyting. Ball va sarflangan vaqtga ko'ra o'rningizni ko'ring.
          </p>
        </div>

      </section>

      {/* Passing Score Threshold Banner */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wider">
            O'tish Balli
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold">O'tish Balli: 94 Ball</h2>
          <p className="text-slate-400 text-sm max-w-xl">
            94 ball va undan yuqori natija ko'rsatgan abituriyentlar muvaffaqiyatli o'tgan hisoblanadi va munosib sertifikatga ega bo'ladi.
          </p>
        </div>

        <button
          onClick={onOpenRanking}
          className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl shadow-lg transition cursor-pointer text-sm shrink-0 flex items-center gap-2"
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>Reytingni Ko'rish</span>
        </button>
      </section>

    </div>
  );
};
