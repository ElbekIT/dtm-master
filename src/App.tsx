/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db, getDoc, setDoc } from "./lib/firebase";
import { User, Question } from "./types";
import { PendingReferral } from "./lib/promo";
import ReferralRewardModal from "./components/ReferralRewardModal";
import { HelpCircle, Award, CheckCircle2, ShieldCheck, Cpu } from "lucide-react";

// Pages
import Login from "./pages/Login";
import Home from "./pages/Home";
import TestScreen from "./pages/TestScreen";
import ResultScreen from "./pages/ResultScreen";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Notifications from "./pages/Notifications";
import PremiumBuy from "./pages/PremiumBuy";

// Helpers
import { hasActiveAccess } from "./lib/premium";

// Components
import Header from "./components/Header";
import LoadingScreen from "./components/LoadingScreen";

// Offline Test Generator
import { generateClientTestSession } from "./lib/testGenerator";

export default function App() {
  const getInitialUser = (): User | null => {
    try {
      const cached = localStorage.getItem("dtm_cached_user");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Failed to load cached user:", e);
    }
    return null;
  };

  const [currentUser, setCurrentUser] = useState<User | null>(getInitialUser);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>("home");

  // Exam States
  const [activeTestSession, setActiveTestSession] = useState<{
    testSessionId: string;
    directionName: string;
    durationSeconds: number;
    questions: Question[];
  } | null>(null);

  const [activeResults, setActiveResults] = useState<{
    score: number;
    correctCount: number;
    wrongCount: number;
    emptyCount: number;
    percentage: number;
    timeUsed: string;
    directionName: string;
    passed: boolean;
  } | null>(null);

  // Referral Reward Modal for Promo Code Owner
  const [pendingReferral, setPendingReferral] = useState<PendingReferral | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const checkPendingReferrals = async () => {
      try {
        const q = query(
          collection(db, "referrals"),
          where("ownerUid", "==", currentUser.uid),
          where("shownToOwner", "==", false)
        );
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const firstDoc = querySnap.docs[0];
          const data = { id: firstDoc.id, ...firstDoc.data() } as PendingReferral;
          setPendingReferral(data);
        }
      } catch (err) {
        console.warn("Pending referral check failed:", err);
      }
    };

    checkPendingReferrals();
  }, [currentUser?.uid]);

  const handleDismissReferralReward = async () => {
    if (!pendingReferral) return;
    try {
      await setDoc(doc(db, "referrals", pendingReferral.id), { shownToOwner: true }, { merge: true });
    } catch (err) {
      console.error("Failed to mark referral as shown:", err);
    } finally {
      setPendingReferral(null);
    }
  };

  const syncUserWithBackend = async (user: User) => {
    try {
      await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      });
    } catch (err) {
      console.error("Failed to sync user state to backend:", err);
    }
  };

  // Monitor Authentication state
  useEffect(() => {
    let active = true;

    // Safety backup timeout to force app state to load after 2.0 seconds
    const safetyTimer = setTimeout(() => {
      if (active && authChecking) {
        console.warn("Firebase Auth check completed.");
        setAuthChecking(false);
      }
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setCurrentUser(userData);
            try {
              localStorage.setItem("dtm_cached_user", JSON.stringify(userData));
            } catch (e) {}
            syncUserWithBackend(userData);
            if (userData.role === "admin") {
              setCurrentTab("admin");
            }
          } else {
            // Google login or first time user without firestore doc - auto save into Firestore!
            const defaultNickname = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : `Abituriyent_${firebaseUser.uid.substring(0, 4)}`);
            const cleanNick = defaultNickname.toUpperCase().replace(/[^A-Z0-9]/g, "");
            const newGoogleUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              nickname: defaultNickname,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              score: 0,
              testsSolved: 0,
              country: "O'zbekiston",
              role: "user",
              promoCode: `${cleanNick}_${firebaseUser.uid.substring(0, 4).toUpperCase()}`,
              trialDaysAdded: 0,
              subscriptionStatus: "none",
              premium: false
            };

            try {
              await setDoc(userDocRef, newGoogleUser, { merge: true });
            } catch (saveErr) {
              console.warn("Could not auto-create user in Firestore:", saveErr);
            }

            setCurrentUser(newGoogleUser);
            try {
              localStorage.setItem("dtm_cached_user", JSON.stringify(newGoogleUser));
            } catch (e) {}
            syncUserWithBackend(newGoogleUser);
          }
        } catch (err) {
          console.error("Error fetching authenticated user document:", err);
        }
      } else {
        // If not authenticated in firebase and no cached user, reset
        if (!localStorage.getItem("dtm_cached_user")) {
          setCurrentUser(null);
        }
      }
      
      clearTimeout(safetyTimer);
      setAuthChecking(false);
    });

    return () => {
      active = false;
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("dtm_cached_user", JSON.stringify(user));
    } catch (e) {}
    syncUserWithBackend(user);
    setCurrentTab(user.role === "admin" ? "admin" : "home");
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem("dtm_cached_user", JSON.stringify(updatedUser));
    } catch (e) {}
    syncUserWithBackend(updatedUser);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("dtm_cached_user");
    } catch (e) {}
    await signOut(auth);
    setCurrentUser(null);
    setCurrentTab("home");
    setActiveTestSession(null);
    setActiveResults(null);
  };

  // Triggers starting a test securely with server-side generation
  const handleStartTest = async (directionId: string, directionName: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/test/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          uid: currentUser.uid,
          directionId,
          directionName
        })
      });

      if (response.ok) {
        const testData = await response.json();
        setActiveTestSession(testData);
        setCurrentTab("active_test"); // Switch to focus exam screen (Navbar is hidden!)
      } else {
        console.warn("Server start-test failed, falling back to client-side generator");
        const fallbackSession = generateClientTestSession(directionId, directionName);
        setActiveTestSession(fallbackSession);
        setCurrentTab("active_test");
      }
    } catch (err) {
      console.error("Network connection failed during start-test, using client-side fallback:", err);
      const fallbackSession = generateClientTestSession(directionId, directionName);
      setActiveTestSession(fallbackSession);
      setCurrentTab("active_test");
    }
  };

  const handleFinishTest = (resultsData: any) => {
    setActiveResults(resultsData);
    setActiveTestSession(null);
    setCurrentTab("results");
  };

  const handleReturnHome = () => {
    setActiveResults(null);
    setCurrentTab("home");
  };

  if (authChecking) {
    return <LoadingScreen message="Foydalanuvchi ma'lumotlari yuklanmoqda..." />;
  }

  // Not logged in -> Render login page
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* 1. Header (Navbar is hidden during active test to prevent cheating / distraction) */}
      {currentTab !== "active_test" && (
        <Header
          currentUser={currentUser}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onLogout={handleLogout}
        />
      )}

      {/* 2. Main content container */}
      <main className="flex-grow">
        {currentTab === "home" && (
          currentUser.role === "admin" ? (
            <Admin />
          ) : hasActiveAccess(currentUser) ? (
            <Home
              currentUser={currentUser}
              onStartTest={handleStartTest}
              setCurrentTab={setCurrentTab}
            />
          ) : (
            <PremiumBuy currentUser={currentUser} isBlocker={true} />
          )
        )}

        {currentTab === "active_test" && activeTestSession && (
          <TestScreen
            currentUser={currentUser}
            testSession={activeTestSession}
            onFinishTest={handleFinishTest}
          />
        )}

        {currentTab === "results" && activeResults && (
          <ResultScreen
            currentUser={currentUser}
            results={activeResults}
            onReturnHome={handleReturnHome}
          />
        )}

        {currentTab === "ranking" && <Leaderboard />}

        {currentTab === "premium" && (
          <PremiumBuy
            currentUser={currentUser}
            isBlocker={false}
            onSuccess={() => handleUserUpdate({ ...currentUser, subscriptionStatus: "Tekshirilyapti" })}
            onUserUpdate={handleUserUpdate}
          />
        )}

        {currentTab === "notifications" && <Notifications currentUser={currentUser} />}

        {currentTab === "profile" && (
          <Profile 
            currentUser={currentUser} 
            onUserUpdate={handleUserUpdate} 
            onDeleteAccount={handleLogout} 
          />
        )}

        {currentTab === "admin" && currentUser.role === "admin" && <Admin />}

        {/* 3. About Project Page in Uzbek */}
        {currentTab === "about" && (
          <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 select-none">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
              <div className="text-center pb-6 border-b border-slate-100">
                <div className="w-14 h-14 bg-blue-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100/50">
                  <HelpCircle className="w-8 h-8 stroke-[2]" />
                </div>
                <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">DTM MASTER Haqida</h1>
                <p className="text-slate-500 text-sm mt-1.5">
                  O'zbekiston abituriyentlari uchun yaratilgan zamonaviy professional onlayn imtihon tizimi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-relaxed text-slate-600 font-semibold">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="text-slate-800 font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Haqqoniy Imtihon Sharoiti</span>
                  </div>
                  <p className="text-slate-500">
                    Test tizimi to'liq 3 soatlik (180 daqiqa) vaqt limiti, to'g'ri bal hisoblash, hamda copy-paste, oyna almashtirishni fiksatsiyalovchi kiber-nazoratchi tizimlarga ega.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="text-slate-800 font-bold flex items-center space-x-1.5">
                    <Cpu className="w-5 h-5 text-purple-600" />
                    <span>Dinamik Savollar Banki</span>
                  </div>
                  <p className="text-slate-500">
                    Barcha imtihon savollari Fisher-Yates algoritmi orqali server-side tasodifiy generatsiya qilinadi. Hech bir nomzodga bir xil test tushmaydi.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4 text-sm font-semibold text-slate-600">
                <h3 className="font-display font-bold text-slate-800 text-lg">Platforma Qoidalari:</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-500 pl-1">
                  <li>Imtihon paytida boshqa tab yoki oynaga o'tish qat'iyan taqiqlanadi (tizim buni avtomatik fiksatsiya qiladi).</li>
                  <li>Dasturchi asboblari (F12) va sahifani tekshirish (Inspect Element) taqiqlangan.</li>
                  <li>Sizning tanlagan javoblaringiz har soniyada backend server xotirasiga avto-saqlanadi, shuning uchun internet uzilib qolsa ham imtihonni joyidan davom ettirasiz.</li>
                </ul>
              </div>

              <div className="bg-primary-50 text-primary-700 p-5 rounded-2xl border border-primary-100/50 flex items-center space-x-3 text-xs font-bold justify-center">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 text-primary-600" />
                <span>Ushbu platforma abituriyentlarni haqiqiy DTM Davlat imtihonlariga tayyorlash maqsadida xolis tashkil qilingan.</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center select-none text-xs font-semibold text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} DTM MASTER. O'zbekiston OTMlariga tayyorgarlik tizimi.</p>
          <p className="mt-1 text-[10px] text-slate-400">
            Durable Cloud Database & Authentication by Firestore. Handcrafted with 💙 in Uzbekistan.
          </p>
        </div>
      </footer>

      {/* Referral Reward Modal for Promo Code Owner */}
      {pendingReferral && (
        <ReferralRewardModal
          isOpen={!!pendingReferral}
          onClose={handleDismissReferralReward}
          title="TABRIKLAYMIZ! 🎉"
          badgeText="Do'st taklifi bonusi"
          message={`Siz saytga yangi foydalanuvchini olib kirdingiz! Do'stingiz (${pendingReferral.friendNickname}) siz bergan promo-kodni (${pendingReferral.usedPromoCode}) ishlatdi va sizga 2 kunlik BEPUL VIP Premium taqdim etildi! VIP imkoniyatlaridan unumli foydalaning! 🚀🎁`}
          rewardText="+2 Kunlik Bepul VIP Premium"
        />
      )}
    </div>
  );
}
