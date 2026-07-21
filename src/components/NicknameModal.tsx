import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Shield, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const NicknameModal: React.FC = () => {
  const { createNickname, currentUser } = useAuth();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("Iltimos, taxallusingizni kiriting!");
      return;
    }
    setError('');
    setSubmitting(true);

    const result = await createNickname(nickname.trim());
    if (!result.success) {
      setError(result.message || "Xatolik yuz berdi!");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-100"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 shadow-inner">
            <UserCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Xush kelibsiz!</h2>
          <p className="text-slate-500 text-sm mt-1">
            DTM MASTER platformasiga xush kelibsiz. Tizimda sizni tanib olishimiz va reytingda ko'rsatishimiz uchun noyob taxallus (nickname) kiriting.
          </p>
        </div>

        {currentUser?.photoURL && (
          <div className="flex items-center justify-center mb-6 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <img 
              src={currentUser.photoURL} 
              alt="Google Avatar" 
              className="w-10 h-10 rounded-full border border-blue-200"
            />
            <div className="text-left">
              <div className="text-xs text-slate-400 font-medium">Google Akkaunt</div>
              <div className="text-sm font-semibold text-slate-700">{currentUser.email}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Sizning Taxallusingiz (Nickname)
            </label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              placeholder="Masalan: Elbek_DTM"
              maxLength={20}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition text-slate-800 font-medium"
              required
              disabled={submitting}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span>Saqlanmoqda...</span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Davom etish</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center text-xs text-slate-400 gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span>Taxallus keyinchalik reytingda aks ettiriladi.</span>
        </div>
      </motion.div>
    </div>
  );
};
