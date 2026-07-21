import React, { useEffect, useState } from 'react';
import { AdminNotification } from '../types';
import { db, collection, query, orderBy, onSnapshot } from '../firebase';
import { Bell, Sparkles, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AdminNotification[] = [];
      snapshot.forEach(d => list.push(d.data() as AdminNotification));
      setNotifications(list);
      setLoading(false);
    }, (err) => {
      console.error("Notifications error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
          <Bell className="w-4 h-4" />
          <span>Xabarlar va E'lonlar</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          DTM MASTER Habarnomalari
        </h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Ma'muriyat tomonidan yuborilgan muhim xabar va e'lonlar bilan tanishing.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm font-semibold">Yuklanmoqda...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
            <Bell className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">Yangi habarlar yo'q</h3>
            <p className="text-slate-400 text-xs">Ayni vaqtda hech qanday bildirishnoma mavjud emas.</p>
          </div>
        ) : (
          notifications.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">{note.author || 'DTM MASTER Admin'}</span>
                </div>

                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(note.createdAt).toLocaleString('uz-UZ')}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base">{note.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{note.content}</p>
            </motion.div>
          ))
        )}
      </div>

    </div>
  );
};
