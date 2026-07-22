/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { AlertTriangle, Lock } from "lucide-react";

interface SecurityGuardProps {
  isActive: boolean; // Only enable strict mode when a test is actively running
  testSessionId?: string;
  onSecurityViolation?: (violationType: string) => void;
}

export default function SecurityGuard({ isActive, testSessionId, onSecurityViolation }: SecurityGuardProps) {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [isMultiTabDetected, setIsMultiTabDetected] = useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    // Bypass strict anti-cheat layers in development and iframe preview environments to allow smooth developer testing
    const isDevelopmentMode = 
      typeof window !== "undefined" && (
        window.location.hostname === "localhost" ||
        window.location.hostname.includes("127.0.0.1") ||
        window.location.hostname.includes("asia-southeast1.run.app") ||
        window.self !== window.top
      );

    if (isDevelopmentMode) {
      console.log("SecurityGuard anti-cheat measures bypassed for development/preview iframe environment.");
      return;
    }

    // 1. Disable Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (onSecurityViolation) onSecurityViolation("right_click");
    };
    document.addEventListener("contextmenu", handleContextMenu);

    // 2. Disable Keyboard Shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, PrintScreen)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        if (onSecurityViolation) onSecurityViolation("f12");
        setIsDevToolsOpen(true);
      }
      // Ctrl+Shift+I or J
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) {
        e.preventDefault();
        if (onSecurityViolation) onSecurityViolation("inspect");
        setIsDevToolsOpen(true);
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
        if (onSecurityViolation) onSecurityViolation("view_source");
        setIsDevToolsOpen(true);
      }
      // Ctrl+P (Print)
      if (e.ctrlKey && (e.key === "P" || e.key === "p")) {
        e.preventDefault();
        alert("Imtihon paytida ekranni chop etish taqiqlangan!");
        if (onSecurityViolation) onSecurityViolation("print");
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // 3. Disable copy, paste, cut, drag and select
    const disableEvent = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener("copy", disableEvent);
    document.addEventListener("paste", disableEvent);
    document.addEventListener("cut", disableEvent);
    document.addEventListener("selectstart", disableEvent);
    document.addEventListener("dragstart", disableEvent);

    // 4. Warn if leaving (beforeunload)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Imtihondan chiqmoqchimisiz? Tanlangan javoblaringiz yo'qolishi mumkin!";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 5. Detect Tab Blur (Anti-Cheat: switching tabs)
    const handleBlur = () => {
      setIsWindowBlurred(true);
      if (onSecurityViolation) onSecurityViolation("tab_switch");
    };
    const handleFocus = () => {
      setIsWindowBlurred(false);
    };
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    // 6. DevTools Detection trick (window sizing)
    const threshold = 160;
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      if (widthThreshold || heightThreshold) {
        setIsDevToolsOpen(true);
      }
    };
    const devToolsInterval = setInterval(detectDevTools, 1000);

    // 7. Prevent multiple tabs using localStorage session sync
    if (testSessionId) {
      const lockKey = `dtm_active_exam_lock`;
      localStorage.setItem(lockKey, testSessionId);

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === lockKey && e.newValue !== testSessionId) {
          setIsMultiTabDetected(true);
          if (onSecurityViolation) onSecurityViolation("multi_tab");
        }
      };
      window.addEventListener("storage", handleStorageChange);

      return () => {
        clearInterval(devToolsInterval);
        document.removeEventListener("contextmenu", handleContextMenu);
        window.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("copy", disableEvent);
        document.removeEventListener("paste", disableEvent);
        document.removeEventListener("cut", disableEvent);
        document.removeEventListener("selectstart", disableEvent);
        document.removeEventListener("dragstart", disableEvent);
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("blur", handleBlur);
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("storage", handleStorageChange);
        localStorage.removeItem(lockKey);
      };
    }

    return () => {
      clearInterval(devToolsInterval);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", disableEvent);
      document.removeEventListener("paste", disableEvent);
      document.removeEventListener("cut", disableEvent);
      document.removeEventListener("selectstart", disableEvent);
      document.removeEventListener("dragstart", disableEvent);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isActive, testSessionId, onSecurityViolation]);

  // Apply visual blur to body if security alert is active
  useEffect(() => {
    const rootDiv = document.getElementById("root");
    if (!rootDiv) return;

    if (isDevToolsOpen || isMultiTabDetected || isWindowBlurred) {
      rootDiv.classList.add("security-blur");
    } else {
      rootDiv.classList.remove("security-blur");
    }

    return () => {
      rootDiv.classList.remove("security-blur");
    };
  }, [isDevToolsOpen, isMultiTabDetected, isWindowBlurred]);

  if (!isActive) return null;

  return (
    <>
      {/* 1. Multi Tab Prevention Overlay */}
      {isMultiTabDetected && (
        <div className="fixed inset-0 bg-slate-900/90 z-[9999] flex flex-col items-center justify-center p-6 text-center select-none" id="multitab-block">
          <div className="bg-white rounded-2xl max-w-md p-8 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-4">Bir nechta oyna taqiqlanadi!</h2>
            <p className="text-slate-600 mb-6">
              Sizda boshqa oyna yoki tabda imtihon faollashtirilgan. To'g'rilash uchun boshqa oynalarni yoping va ushbu sahifani yangilang.
            </p>
            <button
              id="refresh-btn"
              onClick={() => window.location.reload()}
              className="dtm-btn-primary w-full"
            >
              Sahifani yangilash
            </button>
          </div>
        </div>
      )}

      {/* 2. DevTools Open Overlay */}
      {isDevToolsOpen && (
        <div className="fixed inset-0 bg-slate-900/90 z-[9999] flex flex-col items-center justify-center p-6 text-center select-none" id="devtools-block">
          <div className="bg-white rounded-2xl max-w-md p-8 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-4">Dasturchi asboblari aniqlandi!</h2>
            <p className="text-slate-600 mb-6">
              Imtihon topshirish jarayonida DevTools (Dasturchi paneli) ochish qat'iyan taqiqlanadi! Davom etish uchun uni yoping.
            </p>
            <button
              id="close-devtools-warning"
              onClick={() => setIsDevToolsOpen(false)}
              className="dtm-btn-secondary w-full"
            >
              Tushundim, davom etish
            </button>
          </div>
        </div>
      )}

      {/* 3. Window Blurred / Focus Lost Overlay */}
      {isWindowBlurred && !isDevToolsOpen && !isMultiTabDetected && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9998] flex flex-col items-center justify-center p-6 text-center select-none" id="blur-block">
          <div className="bg-white rounded-2xl max-w-sm p-6 shadow-xl flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900 mb-2">E'tibor bering!</h3>
            <p className="text-sm text-slate-600 mb-4">
              Oynani tark etganda imtihon vaqti to'xtamaydi va bu chetlatilishga olib kelishi mumkin. Davom etish uchun ekranga bosing.
            </p>
            <button
              id="focus-resume-btn"
              onClick={() => setIsWindowBlurred(false)}
              className="dtm-btn-primary text-xs py-2 px-4 rounded-lg"
            >
              Imtihon oynasiga qaytish
            </button>
          </div>
        </div>
      )}
    </>
  );
}
