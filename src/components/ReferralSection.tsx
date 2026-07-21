import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { motion } from 'motion/react';

export const ReferralSection: React.FC = () => {
  const { userProfile, redeemReferralCode } = useAuth();
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!userProfile) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(userProfile.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareTelegram = () => {
    const text = `Salom! DTM MASTER ilovasida DTM va Perevod imtihonlariga tayyorlaning. Mening promokodim: ${userProfile.referralCode}\n\nUshbu promokod orqali bepul sinov kunlariga ega bo'lasiz!`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setLoading(true);
    setStatusMessage(null);

    const res = await redeemReferralCode(inputCode);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setInputCode('');
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-blue-800/50 shadow-2xl space-y-6 relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/30">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>Do'stlarni Taklif Qilish Dasturi</span>
          </div>
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
            Do'stingizni taklif qiling va BEPUL Kunlar oling!
          </h3>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-300 block">Jami Sinov Kunlaringiz</span>
          <span className="text-xl font-black text-amber-400">{userProfile.trialDays || 2} KUN</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: My Promo Code */}
        <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Sizning Shaxsiy Promokodingiz:</span>
            <div className="flex items-center gap-2 bg-slate-950/80 p-3 rounded-xl border border-white/10">
              <span className="font-mono text-base font-black text-amber-300 tracking-wider flex-1 truncate">
                {userProfile.referralCode}
              </span>
              
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Nusxalandi</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Nusxalash</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleShareTelegram}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Telegram orqali Do'stlarga Ulashish</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              Do'stingiz promokodingizdan foydalanganda sizga <strong className="text-amber-300">+2 kun</strong> va do'stingizga <strong className="text-amber-300">+1 kun</strong> bepul beriladi!
            </p>
          </div>
        </div>

        {/* Right Side: Enter Friend's Code */}
        <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
          <form onSubmit={handleRedeem} className="space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Do'stingiz Promokodini Kiritish:</span>
            
            {userProfile.usedReferralCode ? (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Siz allaqachon promokod ishlatgansiz: <strong>{userProfile.usedReferralCode}</strong></span>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Masalan: DTM-ISMI-1234"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs font-mono uppercase text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={loading || !inputCode.trim()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {loading ? '...' : 'Kiritish'}
                </button>
              </div>
            )}

            {statusMessage && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
              }`}>
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
            )}
          </form>

          <div className="p-3 bg-blue-950/50 rounded-xl border border-blue-800/40 text-[11px] text-slate-300 space-y-1">
            <span className="font-bold text-amber-300 block">⚡ Qanday ishlaydi?</span>
            <p>
              Har bir taklif qilingan va promokodingizni kiritgan do'stingiz uchun hisobingizga avtomatik bepul sinov kunlari qo'shiladi.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
