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
  TrendingUp, Award, Activity, Send, MessageCircle, User as UserIcon,
  Zap, ArrowRight, Calendar, DollarSign
} from "lucide-react";
import { db, rtdb, handleFirestoreError, OperationType, getDocs, setDoc, deleteDoc, set } from "../lib/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { Question, User, Purchase } from "../types";

export default function Admin() {
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "summary" | "users" | "purchases" | "help_requests" | "notifications" | "messages" | "questions" | "import">("dashboard");
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
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  const [loadingHelpRequests, setLoadingHelpRequests] = useState(false);

  // Ban Duration Modal State
  const [selectedUserToBan, setSelectedUserToBan] = useState<User | null>(null);
  const [banDuration, setBanDuration] = useState<string>("1_day");
  const [banReason, setBanReason] = useState<string>("Tizim qoidalarini va foydalanish shartlarini buzganingiz sababli akkauntingiz bloklandi.");

  // Receipt Preview Modal State
  const [selectedPurchaseForDetails, setSelectedPurchaseForDetails] = useState<Purchase | null>(null);

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
        console.warn("Failed to fetch users from Firestore:", err);
      }

      let serverUsers: User[] = [];
      try {
        const sRes = await fetch("/api/admin/users");
        if (sRes.ok) {
          const sData = await sRes.json();
          serverUsers = sData.users || [];
        }
      } catch (err) {
        console.error("Failed to fetch server-side users:", err);
      }

      const mergedUsersMap: Record<string, User> = {};
      serverUsers.forEach((u) => {
        if (u && u.uid) mergedUsersMap[u.uid] = u;
      });
      uList.forEach((u) => {
        if (u && u.uid) mergedUsersMap[u.uid] = { ...(mergedUsersMap[u.uid] || {}), ...u };
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
      console.error("Failed to load admin data:", err);
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
      console.warn("RTDB listeners setup warning:", e);
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
      const finalReason = banReason.trim() || "Tizim qoidalarini buzganingiz sababli bloklandi.";

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

        alert(`✅ ${selectedUserToBan.nickname} muvaffaqiyatli bloklandi.`);
        setSelectedUserToBan(null);
        loadAdminData();
      }
    } catch (err) {
      console.error("Failed to ban user:", err);
      alert("❌ Xatolik yuz berdi.");
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

        alert("✅ Abituriyent blokdan chiqarildi.");
        loadAdminData();
      }
    } catch (err) {
      console.error("Failed to unban user:", err);
    }
  };

  // Delete User
  const handleDeleteUser = async (uid: string) => {
    if (!confirm("Haqiqatdan ham foydalanuvchini o'chirib yubormoqchimisiz?")) return;
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
        console.warn("Server delete warning:", err);
      }

      alert("✅ Foydalanuvchi o'chirildi.");
      loadAdminData();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  // Approve Purchase
  const handleApprovePurchase = async (purchase: Purchase) => {
    if (!window.confirm(`${purchase.nickname} uchun Premium tasdiqlashni xohlaysizmi?`)) return;

    try {
      const now = new Date();
      let daysToAdd = 7;
      if (purchase.plan === "oylik") daysToAdd = 30;
      else if (purchase.plan === "yillik") daysToAdd = 365;

      const premiumUntilDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      // 1. Update purchase status
      await setDoc(doc(db, "purchases", purchase.uid), {
        status: "Tastiqlandi",
        updatedAt: now.toISOString()
      }, { merge: true });

      try {
        await set(ref(rtdb, `purchases/${purchase.uid}/status`), "Tastiqlandi");
      } catch (_) {}

      // 2. Update user premium status
      const userUpdateFields = {
        premium: true,
        subscriptionStatus: "Tastiqlandi",
        premiumUntil: premiumUntilDate.toISOString(),
        subscriptionPlan: purchase.plan
      };

      await setDoc(doc(db, "users", purchase.uid), userUpdateFields, { merge: true });

      try {
        await set(ref(rtdb, `users/${purchase.uid}/premium`), true);
        await set(ref(rtdb, `users/${purchase.uid}/subscriptionStatus`), "Tastiqlandi");
        await set(ref(rtdb, `users/${purchase.uid}/premiumUntil`), premiumUntilDate.toISOString());
        await set(ref(rtdb, `users/${purchase.uid}/subscriptionPlan`), purchase.plan);
      } catch (_) {}

      // 3. Sync with server
      try {
        await fetch("/api/users/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: purchase.uid, ...userUpdateFields })
        });
      } catch (err) {
        console.warn("Sync warning:", err);
      }

      // 4. Send congratulation notification
      const notifId = `notif_${purchase.uid}_${Date.now()}`;
      const notifObj = {
        id: notifId,
        userId: purchase.uid,
        title: "🎉 Premium obuna tasdiqlandi!",
        message: `Tabriklaymiz! Siz yuborgan to'lov cheki tasdiqlandi. Siz uchun ${purchase.plan === 'haftalik' ? '7 KUNLIK' : purchase.plan === 'oylik' ? '30 KUNLIK' : '365 KUNLIK'} premium obunasi faollashtirildi. Barcha imtihonlar va savollar hozirda CHEKSIZ ochiq!`,
        createdAt: now.toISOString(),
        type: "purchase_approved"
      };

      await setDoc(doc(db, "notifications", notifId), notifObj);

      try {
        await set(ref(rtdb, `notifications/${notifId}`), notifObj);
      } catch (_) {}

      alert(`✅ ${purchase.nickname} uchun Premium faollashtirildi!`);
      loadAdminData();
    } catch (err) {
      console.error("Failed to approve:", err);
      alert("❌ Xatolik yuz berdi.");
    }
  };

  // Reject Purchase
  const handleRejectPurchase = async (purchase: Purchase) => {
    const reason = window.prompt(
      "Chekni rad etish sababini yozing:",
      "Chek rasmi xira yoki to'liq summani qoplamaganligi sababli."
    );

    if (!reason) return;

    try {
      const now = new Date();

      // 1. Update purchase status
      await setDoc(doc(db, "purchases", purchase.uid), {
        status: "Tekshirilmadi",
        updatedAt: now.toISOString(),
        rejectionReason: reason
      }, { merge: true });

      try {
        await set(ref(rtdb, `purchases/${purchase.uid}/status`), "Tekshirilmadi");
        await set(ref(rtdb, `purchases/${purchase.uid}/rejectionReason`), reason);
      } catch (_) {}

      // 2. Update user subscription status
      await setDoc(doc(db, "users", purchase.uid), {
        subscriptionStatus: "Tekshirilmadi"
      }, { merge: true });

      try {
        await set(ref(rtdb, `users/${purchase.uid}/subscriptionStatus`), "Tekshirilmadi");
      } catch (_) {}

      // 3. Send rejection notification
      const notifId = `notif_${purchase.uid}_${Date.now()}`;
      const notifObj = {
        id: notifId,
        userId: purchase.uid,
        title: "⚠️ To'lov cheki rad etildi",
        message: `Sizning yuborgan to'lov chekingiz tasdiqlanmadi.\n\n📋 Sababi: ${reason}\n\nIltimos, chek rasmini xiraligi yoki to'liq summani tekshirib, qaytadan yuboring.`,
        createdAt: now.toISOString(),
        type: "purchase_rejected"
      };

      await setDoc(doc(db, "notifications", notifId), notifObj);

      try {
        await set(ref(rtdb, `notifications/${notifId}`), notifObj);
      } catch (_) {}

      alert(`✅ ${purchase.nickname} uchun to'lov rad etildi.`);
      loadAdminData();
    } catch (err) {
      console.error("Failed to reject:", err);
      alert("❌ Xatolik yuz berdi.");
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

      alert("✅ Xabarnoma yuborildi!");
      setNotifTitle("");
      setNotifMessage("");
    } catch (err) {
      console.error("Failed to send:", err);
      alert("❌ Xatolik yuz berdi.");
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

      alert(`✅ ${selectedAdminUser.nickname} ga xabar yuborildi!`);
      setMessageTitle("");
      setMessageContent("");
      setSelectedAdminUser(null);
      setShowMessageModal(false);
      loadAdminData();
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("❌ Xatolik yuz berdi.");
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

  const loadHelpRequests = async () => {
    setLoadingHelpRequests(true);
    try {
      const helpSnap = await getDocs(collection(db, "help_requests"));
      const hList: any[] = [];
      helpSnap.forEach((doc) => {
        hList.push({ id: doc.id, ...doc.data() });
      });
      hList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHelpRequests(hList);
    } catch (err) {
      console.error("Failed to load help requests:", err);
    } finally {
      setLoadingHelpRequests(false);
    }
  };

  const markHelpRequestHandled = async (request: any) => {
    try {
      await setDoc(doc(db, "help_requests", request.id), { status: "handled" }, { merge: true });
      await set(ref(rtdb, `help_requests/${request.id}/status`), "handled");
      loadHelpRequests();
    } catch (err) {
      console.error("Failed to mark help request handled:", err);
      alert("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
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
        alert("✅ Savol saqlandi!");
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
        setImportStatus(`✅ Muvaffaqiyatli import qilindi: ${data.count} ta savol!`);
        setBulkJsonInput("");
        loadAdminData();
      }
    } catch (err) {
      setImportStatus("❌ Import xatosi: JSON formati noto'g'ri.");
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
      link.setAttribute("download", `DTM_Natijalari_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
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
              To'lovlar, abituriyentlar, xabarlar va savollar bazasini boshqarish
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer rounded-xl transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>CSV Yuklab Olish</span>
          </button>
        </div>

        {/* Sub-tabs menu */}
        <div className="flex gap-2 border-b border-slate-100 pb-1 overflow-x-auto scrollbar-none">
          {[
            { id: "dashboard", label: "📊 Statistika", icon: Cpu },
            { id: "summary", label: "📈 Holat", icon: TrendingUp },
            { id: "users", label: "👥 Abituriyentlar", icon: Users },
            { id: "purchases", label: `💳 To'lovlar${stats.pendingPurchasesCount > 0 ? ` (${stats.pendingPurchasesCount})` : ''}`, icon: CreditCard },
            { id: "help_requests", label: "🆘 Yordam So'rovlari", icon: HelpCircle },
            { id: "notifications", label: "📢 E'lonlar", icon: Bell },
            { id: "messages", label: "💬 Xabarlar", icon: MessageCircle },
            { id: "questions", label: "❓ Savollar", icon: Database },
            { id: "import", label: "📥 Import", icon: Upload }
          ].map((tab) => {
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  if (tab.id === "messages") {
                    loadMessagesHistory();
                  }
                  if (tab.id === "help_requests") {
                    loadHelpRequests();
                  }
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-primary-600 text-white border-primary-600 shadow-xs"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeSubTab === "help_requests" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs max-w-4xl mx-auto">
              <h3 className="font-display font-extrabold text-slate-800 text-lg mb-4">Yordam So'rovlari</h3>
              <p className="text-slate-500 text-sm mb-6">Foydalanuvchilardan kelgan yordam so'rovlari shu yerda ko'rsatiladi. Kimdan kelgani, emaili va xabar matni mavjud.</p>

              {loadingHelpRequests ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : helpRequests.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold">Hozircha yordam so'rovlari mavjud emas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {helpRequests.map((req) => (
                    <div key={req.id} className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{req.fromUserName || 'Noma'lum foydalanuvchi'}</p>
                          <p className="text-[11px] text-slate-500">{req.fromUserEmail || 'Email mavjud emas'}</p>
                          <p className="text-[11px] text-slate-500 mt-1">Foydalanuvchi ID: {req.fromUserId || 'noma'lum'}</p>
                        </div>
                        <div className="text-right text-[11px] font-semibold text-slate-500">
                          <p>{req.createdAt ? new Date(req.createdAt).toLocaleString('uz-UZ') : 'sana yo‘q'}</p>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black mt-2 ${req.status === 'handled' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {req.status === 'handled' ? 'Ko‘rilgan' : 'Yangi'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-3xl p-4 border border-slate-200 mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Xabar</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{req.message}</p>
                      </div>
                      <button
                        onClick={() => markHelpRequestHandled(req)}
                        className="py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-bold transition-all"
                      >
                        {req.status === 'handled' ? 'Ko‘rilgan deb belgilandi' : 'Ko‘rilgan deb belgilash'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1. DASHBOARD TAB */}
        {activeSubTab === "dashboard" && (
          <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center space-x-4"
              >
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Abituriyentlar</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalUsers}</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center space-x-4"
              >
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Imtihonlar</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalTestsStarted}</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center space-x-4"
              >
                <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Kutilmoqda</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{stats.pendingPurchasesCount}</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center space-x-4"
              >
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Bloklanganlar</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{stats.bannedUsersCount}</p>
                </div>
              </motion.div>
            </div>

            {/* Extended Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase">Do'stlik</p>
                  <Award className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-black text-slate-800">{stats.totalFollowers}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase">Premium</p>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-black text-slate-800">{stats.totalSubscriptions}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase">Faol</p>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-black text-slate-800">{stats.activeSessionsCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. SUMMARY TAB */}
        {activeSubTab === "summary" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Abituriyentlar</span>
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-600">Jami</span>
                  <span className="font-black text-slate-800">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-600">Premium</span>
                  <span className="font-black text-emerald-600">{stats.totalSubscriptions}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-600">Bloklanganlar</span>
                  <span className="font-black text-red-600">{stats.bannedUsersCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span>Imtihonlar</span>
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-600">Boshlangan</span>
                  <span className="font-black text-blue-600">{stats.totalTestsStarted}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-600">Yakunlangan</span>
                  <span className="font-black text-emerald-600">{stats.completedSessionsCount}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-600">Faol</span>
                  <span className="font-black text-amber-600">{stats.activeSessionsCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. USERS TAB */}
        {activeSubTab === "users" && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-4 px-6">Abituriyent</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Ball</th>
                    <th className="py-4 px-6">Holat</th>
                    <th className="py-4 px-6 text-right pr-6">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.slice(0, 20).map((user) => {
                    if (!user || !user.uid) return null;

                    const nickname = user.nickname || "Abituriyent";
                    const email = user.email || "No email";
                    const score = user.score || 0;
                    const subscriptionStatus = user.subscriptionStatus || "none";

                    const isBannedServer = bannedUids.includes(user.uid);
                    const bannedUntilVal = user.bannedUntil;
                    const isBannedLocal = Boolean(
                      bannedUntilVal && (
                        bannedUntilVal === "permanent" ||
                        (typeof bannedUntilVal === "string" && new Date(bannedUntilVal).getTime() > Date.now())
                      )
                    );
                    const isBanned = isBannedServer || isBannedLocal;

                    return (
                      <tr key={user.uid} className="hover:bg-slate-50/50 text-xs font-bold text-slate-700">
                        <td className="py-4 px-6">
                          <span className="text-slate-800 font-extrabold">{nickname}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-500">{email}</td>
                        <td className="py-4 px-6">{score}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-lg text-[10px] border ${
                            subscriptionStatus === "Tastiqlandi"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-slate-50 text-slate-500 border-slate-100"
                          }`}>
                            {subscriptionStatus === "Tastiqlandi" ? "Premium" : "Bepul"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right pr-6 flex gap-2 justify-end">
                          {isBanned ? (
                            <button
                              onClick={() => handleUnbanUser(user.uid)}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-emerald-100"
                            >
                              ✅ Chiqar
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedUserToBan(user)}
                              className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-amber-100"
                            >
                              🚫 Blok
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.uid)}
                            className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-red-100"
                          >
                            🗑️ O'chir
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

        {/* 4. PURCHASES TAB */}
        {activeSubTab === "purchases" && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display font-extrabold text-slate-800 text-lg">Premium Sotib Olishlar</h3>
              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">
                {stats.pendingPurchasesCount} Kutilmoqda
              </span>
            </div>

            {purchasesList.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="font-semibold">Sotib olishlar mavjud emas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-4 px-6">Abituriyent</th>
                      <th className="py-4 px-6">Tarif</th>
                      <th className="py-4 px-6">Summa</th>
                      <th className="py-4 px-6">Chek</th>
                      <th className="py-4 px-6">Sana</th>
                      <th className="py-4 px-6">Holat</th>
                      <th className="py-4 px-6 text-right pr-6">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {purchasesList.map((purchase) => {
                      if (!purchase || !purchase.id) return null;

                      const nickname = purchase.nickname || "Abituriyent";
                      const plan = purchase.plan || "oylik";
                      const price = purchase.price || 0;
                      const status = purchase.status || "Tekshirilyapti";
                      const createdAt = purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString('uz-UZ') : "Noma'lum";

                      return (
                        <tr key={purchase.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6 font-extrabold text-slate-800">{nickname}</td>
                          <td className="py-4 px-6 uppercase text-primary-600 font-extrabold">{plan}</td>
                          <td className="py-4 px-6">{price.toLocaleString('uz-UZ')} UZS</td>
                          <td className="py-4 px-6">
                            {purchase.receiptImage ? (
                              <button
                                onClick={() => setSelectedPurchaseForDetails(purchase)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                👁️ Ko'r
                              </button>
                            ) : (
                              <span className="text-slate-400">Yo'q</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-500">{createdAt}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-lg text-[10px] border font-bold ${
                              status === "Tastiqlandi"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : status === "Tekshirilyapti"
                                ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                                : "bg-red-50 text-red-700 border-red-100"
                            }`}>
                              {status === "Tastiqlandi" ? "✅" : status === "Tekshirilyapti" ? "⏳" : "❌"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right pr-6">
                            {status === "Tekshirilyapti" && (
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => handleApprovePurchase(purchase)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  ✅
                                </button>
                                <button
                                  onClick={() => handleRejectPurchase(purchase)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  ❌
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

        {/* 5. NOTIFICATIONS TAB */}
        {activeSubTab === "help_requests" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs max-w-4xl mx-auto">
              <h3 className="font-display font-extrabold text-slate-800 text-lg mb-4">Yordam So'rovlari</h3>
              <p className="text-slate-500 text-sm mb-6">Foydalanuvchilardan kelgan adminga yordam so'rovlari. Kimdan kelgani, emaili va xabar matni shu yerda ko'rsatiladi.</p>

              {loadingHelpRequests ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : helpRequests.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold">Hozircha yordam so'rovlari yo'q.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {helpRequests.map((req) => (
                    <div key={req.id} className="p-6 hover:bg-slate-50/70 rounded-3xl transition-all border border-slate-100 mb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{req.fromUserName || 'Noma'lum foydalanuvchi'}</p>
                          <p className="text-[11px] text-slate-500">{req.fromUserEmail || 'Email mavjud emas'}</p>
                        </div>
                        <div className="text-right text-[11px] font-semibold text-slate-500">
                          <p>{req.createdAt ? new Date(req.createdAt).toLocaleString('uz-UZ') : 'sana yo‘q'}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black mt-2 ${req.status === 'handled' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {req.status === 'handled' ? 'Ko‘rilgan' : 'Yangi'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-3xl p-4 border border-slate-200 mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Xabar</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{req.message}</p>
                      </div>
                      <button
                        onClick={() => markHelpRequestHandled(req)}
                        className="py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-bold transition-all"
                      >
                        {req.status === 'handled' ? 'Ko‘rilgan deb belgilandi' : 'Ko‘rilgan deb belgilash'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === "notifications" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs max-w-2xl mx-auto">
            <h3 className="font-display font-extrabold text-slate-800 text-lg mb-6">E'lon Yuborish</h3>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Kimga</label>
                <select
                  value={notifTarget}
                  onChange={(e) => setNotifTarget(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm"
                >
                  <option value="all">Hammaga</option>
                  {usersList.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.nickname}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Sarlavha</label>
                <input
                  type="text"
                  required
                  placeholder="E'lon sarlavhasi"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Matn</label>
                <textarea
                  required
                  rows={5}
                  placeholder="E'lon matni"
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={sendingNotif}
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm cursor-pointer transition-all"
              >
                {sendingNotif ? "Yuborilmoqda..." : "📢 Yuborish"}
              </button>
            </form>
          </div>
        )}

        {/* 6. MESSAGES TAB */}
        {activeSubTab === "messages" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setShowMessageModal(true)}
                className="py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer rounded-xl transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Xabar Yuborish</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              {loadingMessages ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : messagesHistory.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <MessageCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold">Xabarlar mavjud emas</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {messagesHistory.map((msg) => (
                    <div key={msg.id} className="p-6 hover:bg-slate-50/50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">👤 {msg.toUserName}</p>
                          <p className="text-xs text-slate-500 mt-1">
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

        {/* 7. QUESTIONS TAB */}
        {activeSubTab === "questions" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
              <h3 className="font-display font-extrabold text-slate-800 text-lg mb-6">Yangi Savol</h3>

              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Savol</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Savol matni"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input type="text" required placeholder="A" value={newQuestion.A} onChange={(e) => setNewQuestion({ ...newQuestion, A: e.target.value })} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs" />
                  <input type="text" required placeholder="B" value={newQuestion.B} onChange={(e) => setNewQuestion({ ...newQuestion, B: e.target.value })} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs" />
                  <input type="text" required placeholder="C" value={newQuestion.C} onChange={(e) => setNewQuestion({ ...newQuestion, C: e.target.value })} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs" />
                  <input type="text" required placeholder="D" value={newQuestion.D} onChange={(e) => setNewQuestion({ ...newQuestion, D: e.target.value })} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <select value={newQuestion.correctAnswer} onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold">
                    <option value="A">A to'g'ri</option>
                    <option value="B">B to'g'ri</option>
                    <option value="C">C to'g'ri</option>
                    <option value="D">D to'g'ri</option>
                  </select>
                  <select value={newQuestion.subject} onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold">
                    <option value="Mathematics">Matematika</option>
                    <option value="Physics">Fizika</option>
                    <option value="History of Uzbekistan">Tarix</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm cursor-pointer">
                  💾 Saqlash
                </button>
              </form>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
              <h4 className="font-extrabold text-blue-900 text-lg mb-4">📋 Savol Formati</h4>
              <div className="space-y-3 text-xs text-blue-800 font-semibold leading-relaxed">
                <p>✓ Savol matni kiriting</p>
                <p>✓ 4 ta javob variant (A, B, C, D)</p>
                <p>✓ To'g'ri javobni tanlang</p>
                <p>✓ Fanni tanlang</p>
                <p>✓ Qiyinlik darajasini belgilang</p>
                <p>✓ "Saqlash" tugmasini bosing</p>
              </div>
            </div>
          </div>
        )}

        {/* 8. IMPORT TAB */}
        {activeSubTab === "import" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
            <h3 className="font-display font-extrabold text-slate-800 text-lg mb-6">JSON Import</h3>

            <div className="space-y-4">
              <textarea
                rows={10}
                value={bulkJsonInput}
                onChange={(e) => setBulkJsonInput(e.target.value)}
                placeholder={`[\n  {\n    "question": "Savol?",\n    "A": "A",\n    "B": "B",\n    "C": "C",\n    "D": "D",\n    "correctAnswer": "A",\n    "subject": "Mathematics"\n  }\n]`}
                className="w-full p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl outline-none"
              />

              {importStatus && (
                <div className={`text-xs font-bold p-3 rounded-xl border ${
                  importStatus.includes('✅')
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                    : 'text-red-700 bg-red-50 border-red-100'
                }`}>
                  {importStatus}
                </div>
              )}

              <button
                onClick={handleImportJson}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm cursor-pointer flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>📥 Import qilish</span>
              </button>
            </div>
          </div>
        )}

        {/* BAN USER MODAL */}
        {selectedUserToBan && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl"
            >
              <h3 className="font-display font-extrabold text-slate-900 text-lg mb-4">🚫 Bloklash</h3>

              <form onSubmit={handleBanUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Muddati</label>
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm"
                  >
                    <option value="1_hour">1 Soat</option>
                    <option value="1_day">1 Kun</option>
                    <option value="7_days">7 Kun</option>
                    <option value="permanent">Umrbod</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Sababi</label>
                  <textarea
                    rows={3}
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedUserToBan(null)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50"
                  >
                    Bekor
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    🚫 Bloklash
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* RECEIPT PREVIEW MODAL */}
        {selectedPurchaseForDetails && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-50">
            <div className="max-w-2xl w-full flex justify-end mb-2">
              <button
                onClick={() => setSelectedPurchaseForDetails(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <p className="font-bold text-slate-800 text-sm">👤 {selectedPurchaseForDetails.nickname}</p>
                <p className="font-bold text-slate-800 text-sm">💳 {selectedPurchaseForDetails.plan.toUpperCase()}</p>
                <p className="font-bold text-slate-800 text-sm">💰 {selectedPurchaseForDetails.price?.toLocaleString('uz-UZ')} UZS</p>
              </div>
              {selectedPurchaseForDetails.receiptImage ? (
                <img
                  src={selectedPurchaseForDetails.receiptImage}
                  alt="Receipt"
                  className="w-full max-h-[70vh] object-contain rounded-2xl border border-slate-200"
                />
              ) : (
                <p className="text-center text-slate-400 py-8">Chek rasmi mavjud emas</p>
              )}
            </motion.div>
          </div>
        )}

        {/* MESSAGE MODAL */}
        {showMessageModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-extrabold text-slate-900 text-lg">💬 Xabar Yuborish</h3>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSendDirectMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Foydalanuvchi</label>
                  <select
                    required
                    value={selectedAdminUser?.uid || ""}
                    onChange={(e) => {
                      const uid = e.target.value;
                      const user = usersList.find(u => u.uid === uid);
                      setSelectedAdminUser(user || null);
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm"
                  >
                    <option value="">-- Tanlang --</option>
                    {usersList.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.nickname}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Sarlavha</label>
                  <input
                    type="text"
                    required
                    placeholder="Sarlavha"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Matn</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Xabar matni"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50"
                  >
                    Bekor
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMessage}
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    {sendingMessage ? "Yuborilmoqda..." : "📤 Yuborish"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </motion.div>
    </div>
  );
}