import React, { useState, useRef } from "react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { PaymentRequest, UserProfile } from "../types";
import { motion } from "motion/react";
import { 
  CreditCard, 
  Upload, 
  Check, 
  AlertCircle, 
  Hourglass, 
  XCircle, 
  Copy, 
  Sparkles, 
  Loader,
  TrendingUp,
  Award,
  Trash2,
  Zap,
  HelpCircle,
  Info
} from "lucide-react";

interface PremiumScreenProps {
  userProfile: UserProfile;
  currentPayment: PaymentRequest | null;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onPaymentSubmitted: (payment: PaymentRequest | null) => void;
}

export default function PremiumScreen({ userProfile, currentPayment, showToast, onPaymentSubmitted }: PremiumScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cardNo = "4073420084569577";
  const cardOwner = "Elbek Qoriyev";

  const plans = {
    weekly: {
      name: "Haftalik Reja",
      price: 29000,
      period: "7 kun",
      desc: "Platformadan bir hafta davomida to'liq foydalanish imkoniyati."
    },
    monthly: {
      name: "Oylik Reja",
      price: 50000,
      period: "30 kun",
      desc: "Eng ommabop tanlov! Doimiy shug'ullanuvchilar uchun tavsiya etiladi."
    },
    yearly: {
      name: "Yillik Reja",
      price: 100000,
      period: "365 kun",
      desc: "Maksimal tejash! Davlat imtihonlarigacha uzoq muddatli mukammal tayyorgarlik."
    }
  };

  const copyCard = () => {
    navigator.clipboard.writeText(cardNo);
    showToast("Karta raqami nusxalandi!", "success");
  };

  // High-efficiency HTML5 Canvas Image compression (Senior engineering touch)
  const processImageFile = (selectedFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          // Maintain ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Export as compressed JPEG (0.7 quality is extremely light weight and crystal clear)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Image loading failed"));
      };
      reader.onerror = () => reject(new Error("File reading failed"));
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!["image/jpeg", "image/png", "image/jpg"].includes(selected.type)) {
        showToast("Faqat JPG, JPEG yoki PNG rasm kvitansiyalarini yuklash mumkin.", "error");
        return;
      }
      setFile(selected);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selected);
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!["image/jpeg", "image/png", "image/jpg"].includes(droppedFile.type)) {
        showToast("Faqat JPG, JPEG yoki PNG rasm kvitansiyalarini yuklash mumkin.", "error");
        return;
      }
      setFile(droppedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(droppedFile);
      showToast("Kvitansiya rasmi muvaffaqiyatli yuklandi!", "success");
    }
  };

  const handleCancelRequest = async () => {
    if (!currentPayment) return;
    if (window.confirm("Rostdan ham ushbu to'lov so'rovini bekor qilmoqchimisiz?")) {
      try {
        await deleteDoc(doc(db, "payments", currentPayment.id));
        showToast("To'lov so'rovi muvaffaqiyatli bekor qilindi.", "info");
        onPaymentSubmitted(null);
        setFile(null);
        setPreviewUrl(null);
      } catch (err: any) {
        showToast(`Bekor qilishda xatolik: ${err.message}`, "error");
      }
    }
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast("Iltimos, avval kvitansiya rasmini yuklang.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Process and compress the receipt image
      const compressedBase64 = await processImageFile(file);

      // 2. Prepare database payload
      const paymentId = `pay_${userProfile.uid}_${Date.now()}`;
      const payload: PaymentRequest = {
        id: paymentId,
        uid: userProfile.uid,
        userDisplayName: userProfile.displayName,
        userEmail: userProfile.email,
        userUsername: userProfile.username,
        plan: selectedPlan,
        amount: plans[selectedPlan].price,
        receiptBase64: compressedBase64,
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // 3. Save receipt payment request inside Firestore database
      await setDoc(doc(db, "payments", paymentId), payload);

      // 4. Send compressed receipt image to Telegram Bot securely via Express server-side proxy
      const response = await fetch("/api/telegram-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Telegram relay failed");
      }

      showToast("To'lov kvitansiyasi tekshirish uchun yuborildi! Tez orada faollashtiriladi.", "success");
      onPaymentSubmitted(payload);
    } catch (err: any) {
      console.error("Receipt upload error:", err);
      showToast(`To'lov yuborishda xatolik: ${err.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="premium-portal" className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* Visual Identity Title */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-white mb-3 font-display">
          Premium Erkinlik
        </h1>
        <p className="text-neutral-400 max-w-lg mx-auto text-sm leading-relaxed">
          Platformadan cheksiz foydalanish, 90 ta yangi doimiy imtihonlar, to'liq tahlillar va barcha yordam imkoniyatlarini ochish uchun obunani faollashtiring.
        </p>
      </div>

      {/* 1. Show existing payment request status if present */}
      {currentPayment && (
        <div className="mb-4">
          <div className={`p-6 border rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl ${
            currentPayment.status === "pending" 
              ? "bg-neutral-900 border-amber-500/30 text-amber-500" 
              : currentPayment.status === "approved" 
                ? "bg-neutral-900 border-emerald-500/30 text-emerald-500" 
                : "bg-neutral-900 border-red-500/30 text-red-500"
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-full border shrink-0 ${
                currentPayment.status === "pending" 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                  : currentPayment.status === "approved" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                    : "bg-red-500/10 border-red-500/20 text-red-500"
              }`}>
                {currentPayment.status === "pending" && <Hourglass className="w-8 h-8 animate-spin" />}
                {currentPayment.status === "approved" && <Check className="w-8 h-8" />}
                {currentPayment.status === "rejected" && <XCircle className="w-8 h-8" />}
              </div>
              <div>
                <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block">Kvitansiya Holati</span>
                <span className="text-xl font-bold text-white capitalize">
                  {currentPayment.status === "pending" && "Kutilmoqda (Tez orada tasdiqlanadi)"}
                  {currentPayment.status === "approved" && "Tasdiqlangan (Cheksiz kirish ochiq!)"}
                  {currentPayment.status === "rejected" && "Rad etilgan (Qayta kvitansiya yuklang)"}
                </span>
                <p className="text-xs text-neutral-400 mt-1">
                  Yuborilgan reja: <span className="font-semibold text-white uppercase">{currentPayment.plan}</span> ({currentPayment.amount.toLocaleString()} UZS) — {new Date(currentPayment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {currentPayment.status === "pending" && (
                <button 
                  onClick={handleCancelRequest}
                  className="px-5 py-2.5 bg-red-950/20 hover:bg-red-950/80 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>So'rovni bekor qilish</span>
                </button>
              )}

              {currentPayment.status === "rejected" && (
                <button 
                  onClick={() => {
                    location.reload();
                  }}
                  className="px-5 py-2.5 bg-neutral-950 border border-neutral-850 text-neutral-300 rounded-xl hover:bg-neutral-800 hover:text-white transition-all text-xs font-semibold"
                >
                  Qayta Yuborish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Premium Plan & Payment details layout */}
      {(!currentPayment || currentPayment.status !== "approved") && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Plan Selector (Left side) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Obuna Rejasini Tanlang</h3>
              
              {(Object.keys(plans) as Array<'weekly' | 'monthly' | 'yearly'>).map((planKey) => {
                const p = plans[planKey];
                const isSelected = selectedPlan === planKey;

                return (
                  <button
                    key={planKey}
                    type="button"
                    onClick={() => setSelectedPlan(planKey)}
                    className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all focus:outline-none ${
                      isSelected 
                        ? "bg-amber-500/10 border-amber-500 text-white" 
                        : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300"
                    }`}
                  >
                    <div className="flex-1">
                      <span className="text-base font-bold block">{p.name}</span>
                      <span className="text-xs text-neutral-500 mt-1 block leading-relaxed">{p.desc}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xl font-extrabold text-white">{p.price.toLocaleString()} UZS</span>
                      <span className="text-xs text-neutral-500 block">/ {p.period}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Core Card Details Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-800">
                <span className="text-sm font-semibold text-neutral-300">To'lov uchun karta ma'lumotlari:</span>
                <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 font-medium">Humo / Uzcard</span>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-neutral-500 block">Karta egasi</span>
                  <span className="text-base font-bold text-white uppercase tracking-wide">{cardOwner}</span>
                </div>
                <div className="flex items-center justify-between bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                  <div>
                    <span className="text-xs text-neutral-500 block">Karta raqami</span>
                    <span className="text-lg font-mono font-bold text-amber-500 tracking-wider">{cardNo}</span>
                  </div>
                  <button
                    type="button"
                    onClick={copyCard}
                    className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-all"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Uploader form (Right side) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">To'lov Kvitansiyasi</h3>
              
              <form onSubmit={handleSubmitReceipt} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-md space-y-6">
                <div className="space-y-3">
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Karta raqamiga to'lov qilgach, chek yoki kvitansiya rasmini quyidagi maydonga tashlang yoki bosing:
                  </p>
                  
                  {/* Drag-and-drop / manual trigger frame */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all bg-neutral-950 min-h-[180px] ${
                      isDragging 
                        ? "border-amber-500 bg-amber-500/5" 
                        : "border-neutral-800 hover:border-amber-500/40"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png, image/jpeg, image/jpg"
                      className="hidden"
                    />
                    {previewUrl ? (
                      <div className="relative group w-full flex justify-center">
                        <img 
                          src={previewUrl} 
                          alt="Receipt preview" 
                          referrerPolicy="no-referrer"
                          className="max-h-[140px] rounded-lg border border-neutral-800 object-contain" 
                        />
                      </div>
                    ) : (
                      <div className="p-3.5 bg-neutral-900 rounded-full border border-neutral-850 text-neutral-400">
                        <Upload className="w-6 h-6" />
                      </div>
                    )}
                    <span className="text-xs text-neutral-300 font-bold text-center">
                      {file ? file.name : "Kvitansiya rasmini yuklang"}
                    </span>
                    <span className="text-[10px] text-neutral-500 text-center">
                      Faqat JPG, JPEG, PNG formatlari (Maks. 10MB)
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !file}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 text-neutral-950 disabled:text-neutral-600 font-extrabold rounded-xl transition-all shadow-md shadow-amber-500/5 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Tasdiqlanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 shrink-0" />
                      <span>Kvitansiyani yuborish</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. Premium Benefits Grid (Aesthetics & value proposition) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Nega DTM MASTER Premium?</h3>
            <p className="text-xs text-neutral-400">Tayyorgarligingizni sifatli darajaga ko'taruvchi unikal imkoniyatlar ro'yxati</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg mt-0.5 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Cheksiz DTM Imtihonlar</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed mt-1">Har bir fan kesimidagi professional shuffllangan unikal savollar bazasi to'liq ochiq bo'ladi.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg mt-0.5 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Tahlillar va xatolar ustida ishlash</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed mt-1">Siz topshirgan har bir imtihonning xatolari ustida tahlillarga kirish va o'rganish imkoniyati.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg mt-0.5 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Reyting va Statistika</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed mt-1">Sizning eng yuqori natijalaringiz real vaqtda butun O'zbekiston miqyosida reytingda aks etadi.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg mt-0.5 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">50:50 Yordam Imkoniyatlari</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed mt-1">Savollarga qiynalganda noto'g'ri variantlarni cheksiz o'chirish lifelaynlari faollashadi.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg mt-0.5 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Tezkor Yordam xizmati</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed mt-1">To'lovingiz Telegram bot orqali real vaqtda tekshirilib, o'rtacha 5-10 daqiqada tasdiqlanadi.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg mt-0.5 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Reklamasiz Interfeys</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed mt-1">Dars o'tishda chalg'ituvchi har qanday cheklov va reklamalardan mutlaqo xoli toza interfeys.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tester/Developer Interactive helper block */}
      <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-white uppercase block">Ishlab chiquvchi va Testerlar uchun ko'rsatma:</span>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Sinov rejimida to'lovingizni bir zumda tasdiqlash va Premium imkoniyatlarini sinab ko'rish uchun pastki paneldagi 
            <span className="text-amber-500 font-semibold mx-1">"Admin kirish"</span> havolasini bosing va maxfiy parolni kiriting: 
            <span className="text-white bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded font-mono text-xs ml-1 font-bold">79178195327178195327</span>. 
            So'ngra "To'lov so'rovlari" bo'limidan yuborilgan kvitansiyani yashil chek belgisi orqali faollashtiring.
          </p>
        </div>
      </div>
    </div>
  );
}
