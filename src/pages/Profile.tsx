/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  User as UserIcon, BookOpen, Star, Trophy, Mail, Calendar, MapPin, 
  ShieldAlert, FileText, CheckCircle2, XCircle, Trash2, AlertTriangle,
  TrendingUp, Award, Target, Zap, Clock, BarChart3, Users, MessageSquare
} from "lucide-react";
import { db, auth, handleFirestoreError, OperationType, getDocs } from "../lib/firebase";
import { collection, query, where, orderBy, doc, setDoc, deleteDoc } from "firebase/firestore";
import { deleteUser, signOut } from "firebase/auth";
import { User } from "../types";
import { getAccessRemainingText, hasActiveAccess, getAccessTimeBreakdown } from "../lib/premium";

interface ProfileProps {
  currentUser: User;
  onDeleteAccount?: () => Promise<void>;
}

export default function Profile({ currentUser, onDeleteAccount }: ProfileProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Statistics calculations
  const [stats, setStats] = useState({
    solvedCount: currentUser.testsSolved || 0,
    averageScore: 0,
    highestScore: currentUser.score || 0,
    passedCount: 0,
    failedCount: 0,
    totalTimeSpent: 0,
    successRate: 0
  });

  // 1-second tick interval for live countdown
  const [, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchExamHistory = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "results"),
          where("uid", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );
        
        let querySnapshot;
        try {
          querySnapshot = await getDocs(q);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, "results");
        }

        if (querySnapshot) {
          const list: any[] = [];
          let totalSum = 0;
          let maxScore = 0;
          let passedTests = 0;
          let failedTests = 0;
          let totalTime = 0;

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            list.push({ id: doc.id, ...data });
            totalSum += data.score || 0;
            if (data.score > maxScore) maxScore = data.score;
            if (data.passed) passedTests++;
            else failedTests++;
            totalTime += data.timeUsed || 0;
          });

          const successRate = list.length > 0 ? Math.round((passedTests / list.length) * 100) : 0;

          setHistory(list);
          
          setStats({
            solvedCount: list.length,
            averageScore: list.length > 0 ? Math.round((totalSum / list.length) * 10) / 10 : 0,
            highestScore: maxScore || currentUser.score || 0,
            passedCount: passedTests,
            failedCount: failedTests,
            totalTimeSpent: totalTime,
            successRate: successRate
          });
        }
      } catch (err) {
        console.error("Failed to load past results:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamHistory();
  }, [currentUser]);

  const handleConfirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      try {
        await deleteDoc(doc(db, "users", currentUser.uid));
      } catch (err) {
        console.warn("Firestore delete user error:", err);
      }

      try {
        await deleteDoc(doc(db, "leaderboard", currentUser.uid));
      } catch (err) {
        console.warn("Firestore delete leaderboard error:", err);
      }

      try {
        await fetch("/api/users/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: currentUser.uid })
        });
      } catch (err) {
        console.warn("Backend server delete error:", err);
      }

      try {
        if (auth.currentUser) {
          await deleteUser(auth.currentUser);
        }
      } catch (authErr) {
        console.warn("Auth delete user error (signing out instead):", authErr);
        await signOut(auth);
      }

      try {
        localStorage.removeItem("dtm_cached_user");
      } catch (e) {}

      if (onDeleteAccount) {
        await onDeleteAccount();
      }
    } catch (err) {
      console.error("Account deletion failed:", err);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const remainingAccessText = getAccessRemainingText(currentUser);
  const breakdown = getAccessTimeBreakdown(currentUser);
  const isPremiumUser = currentUser.premium || currentUser.subscriptionStatus === "Tastiqlandi";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 select-none">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Title Section */}
        <div className="border-b border-slate-200 pb-6">
          <h1 className="font-display text-3xl font-extrabold text-slate-900 flex items-center space-x-2">
            <UserIcon className="w-8 h-8 text-primary-600" />
            <span>Mening Profilim</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-semibold">
            Imtihon natijalaringiz, statistika va akkaunt sozlamalarini ko'ring
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Profile info card (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs text-center relative overflow-hidden">
              <div className={`absolute top-0 inset-x-0 h-1.5 ${isPremiumUser ? 'bg-gradient-to-r from-amber-500 to-yellow-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`} />
              
              {/* Avatar / Photo */}
              <div className="relative inline-block mt-4">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.nickname}
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md mx-auto"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center font-black text-3xl border-4 border-slate-50 shadow-md mx-auto ${isPremiumUser ? 'bg-amber-50 text-amber-600' : 'bg-primary-50 text-primary-600'}`}>
                    {currentUser.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Profile detail */}
              <h2 className="font-display font-extrabold text-xl text-slate-900 mt-4 leading-none">
                {currentUser.nickname}
              </h2>
              <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mt-1.5 flex items-center justify-center space-x-1.5">
                <span>{currentUser.role === "admin" ? "TIZIM ADMINI" : "ABITURIYENT"}</span>
                {isPremiumUser && (
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-sm leading-none">PREMIUM</span>
                )}
              </p>

              {/* COUNTDOWN TIMER WIDGET */}
              <div className="mt-5 p-4 bg-slate-900 text-white rounded-2xl shadow-inner border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span className="flex items-center space-x-1.5 text-amber-400">
                    <span>🌟</span>
                    <span>{breakdown.planTitle}</span>
                  </span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md text-slate-300 font-mono">
                    {breakdown.type === 'admin' ? 'Cheksiz' : breakdown.type === 'expired' ? 'Tugagan' : 'Teskari sanoq'}
                  </span>
                </div>

                {/* 4 Block Countdown */}
                {breakdown.type !== 'admin' && breakdown.type !== 'expired' ? (
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="bg-slate-800/90 rounded-xl p-2 border border-slate-700/50">
                      <div className="text-lg font-black text-amber-400 font-mono leading-none">{breakdown.days}</div>
                      <div className="text-[9px] text-slate-400 font-bold mt-1">KUN</div>
                    </div>
                    <div className="bg-slate-800/90 rounded-xl p-2 border border-slate-700/50">
                      <div className="text-lg font-black text-amber-400 font-mono leading-none">{breakdown.hours.toString().padStart(2, '0')}</div>
                      <div className="text-[9px] text-slate-400 font-bold mt-1">SOAT</div>
                    </div>
                    <div className="bg-slate-800/90 rounded-xl p-2 border border-slate-700/50">
                      <div className="text-lg font-black text-amber-400 font-mono leading-none">{breakdown.minutes.toString().padStart(2, '0')}</div>
                      <div className="text-[9px] text-slate-400 font-bold mt-1">DAQ</div>
                    </div>
                    <div className="bg-slate-800/90 rounded-xl p-2 border border-slate-700/50">
                      <div className="text-lg font-black text-amber-400 font-mono leading-none">{breakdown.seconds.toString().padStart(2, '0')}</div>
                      <div className="text-[9px] text-slate-400 font-bold mt-1">SON</div>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center text-sm font-black text-amber-400 font-mono">
                    {breakdown.formattedCountdown}
                  </div>
                )}

                {/* WARNING ALERT BANNER */}
                {breakdown.isWarning && breakdown.type !== 'expired' && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-[11px] font-bold text-left flex items-start space-x-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="leading-snug">{breakdown.warningMessage}</p>
                  </div>
                )}
              </div>

              {/* Profile Info fields */}
              <div className="mt-6 space-y-3 text-left text-sm font-semibold text-slate-600 border-t border-slate-100 pt-6">
                <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl">
                  <Mail className="w-4.5 h-4.5 text-slate-400" />
                  <span className="truncate text-xs">{currentUser.email || "Email mavjud emas"}</span>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl">
                  <MapPin className="w-4.5 h-4.5 text-slate-400" />
                  <span className="text-xs">{currentUser.country || "O'zbekiston"}</span>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl">
                  <Calendar className="w-4.5 h-4.5 text-slate-400" />
                  <span className="text-xs">Ro'yxat: {new Date(currentUser.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Account Settings & Danger Zone */}
            <div className="bg-white border border-rose-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
                <Trash2 className="w-4 h-4" />
                <span>Akkaunt Sozlamalari</span>
              </div>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                Agar akkauntingizni o'chirsangiz, barcha natijalaringiz va ma'lumotlaringiz butunlay o'chib ketadi. Keyinroq qayta ro'yxatdan o'tishingiz mumkin.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Akkauntni butunlay o'chirish</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Statistics & History (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Enhanced Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Yechilgan</span>
                </div>
                <div className="text-2xl font-black text-slate-800">{stats.solvedCount}</div>
                <p className="text-[11px] text-slate-500 font-semibold mt-2">imtihon</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">O'tildi</span>
                </div>
                <div className="text-2xl font-black text-emerald-600">{stats.passedCount}</div>
                <p className="text-[11px] text-slate-500 font-semibold mt-2">muvaffaqiyatli</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Yiqildi</span>
                </div>
                <div className="text-2xl font-black text-red-600">{stats.failedCount}</div>
                <p className="text-[11px] text-slate-500 font-semibold mt-2">muvaffaqiyatsiz</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Foiz</span>
                </div>
                <div className="text-2xl font-black text-purple-600">{stats.successRate}%</div>
                <p className="text-[11px] text-slate-500 font-semibold mt-2">muvaffaqiyat</p>
              </div>
            </div>

            {/* Performance Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">O'rtacha Ball</p>
                    <p className="text-xl font-black text-slate-800 mt-1">{stats.averageScore}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Eng Yuqori</p>
                    <p className="text-xl font-black text-slate-800 mt-1">{stats.highestScore}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-cyan-50 rounded-lg">
                    <Clock className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Jami Vaqt</p>
                    <p className="text-xl font-black text-slate-800 mt-1">{stats.totalTimeSpent} min</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Test History Table */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h3 className="font-display font-extrabold text-slate-800 text-lg mb-6 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary-500" />
                <span>Imtihonlar Tarixi</span>
              </h3>

              {loading ? (
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400 text-sm font-medium">Yuklanmoqda...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-semibold space-y-2">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                  <p>Siz hali imtihon topshirmagansiz.</p>
                  <p className="text-xs text-slate-400">Bosh sahifaga o'tib birinchi testingizni boshlang.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Sana</th>
                        <th className="py-3.5 px-4">Yo'nalish</th>
                        <th className="py-3.5 px-4 text-center">To'g'ri / Xato</th>
                        <th className="py-3.5 px-4 text-center">Yordam</th>
                        <th className="py-3.5 px-4 text-center">Sarf vaqti</th>
                        <th className="py-3.5 px-4 text-center">Holati</th>
                        <th className="py-3.5 px-4 text-right pr-6">Ball</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                      {history.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4 text-slate-500">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-slate-800 font-bold">
                            {record.direction}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-emerald-600">{record.correctCount} ta</span>
                            <span className="text-slate-300 mx-1">/</span>
                            <span className="text-red-500">{record.wrongCount} ta</span>
                          </td>
                          <td className="py-4 px-4 text-center text-amber-600 font-bold">
                            {record.hintsUsed || 0} marta
                          </td>
                          <td className="py-4 px-4 text-center text-slate-500 font-mono">
                            {record.timeUsed} min
                          </td>
                          <td className="py-4 px-4 text-center">
                            {record.passed ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>O'tdi</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Yiqildi</span>
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right pr-6 text-sm font-display font-black text-slate-900">
                            {record.score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Account Warning Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-rose-100"
          >
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-3">
              <h3 className="text-xl font-black text-slate-900 font-display">
                Rostan ham akkauntingizni o'chirmoqchimisiz?
              </h3>
              
              <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 p-4 rounded-2xl leading-relaxed text-left space-y-1">
                <p className="font-bold text-rose-800 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>MUHIM OGOHLANTIRISH:</span>
                </p>
                <p>
                  Agar o'z akkauntingizni o'chirsangiz, Premium tarifi olgan bo'lsangiz hammasi, to'plangan ballaringiz va barcha imtihon natijalaringiz <strong>BUTUNLAY KUYIB KETADI!</strong>
                </p>
              </div>

              <p className="text-slate-500 text-xs font-medium">
                Akkaunt o'chirilgandan so'ng xohlasangiz qayta ro'yxatdan o'ta olasiz.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-all cursor-pointer"
              >
                Yo'q, bekor qilish
              </button>
              <button
                disabled={deleting}
                onClick={handleConfirmDeleteAccount}
                className="flex-1 py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ha, akkauntni o'chirish</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}