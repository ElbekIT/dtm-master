import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { db, collection, query, orderBy, limit, onSnapshot } from '../firebase';
import { Award, Trophy, Clock, Zap, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const LeaderboardPage: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('score', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: LeaderboardEntry[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as LeaderboardEntry);
      });
      // Sort secondary by timeUsedSeconds ascending
      list.sort((a, b) => b.score - a.score || a.timeUsedSeconds - b.timeUsedSeconds);
      setEntries(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Leaderboard error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
          <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Global Peshqadamlar</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          DTM MASTER Top 100 Reytingi
        </h2>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          Imtihondan eng yuqori ball to'plagan va eng kam vaqt sarflagan abituriyentlar ro'yxati (Real-vaqt rejimida Firestore-dan sinxronlashadi).
        </p>
      </div>

      {/* Leaderboard Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-slate-500 text-sm font-semibold">Reyting yuklanmoqda...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full mx-auto flex items-center justify-center">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Hozircha reytingda hech kim yo'q</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Siz birinchi bo'lib test yechib, global reyting ro'yxatini boshlab berishingiz mumkin!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-4 px-6">O'rin</th>
                  <th className="py-4 px-6">Abituriyent</th>
                  <th className="py-4 px-6">Yo'nalish</th>
                  <th className="py-4 px-6 text-center">Jami Ball</th>
                  <th className="py-4 px-6 text-center">To'g'ri</th>
                  <th className="py-4 px-6 text-center">Sarf Vaqt</th>
                  <th className="py-4 px-6 text-center">Yordam</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                {entries.map((entry, idx) => {
                  const rank = idx + 1;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;

                  return (
                    <motion.tr 
                      key={entry.id || idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`hover:bg-slate-50/80 transition ${
                        isTop1 ? 'bg-amber-50/40' : isTop2 ? 'bg-slate-50/60' : isTop3 ? 'bg-amber-900/5' : ''
                      }`}
                    >
                      {/* Rank Badge */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl font-extrabold text-xs">
                          {isTop1 ? (
                            <span className="bg-amber-500 text-white w-8 h-8 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/30">
                              🥇
                            </span>
                          ) : isTop2 ? (
                            <span className="bg-slate-300 text-slate-800 w-8 h-8 rounded-xl flex items-center justify-center">
                              🥈
                            </span>
                          ) : isTop3 ? (
                            <span className="bg-amber-700/80 text-white w-8 h-8 rounded-xl flex items-center justify-center">
                              🥉
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-xl flex items-center justify-center">
                              #{rank}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Nickname & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img 
                            src={entry.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.nickname}`} 
                            alt="Avatar" 
                            className="w-9 h-9 rounded-full border border-slate-200 object-cover"
                          />
                          <span className="font-bold text-slate-900">{entry.nickname}</span>
                        </div>
                      </td>

                      {/* Direction */}
                      <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                        {entry.directionTitle}
                      </td>

                      {/* Score */}
                      <td className="py-4 px-6 text-center">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-xl font-extrabold text-sm border border-blue-100">
                          {entry.score} ball
                        </span>
                      </td>

                      {/* Correct Answers */}
                      <td className="py-4 px-6 text-center text-emerald-600 font-bold">
                        {entry.correctAnswers} / 90
                      </td>

                      {/* Time Used */}
                      <td className="py-4 px-6 text-center text-slate-500 font-mono text-xs">
                        {formatTime(entry.timeUsedSeconds)}
                      </td>

                      {/* Helps Used */}
                      <td className="py-4 px-6 text-center text-amber-600 text-xs font-bold">
                        {entry.helpsUsed || 0} marta
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
