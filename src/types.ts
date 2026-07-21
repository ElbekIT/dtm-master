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
  updatedAt: string;
}

export interface DtmSubject {
  id: string;
  name: string;
  questionsCount: number;
  pointsPerQuestion: number;
}
