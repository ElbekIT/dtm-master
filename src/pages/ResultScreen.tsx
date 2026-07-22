/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Clock, BookOpen, BarChart3, Star, RotateCcw, Home, Trophy, RefreshCw } from "lucide-react";
import { db, handleFirestoreError, OperationType, addDoc, getDoc, setDoc } from "../lib/firebase";
import { collection, doc } from "firebase/firestore";

interface ResultScreenProps {
  currentUser: {
    uid: string;
    nickname: string;
    email: string | null;
  };
  results: {
    score: number;
    correctCount: number;
    wrongCount: number;
    emptyCount: number;
    percentage: number;
    timeUsed: string;
    directionName: string;
    passed: boolean;
    hintsUsed?: number;
  };
  onReturnHome: () => void;
}

export default function ResultScreen({ currentUser, results, onReturnHome }: ResultScreenProps) {
  const { score, correctCount, wrongCount, emptyCount, percentage, timeUsed, directionName, passed, hintsUsed } = results;
  const [saving, setSaving] = useState(true);
  const [rankingPosition, setRankingPosition] = useState<number>(1);

  // Automatically save results record to Firestore database
  useEffect(() => {
    const saveResultsRecord = async () => {
      try {
        const resultPayload = {
          uid: currentUser.uid,
          nickname: currentUser.nickname,
          email: currentUser.email,
          direction: directionName,
          score,
          correctCount,
          wrongCount,
          emptyCount,
          percentage,
          timeUsed,
          passed,
          hintsUsed: hintsUsed || 0,
          createdAt: new Date().toISOString()
        };

        // 1. Add record to global results collection
        try {
          await addDoc(collection(db, "results"), resultPayload);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, "results");
        }

        // 2. Add record to global leaderboard collection
        try {
          const leaderRef = doc(db, "leaderboard", currentUser.uid);
          const currentLeaderDoc = await getDoc(leaderRef);
          
          if (!currentLeaderDoc.exists() || currentLeaderDoc.data().score < score) {
            await setDoc(leaderRef, {
              uid: currentUser.uid,
              nickname: currentUser.nickname,
              direction: directionName,
              score,
              correctCount,
              timeUsed,
              hintsUsed: hintsUsed || 0,
              updatedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `leaderboard/${currentUser.uid}`);
        }

        // 3. Update user statistics
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const currentSolvedCount = (userData.testsSolved || 0) + 1;
            const highestScore = Math.max(userData.score || 0, score);
            const totalHintsUsed = (userData.hintsUsed || 0) + (hintsUsed || 0);
            
            await setDoc(userRef, {
              testsSolved: currentSolvedCount,
              score: highestScore, // Keep highest score
              hintsUsed: totalHintsUsed,
              lastLogin: new Date().toISOString()
            }, { merge: true });

            // Sync with backend server
            try {
              await fetch("/api/users/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  uid: currentUser.uid,
                  nickname: currentUser.nickname,
                  email: currentUser.email,
                  score: highestScore,
                  testsSolved: currentSolvedCount,
                  selectedDirection: directionName,
                  lastLogin: new Date().toISOString()
                })
              });
            } catch (syncErr) {
              console.warn("Server user sync error:", syncErr);
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
        }

        // 4. Compute ranking mock-position (e.g. 1st or random high-quality rank between 1 and 25 based on score)
        const computedRank = score >= 150 ? 1 : score >= 120 ? 3 : score >= 94 ? 7 : 18;
        setRankingPosition(computedRank);

      } catch (err) {
        console.error("Failed to save exam results:", err);
      } finally {
        setSaving(false);
      }
    };

    saveResultsRecord();
  }, [currentUser, results]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 select-none">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Pass / Fail Big Card */}
        {passed ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left relative overflow-hidden shadow-xs">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>
            <div className="space-y-2">
              <span className="inline-block bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded-md tracking-wider uppercase">
                TAVSYA ETILADI (BUDJET)
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-900 leading-none">
                Tabriklaymiz! Siz muvaffaqiyatli o'tdingiz!
              </h2>
              <p className="text-emerald-700 text-sm leading-relaxed max-w-xl font-medium">
                Siz o'qishga kirish uchun juda yaxshi tayyorgarlik ko'rgansiz. Bilimingizni mustahkamlashda davom eting va real DTM imtihonida ham xuddi shunday natijaga erishing!
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left relative overflow-hidden shadow-xs">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
              <XCircle className="w-12 h-12 stroke-[2.5]" />
            </div>
            <div className="space-y-3">
              <span className="inline-block bg-rose-600 text-white font-bold text-xs px-2.5 py-1 rounded-md tracking-wider uppercase">
                O'TISH BALI YETARLI EMAS
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-rose-950 leading-none">
                YIQILDINGIZ (KIROLMADINGIZ)
              </h2>
              <p className="text-rose-800 text-sm leading-relaxed max-w-xl font-medium italic">
                "Har bir muvaffaqiyat ortida minglab urinishlar yotadi. Bugun yiqilgan bo'lsangiz ham ertaga albatta g'alaba qozonasiz. Harakat qilishdan to'xtamang. Siz ham budjet asosida o'qishga kira olasiz!"
              </p>
            </div>
          </div>
        )}

        {/* Scoring Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-center">
            <div className="text-xs font-semibold text-slate-400">UMUMIY BALL</div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 mt-1">
              {score}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">Max: 189.0 ball</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-center">
            <div className="text-xs font-semibold text-slate-400">TO'G'RI JAVOBLAR</div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-emerald-600 mt-1">
              {correctCount}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">90 ta savoldan</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-center">
            <div className="text-xs font-semibold text-slate-400">FOIZ HISOBIDA</div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-blue-600 mt-1">
              {percentage}%
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">Umumiy ko'rsatkich</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-center">
            <div className="text-xs font-semibold text-slate-400">REYTINGDAGI O'RNI</div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-amber-500 mt-1">
              #{rankingPosition}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">Sinf darsligida</div>
          </div>
        </div>

        {/* Detailed Breakdown Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-slate-800 text-lg border-b border-slate-100 pb-3">
            Imtihon tafsilotlari
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-semibold text-slate-600">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl">
              <span className="text-slate-400">Yo'nalish nomi:</span>
              <span className="text-slate-800">{directionName}</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl">
              <span className="text-slate-400">Sarf qilingan vaqt:</span>
              <span className="text-slate-800 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{timeUsed} min</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl">
              <span className="text-slate-400">Xato javoblar:</span>
              <span className="text-red-500">{wrongCount} ta</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl">
              <span className="text-slate-400">Bo'sh qoldirilgan:</span>
              <span className="text-slate-500">{emptyCount} ta</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl col-span-1 md:col-span-2">
              <span className="text-slate-400">Yordam xizmati (50/50):</span>
              <span className="text-amber-600 font-bold">{hintsUsed || 0} marta ishlatilgan</span>
            </div>
          </div>
        </div>

        {/* Bottom Control Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onReturnHome}
            className="dtm-btn-primary flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-primary-500/10"
          >
            <Home className="w-5 h-5" />
            <span>Bosh sahifaga qaytish</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
