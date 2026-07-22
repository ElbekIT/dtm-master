/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { CreditCard, Upload, CheckCircle2, AlertTriangle, Copy, ShieldCheck, Clock, FileText, ChevronRight, Tag, Sparkles } from "lucide-react";
import { db, handleFirestoreError, OperationType, getDocs } from "../lib/firebase";
import { doc, setDoc, collection, query, where } from "firebase/firestore";
import { User, Purchase } from "../types";

interface PremiumBuyProps {
  currentUser: User;
  onSuccess?: () => void;
  onUserUpdate?: (user: User) => void;
  isBlocker?: boolean; // if true, acts as a full-page blocker
}

export default function PremiumBuy({ currentUser, onSuccess, onUserUpdate, isBlocker = false }: PremiumBuyProps) {
  const [selectedPlan, setSelectedPlan] = useState<'haftalik' | 'oylik' | 'yillik'>('oylik');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Promo code states inside PremiumBuy
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const plans: Record<'haftalik' | 'oylik' | 'yillik', { name: string; price: number; label: string; popular?: boolean }> = {
    haftalik: { name: "Haftalik", price: 29000, label: "29,000 UZS / hafta" },
    oylik: { name: "Oylik", price: 50000, label: "50,000 UZS / oy", popular: true },
    yillik: { name: "Yillik", price: 100000, label: "100,000 UZS / yil" },
  };

  const handleCopyCard = () => {
    navigator.clipboard.writeText("4073420084569577");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.type.startsWith("image/")) {
        setError("Faqat rasm formatidagi cheklarni yuklashingiz mumkin (JPG/PNG).");
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (!selectedFile.type.startsWith("image/")) {
        setError("Faqat rasm formatidagi cheklarni yuklashingiz mumkin (JPG/PNG).");
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  // Convert & Compress File to Lightweight Base64 JPEG
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
            resolve(compressedBase64);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => resolve(event.target?.result as string);
      };
      reader.onerror = () => resolve("");
    });
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Iltimos, to'lov cheki rasmini yuklang.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const base64Image = await fileToBase64(file);
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
        receiptImage: base64Image,
        status: "Tekshirilyapti",
        createdAt: nowString,
        updatedAt: nowString
      };

      await setDoc(purchaseDocRef, purchaseData);

      // Update user subscription state in Firestore & Realtime Database
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        subscriptionStatus: "Tekshirilyapti",
        subscriptionPlan: selectedPlan
      }, { merge: true });

      // Notify parent app if callback available
      const updatedUser: User = {
        ...currentUser,
        subscriptionStatus: "Tekshirilyapti",
        subscriptionPlan: selectedPlan
      };
      if (onUserUpdate) onUserUpdate(updatedUser);

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Purchase submit failed:", err);
      setError("To'lov so'rovini yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        subscriptionStatus: "none",
        subscriptionPlan: null
      }, { merge: true });
      
      setFile(null);
      setPreviewUrl(null);
      setSuccess(false);
      setError(null);
    } catch (err) {
      console.error("Failed to reset subscriptionStatus:", err);
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
        const updatedCurrentUser: User = {
          ...currentUser,
          premium: true,
          subscriptionStatus: "Tastiqlandi",
          subscriptionPlan: "yillik",
          referredBy: cleanInput,
          trialDaysAdded: 9999
        };

        await setDoc(doc(db, "users", currentUser.uid), {
          premium: true,
          subscriptionStatus: "Tastiqlandi",
          subscriptionPlan: "yillik",
          referredBy: cleanInput,
          trialDaysAdded: 9999
        }, { merge: true });

        setPromoSuccess("Promokod faollashtirildi! Sizga umrbod PREMIUM imtiyozi taqdim etildi! 🎁🎉");
        setPromoInput("");
        if (onUserUpdate) onUserUpdate(updatedCurrentUser);
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
        setPromoError("Bunday promokod mavjud emas.");
        setPromoLoading(false);
        return;
      }

      let referrerUser: User | null = null;
      querySnapshot.forEach((docSnap) => {
        referrerUser = docSnap.data() as User;
      });

      if (!referrerUser || (referrerUser as User).uid === currentUser.uid) {
        setPromoError("O'zingizning promokodingizni ishlatishingiz mumkin emas.");
        setPromoLoading(false);
        return;
      }

      const updatedCurrentUser: User = {
        ...currentUser,
        premium: true,
        subscriptionStatus: "Tastiqlandi",
        subscriptionPlan: "oylik",
        referredBy: cleanInput,
        trialDaysAdded: (currentUser.trialDaysAdded || 0) + 30
      };

      await setDoc(doc(db, "users", currentUser.uid), {
        premium: true,
        subscriptionStatus: "Tastiqlandi",
        subscriptionPlan: "oylik",
        referredBy: cleanInput,
        trialDaysAdded: (currentUser.trialDaysAdded || 0) + 30
      }, { merge: true });

      setPromoSuccess(`Tabriklaymiz! Promokod muvaffaqiyatli ishlatildi. Premium taqdim etildi! 🎉`);
      setPromoInput("");
      if (onUserUpdate) onUserUpdate(updatedCurrentUser);
    } catch (err) {
      console.error("Promo activation failed:", err);
      setPromoError("Promokodni tekshirishda xatolik yuz berdi.");
    } finally {
      setPromoLoading(false);
    }
  };

  // 1. PENDING VERIFICATION UI
  if (currentUser.subscriptionStatus === "Tekshirilyapti") {
    return (
      <div className={`max-w-xl mx-auto px-4 py-12 text-center select-none ${isBlocker ? "mt-12" : ""}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6"
        >
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-100 animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">To'lovingiz tekshirilmoqda</h2>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed">
              Siz yuborgan to'lov cheki hozirda operatorlarimiz tomonidan tekshirilmoqda. Bu odatda 10-15 daqiqa vaqt oladi.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold text-slate-500 space-y-1">
            <p>Sotib olinmoqda: <span className="text-slate-800 font-extrabold">{plans[currentUser.subscriptionPlan || 'oylik'].name} tarif</span></p>
            <p>Holat: <span className="text-amber-600 font-extrabold uppercase">Tekshirilmoqda</span></p>
          </div>
          <p className="text-xs text-slate-400 font-semibold">
            Sahifa to'lovingiz tasdiqlangach avtomatik ravishda yangilanadi va barcha testlar ochiladi.
          </p>
        </motion.div>
      </div>
    );
  }

  // 2. REJECTED / NOT CONFIRMED UI
  if (currentUser.subscriptionStatus === "Tekshirilmadi") {
    return (
      <div className={`max-w-xl mx-auto px-4 py-12 text-center select-none ${isBlocker ? "mt-12" : ""}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6"
        >
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">To'lov rad etildi</h2>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed">
              Afsuski, siz yuborgan to'lov tasdiqlanmadi. Bu chek tasviri xira bo'lganligi, to'liq summani qoplamaganligi yoki eskirganligi sababli bo'lishi mumkin.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-3.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-bold text-sm shadow-md cursor-pointer"
          >
            Chekni qaytadan yuborish
          </button>
        </motion.div>
      </div>
    );
  }

  // 3. PURCHASE COMPLETED SUCCESS UI
  if (success) {
    return (
      <div className={`max-w-xl mx-auto px-4 py-12 text-center select-none ${isBlocker ? "mt-12" : ""}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">So'rovingiz yuborildi!</h2>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed">
              To'lov chekingiz muvaffaqiyatli qabul qilindi. Tez orada operatorlarimiz tekshirib, premium huquqini taqdim etishadi. Rahmat!
            </p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-500">
            Kutilayotgan tarif: <span className="text-slate-800 font-extrabold">{plans[selectedPlan].name}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. MAIN PURCHASE FORM UI
  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 select-none ${isBlocker ? "mt-6" : ""}`}>
      {isBlocker && (
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertTriangle className="w-7 h-7 animate-pulse" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Bepul sinov muddati tugadi</h1>
          <p className="text-slate-400 text-sm font-semibold mt-1.5 max-w-lg mx-auto">
            Sizning 2 kunlik bepul sinov muddatingiz tugadi. Platformadan to'liq va cheksiz foydalanish uchun Premium sotib oling.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT CARD: Tariff Plans Selection & Payment Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-primary-500" />
            
            <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-primary-500" />
              <span>1. Tarifni tanlang</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(plans) as Array<keyof typeof plans>).map((key) => {
                const plan = plans[key];
                const active = selectedPlan === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      active
                        ? "border-primary-500 bg-primary-50/20 ring-1 ring-primary-500"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        active ? "border-primary-500 text-primary-500" : "border-slate-300"
                      }`}>
                        {active && <div className="w-2.5 h-2.5 bg-primary-500 rounded-full" />}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">{plan.name} tarif</span>
                        <span className="text-xs text-slate-400 font-bold">{plan.label}</span>
                      </div>
                    </div>
                    {plan.popular && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100 uppercase tracking-wider">
                        Eng ommabop
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bank account details */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h3 className="font-display font-extrabold text-slate-800 text-base">2. Karta raqamiga to'lov qiling</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">To'lov uchun karta (Humo / Uzcard)</div>
                  <div className="font-mono text-xl font-extrabold text-slate-800 tracking-wide">4073 4200 8456 9577</div>
                  <div className="text-xs text-slate-500 font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
                    <span>Egalik qiluvchi: Elbek Qoriyev</span>
                  </div>
                </div>
                <button
                  onClick={handleCopyCard}
                  className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    copied 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Nusxalandi!" : "Nusxalash"}</span>
                </button>
              </div>

              <div className="bg-primary-50 text-primary-800 p-4 rounded-xl text-xs font-bold leading-relaxed border border-primary-100/30 flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                <span>Ushbu karta to'liq xavfsiz va tizim bilan integratsiya qilingan. To'lov qilingandan so'ng tushgan chekni o'ng tarafdagi bo'limga rasm holatida (JPG/PNG) yuklang.</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: File Drag & Drop Receipt Upload */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500" />
            
            <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
              <Upload className="w-5 h-5 text-indigo-500" />
              <span>3. Chekni tasdiqlang</span>
            </h3>

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden ${
                isDragging
                  ? "border-primary-500 bg-primary-50/10"
                  : previewUrl
                  ? "border-slate-300 bg-slate-50/10"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/20"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {previewUrl ? (
                <div className="space-y-4 w-full h-full">
                  <img
                    src={previewUrl}
                    alt="Chek rasmi"
                    className="max-h-[160px] mx-auto rounded-xl object-contain border border-slate-200"
                  />
                  <p className="text-xs text-slate-400 font-bold truncate px-2">
                    Chek rasmi: {file?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto border border-slate-200/50">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">Chek rasmini yuklash uchun bosing</p>
                    <p className="text-[10px] text-slate-400 font-bold">yoki rasmni bitta tortib tashlang (Drag & Drop)</p>
                  </div>
                  <span className="inline-block px-3 py-1.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-lg border border-slate-200/50 uppercase tracking-wider">
                    JPG, JPEG, PNG ruxsat etiladi
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100/50 text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !file}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl transition-all font-bold text-sm shadow-md flex items-center justify-center space-x-2 cursor-pointer shadow-primary-500/10"
            >
              <span>{submitting ? "Yuborilmoqda..." : "Tasdiqlash uchun yuborish"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Promokod Instant Activation Card */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl p-6 shadow-xs space-y-4 mt-6 relative overflow-hidden">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Tag className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="font-display font-extrabold text-slate-900 text-base">Promokod Bilan Kirish</h4>
                <p className="text-xs text-slate-500 font-semibold">Maxsus promokodingiz bo'lsa, uni kiriting</p>
              </div>
            </div>

            <form onSubmit={handleApplyPromo} className="space-y-3 pt-1">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Masalan: PROMOGOD yoki ELBEK"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase tracking-wide"
                />
                <button
                  type="submit"
                  disabled={promoLoading}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{promoLoading ? "..." : "Faollashtirish"}</span>
                </button>
              </div>

              {promoError && (
                <p className="text-[11px] font-bold text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-100">{promoError}</p>
              )}
              {promoSuccess && (
                <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">{promoSuccess}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
