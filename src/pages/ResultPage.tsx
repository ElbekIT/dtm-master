import React, { useEffect } from 'react';
import { TestResult } from '../types';
import { FAIL_MOTIVATIONAL_QUOTES, PASS_CONGRATS_QUOTES } from '../data/quotes';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  RotateCcw, 
  Users, 
  Zap, 
  AlertOctagon, 
  BookOpen, 
  BarChart3,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface ResultPageProps {
  result: TestResult;
  onRetakeTest: () => void;
  onOpenRanking: () => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({ result, onRetakeTest, onOpenRanking }) => {
  const isPassed = result.passed; // Score >= 94

  useEffect(() => {
    if (isPassed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isPassed]);

  const motivationalQuote = isPassed 
    ? PASS_CONGRATS_QUOTES[Math.floor(Math.random() * PASS_CONGRATS_QUOTES.length)]
    : FAIL_MOTIVATIONAL_QUOTES[Math.floor(Math.random() * FAIL_MOTIVATIONAL_QUOTES.length)];

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? `${h}s ` : ''}${m}m ${s}s`;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      
      {/* Pass / Fail Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-8 md:p-10 rounded-3xl text-center space-y-4 border shadow-xl relative overflow-hidden ${
          isPassed 
            ? 'bg-emerald-600 text-white border-emerald-500' 
            : 'bg-rose-600 text-white border-rose-500'
        }`}
      >
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-white/20 backdrop-blur-md">
          {isPassed ? (
            <CheckCircle2 className="w-12 h-12 text-white" />
          ) : (
            <AlertOctagon className="w-12 h-12 text-white" />
          )}
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-white/80">
            {result.directionTitle} Yo'nalishi
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            {isPassed ? "TABRIKLAYMIZ!" : "YIQILDINGIZ"}
          </h1>
          <p className="text-base md:text-lg font-medium max-w-xl mx-auto text-white/90">
            {isPassed 
              ? "Siz o'qishga kirish uchun juda yaxshi tayyorgarlik ko'rgansiz." 
              : "Yaxshilab tayyorlaning. O'tish balli 94 ball hisoblanadi."}
          </p>
        </div>

        {/* Total Score Display */}
        <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 text-white font-extrabold text-2xl md:text-3xl">
          <Award className="w-8 h-8" />
          <span>Jami Ball: {result.totalScore} ball</span>
        </div>

        {/* Motivational Quote Box */}
        <div className="mt-4 p-5 bg-black/20 rounded-2xl text-xs md:text-sm text-white/90 italic leading-relaxed max-w-2xl mx-auto border border-white/10">
          "{motivationalQuote}"
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs font-semibold text-slate-400">To'g'ri Javoblar</span>
          <div className="text-2xl font-extrabold text-emerald-600 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-5 h-5" />
            <span>{result.correctAnswers}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs font-semibold text-slate-400">Noto'g'ri Javoblar</span>
          <div className="text-2xl font-extrabold text-rose-600 flex items-center justify-center gap-1">
            <XCircle className="w-5 h-5" />
            <span>{result.wrongAnswers}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs font-semibold text-slate-400">Sarf qilingan Vaqt</span>
          <div className="text-2xl font-extrabold text-slate-800 flex items-center justify-center gap-1">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-lg">{formatTime(result.timeUsedSeconds)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs font-semibold text-slate-400">Ishlatilgan Yordam</span>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center justify-center gap-1">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>{result.helpsUsed} marta</span>
          </div>
        </div>

      </div>

      {/* Subject Performance Breakdown */}
      {result.subjectBreakdown && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">Fanlar Kesimida Natijalar</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(result.subjectBreakdown).map(([subject, rawInfo]) => {
              const info = rawInfo as { total: number; correct: number; score: number };
              const perc = Math.round((info.correct / info.total) * 100) || 0;
              return (
                <div key={subject} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="uppercase">{subject}</span>
                    <span>{info.correct} / {info.total} ({perc}%) • {Math.round(info.score * 10) / 10} ball</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        perc >= 60 ? 'bg-emerald-500' : perc >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${perc}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button
          onClick={onRetakeTest}
          className="w-full sm:w-auto py-4 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer text-sm"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Yangi Test Yechish</span>
        </button>

        <button
          onClick={onOpenRanking}
          className="w-full sm:w-auto py-4 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 transition cursor-pointer text-sm"
        >
          <Users className="w-5 h-5 text-blue-400" />
          <span>Peshqadamlar Reytingi</span>
        </button>
      </div>

    </div>
  );
};
