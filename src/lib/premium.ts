/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from "../types";

/**
 * Checks if a user has active premium access or is within their referral-boosted free trial period.
 */
export function hasActiveAccess(user: User | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.premium) return true;

  // Calculate trial days
  const baseTrialDays = 2;
  const totalTrialDays = baseTrialDays + (user.trialDaysAdded || 0);
  const trialDurationMs = totalTrialDays * 24 * 60 * 60 * 1000;

  const createdTime = new Date(user.createdAt).getTime();
  const nowTime = Date.now();

  return (nowTime - createdTime) < trialDurationMs;
}

/**
 * Calculates remaining trial hours/days or subscription expiry.
 */
export function getAccessRemainingText(user: User | null): string {
  if (!user) return "";
  if (user.role === "admin") return "Admin Cheksiz ruxsati";
  if (user.premium) {
    if (user.premiumUntil) {
      const remainingMs = new Date(user.premiumUntil).getTime() - Date.now();
      if (remainingMs <= 0) return "Muddati tugagan";
      const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
      return `Premium faol: ${remainingDays} kun qoldi`;
    }
    return "Premium faol (Umrbod)";
  }

  // Trial calculations
  const baseTrialDays = 2;
  const totalTrialDays = baseTrialDays + (user.trialDaysAdded || 0);
  const trialDurationMs = totalTrialDays * 24 * 60 * 60 * 1000;

  const createdTime = new Date(user.createdAt).getTime();
  const elapsedMs = Date.now() - createdTime;
  const remainingMs = trialDurationMs - elapsedMs;

  if (remainingMs <= 0) {
    return "Bepul sinov muddati tugagan";
  }

  const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
  if (remainingHours > 24) {
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    return `Bepul sinov: ${remainingDays} kun qoldi`;
  }
  return `Bepul sinov: ${remainingHours} soat qoldi`;
}
