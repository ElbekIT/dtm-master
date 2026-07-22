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
  isBlocker?: boolean;
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

  const TELEGRAM_BOT_TOKEN = "8793002359:AAHEv9w1N7x3Q1ud_UB1hxAJS2qAo4IEPDs";
  const TELEGRAM_CHAT_ID = "8269163077";

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
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Rasm o'lchami 5MB dan katta bo'lmasligi kerak.");
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
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Rasm o'lchami 5MB dan katta bo'lmasligi kerak.");
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = () => reject(new Error("Fayl o'qilmadi"));
    });
  };

  // TELEGRAM'GA RASIM + XABARNOMA YUBORISH
  const sendToTelegramBot = async (base64Image: string, planName: string, planPrice: number) => {
    try {
      const arr = base64Image.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      const n = bstr.length;
      const u8arr = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }
      const blob = new Blob([u8arr], { type: mime });
      
      const formData = new FormData();
      formData.append("chat_id", TELEGRAM_CHAT_ID);
      formData.append("photo", blob, "receipt.jpg");

      const caption = `
🔔 YANGI TO'LOV SO'ROVI - TEKSHIRILISH UCHUN KUTILMOQDA

👤 Foydalanuvchi: ${currentUser.nickname || currentUser.email}
📧 Email: ${currentUser.email}
📱 UID: ${currentUser.uid}

💳 Tarif: ${planName}
💰 Summa: ${planPrice.toLocaleString('uz-UZ')} UZS
⏰ Vaqt: ${new Date().toLocaleString("uz-UZ")}

📋 HOLAT: ⏳ TEKSHIRILISH UCHUN KUTILMOQDA

✅ Admin panelida "Sotip olganlar" bo'limiga qarang
✅ Chekni tekshiring va "Tastiqlash" tugmasini bosing
❌ Chek noto'g'ri bo'lsa "Rad etish" tugmasini bosing
      `.trim();

      formData.append("caption", caption);
      formData.append("parse_mode", "HTML");

      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
        { method: "POST", body: formData }
      );

      if (!response.ok) {
        throw new Error("Telegram'ga rasm yuborilmadi");
      }

      console.log("✅ Rasm Telegram'ga yuborildi!");
      return true;
    } catch (err) {
      console.error("❌ Telegram xatosi:", err);
      throw err;
    }
  };

  // FIREBASE'GA SAQLASH (Rasm yoq, faqat TEXT)
  const saveToPurchaseRecord = async (planName: string, planPrice: number) => {
    try {
      const nowString = new Date().toISOString();

      const purchaseDocRef = doc(db, "purchases", currentUser.uid);
      const purchaseData: Purchase = {
        id: currentUser.uid,
        uid: currentUser.uid,
        nickname: currentUser.nickname,
        email: currentUser.email,
        plan: selectedPlan,
        price: planPrice,
        receiptImage: "",
        status: "Tekshirilyapti",
        createdAt: nowString,
        updatedAt: nowString
      };

      await setDoc(purchaseDocRef, purchaseData);
      console.log("✅ To'lov recordi Firebase'ga saqlandi!");

      // Foydalanuvchi statusini yangilash
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        subscriptionStatus: "Tekshirilyapti",
        subscriptionPlan: selectedPlan
      }, { merge: true });

      console.log("✅ Foydalanuvchi statusi yangilanildi");
      return true;
    } catch (err) {
      console.error("❌ Firebase xatosi:", err);
      throw err;
    }
  };

  // FOYDALANUVCHIGA BILDIRISHNOMA YUBORISH
  const sendNotificationToUser = async () => {
    try {
      const notifId = `notif_${currentUser.uid}_${Date.now()}`;
      const now = new Date().toISOString();

      const notifData = {
        id: notifId,
        userId: currentUser.uid,
        title: "✅ To'lov so'rovi qabul qilindi",
        message: "Siz yuborgan to'lov cheki qabul qilindi va tekshirilish uchun kutilmoqda. Bu odatda 10-15 daqiqa vaqt oladi. Admins sizning chekingizni ko'rib chiqib, tastiqlansa premium huquq beriladi.",
        type: "purchase_pending",
        createdAt: now,
        read: false
      };

      await setDoc(doc(db, "notifications", notifId), notifData);
      console.log("✅ Foydalanuvchiga notification yuborildi");
    } catch (err) {
      console.error("Notification yuborish xatosi:", err);
    }
  };

  // ASOSIY SUBMIT FUNCTIYASI
  const handleSubmit = async () => {
    if (!file) {
      setError("Iltimos, to'lov cheki rasmini yuklang.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log("🚀 To'lov jarayoni boshlanmoqda...");
      
      const base64Image = await fileToBase64(file);
      const planDetails = plans[selectedPlan];

      console.log(`📸 Rasm konvertildi`);
      console.log(`💳 Tarif: ${planDetails.name} - ${planDetails.price} UZS`);

      // 1. TELEGRAM BOT'GA YUBORISH
      console.log("📤 Telegram Bot'ga rasm va ma'lumot yuborilmoqda...");
      await sendToTelegramBot(base64Image, planDetails.name, planDetails.price);

      // 2. FIREBASE'GA SAQLASH
      console.log("💾 Firebase'ga saqlash...");
      await saveToPurchaseRecord(planDetails.name, planDetails.price);

      // 3. FOYDALANUVCHIGA NOTIFICATION YUBORISH
      console.log("📬 Foydalanuvchiga notification yuborilmoqda...");
      await sendNotificationToUser();

      // 4. UI YANGILASH
      const updatedUser: User = {
        ...currentUser,
        subscriptionStatus: "Tekshirilyapti",
        subscriptionPlan: selectedPlan
      };

      if (onUserUpdate) onUserUpdate(updatedUser);

      console.log("🎉 HAMMASI MUVAFFAQIYATLI!");
      setSuccess(true);
      if (onSuccess) onSuccess();
      
    } catch (err: any) {
      console.error("❌ Xatolik:", err);
      setError(err.message || "To'lov so'rovini yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
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
      console.error("Reset xatosi:", err);
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

    const masterPromoCodes = ["PROMOGOD", "PROMOCODE", "PROMOKOD", "DTM2026", "ELBEK"];
    if (masterPromoCodes.includes(cleanInput)) {
      try {
        const now = new Date().toISOString();
        
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

        // Admin'ga notification yuborish
        const adminNotifId = `admin_notif_promo_${currentUser.uid}_${Date.now()}`;
        await setDoc(doc(db, "admin_notifications", adminNotifId), {
          id: adminNotifId,
          type: "promo_activated",
          message: `${currentUser.nickname} promokod "${cleanInput}" foydalanib PREMIUM olatdi!`,
          user: currentUser.nickname,
          promo: cleanInput,
          createdAt: now
        });

        // Foydalanuvchiga notification
        const userNotifId = `notif_promo_${currentUser.uid}_${Date.now()}`;
        await setDoc(doc(db, "notifications", userNotifId), {
          id: userNotifId,
          userId: currentUser.uid,
          title: "🎉 PREMIUM FAOLLASHTIRILDI!",
          message: "Promokod muvaffaqiyatli! Siz umrbod PREMIUM imtiyoziga ega bo'ldingiz. Barcha testlar va savollar hozirda ochiq!",
          type: "promo_success",
          createdAt: now,
          read: false
        });

        setPromoSuccess("✅ Promokod faollashtirildi! Umrbod PREMIUM oladingiz! 🎁🎉");
        setPromoInput("");
        if (onUserUpdate) onUserUpdate(updatedCurrentUser);
      } catch (err) {
        console.error("Xatolik:", err);
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

      const now = new Date().toISOString();
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

      // Admin'ga notification
      const adminNotifId = `admin_notif_promo_${currentUser.uid}_${Date.now()}`;
      await setDoc(doc(db, "admin_notifications", adminNotifId), {
        id: adminNotifId,
        type: "promo_activated",
        message: `${currentUser.nickname} promokod "${cleanInput}" foydalanib PREMIUM olatdi!`,
        user: currentUser.nickname,
        promo: cleanInput,
        createdAt: now
      });

      // Foydalanuvchiga notification
      const userNotifId = `notif_promo_${currentUser.uid}_${Date.now()}`;
      await setDoc(doc(db, "notifications", userNotifId), {
        id: userNotifId,
        userId: currentUser.uid,
        title: "🎉 PREMIUM FAOLLASHTIRILDI!",
        message: "Promokod muvaffaqiyatli! 1 oylik PREMIUM obunasi faollashtirildi!",
        type: "promo_success",
        createdAt: now,
        read: false
      });

      setPromoSuccess("✅ Promokod muvaffaqiyatli! 1 oylik PREMIUM oladingiz! 🎉");
      setPromoInput("");
      if (onUserUpdate) onUserUpdate(updatedCurrentUser);
    } catch (err) {
      console.error("Xatolik:", err);
      setPromoError("Promokodni tekshirishda xatolik yuz berdi.");
    } finally {
      setPromoLoading(false);
    }
  };

  // 1. TEKSHIRILYAPTI
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
            <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">⏳ To'lovingiz tekshirilmoqda</h2>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed">
              Siz yuborgan to'lov cheki admin tomonidan tekshirilmoqda. Bu odatda 10-15 daqiqa vaqt oladi. Administator tastiqlasa, sizga xabarnoma yuboriladi.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold text-slate-500 space-y-2">
            <p>📋 Tarif: <span className="text-slate-800 font-extrabold">{plans[currentUser.subscriptionPlan || 'oylik'].name}</span></p>
            <p>⏱️ Holat: <span className="text-amber-600 font-extrabold uppercase">Tekshirilmoqda</span></p>
            <p>💬 Qo'shimcha xabar uchun "Xabarnomalar" bo'limini tekshiring</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-xs font-semibold text-blue-800 space-y-1">
            <p>ℹ️ Ushbu vaqtda barcha imtihonlar va savollar sizga mavjud emas.</p>
            <p>✅ Tastiqlangandan so'ng, hammasiga kirish huquqi beriladi.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. RAD ETILDI
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
            <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">❌ To'lov rad etildi</h2>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed">
              Afsuski, siz yuborgan to'lov cheki tasdiqlanmadi. Bu chek tasviri xira bo'lganligi, to'liq summani qoplamaganligi yoki boshqa sabablardan bo'lishi mumkin.
            </p>
          </div>
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-xs font-semibold text-red-800">
            <p>🔄 Iltimos, chekni qaytadan yuboring.</p>
            <p>📸 Chek rasmining sifatini yaxshi qilib aniqlang.</p>
            <p>💰 Summa to'liq ko'rinib turganligini tekshiring.</p>
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

  // 3. MUVAFFAQIYAT
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
            <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">✅ So'rovingiz qabul qilindi!</h2>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed">
              Siz yuborgan to'lov cheki qabul qilindi. Admin tomonidan tekshirilish uchun kutilmoqda. Bu odatda 10-15 daqiqa vaqt oladi.
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-xs font-bold text-emerald-800 space-y-2">
            <p className="flex items-center justify-center space-x-2">
              <span>💳 Tarif:</span>
              <span className="font-extrabold">{plans[selectedPlan].name}</span>
            </p>
            <p className="flex items-center justify-center space-x-2">
              <span>💰 Summa:</span>
              <span className="font-extrabold">{plans[selectedPlan].price.toLocaleString('uz-UZ')} UZS</span>
            </p>
            <p className="flex items-center justify-center space-x-2">
              <span>⏳ Holat:</span>
              <span className="font-extrabold text-amber-600">TEKSHIRILMOQDA</span>
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-xs font-semibold text-blue-800">
            <p>📬 Tastiqlangandan so'ng sizga push notification yuboriladi.</p>
            <p>✨ Admin tastiqlasa, barcha testlar va savollar avtomatik ochiladi.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. ASOSIY FORMA
  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 select-none ${isBlocker ? "mt-6" : ""}`}>
      {isBlocker && (
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertTriangle className="w-7 h-7 animate-pulse" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Bepul sinov muddati tugadi</h1>
          <p className="text-slate-400 text-sm font-semibold mt-1.5 max-w-lg mx-auto">
            Platformadan to'liq va cheksiz foydalanish uchun Premium sotib oling. Barcha imtihonlar va savollar sizga ochiladi.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT - TARIFLAR VA KARTA */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-primary-500" />
            
            <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-primary-500" />
              <span>1️⃣ Tarifni tanlang</span>
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
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100 uppercase">
                        Eng ommabop ⭐
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h3 className="font-display font-extrabold text-slate-800 text-base">2️⃣ Karta raqamiga to'lov qiling</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">To'lov uchun karta (HUMO / UZCARD)</div>
                  <div className="font-mono text-xl font-extrabold text-slate-800">4073 4200 8456 9577</div>
                  <div className="text-xs text-slate-500 font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
                    <span>Elbek Qoriyev</span>
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
                  <span>{copied ? "✅ Nusxalandi!" : "Nusxalash"}</span>
                </button>
              </div>

              <div className="bg-primary-50 text-primary-800 p-4 rounded-xl text-xs font-bold leading-relaxed border border-primary-100/30 flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                <span>💡 To'lov qilingandan so'ng chek rasmini oling va quyida yuklang. Xavf emas, to'liq xavfsiz!</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT - CHEK YUKLASH */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500" />
            
            <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center space-x-2">
              <Upload className="w-5 h-5 text-indigo-500" />
              <span>3️⃣ Chekni yuklang</span>
            </h3>

            {/* Drag & Drop */}
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
                <div className="space-y-4 w-full">
                  <img
                    src={previewUrl}
                    alt="Chek rasmi"
                    className="max-h-[160px] mx-auto rounded-xl object-contain border border-slate-200"
                  />
                  <p className="text-xs text-slate-400 font-bold truncate">
                    ✅ {file?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto border border-slate-200/50">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">📸 Chek rasmini yuklang</p>
                    <p className="text-[10px] text-slate-400 font-bold">yoki bu yerga torting (Drag & Drop)</p>
                  </div>
                  <span className="inline-block px-3 py-1.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-lg uppercase">
                    JPG, PNG (Max 5MB)
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                ❌ {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !file}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-bold text-sm shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{submitting ? "⏳ Yuborilmoqda..." : "✅ Yuborish"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-[11px] font-bold text-blue-800 text-center">
              <p>⚠️ Chek rasmini tekshiring!</p>
              <p className="text-[10px] mt-1">Chek bo'lim nomi, summa va vaqti bo'lishi kerak.</p>
            </div>
          </div>

          {/* PROMOKOD */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl p-6 shadow-xs space-y-4 mt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-500 text-white rounded-xl">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-extrabold text-slate-900 text-base">🎁 Promokod</h4>
                <p className="text-xs text-slate-500 font-semibold">Mavjud bo'lsa, premium bepul oling!</p>
              </div>
            </div>

            <form onSubmit={handleApplyPromo} className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="PROMOGOD"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 uppercase"
                />
                <button
                  type="submit"
                  disabled={promoLoading}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{promoLoading ? "..." : "OK"}</span>
                </button>
              </div>

              {promoError && (
                <p className="text-[11px] font-bold text-red-500 bg-red-50 p-2.5 rounded-lg">❌ {promoError}</p>
              )}
              {promoSuccess && (
                <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg">✅ {promoSuccess}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}