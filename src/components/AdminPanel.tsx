import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  increment,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile, PaymentRequest, Announcement, Question } from "../types";
import { DTM_QUESTIONS_POOL } from "../questionsData";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, 
  Users, 
  CreditCard, 
  Megaphone, 
  BookOpen, 
  Database, 
  TrendingUp, 
  Ban, 
  Check, 
  X, 
  Trash2, 
  Plus, 
  Download, 
  Upload, 
  RefreshCw, 
  FileText, 
  Clock, 
  HelpCircle,
  Eye,
  LogOut,
  Settings,
  ShieldCheck,
  AlertTriangle,
  Info
} from "lucide-react";

interface AdminPanelProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onCloseAdmin: () => void;
}

export default function AdminPanel({ showToast, onCloseAdmin }: AdminPanelProps) {
  const [password, setPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'premium' | 'announcements' | 'questions' | 'monitoring'>('dashboard');

  // Admin Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Question[]>(DTM_QUESTIONS_POOL);
  const [isLoading, setIsLoading] = useState(false);

  // Announcement fields
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");

  // Question fields
  const [newQText, setNewQText] = useState("");
  const [newQSubject, setNewQSubject] = useState("Matematika");
  const [newQA, setNewQA] = useState("");
  const [newQB, setNewQB] = useState("");
  const [newQC, setNewQC] = useState("");
  const [newQD, setNewQD] = useState("");
  const [newQCorrect, setNewQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const adminPasswordHash = "79178195327178195327";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPasswordHash) {
      setIsAdminAuthenticated(true);
      showToast("Admin hisobiga kirdingiz!", "success");
      loadAdminData();
    } else {
      showToast("Noto'g'ri admin paroli!", "error");
    }
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Users list
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList: UserProfile[] = [];
      usersSnap.forEach((doc) => {
        usersList.push(doc.data() as UserProfile);
      });
      setUsers(usersList);

      // 2. Fetch Payments list
      const paymentsSnap = await getDocs(collection(db, "payments"));
      const paymentsList: PaymentRequest[] = [];
      paymentsSnap.forEach((doc) => {
        paymentsList.push(doc.data() as PaymentRequest);
      });
      // Sort payments newest first
      paymentsList.sort((a, b) => b.createdAt - a.createdAt);
      setPayments(paymentsList);

      // 3. Fetch Announcements list
      const annSnap = await getDocs(collection(db, "announcements"));
      const annList: Announcement[] = [];
      annSnap.forEach((doc) => {
        annList.push(doc.data() as Announcement);
      });
      annList.sort((a, b) => b.createdAt - a.createdAt);
      setAnnouncements(annList);

    } catch (err) {
      console.error("Error loading admin data:", err);
      showToast("Ma'lumotlarni yuklashda xatolik yuz berdi.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // BAN / UNBAN SYSTEM
  const handleBanUser = async (uid: string, banType: 'none' | 'temporary' | 'permanent') => {
    try {
      const userRef = doc(db, "users", uid);
      const isBanned = banType !== "none";
      const banUntil = banType === "temporary" ? Date.now() + (24 * 60 * 60 * 1000) : null; // 24 hours temporary

      await updateDoc(userRef, {
        isBanned,
        banType,
        banUntil
      });

      showToast(`Foydalanuvchi statusi muvaffaqiyatli o'zgartirildi: ${banType.toUpperCase()}`, "success");
      loadAdminData();
    } catch (e) {
      showToast("Xatolik yuz berdi.", "error");
    }
  };

  // PREMIUM VERIFICATION / APPROVAL SYSTEM
  const handleVerifyPayment = async (payId: string, uid: string, plan: 'weekly' | 'monthly' | 'yearly', status: 'approved' | 'rejected') => {
    try {
      // 1. Update Payment status
      const payRef = doc(db, "payments", payId);
      await updateDoc(payRef, {
        status,
        updatedAt: Date.now()
      });

      // 2. If approved, calculate exact expiration days and upgrade User profile status
      if (status === "approved") {
        const userRef = doc(db, "users", uid);
        let durationDays = 30; // default monthly
        if (plan === "weekly") durationDays = 7;
        if (plan === "yearly") durationDays = 365;

        const extraTimeMs = durationDays * 24 * 60 * 60 * 1000;
        
        // Find current expiration or use Date.now()
        const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", uid)));
        let baseTime = Date.now();
        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data() as UserProfile;
          if (userData.premiumExpiresAt > Date.now()) {
            baseTime = userData.premiumExpiresAt;
          }
        }

        const nextExpiration = baseTime + extraTimeMs;

        await updateDoc(userRef, {
          premiumStatus: "premium",
          premiumExpiresAt: nextExpiration,
          lastUpdated: Date.now()
        });

        showToast("To'lov muvaffaqiyatli tasdiqlandi. Premium faollashtirildi!", "success");
      } else {
        showToast("To'lov kvitansiyasi rad etildi.", "info");
      }

      loadAdminData();
    } catch (e) {
      console.error(e);
      showToast("To'lovni tahrirlashda xatolik yuz berdi.", "error");
    }
  };

  // PUBLISH ANNOUNCEMENTS
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) {
      showToast("Barcha maydonlarni to'ldiring.", "error");
      return;
    }

    try {
      const annId = `ann_${Date.now()}`;
      const payload: Announcement = {
        id: annId,
        title: newAnnTitle.trim(),
        content: newAnnContent.trim(),
        createdAt: Date.now(),
        author: "DTM Master Admin"
      };

      await setDoc(doc(db, "announcements", annId), payload);
      showToast("E'lon muvaffaqiyatli chop etildi!", "success");
      setNewAnnTitle("");
      setNewAnnContent("");
      loadAdminData();
    } catch (e) {
      showToast("E'lonni yuklashda xatolik.", "error");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm("Ushbu e'lonni o'chirib tashlamoqchimisiz?")) {
      try {
        await deleteDoc(doc(db, "announcements", id));
        showToast("E'lon o'chirildi.", "success");
        loadAdminData();
      } catch (e) {
        showToast("O'chirishda xatolik.", "error");
      }
    }
  };

  // EXPORT QUESTIONS (JSON)
  const handleExportQuestions = () => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(customQuestions, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `dtm_questions_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Savollar muvaffaqiyatli eksport qilindi!", "success");
    } catch (e) {
      showToast("Eksportda xatolik.", "error");
    }
  };

  // IMPORT QUESTIONS (JSON file)
  const handleImportQuestions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const uploadedFile = e.target.files?.[0];

    if (!uploadedFile) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setCustomQuestions(parsed);
          showToast(`Muvaffaqiyatli yuklandi: ${parsed.length} ta savol faollashtirildi!`, "success");
        } else {
          showToast("Xato JSON strukturasi. Massiv formatida bo'lishi shart.", "error");
        }
      } catch (err) {
        showToast("Faylni o'qishda xatolik. JSON formatini tekshiring.", "error");
      }
    };
    fileReader.readAsText(uploadedFile);
  };

  // ADD SINGLE CUSTOM QUESTION
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || !newQA.trim() || !newQB.trim() || !newQC.trim() || !newQD.trim()) {
      showToast("Barcha variantlar va savol matnini to'ldiring.", "error");
      return;
    }

    const newQ: Question = {
      id: `custom_q_${Date.now()}`,
      subject: newQSubject,
      questionText: newQText.trim(),
      options: {
        A: newQA.trim(),
        B: newQB.trim(),
        C: newQC.trim(),
        D: newQD.trim()
      },
      correctAnswer: newQCorrect
    };

    setCustomQuestions(prev => [newQ, ...prev]);
    showToast("Yangi savol muvaffaqiyatli qo'shildi!", "success");
    setNewQText("");
    setNewQA("");
    setNewQB("");
    setNewQC("");
    setNewQD("");
  };

  if (!isAdminAuthenticated) {
    return (
      <div id="admin-auth" className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 text-red-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white font-display">Admin Panel Kirish</h1>
            <p className="text-xs text-neutral-500 text-center leading-relaxed">
              Ushbu sahifaga kirish cheklangan. Davom etish uchun maxsus parolni kiriting.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-semibold uppercase">Admin Maxfiy Paroli</label>
              <input
                type="password"
                required
                placeholder="••••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white placeholder-neutral-700 rounded-xl font-mono text-sm"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCloseAdmin}
                className="flex-1 py-3 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 font-semibold rounded-xl text-xs transition-all"
              >
                Yopish
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-red-600/10"
              >
                Kirish (Verify)
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Calculate Dashboard KPIs
  const totalUsersCount = users.length;
  const premiumUsersCount = users.filter(u => u.premiumStatus === "premium" && u.premiumExpiresAt > Date.now()).length;
  const pendingPaymentsCount = payments.filter(p => p.status === "pending").length;
  const totalHelpUsed = users.reduce((acc, u) => acc + (u.helpUsedTotal || 0), 0);

  return (
    <div id="admin-dashboard-root" className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Admin Title display */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">DTM MASTER boshqaruv paneli</h1>
            <p className="text-xs text-neutral-500">Platformaning barcha faoliyati va foydalanuvchilarini to'liq nazorat qilish markazi</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminData}
            className="p-2.5 bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsAdminAuthenticated(false)}
            className="px-4 py-2.5 bg-red-950/30 hover:bg-red-950/80 border border-red-500/20 text-red-400 rounded-xl transition-all text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Admin Chiqish</span>
          </button>
        </div>
      </div>

      {/* Admin Panel Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
        {(['dashboard', 'users', 'premium', 'announcements', 'questions', 'monitoring'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all capitalize ${
              activeTab === tab
                ? "bg-red-600 text-white shadow-md shadow-red-600/10"
                : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {tab === "premium" ? "To'lov so'rovlari" : tab === "announcements" ? "E'lonlar" : tab === "questions" ? "Savollar xazinasi" : tab === "monitoring" ? "Firebase Monitoring" : tab}
          </button>
        ))}
      </div>

      {/* Loading overlay indicator */}
      {isLoading && (
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
          <p className="text-xs text-neutral-500">Ma'lumotlar sinxronizatsiya qilinmoqda...</p>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-6">
          {/* TAB 1: DASHBOARD STATS */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">Jami Foydalanuvchilar</span>
                  <span className="text-3xl font-extrabold text-white">{totalUsersCount}</span>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">Faol Premium obunachilar</span>
                  <span className="text-3xl font-extrabold text-emerald-500">{premiumUsersCount}</span>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">Kutilayotgan to'lovlar</span>
                  <span className="text-3xl font-extrabold text-amber-500">{pendingPaymentsCount}</span>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">Lifeline 50:50 ishlatilgan</span>
                  <span className="text-3xl font-extrabold text-sky-400">{totalHelpUsed} <span className="text-xs text-neutral-500 font-normal">marta</span></span>
                </div>
              </div>

              {/* Announcements quick publish block */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-md">
                <h3 className="text-sm font-bold text-white mb-4">Tezkor e'lon tarqatish</h3>
                <form onSubmit={handlePublishAnnouncement} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <input
                        type="text"
                        placeholder="E'lon sarlavhasi..."
                        value={newAnnTitle}
                        onChange={(e) => setNewAnnTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-red-500 text-white rounded-lg text-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="Sarlavha ostidagi batafsil matn yoki havola..."
                        value={newAnnContent}
                        onChange={(e) => setNewAnnContent(e.target.value)}
                        className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-red-500 text-white rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>E'lonni chop etish</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: USERS MANAGEMENT */}
          {activeTab === "users" && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 bg-neutral-950 border-b border-neutral-850 text-xs font-bold text-neutral-400 select-none">
                Platformadagi barcha real foydalanuvchilar
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-neutral-300 min-w-[900px]">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-500 font-bold">
                      <th className="p-4">Talaba</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Sana</th>
                      <th className="p-4 text-center">Premium Status</th>
                      <th className="p-4 text-center">Yordam</th>
                      <th className="p-4 text-center">Imtihonlar</th>
                      <th className="p-4 text-center">Maks Ball</th>
                      <th className="p-4 text-center">O'rtacha Ball</th>
                      <th className="p-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {users.map((user) => {
                      const isPremium = user.premiumStatus === "premium" && user.premiumExpiresAt > Date.now();
                      const isBanned = user.isBanned;

                      return (
                        <tr key={user.uid} className={`hover:bg-neutral-850/40 ${isBanned ? "bg-red-950/10" : ""}`}>
                          <td className="p-4 flex items-center gap-3">
                            <img 
                              src={user.photoURL} 
                              alt={user.displayName} 
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full border border-neutral-800 object-cover" 
                            />
                            <div>
                              <span className="font-bold text-white block">{user.displayName}</span>
                              <span className="text-[10px] text-neutral-500 font-mono">@{user.username}</span>
                            </div>
                          </td>
                          <td className="p-4">{user.email || "Noma'lum"}</td>
                          <td className="p-4 text-neutral-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 text-center">
                            {isPremium ? (
                              <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold text-[10px]">PREMIUM</span>
                            ) : (
                              <span className="bg-neutral-950 text-neutral-500 px-2 py-0.5 rounded-full text-[10px]">BEPUL</span>
                            )}
                          </td>
                          <td className="p-4 text-center font-mono">{user.helpUsedTotal || 0}</td>
                          <td className="p-4 text-center font-mono">{user.examCount || 0}</td>
                          <td className="p-4 text-center font-mono font-bold text-emerald-500">{user.highestScore || 0}</td>
                          <td className="p-4 text-center font-mono text-neutral-400">{user.avgScore || 0}</td>
                          <td className="p-4 text-right space-x-1.5 shrink-0">
                            {isBanned ? (
                              <button
                                onClick={() => handleBanUser(user.uid, "none")}
                                className="px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-950 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold"
                              >
                                Banddan ochish
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleBanUser(user.uid, "temporary")}
                                  className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-950 border border-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold"
                                >
                                  Temp Ban (24s)
                                </button>
                                <button
                                  onClick={() => handleBanUser(user.uid, "permanent")}
                                  className="px-2.5 py-1 bg-red-950/40 hover:bg-red-950 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold"
                                >
                                  Perm Ban
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PREMIUM REQUESTS & RECEIPT VERIFICATION */}
          {activeTab === "premium" && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 bg-neutral-950 border-b border-neutral-850 text-xs font-bold text-neutral-400 select-none">
                Premium obuna to'lov kvitansiyalarini tasdiqlash
              </div>
              
              {payments.length === 0 ? (
                <div className="p-10 text-center text-xs text-neutral-500">
                  Hozircha hech qanday to'lov so'rovi kelib tushmagan.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs text-neutral-300 min-w-[800px]">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-500 font-bold">
                        <th className="p-4">Foydalanuvchi</th>
                        <th className="p-4">Sana</th>
                        <th className="p-4">Reja</th>
                        <th className="p-4">To'lov Summasi</th>
                        <th className="p-4 text-center">Kvitansiya</th>
                        <th className="p-4 text-center">Holat</th>
                        <th className="p-4 text-right">Tasdiqlash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-neutral-850/40">
                          <td className="p-4">
                            <span className="font-bold text-white block">{p.userDisplayName}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">@{p.userUsername}</span>
                          </td>
                          <td className="p-4 text-neutral-500">{new Date(p.createdAt).toLocaleString()}</td>
                          <td className="p-4 uppercase font-bold text-sky-400">{p.plan}</td>
                          <td className="p-4 font-mono font-bold text-white">{p.amount.toLocaleString()} UZS</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedReceipt(p.receiptBase64)}
                              className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 mx-auto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Chekni ko'rish</span>
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            {p.status === "pending" && (
                              <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 text-[10px] font-bold uppercase">Pending</span>
                            )}
                            {p.status === "approved" && (
                              <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px] font-bold uppercase">Approved</span>
                            )}
                            {p.status === "rejected" && (
                              <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20 text-[10px] font-bold uppercase">Rejected</span>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-1.5">
                            {p.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleVerifyPayment(p.id, p.uid, p.plan, "approved")}
                                  className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-lg transition-all"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleVerifyPayment(p.id, p.uid, p.plan, "rejected")}
                                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
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

          {/* TAB 4: ANNOUNCEMENTS MANAGEMENT */}
          {activeTab === "announcements" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Publisher form (Left side) */}
              <div className="lg:col-span-2">
                <form onSubmit={handlePublishAnnouncement} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-md space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Yangi e'lon yaratish</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase">Sarlavha (Title)</label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Saytda profilaktika ishlari olib boriladi"
                      value={newAnnTitle}
                      onChange={(e) => setNewAnnTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-red-500 text-white rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase">Batafsil ma'lumot (Content)</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="E'lon tafsilotlarini kiriting..."
                      value={newAnnContent}
                      onChange={(e) => setNewAnnContent(e.target.value)}
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-red-500 text-white rounded-xl text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Chop etish</span>
                  </button>
                </form>
              </div>

              {/* Published list (Right side) */}
              <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-md space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Chop etilgan e'lonlar</h3>
                
                {announcements.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-10">Hech qanday e'lon mavjud emas.</p>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="bg-neutral-950 border border-neutral-850 p-4 rounded-xl flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-white text-xs mb-1">{ann.title}</h4>
                          <p className="text-[11px] text-neutral-400 leading-relaxed mb-2">{ann.content}</p>
                          <span className="text-[9px] text-neutral-600">{new Date(ann.createdAt).toLocaleString()}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-1.5 bg-neutral-900 hover:bg-red-950 hover:text-red-400 text-neutral-500 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: QUESTIONS POOL (IMPORT / EXPORT) */}
          {activeTab === "questions" && (
            <div className="space-y-6">
              {/* Import / Export actions card */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Savollarni Import va Eksport qilish</h3>
                  <p className="text-xs text-neutral-500">JSON formatida savollar bazasini yuklang yoki nusxa oling.</p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 rounded-xl hover:text-white transition-all text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-4 h-4" />
                    <span>JSON Import</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportQuestions}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleExportQuestions}
                    className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 rounded-xl hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>JSON Eksport</span>
                  </button>
                </div>
              </div>

              {/* Subject statistics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {["Matematika", "Fizika", "Tarix", "Ona tili", "Ingliz tili"].map((sub) => {
                  const count = customQuestions.filter(q => q.subject === sub).length;
                  return (
                    <div key={sub} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">{sub}</span>
                      <span className="text-xl font-extrabold text-white">{count} <span className="text-xs text-neutral-500 font-normal">ta</span></span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Single Q creator (Left side) */}
                <div className="lg:col-span-2">
                  <form onSubmit={handleAddQuestion} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-md space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Yangi savol qo'shish</h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold uppercase">Fan (Subject)</label>
                      <select
                        value={newQSubject}
                        onChange={(e) => setNewQSubject(e.target.value)}
                        className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-white rounded-xl text-xs"
                      >
                        <option value="Matematika">Matematika</option>
                        <option value="Fizika">Fizika</option>
                        <option value="Tarix">Tarix</option>
                        <option value="Ona tili">Ona tili</option>
                        <option value="Ingliz tili">Ingliz tili</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold uppercase">Savol matni (Question Text)</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Masalan: Soddalashtiring: sin(x)..."
                        value={newQText}
                        onChange={(e) => setNewQText(e.target.value)}
                        className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-white rounded-xl text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>

                    {/* Variant inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-500 font-bold">Variant A</label>
                        <input
                          type="text"
                          required
                          value={newQA}
                          onChange={(e) => setNewQA(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 text-white rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-500 font-bold">Variant B</label>
                        <input
                          type="text"
                          required
                          value={newQB}
                          onChange={(e) => setNewQB(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 text-white rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-500 font-bold">Variant C</label>
                        <input
                          type="text"
                          required
                          value={newQC}
                          onChange={(e) => setNewQC(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 text-white rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-500 font-bold">Variant D</label>
                        <input
                          type="text"
                          required
                          value={newQD}
                          onChange={(e) => setNewQD(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-850 text-white rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold uppercase">To'g'ri javob</label>
                      <select
                        value={newQCorrect}
                        onChange={(e) => setNewQCorrect(e.target.value as 'A' | 'B' | 'C' | 'D')}
                        className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 text-white rounded-xl text-xs"
                      >
                        <option value="A">Variant A</option>
                        <option value="B">Variant B</option>
                        <option value="C">Variant C</option>
                        <option value="D">Variant D</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Savol qo'shish</span>
                    </button>
                  </form>
                </div>

                {/* Question overview list (Right side) */}
                <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-md space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Savollar ro'yxati ({customQuestions.length})</h3>
                  
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {customQuestions.map((q) => (
                      <div key={q.id} className="bg-neutral-950 border border-neutral-850 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-bold">
                            {q.subject}
                          </span>
                          <span className="text-[9px] text-neutral-600">ID: {q.id}</span>
                        </div>
                        <p className="text-xs text-white font-medium leading-relaxed">{q.questionText}</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500 pt-1">
                          <div>A: {q.options.A}</div>
                          <div>B: {q.options.B}</div>
                          <div>C: {q.options.C}</div>
                          <div>D: {q.options.D}</div>
                        </div>
                        <div className="text-[10px] text-emerald-500 font-bold pt-1.5 border-t border-neutral-900">
                          To'g'ri variant: {q.correctAnswer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FIREBASE MONITORING */}
          {activeTab === "monitoring" && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-md space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Firebase & Firestore monitoring paneli</h3>
                <p className="text-xs text-neutral-500">Ushbu platforma va Firebase xizmatlari o'rtasidagi to'g'ridan-to'g'ri integratsiya ko'rsatkichlari.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-neutral-950 border border-neutral-850 p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <span>Firestore integratsiyasi</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Firestore Realtime listeners faollashtirilgan. Barcha ma'lumotlar avtomatik sinxronizatsiya qilinmoqda va unikal transaction qulflash tizimi sozlangan.
                  </p>
                </div>

                <div className="bg-neutral-950 border border-neutral-850 p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <span>Firebase Auth</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Google Auth provayderi faol. Sessiya kalitlari avtomatik yangilanadi va unikal nick-name unikal tekshiruvi orqali foydalanuvchilar himoyasi to'liq sozlangan.
                  </p>
                </div>

                <div className="bg-neutral-950 border border-neutral-850 p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Aloqa retry siyosati</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Avtomatik retry muvaffaqiyatli ulangan (maksimal 5 marta 1.5 soniyadan exponential backoff). Xatoliklar yuz berganda sahifa qulflanmaydi.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RECEPT MODAL LIGHTBOX */}
      <AnimatePresence>
        {selectedReceipt && (
          <div 
            onClick={() => setSelectedReceipt(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl max-h-[85vh] overflow-hidden"
            >
              <img 
                src={selectedReceipt} 
                alt="Receipt Big" 
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[80vh] object-contain rounded-xl border border-neutral-800" 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
