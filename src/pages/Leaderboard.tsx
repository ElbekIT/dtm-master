/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Trophy, Medal, Star, Clock, Calendar, Search } from "lucide-react";
import { db, rtdb, handleFirestoreError, OperationType, getDocs } from "../lib/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { LeaderboardEntry } from "../types";

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let unsubUsers: (() => void) | null = null;
    let unsubLeaderboard: (() => void) | null = null;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const mergedEntriesMap: Record<string, LeaderboardEntry> = {};

        // 1. Fetch from leaderboard collection
        try {
          const lSnap = await getDocs(collection(db, "leaderboard"));
          lSnap.forEach((docSnap: any) => {
            const data = docSnap.data();
            if (data && data.uid && data.score > 0) {
              mergedEntriesMap[data.uid] = {
                uid: data.uid,
                nickname: data.nickname || "Abituriyent",
                direction: data.direction || "O'quvchi",
                score: data.score || 0,
                correctCount: data.correctCount || 0,
                timeUsed: data.timeUsed || "00:00",
                hintsUsed: data.hintsUsed || 0,
                updatedAt: data.updatedAt || new Date().toISOString()
              };
            }
          });
        } catch (err) {
          console.warn("Failed to fetch leaderboard collection:", err);
        }

        // 2. Fetch from users collection to make sure every registered user with a score is present
        try {
          const uSnap = await getDocs(collection(db, "users"));
          uSnap.forEach((docSnap: any) => {
            const data = docSnap.data();
            if (data && data.uid && data.score > 0) {
              const existing = mergedEntriesMap[data.uid];
              const highestScore = existing ? Math.max(existing.score, data.score) : data.score;
              mergedEntriesMap[data.uid] = {
                uid: data.uid,
                nickname: data.nickname || existing?.nickname || "Abituriyent",
                direction: data.selectedDirection || existing?.direction || "O'quvchi",
                score: highestScore,
                correctCount: existing?.correctCount || Math.round((data.score / 189) * 90),
                timeUsed: existing?.timeUsed || "35:00",
                hintsUsed: existing?.hintsUsed || 0,
                updatedAt: data.lastLogin || new Date().toISOString()
              };
            }
          });
        } catch (err) {
          console.warn("Failed to fetch users collection for leaderboard:", err);
        }

        // 3. Fetch server-side users database to ensure 100% sync
        try {
          const sRes = await fetch("/api/admin/users");
          if (sRes.ok) {
            const sData = await sRes.json();
            const serverUsers = sData.users || [];
            serverUsers.forEach((u: any) => {
              if (u && u.uid && u.score > 0) {
                const existing = mergedEntriesMap[u.uid];
                const highestScore = existing ? Math.max(existing.score, u.score) : u.score;
                mergedEntriesMap[u.uid] = {
                  uid: u.uid,
                  nickname: u.nickname || existing?.nickname || "Abituriyent",
                  direction: u.selectedDirection || existing?.direction || "O'quvchi",
                  score: highestScore,
                  correctCount: existing?.correctCount || Math.round((u.score / 189) * 90),
                  timeUsed: existing?.timeUsed || "35:00",
                  hintsUsed: existing?.hintsUsed || 0,
                  updatedAt: u.lastLogin || new Date().toISOString()
                };
              }
            });
          }
        } catch (err) {
          console.warn("Failed to fetch server users for leaderboard:", err);
        }

        // Convert map to array and sort descending by score
        const list = Object.values(mergedEntriesMap).sort((a, b) => b.score - a.score);
        setEntries(list);
      } catch (err) {
        console.error("Leaderboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Subscribe to Realtime Database live updates for users
    try {
      const usersRef = ref(rtdb, "users");
      unsubUsers = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const usersVal = snapshot.val();
          setEntries((prevEntries) => {
            const map: Record<string, LeaderboardEntry> = {};
            prevEntries.forEach(e => { map[e.uid] = e; });

            Object.entries(usersVal).forEach(([key, userItem]: [string, any]) => {
              if (userItem && (userItem.score > 0 || userItem.uid)) {
                const existing = map[key] || map[userItem.uid];
                const score = Math.max(userItem.score || 0, existing?.score || 0);
                if (score > 0) {
                  map[userItem.uid || key] = {
                    uid: userItem.uid || key,
                    nickname: userItem.nickname || existing?.nickname || "Abituriyent",
                    direction: userItem.selectedDirection || existing?.direction || "O'quvchi",
                    score: score,
                    correctCount: existing?.correctCount || Math.round((score / 189) * 90),
                    timeUsed: existing?.timeUsed || "35:00",
                    hintsUsed: existing?.hintsUsed || 0,
                    updatedAt: userItem.lastLogin || new Date().toISOString()
                  };
                }
              }
            });

            return Object.values(map).sort((a, b) => b.score - a.score);
          });
        }
      });
    } catch (e) {
      console.warn("RTDB Leaderboard listener error:", e);
    }

    return () => {
      if (unsubUsers) unsubUsers();
    };
  }, []);

  // Filter list by search term (nickname)
  const filteredEntries = entries.filter(e => 
    e.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.direction.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 select-none">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-amber-500 stroke-[2]" />
              <span>Abituriyentlar Reytingi</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Uzbekistan bo'yicha eng yuqori natija qayd etgan TOP-100 abituriyentlar ro'yxati (Real vaqt rejimida).
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Ism yoki yo'nalish bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Podium Top 3 */}
        {!loading && filteredEntries.length >= 3 && searchTerm === "" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 pb-6">
            
            {/* 2nd place */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 text-center flex flex-col items-center relative order-2 md:order-1"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center font-bold text-lg mb-3 shadow-inner">
                2
              </div>
              <Medal className="w-6 h-6 text-slate-400 mb-2" />
              <h3 className="font-display font-bold text-slate-800 text-base">{filteredEntries[1].nickname}</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{filteredEntries[1].direction}</p>
              <div className="text-2xl font-black text-slate-700 font-display mt-4">
                {filteredEntries[1].score} <span className="text-xs text-slate-400 font-medium">ball</span>
              </div>
            </motion.div>

            {/* 1st place */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-amber-300 rounded-3xl p-8 text-center flex flex-col items-center relative order-1 md:order-2 md:-translate-y-4 shadow-lg shadow-amber-500/5"
            >
              <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 font-bold text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                CHEMPION
              </div>
              <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-xl mb-3 shadow-inner">
                1
              </div>
              <Trophy className="w-8 h-8 text-amber-500 mb-2" />
              <h3 className="font-display font-black text-slate-900 text-lg">{filteredEntries[0].nickname}</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">{filteredEntries[0].direction}</p>
              <div className="text-3xl font-black text-amber-600 font-display mt-4">
                {filteredEntries[0].score} <span className="text-xs text-slate-400 font-semibold">ball</span>
              </div>
            </motion.div>

            {/* 3rd place */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 text-center flex flex-col items-center relative order-3"
            >
              <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg mb-3 shadow-inner">
                3
              </div>
              <Medal className="w-6 h-6 text-amber-700/70 mb-2" />
              <h3 className="font-display font-bold text-slate-800 text-base">{filteredEntries[2].nickname}</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{filteredEntries[2].direction}</p>
              <div className="text-2xl font-black text-slate-700 font-display mt-4">
                {filteredEntries[2].score} <span className="text-xs text-slate-400 font-medium">ball</span>
              </div>
            </motion.div>

          </div>
        )}

        {/* Realtime Ranking List */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 font-medium text-sm">Reyting yuklanmoqda...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-4">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-100 shadow-inner">
                <Trophy className="w-8 h-8 stroke-[2]" />
              </div>
              <h3 className="font-display font-extrabold text-2xl text-slate-900">
                Reyting to'liq 0 dan yangilandi!
              </h3>
              <p className="text-slate-500 text-sm font-semibold max-w-md mx-auto leading-relaxed">
                Hozircha reyting jadvali bo'sh. Birinchi bo'lib DTM imtihon testini topshirib, 1-o'rinni egallang va reyting cho'qqisiga chiqishingiz mumkin!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6 text-center w-16">O'rni</th>
                    <th className="py-4 px-6">Abituriyent</th>
                    <th className="py-4 px-6">Tanlagan Yo'nalishi</th>
                    <th className="py-4 px-6 text-center">To'g'ri</th>
                    <th className="py-4 px-6 text-center">Yordam</th>
                    <th className="py-4 px-6 text-center">Sarf vaqti</th>
                    <th className="py-4 px-6 text-right pr-8">Natija (Ball)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {filteredEntries.map((entry, index) => {
                    const rank = index + 1;
                    return (
                      <tr 
                        key={entry.uid}
                        className="hover:bg-slate-50/40 transition-colors"
                      >
                        <td className="py-4 px-6 text-center">
                          {rank <= 3 ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${
                              rank === 1 ? "bg-amber-100 text-amber-700" :
                              rank === 2 ? "bg-slate-100 text-slate-600" :
                              "bg-orange-100 text-orange-700"
                            }`}>
                              {rank}
                            </span>
                          ) : (
                            <span className="text-slate-400">#{rank}</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800">{entry.nickname}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-500">
                          {entry.direction}
                        </td>
                        <td className="py-4 px-6 text-center text-emerald-600">
                          {entry.correctCount || "0"} ta
                        </td>
                        <td className="py-4 px-6 text-center text-amber-600 font-bold">
                          {entry.hintsUsed || 0} marta
                        </td>
                        <td className="py-4 px-6 text-center text-slate-500 font-mono text-xs">
                          {entry.timeUsed || "0:00"}
                        </td>
                        <td className="py-4 px-6 text-right pr-8 font-display font-extrabold text-slate-900 text-base">
                          {entry.score}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
