import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Share2, Gift, Copy, Check, Sparkles, AlertCircle, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PromocodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromocodeModal: React.FC<PromocodeModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, redeemReferralCode } = useAuth();
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !userProfile) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(userProfile.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setLoading(true);
    setStatus(null);

    const res = await redeemReferralCode(inputCode.trim());
    setLoading(false);

    if (res.success) {
      setStatus({ type: 'success', message: res.message });
      setInputCode('');
    } else {
      setStatus({ type: 'error', message: res.message });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-100 relative overflow-hidden"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Promokod va Takliflar</h3>
              <p className="text-xs text-slate-500">Do'stlaringizni taklif qiling va bepul kunlar oling!</p>
            </div>
          </div>

          {/* Section 1: User's Own Code */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                Sizning Promokodingiz
              </span>
              <span className="text-[10px] font-medium bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                Do'stingizga +1 kun / Sizga +2 kun
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-amber-200 shadow-sm">
              <span className="font-mono text-lg font-extrabold text-slate-800 tracking-wider flex-1 text-center">
                {userProfile.referralCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Nusxalandi" : "Nusxalash"}</span>
              </button>
            </div>

            <p className="text-[11px] text-amber-700/80 mt-2 text-center">
              Ushbu promokodni do'stingizga yuboring. Do'stingiz ro'yxatdan o'tgach kiritadi!
            </p>
          </div>

          {/* Section 2: Redeem Friend's Code */}
          <form onSubmit={handleRedeem} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Do'stingizning Promokodini kiritish
            </label>

            {userProfile.usedReferralCode ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Siz allaqachon promokod ishlatgansiz ({userProfile.usedReferralCode})!</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="DTM-XXXXX"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={loading || !inputCode.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Faollashtirish</span>
                </button>
              </div>
            )}

            {status && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 border ${
                  status.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {status.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                )}
                <span>{status.message}</span>
              </motion.div>
            )}
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
