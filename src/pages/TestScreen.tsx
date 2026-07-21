/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Clock, ShieldAlert, CheckSquare, ChevronLeft, ChevronRight, Save, Send, AlertTriangle } from "lucide-react";
import { Question, TestSession, User } from "../types";
import SecurityGuard from "../components/SecurityGuard";

interface TestScreenProps {
  currentUser: User;
  testSession: {
    testSessionId: string;
    directionName: string;
    durationSeconds: number;
    questions: Question[];
  };
  onFinishTest: (resultsData: any) => void;
}

export default function TestScreen({ currentUser, testSession, onFinishTest }: TestScreenProps) {
  const { testSessionId, directionName, durationSeconds, questions } = testSession;
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>("Barchasi");

  // Format subjects list
  const subjectsList = [
    "Barchasi",
    "Mathematics",
    "Physics",
    "Native Language",
    "History of Uzbekistan",
    "Mandatory Mathematics",
    "Professional Subject"
  ];

  const subjectNamesTranslation: Record<string, string> = {
    "Barchasi": "Barcha savollar",
    "Mathematics": "Matematika",
    "Physics": "Fizika",
    "Native Language": "Ona tili",
    "History of Uzbekistan": "O'zbekiston tarixi",
    "Mandatory Mathematics": "Majburiy matematika",
    "Professional Subject": "Mutaxassislik fani"
  };

  // Timer Countdown Logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoFinish();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format Time (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Auto-saves answer to the backend whenever it changes
  const saveAnswerToBackend = async (qId: string, option: string) => {
    setSavingStatus("saving");
    try {
      const res = await fetch("/api/test/save-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testSessionId,
          questionId: qId,
          chosenOption: option,
          uid: currentUser.uid
        })
      });
      if (res.ok) {
        setSavingStatus("saved");
        setTimeout(() => setSavingStatus("idle"), 1500);
      } else {
        setSavingStatus("error");
      }
    } catch (err) {
      console.error("Auto-save answer failed:", err);
      setSavingStatus("error");
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers(prev => {
      const updated = { ...prev, [questionId]: option };
      saveAnswerToBackend(questionId, option);
      return updated;
    });
  };

  // Filtered Questions based on Subject tabs
  const filteredQuestions = questions.filter(q => 
    activeSubjectFilter === "Barchasi" || q.subject === activeSubjectFilter
  );

  // Map active relative filtered index to absolute index in questions array
  const currentQuestion = filteredQuestions[currentQuestionIndex] || filteredQuestions[0];
  const absoluteQuestionIndex = questions.findIndex(q => q.id === currentQuestion?.id);

  // Finish test & Calculate score
  const handleFinishTest = async () => {
    setSavingStatus("saving");
    try {
      const res = await fetch("/api/test/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testSessionId,
          uid: currentUser.uid,
          timeUsedSeconds: durationSeconds - timeLeft
        })
      });

      if (res.ok) {
        const resultsData = await res.json();
        onFinishTest(resultsData);
      } else {
        alert("Imtihonni yakunlashda xatolik yuz berdi. Iltimos qayta urining.");
      }
    } catch (err) {
      console.error("Finish test calculation error:", err);
      alert("Aloqa xatosi. Iltimos qayta urining.");
    } finally {
      setSavingStatus("idle");
    }
  };

  const handleAutoFinish = () => {
    alert("Vaqt tugadi! Imtihon avtomatik yakunlandi va natijangiz saqlandi.");
    handleFinishTest();
  };

  const handleNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 select-none">
      {/* Anti-cheat Component Hook */}
      <SecurityGuard isActive={true} testSessionId={testSessionId} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Test Control / Navigation Progress Box (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Header Info Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-400">YO'NALISH</div>
              <h3 className="font-display font-extrabold text-slate-800 text-lg leading-tight mt-0.5">
                {directionName}
              </h3>
            </div>

            {/* Timer Block */}
            <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
              <div className="flex items-center space-x-2.5">
                <Clock className="w-5 h-5 text-primary-600 animate-pulse" />
                <span className="text-sm font-semibold text-slate-600">Qolgan vaqt:</span>
              </div>
              <span className="font-mono text-xl font-bold text-primary-700">
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Save Status Bar */}
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">Avto-saqlash:</span>
              {savingStatus === "saving" && <span className="text-blue-500">Saqlanmoqda...</span>}
              {savingStatus === "saved" && <span className="text-emerald-500">Barcha javoblar saqlandi</span>}
              {savingStatus === "error" && <span className="text-red-500">Xatolik (Offline)</span>}
              {savingStatus === "idle" && <span className="text-slate-500">Aloqa barqaror</span>}
            </div>

            <button
              id="finish-test-trigger"
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Imtihonni yakunlash</span>
            </button>
          </div>

          {/* Progress Navigator Numbers Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h4 className="font-display font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
              <span>Savollar xaritasi</span>
              <span className="text-xs text-primary-600">
                {Object.keys(answers).length} / 90 ta javob
              </span>
            </h4>
            
            <div className="grid grid-cols-6 gap-2 text-center text-xs">
              {questions.map((q, idx) => {
                const isCurrent = questions[absoluteQuestionIndex]?.id === q.id;
                const isAnswered = !!answers[q.id];
                
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      // Switch tab to the question's subject to ensure it's visible
                      setActiveSubjectFilter("Barchasi");
                      const indexInFiltered = questions.findIndex(item => item.id === q.id);
                      setCurrentQuestionIndex(indexInFiltered);
                    }}
                    className={`w-10 h-10 rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-primary-600 text-white ring-2 ring-primary-300 shadow-sm"
                        : isAnswered
                          ? "bg-primary-50 text-primary-600 border border-primary-100"
                          : "bg-slate-50 text-slate-400 border border-slate-200/50 hover:bg-slate-100"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            
            {/* Map Legend */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-primary-600 inline-block" />
                <span>Tanlangan</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-primary-50 border border-primary-100 inline-block" />
                <span>Javob berilgan</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200 inline-block" />
                <span>Bo'sh</span>
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Question Content & Options (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Subjects Tabs List */}
          <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-none">
            {subjectsList.map((subj) => {
              const isActive = activeSubjectFilter === subj;
              return (
                <button
                  key={subj}
                  onClick={() => {
                    setActiveSubjectFilter(subj);
                    setCurrentQuestionIndex(0); // Reset index for newly selected category filter
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                    isActive
                      ? "bg-primary-600 text-white border-primary-600 shadow-xs"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  {subjectNamesTranslation[subj] || subj}
                </button>
              );
            })}
          </div>

          {/* Question Viewer Card */}
          {currentQuestion ? (
            <motion.div 
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
            >
              {/* Question Header Status */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-xs font-bold text-slate-400">
                <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                  {subjectNamesTranslation[currentQuestion.subject] || currentQuestion.subject}
                </span>
                <span>
                  Yo'nalishdagi savol: {currentQuestionIndex + 1} / {filteredQuestions.length}
                </span>
              </div>

              {/* Question Text */}
              <div className="text-slate-800 text-base sm:text-lg font-medium leading-relaxed font-sans">
                {currentQuestion.question}
              </div>

              {/* Optional Question Image */}
              {currentQuestion.image && (
                <div className="max-h-60 overflow-hidden rounded-xl border border-slate-200 flex items-center justify-center bg-slate-50">
                  <img
                    src={currentQuestion.image}
                    alt="Savol tasviri"
                    className="max-h-60 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Options Options Selection Block */}
              <div className="space-y-3">
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  const isSelected = answers[currentQuestion.id] === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectOption(currentQuestion.id, key)}
                      className={`w-full p-4 text-left font-sans rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-primary-50 border-primary-500 text-primary-900 ring-1 ring-primary-500 shadow-sm font-semibold"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 pr-4">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                          isSelected 
                            ? "bg-primary-600 text-white" 
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                        }`}>
                          {key}
                        </span>
                        <span className="text-sm sm:text-base leading-snug">{value}</span>
                      </div>
                      
                      {isSelected && (
                        <CheckSquare className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Nav Buttons (Prev / Next) */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center space-x-1 px-4 py-2.5 text-sm font-semibold text-slate-500 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Oldingisi</span>
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === filteredQuestions.length - 1}
                  className="flex items-center space-x-1 px-4 py-2.5 text-sm font-semibold text-slate-500 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <span>Keyingisi</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 font-medium">
              Ushbu fanga oid savollar topilmadi. Boshqa fanni tanlab ko'ring.
            </div>
          )}
        </div>

      </div>

      {/* 3. Confirm Complete Test Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[10000] flex items-center justify-center p-4 select-none" id="finish-test-modal">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-2xl flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h3 className="font-display text-xl font-bold text-slate-900 mb-2">Imtihonni tugatish</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Siz haqiqatdan ham imtihonni yakunlamoqchimisiz? Tanlagan javoblaringiz tekshirilib qayta tiklab bo'lmaydigan qilib natija hisoblanadi.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full dtm-btn-secondary py-2.5 text-sm"
              >
                Orqaga qaytish
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleFinishTest();
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Ha, imtihonni tugatish
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
