import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, PaymentPurchase, AdminNotification, Question } from '../types';
import { QUESTION_BANK } from '../data/questionBank';
import { DIRECTIONS_LIST } from '../data/directions';
import { db, collection, getDocs, doc, updateDoc, setDoc, deleteDoc, onSnapshot } from '../firebase';
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  Bell, 
  BookOpen, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  Upload, 
  FileText,
  Search,
  Eye,
  LogOut,
  AlertTriangle,
  Crown
} from 'lucide-react';
import { motion } from 'motion/react';

export const AdminPage: React.FC = () => {
  const { adminLogin, isAdminAuthenticated, adminLogout } = useAuth();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'purchases' | 'notifications' | 'questions'>('users');

  // Admin Data State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [purchases, setPurchases] = useState<PaymentPurchase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSuccess, setNoteSuccess] = useState('');

  // Questions management state
  const [questionsList, setQuestionsList] = useState<Question[]>(QUESTION_BANK);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOption, setCorrectOption] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('mathematics');

  // Handle Admin Auth
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(password.trim())) {
      setLoginError('');
      setPassword('');
    } else {
      setLoginError("Noto'g'ri admin paroli!");
    }
  };

  // Fetch Users & Purchases Realtime
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    // Load Users
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach(d => list.push(d.data() as UserProfile));
      setUsers(list);
    });

    // Load Purchases
    const purchasesUnsub = onSnapshot(collection(db, 'purchases'), (snapshot) => {
      const list: PaymentPurchase[] = [];
      snapshot.forEach(d => list.push(d.data() as PaymentPurchase));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setPurchases(list);
    });

    return () => {
      usersUnsub();
      purchasesUnsub();
    };
  }, [isAdminAuthenticated]);

  // Ban / Unban User
  const handleToggleBanUser = async (user: UserProfile) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const newBanState = !user.isBanned;
      await updateDoc(userRef, {
        isBanned: newBanState,
        banReason: newBanState ? "Admin tomonidan bloklandi" : null,
        banUntil: newBanState ? Date.now() + (30 * 86400000) : null // 30 days ban
      });
    } catch (err) {
      console.error("Ban error:", err);
    }
  };

  // Approve Purchase / Grant Premium
  const handleApprovePurchase = async (purchase: PaymentPurchase) => {
    try {
      // 1. Update purchase status
      await updateDoc(doc(db, 'purchases', purchase.id), {
        status: 'approved',
        reviewedAt: Date.now()
      });

      // 2. Grant Premium to User
      const userRef = doc(db, 'users', purchase.userId);
      let durationDays = 30;
      if (purchase.planType === 'weekly') durationDays = 7;
      if (purchase.planType === 'yearly') durationDays = 365;

      const premiumUntil = Date.now() + (durationDays * 86400000);

      await updateDoc(userRef, {
        isPremium: true,
        premiumUntil
      });
    } catch (err) {
      console.error("Approve purchase error:", err);
    }
  };

  // Reject Purchase
  const handleRejectPurchase = async (purchase: PaymentPurchase) => {
    try {
      await updateDoc(doc(db, 'purchases', purchase.id), {
        status: 'rejected',
        reviewedAt: Date.now()
      });
    } catch (err) {
      console.error("Reject purchase error:", err);
    }
  };

  // Publish Admin Notification
  const handlePublishNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    try {
      const noteId = `note_${Date.now()}`;
      const newNote: AdminNotification = {
        id: noteId,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        createdAt: Date.now(),
        author: "DTM MASTER Bosh Ma'muriyat"
      };

      await setDoc(doc(db, 'notifications', noteId), newNote);
      setNoteSuccess("Habarnoma muvaffaqiyatli chop etildi!");
      setNoteTitle('');
      setNoteContent('');
      setTimeout(() => setNoteSuccess(''), 4000);
    } catch (err) {
      console.error("Publish notification error:", err);
    }
  };

  // Add Question to local bank
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim() || !correctOption) return;

    const newQ: Question = {
      id: `custom_q_${Date.now()}`,
      question: newQuestionText.trim(),
      options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()],
      correctAnswer: correctOption.trim(),
      subject: selectedSubject,
      difficulty: 'medium'
    };

    setQuestionsList([newQ, ...questionsList]);
    setNewQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectOption('');
  };

  // If Admin not logged in -> Password Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">Admin Panelga Kirish</h2>
          <p className="text-xs text-slate-500">Iltimos, maxfiy admin parolini kiriting.</p>
        </div>

        <form onSubmit={handleAdminAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Admin Paroli
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-mono"
              required
            />
          </div>

          {loginError && (
            <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-100">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer text-sm"
          >
            Kirish
          </button>
        </form>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">DTM MASTER Admin Boshqaruvi</h2>
            <p className="text-xs text-slate-400">Barcha foydalanuvchilar, to'lovlar va kontent nazorati</p>
          </div>
        </div>

        <button
          onClick={adminLogout}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Admin Chiqish</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Foydalanuvchilar ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer relative ${
            activeTab === 'purchases' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>SOTIP OLGANLAR ({purchases.filter(p => p.status === 'pending').length} kutmoqda)</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'notifications' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Habarnoma Yuborish</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'questions' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Savollar Bazasi</span>
        </button>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Foydalanuvchini qidiring..." 
                className="w-full text-xs bg-transparent focus:outline-none text-slate-800"
              />
            </div>
            <span className="text-xs text-slate-400 font-semibold">Jami: {filteredUsers.length} ta</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-4 px-6">Foydalanuvchi</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-center">Testlar</th>
                    <th className="py-4 px-6 text-center">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img 
                            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname}`} 
                            alt="Avatar" 
                            className="w-9 h-9 rounded-full border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{user.nickname}</div>
                            <div className="text-[10px] text-slate-400 font-normal">ID: {user.uid.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600">{user.email}</td>

                      <td className="py-4 px-6 text-center">
                        {user.isBanned ? (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs font-bold">
                            BLOKLANGAN
                          </span>
                        ) : user.isPremium ? (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                            <Crown className="w-3 h-3 fill-amber-500" /> Premium
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                            Bepul / Sinov
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-center text-slate-700 font-bold">
                        {user.testsSolved || 0} ta
                      </td>

                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleBanUser(user)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 mx-auto ${
                            user.isBanned 
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800' 
                              : 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                          }`}
                        >
                          {user.isBanned ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{user.isBanned ? 'Blokdan chiqarish' : 'Bloklash'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASES ("SOTIP OLGANLAR") */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-800 text-base">To'lov Cheklari Ro'yxati</h3>
            <span className="text-xs text-slate-500 font-semibold">Jami {purchases.length} ta to'lov so'rovi</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {purchases.map((p) => (
              <div 
                key={p.id} 
                className={`p-6 rounded-3xl border-2 bg-white space-y-4 shadow-md ${
                  p.status === 'pending' ? 'border-amber-300' : p.status === 'approved' ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">{p.userNickname}</h4>
                    <p className="text-xs text-slate-500">{p.userEmail}</p>
                  </div>

                  <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    p.status === 'pending' ? 'bg-amber-100 text-amber-800' : p.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {p.status === 'pending' ? 'Kutmoqda' : p.status === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Ta'rif:</span>
                    <strong className="text-slate-800">{p.planTitle}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Summa:</span>
                    <strong className="text-slate-800">{p.amountUZS.toLocaleString()} UZS</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Sana:</span>
                    <span>{new Date(p.createdAt).toLocaleString('uz-UZ')}</span>
                  </div>
                </div>

                {/* Receipt Image Preview */}
                {p.receiptUrl && (
                  <div className="p-2 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                    <img src={p.receiptUrl} alt="Chek rasmi" className="max-h-48 rounded-xl mx-auto object-contain border shadow-sm" />
                  </div>
                )}

                {/* Approve / Reject Actions */}
                {p.status === 'pending' && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleApprovePurchase(p)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tasdiqlash (Premium Berish)</span>
                    </button>

                    <button
                      onClick={() => handleRejectPurchase(p)}
                      className="py-2.5 px-4 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Rad etish
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATION PUBLISH */}
      {activeTab === 'notifications' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-lg">Barcha Foydalanuvchilarga Habarnoma Yuborish</h3>
            <p className="text-xs text-slate-500">Chop etilgan xabar barcha foydalanuvchilarning 'Habarnoma' bo'limida ko'rinadi.</p>
          </div>

          <form onSubmit={handlePublishNotification} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Xabar Sarlavhasi
              </label>
              <input 
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Masalan: DTM Imtihonlariga Yangi Savollar Qo'shildi!"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-semibold text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Xabar Matni
              </label>
              <textarea 
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Xabar mazmunini batafsil yozing..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 text-sm"
                required
              />
            </div>

            {noteSuccess && (
              <p className="text-xs text-emerald-800 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{noteSuccess}</span>
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition cursor-pointer text-sm"
            >
              Chop Etish va Yuborish
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: QUESTIONS MANAGEMENT */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Yangi Savol Qo'shish</h3>

            <form onSubmit={handleAddQuestion} className="space-y-3">
              <input 
                type="text" 
                value={newQuestionText} 
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Savol matnini kiriting..." 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={optA} onChange={(e) => setOptA(e.target.value)} placeholder="Variant A" className="p-2.5 bg-slate-50 border rounded-xl text-xs" required />
                <input type="text" value={optB} onChange={(e) => setOptB(e.target.value)} placeholder="Variant B" className="p-2.5 bg-slate-50 border rounded-xl text-xs" required />
                <input type="text" value={optC} onChange={(e) => setOptC(e.target.value)} placeholder="Variant C" className="p-2.5 bg-slate-50 border rounded-xl text-xs" required />
                <input type="text" value={optD} onChange={(e) => setOptD(e.target.value)} placeholder="Variant D" className="p-2.5 bg-slate-50 border rounded-xl text-xs" required />
              </div>

              <div className="flex gap-2">
                <input type="text" value={correctOption} onChange={(e) => setCorrectOption(e.target.value)} placeholder="To'g'ri javob matni" className="flex-1 p-2.5 bg-slate-50 border rounded-xl text-xs" required />
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition cursor-pointer">
                  Qo'shish
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm">Savollar Ro'yxati ({questionsList.length} ta)</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {questionsList.slice(0, 30).map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-slate-800">{idx + 1}. {q.question}</div>
                  <div className="text-emerald-600 font-semibold">To'g'ri: {q.correctAnswer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
