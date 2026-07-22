/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from "../types";

export interface AccessTimeBreakdown {
  type: 'admin' | 'premium' | 'trial' | 'expired';
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  remainingMs: number;
  isWarning: boolean;
  warningMessage: string;
  formattedCountdown: string;
  planTitle: string;
}

/**
 * Checks if a user has active premium access or is within their referral-boosted free trial period.
 */
export function hasActiveAccess(user: User | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;

  if (user.premium) {
    if (user.premiumUntil) {
      const remainingMs = new Date(user.premiumUntil).getTime() - Date.now();
      return remainingMs > 0;
    }
    return true;
  }

  // Calculate trial days
  const baseTrialDays = 2;
  const totalTrialDays = baseTrialDays + (user.trialDaysAdded || 0);
  const trialDurationMs = totalTrialDays * 24 * 60 * 60 * 1000;

  const createdTime = new Date(user.createdAt).getTime();
  const nowTime = Date.now();

  return (nowTime - createdTime) < trialDurationMs;
}

/**
 * Calculates detailed access breakdown with countdown timer metrics and warning messages.
 */
export function getAccessTimeBreakdown(user: User | null): AccessTimeBreakdown {
  if (!user) {
    return {
      type: 'expired',
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      remainingMs: 0,
      isWarning: false,
      warningMessage: "",
      formattedCountdown: "Muddati tugagan",
      planTitle: "Kirish cheklangan"
    };
  }

  if (user.role === "admin") {
    return {
      type: 'admin',
      days: 999,
      hours: 24,
      minutes: 59,
      seconds: 59,
      remainingMs: Infinity,
      isWarning: false,
      warningMessage: "",
      formattedCountdown: "Cheksiz VIP ruxsat",
      planTitle: "Admin Tizim Ruxsati"
    };
  }

  if (user.premium) {
    const planTitle = user.subscriptionPlan === 'haftalik' 
      ? '7 Kunlik Haftalik VIP' 
      : user.subscriptionPlan === 'oylik' 
      ? '30 Kunlik Oylik VIP' 
      : user.subscriptionPlan === 'yillik' 
      ? '365 Kunlik Yillik VIP' 
      : 'VIP Premium';

    if (user.premiumUntil) {
      const remainingMs = new Date(user.premiumUntil).getTime() - Date.now();

      if (remainingMs <= 0) {
        return {
          type: 'expired',
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          remainingMs: 0,
          isWarning: true,
          warningMessage: "Sizning VIP Premium obunangiz muddati tugadi! Testlarni davom ettirish uchun obunani yangilang.",
          formattedCountdown: "00:00:00 (Muddati tugadi)",
          planTitle
        };
      }

      const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

      const isWarning = remainingMs < 24 * 60 * 60 * 1000;
      const warningMessage = isWarning 
        ? `⚠️ Diqqat! Sizning ${planTitle} obunangiz tugashiga ${days > 0 ? `${days} kun ` : ''}${hours} soat ${minutes} daqiqa qoldi! Uzluksiz foydalanish uchun obunani uzaytiring.`
        : "";

      return {
        type: 'premium',
        days,
        hours,
        minutes,
        seconds,
        remainingMs,
        isWarning,
        warningMessage,
        formattedCountdown: `${days > 0 ? `${days} kun ` : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        planTitle
      };
    }

    return {
      type: 'premium',
      days: 9999,
      hours: 24,
      minutes: 59,
      seconds: 59,
      remainingMs: Infinity,
      isWarning: false,
      warningMessage: "",
      formattedCountdown: "Umrbod VIP",
      planTitle
    };
  }

  // Trial calculations
  const baseTrialDays = 2;
  const totalTrialDays = baseTrialDays + (user.trialDaysAdded || 0);
  const trialDurationMs = totalTrialDays * 24 * 60 * 60 * 1000;

  const createdTime = new Date(user.createdAt).getTime();
  const elapsedMs = Date.now() - createdTime;
  const remainingMs = trialDurationMs - elapsedMs;

  if (remainingMs <= 0) {
    return {
      type: 'expired',
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      remainingMs: 0,
      isWarning: true,
      warningMessage: "Bepul sinov muddati tugagan. VIP Premium obunasiga o'ting!",
      formattedCountdown: "00:00:00 (Muddati tugadi)",
      planTitle: "Bepul Sinov"
    };
  }

  const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const isWarning = remainingMs < 24 * 60 * 60 * 1000;
  const warningMessage = isWarning 
    ? `⚠️ Diqqat! Bepul sinov muddatingiz tugashiga ${hours} soat ${minutes} daqiqa qoldi! Impuls yo'qolmasligi uchun VIP obunani xarid qiling.`
    : "";

  return {
    type: 'trial',
    days,
    hours,
    minutes,
    seconds,
    remainingMs,
    isWarning,
    warningMessage,
    formattedCountdown: `${days > 0 ? `${days} kun ` : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    planTitle: `Bepul Sinov (${totalTrialDays} kun)`
  };
}

/**
 * Calculates remaining trial hours/days or subscription expiry text.
 */
export function getAccessRemainingText(user: User | null): string {
  const breakdown = getAccessTimeBreakdown(user);
  if (breakdown.type === 'admin') return "Admin Cheksiz ruxsati";
  if (breakdown.type === 'expired') return "Muddati tugagan";
  if (breakdown.type === 'premium') return `VIP Premium: ${breakdown.formattedCountdown}`;
  return `Bepul sinov: ${breakdown.formattedCountdown}`;
}

