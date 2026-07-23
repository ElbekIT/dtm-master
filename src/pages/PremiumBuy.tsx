/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { 
  CreditCard, Upload, CheckCircle2, AlertTriangle, Copy, ShieldCheck, Clock, 
  FileText, ChevronRight, Tag, Sparkles, X, Eye, Zap, Award
} from "lucide-react";
import { db, handleFirestoreError, OperationType, getDocs } from "../lib/firebase";
import { doc, setDoc, collection, query, where } from "firebase/firestore";
import { User, Purchase } from "../types";

interface PremiumBuyProps {
  currentUser: User;
  onSuccess?: () => void;
  onUserUpdate?: (user: User) => void;
  isBlocker?: boolean;
}

export default function PremiumBuy({ 
  currentUser, 
  onSuccess, 
  onUserUpdate, 
  isBlocker = false 
}: PremiumBuyProps) {
  const [selectedPlan, setSelectedPlan] = useState<'haftalik' | 'oylik' | 'yillik'>('oylik');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Promo code states
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const plans: Record<'haftalik' | 'oylik' | 'yillik', { 
    name: string; 
    price: number; 
    label: string; 
    description: string;
    popular?: boolean 
  }> = {
    haftalik: { 
      name: "Haftalik", 
      price: 29000, 
      label: "29,000 UZS", 
      description: "7 kunlik kirish",
      popular: false 
    },
    oylik: { 
      name: "Oylik", 
      price: 50000, 
      label: "50,000 UZS", 
      description: "30 kunlik kirish",
      popular: true 
    },
    yillik: { 
      name: "Yillik", 
      price: 100000, 
      label: "100,000 UZS", 
      description: "365 kunlik kirish",
      popular: false 
    },
  };

  const handleCopyCard = () => {
    navigator.clipboard.writeText("4073420084569577");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const planDetails = plans[selectedPlan];
      const nowString = new Date().toISOString();

      // Create purchase document in Firestore
      const purchaseDocRef = doc(db, "purchases", currentUser.uid);
      const purchaseData: Purchase = {
        id: currentUser.uid,
        uid: currentUser.uid,
        nickname: currentUser.nickname,
        email: currentUser.email,
        plan: selectedPlan,
        price: planDetails.price,
        receiptImage: "", // Rasm kerak emas
        status: "Tastiqlandi", // Darhol tasdiqlash (rasm yo'q)
        createdAt: nowString,
        updatedAt: nowString
      };

      await setDoc(purchaseDocRef, purchaseData);

      // Update user subscription state - DARHOL FAOLLASH
      const userDocRef = doc(db, "users", currentUser.uid);
      
      let premiumUntilDate: Date;
      if (selectedPlan === "haftalik") {
        premiumUntilDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } else if (selectedPlan === "oylik") {
        premiumUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else {
        premiumUntilDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }

      await setDoc(userDocRef, {
        premium: true,
        subscriptionStatus: "Tastiqlandi",
        subscriptionPlan: selectedPlan,
        premiumUntil: premiumUntilDate.toISOString()
      }, { merge: true });

      // Notify parent app
      const updatedUser: User = {
        ...currentUser,
        premium: true,
        subscriptionStatus: "Tastiqlandi",
        subscriptionPlan: selectedPlan,
        premiumUntil: premiumUntilDate.toISOString()
      };
      if (onUserUpdate) onUserUpdate(updatedUser);

      // Send congratulation notification
      const notifId = `notif_${currentUser.uid}_${Date.now()}`;
      const notifObj = {
        id: notifId,
        userId: currentUser.uid,
        title: "🎉 Premium obuna faollashtirildi!",
        message: `Tabriklaymiz! Siz ${selectedPlan === 'haftalik' ? '7 KUNLIK' : selectedPlan === 'oylik' ? '30 KUNLIK' : '365 KUNLIK'} premium obunasini sotib oldingiz. Barcha imtihonlar va savollar hozirda CHEKSIZ ochiq!`,
        createdAt: nowString,
        type: "purchase_approved"
      };

      await setDoc(doc(db, "notifications", notifId), notifObj);

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Purchase submit failed:", err);
      setError("To'lov jarayonida xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = promoInput.trim().toUpperCase();
    if (!cleanInput) {
      setPromoError("Iltimos, promokodni kiriting.");
      return;
    }

    setPromoLoading(true);
    setPromoError(null);
    setPromoSuccess(null);

    // Master promo codes
    const masterPromoCodes = ["PROMOGOD", "PROMOCODE", "PROMOKOD", "DTM2026", "ELBEK"];
    if (masterPromoCodes.includes(cleanInput)) {
      try {
        const premiumUntilDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

        const updatedCurrentUser: User = {
          ...currentUser,
          premium: true,
          subscriptionStatus: "Tastiqlandi",
          subscriptionPlan: "yillik",
          referredBy: cleanInput,
          trialDaysAdded: 9999,
          premiumUntil: premiumUntilDate.toISOString()
        };

        await setDoc(doc(db, "users", currentUser.uid), {
          premium: true,
          subscriptionStatus: "Tastiqlandi",
          subscriptionPlan: "yillik",
          referredBy: cleanInput,
          trialDaysAdded: 9999,
          premiumUntil: premiumUntilDate.toISOString()
        }, { merge: true });

        // Create purchase record
        const nowString = new Date().toISOString();
        await setDoc(doc(db, "purchases", currentUser.uid), {
          uid: currentUser.uid,
          nickname: currentUser.nickname,
          email: currentUser.email,
          plan: "yillik",
          price: 0,
          status: "Tastiqlandi",
          createdAt: nowString,
          updatedAt: nowString,
          promoCode: cleanInput
        }, { merge: true });

        setPromoSuccess("✨ Promokod faollashtirildi! Sizga UMRBOD PREMIUM imtiyozi taqdim etildi! 🎁🎉");
        setPromoInput("");
        if (onUserUpdate) onUserUpdate(updatedCurrentUser);
        
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } catch (err) {
        console.error("Master promo activation error:", err);
        setPromoError("Tizimda xatolik yuz berdi.");
      } finally {
        setPromoLoading(false);
      }
      return;
    }

    try {
      const q = query(collection(db, "users"), where("promoCode", "==", cleanInput));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setPromoError("❌ Bunday promokod mavjud emas.");
        setPromoLoading(false);
        return;
      }

      let referrerUser: User | null = null;
      querySnapshot.forEach((docSnap) => {
        referrerUser = docSnap.data() as User;
      });

      if (!referrerUser || (referrerUser as User).uid === currentUser.uid) {
        setPromoError("⚠️ O'zingizning promokodingizni ishlatishingiz mumkin emas.");
        setPromoLoading(false);
        return;
      }

      const premiumUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const updatedCurrentUser: User = {
        ...currentUser,
        premium: true,
        subscriptionStatus: "Tastiqlandi",
        subscriptionPlan: "oylik",
        referredBy: cleanInput,
        trialDaysAdded: (currentUser.trialDaysAdded || 0) + 30,
        premiumUntil: premiumUntilDate.toISOString()
      };

      await setDoc(doc(db, "users", currentUser.uid), {
        premium: true,
        subscriptionStatus: "Tastiqlandi",
        subscriptionPlan: "oylik",
        referredBy: cleanInput,
        trialDaysAdded: (currentUser.trialDaysAdded || 0) + 30,
        premiumUntil: premiumUntilDate.toISOString()
      }, { merge: true });

      // Create purchase record
      const nowString = new Date().toISOString();
      await setDoc(doc(db, "purchases", currentUser.uid), {
        uid: currentUser.uid,
        nickname: currentUser.nickname,
        email: currentUser.email,
        plan: "oylik",
        price: 0,
        status: "Tastiqlandi",
        createdAt: nowString,
        updatedAt: nowString,
        promoCode: cleanInput
      }, { merge: true });

      setPromoSuccess(`✨ Tabriklaymiz! Promokod muvaffaqiyatli ishlatildi. 30 kunlik PREMIUM taqdim etildi! 🎉`);
      setPromoInput("");
      if (onUserUpdate) onUserUpdate(updatedCurrentUser);
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      console.error("Promo activation failed:", err);
      setPromoError("❌ Promokodni tekshirishda xatolik yuz berdi.");
    } finally {
      setPromoLoading(false);
    }
  };

  // 1. SUCCESS UI
  if (success) {
    return (
      <div className={`max-w-2xl mx-auto px-4 py-12 text-center select-none ${isBlocker ? "mt-12" : ""}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: 2 }}
            className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100"
          >
            <CheckCircle2 className="w-8 h-8" />
          </motion.div>

          <div className="space-y-3">
            <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              ✅ Premium Faollashtirildi!
            </h2>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed">
              Tabriklaymiz! Sizning <span className="text-emerald-600 font-extrabold">Premium obunangiz</span> muvaffaqiyatli faollashtirildi. Barcha testlar va savollar hozirda <span className="text-emerald-600 font-extrabold">CHEKSIZ</span> ochiq!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
              <p className="text-[10px] text-emerald-600 font-bold uppercase">Tarif</p>
              <p className="text-lg font-black text-slate-800 mt-1">{plans[selectedPlan].name}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
              <p className="text-[10px] text-emerald-600 font-bold uppercase">Muddati</p>
              <p className="text-lg font-black text-slate-800 mt-1">
                {selectedPlan === 'haftalik' ? '7 kun' : selectedPlan === 'oylik' ? '30 kun' : '365 kun'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs text-left font-semibold text-slate-600 space-y-2">
            <p className="font-extrabold text-slate-800 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Siz olgan imtiyozlar:</span>
            </p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>✅ Barcha imtihonlar cheksiz</li>
              <li>✅ Barcha savollar ochiq</li>
              <li>✅ Takroriy imtihonlar ishlashi</li>
              <li>✅ Barcha yo'nalishlar faol</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-md cursor-pointer transition-all"
          >
            🚀 Imtihonlarni boshlash
          </button>
        </motion.div>
      </div>
    );
  }

  // 2. MAIN PURCHASE FORM UI
  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 select-none ${isBlocker ? "mt-6" : ""}`}>
      {isBlocker && (
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100"
          >
            <AlertTriangle className="w-8 h-8 animate-pulse" />
          </motion.div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ⏰ Bepul sinov muddati tugadi
          </h1>
          <p className="text-slate-400 text-sm font-semibold mt-2.5 max-w-lg mx-auto leading-relaxed">
            Sizning <span className="text-red-600 font-extrabold">2 kunlik</span> bepul sinov muddatingiz tugadi. Platformadan to'liq va cheksiz foydalanish uchun ushbu daqiqada Premium sotib oling.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT CARD: Tariff Plans Selection & Payment Details */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 to-indigo-600" />
            
            <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
              <span className="inline-block w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-black text-sm">1</span>
              <span>Tarifni tanlang</span>
            </h3>

            <div className="grid grid-cols-1 gap-3 space-y-2">
              {(Object.keys(plans) as Array<keyof typeof plans>).map((key) => {
                const plan = plans[key];
                const active = selectedPlan === key;
                return (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPlan(key)}
                    className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer text-left group ${
                      active
                        ? "border-primary-500 bg-primary-50/30 ring-2 ring-primary-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/20"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        active 
                          ? "border-primary-500 bg-primary-500" 
                          : "border-slate-300 group-hover:border-slate-400"
                      }`}>
                        {active && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 text-base block">{plan.name} Tarif</span>
                        <span className="text-xs text-slate-400 font-bold mt-0.5">{plan.description}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-slate-900 text-lg">{plan.label}</span>
                      {plan.popular && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[9px] font-black rounded-lg border border-amber-100 uppercase tracking-wider mt-1">
                          ⭐ Eng ommabop
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Bank account details */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h3 className="font-display font-extrabold text-slate-800 text-base flex items-center space-x-2">
                <span className="inline-block w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-black text-sm">2</span>
                <span>Karta raqamiga to'lov qiling</span>
              </h3>

              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-2xl p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">💳 To'lov Karting (Humo / Uzcard)</div>
                  <div className="font-mono text-2xl font-black text-slate-900 tracking-wider">4073 4200 8456 9577</div>
                  <div className="text-xs text-slate-500 font-bold flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary-500" />
                    <span>Egalik qiluvchi: Elbek Qoriyev</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyCard}
                  className={`px-5 py-3 rounded-xl border-2 font-black text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                    copied 
                      ? "bg-emerald-100 border-emerald-300 text-emerald-700 shadow-md shadow-emerald-200" 
                      : "bg-white border-slate-300 hover:border-primary-300 text-slate-600 shadow-sm"
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? "✅ Nusxalandi!" : "📋 Nusxalash"}</span>
                </motion.button>
              </motion.div>

              <div className="bg-primary-50 text-primary-800 p-4 rounded-2xl text-xs font-bold leading-relaxed border-2 border-primary-200 flex items-start space-x-3">
                <Zap className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <span>Karta raqamiga to'lov qilib, "Tasdiqlash uchun yuborish" tugmasini bosing. Darhol Premium faollashtiriladi!</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT CARD: Payment & Promo */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
            
            <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
              <span className="inline-block w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-black text-sm">3</span>
              <span>Tasdiqlash</span>
            </h3>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-600 font-black bg-red-50 p-4 rounded-xl border-2 border-red-200 text-center flex items-start space-x-2"
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-2xl space-y-3">
              <p className="text-sm font-black text-blue-900 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span>Quyidagi tarif sotib olinadi:</span>
              </p>
              <div className="bg-white border border-blue-100 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Tarif:</span>
                  <span className="font-black text-primary-600">{plans[selectedPlan].name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Muddati:</span>
                  <span className="font-black text-primary-600">
                    {selectedPlan === 'haftalik' ? '7 kun' : selectedPlan === 'oylik' ? '30 kun' : '365 kun'}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between items-center">
                  <span className="font-black text-slate-800">Jami to'lov:</span>
                  <span className="font-black text-lg text-emerald-600">
                    {plans[selectedPlan].price.toLocaleString('uz-UZ')} UZS
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-2xl transition-all font-black text-sm shadow-lg shadow-primary-500/30 flex items-center justify-center space-x-2 cursor-pointer border-2 border-primary-600"
            >
              <motion.span
                animate={submitting ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {submitting ? "⏳" : "✅"}
              </motion.span>
              <span>{submitting ? "Qayta urinib ko'ring..." : "💳 Tasdiqlash uchun yuborish"}</span>
            </motion.button>

            <p className="text-xs text-slate-400 font-semibold text-center">
              To'lovni qilingandan so'ng Premium darhol faollashtiriladi
            </p>
          </motion.div>

          {/* Promokod Instant Activation Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-amber-500/15 via-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 shadow-lg space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/20 rounded-full blur-2xl" />
            
            <div className="flex items-center space-x-3 relative z-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-lg"
              >
                <Tag className="w-5 h-5 stroke-[2.5]" />
              </motion.div>
              <div>
                <h4 className="font-display font-black text-slate-900 text-base">🎁 Promokod</h4>
                <p className="text-xs text-slate-600 font-bold">Mavjud bo'lsa, kiriting</p>
              </div>
            </div>

            <form onSubmit={handleApplyPromo} className="space-y-3 pt-2 relative z-10">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Masalan: ELBEK"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white border-2 border-amber-200 rounded-xl text-xs font-black text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent uppercase tracking-wide shadow-sm transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={promoLoading}
                  className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-500/30 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5 border-2 border-amber-600"
                >
                  <motion.span
                    animate={promoLoading ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {promoLoading ? "⏳" : "✨"}
                  </motion.span>
                  <span>{promoLoading ? "..." : "Ishlatish"}</span>
                </motion.button>
              </div>

              {promoError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] font-black text-red-600 bg-red-50 p-3 rounded-lg border-2 border-red-200 flex items-start space-x-2"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{promoError}</span>
                </motion.p>
              )}
              {promoSuccess && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] font-black text-emerald-700 bg-emerald-50 p-3 rounded-lg border-2 border-emerald-200 flex items-start space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{promoSuccess}</span>
                </motion.p>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}