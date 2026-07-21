import React from 'react';
import { Award, ShieldCheck, Clock, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
          <Award className="w-4 h-4" />
          <span>Platforma Haqida</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          DTM MASTER Loyihasi
        </h2>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          O'zbekiston Respublikasi Oliy Ta'lim Muassasalariga kiruvchi abituriyentlar hamda Perevod imtihoni topshiruvchilar uchun maxsus yaratilgan professional platforma.
        </p>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
          <p>
            <strong className="text-slate-900 font-bold">DTM MASTER</strong> — abituriyentlarga real imtihon muhitini yaratib berish, bilimini sinash va bilimidagi bo'shliqlarni aniqlashga mo'ljallangan. Platformada barcha savollar rasmiy DTM mezonlariga mos ravishda saralangan.
          </p>

          <h3 className="text-lg font-bold text-slate-900 pt-2">Platforma Afzalliklari:</h3>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
            <li className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>90 ta tasodifiy shakllantiriladigan savollar</span>
            </li>

            <li className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>4 soatlik DTM imtihon vaqti va taymer</span>
            </li>

            <li className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>3 marta yordam (50/50) imkoniyati</span>
            </li>

            <li className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Fisher-Yates algoritmi orqali variantlar tasodifiyligi</span>
            </li>

            <li className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Peshqadamlar global Firestore reytingi</span>
            </li>

            <li className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Shaffof 94 ballik o'tish chegarasi va sertifikatlar</span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
};
