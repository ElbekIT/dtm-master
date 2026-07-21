export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  photoURL: string;
  nickname: string;
  createdAt: number;
  lastLogin: number;
  score: number;
  testsSolved: number;
  country: string;
  role: UserRole;
  referralCode: string;
  usedReferralCode?: string | null;
  trialDays: number;
  trialStartedAt: number;
  isPremium: boolean;
  premiumUntil?: number | null;
  helpsUsedCount: number;
  isBanned?: boolean;
  banReason?: string | null;
  banUntil?: number | null;
  welcomed?: boolean;
}

export type SubjectType = 
  | 'mathematics' 
  | 'physics' 
  | 'native_language' 
  | 'history' 
  | 'mandatory_math' 
  | 'professional';

export interface Question {
  id: string;
  question: string;
  options: [string, string, string, string]; // [A, B, C, D]
  correctAnswer: string; // The text or index of correct answer
  subject: SubjectType | string;
  directionId?: string; // Optional specific direction
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  image?: string;
}

export interface ExamQuestion extends Question {
  shuffledOptions: string[];
  userAnswer?: string;
  eliminatedOptions?: string[]; // Options eliminated by lifeline/yordam
}

export interface Direction {
  id: string;
  title: string;
  description: string;
  iconName: string;
  professionalSubjects: string[];
  totalQuestions: number;
}

export interface ExamSession {
  sessionId: string;
  userId: string;
  directionId: string;
  directionTitle: string;
  questions: ExamQuestion[];
  answers: Record<number, string>; // questionIndex -> selectedOption
  currentIndex: number;
  startTime: number;
  timeRemainingSeconds: number; // 4 hours = 14400s
  helpsRemaining: number; // 3 lifelines per test
  helpsUsedInSession: number;
  isCompleted: boolean;
  completedAt?: number;
}

export interface TestResult {
  id: string;
  userId: string;
  userNickname: string;
  userPhoto?: string;
  directionId: string;
  directionTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  emptyAnswers: number;
  timeUsedSeconds: number;
  totalScore: number; // Calculated score
  percentage: number;
  passed: boolean;
  helpsUsed: number;
  createdAt: number;
  subjectBreakdown: Record<string, { total: number; correct: number; score: number }>;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  nickname: string;
  photoURL?: string;
  directionTitle: string;
  score: number;
  correctAnswers: number;
  timeUsedSeconds: number;
  helpsUsed: number;
  updatedAt: number;
}

export interface PaymentPurchase {
  id: string;
  userId: string;
  userNickname: string;
  userEmail: string;
  planType: 'weekly' | 'monthly' | 'yearly';
  planTitle: string;
  amountUZS: number;
  receiptUrl: string; // Base64 or Firebase Storage URL
  status: 'pending' | 'approved' | 'rejected'; // Tekshirilmoqda | Tasdiqlandi | Rad etildi
  createdAt: number;
  reviewedAt?: number;
}

export interface AdminNotification {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  author: string;
}
