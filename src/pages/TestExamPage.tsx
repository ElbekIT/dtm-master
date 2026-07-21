import React, { useEffect, useState, useRef } from 'react';
import { Direction, ExamQuestion, ExamSession, TestResult } from '../types';
import { generateRandomExamQuestions } from '../data/questionBank';
import { useAuth } from '../context/AuthContext';
import { setupExamAntiCheat } from '../utils/security';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Send,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, doc, setDoc, updateDoc } from '../firebase';

interface TestExamPageProps {
  direction: Direction;
  onFinishExam: (result: TestResult) => void;
  onCancelExam: () => void;
}

const TOTAL_TIME_SECONDS = 4 * 60 * 60; // 4 Hours = 14400 seconds

export const TestExamPage: React.FC<TestExamPageProps> = ({ direction, onFinishExam, onCancelExam }) => {
  const { userProfile } = useAuth();
  
  // Session State
  const [session, setSession] = useState<ExamSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState<boolean>(false);
  const [tabWarningCount, setTabWarningCount] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Exam Session
  useEffect(() => {
    if (!userProfile) return;

    const storageKey = `dtm_active_session_${userProfile.uid}_${direction.id}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ExamSession;
        if (!parsed.isCompleted) {
          setSession(parsed);
          setCurrentIndex(parsed.currentIndex || 0);
          setSelectedOption(parsed.answers[parsed.currentIndex || 0] || '');
          return;
        }
      } catch (e) {
        console.error("Error loading saved session:", e);
      }
    }

    // Generate new session if no saved session exists
    const questions = generateRandomExamQuestions(direction.id).map(q => ({
      ...q,
      shuffledOptions: q.options,
      eliminatedOptions: []
    })) as ExamQuestion[];

    const newSession: ExamSession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: userProfile.uid,
      directionId: direction.id,
      directionTitle: direction.title,
      questions,
      answers: {},
      currentIndex: 0,
      startTime: Date.now(),
      timeRemainingSeconds: TOTAL_TIME_SECONDS,
      helpsRemaining: 3, // 3 lifelines
      helpsUsedInSession: 0,
      isCompleted: false
    };

    setSession(newSession);
    localStorage.setItem(storageKey, JSON.stringify(newSession));
  }, [direction, userProfile]);

  // Timer Countdown
  useEffect(() => {
    if (!session || session.isCompleted) return;

    timerRef.current = setInterval(() => {
      setSession(prev => {
        if (!prev) return null;
        if (prev.timeRemainingSeconds <= 1) {
          clearInterval(timerRef.current!);
          handleAutoFinish(prev);
          return { ...prev, timeRemainingSeconds: 0 };
        }
        const updated = {
          ...prev,
          timeRemainingSeconds: prev.timeRemainingSeconds - 1
        };
        // Auto-save session state
        if (userProfile) {
          localStorage.setItem(`dtm_active_session_${userProfile.uid}_${direction.id}`, JSON.stringify(updated));
        }
        return updated;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.sessionId, userProfile]);

  // Anti-cheat event blockers
  useEffect(() => {
    const cleanup = setupExamAntiCheat(true, () => {
      setTabWarningCount(prev => prev + 1);
      setWarningMessage("OGOHLANTIRISH: Imtihon paytida boshqa oynaga o'tish taqiqlanadi!");
      setTimeout(() => setWarningMessage(''), 5000);
    });
    return cleanup;
  }, []);

  if (!session || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-semibold text-sm">Imtihon savollari shakllantirilmoqda...</p>
      </div>
    );
  }

  const currentQuestion = session.questions[currentIndex];

  // Answer Option Select
  const handleSelectAnswer = (optionText: string) => {
    setSelectedOption(optionText);
    setWarningMessage('');

    const updatedAnswers = { ...session.answers, [currentIndex]: optionText };
    const updatedSession = {
      ...session,
      answers: updatedAnswers,
      currentIndex
    };

    setSession(updatedSession);
    localStorage.setItem(`dtm_active_session_${userProfile.uid}_${direction.id}`, JSON.stringify(updatedSession));
  };

  // Next Question Button (Mandatory Answer Check)
  const handleNext = () => {
    if (!selectedOption) {
      setWarningMessage("Iltimos, keyingi savolga o'tish uchun javob variantlaridan birini tanlang!");
      return;
    }
    setWarningMessage('');

    if (currentIndex < session.questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(session.answers[nextIdx] || '');
    }
  };

  // Previous Question
  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setSelectedOption(session.answers[prevIdx] || '');
      setWarningMessage('');
    }
  };

  // Jump to Question Index
  const handleJumpToQuestion = (idx: number) => {
    setCurrentIndex(idx);
    setSelectedOption(session.answers[idx] || '');
    setWarningMessage('');
  };

  // Use Lifeline / Help ("3 ta yordam")
  const handleUseHelp = () => {
    if (session.helpsRemaining <= 0) {
      setWarningMessage("Siz barcha 3 ta yordam imkoniyatidan foydalanib bo'ldingiz!");
      return;
    }

    const q = session.questions[currentIndex];
    // Find wrong options
    const wrongOptions = q.shuffledOptions.filter(opt => opt !== q.correctAnswer);
    
    // Pick 2 wrong options to eliminate
    const eliminated = wrongOptions.slice(0, 2);

    const updatedQuestions = [...session.questions];
    updatedQuestions[currentIndex] = {
      ...q,
      eliminatedOptions: eliminated
    };

    const updatedSession: ExamSession = {
      ...session,
      questions: updatedQuestions,
      helpsRemaining: session.helpsRemaining - 1,
      helpsUsedInSession: session.helpsUsedInSession + 1
    };

    setSession(updatedSession);
    localStorage.setItem(`dtm_active_session_${userProfile.uid}_${direction.id}`, JSON.stringify(updatedSession));
    setWarningMessage("Yordam ishlatildi! 2 ta noto'g'ri variant olib tashlandi.");
    setTimeout(() => setWarningMessage(''), 4000);
  };

  // Auto Finish when time expires
  const handleAutoFinish = (currentSession: ExamSession) => {
    calculateAndSubmitResult(currentSession);
  };

  // Manual Finish Exam
  const handleFinishConfirm = () => {
    setConfirmSubmitOpen(false);
    calculateAndSubmitResult(session);
  };

  // Calculate Scores & Save Result
  const calculateAndSubmitResult = async (activeSession: ExamSession) => {
    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let emptyCount = 0;

    const subjectBreakdown: Record<string, { total: number; correct: number; score: number }> = {};

    activeSession.questions.forEach((q, idx) => {
      const userAns = activeSession.answers[idx];
      const subj = q.subject || 'mathematics';

      if (!subjectBreakdown[subj]) {
        subjectBreakdown[subj] = { total: 0, correct: 0, score: 0 };
      }
      subjectBreakdown[subj].total += 1;

      // Subject Points
      let pointsPerQuestion = 1.1;
      if (subj === 'mathematics') pointsPerQuestion = 3.1;
      else if (subj === 'physics' || subj === 'professional') pointsPerQuestion = 2.1;
      else if (subj === 'native_language' || subj === 'history' || subj === 'mandatory_math') pointsPerQuestion = 1.1;

      if (!userAns) {
        emptyCount++;
      } else if (userAns === q.correctAnswer) {
        correctCount++;
        subjectBreakdown[subj].correct += 1;
        subjectBreakdown[subj].score += pointsPerQuestion;
        totalScore += pointsPerQuestion;
      } else {
        wrongCount++;
      }
    });

    const timeUsedSeconds = TOTAL_TIME_SECONDS - activeSession.timeRemainingSeconds;
    const roundedScore = Math.round(totalScore * 10) / 10;
    const percentage = Math.round((correctCount / activeSession.questions.length) * 100);
    const passed = roundedScore >= 94; // Passing score threshold = 94

    const result: TestResult = {
      id: `res_${Date.now()}_${userProfile.uid.substring(0, 5)}`,
      userId: userProfile.uid,
      userNickname: userProfile.nickname,
      userPhoto: userProfile.photoURL,
      directionId: direction.id,
      directionTitle: direction.title,
      totalQuestions: activeSession.questions.length,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      emptyAnswers: emptyCount,
      timeUsedSeconds,
      totalScore: roundedScore,
      percentage,
      passed,
      helpsUsed: activeSession.helpsUsedInSession,
      createdAt: Date.now(),
      subjectBreakdown
    };

    // Save result to Firestore
    try {
      await setDoc(doc(db, 'results', result.id), result);
      await setDoc(doc(db, 'leaderboard', userProfile.uid), {
        id: userProfile.uid,
        userId: userProfile.uid,
        nickname: userProfile.nickname,
        photoURL: userProfile.photoURL || '',
        directionTitle: direction.title,
        score: roundedScore,
        correctAnswers: correctCount,
        timeUsedSeconds,
        helpsUsed: activeSession.helpsUsedInSession,
        updatedAt: Date.now()
      });

      // Update user statistics
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        score: Math.max(userProfile.score || 0, roundedScore),
        testsSolved: (userProfile.testsSolved || 0) + 1,
        helpsUsedCount: (userProfile.helpsUsedCount || 0) + activeSession.helpsUsedInSession
      });
    } catch (e) {
      console.error("Error saving result to Firestore:", e);
    }

    // Clear active session storage
    localStorage.removeItem(`dtm_active_session_${userProfile.uid}_${direction.id}`);

    onFinishExam(result);
  };

  // Time format helper
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6 select-none">
      
      {/* Top Exam Header */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 sticky top-18 z-30">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase">
              {direction.title}
            </span>
            {tabWarningCount > 0 && (
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Oyna almashinuvi: {tabWarningCount}</span>
              </span>
            )}
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-800 mt-1">
            Savol {currentIndex + 1} / {session.questions.length}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          
          {/* 3 Lifelines / Helps button */}
          <button
            onClick={handleUseHelp}
            disabled={session.helpsRemaining <= 0}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              session.helpsRemaining > 0 
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-xs' 
                : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Yordam ({session.helpsRemaining}/3)</span>
          </button>

          {/* Timer Display */}
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-mono text-base font-bold shadow-sm">
            <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
            <span>{formatTime(session.timeRemainingSeconds)}</span>
          </div>

          {/* Finish Exam Button */}
          <button
            onClick={() => setConfirmSubmitOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Tugatish</span>
          </button>

        </div>
      </div>

      {/* Warning Message Bar */}
      {warningMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-xs"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
          <span>{warningMessage}</span>
        </motion.div>
      )}

      {/* Main Question & Question Palette Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Question Content Area */}
        <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Mavzu / Fan: <strong className="text-slate-700 uppercase">{currentQuestion.subject}</strong>
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Kattaligi: {currentQuestion.subject === 'mathematics' ? '3.1 ball' : '2.1/1.1 ball'}
            </span>
          </div>

          {/* Question Text */}
          <div className="space-y-4">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-relaxed">
              {currentIndex + 1}. {currentQuestion.question}
            </h3>

            {currentQuestion.image && (
              <img 
                src={currentQuestion.image} 
                alt="Question graphic" 
                className="max-h-64 rounded-xl border border-slate-200 mx-auto"
              />
            )}
          </div>

          {/* Options (A, B, C, D) */}
          <div className="space-y-3 pt-2">
            {currentQuestion.shuffledOptions.map((optionText, optIdx) => {
              const optionLetter = ['A', 'B', 'C', 'D'][optIdx];
              const isSelected = selectedOption === optionText;
              const isEliminated = currentQuestion.eliminatedOptions?.includes(optionText);

              return (
                <div
                  key={optIdx}
                  onClick={() => !isEliminated && handleSelectAnswer(optionText)}
                  className={`p-4 rounded-2xl border-2 transition flex items-center justify-between cursor-pointer ${
                    isEliminated
                      ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-40 pointer-events-none line-through'
                      : isSelected
                      ? 'bg-blue-50 border-blue-600 text-slate-900 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200/90 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {optionLetter}
                    </span>
                    <span className="text-sm font-semibold">{optionText}</span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation Control Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Oldingisi</span>
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition cursor-pointer"
            >
              <span>Keyingisi</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Right Questions Number Grid Palette */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-800 text-sm">Savollar Ro'yxati</h4>
            <span className="text-xs text-slate-400 font-semibold">
              {Object.keys(session.answers).length} / {session.questions.length} javob
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto p-1">
            {session.questions.map((_, idx) => {
              const isCurrent = currentIndex === idx;
              const isAnswered = session.answers[idx] !== undefined && session.answers[idx] !== '';

              return (
                <button
                  key={idx}
                  onClick={() => handleJumpToQuestion(idx)}
                  className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2'
                      : isAnswered
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-md" />
              <span>Javob berilgan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-600 rounded-md" />
              <span>Hozirgi savol</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-slate-100 border border-slate-300 rounded-md" />
              <span>Javob berilmagan</span>
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Modal to Finish Test */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 text-center space-y-5 border border-slate-100 shadow-2xl"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
              <Send className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Imtihonni yakunlaysizmi?</h3>
              <p className="text-slate-500 text-xs">
                Siz {Object.keys(session.answers).length} ta savolga javob berdingiz. Imtihonni topshirgandan so'ng javoblaringizni o'zgartira olmaysiz.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmSubmitOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Davom ettirish
              </button>

              <button
                onClick={handleFinishConfirm}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Ha, Yakunlash
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
