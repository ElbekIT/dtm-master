/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { User as UserIcon, BookOpen, Star, Trophy, Mail, Calendar, MapPin, ShieldAlert, FileText, CheckCircle2, XCircle } from "lucide-react";
import { db, handleFirestoreError, OperationType, getDocs } from "../lib/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { User } from "../types";

interface ProfileProps {
  currentUser: User;
}

export default function Profile({ currentUser }: ProfileProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Statistics calculations
  const [stats, setStats] = useState({
    solvedCount: currentUser.testsSolved || 0,
    averageScore: 0,
    highestScore: currentUser.score || 0
  });

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

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            list.push({ id: doc.id, ...data });
            totalSum += data.score || 0;
            if (data.score > maxScore) maxScore = data.score;
          });

          setHistory(list);
          
          setStats({
            solvedCount: list.length,
            averageScore: list.length > 0 ? Math.round((totalSum / list.length) * 10) / 10 : 0,
            highestScore: maxScore || currentUser.score || 0
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 select-none">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* LEFT COLUMN: Profile info card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
            
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
                <div className="w-24 h-24 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-black text-3xl border-4 border-slate-50 shadow-md mx-auto">
                  {currentUser.nickname.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile detail */}
            <h2 className="font-display font-extrabold text-xl text-slate-900 mt-4 leading-none">
              {currentUser.nickname}
            </h2>
            <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mt-1">
              {currentUser.role === "admin" ? "TIZIM ADMINI" : "ABITURIYENT"}
            </p>

            {/* Profile Info fields */}
            <div className="mt-8 space-y-3 text-left text-sm font-semibold text-slate-600 border-t border-slate-100 pt-6">
              <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl">
                <Mail className="w-4.5 h-4.5 text-slate-400" />
                <span className="truncate">{currentUser.email || "Email mavjud emas"}</span>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl">
                <MapPin className="w-4.5 h-4.5 text-slate-400" />
                <span>{currentUser.country || "O'zbekiston"}</span>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl">
                <Calendar className="w-4.5 h-4.5 text-slate-400" />
                <span className="text-xs">Ro'yxat: {new Date(currentUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-2xs">
              <BookOpen className="w-5 h-5 mx-auto text-primary-500" />
              <div className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Yechilgan</div>
              <div className="text-lg font-black text-slate-800 mt-0.5">{stats.solvedCount} marta</div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-2xs">
              <Star className="w-5 h-5 mx-auto text-yellow-500" />
              <div className="text-[10px] text-slate-400 font-bold mt-2 uppercase">O'rtacha</div>
              <div className="text-lg font-black text-slate-800 mt-0.5">{stats.averageScore}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-2xs">
              <Trophy className="w-5 h-5 mx-auto text-amber-500" />
              <div className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Rekord</div>
              <div className="text-lg font-black text-slate-800 mt-0.5">{stats.highestScore}</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Past test history list (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
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
      </motion.div>
    </div>
  );
}
