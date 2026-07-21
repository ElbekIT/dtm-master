/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ShieldAlert, Cpu, Users, Database, HelpCircle, AlertTriangle, Trash2, 
  UserX, CheckCircle, PlusCircle, Upload, Download, Edit2, FileSpreadsheet, 
  FileText, CheckCircle2, CreditCard, Bell, Eye, X, ChevronRight, Check, Ban
} from "lucide-react";
import { db, handleFirestoreError, OperationType, getDocs, setDoc, deleteDoc } from "../lib/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { Question, User, Purchase } from "../types";

export default function Admin() {
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "users" | "purchases" | "notifications" | "questions" | "import">("dashboard");
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTestsStarted: 0,
    activeSessionsCount: 0,
    completedSessionsCount: 0,
    bannedUsersCount: 0,
    questionsDatabaseCount: 0,
    pendingPurchasesCount: 0
  });

  // Database lists
  const [usersList, setUsersList] = useState<User[]>([]);
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [bannedUids, setBannedUids] = useState<string[]>([]);
  const [purchasesList, setPurchasesList] = useState<Purchase[]>([]);

  // Ban Duration Modal State
  const [selectedUserToBan, setSelectedUserToBan] = useState<User | null>(null);
  const [banDuration, setBanDuration] = useState<string>("1_day");

  // Receipt Preview Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Announcement Form State
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifTarget, setNotifTarget] = useState("all");
  const [sendingNotif, setSendingNotif] = useState(false);

  // Add Question Form State
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    A: "",
    B: "",
    C: "",
    D: "",
    correctAnswer: "A",
    subject: "Mathematics",
    direction: "",
    difficulty: "medium"
  });

  // Bulk Import state
  const [bulkJsonInput, setBulkJsonInput] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Load server-side stats, users, purchases, and questions
  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch server stats
      const statsRes = await fetch("/api/admin/stats");
      const statsData = statsRes.ok ? await statsRes.json() : {};

      // 2. Fetch banned users from server
      const bannedRes = await fetch("/api/admin/banned-users");
      const bannedData = bannedRes.ok ? await bannedRes.json() : { banned: [] };
      setBannedUids(bannedData.banned);

      // 3. Fetch users from Firestore
      const usersSnap = await getDocs(collection(db, "users"));
      const uList: User[] = [];
      usersSnap.forEach((doc) => {
        uList.push(doc.data() as User);
      });
      setUsersList(uList);

      // 4. Fetch purchases from Firestore
      const purchasesQuery = query(collection(db, "purchases"), orderBy("createdAt", "desc"));
      const purchasesSnap = await getDocs(purchasesQuery);
      const pList: Purchase[] = [];
      purchasesSnap.forEach((doc) => {
        pList.push({ id: doc.id, ...doc.data() } as Purchase);
      });
      setPurchasesList(pList);

      const pendingCount = pList.filter(p => p.status === "Tekshirilyapti").length;

      setStats({
        totalUsers: uList.length,
        totalTestsStarted: statsData.totalTestsStarted || 0,
        activeSessionsCount: statsData.activeSessionsCount || 0,
        completedSessionsCount: statsData.completedSessionsCount || 0,
        bannedUsersCount: bannedData.banned.length,
        questionsDatabaseCount: statsData.questionsDatabaseCount || 17,
        pendingPurchasesCount: pendingCount
      });

    } catch (err) {
      console.error("Failed to load admin panel data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Submit Ban with Selected Duration
  const handleBanUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToBan) return;

    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          uid: selectedUserToBan.uid, 
          action: "ban", 
          duration: banDuration 
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Sync duration-based ban timestamp in Firestore user doc
        const userDocRef = doc(db, "users", selectedUserToBan.uid);
        await setDoc(userDocRef, { 
          bannedUntil: data.bannedUntil 
        }, { merge: true });

        alert(`${selectedUserToBan.nickname} muvaffaqiyatli bloklandi.`);
        setSelectedUserToBan(null);
        loadAdminData();
      }
    } catch (err) {
      console.error("Failed to ban user:", err);
    }
  };

  // Direct Unban Action
  const handleUnbanUser = async (uid: string) => {
    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, action: "unban" })
      });

      if (res.ok) {
        // Sync unban in Firestore
        const userDocRef = doc(db, "users", uid);
        await setDoc(userDocRef, { 
          bannedUntil: null 
        }, { merge: true });

        alert("Abituriyent blokdan chiqarildi.");
        loadAdminData();
      }
    } catch (err) {
      console.error("Failed to unban user:", err);
    }
  };

  // Delete user from Firestore
  const handleDeleteUser = async (uid: string) => {
    if (!confirm("Haqiqatdan ham ushbu foydalanuvchini butunlay o'chirib yubormoqchimisiz?")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      // If purchase request exists, clean it up too
      try {
        await deleteDoc(doc(db, "purchases", uid));
      } catch (_) {}

      alert("Foydalanuvchi muvaffaqiyatli o'chirildi.");
      loadAdminData();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  // Approve Premium Purchase with automatic plan duration
  const handleApprovePurchase = async (purchase: Purchase) => {
    try {
      const now = new Date();
      let daysToAdd = 7;
      if (purchase.plan === "oylik") daysToAdd = 30;
      else if (purchase.plan === "yillik") daysToAdd = 365;

      const premiumUntilDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      // 1. Update purchase state in Firestore
      await setDoc(doc(db, "purchases", purchase.uid), {
        status: "Tastiqlandi",
        updatedAt: now.toISOString()
      }, { merge: true });

      // 2. Update user premium states in Firestore
      await setDoc(doc(db, "users", purchase.uid), {
        premium: true,
        subscriptionStatus: "Tastiqlandi",
        premiumUntil: premiumUntilDate.toISOString()
      }, { merge: true });

      // 3. Dispatch congratulations Notification to the student
      const notifId = `notif_${purchase.uid}_${Date.now()}`;
      await setDoc(doc(db, "notifications", notifId), {
        id: notifId,
        userId: purchase.uid,
        title: "Premium obuna tasdiqlandi! 🎉",
        message: `Tabriklaymiz! Siz yuborgan to'lov cheki tasdiqlandi. Siz uchun ${purchase.plan === 'haftalik' ? 'haftalik' : purchase.plan === 'oylik' ? 'oylik' : 'yillik'} premium obunasi faollashtirildi. Barcha imtihonlar va savollar hozirda ochiq!`,
        createdAt: now.toISOString()
      });

      alert(`${purchase.nickname} uchun premium obuna muvaffaqiyatli faollashtirildi!`);
      loadAdminData();
    } catch (err) {
      console.error("Failed to approve purchase:", err);
      alert("Xatolik yuz berdi. To'lovni tasdiqlash imkonsiz.");
    }
  };

  // Reject Premium Purchase
  const handleRejectPurchase = async (purchase: Purchase) => {
    try {
      const now = new Date();
      // 1. Update purchase state in Firestore
      await setDoc(doc(db, "purchases", purchase.uid), {
        status: "Tekshirilmadi",
        updatedAt: now.toISOString()
      }, { merge: true });

      // 2. Update user subscriptionStatus in Firestore
      await setDoc(doc(db, "users", purchase.uid), {
        subscriptionStatus: "Tekshirilmadi"
      }, { merge: true });

      // 3. Dispatch correction request Notification to the student
      const notifId = `notif_${purchase.uid}_${Date.now()}`;
      await setDoc(doc(db, "notifications", notifId), {
        id: notifId,
        userId: purchase.uid,
        title: "To'lov cheki rad etildi ⚠️",
        message: "Afsuski, siz yuklagan to'lov cheki ma'lumotlari tasdiqlanmadi. Iltimos, chek rasmi xiraligi yoki boshqa chek yuklanganligini tekshirib, qaytadan yuboring.",
        createdAt: now.toISOString()
      });

      alert(`${purchase.nickname} uchun to'lov rad etildi va xabarnoma yuborildi.`);
      loadAdminData();
    } catch (err) {
      console.error("Failed to reject purchase:", err);
      alert("Xatolik yuz berdi. To'lovni rad etish imkonsiz.");
    }
  };

  // Send broadcast announcement or personal warning alert
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      alert("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }

    setSendingNotif(true);
    try {
      const notifId = `announcement_${Date.now()}`;
      await setDoc(doc(db, "notifications", notifId), {
        id: notifId,
        userId: notifTarget,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        createdAt: new Date().toISOString()
      });

      alert("Xabarnoma muvaffaqiyatli yuborildi!");
      setNotifTitle("");
      setNotifMessage("");
    } catch (err) {
      console.error("Failed to send announcement:", err);
      alert("Xabarni yuborishda xatolik.");
    } finally {
      setSendingNotif(false);
    }
  };

  // Create new question manually
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/questions/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion)
      });
      if (res.ok) {
        alert("Yangi savol muvaffaqiyatli saqlandi.");
        setNewQuestion({
          question: "",
          A: "",
          B: "",
          C: "",
          D: "",
          correctAnswer: "A",
          subject: "Mathematics",
          direction: "",
          difficulty: "medium"
        });
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Import bulk JSON questions
  const handleImportJson = async () => {
    if (!bulkJsonInput.trim()) return;
    try {
      const parsed = JSON.parse(bulkJsonInput);
      const res = await fetch("/api/admin/questions/import-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: Array.isArray(parsed) ? parsed : [parsed] })
      });
      if (res.ok) {
        const data = await res.json();
        setImportStatus(`Muvaffaqiyatli import qilindi: ${data.count} ta savol!`);
        setBulkJsonInput("");
        loadAdminData();
      }
    } catch (err) {
      setImportStatus("Import xatosi: JSON formati noto'g'ri.");
    }
  };

  // Export Results to Excel/CSV format
  const handleExportCSV = async () => {
    try {
      // Query results
      const resSnap = await getDocs(collection(db, "results"));
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Ism,Yo'nalish,Ball,To'g'ri,Xato,Bo'sh,Sana\n";

      resSnap.forEach((doc) => {
        const d = doc.data();
        csvContent += `"${d.nickname}","${d.direction}",${d.score},${d.correctCount},${d.wrongCount},${d.emptyCount},"${new Date(d.createdAt).toLocaleDateString()}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `DTM_MASTER_Imtihon_Natijalari_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export results failed:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 select-none">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Title Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
              <ShieldAlert className="w-8 h-8 text-red-600 stroke-[2]" />
              <span>Admin Boshqaruv Paneli</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 font-semibold">
              Obuna tasdiqlash (Sotip olganlar), abituriyentlarni bloklash, xabarnomalar broadcastingi hamda savollar bazasini boshqarish.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="dtm-btn-secondary py-2.5 px-4 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Natijalarni yuklab olish (CSV)</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs menu */}
        <div className="flex gap-2 border-b border-slate-100 pb-1 overflow-x-auto scrollbar-none">
          {[
            { id: "dashboard", label: "Statistika", icon: Cpu },
            { id: "users", label: "Abituriyentlar", icon: Users },
            { id: "purchases", label: `Sotip olganlar ${stats.pendingPurchasesCount > 0 ? `(${stats.pendingPurchasesCount})` : ''}`, icon: CreditCard },
            { id: "notifications", label: "Xabar yuborish", icon: Bell },
            { id: "questions", label: "Savol Qo'shish", icon: Database },
            { id: "import", label: "Bulk Import", icon: Upload }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-primary-600 text-white border-primary-600 shadow-xs"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. Dashboard Subtab */}
        {activeSubTab === "dashboard" && (
          <div className="space-y-6">
            {/* KPI grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Jami Abituriyentlar</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">{stats.totalUsers} ta</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Boshlangan Imtihonlar</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">{stats.totalTestsStarted} ta</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Kutilayotgan to'lovlar</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">{stats.pendingPurchasesCount} ta</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Bloklanganlar</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">{stats.bannedUsersCount} ta</div>
                </div>
              </div>
            </div>

            {/* Live active sessions */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <h3 className="font-display font-extrabold text-slate-800 text-lg mb-4">
                Tizim Monitoringi
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xl font-semibold">
                Hozirda server xotirasida faol bo'lgan imtihon sessiyalari soni: <span className="font-bold text-blue-600">{stats.activeSessionsCount} ta</span>. Yakunlangan imtihonlar soni: <span className="font-bold text-emerald-600">{stats.completedSessionsCount} ta</span>.
              </p>
            </div>
          </div>
        )}

        {/* 2. Users management Subtab */}
        {activeSubTab === "users" && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Abituriyent</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6 text-center">Roli</th>
                    <th className="py-4 px-6 text-center">To'g'ri (Max Ball)</th>
                    <th className="py-4 px-6 text-center">Holat (Sotib olgan)</th>
                    <th className="py-4 px-6 text-center">Blok muddati</th>
                    <th className="py-4 px-6 text-right pr-6">Harakatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {usersList.map((user) => {
                    const isBannedServer = bannedUids.includes(user.uid);
                    const bannedUntilVal = user.bannedUntil;
                    const isBannedLocal = bannedUntilVal && (bannedUntilVal === "permanent" || new Date(bannedUntilVal).getTime() > Date.now());
                    const isBanned = isBannedServer || isBannedLocal;

                    return (
                      <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2.5">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.nickname} className="w-8 h-8 rounded-full border border-slate-100 object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-xs">{user.nickname.charAt(0).toUpperCase()}</div>
                            )}
                            <div>
                              <div className="font-bold text-slate-800">{user.nickname}</div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Promo: {user.promoCode || "Mavjud emas"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-semibold">{user.email || "Mavjud emas"}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] ${user.role === "admin" ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-primary-600">{user.score} ball ({user.testsSolved} ta test)</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] border ${
                            user.subscriptionStatus === "Tastiqlandi"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : user.subscriptionStatus === "Tekshirilyapti"
                              ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                              : "bg-slate-50 text-slate-500 border-slate-100"
                          }`}>
                            {user.subscriptionStatus === "Tastiqlandi" 
                              ? `Faol (${user.subscriptionPlan})` 
                              : user.subscriptionStatus === "Tekshirilyapti" 
                              ? "Kutilmoqda" 
                              : "Sinov muddati"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-mono text-[10px] text-slate-500">
                          {isBannedLocal 
                            ? (bannedUntilVal === "permanent" ? "Umrbod" : new Date(bannedUntilVal!).toLocaleDateString()) 
                            : "Aktiv"}
                        </td>
                        <td className="py-4 px-6 text-right pr-6 flex justify-end gap-2">
                          {isBanned ? (
                            <button
                              onClick={() => handleUnbanUser(user.uid)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer flex items-center justify-center"
                              title="Blokdan chiqarish"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedUserToBan(user)}
                              className="p-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer flex items-center justify-center"
                              title="Bloklash"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.uid)}
                            className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Purchases Subtab (SOTIP OLGANLAR) */}
        {activeSubTab === "purchases" && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <h3 className="font-display font-extrabold text-slate-800 text-lg p-6 border-b border-slate-100 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-primary-500" />
              <span>Premium Obuna Sotib Olish So'rovlari (Sotib olganlar)</span>
            </h3>

            {purchasesList.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-semibold space-y-2">
                <CreditCard className="w-10 h-10 mx-auto text-slate-300" />
                <p>Hozircha sotib olish so'rovlari mavjud emas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Abituriyent</th>
                      <th className="py-4 px-6">Tarif</th>
                      <th className="py-4 px-6">To'lov miqdari</th>
                      <th className="py-4 px-6">Chek Rasmi</th>
                      <th className="py-4 px-6">Yuborilgan sana</th>
                      <th className="py-4 px-6">Holati</th>
                      <th className="py-4 px-6 text-right pr-6">Harakatlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {purchasesList.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <span className="font-extrabold text-slate-800 block">{purchase.nickname}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{purchase.email || "Email mavjud emas"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 uppercase text-primary-600">{purchase.plan} obuna</td>
                        <td className="py-4 px-6 text-slate-800">{Number(purchase.price).toLocaleString('uz-UZ')} UZS</td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => setSelectedReceipt(purchase.receiptImage)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chekni ko'rish</span>
                          </button>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-mono text-[10px]">
                          {new Date(purchase.createdAt).toLocaleString('uz-UZ')}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] border ${
                            purchase.status === "Tastiqlandi"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : purchase.status === "Tekshirilyapti"
                              ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}>
                            {purchase.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right pr-6">
                          {purchase.status === "Tekshirilyapti" && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleApprovePurchase(purchase)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold text-[10px] cursor-pointer"
                              >
                                Tasdiqlash
                              </button>
                              <button
                                onClick={() => handleRejectPurchase(purchase)}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold text-[10px] cursor-pointer"
                              >
                                Rad etish
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. Notifications Broadcast Subtab */}
        {activeSubTab === "notifications" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="font-display font-extrabold text-slate-800 text-lg">Habarnoma Yuborish (Broadcasting)</h3>
              <p className="text-sm text-slate-500 mt-1">
                Barcha foydalanuvchilarga umumiy e'lon yuborish yoki aniq bir abituriyentga ogohlantirish yuborish maydoni.
              </p>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">KIMGA (QABUL QILUVCHI) <span className="text-red-500">*</span></label>
                <select
                  value={notifTarget}
                  onChange={(e) => setNotifTarget(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm"
                >
                  <option value="all">Barcha abituriyentlar (Global e'lon)</option>
                  {usersList.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.nickname} ({u.email || "Email yo'q"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">MAVZU / TITLE <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: DTM imtihonlari boshlanish sanasi ma'lum bo'ldi"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">XABAR MATNI / MESSAGE <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={5}
                  placeholder="Xabarnoma matnini yozing..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={sendingNotif}
                className="w-full dtm-btn-primary py-3.5 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer font-bold"
              >
                <Bell className="w-4 h-4" />
                <span>{sendingNotif ? "Yuborilmoqda..." : "Habarnomani yuborish"}</span>
              </button>
            </form>
          </div>
        )}

        {/* 5. Add question Subtab */}
        {activeSubTab === "questions" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Manual Form */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h3 className="font-display font-extrabold text-slate-800 text-lg mb-6 flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-primary-600" />
                <span>Yangi savol qo'shish</span>
              </h3>

              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">SAVOL MATNI <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Savol matnini yozing..."
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">A VARIANT <span className="text-red-500">*</span></label>
                    <input
                      type="text" required
                      value={newQuestion.A}
                      onChange={(e) => setNewQuestion({ ...newQuestion, A: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">B VARIANT <span className="text-red-500">*</span></label>
                    <input
                      type="text" required
                      value={newQuestion.B}
                      onChange={(e) => setNewQuestion({ ...newQuestion, B: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">C VARIANT <span className="text-red-500">*</span></label>
                    <input
                      type="text" required
                      value={newQuestion.C}
                      onChange={(e) => setNewQuestion({ ...newQuestion, C: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">D VARIANT <span className="text-red-500">*</span></label>
                    <input
                      type="text" required
                      value={newQuestion.D}
                      onChange={(e) => setNewQuestion({ ...newQuestion, D: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">TO'G'RI JAVOB <span className="text-red-500">*</span></label>
                    <select
                      value={newQuestion.correctAnswer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold"
                    >
                      <option value="A">A variant</option>
                      <option value="B">B variant</option>
                      <option value="C">C variant</option>
                      <option value="D">D variant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">FAN / SUBJECT <span className="text-red-500">*</span></label>
                    <select
                      value={newQuestion.subject}
                      onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold"
                    >
                      <option value="Mathematics">Mathematics (Majburiy/Mutaxassislik)</option>
                      <option value="Physics">Physics</option>
                      <option value="History of Uzbekistan">History of Uzbekistan</option>
                      <option value="Mother Tongue (Uzbek)">Mother Tongue (Uzbek)</option>
                      <option value="Foreign Language (English)">Foreign Language (English)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 font-mono">YO'NALISH ID (OPTIONAL)</label>
                    <input
                      type="text"
                      placeholder="Masalan: tech"
                      value={newQuestion.direction}
                      onChange={(e) => setNewQuestion({ ...newQuestion, direction: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">QIYINLIK DARAJASI</label>
                    <select
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold"
                    >
                      <option value="easy">Oson (Easy)</option>
                      <option value="medium">O'rta (Medium)</option>
                      <option value="hard">Qiyin (Hard)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full dtm-btn-primary py-3 text-xs flex items-center justify-center space-x-1.5 cursor-pointer font-bold"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Savolni Bazaga Saqlash</span>
                </button>
              </form>
            </div>

            {/* Right Static info on Question Layout structure */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-indigo-500" />
                  <span>DTM Savollar Formati haqida</span>
                </h3>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                  DTM MASTER platformasi to'liq 5 ta fandan iborat 90 ta test savollaridan tashkil topgan kompleks imtihonlarni taqdim etadi. Ushbu testlar Fisher-Yates algoritmi bo'yicha dinamik ravishda quyidagi fojiaviy tarqatish bo'yicha tuziladi:
                </p>
                
                <div className="space-y-2 font-semibold text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <p className="flex justify-between"><span>📚 Matematika (Majburiy):</span> <span className="font-mono font-bold text-slate-800">10 ta savol (1.1 ball)</span></p>
                  <p className="flex justify-between"><span>📚 O'zbekiston tarixi (Majburiy):</span> <span className="font-mono font-bold text-slate-800">10 ta savol (1.1 ball)</span></p>
                  <p className="flex justify-between"><span>📚 Ona tili (Majburiy):</span> <span className="font-mono font-bold text-slate-800">10 ta savol (1.1 ball)</span></p>
                  <p className="flex justify-between"><span>🔥 Mutaxassislik fani 1 (Matematika/Fizika):</span> <span className="font-mono font-bold text-slate-800">30 ta savol (3.1 ball)</span></p>
                  <p className="flex justify-between"><span>🔥 Mutaxassislik fani 2 (Fizika/Chet tili):</span> <span className="font-mono font-bold text-slate-800">30 ta savol (2.1 ball)</span></p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 6. Bulk JSON Import Subtab */}
        {activeSubTab === "import" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="font-display font-extrabold text-slate-800 text-lg">JSON orqali savollar kiritish</h3>
              <p className="text-sm text-slate-500 mt-1">
                Quyidagi maydonga savollarning to'g'ri JSON massivini joylashtiring va "Importni boshlash" tugmasini bosing.
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                rows={10}
                value={bulkJsonInput}
                onChange={(e) => setBulkJsonInput(e.target.value)}
                placeholder={`[\n  {\n    "question": "O'zbekiston poytaxti qaysi?",\n    "A": "Toshkent",\n    "B": "Samarqand",\n    "C": "Buxoro",\n    "D": "Xiva",\n    "correctAnswer": "A",\n    "subject": "History of Uzbekistan"\n  }\n]`}
                className="w-full p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl outline-none"
              />

              {importStatus && (
                <div className="text-xs font-bold text-primary-700 bg-primary-50 p-3 border border-primary-100 rounded-xl">
                  {importStatus}
                </div>
              )}

              <button
                onClick={handleImportJson}
                className="dtm-btn-primary py-3 text-sm flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>JSON Importini boshlash</span>
              </button>
            </div>
          </div>
        )}

        {/* Ban Duration Selection Modal */}
        {selectedUserToBan && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 w-full max-w-sm shadow-xl"
            >
              <h3 className="font-display font-extrabold text-slate-900 text-lg text-center mb-1">Abituriyentni bloklash</h3>
              <p className="text-xs text-slate-500 text-center mb-6 font-semibold">
                {selectedUserToBan.nickname} ni tizimga kirishini va test yechishini vaqtincha yoki butunlay cheklash.
              </p>
              
              <form onSubmit={handleBanUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Bloklash muddati</label>
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm cursor-pointer"
                  >
                    <option value="1_hour">1 Soat (1 hour)</option>
                    <option value="12_hours">12 Soat (12 hours)</option>
                    <option value="1_day">1 Kun (1 day)</option>
                    <option value="7_days">7 Kun (7 days)</option>
                    <option value="30_days">30 Kun (30 days)</option>
                    <option value="1_year">1 Yil (1 year)</option>
                    <option value="permanent">Umrbod (Permanent)</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedUserToBan(null)}
                    className="flex-1 py-3 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs font-bold bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    Bloklash
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Fullscreen Receipt Modal Preview */}
        {selectedReceipt && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-50">
            <div className="max-w-xl w-full flex justify-end mb-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-4 border border-white/20"
            >
              <img
                src={selectedReceipt}
                alt="Full Receipt Check"
                className="w-full max-h-[70vh] object-contain rounded-2xl mx-auto"
              />
            </motion.div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
