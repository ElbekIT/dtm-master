import { doc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "../types";

export interface RedeemResult {
  success: boolean;
  message: string;
  updatedUser?: User;
  rewardDays?: number;
}

export interface PendingReferral {
  id: string;
  ownerUid: string;
  ownerNickname: string;
  friendUid: string;
  friendNickname: string;
  usedPromoCode: string;
  rewardDays: number;
  shownToOwner: boolean;
  createdAt: string;
}

/**
 * Redeems a referral or master promo code for the current user.
 */
export async function redeemPromoCode(inputCode: string, currentUser: User): Promise<RedeemResult> {
  const cleanInput = inputCode.trim().toUpperCase();

  if (!cleanInput) {
    return { success: false, message: "Iltimos, promo-kodni kiriting!" };
  }

  if (currentUser.usedPromoCode || currentUser.referredBy) {
    return { success: false, message: "Siz avval promo-kod ishlatgansiz!" };
  }

  // 1. Check Master Promo Codes
  const masterPromoCodes = ["PROMOGOD", "PROMOCODE", "PROMOKOD", "DTM2026", "ELBEK"];
  if (masterPromoCodes.includes(cleanInput)) {
    try {
      const updatedUser: User = {
        ...currentUser,
        premium: true,
        subscriptionStatus: "Tastiqlandi",
        subscriptionPlan: "yillik",
        usedPromoCode: cleanInput,
        referredBy: cleanInput,
        trialDaysAdded: 9999
      };

      await setDoc(doc(db, "users", currentUser.uid), {
        premium: true,
        subscriptionStatus: "Tastiqlandi",
        subscriptionPlan: "yillik",
        usedPromoCode: cleanInput,
        referredBy: cleanInput,
        trialDaysAdded: 9999
      }, { merge: true });

      return {
        success: true,
        rewardDays: 365,
        updatedUser,
        message: "TABRIKLAYMIZ! Siz 'PROMOGOD' kodingizni faollashtirdingiz va sizga 1 YILLIK BEPUL VIP Premium taqdim etildi! 🎁🎉"
      };
    } catch (err) {
      console.error("Master promo redemption failed:", err);
      return { success: false, message: "Tizimda xatolik yuz berdi. Qayta urinib ko'ring." };
    }
  }

  // 2. Check User Referral Promo Code
  try {
    const q = query(collection(db, "users"), where("promoCode", "==", cleanInput));
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      return { success: false, message: "Noto'g'ri yoki mavjud bo'lmagan promo-kod!" };
    }

    let referrerDoc: User | null = null;
    querySnap.forEach((docSnap) => {
      referrerDoc = docSnap.data() as User;
    });

    if (!referrerDoc) {
      return { success: false, message: "Promo-kod egasi topilmadi." };
    }

    if ((referrerDoc as User).uid === currentUser.uid) {
      return { success: false, message: "O'zingizning promo-kodingizni ishlata olmaysiz!" };
    }

    // Update Friend (current user) with +1 trial day
    const updatedTrialDays = (currentUser.trialDaysAdded || 0) + 1;
    const updatedUser: User = {
      ...currentUser,
      trialDaysAdded: updatedTrialDays,
      usedPromoCode: cleanInput,
      referredBy: cleanInput
    };

    await setDoc(doc(db, "users", currentUser.uid), {
      trialDaysAdded: updatedTrialDays,
      usedPromoCode: cleanInput,
      referredBy: cleanInput
    }, { merge: true });

    // Update Referrer (Promo code owner) with +2 trial days
    const referrerNewTrialDays = ((referrerDoc as User).trialDaysAdded || 0) + 2;
    await setDoc(doc(db, "users", (referrerDoc as User).uid), {
      trialDaysAdded: referrerNewTrialDays
    }, { merge: true });

    // Save Referral record for promo owner's pop-up notification when they log in later
    const refId = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pendingReferral: PendingReferral = {
      id: refId,
      ownerUid: (referrerDoc as User).uid,
      ownerNickname: (referrerDoc as User).nickname || "Foydalanuvchi",
      friendUid: currentUser.uid,
      friendNickname: currentUser.nickname || "Do'stingiz",
      usedPromoCode: cleanInput,
      rewardDays: 2,
      shownToOwner: false,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "referrals", refId), pendingReferral);

    // Save standard notification in Notifications collection
    const notifId = `notif_${(referrerDoc as User).uid}_${Date.now()}`;
    await setDoc(doc(db, "notifications", notifId), {
      id: notifId,
      userId: (referrerDoc as User).uid,
      title: "Do'st taklifi uchun bonus! 🎁",
      message: `Sizning promo kodingizni (${cleanInput}) ${currentUser.nickname} ishlatdi. Sizga 2 kunlik bepul VIP Premium taqdim etildi!`,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      rewardDays: 1,
      updatedUser,
      message: `TABRIKLAYMIZ! Siz promo-kodni (${cleanInput}) muvaffaqiyatli faollashtirdingiz! Sizga 1 kunlik Bepul VIP Premium taqdim etildi! 🎁🚀`
    };
  } catch (err) {
    console.error("Promo code redemption error:", err);
    return { success: false, message: "Tizimda xatolik yuz berdi. Qayta urinib ko'ring." };
  }
}
