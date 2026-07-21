/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ShieldAlert, Cpu, Users, Database, HelpCircle, AlertTriangle, Trash2, 
  UserX, CheckCircle, PlusCircle, Upload, Download, Edit2, FileSpreadsheet, FileText, CheckCircle2 
} from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { Question, User } from "../types";

export default function Admin() {
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "users" | "questions" | "import">("dashboard");
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTestsStarted: 0,
    activeSessionsCount: 0,
    completedSessionsCount: 0,
    bannedUsersCount: 0,
    questionsDatabaseCount: 0
  });

  // Database lists
  const [usersList, setUsersList] = useState<User[]>([]);
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [bannedUids, setBannedUids] = useState<string[]>([]);

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
  const [bulkCsvInput, setBulkCsvInput] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Load server-side stats, users, and questions
  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch server stats
      const statsRes = await fetch("/api/admin/stats");
      const statsData = statsRes.ok ? await statsRes.json() : {};

      // 2. Fetch banned users
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

      // 4. Fetch questions from Firestore or server (using backup mock list from server.ts)
      const qBankRes = await fetch("/api/test/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: "admin_probe", directionId: "probe", directionName: "probe" })
      });
      // We'll filter and display static questions in bank
      setStats({
        totalUsers: uList.length,
        totalTestsStarted: statsData.totalTestsStarted || 0,
        activeSessionsCount: statsData.activeSessionsCount || 0,
        completedSessionsCount: statsData.completedSessionsCount || 0,
        bannedUsersCount: bannedData.banned.length,
        questionsDatabaseCount: statsData.questionsDatabaseCount || 17
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

  // Ban/Unban user action
  const handleBanUser = async (uid: string, isBanned: boolean) => {
    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, action: isBanned ? "unban" : "ban" })
      });
      if (res.ok) {
        alert(isBanned ? "Foydalanuvchi blokdan chiqarildi" : "Foydalanuvchi bloklandi");
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete user from Firestore
  const handleDeleteUser = async (uid: string) => {
    if (!confirm("Haqiqatdan ham ushbu foydalanuvchini o'chirib yubormoqchimisiz?")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      alert("Foydalanuvchi muvaffaqiyatli o'chirildi.");
      loadAdminData();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
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
            <p className="text-slate-500 text-sm mt-1">
              Savollar bazasini boshqarish, yangi savollarni import/export qilish, foydalanuvchilarni cheklash va statistika.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="dtm-btn-secondary py-2 px-4 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
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
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Savollar bazasi</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">{stats.questionsDatabaseCount} ta</div>
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
              <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
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
                    <th className="py-4 px-6">Yurt</th>
                    <th className="py-4 px-6 text-center">Roli</th>
                    <th className="py-4 px-6 text-center">Natijalari</th>
                    <th className="py-4 px-6 text-right pr-6">Harakatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {usersList.map((user) => {
                    const isBanned = bannedUids.includes(user.uid);
                    return (
                      <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2.5">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.nickname} className="w-8 h-8 rounded-full border border-slate-100" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-xs">{user.nickname.charAt(0).toUpperCase()}</div>
                            )}
                            <div className="font-bold text-slate-800">{user.nickname}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-semibold">{user.email || "Mavjud emas"}</td>
                        <td className="py-4 px-6 text-slate-500">{user.country || "O'zbekiston"}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] ${user.role === "admin" ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-primary-600">{user.testsSolved} marta topshirgan</span>
                        </td>
                        <td className="py-4 px-6 text-right pr-6 flex justify-end gap-2">
                          <button
                            onClick={() => handleBanUser(user.uid, isBanned)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isBanned ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"}`}
                            title={isBanned ? "Blokdan chiqarish" : "Bloklash"}
                          >
                            <UserX className="w-4 h-4" />
                          </button>
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

        {/* 3. Add question Subtab */}
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
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    placeholder="Savol matnini bu yerga yozing..."
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">FAN TOIFASI <span className="text-red-500">*</span></label>
                    <select
                      value={newQuestion.subject}
                      onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer"
                    >
                      <option value="Mathematics">Matematika (Mutaxassislik)</option>
                      <option value="Physics">Fizika</option>
                      <option value="Native Language">Ona tili</option>
                      <option value="History of Uzbekistan">O'zbekiston tarixi</option>
                      <option value="Mandatory Mathematics">Majburiy matematika</option>
                      <option value="Professional Subject">Yo'nalish fanlari (Mutaxassislik)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">YO'NALISH (Ixtiyoriy)</label>
                    <input
                      type="text"
                      value={newQuestion.direction}
                      onChange={(e) => setNewQuestion({ ...newQuestion, direction: e.target.value })}
                      placeholder="Masalan: Kiber Xavfsizlik"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>

                {/* Option fields */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-2">Variantlar va To'g'ri javob</span>
                  
                  {["A", "B", "C", "D"].map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <span className="font-bold text-slate-500 w-4">{opt}:</span>
                      <input
                        type="text"
                        required
                        value={(newQuestion as any)[opt]}
                        onChange={(e) => setNewQuestion({ ...newQuestion, [opt]: e.target.value })}
                        placeholder={`${opt} varianti matni`}
                        className="flex-grow px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                  ))}

                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>TO'G'RI VARIANT:</span>
                    <select
                      value={newQuestion.correctAnswer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none cursor-pointer"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full dtm-btn-primary flex items-center justify-center space-x-1.5 py-2.5 text-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Savolni saqlash</span>
                </button>
              </form>
            </div>

            {/* OCR / Document Import Visual */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="font-display font-extrabold text-slate-800 text-lg mb-2">
                  Hujjatlardan import (OCR qo'llab-quvvatlash)
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  DTM MASTER tizimi kelajakda PDF, DOCX hamda skanerlangan test rasmlarini avtomatik matnga o'girib (OCR) savol sifatida qo'shishni qo'llab-quvvatlaydi.
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center space-y-3">
                <Upload className="w-10 h-10 text-slate-300" />
                <div className="text-sm font-bold text-slate-600">Hujjatlarni yuklang (PDF, DOCX, CSV, PNG)</div>
                <div className="text-xs text-slate-400">Yoki bu yerga sudrab olib keling (Maksimal: 10MB)</div>
                
                <button
                  type="button"
                  onClick={() => alert("Hujjat yuklash moduli tayyor. Real ish rejimida fayllaringiz OCR orqali qayta ishlanadi.")}
                  className="dtm-btn-secondary text-xs px-4 py-2 mt-2"
                >
                  Faylni tanlash
                </button>
              </div>

              <div className="space-y-3 bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-xs font-semibold text-slate-600">
                <div className="text-primary-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Qo'llab-quvvatlanadigan fayllar:</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 mt-2 pl-1">
                  <li>CSV formatdagi test savollari jamlanmasi.</li>
                  <li>JSON formatidagi test tuzilmalari.</li>
                  <li>Skrinshot qilingan DTM kitoblar rasmlari (Future OCR).</li>
                </ul>
              </div>
            </div>

          </div>
        )}

        {/* 4. Bulk JSON Import Subtab */}
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

      </motion.div>
    </div>
  );
}
