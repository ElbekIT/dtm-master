/**
 * DTM MASTER - Type Declarations
 */

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  username: string; // Unique nickname
  createdAt: number;
  trialExpiresAt: number;
  premiumStatus: 'free' | 'pending' | 'premium';
  premiumExpiresAt: number;
  promoCode: string; // Unique promo code
  referredBy: string | null;
  helpChances: number; // 0 to 3
  helpUsedTotal: number;
  examCount: number;
  avgScore: number;
  highestScore: number;
  lowestTime: number; // in seconds, for exams with highest score
  isBanned: boolean;
  banType: 'none' | 'temporary' | 'permanent';
  banUntil: number | null;
  lastUpdated: number;
}

export interface Question {
  id: string;
  subject: string; // e.g. "Matematika", "Fizika", "Tarix", "Ona tili", "Ingliz tili"
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface ExamSession {
  id: string;
  uid: string;
  status: 'active' | 'completed';
  startTime: number;
  durationLeft: number; // seconds (starts at 14400 = 4 hours)
  questionIds: string[];
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>; // questionId -> selected answer
  currentQuestionIndex: number;
  helpUsedOnQuestions: Record<string, string[]>; // questionId -> list of eliminated option keys (e.g. ["A", "C"])
  helpChancesLeft: number; // starts at 3
}

export interface ExamResult {
  id: string;
  uid: string;
  userDisplayName: string;
  userEmail: string;
  userUsername: string;
  score: number; // out of 90
  timeSpent: number; // in seconds
  helpUsed: number;
  createdAt: number;
  subjectsSummary?: Record<string, { correct: number; total: number }>;
}

export interface PaymentRequest {
  id: string;
  uid: string;
  userDisplayName: string;
  userEmail: string;
  userUsername: string;
  plan: 'weekly' | 'monthly' | 'yearly';
  amount: number; // e.g. 29000, 50000, 100000
  receiptBase64: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  author: string;
}

export interface HelpHistoryLog {
  id: string;
  uid: string;
  userDisplayName: string;
  examId: string;
  questionId: string;
  eliminatedOptions: string[];
  timestamp: number;
}
