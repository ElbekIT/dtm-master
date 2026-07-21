import React from 'react';
import { Award, Heart, Shield, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                DTM <span className="text-blue-500">MASTER</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              O'zbekiston abituriyentlari va Perevod imtihonlariga professional tayyorgarlik platformasi. Yuqori natija va doimiy rivojlanish.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Bo'limlar</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate?.('home')} className="hover:text-blue-400 transition cursor-pointer">Asosiy sahifa</button></li>
              <li><button onClick={() => onNavigate?.('ranking')} className="hover:text-blue-400 transition cursor-pointer">Peshqadamlar reytingi</button></li>
              <li><button onClick={() => onNavigate?.('premium')} className="hover:text-blue-400 transition cursor-pointer">Premium obuna</button></li>
              <li><button onClick={() => onNavigate?.('admin')} className="hover:text-blue-400 transition cursor-pointer text-amber-400 flex items-center gap-1 font-semibold"><ShieldCheck className="w-3.5 h-3.5" /> Admin Panel</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Biz bilan aloqa</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Telegram: @dtmmaster_support</li>
              <li>Toshkent sh., O'zbekiston</li>
              <li>To'lov va obuna qo'llab-quvvatlash</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Xavfsizlik</h4>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <Shield className="w-5 h-5 shrink-0" />
              <span>Imtihonlar shaffofligi va anti-cheat nazorati kafolatlangan.</span>
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} DTM MASTER. Barcha huquqlar himoyalangan.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>O'zbekiston abituriyentlari uchun maxsus tayyorlandi</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
