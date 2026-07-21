import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TestResult } from '../types';
import { db, collection, query, where, orderBy, getDocs } from '../firebase';
import { ReferralSection } from '../components/ReferralSection';
import { 
  User, 
  Award, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Crown, 
  Sparkles, 
  BookOpen,
  Calendar,
  Zap,
  Gift
} from 'lucide-react';
import { motion } from 'motion/react';

export const ProfilePage: React.FC = () => {
  const { userProfile, isPremiumActive, isTrialActive } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!userProfile) return;

    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'results'),
          where('userId', '==', userProfile.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnap = await getDocs(q);
        const list: TestResult[] = [];
        querySnap.forEach(d => list.push(d.data() as TestResult));
        setResults(list);
      } catch (err) {
        console.error("Error fetching user history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userProfile]);

  if (!userProfile) return null;

  const handleCopyPromo = () => {
    navigator.clipboard.writeText(userProfile.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const highestScore = results.length > 0 
    ? Math.max(...results.map(r => r.totalScore)) 
    : (userProfile.score || 0);

  const avgScore = results.length > 0 
    ? Math.round((results.reduce((acc, r) => acc + r.totalScore, 0) / results.length) * 10) / 10 
    : 0;

  const passedTests = results.filter(r => r.passed);

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      
      {/* Profile Card Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <img 
            src={userProfile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.nickname}`} 
            alt="User profile photo" 
            className="w-20 h-20 rounded-full border-2 border-blue-500 object-cover shadow-md"
          />

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-extrabold text-slate-900">{userProfile.nickname}</h2>
              {isPremiumActive && (
                <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-extrabold rounded-full flex items-center gap-1 shadow-xs">
                  <Crown className="w-3 h-3 fill-white" />
                  PREMIUM
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium">{userProfile.email}</p>
            <p className="text-[11px] text-slate-400">
              A'zo bo'lingan sana: {new Date(userProfile.createdAt).toLocaleDateString('uz-UZ')}
            </p>
          </div>
        </div>

        {/* Promo Code Box */}
        <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl w-full md:w-auto text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center justify-center gap-1">
            <Gift className="w-3.5 h-3.5 text-amber-600" />
            Mening Promokodim
          </span>
          <div className="flex items-center justify-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200">
            <span className="font-mono text-sm font-extrabold text-slate-800">{userProfile.referralCode}</span>
            <button 
              onClick={handleCopyPromo}
              className="p-1 text-amber-600 hover:text-amber-800 transition cursor-pointer"
              title="Nusxalash"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>

      {/* Referral / Invite Friends Section */}
      <ReferralSection />

      {/* Profile Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs font-semibold text-slate-400">Yechilgan Testlar</span>
          <div className="text-2xl font-extrabold text-blue-600">{userProfile.testsSolved || results.length}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs font-semibold text-slate-400">Eng Yuqori Ball</span>
          <div className="text-2xl font-extrabold text-emerald-600">{highestScore} ball</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs font-semibold text-slate-400">O'rtacha Ball</span>
          <div className="text-2xl font-extrabold text-slate-800">{avgScore} ball</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs font-semibold text-slate-400">Ishlatilgan Yordam</span>
          <div className="text-2xl font-extrabold text-amber-600">{userProfile.helpsUsedCount || 0} marta</div>
        </div>

      </div>

      {/* Certificates Section */}
      {passedTests.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-800">Sertifikatlar va Yutuqlar</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {passedTests.map((test, idx) => (
              <div 
                key={idx}
                className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">DTM MASTER Sertifikati</h4>
                  <p className="text-xs text-emerald-800 font-semibold">{test.directionTitle}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Natija: {test.totalScore} ball • {new Date(test.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solved Test History */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-800">Imtihonlar Tarixi</h3>
        </div>

        {loading ? (
          <p className="text-slate-400 text-xs text-center py-4">Tarix yuklanmoqda...</p>
        ) : results.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-4">Siz hali test topshirmadingiz.</p>
        ) : (
          <div className="space-y-3">
            {results.map((res) => (
              <div 
                key={res.id} 
                className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{res.directionTitle}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(res.createdAt).toLocaleString('uz-UZ')} • {res.correctAnswers} / 90 to'g'ri
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    res.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {res.totalScore} ball ({res.passed ? 'O\'tdi' : 'Yiqildi'})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
