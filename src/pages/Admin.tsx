/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ShieldAlert, Cpu, Users, Database, HelpCircle, AlertTriangle, Trash2, 
  UserX, CheckCircle, PlusCircle, Upload, Download, Edit2, FileSpreadsheet, 
  FileText, CheckCircle2, CreditCard, Bell, Eye, X, ChevronRight, Check, Ban,
  TrendingUp, Award, Activity, Send, MessageCircle, User as UserIcon
} from "lucide-react";
import { db, rtdb, handleFirestoreError, OperationType, getDocs, setDoc, deleteDoc, set } from "../lib/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { Question, User, Purchase } from "../types";

export default function Admin() {
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "summary" | "users" | "purchases" | "notifications" | "messages" | "questions" | "import">("dashboard");
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTestsStarted: 0,
    activeSessionsCount: 0,
    completedSessionsCount: 0,
    bannedUsersCount: 0,
    questionsDatabaseCount: 0,
    pendingPurchasesCount: 0,
    totalFollowers: 0,
    totalSubscriptions: 0
  });

  // Database lists
  const [usersList, setUsersList] = useState<User[]>([]);
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [bannedUids, setBannedUids] = useState<string[]>([]);
  const [purchasesList, setPurchasesList] = useState<Purchase[]>([]);
  const [messagesHistory, setMessagesHistory] = useState<any[]>([]);

  // Ban Duration Modal State
  const [selectedUserToBan, setSelectedUserToBan] = useState<User | null>(null);
  const [banDuration, setBanDuration] = useState<string>("1_day");
  const [banReason, setBanReason] = useState<string>("Tizim qoidalarini va foydalanish shartlarini buzganingiz sababli akkauntingiz bloklandi.");

  // Receipt Preview Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Announcement Form State
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifTarget, setNotifTarget] = useState("all");
  const [sendingNotif, setSendingNotif] = useState(false);

  // Direct Message State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedAdminUser, setSelectedAdminUser] = useState<User | null>(null);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

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
      const statsRes = await fetch("/api/admin/stats");
      const statsData = statsRes.ok ? await statsRes.json() : {};

      const bannedRes = await fetch("/api/admin/banned-users");
      const bannedData = bannedRes.ok ? await bannedRes.json() : { banned: [] };
      setBannedUids(bannedData.banned);

      let uList: User[] = [];
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        usersSnap.forEach((doc) => {
          uList.push(doc.data() as User);
        });
      } catch (err) {
        console.warn("Failed to fetch users from Firestore, using fallback:", err);
      }

      let serverUsers: User[] = [];
      try {
        const sRes = await fetch("/api/admin/users");
        if (sRes.ok) {
          const sData = await sRes.json();
          serverUsers = sData.users || [];
        }
      } catch (err) {
        console.error("Failed to fetch server-side users list:", err);
      }

      const mergedUsersMap: Record<string, User> = {};
      serverUsers.forEach((u) => {
        if (u && u.uid) {
          mergedUsersMap[u.uid] = u;
        }
      });
      uList.forEach((u) => {
        if (u && u.uid) {
          mergedUsersMap[u.uid] = { ...(mergedUsersMap[u.uid] || {}), ...u };
        }
      });

      const finalUsersList = Object.values(mergedUsersMap);
      setUsersList(finalUsersList);

      const purchasesQuery = query(collection(db, "purchases"), orderBy("createdAt", "desc"));
      const purchasesSnap = await getDocs(purchasesQuery);
      const pList: Purchase[] = [];
      purchasesSnap.forEach((doc) => {
        pList.push({ id: doc.id, ...doc.data() } as Purchase);
      });
      setPurchasesList(pList);

      const pendingCount = pList.filter(p => p.status === "Tekshirilyapti").length;
      const approvedCount = pList.filter(p => p.status === "Tastiqlandi").length;
      const followerStats = finalUsersList.reduce((acc, u) => acc + (u.referralCount || 0), 0);

      setStats({
        totalUsers: finalUsersList.length,
        totalTestsStarted: statsData.totalTestsStarted || 0,
        activeSessionsCount: statsData.activeSessionsCount || 0,
        completedSessionsCount: statsData.completedSessionsCount || 0,
        bannedUsersCount: bannedData.banned.length,
        questionsDatabaseCount: statsData.questionsDatabaseCount || 17,
        pendingPurchasesCount: pendingCount,
        totalFollowers: followerStats,
        totalSubscriptions: approvedCount
      });

    } catch (err) {
      console.error("Failed to load admin panel data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();

    let unsubUsers: (() => void) | null = null;
    let unsubPurchases: (() => void) | null = null;

    try {
      const usersRef = ref(rtdb, "users");
      unsubUsers = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (val && typeof val === "object") {
            const rtdbUsersList: User[] = Object.entries(val).map(([key, item]: [string, any]) => ({
              uid: key,
              email: item.email || "",
              photoURL: item.photoURL || "",
              nickname: item.nickname || "Abituriyent",
              role: item.role || "student",
              selectedDirection: item.selectedDirection || "O'quvchi",
              selectedSubjects: item.selectedSubjects || [],
              lastLogin: item.lastLogin || new Date().toISOString(),
              createdAt: item.createdAt || new Date().toISOString(),
              score: item.score || 0,
              testsTakenCount: item.testsTakenCount || 0,
              testsSolved: item.testsSolved || 0,
              country: item.country || "O'zbekiston",
              referralCount: item.referralCount || 0,
              trialDaysAdded: item.trialDaysAdded || 0,
              subscriptionStatus: item.subscriptionStatus || "none",
              subscriptionPlan: item.subscriptionPlan || null,
              promoCode: item.promoCode || "",
              referredBy: item.referredBy || null,
              premium: item.premium || false
            }));

            setUsersList((prevList) => {
              const map: Record<string, User> = {};
              prevList.forEach((u) => { if (u && u.uid) map[u.uid] = u; });
              rtdbUsersList.forEach((u) => { if (u && u.uid) map[u.uid] = { ...(map[u.uid] || {}), ...u }; });
              const merged = Object.values(map);
              setStats((s) => ({ ...s, totalUsers: merged.length }));
              return merged;
            });
          }
        }
      });

      const purchasesRef = ref(rtdb, "purchases");
      unsubPurchases = onValue(purchasesRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (val && typeof val === "object") {
            const rtdbPurchasesList: Purchase[] = Object.entries(val).map(([key, item]: [string, any]) => ({
              id: key,
              uid: item.uid || key,
              nickname: item.nickname || "Abituriyent",
              email: item.email || "",
              plan: item.plan || "oylik",
              price: item.price || 50000,
              receiptImage: item.receiptImage || "",
              status: item.status || "Tekshirilyapti",
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: item.updatedAt || new Date().toISOString()
            }));

            setPurchasesList(rtdbPurchasesList);
            const pendingCount = rtdbPurchasesList.filter((p) => p.status === "Tekshirilyapti").length;
            setStats((s) => ({ ...s, pendingPurchasesCount: pendingCount }));
          }
        }
      });
    } catch (e) {
      console.warn("Admin RTDB listeners setup note:", e);
    }

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubPurchases) unsubPurchases();
    };
  }, []);

  // Ban User
  const handleBanUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToBan) return;

    try {
      const finalReason = banReason.trim() || "Tizim qoidalarini va foydalanish shartlarini buzganingiz sababli akkauntingiz bloklandi.";

      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          uid: selectedUserToBan.uid, 
          action: "ban", 
          duration: banDuration,
          reason: finalReason
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        const userDocRef = doc(db, "users", selectedUserToBan.uid);
        await setDoc(userDocRef, { 
          bannedUntil: data.bannedUntil,
          bannedReason: finalReason
        }, { merge: true });

        try {
          await set(ref(rtdb, `users/${selectedUserToBan.uid}/bannedUntil`), data.bannedUntil);
          await set(ref(rtdb, `users/${selectedUserToBan.uid}/bannedReason`), finalReason);
        } catch (_) {}

        alert(`${selectedUserToBan.nickname} muvaffaqiyatli bloklandi va tizimdan chiqarib yuborildi.`);
        setSelectedUserToBan(null);
        loadAdminData();
      }
    } catch (err) {
      console.error("Failed to ban user:", err);
    }
  };

  // Unban User
  const handleUnbanUser = async (uid: string) => {
    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, action: "unban" })
      });

      if (res.ok) {
        const userDocRef = doc(db, "users", uid);
        await setDoc(userDocRef, { 
          bannedUntil: null,
          bannedReason: null 
        }, { merge: true });

        try {
          await set(ref(rtdb, `users/${uid}/bannedUntil`), null);
          await set(ref(rtdb, `users/${uid}/bannedReason`), null);
        } catch (_) {}

        alert("Abituriyent blokdan chiqarildi.");
        loadAdminData();
      }
    } catch (err) {
      console.error("Failed to unban user:", err);
    }
  };

  // Delete User
  const handleDeleteUser = async (uid: string) => {
    if (!confirm("Haqiqatdan ham ushbu foydalanuvchini butunlay o'chirib yubormoqchimisiz?")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      try {
        await deleteDoc(doc(db, "purchases", uid));
      } catch (_) {}

      try {
        await set(ref(rtdb, `users/${uid}`), null);
      } catch (_) {}

      try {
        await fetch(`/api/admin/users/${uid}`, { method: "DELETE" });
      } catch (err) {
        console.warn("Failed to delete user from server database:", err);
      }

      alert("Foydalanuvchi muvaffaqiyatli o'chirildi.");
      loadAdminData();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  // Approve Purchase
  const handleApprovePurchase = async (purchase: Purchase) => {
    try {
      const now = new Date();
      let daysToAdd = 7;
      if (purchase.plan === "oylik") daysToAdd = 30;
      else if (purchase.plan === "yillik") daysToAdd = 365;

      const premiumUntilDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      await setDoc(doc(db, "purchases", purchase.uid), {
        status: "Tastiqlandi",
        updatedAt: now.toISOString()
      }, { merge: true });

      try {
        await set(ref(rtdb, `purchases/${purchase.uid}/status`), "Tastiqlandi");
      } catch (_) {}

      const userUpdateFields = {
        premium: true,
        subscriptionStatus: "Tastiqlandi",
        premiumUntil: premiumUntilDate.toISOString()
      };
      await setDoc(doc(db, "users", purchase.uid), userUpdateFields, { merge: true });

      try {
        await set(ref(rtdb, `users/${purchase.uid}/premium`), true);
        await set(ref(rtdb, `users/${purchase.uid}/subscriptionStatus`), "Tastiqlandi");
        await set(ref(rtdb, `users/${purchase.uid}/premiumUntil`), premiumUntilDate.toISOString());
      } catch (_) {}

      try {
        await fetch("/api/users/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: purchase.uid, ...userUpdateFields })
        });
      } catch (err) {
        console.warn("Failed to sync premium state to server:", err);
      }

      const notifId = `notif_${purchase.uid}_${Date.now()}`;
      const notifObj = {
        id: notifId,
        userId: purchase.uid,
        title: "Premium obuna tasdiqlandi! 🎉",
        message: `Tabriklaymiz! Siz yuborgan to'lov cheki tasdiqlandi. Siz uchun ${purchase.plan === 'haftalik' ? 'haftalik' : purchase.plan === 'oylik' ? 'oylik' : 'yillik'} premium obunasi faollashtirildi. Barcha imtihonlar va savollar hozirda ochiq!`,
        createdAt: now.toISOString()
      };
      await setDoc(doc(db, "notifications", notifId), notifObj);

      try {
        await set(ref(rtdb, `notifications/${notifId}`), notifObj);
      } catch (_) {}

      alert(`${purchase.nickname} uchun premium obuna muvaffaqiyatli faollashtirildi!`);
      loadAdminData();
    } catch (err) {
      console.error("Failed to approve purchase:", err);
      alert("Xatolik yuz berdi. To'lovni tasdiqlash imkonsiz.");
    }
  };

  // Reject Purchase
  const handleRejectPurchase = async (purchase: Purchase) => {
    try {
      const now = new Date();
      await setDoc(doc(db, "purchases", purchase.uid), {
        status: "Tekshirilmadi",
        updatedAt: now.toISOString()
      }, { merge: true });

      try {
        await set(ref(rtdb, `purchases/${purchase.uid}/status`), "Tekshirilmadi");
      } catch (_) {}

      const userUpdateFields = {
        subscriptionStatus: "Tekshirilmadi"
      };
      await setDoc(doc(db, "users", purchase.uid), userUpdateFields, { merge: true });

      try {
        await set(ref(rtdb, `users/${purchase.uid}/subscriptionStatus`), "Tekshirilmadi");
      } catch (_) {}

      try {
        await fetch("/api/users/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: purchase.uid, ...userUpdateFields })
        });
      } catch (err) {
        console.warn("Failed to sync rejection state to server:", err);
      }

      const notifId = `notif_${purchase.uid}_${Date.now()}`;
      const notifObj = {
        id: notifId,
        userId: purchase.uid,
        title: "To'lov cheki rad etildi ⚠️",
        message: "Afsuski, siz yuklagan to'lov cheki ma'lumotlari tasdiqlanmadi. Iltimos, chek rasmi xiraligi yoki boshqa chek yuklanganligini tekshirib, qaytadan yuboring.",
        createdAt: now.toISOString()
      };
      await setDoc(doc(db, "notifications", notifId), notifObj);

      try {
        await set(ref(rtdb, `notifications/${notifId}`), notifObj);
      } catch (_) {}

      alert(`${purchase.nickname} uchun to'lov rad etildi va xabarnoma yuborildi.`);
      loadAdminData();
    } catch (err) {
      console.error("Failed to reject purchase:", err);
      alert("Xatolik yuz berdi. To'lovni rad etish imkonsiz.");
    }
  };

  // Send Broadcast Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      alert("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }

    setSendingNotif(true);
    try {
      const notifId = `announcement_${Date.now()}`;
      const notifObj = {
        id: notifId,
        userId: notifTarget,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "notifications", notifId), notifObj);

      try {
        await set(ref(rtdb, `notifications/${notifId}`), notifObj);
      } catch (_) {}

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

  // Send Direct Message
  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminUser || !messageTitle.trim() || !messageContent.trim()) {
      alert("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }

    setSendingMessage(true);
    try {
      const messageId = `msg_${selectedAdminUser.uid}_${Date.now()}`;
      const messageObj = {
        id: messageId,
        fromAdmin: true,
        fromAdminName: "Admin",
        toUserId: selectedAdminUser.uid,
        toUserName: selectedAdminUser.nickname,
        title: messageTitle.trim(),
        content: messageContent.trim(),
        createdAt: new Date().toISOString(),
        read: false,
        type: "admin_message"
      };

      await setDoc(doc(db, "messages", messageId), messageObj);

      try {
        await set(ref(rtdb, `messages/${messageId}`), messageObj);
      } catch (_) {}

      const notifId = `notif_${selectedAdminUser.uid}_${Date.now()}`;
      const notifObj = {
        id: notifId,
        userId: selectedAdminUser.uid,
        title: `📩 Admin xabarnomasi: ${messageTitle}`,
        message: messageContent,
        createdAt: new Date().toISOString(),
        type: "admin_message",
        relatedMessageId: messageId
      };

      await setDoc(doc(db, "notifications", notifId), notifObj);
      try {
        await set(ref(rtdb, `notifications/${notifId}`), notifObj);
      } catch (_) {}

      alert(`${selectedAdminUser.nickname} ga xabar muvaffaqiyatli yuborildi!`);
      setMessageTitle("");
      setMessageContent("");
      setSelectedAdminUser(null);
      setShowMessageModal(false);
      loadAdminData();
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Xabarni yuborishda xatolik yuz berdi.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Load Messages History
  const loadMessagesHistory = async () => {
    setLoadingMessages(true);
    try {
      const messagesQuery = query(collection(db, "messages"), orderBy("createdAt", "desc"));
      const messagesSnap = await getDocs(messagesQuery);
      const mList: any[] = [];
      messagesSnap.forEach((doc) => {
        mList.push({ id: doc.id, ...doc.data() });
      });
      setMessagesHistory(mList);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Add Question
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

  // Import JSON
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

  // Export CSV
  const handleExportCSV = async () => {
    try {
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
              Obuna tasdiqlash, abituriyentlarni boshqarish, xabarlar yuborish va savollar bazasini to'liq boshqarish paneli.
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
            { id: "summary", label: "Hozirgi Holat", icon: TrendingUp },
            { id: "users", label: "Abituriyentlar", icon: Users },
            { id: "purchases", label: `To'lovlar ${stats.pendingPurchasesCount > 0 ? `(${stats.pendingPurchasesCount})` : ''}`, icon: CreditCard },
            { id: "notifications", label: "Xabar yuborish", icon: Bell },
            { id: "messages", label: "Admin Xabarlari", icon: MessageCircle },
            { id: "questions", label: "Savol Qo'shish", icon: Database },
            { id: "import", label: "Bulk Import", icon: Upload }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  if (tab.id === "messages") {
                    loadMessagesHistory();
                  }
                }}
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

            {/* Extended Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-slate-400 uppercase">Do'stlik Takliflari</div>
                  <Award className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-3xl font-black text-slate-800">{stats.totalFollowers}</div>
                <p className="text-[11px] text-slate-500 font-semibold mt-2">Faol do'stlik takliflari</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-slate-400 uppercase">Premium Obunalar</div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-black text-slate-800">{stats.totalSubscriptions}</div>
                <p className="text-[11px] text-slate-500 font-semibold mt-2">Faollashtirilgan obunalar</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-slate-400 uppercase">Faol Sessiyalar</div>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-black text-slate-800">{stats.activeSessionsCount}</div>
                <p className="text-[11px] text-slate-500 font-semibold mt-2">Hozirgi vaqtda faol</p>
              </div>
            </div>

            {/* Live active sessions */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <h3 className="font-display font-extrabold text-slate-800 text-lg mb-4">
                Tizim Monitoringi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">FAOL IMTIHON SESSIYALARI</p>
                  <p className="text-2xl font-black text-blue-600">{stats.activeSessionsCount} ta</p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">YAKUNLANGAN IMTIHONLAR</p>
                  <p className="text-2xl font-black text-emerald-600">{stats.completedSessionsCount} ta</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Summary Tab - Hozirgi Holat */}
        {activeSubTab === "summary" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users Summary */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Abituriyentlar Hozirgi Holati</span>
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-semibold text-slate-600">Jami roʻyxatdan oʻtgan</span>
                    <span className="text-lg font-black text-slate-800">{stats.totalUsers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-semibold text-slate-600">Premium faollashtirilgan</span>
                    <span className="text-lg font-black text-emerald-600">{stats.totalSubscriptions}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-semibold text-slate-600">Bloklanganlar</span>
                    <span className="text-lg font-black text-red-600">{stats.bannedUsersCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-semibold text-slate-600">Premium bo'lmaganlar</span>
                    <span className="text-lg font-black text-slate-600">{stats.totalUsers - stats.totalSubscriptions}</span>
                  </div>
                </div>
              </div>

              {/* Tests Summary */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span>Imtihon Faoliyati</span>
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-semibold text-slate-600">Boshlangan imtihonlar</span>
                    <span className="text-lg font-black text-blue-600">{stats.totalTestsStarted}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-semibold text-slate-600">Yakunlangan imtihonlar</span>
                    <span className="text-lg font-black text-emerald-600">{stats.completedSessionsCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-semibold text-slate-600">Savol bazasida</span>
                    <span className="text-lg font-black text-purple-600">{stats.questionsDatabaseCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-semibold text-slate-600">Faol sessiyalar</span>
                    <span className="text-lg font-black text-amber-600">{stats.activeSessionsCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchases Summary */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <span>To'lov va Obuna Holati</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tekshirilyapti</p>
                  <p className="text-3xl font-black text-amber-600">{stats.pendingPurchasesCount}</p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tasdiqlandi</p>
                  <p className="text-3xl font-black text-emerald-600">{stats.totalSubscriptions}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Do'stlik Takliflari</p>
                  <p className="text-3xl font-black text-slate-600">{stats.totalFollowers}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Users management Subtab */}
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
                    if (!user || !user.uid) return null;

                    const nickname = typeof user.nickname === "string" && user.nickname.trim().length > 0 ? user.nickname : "Abituriyent";
                    const email = typeof user.email === "string" && user.email.trim().length > 0 ? user.email : "Email mavjud emas";
                    const photoURL = typeof user.photoURL === "string" ? user.photoURL : "";
                    const role = typeof user.role === "string" ? user.role : "student";
                    const score = typeof user.score === "number" ? user.score : 0;
                    const testsSolved = typeof user.testsSolved === "number" ? user.testsSolved : 0;
                    const referralCount = typeof user.referralCount === "number" ? user.referralCount : 0;
                    const subscriptionStatus = typeof user.subscriptionStatus === "string" ? user.subscriptionStatus : "none";
                    const subscriptionPlan = typeof user.subscriptionPlan === "string" ? user.subscriptionPlan : "haftalik";

                    const isBannedServer = Array.isArray(bannedUids) ? bannedUids.includes(user.uid) : false;
                    const bannedUntilVal = user.bannedUntil;
                    const isBannedLocal = Boolean(
                      bannedUntilVal && (
                        bannedUntilVal === "permanent" ||
                        (typeof bannedUntilVal === "string" && !isNaN(new Date(bannedUntilVal).getTime()) && new Date(bannedUntilVal).getTime() > Date.now())
                      )
                    );
                    const isBanned = isBannedServer || isBannedLocal;

                    const firstLetter = nickname.charAt(0).toUpperCase();

                    return (
                      <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2.5">
                            {photoURL ? (
                              <img src={photoURL} alt={nickname} className="w-8 h-8 rounded-full border border-slate-100 object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-xs">{firstLetter}</div>
                            )}
                            <div>
                              <div className="font-bold text-slate-800">{nickname}</div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Do'stlar: {referralCount}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-semibold">{email}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] ${role === "admin" ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                            {role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-primary-600">{score} ball ({testsSolved} ta test)</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] border ${
                            subscriptionStatus === "Tastiqlandi"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : subscriptionStatus === "Tekshirilyapti"
                              ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                              : "bg-slate-50 text-slate-500 border-slate-100"
                          }`}>
                            {subscriptionStatus === "Tastiqlandi" 
                              ? `Faol (${subscriptionPlan})` 
                              : subscriptionStatus === "Tekshirilyapti" 
                              ? "Kutilmoqda" 
                              : "Sinov muddati"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-mono text-[10px] text-slate-500">
                          {isBannedLocal ? (
                            <div>
                              <span className="font-bold text-red-600 block">
                                {bannedUntilVal === "permanent" ? "Umrbod" : (typeof bannedUntilVal === "string" && !isNaN(new Date(bannedUntilVal).getTime()) ? new Date(bannedUntilVal).toLocaleDateString() : "Umrbod")}
                              </span>
                              {user.bannedReason && (
                                <span className="text-[9px] text-slate-400 font-sans block truncate max-w-[120px] mx-auto" title={user.bannedReason}>
                                  "{user.bannedReason}"
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-emerald-600 font-bold">Aktiv</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right pr-6 flex justify-end gap-2">
                          {isBanned ? (
                            <button
                              onClick={() => handleUnbanUser(user.uid)}
                              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer flex items-center space-x-1 text-[11px] font-bold"
                              title="Blokdan chiqarish"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Blokdan chiqarish</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedUserToBan(user)}
                              className="px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer flex items-center space-x-1 text-[11px] font-bold"
                              title="Bloklash"
                            >
                              <Ban className="w-3.5 h-3.5 text-amber-600" />
                              <span>Bloklash</span>
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

        {/* 4. Purchases Subtab */}
        {activeSubTab === "purchases" && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <h3 className="font-display font-extrabold text-slate-800 text-lg p-6 border-b border-slate-100 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-primary-500" />
              <span>Premium Obuna Sotib Olish So'rovlari</span>
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
                    {purchasesList.map((purchase) => {
                      if (!purchase || !purchase.id) return null;

                      const nickname = typeof purchase.nickname === "string" && purchase.nickname.trim().length > 0 ? purchase.nickname : "Abituriyent";
                      const email = typeof purchase.email === "string" && purchase.email.trim().length > 0 ? purchase.email : "Email mavjud emas";
                      const plan = typeof purchase.plan === "string" ? purchase.plan : "haftalik";
                      const price = typeof purchase.price === "number" ? purchase.price : Number(purchase.price) || 0;
                      const status = typeof purchase.status === "string" ? purchase.status : "Tekshirilyapti";
                      const createdAtFormatted = purchase.createdAt && typeof purchase.createdAt === "string" && !isNaN(new Date(purchase.createdAt).getTime())
                        ? new Date(purchase.createdAt).toLocaleString('uz-UZ')
                        : "Sana noma'lum";

                      return (
                        <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div>
                              <span className="font-extrabold text-slate-800 block">{nickname}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 uppercase text-primary-600">{plan} obuna</td>
                          <td className="py-4 px-6 text-slate-800">{price.toLocaleString('uz-UZ')} UZS</td>
                          <td className="py-4 px-6">
                            {purchase.receiptImage ? (
                              <button
                                onClick={() => setSelectedReceipt(purchase.receiptImage)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Chekni ko'rish</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Mavjud emas</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-mono text-[10px]">
                            {createdAtFormatted}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] border ${
                              status === "Tastiqlandi"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : status === "Tekshirilyapti"
                                ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                                : "bg-red-50 text-red-700 border-red-100"
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right pr-6">
                            {status === "Tekshirilyapti" && (
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5. Notifications Broadcast Subtab */}
        {activeSubTab === "notifications" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="font-display font-extrabold text-slate-800 text-lg">Habarnoma Yuborish (Broadcasting)</h3>
              <p className="text-sm text-slate-500 mt-1">
                Barcha foydalanuvchilarga umumiy e'lon yoki aniq bir abituriyentga ogohlantirish yuborish.
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

        {/* 6. Admin Messages Tab */}
        {activeSubTab === "messages" && (
          <div className="space-y-6">
            {/* Send Message Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowMessageModal(true)}
                className="dtm-btn-primary py-2.5 px-4 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Foydalanuvchiga Xabar Yuborish</span>
              </button>
            </div>

            {/* Messages History */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-primary-500" />
                  <span>Admin Xabarlari Tarixi</span>
                </h3>
              </div>

              {loadingMessages ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : messagesHistory.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <MessageCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold">Hozircha xabarlar mavjud emas</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {messagesHistory.map((msg) => (
                    <div key={msg.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                            <UserIcon className="w-4 h-4 text-primary-500" />
                            <span>{msg.toUserName}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 font-semibold mt-1">
                            {new Date(msg.createdAt).toLocaleString('uz-UZ')}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] border font-bold ${
                          msg.read
                            ? "bg-slate-50 text-slate-500 border-slate-100"
                            : "bg-blue-50 text-blue-700 border-blue-100 animate-pulse"
                        }`}>
                          {msg.read ? "O'qildi" : "O'qilmadi"}
                        </span>
                      </div>
                      
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <p className="font-bold text-slate-800 text-sm mb-2">{msg.title}</p>
                        <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Add question Subtab */}
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

            {/* Right Static info */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-indigo-500" />
                  <span>DTM Savollar Formati haqida</span>
                </h3>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                  DTM MASTER platformasi to'liq 5 ta fandan iborat 90 ta test savollaridan tashkil topgan kompleks imtihonlarni taqdim etadi.
                </p>
                
                <div className="space-y-2 font-semibold text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <p className="flex justify-between"><span>📚 Matematika (Majburiy):</span> <span className="font-mono font-bold text-slate-800">10 ta savol</span></p>
                  <p className="flex justify-between"><span>📚 O'zbekiston tarixi (Majburiy):</span> <span className="font-mono font-bold text-slate-800">10 ta savol</span></p>
                  <p className="flex justify-between"><span>📚 Ona tili (Majburiy):</span> <span className="font-mono font-bold text-slate-800">10 ta savol</span></p>
                  <p className="flex justify-between"><span>🔥 Mutaxassislik fani 1:</span> <span className="font-mono font-bold text-slate-800">30 ta savol</span></p>
                  <p className="flex justify-between"><span>🔥 Mutaxassislik fani 2:</span> <span className="font-mono font-bold text-slate-800">30 ta savol</span></p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 8. Bulk JSON Import Subtab */}
        {activeSubTab === "import" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="font-display font-extrabold text-slate-800 text-lg">JSON orqali savollar kiritish</h3>
              <p className="text-sm text-slate-500 mt-1">
                Quyidagi maydonga savollarning to'g'ri JSON massivini joylashtiring.
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                rows={10}
                value={bulkJsonInput}
                onChange={(e) => setBulkJsonInput(e.target.value)}
                placeholder={`[\n  {\n    "question": "Savol?",\n    "A": "Javob A",\n    "B": "Javob B",\n    "C": "Javob C",\n    "D": "Javob D",\n    "correctAnswer": "A",\n    "subject": "Mathematics"\n  }\n]`}
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
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 w-full max-w-md shadow-xl"
            >
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Ban className="w-6 h-6" />
              </div>

              <h3 className="font-display font-extrabold text-slate-900 text-lg text-center mb-1">Abituriyentni bloklash</h3>
              <p className="text-xs text-slate-500 text-center mb-5 font-semibold">
                <span className="text-slate-900 font-bold">{selectedUserToBan.nickname}</span> ni tizimdan darhol haydash.
              </p>
              
              <form onSubmit={handleBanUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Bloklash muddati</label>
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm cursor-pointer"
                  >
                    <option value="1_hour">1 Soat</option>
                    <option value="12_hours">12 Soat</option>
                    <option value="1_day">1 Kun</option>
                    <option value="7_days">7 Kun</option>
                    <option value="30_days">30 Kun</option>
                    <option value="1_year">1 Yil</option>
                    <option value="permanent">Umrbod</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Bloklanish Sababi</label>
                  <textarea
                    rows={3}
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Sababi yozing..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs text-slate-800 leading-relaxed"
                  />
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
                    className="flex-1 py-3 text-xs font-extrabold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-500/20 cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Bloklash</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Send Direct Message Modal */}
        {showMessageModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-extrabold text-slate-900 text-lg">
                  Foydalanuvchiga Xabar
                </h3>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSendDirectMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Foydalanuvchini tanlang <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedAdminUser?.uid || ""}
                    onChange={(e) => {
                      const uid = e.target.value;
                      const user = usersList.find(u => u.uid === uid);
                      setSelectedAdminUser(user || null);
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm cursor-pointer"
                  >
                    <option value="">-- Tanlang --</option>
                    {usersList.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.nickname} ({u.email || "Email yo'q"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Mavzu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Xabar sarlavhasi..."
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Xabar Matni <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Xabar yozing..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm leading-relaxed resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    className="flex-1 py-3 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMessage}
                    className="flex-1 py-3 text-xs font-extrabold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-md shadow-primary-500/20 cursor-pointer flex items-center justify-center space-x-1 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sendingMessage ? "Yuborilmoqda..." : "Xabar yuborish"}</span>
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