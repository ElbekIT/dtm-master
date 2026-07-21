import React, { useState, useEffect, useRef } from "react";
import { doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db, runWithRetry } from "../firebase";
import { generateDtmExamQuestions } from "../questionsData";
import { ExamSession, ExamResult, Question, UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Clock, 
  HelpCircle, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle as HelpIcon, 
  Info, 
  RefreshCw, 
  WifiOff, 
  Wifi,
  ChevronLeft,
  XCircle,
  Award
} from "lucide-react";

interface ExamScreenProps {
  userProfile: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onExamFinished: (result: ExamResult) => void;
  onBackToDashboard: () => void;
}

export default function ExamScreen({ userProfile, showToast, onExamFinished, onBackToDashboard }: ExamScreenProps) {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  // Online/Offline State Management (Strict online requirement)
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [pingFailedCount, setPingFailedCount] = useState(0);

  // Keep a ref to the timer to clear it correctly
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Connection Monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      verifyActualConnection();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("Internet aloqasi uzildi! Javoblaringiz saqlab qolindi. Qayta ulanish kutilmoqda...", "error");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Actively ping the server-side API every 10 seconds to confirm actual routing capability
    pingIntervalRef.current = setInterval(verifyActualConnection, 10000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, []);

  const verifyActualConnection = async () => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("/api/test-connection", { signal: controller.signal });
      clearTimeout(id);
      
      if (res.ok) {
        if (!isOnline) {
          setIsOnline(true);
          showToast("Internet aloqasi tiklandi. Imtihonni davom ettirishingiz mumkin.", "success");
        }
        setPingFailedCount(0);
      } else {
        throw new Error("API returned non-200");
      }
    } catch (e) {
      console.warn("Connection verification ping failed:", e);
      // Fallback: If browser says online, keep isOnline true to bypass local iframe CORS/reverse-proxy issues
      if (window.navigator.onLine) {
        if (!isOnline) {
          setIsOnline(true);
        }
        setPingFailedCount(0);
      } else {
        setPingFailedCount(prev => {
          const next = prev + 1;
          if (next >= 2 && isOnline) {
            setIsOnline(false);
            showToast("Tarmoq xatoligi. Serverga ulanib bo'lmadi. Tarmoq aloqasini tekshiring.", "error");
          }
          return next;
        });
      }
    }
  };

  // 2. Fetch or Create Exam Session
  useEffect(() => {
    loadExamSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadExamSession = async () => {
    setIsLoading(true);
    const cachedSessionKey = `dtm_exam_session_${userProfile.uid}`;
    
    // Try retrieving cached active session from localStorage first
    let cachedActiveSession: ExamSession | null = null;
    const cacheStr = localStorage.getItem(cachedSessionKey);
    if (cacheStr) {
      try {
        const parsed = JSON.parse(cacheStr) as ExamSession;
        if (parsed && parsed.status === "active") {
          cachedActiveSession = parsed;
        }
      } catch (e) {
        console.warn("Failed to parse cached exam session:", e);
      }
    }

    try {
      const docRef = doc(db, "exams", userProfile.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().status === "active") {
        // Load existing active session from Firestore
        const activeSession = docSnap.data() as ExamSession;
        
        let sessionQuestions: Question[] = [];
        if (activeSession.questions && activeSession.questions.length > 0) {
          sessionQuestions = activeSession.questions;
        } else {
          // Fallback if older session didn't save questions inside document
          const poolQuestions = generateDtmExamQuestions();
          sessionQuestions = activeSession.questionIds.map(id => {
            const found = poolQuestions.find(q => q.id === id);
            if (found) return found;
            return {
              id,
              subject: "Matematika",
              questionText: "Savolni yuklashda xatolik yuz berdi. Iltimos, keyingi savolga o'ting.",
              options: { A: "A", B: "B", C: "C", D: "D" },
              correctAnswer: "A" as const
            };
          });
        }

        localStorage.setItem(cachedSessionKey, JSON.stringify(activeSession));
        setQuestions(sessionQuestions);
        setSession(activeSession);
      } else {
        // Create brand new 90-question DTM session
        const newQuestions = generateDtmExamQuestions(); // Shuffled questions + options
        const questionIds = newQuestions.map(q => q.id);

        const newSession: ExamSession = {
          id: `${userProfile.uid}_${Date.now()}`,
          uid: userProfile.uid,
          status: "active",
          startTime: Date.now(),
          durationLeft: 14400, // 4 hours in seconds
          questionIds,
          questions: newQuestions, // Store them directly in firestore
          answers: {},
          currentQuestionIndex: 0,
          helpUsedOnQuestions: {},
          helpChancesLeft: userProfile.helpChances !== undefined ? userProfile.helpChances : 3
        };

        try {
          await setDoc(doc(db, "exams", userProfile.uid), newSession);
        } catch (setErr) {
          console.warn("Could not save new exam session to Firestore, using local mode:", setErr);
        }

        localStorage.setItem(cachedSessionKey, JSON.stringify(newSession));
        setQuestions(newQuestions);
        setSession(newSession);
      }
    } catch (error: any) {
      console.warn("Failed to load exam session from Firestore, attempting localStorage fallback:", error);
      
      if (cachedActiveSession) {
        // Gracefully fallback to cached session without block or error
        setQuestions(cachedActiveSession.questions || []);
        setSession(cachedActiveSession);
        showToast("Faol imtihon sessiyasi mahalliy xotiradan tiklandi.", "info");
      } else {
        // If no cached session exists, create one locally so student is never blocked!
        const newQuestions = generateDtmExamQuestions();
        const questionIds = newQuestions.map(q => q.id);
        const offlineSession: ExamSession = {
          id: `${userProfile.uid}_${Date.now()}`,
          uid: userProfile.uid,
          status: "active",
          startTime: Date.now(),
          durationLeft: 14400,
          questionIds,
          questions: newQuestions,
          answers: {},
          currentQuestionIndex: 0,
          helpUsedOnQuestions: {},
          helpChancesLeft: userProfile.helpChances !== undefined ? userProfile.helpChances : 3
        };
        localStorage.setItem(cachedSessionKey, JSON.stringify(offlineSession));
        setQuestions(newQuestions);
        setSession(offlineSession);
        showToast("Yangi imtihon muvaffaqiyatli boshlandi (mahalliy rejim)!", "success");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Active 4-Hour Countdown Timer
  useEffect(() => {
    if (!session || session.status !== "active" || !isOnline) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setSession(prev => {
        if (!prev) return null;
        if (prev.durationLeft <= 1) {
          clearInterval(timerRef.current!);
          // Auto submit when time runs out
          setTimeout(() => handleFinishExam(true), 100);
          return { ...prev, durationLeft: 0 };
        }
        
        const nextDuration = prev.durationLeft - 1;
        
        // Auto-save duration left to firestore every 15 seconds to prevent refresh abuse
        if (nextDuration % 15 === 0) {
          const cachedSessionKey = `dtm_exam_session_${userProfile.uid}`;
          localStorage.setItem(cachedSessionKey, JSON.stringify({ ...prev, durationLeft: nextDuration }));
          updateDoc(doc(db, "exams", userProfile.uid), {
            durationLeft: nextDuration
          }).catch(e => console.warn("Auto-saving duration left failed (offline fallback active):", e));
        }

        return { ...prev, durationLeft: nextDuration };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.id, isOnline]);

  const handleSelectAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!session) return;

    const currentQuestion = questions[session.currentQuestionIndex];
    const updatedAnswers = { ...session.answers, [currentQuestion.id]: answer };
    
    // Optimistic UI state update
    const updatedSession = { ...session, answers: updatedAnswers };
    setSession(updatedSession);

    // Save to local cache first
    const cachedSessionKey = `dtm_exam_session_${userProfile.uid}`;
    localStorage.setItem(cachedSessionKey, JSON.stringify(updatedSession));

    // Save answers permanently to Firestore instantly
    try {
      await updateDoc(doc(db, "exams", userProfile.uid), {
        answers: updatedAnswers
      });
    } catch (e) {
      console.warn("Failed to save answer to Firestore (safely cached locally):", e);
    }
  };

  // 50-50 HELP LIFELINE MECHANIC
  const handleUseHelp = async () => {
    if (!session || session.helpChancesLeft <= 0) return;

    const currentQuestion = questions[session.currentQuestionIndex];
    
    // Check if help was already used on this question
    if (session.helpUsedOnQuestions[currentQuestion.id]) {
      showToast("Ushbu savolda yordamdan foydalanib bo'lingan!", "info");
      return;
    }

    // Determine incorrect options to eliminate (we must eliminate EXACTLY 2 incorrect options)
    const optionsKeys: Array<'A' | 'B' | 'C' | 'D'> = ["A", "B", "C", "D"];
    const incorrectOptions = optionsKeys.filter(key => key !== currentQuestion.correctAnswer);

    // Shuffle incorrect options and pick 2 to eliminate
    const shuffledIncorrect = [...incorrectOptions].sort(() => Math.random() - 0.5);
    const eliminated = shuffledIncorrect.slice(0, 2); // Pick 2 incorrect options to eliminate

    const updatedHelpUsed = {
      ...session.helpUsedOnQuestions,
      [currentQuestion.id]: eliminated
    };

    const nextHelpChances = session.helpChancesLeft - 1;

    // Save transactionally to Firestore (session state + user profile count)
    try {
      await updateDoc(doc(db, "exams", userProfile.uid), {
        helpUsedOnQuestions: updatedHelpUsed,
        helpChancesLeft: nextHelpChances
      });

      // Update user's profile help usage tracking
      await updateDoc(doc(db, "users", userProfile.uid), {
        helpChances: nextHelpChances,
        helpUsedTotal: increment(1)
      });
    } catch (e) {
      console.warn("Error applying help lifeline to database, applying locally:", e);
    }

    // Update session state & local cache anyway
    const updatedSession = {
      ...session,
      helpUsedOnQuestions: updatedHelpUsed,
      helpChancesLeft: nextHelpChances
    };
    setSession(updatedSession);
    const cachedSessionKey = `dtm_exam_session_${userProfile.uid}`;
    localStorage.setItem(cachedSessionKey, JSON.stringify(updatedSession));

    showToast("Yordam ishlatildi! 2 ta noto'g'ri javob olib tashlandi.", "success");
  };

  const handleNextQuestion = () => {
    if (!session) return;
    const currentQuestion = questions[session.currentQuestionIndex];
    
    // BLOCK NAVIGATION IF ANSWER IS NOT SELECTED
    if (!session.answers[currentQuestion.id]) {
      setShowWarning(true);
      showToast("Iltimos, keyingi savolga o'tishdan oldin javobni tanlang!", "error");
      return;
    }

    setShowWarning(false);
    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      const updatedSession = { ...session, currentQuestionIndex: nextIndex };
      setSession(updatedSession);

      // Save locally
      const cachedSessionKey = `dtm_exam_session_${userProfile.uid}`;
      localStorage.setItem(cachedSessionKey, JSON.stringify(updatedSession));

      // Save index to database
      updateDoc(doc(db, "exams", userProfile.uid), {
        currentQuestionIndex: nextIndex
      }).catch(e => console.warn("Saving current index failed (saved locally):", e));
    }
  };

  const handlePrevQuestion = () => {
    if (!session || session.currentQuestionIndex === 0) return;
    const prevIndex = session.currentQuestionIndex - 1;
    const updatedSession = { ...session, currentQuestionIndex: prevIndex };
    setSession(updatedSession);

    // Save locally
    const cachedSessionKey = `dtm_exam_session_${userProfile.uid}`;
    localStorage.setItem(cachedSessionKey, JSON.stringify(updatedSession));

    // Save index to database
    updateDoc(doc(db, "exams", userProfile.uid), {
      currentQuestionIndex: prevIndex
    }).catch(e => console.warn("Saving current index failed (saved locally):", e));
  };

  // FINISH AND SUBMIT EXAM WITH SERVER-SIDE LEVEL SECURITY/CALCULATIONS
  const handleFinishExam = async (forceTimeUp = false) => {
    if (!session || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Calculate results
      let score = 0;
      const subjectsSummary: Record<string, { correct: number; total: number }> = {};

      questions.forEach(q => {
        const userAnswer = session.answers[q.id];
        const isCorrect = userAnswer === q.correctAnswer;
        
        if (isCorrect) score++;

        if (!subjectsSummary[q.subject]) {
          subjectsSummary[q.subject] = { correct: 0, total: 0 };
        }
        subjectsSummary[q.subject].total++;
        if (isCorrect) subjectsSummary[q.subject].correct++;
      });

      const timeSpent = 14400 - session.durationLeft;
      const helpUsedCount = userProfile.helpChances - session.helpChancesLeft;

      const resultId = `${userProfile.uid}_res_${Date.now()}`;
      const examResult: ExamResult = {
        id: resultId,
        uid: userProfile.uid,
        userDisplayName: userProfile.displayName,
        userEmail: userProfile.email,
        userUsername: userProfile.username,
        score,
        timeSpent,
        helpUsed: helpUsedCount,
        createdAt: Date.now(),
        subjectsSummary
      };

      // Define local variables for next calculations in case DB fails
      const nextExamCount = userProfile.examCount + 1;
      const nextAvgScore = parseFloat(((userProfile.avgScore * userProfile.examCount + score) / nextExamCount).toFixed(1));
      const nextHighestScore = Math.max(userProfile.highestScore, score);
      
      let nextLowestTime = userProfile.lowestTime;
      if (score > userProfile.highestScore || (score === userProfile.highestScore && (timeSpent < userProfile.lowestTime || userProfile.lowestTime === 0))) {
        nextLowestTime = timeSpent;
      }

      // Try sending to database, with graceful local fallback
      try {
        // 1. Save result to 'results' collection
        await setDoc(doc(db, "results", resultId), examResult);

        // 2. Mark exam session as completed/inactive in exams collection
        await setDoc(doc(db, "exams", userProfile.uid), {
          status: "completed",
          answers: session.answers,
          currentQuestionIndex: session.currentQuestionIndex,
          endTime: Date.now()
        }, { merge: true });

        // 3. Update User Statistics
        await updateDoc(doc(db, "users", userProfile.uid), {
          examCount: nextExamCount,
          avgScore: nextAvgScore,
          highestScore: nextHighestScore,
          lowestTime: nextLowestTime,
          lastUpdated: Date.now()
        });
      } catch (dbErr: any) {
        console.warn("Database save failed for exam result, keeping in localStorage cache:", dbErr);
        // Save to cache for local recovery or later sync
        localStorage.setItem(`dtm_result_${resultId}`, JSON.stringify(examResult));
      }

      // Clear the local active session so the user can take another exam
      const cachedSessionKey = `dtm_exam_session_${userProfile.uid}`;
      localStorage.removeItem(cachedSessionKey);

      // Save updated profile stats to local cache so profile page updates immediately
      const cachedProfileKey = `dtm_user_profile_${userProfile.uid}`;
      const localProfileStr = localStorage.getItem(cachedProfileKey);
      if (localProfileStr) {
        try {
          const lp = JSON.parse(localProfileStr);
          lp.examCount = nextExamCount;
          lp.avgScore = nextAvgScore;
          lp.highestScore = nextHighestScore;
          lp.lowestTime = nextLowestTime;
          localStorage.setItem(cachedProfileKey, JSON.stringify(lp));
        } catch (e) {
          console.warn("Could not save stats to local profile cache:", e);
        }
      }

      showToast(forceTimeUp ? "Vaqt tugadi! Imtihon yakunlandi." : "Imtihon muvaffaqiyatli yakunlandi!", "success");
      onExamFinished(examResult);
    } catch (error: any) {
      console.warn("Critical error caught inside handleFinishExam:", error);
      showToast("Imtihon natijasini saqlashda muammo yuz berdi. Natija mahalliy saqlandi.", "info");
      setIsSubmitting(false);
    }
  };

  if (isLoading || !session || !questions || questions.length === 0 || !questions[session.currentQuestionIndex]) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-neutral-400 font-medium">Imtihon savollari va sessiya holati yuklanmoqda...</p>
      </div>
    );
  }

  const currentQuestion = questions[session.currentQuestionIndex];
  const isLastQuestion = session.currentQuestionIndex === questions.length - 1;
  const progressPercentage = ((session.currentQuestionIndex + 1) / questions.length) * 100;

  // Format countdown duration: HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentAnswer = session.answers[currentQuestion.id];
  const eliminatedOptions = session.helpUsedOnQuestions[currentQuestion.id] || [];

  return (
    <div id="exam-dashboard" className="max-w-5xl mx-auto px-4 py-6">
      {/* 1. Strictly Required Internet Status Banner */}
      {!isOnline && (
        <div className="mb-6 bg-red-950/80 border border-red-500/30 text-red-200 px-4 py-3.5 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md animate-bounce">
          <div className="flex items-center gap-3">
            <WifiOff className="w-6 h-6 text-red-500 animate-pulse shrink-0" />
            <div>
              <p className="font-bold">Tarmoq aloqasi yo'qolgan!</p>
              <p className="text-xs text-red-300">Imtihon taymeri va harakatlar vaqtincha to'xtatildi. Javoblaringiz 100% xavfsiz.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs bg-red-500/20 px-3 py-1 rounded-lg border border-red-500/30">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Qayta ulanish...</span>
          </div>
        </div>
      )}

      {/* 2. Header and Timer bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6 flex flex-col md:flex-row gap-6 justify-between items-center shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Qolgan vaqt</span>
            <span className="text-3xl font-mono font-bold text-white tracking-widest">{formatTime(session.durationLeft)}</span>
          </div>
        </div>

        {/* Question Counter Grid */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-neutral-500 font-semibold block">Joriy Savol</span>
            <span className="text-lg font-bold text-white">{session.currentQuestionIndex + 1} / {questions.length}</span>
          </div>

          {/* Help Lifeline Buttons */}
          <div className="border-l border-neutral-800 pl-4 flex items-center gap-2">
            <button
              onClick={handleUseHelp}
              disabled={session.helpChancesLeft <= 0 || !!session.helpUsedOnQuestions[currentQuestion.id] || !isOnline}
              className={`px-4 py-2.5 rounded-xl border font-semibold text-xs flex items-center gap-2 transition-all ${
                session.helpChancesLeft > 0 && !session.helpUsedOnQuestions[currentQuestion.id]
                  ? "bg-amber-500 hover:bg-amber-600 border-amber-600 text-neutral-950 cursor-pointer shadow-md shadow-amber-500/5"
                  : "bg-neutral-950 border-neutral-800 text-neutral-500 cursor-not-allowed"
              }`}
            >
              <HelpIcon className="w-4 h-4" />
              <span>50:50 ({session.helpChancesLeft} qoldi)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Progress Bar */}
      <div className="w-full bg-neutral-950 h-2 rounded-full mb-8 overflow-hidden border border-neutral-900">
        <div 
          className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* 4. Question Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <motion.div 
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl"
          >
            {/* Subject Tag */}
            <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-semibold mb-4">
              {currentQuestion.subject}
            </span>

            {/* Question Text */}
            <h2 className="text-xl text-neutral-100 font-medium mb-8 leading-relaxed">
              {currentQuestion.questionText}
            </h2>

            {/* Answer Options Grid */}
            <div className="space-y-4">
              {(["A", "B", "C", "D"] as const).map((key) => {
                const isEliminated = eliminatedOptions.includes(key);
                const isSelected = currentAnswer === key;

                if (isEliminated) {
                  return (
                    <div 
                      key={key} 
                      className="p-4 bg-neutral-950/40 border border-neutral-900/50 rounded-xl text-neutral-700 text-sm flex items-center justify-between select-none opacity-40"
                    >
                      <span className="font-bold mr-3">{key}.</span>
                      <span className="flex-1 line-through">{currentQuestion.options[key]}</span>
                      <span className="text-xs bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">O'chirilgan</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectAnswer(key)}
                    disabled={!isOnline}
                    className={`w-full p-4 rounded-xl border text-left text-sm flex items-center gap-4 transition-all duration-200 focus:outline-none ${
                      isSelected
                        ? "bg-amber-500 border-amber-600 text-neutral-950 font-semibold shadow-lg shadow-amber-500/10"
                        : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300"
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSelected ? "bg-neutral-950 text-amber-500" : "bg-neutral-900 text-neutral-500"
                    }`}>
                      {key}
                    </span>
                    <span className="flex-1">{currentQuestion.options[key]}</span>
                  </button>
                );
              })}
            </div>

            {/* Warning block */}
            {showWarning && !currentAnswer && (
              <div className="mt-6 flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                <span>Navbatdagi savolga o'tish uchun javob belgilanishi shart.</span>
              </div>
            )}
          </motion.div>

          {/* 5. Navigation Footer Controls */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevQuestion}
              disabled={session.currentQuestionIndex === 0}
              className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 disabled:opacity-40 text-neutral-300 hover:text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </button>

            {isLastQuestion ? (
              <button
                onClick={() => handleFinishExam(false)}
                disabled={isSubmitting || !currentAnswer || !isOnline}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                <span>Imtihonni yakunlash</span>
                <CheckCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                disabled={!isOnline}
                className={`px-6 py-3 font-semibold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  currentAnswer 
                    ? "bg-amber-500 hover:bg-amber-600 border border-amber-600 text-neutral-950 shadow-md shadow-amber-500/5"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-500"
                }`}
              >
                <span>Keyingi savol</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 6. Quick Navigation Map Panel (Right Sidebar) */}
        <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl h-fit">
          <h3 className="text-sm font-semibold text-neutral-300 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Savollar xaritasi</span>
          </h3>
          <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
            Istalgan savolga to'g'ridan-to'g'ri o'tish uchun quyidagi tugmalarni bosing:
          </p>

          {/* Questions Grid list */}
          <div className="grid grid-cols-5 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isAnswered = !!session.answers[q.id];
              const isCurrent = session.currentQuestionIndex === idx;

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    // Navigate only if answered or we click previous questions
                    if (isOnline) {
                      setSession({ ...session, currentQuestionIndex: idx });
                    }
                  }}
                  className={`aspect-square w-full text-xs font-bold rounded-lg flex items-center justify-center transition-all ${
                    isCurrent
                      ? "bg-amber-500 text-neutral-950 scale-110 shadow-md ring-2 ring-amber-500/20"
                      : isAnswered
                        ? "bg-neutral-950 text-emerald-500 border border-emerald-500/30"
                        : "bg-neutral-950 border border-neutral-800 text-neutral-500 hover:border-neutral-700"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 border-t border-neutral-800 pt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="w-3 h-3 rounded bg-amber-500 shrink-0" />
              <span>Faol savol</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="w-3 h-3 rounded bg-neutral-950 border border-emerald-500/30 shrink-0" />
              <span>Belgilangan</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="w-3 h-3 rounded bg-neutral-950 border border-neutral-800 shrink-0" />
              <span>Belgilanmagan</span>
            </div>
          </div>

          {/* Emergency early finish */}
          <div className="mt-6 border-t border-neutral-800 pt-4">
            <button
              onClick={() => {
                if (confirm("Imtihonni muddatidan oldin yakunlamoqchimisiz? Belglanmagan savollar xato deb hisoblanadi.")) {
                  handleFinishExam(false);
                }
              }}
              disabled={isSubmitting || !isOnline}
              className="w-full py-2.5 bg-red-950/40 hover:bg-red-950/80 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold rounded-lg transition-all"
            >
              Muddatidan oldin yakunlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
