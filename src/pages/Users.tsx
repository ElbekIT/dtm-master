/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { collection, orderBy, query } from "firebase/firestore";
import { db, getDocs, handleFirestoreError, OperationType } from "../lib/firebase";
import { User } from "../types";
import {
  Users as UsersIcon, Search, ShieldCheck, Star, Trophy, BookOpen,
  ChevronRight, UserX
} from "lucide-react";

interface UsersProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
}

export default function Users({ currentUser, onSelectUser }: UsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        let snapshot;
        try {
          // Prefer ordering by creation date so newest members show first.
          const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
          snapshot = await getDocs(q);
        } catch (err) {
          // Fallback: some documents may miss createdAt / index not ready.
          try {
            snapshot = await getDocs(collection(db, "users"));
          } catch (innerErr) {
            handleFirestoreError(innerErr, OperationType.LIST, "users");
          }
        }

        if (snapshot) {
          const list: User[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ uid: docSnap.id, ...docSnap.data() } as User);
          });
          setUsers(list);
        }
      } catch (err) {
        console.error("Failed to load users list:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      (u.nickname || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

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
            <UsersIcon className="w-8 h-8 text-primary-600" />
            <span>Foydalanuvchilar</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-semibold">
            Platformadagi barcha ro'yxatdan o'tgan foydalanuvchilar. Profilini ko'rish uchun kartaga bosing.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ism yoki email bo'yicha qidirish..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all"
          />
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Foydalanuvchilar yuklanmoqda...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-semibold space-y-2">
            <UserX className="w-10 h-10 mx-auto text-slate-300" />
            <p>{searchTerm ? "Hech qanday foydalanuvchi topilmadi." : "Hozircha foydalanuvchilar mavjud emas."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const isPremiumUser = user.premium || user.subscriptionStatus === "Tastiqlandi";
              const isMe = user.uid === currentUser.uid;
              return (
                <button
                  key={user.uid}
                  onClick={() => onSelectUser(user)}
                  className="text-left bg-white border border-slate-200 hover:border-primary-300 hover:shadow-md rounded-2xl p-5 shadow-xs transition-all cursor-pointer relative group"
                >
                  {isMe && (
                    <span className="absolute top-3 right-3 text-[9px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                      SIZ
                    </span>
                  )}
                  <div className="flex items-center space-x-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.nickname}
                        className="w-14 h-14 rounded-full object-cover border-2 border-slate-50 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg border-2 border-slate-50 shadow-sm ${isPremiumUser ? 'bg-amber-50 text-amber-600' : 'bg-primary-50 text-primary-600'}`}>
                        {(user.nickname || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-extrabold text-slate-900 text-sm truncate flex items-center space-x-1.5">
                        <span className="truncate">{user.nickname}</span>
                        {user.role === "admin" && (
                          <ShieldCheck className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5 flex items-center space-x-1">
                        <span>{user.role === "admin" ? "Admin" : "Abituriyent"}</span>
                        {isPremiumUser && (
                          <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-sm">PREMIUM</span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-all shrink-0" />
                  </div>

                  {(user as any).bio && (
                    <p className="text-slate-500 text-[11px] font-medium mt-3 line-clamp-2 leading-relaxed">
                      {(user as any).bio}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 mt-4 pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-500">
                    <span className="flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      <span>{user.testsSolved || 0} test</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>{user.score || 0} ball</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}