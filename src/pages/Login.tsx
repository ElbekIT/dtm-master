/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { auth, googleProvider, db, handleFirestoreError, OperationType, getDoc, setDoc } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { doc } from "firebase/firestore";
import { Chrome, ShieldAlert, Award, ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { User } from "../types";

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // First-time registration state
  const [showNicknameForm, setShowNicknameForm] = useState(false);
  const [tempAuthData, setTempAuthData] = useState<{
    uid: string;
    email: string | null;
    photoURL: string | null;
  } | null>(null);
  
  const [nickname, setNickname] = useState("");
  const [country, setCountry] = useState("O'zbekiston");

  // Admin password states
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);

  const handleVerifyAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "79178195327178195327") {
      setAdminPassword("");
      setAdminPasswordError(null);
      setShowAdminPasswordModal(false);
      handleDeveloperLogin("admin");
    } else {
      setAdminPasswordError("Noto'g'ri parol! Qaytadan urinib ko'ring.");
    }
  };

  // Handles real Firebase Google Authentication
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      if (!firebaseUser) throw new Error("Google hisobi orqali kirish amalga oshmadi.");

      // Check if user exists in Firestore database
      const userDocRef = doc(db, "users", firebaseUser.uid);
      let userDoc;
      try {
        userDoc = await getDoc(userDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
      }

      if (userDoc && userDoc.exists()) {
        const existingData = userDoc.data() as User;
        
        // Update last login
        const updatedUser: User = {
          ...existingData,
          lastLogin: new Date().toISOString(),
          promoCode: existingData.promoCode || `${existingData.nickname.toUpperCase().replace(/[^A-Z0-9]/g, "")}_${existingData.uid.substring(0, 4).toUpperCase()}`,
          trialDaysAdded: existingData.trialDaysAdded ?? 0,
          subscriptionStatus: existingData.subscriptionStatus ?? "none",
          premium: existingData.premium ?? (existingData.subscriptionStatus === "Tastiqlandi")
        };
        
        try {
          await setDoc(userDocRef, updatedUser, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
        
        onLoginSuccess(updatedUser);
      } else {
        // First-time user, trigger nickname setup
        setTempAuthData({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL
        });
        setShowNicknameForm(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Tizimga kirish jarayonida xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  // Handles completing user setup
  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("Iltimos, nikneymingizni kiriting.");
      return;
    }
    if (!tempAuthData) return;

    setLoading(true);
    setError(null);

    const cleanNickname = nickname.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const generatedPromo = `${cleanNickname}_${tempAuthData.uid.substring(0, 4).toUpperCase()}`;

    const newUser: User = {
      uid: tempAuthData.uid,
      email: tempAuthData.email,
      photoURL: tempAuthData.photoURL,
      nickname: nickname.trim(),
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      score: 0,
      testsSolved: 0,
      country: country,
      role: "user", // Default role
      promoCode: generatedPromo,
      trialDaysAdded: 0,
      subscriptionStatus: "none",
      premium: false
    };

    try {
      const userDocRef = doc(db, "users", newUser.uid);
      await setDoc(userDocRef, newUser);
      onLoginSuccess(newUser);
    } catch (err) {
      console.error(err);
      setError("Ma'lumotlarni saqlashda xatolik yuz berdi.");
      handleFirestoreError(err, OperationType.CREATE, `users/${newUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  // Legendary developer mode bypass for smooth iframe/testing evaluation
  const handleDeveloperLogin = async (role: "user" | "admin") => {
    setLoading(true);
    setError(null);
    const mockUid = `dev_uid_${role}_${Math.floor(Math.random() * 1000)}`;
    
    const cleanNickname = (role === "admin" ? "Admin_Senior" : "Muvaffaqiyatli_Talaba").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const generatedPromo = `${cleanNickname}_${mockUid.substring(mockUid.length - 4).toUpperCase()}`;

    const mockUser: User = {
      uid: mockUid,
      email: role === "admin" ? "admin@dtmmaster.uz" : "talaba@dtmmaster.uz",
      photoURL: role === "admin" 
        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" 
        : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
      nickname: role === "admin" ? "Admin_Senior" : "Muvaffaqiyatli_Talaba",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      score: role === "admin" ? 180.5 : 85.0,
      testsSolved: role === "admin" ? 15 : 2,
      country: "O'zbekiston",
      role: role,
      promoCode: generatedPromo,
      trialDaysAdded: 0,
      subscriptionStatus: role === "admin" ? "Tastiqlandi" : "none",
      premium: role === "admin"
    };

    // Save developer user in local Firestore for leaderboard consistency
    try {
      const userDocRef = doc(db, "users", mockUser.uid);
      await setDoc(userDocRef, mockUser);
    } catch (err) {
      console.warn("Dev login db save failed, continuing locally:", err);
    }

    setTimeout(() => {
      onLoginSuccess(mockUser);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-10 relative overflow-hidden"
      >
        {/* Visual Header Decoration */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary-500 to-primary-700" />

        {/* 1. First-time Registration Nickname Form */}
        {showNicknameForm ? (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Xush kelibsiz!</h2>
              <p className="text-sm text-slate-500 mt-2">
                DTM MASTER platformasida o'z natijalaringizni va reytingingizni saqlash uchun profil sozlamalarini yakunlang.
              </p>
            </div>

            <form onSubmit={handleCompleteSetup} className="space-y-6">
              <div>
                <label htmlFor="nickname" className="block text-sm font-semibold text-slate-700 mb-2">
                  Nikneymingiz (Taxallusingiz) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="nickname"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Masalan: dtm_chempioni"
                    maxLength={20}
                    pattern="^[a-zA-Z0-9_\-]+$"
                    title="Faqat lotin harflari, sonlar va ostki chiziq ruxsat etiladi."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Lotin harflari, sonlar va ostki chiziq (_) ishlatishingiz mumkin (max 20 belgi).
                </p>
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-semibold text-slate-700 mb-2">
                  Hududingiz / Davlatingiz
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="O'zbekiston">O'zbekiston</option>
                    <option value="Toshkent shahri">Toshkent shahri</option>
                    <option value="Samarqand">Samarqand</option>
                    <option value="Buxoro">Buxoro</option>
                    <option value="Andijon">Andijon</option>
                    <option value="Farg'ona">Farg'ona</option>
                    <option value="Namangan">Namangan</option>
                    <option value="Xorazm">Xorazm</option>
                    <option value="Navoiy">Navoiy</option>
                    <option value="Qashqadaryo">Qashqadaryo</option>
                    <option value="Surxondaryo">Surxondaryo</option>
                    <option value="Sirdaryo">Sirdaryo</option>
                    <option value="Jizzax">Jizzax</option>
                    <option value="Qoraqalpog'iston Res.">Qoraqalpog'iston Res.</option>
                  </select>
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full dtm-btn-primary flex items-center justify-center space-x-2 py-3.5 disabled:opacity-50"
              >
                <span>{loading ? "Saqlanmoqda..." : "Davom etish"}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        ) : (
          /* 2. Main Login Card */
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100/50">
                <Award className="w-9 h-9 stroke-[2]" />
              </div>
              <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">DTM MASTER</h1>
              <p className="text-sm text-slate-500 mt-2">
                Uzbekistan DTM Davlat Imtihonlariga Professional Tayyorgarlik Tizimi
              </p>
            </div>

            <div className="space-y-4">
              {/* Google Login Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 px-6 py-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-slate-700 bg-white shadow-xs focus:ring-2 focus:ring-primary-500/20 outline-none cursor-pointer disabled:opacity-50"
              >
                <Chrome className="w-5 h-5 text-red-500 fill-red-500" />
                <span>{loading ? "Kirish jarayonida..." : "Google orqali kirish"}</span>
              </button>

              <div className="relative py-4 flex items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-xs text-slate-400 font-medium tracking-wider uppercase">Yoki (Sinov)</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Secure Developer Mode Bypass for Iframe sandbox compatibility */}
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5 mb-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>PREVIEW SINOV INTERFEYSI</span>
                </div>
                <button
                  onClick={() => handleDeveloperLogin("user")}
                  disabled={loading}
                  className="w-full py-2.5 px-4 text-sm font-semibold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-primary-50 hover:text-primary-600 hover:border-primary-100 transition-all text-left flex justify-between items-center cursor-pointer shadow-2xs"
                >
                  <span>Abituriyent sifatida kirish</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </button>
                <button
                  onClick={() => {
                    setAdminPassword("");
                    setAdminPasswordError(null);
                    setShowAdminPasswordModal(true);
                  }}
                  disabled={loading}
                  className="w-full py-2.5 px-4 text-sm font-semibold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-primary-50 hover:text-primary-600 hover:border-primary-100 transition-all text-left flex justify-between items-center cursor-pointer shadow-2xs"
                >
                  <span>Admin sifatida kirish</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </button>
              </div>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl mt-6 font-medium text-center">{error}</div>}

            <p className="text-center text-[11px] text-slate-400 mt-8">
              Google orqali kirish bilan siz xavfsizlik va imtihon qoidalariga rozilik bildirasiz.
            </p>
          </div>
        )}
      </motion.div>

      {/* Admin Password verification modal */}
      {showAdminPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 w-full max-w-sm shadow-xl"
          >
            <h3 className="font-display font-extrabold text-slate-900 text-xl text-center mb-2">Tizim parolini kiriting</h3>
            <p className="text-xs text-slate-500 text-center mb-6 font-semibold">Admin panelga kirish uchun maxsus parolni kiriting</p>
            
            <form onSubmit={handleVerifyAdminPassword} className="space-y-4">
              <input
                type="password"
                required
                autoFocus
                placeholder="Parol"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-center font-bold font-mono tracking-widest text-slate-800"
              />
              {adminPasswordError && (
                <p className="text-xs text-red-500 text-center font-bold bg-red-50 py-2 px-3 rounded-lg">{adminPasswordError}</p>
              )}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPasswordModal(false);
                    setAdminPassword("");
                    setAdminPasswordError(null);
                  }}
                  className="flex-1 py-3 text-sm font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-md shadow-primary-500/20 cursor-pointer"
                >
                  Kirish
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
