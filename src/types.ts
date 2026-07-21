/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  uid: string;
  email: string | null;
  photoURL: string | null;
  nickname: string;
  createdAt: string;
  lastLogin: string;
  score: number;
  testsSolved: number;
  country: string;
  role: 'user' | 'admin';
  hintsUsed?: number;
  trialDaysAdded?: number;
  usedPromoCode?: string;
  promoCode?: string;
  subscriptionStatus?: 'none' | 'Tekshirilyapti' | 'Tastiqlandi' | 'Tekshirilmadi';
  subscriptionPlan?: 'haftalik' | 'oylik' | 'yillik';
  premium?: boolean;
  premiumUntil?: string;
  bannedUntil?: string | null;
  referredBy?: string;
}

export interface Direction {
  id: string;
  name: string;
  description: string;
  subjects: string[]; // Subject names included in this direction
}

export interface Question {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer?: string; // Stored securely, only accessible on backend/admin
  subject: string;
  direction?: string; // Optional, some questions are direction-specific
  difficulty: 'easy' | 'medium' | 'hard';
  image?: string;
}

export interface TestSession {
  id: string;
  uid: string;
  directionId: string;
  directionName: string;
  startTime: number;
  durationSeconds: number; // e.g., 3 hours = 10800 seconds
  questions: Question[]; // Note: correctAnswer will be stripped for normal users
  answers: Record<string, string>; // questionId -> chosenOption ('A', 'B', 'C', 'D')
  completed: boolean;
  score?: number;
  correctCount?: number;
  wrongCount?: number;
  emptyCount?: number;
  timeUsed?: string;
  hintsUsed?: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  uid: string;
  rank?: number;
  nickname: string;
  direction: string;
  score: number;
  correctCount: number;
  timeUsed: string;
  hintsUsed?: number;
  updatedAt: string;
}

export interface DtmSubject {
  id: string;
  name: string;
  questionsCount: number;
  pointsPerQuestion: number;
}

export interface Notification {
  id: string;
  userId: string; // 'all' or user's uid
  title: string;
  message: string;
  createdAt: string;
}

export interface Purchase {
  id: string; // usually user's uid
  uid: string;
  nickname: string;
  email: string | null;
  plan: 'haftalik' | 'oylik' | 'yillik';
  price: number;
  receiptImage: string; // Base64 representation
  status: 'Tekshirilyapti' | 'Tastiqlandi' | 'Tekshirilmadi';
  createdAt: string;
  updatedAt: string;
}

