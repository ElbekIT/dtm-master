import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PaymentPurchase } from '../types';
import { db, doc, setDoc, collection, query, where, orderBy, getDocs, onSnapshot } from '../firebase';
import { sendTelegramPaymentNotification } from '../utils/telegram';
import { ReferralSection } from '../components/ReferralSection';
import { 
  Crown, 
  CreditCard, 
  Upload, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Send, 
  ShieldCheck, 
  Sparkles,
  AlertCircle,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

export const PremiumPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [purchases, setPurchases] = useState<PaymentPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const PLANS = [
    {
      type: 'weekly' as const,
      title: 'Haftalik Obuna',
      price: 29000,
      period: '7 kun',
      features: ["Cheksiz DTM va Perevod testlar", "To'liq statistikalar", "3 ta Yordam har bir testda", "Reytingda ko'rinish"]
    },
    {
      type: 'monthly' as const,
      title: 'Oylik Obuna',
      price: 50000,
      period: '30 kun',
      popular: true,
      features: ["Cheksiz DTM va Perevod testlar", "To'liq statistikalar", "3 ta Yordam har bir testda", "Prioritetli qo'llab-quvvatlash", "Maxsus sertifikatlar"]
    },
    {
      type: 'yearly' as const,
      title: 'Yillik Obuna',
      price: 100000,
      period: '365 kun',
      features: ["Cheksiz DTM va Perevod testlar", "Barcha yangilanishlar bepul", "3 ta Yordam har bir testda", "Maksimal tejash (60% chegirma)", "Shaxsiy maslahatlar"]
    }
  ];

  const activePlan = PLANS.find(p => p.type === selectedPlan)!;

  useEffect(() => {
    if (!userProfile) return;

    const q = query(
      collection(db, 'purchases'),
      where('userId', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PaymentPurchase[] = [];
      snapshot.forEach(d => list.push(d.data() as PaymentPurchase));
      setPurchases(list);
    }, (err) => console.error("Error loading purchases:", err));

    return () => unsubscribe();
  }, [userProfile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/jpeg') && !file.type.includes('image/png') && !file.type.includes('image/jpg')) {
      setStatusMessage({ type: 'error', text: "Faqat JPG yoki PNG formatdagi rasm yuklang!" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
      setStatusMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    if (!receiptImage) {
      setStatusMessage({ type: 'error', text: "Iltimos, to'lov cheki rasmini yuklang!" });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    const purchaseId = `purchase_${Date.now()}_${userProfile.uid.substring(0, 5)}`;
    const newPurchase: PaymentPurchase = {
      id: purchaseId,
      userId: userProfile.uid,
      userNickname: userProfile.nickname,
      userEmail: userProfile.email,
      planType: activePlan.type,
      planTitle: activePlan.title,
      amountUZS: activePlan.price,
      receiptUrl: receiptImage,
      status: 'pending', // Tekshirilmoqda
      createdAt: Date.now()
    };

    try {
      // 1. Save purchase request to Firestore
      await setDoc(doc(db, 'purchases', purchaseId), newPurchase);

      // 2. Send Telegram Bot notification
      await sendTelegramPaymentNotification({
        userNickname: userProfile.nickname,
        userEmail: userProfile.email,
        planTitle: activePlan.title,
        amountUZS: activePlan.price,
        receiptUrl: receiptImage
      });

      setStatusMessage({ 
        type: 'success', 
        text: "To'lov cheki muvaffaqiyatli jo'natildi! Telegram va Admin panelga yuborildi. Tekshiruvdan so'ng 5-10 daqiqada faollashtiriladi." 
      });
      setReceiptImage('');
    } catch (err: any) {
      console.error("Purchase submit error:", err);
      setStatusMessage({ type: 'error', text: "Xatolik yuz berdi. Iltimos qayta urinib ko'ring." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-10">
      
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
          <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>DTM MASTER Premium</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Cheksiz Imkoniyatlar va Premium Obuna
        </h2>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Obunani tanlang, ko'rsatilgan plastik kartaga to'lov qiling va chek rasmini yuklang! Yoki do'stlaringizni taklif qilib BEPUL kunlar oling.
        </p>
      </div>

      {/* Invite Friends / Referral Section */}
      <ReferralSection />

      {/* Subscription Plans Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.type;
          return (
            <motion.div
              key={plan.type}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedPlan(plan.type)}
              className={`p-6 rounded-3xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                isSelected 
                  ? 'border-amber-500 bg-amber-50/20 shadow-xl ring-2 ring-amber-500/20' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-white font-extrabold text-[10px] uppercase rounded-full tracking-wider shadow-sm">
                  Eng Ommabop
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-lg">{plan.title}</h3>
                  <span className="text-xs text-amber-800 bg-amber-100 font-bold px-2.5 py-1 rounded-xl">
                    {plan.period}
                  </span>
                </div>

                <div className="text-3xl font-black text-slate-900">
                  {plan.price.toLocaleString()} <span className="text-sm font-bold text-slate-500">UZS</span>
                </div>

                <ul className="space-y-2 pt-2 text-xs font-medium text-slate-600">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className={`w-full py-3 rounded-xl font-bold text-xs text-center transition ${
                  isSelected ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-700'
                }`}>
                  {isSelected ? 'Tanlandi' : 'Tanlash'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Payment Information Card & Receipt Upload */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card Details */}
        <div className="space-y-4 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-8">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3>To'lov Uchun Plastik Karta</h3>
          </div>

          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 text-white p-6 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">HUMO / UZCARD</span>
              <Crown className="w-6 h-6 text-amber-400" />
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400">Karta Raqami:</span>
              <div className="font-mono text-xl md:text-2xl font-extrabold tracking-widest text-amber-300">
                4073 4200 8456 9577
              </div>
            </div>

            <div className="flex justify-between items-end text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Karta Egasi:</span>
                <span className="font-bold text-white uppercase text-sm">Elbek Qoriyev</span>
              </div>
              <span className="text-blue-300 font-semibold">DTM MASTER</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Ilovalar (Click, Payme, Uzum va h.k.) orqali yuqoridagi kartaga <strong className="text-slate-800">{activePlan.price.toLocaleString()} UZS</strong> o'tkazing va to'lov cheki rasmini o'ng tarafdagi bo'limga yuklang.
          </p>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmitReceipt} className="space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Upload className="w-5 h-5 text-blue-600" />
            <h3>To'lov Cheki Rasmini Yuklash (JPG / PNG)</h3>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-3 hover:border-blue-400 transition bg-slate-50/50">
            {receiptImage ? (
              <div className="space-y-3">
                <img src={receiptImage} alt="Receipt preview" className="max-h-48 rounded-xl mx-auto border shadow-md" />
                <button
                  type="button"
                  onClick={() => setReceiptImage('')}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Rasmni almashtirish
                </button>
              </div>
            ) : (
              <label className="cursor-pointer space-y-2 block">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <span className="text-xs font-bold text-slate-700 block">Rasm faylini tanlang (JPG / PNG)</span>
                <span className="text-[11px] text-slate-400 block">Telefoningiz yoki kompyuteringizdan chek rasmini yuklang</span>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !receiptImage}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer text-sm"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? "Yuborilmoqda..." : "To'lov Chekini Jo'natish"}</span>
          </button>
        </form>

      </div>

      {/* Purchases Status Section ("Mening Obunalarim") */}
      {purchases.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">Mening Obunalarim va To'lovlarim Statusi</h3>
          </div>

          <div className="space-y-3">
            {purchases.map((purchase) => {
              const isApproved = purchase.status === 'approved';
              const isRejected = purchase.status === 'rejected';
              const isPending = purchase.status === 'pending';

              return (
                <div 
                  key={purchase.id} 
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">{purchase.planTitle}</h4>
                    <p className="text-xs text-slate-500">
                      {purchase.amountUZS.toLocaleString()} UZS • {new Date(purchase.createdAt).toLocaleString('uz-UZ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        <span>Tekshirilmoqda</span>
                      </span>
                    )}

                    {isApproved && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tasdiqlandi</span>
                      </span>
                    )}

                    {isRejected && (
                      <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Rad Etildi</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
