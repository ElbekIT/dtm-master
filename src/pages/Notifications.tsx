/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Bell, Calendar, Inbox, CheckCircle, ShieldAlert, Award } from "lucide-react";
import { db, handleFirestoreError, OperationType, getDocs } from "../lib/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { User, Notification } from "../types";

interface NotificationsProps {
  currentUser: User;
}

export default function Notifications({ currentUser }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Query global notifications
        const globalQuery = query(
          collection(db, "notifications"),
          where("userId", "==", "all"),
          orderBy("createdAt", "desc")
        );

        // Query personal notifications
        const personalQuery = query(
          collection(db, "notifications"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const [globalSnap, personalSnap] = await Promise.all([
          getDocs(globalQuery).catch(() => null),
          getDocs(personalQuery).catch(() => null)
        ]);

        const list: Notification[] = [];

        if (globalSnap) {
          globalSnap.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as Notification);
          });
        }

        if (personalSnap) {
          personalSnap.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as Notification);
          });
        }

        // Sort combined list by date descending
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setNotifications(list);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 select-none">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-blue-50 text-primary-600 rounded-xl flex items-center justify-center border border-blue-100">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-slate-900 tracking-tight">Habarnomalar</h1>
            <p className="text-slate-400 text-xs font-semibold">Tizim yangiliklari va muhim e'lonlar</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-2xs">
            <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-semibold">Yuklanmoqda...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-4 shadow-2xs">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-slate-800 text-lg">Hozircha xabarlar yo'q</h3>
              <p className="text-slate-400 text-sm font-semibold max-w-sm mx-auto">
                Sizda hozircha hech qanday e'lon yoki bildirishnomalar mavjud emas.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif, index) => {
              const isGlobal = notif.userId === "all";
              
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white border rounded-3xl p-6 shadow-2xs relative overflow-hidden transition-all hover:border-slate-300 flex items-start space-x-4 ${
                    isGlobal ? "border-slate-200" : "border-blue-200 bg-blue-50/10"
                  }`}
                >
                  {/* Visual Left Accent */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isGlobal ? "bg-slate-300" : "bg-primary-500"
                  }`} />

                  {/* Icon */}
                  <div className={`p-2.5 rounded-2xl flex-shrink-0 border ${
                    isGlobal 
                      ? "bg-slate-50 text-slate-500 border-slate-100" 
                      : "bg-blue-50 text-primary-600 border-blue-100/50"
                  }`}>
                    {isGlobal ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  </div>

                  {/* Body */}
                  <div className="flex-grow space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h3 className="font-display font-extrabold text-slate-800 text-base leading-tight">
                        {notif.title}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center space-x-1 font-mono uppercase bg-slate-50 py-1 px-2.5 rounded-lg border border-slate-100 w-fit">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm font-semibold leading-relaxed whitespace-pre-line">
                      {notif.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
