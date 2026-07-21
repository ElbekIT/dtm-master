import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { auth, db, googleProvider, runWithRetry } from "./firebase";
import { UserProfile, ExamResult, PaymentRequest, Announcement } from "./types";
import { motion, AnimatePresence } from "motion/react";

// Components imports
import WelcomeScreen from "./components/WelcomeScreen";
import ExamScreen from "./components/ExamScreen";
import PremiumScreen from "./components/PremiumScreen";
import ProfileScreen from "./components/ProfileScreen";
import RankingScreen from "./components/RankingScreen";
import AdminPanel from "./components/AdminPanel";

// Icons imports
import { 
  Trophy, 
  User, 
  CreditCard, 
  Bell, 
  Award, 
  Play, 
  BookOpen, 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  Loader, 
  RefreshCw,
  LogIn,
  LogOut,
  Gift,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lock,
  ChevronRight,
  CheckCircle2,
  Info
} from "lucide-react";

export default function App() {
  // Auth & Profile states
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Connection & Offline state (Strict online required)
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  // App Navigation state
  const [currentView, setCurrentView] = useState<'dashboard' | 'exam' | 'premium' | 'ranking' | 'profile' | 'admin'>('dashboard');

  // Realtime lists
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [completedExams, setCompletedExams] = useState<ExamResult[]>([]);
  const [currentPayment, setCurrentPayment] = useState<PaymentRequest | null>(null);

  // Active results view state (to show results card after exam ends)
  const [activeResult, setActiveResult] = useState<ExamResult | null>(null);

  // Global Toaster state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Connection check loop
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
      showToast("Internet aloqasi tiklandi!", "success");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
      showToast("Siz oflaynsiz. Tarmoq ulanishini tekshiring.", "error");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 2. Auth State listener with automatic session refreshes and robust loadings
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);
      if (user) {
        setFirebaseUser(user);
        await syncUserProfile(user.uid);
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
        setShowWelcome(false);
        setCurrentView("dashboard");
      }
      setIsAuthLoading(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      showToast("Tizimga kirish xizmatida xatolik yuz berdi.", "error");
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. User profile and realtime subscriptions sync
  const syncUserProfile = async (uid: string) => {
    setIsProfileLoading(true);
    try {
      const docRef = doc(db, "users", uid);
      
      // Realtime listener for User Profile so status, premiums, helps, bans update instantly!
      const unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;
          setUserProfile(profile);
          setShowWelcome(false);
        } else {
          // If no profile document in Firestore, trigger Welcome screen nickname setup
          setShowWelcome(true);
        }
        setIsProfileLoading(false);
      }, (err) => {
        console.error("Realtime profile sync error:", err);
        setIsProfileLoading(false);
      });

      // Fetch user's completed exams list
      const resultsRef = collection(db, "results");
      const qResults = query(resultsRef, where("uid", "==", uid));
      const unsubscribeResults = onSnapshot(qResults, (snapshot) => {
        const list: ExamResult[] = [];
        snapshot.forEach((doc) => list.push(doc.data() as ExamResult));
        list.sort((a, b) => b.createdAt - a.createdAt);
        setCompletedExams(list);
      }, (err) => {
        console.warn("Realtime results sync failed, falling back without order:", err);
      });

      // Fetch user's active payments request
      const paymentsRef = collection(db, "payments");
      const qPayments = query(paymentsRef, where("uid", "==", uid));
      const unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
        if (!snapshot.empty) {
          const list: PaymentRequest[] = [];
          snapshot.forEach((doc) => list.push(doc.data() as PaymentRequest));
          list.sort((a, b) => b.createdAt - a.createdAt);
          setCurrentPayment(list[0]);
        } else {
          setCurrentPayment(null);
        }
      }, (err) => {
        console.warn("Realtime payments sync failed:", err);
      });

      // Fetch global announcements list
      const annRef = collection(db, "announcements");
      const qAnn = query(annRef, orderBy("createdAt", "desc"));
      const unsubscribeAnn = onSnapshot(qAnn, (snapshot) => {
        const list: Announcement[] = [];
        snapshot.forEach((doc) => list.push(doc.data() as Announcement));
        setAnnouncements(list);
      }, (err) => {
        console.warn("Realtime announcements sync failed:", err);
      });

      return () => {
        unsubscribeProfile();
        unsubscribeResults();
        unsubscribePayments();
        unsubscribeAnn();
      };
    } catch (e) {
      console.error("Profile sync exception:", e);
      setIsProfileLoading(false);
    }
  };

  // Google Sign In flow with freeze-fixes and exception captures
  const handleGoogleLogin = async () => {
    if (!isOnline) {
      showToast("Oflayn rejimda tizimga kirish imkonsiz. Tarmoqni yoqing.", "error");
      return;
    }
    
    try {
      showToast("Google hisobiga ulanish so'ralmoqda...", "info");
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Sign in failed:", error);
      if (error.code === "auth/popup-closed-by-user") {
        showToast("Kirish oynasi yopildi. Qayta urinib ko'ring.", "info");
      } else {
        showToast("Kirish muvaffaqiyatsiz yakunlandi: " + error.message, "error");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("Tizimdan muvaffaqiyatli chiqdingiz.", "info");
    } catch (e) {
      showToast("Chiqishda xatolik yuz berdi.", "error");
    }
  };

  // START EXAM FLOW WITH STRICT ACTIVE TRIAL / PREMIUM CHECK
  const handleStartExamAttempt = () => {
    if (!isOnline) {
      showToast("Internet ulanmagan! Imtihonni boshlash imkonsiz.", "error");
      return;
    }

    if (!userProfile) return;

    // Check ban status again
    if (userProfile.isBanned) {
      showToast("Hisobingiz bloklangan. Imtihon taqiqlangan.", "error");
      return;
    }

    // Trial and premium date calculation
    const hasActiveTrial = userProfile.trialExpiresAt > Date.now();
    const hasActivePremium = userProfile.premiumStatus === "premium" && userProfile.premiumExpiresAt > Date.now();

    if (!hasActiveTrial && !hasActivePremium) {
      showToast("Premium sinov muddati yakunlangan! Iltimos, obuna bo'ling.", "error");
      setCurrentView("premium");
      return;
    }

    // All clear - start exam session
    setActiveResult(null);
    setCurrentView("exam");
  };

  // Check if trial has expired overall to warn user
  const isTrialExpired = () => {
    if (!userProfile) return false;
    const hasActivePremium = userProfile.premiumStatus === "premium" && userProfile.premiumExpiresAt > Date.now();
    if (hasActivePremium) return false;
    return userProfile.trialExpiresAt < Date.now();
  };

  if (isAuthLoading || (firebaseUser && isProfileLoading && !showWelcome)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 gap-4">
        <Loader className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-neutral-400 font-medium text-sm">DTM MASTER yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none selection:bg-amber-500 selection:text-neutral-950">
      
      {/* 1. Global Header Navigation */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            onClick={() => setCurrentView("dashboard")}
            className="flex items-center gap-3.5 cursor-pointer"
          >
            <div className="p-2 bg-amber-500 rounded-xl text-neutral-950 shadow-md shadow-amber-500/10">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-wider text-white font-display">DTM MASTER</span>
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block -mt-1">PREP PLATFORM</span>
            </div>
          </div>

          {/* Navigation Items (Show only if logged in and profile setup completed) */}
          {firebaseUser && userProfile && !userProfile.isBanned && (
            <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold">
              <button
                onClick={() => { setCurrentView("dashboard"); setActiveResult(null); }}
                className={`px-4 py-2 rounded-xl transition-all ${currentView === "dashboard" ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"}`}
              >
                Asosiy
              </button>
              <button
                onClick={() => { setCurrentView("ranking"); setActiveResult(null); }}
                className={`px-4 py-2 rounded-xl transition-all ${currentView === "ranking" ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"}`}
              >
                Reyting
              </button>
              <button
                onClick={() => { setCurrentView("premium"); setActiveResult(null); }}
                className={`px-4 py-2 rounded-xl transition-all ${currentView === "premium" ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"}`}
              >
                Premium Obuna
              </button>
              <button
                onClick={() => { setCurrentView("profile"); setActiveResult(null); }}
                className={`px-4 py-2 rounded-xl transition-all ${currentView === "profile" ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"}`}
              >
                Kabinet
              </button>
            </nav>
          )}

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {firebaseUser ? (
              <div className="flex items-center gap-3">
                {/* User Info Capsule */}
                {userProfile && (
                  <div 
                    onClick={() => setCurrentView("profile")}
                    className="flex items-center gap-2.5 bg-neutral-950 border border-neutral-850 py-1.5 pl-3 pr-1.5 rounded-full cursor-pointer hover:border-neutral-700 transition-all"
                  >
                    <div className="text-right">
                      <span className="text-xs font-bold text-white block truncate max-w-[100px]">{userProfile.displayName}</span>
                      <span className="text-[9px] text-amber-500 font-bold block -mt-0.5">@{userProfile.username}</span>
                    </div>
                    <img 
                      src={userProfile.photoURL} 
                      alt={userProfile.displayName} 
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-neutral-800 object-cover" 
                    />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Tizimga kirish</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main App Content Switcher */}
      <main className="flex-grow py-6">
        
        {/* Offline global warning bar */}
        {showOfflineAlert && (
          <div className="max-w-6xl mx-auto px-4 mb-4">
            <div className="bg-red-950 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-lg text-xs font-semibold">
              <WifiOff className="w-5 h-5 text-red-500 shrink-0" />
              <span>Siz hozir oflaynsiz. Tarmoq uzilgan. Platformadan faqat onlayn foydalanish mumkin!</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* Admin Panel view - Rendered unconditionally at the top level */}
          {currentView === "admin" && (
            <AdminPanel 
              showToast={showToast}
              onCloseAdmin={() => {
                // Return to dashboard or landing depending on login status
                setCurrentView("dashboard");
              }}
            />
          )}

          {/* A. If not logged in and not admin - show customize splash page */}
          {currentView !== "admin" && !firebaseUser && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto px-4 py-16 text-center space-y-12"
            >
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-500 border border-amber-500/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  🚀 2026-YIL YANGI DTM MASTER TALABINDA
                </span>
                <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight font-display max-w-2xl mx-auto">
                  Davlat imtihonlariga eng mukammal tayyorgarlik
                </h1>
                <p className="text-sm md:text-base text-neutral-400 max-w-xl mx-auto leading-relaxed">
                  90 talik haqiqiy savollar bloki, Fisher-Yates tasodifiy shuffleri, 50-50 yordam lifelaynlari va milliy jonli reyting tizimi.
                </p>
              </div>

              {/* Promo grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-2">
                  <span className="text-2xl">⏳</span>
                  <h3 className="font-bold text-white text-sm">4 Soatlik Real Imtihon</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">Haqiqiy DTM barcha fanlar kesimida test rejimi bilan bilimingizni sinab ko'ring.</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-2">
                  <span className="text-2xl">💡</span>
                  <h3 className="font-bold text-white text-sm">50:50 Yordam Tizimi</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">Har bir imtihonda 3 marta noto'g'ri variantlarni o'chirish imkoniyati.</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-2">
                  <span className="text-2xl">🏆</span>
                  <h3 className="font-bold text-white text-sm">Real vaqtdagi Reyting</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">Barcha real foydalanuvchilar orasida o'z o'rningizni bir zumda kuzatib boring.</p>
                </div>
              </div>

              {/* CTA button */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleGoogleLogin}
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-extrabold rounded-2xl text-sm transition-all shadow-xl shadow-amber-500/10 flex items-center gap-3 cursor-pointer"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Google orqali bepul boshlash</span>
                </button>
                <span className="text-[10px] text-neutral-600">Yangi talabalar uchun 2 kun bepul premium hadya etiladi!</span>
              </div>
            </motion.div>
          )}

          {/* B. Welcome Screen nickname picker on first login */}
          {currentView !== "admin" && firebaseUser && showWelcome && (
            <WelcomeScreen 
              firebaseUser={firebaseUser} 
              onProfileCreated={(profile) => {
                setUserProfile(profile);
                setShowWelcome(false);
              }}
              showToast={showToast}
            />
          )}

          {/* C. Account Ban Shield */}
          {currentView !== "admin" && firebaseUser && userProfile && userProfile.isBanned && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto px-4 py-12 text-center space-y-6"
            >
              <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20 text-red-500 inline-block">
                <AlertTriangle className="w-12 h-12 animate-pulse" />
              </div>
              <h1 className="text-2xl font-extrabold text-white">Hisobingiz vaqtincha bloklandi!</h1>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Platforma qoidalarini suiiste'mol qilish, takroriy refresh xatti-harakatlari yoki nusxa ko'chirish shubhalari sababli sizning profilingiz bloklangan.
              </p>
              <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-xl text-left text-xs space-y-2">
                <div>
                  <span className="text-neutral-500">Blok turi:</span>
                  <span className="text-red-400 font-bold ml-1.5 uppercase">{userProfile.banType}</span>
                </div>
                {userProfile.banUntil && (
                  <div>
                    <span className="text-neutral-500">Faollashish sanasi:</span>
                    <span className="text-neutral-300 font-mono ml-1.5">{new Date(userProfile.banUntil).toLocaleString()}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold rounded-xl text-xs transition-all"
              >
                Tizimdan chiqish
              </button>
            </motion.div>
          )}

          {/* D. Regular Logged-In User Core Views */}
          {currentView !== "admin" && firebaseUser && userProfile && !userProfile.isBanned && (
            <div className="max-w-6xl mx-auto px-4">
              
              {/* Dashboard Content */}
              {currentView === "dashboard" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {/* Results display after finishing exam */}
                  {activeResult && (
                    <div className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 p-6 rounded-2xl space-y-4 shadow-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0" />
                        <div>
                          <h3 className="font-bold text-white text-base">Imtihon muvaffaqiyatli topshirildi!</h3>
                          <p className="text-xs text-emerald-500/80">Ballaringiz reyting jadvaliga avtomatik kiritildi.</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-neutral-950/60 p-4 rounded-xl border border-neutral-900">
                        <div>
                          <span className="text-[10px] text-neutral-500 block uppercase font-bold">To'g'ri javob</span>
                          <span className="text-2xl font-mono font-bold text-white">{activeResult.score} / 90</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 block uppercase font-bold">Sarf qilingan vaqt</span>
                          <span className="text-xl font-mono font-bold text-white">
                            {Math.floor(activeResult.timeSpent / 60)}m {activeResult.timeSpent % 60}s
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 block uppercase font-bold">50:50 Lifeline ishlatildi</span>
                          <span className="text-xl font-mono font-bold text-white">{activeResult.helpUsed}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveResult(null)}
                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-white rounded-lg text-xs font-semibold"
                      >
                        Yopish
                      </button>
                    </div>
                  )}

                  {/* Top Hello & Starter panel */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-3 flex-1 text-center md:text-left">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-white font-display">
                        Assalomu alaykum, {userProfile.displayName}!
                      </h2>
                      <p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-xl">
                        Davlat test markazi (DTM) talablari asosida shakllantirilgan yangi imtihonda qatnashishga tayyormisiz? 
                        Sizga 90 ta unikal shuffllangan savol va 4 soat vaqt beriladi.
                      </p>

                      <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                        {isTrialExpired() ? (
                          <span className="text-xs bg-red-500/10 border border-red-500/25 text-red-400 px-3 py-1 rounded-full font-semibold">
                            Sinov muddati tugagan! Premium talab qilinadi.
                          </span>
                        ) : (
                          <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1 rounded-full font-semibold">
                            Sizda kirish imkoniyati bor (Ochiq)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleStartExamAttempt}
                      className="px-8 py-5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-amber-500/10 flex items-center gap-3 cursor-pointer select-none shrink-0"
                    >
                      <Play className="w-5 h-5 shrink-0" />
                      <span>Imtihonni Boshlash</span>
                      <ArrowRight className="w-5 h-5 shrink-0" />
                    </button>
                  </div>

                  {/* Notification/Announcements section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-500" />
                      <span>E'lonlar va bildirishnomalar</span>
                    </h3>

                    {announcements.length === 0 ? (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center text-xs text-neutral-500">
                        Hozircha yangi e'lonlar mavjud emas.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {announcements.map((ann) => (
                          <div 
                            key={ann.id}
                            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-all shadow-sm space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white text-xs">{ann.title}</h4>
                              <span className="text-[9px] text-neutral-600 font-mono">
                                {new Date(ann.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 leading-relaxed">
                              {ann.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Active Exam view */}
              {currentView === "exam" && (
                <ExamScreen 
                  userProfile={userProfile}
                  showToast={showToast}
                  onExamFinished={(result) => {
                    setActiveResult(result);
                    setCurrentView("dashboard");
                  }}
                  onBackToDashboard={() => setCurrentView("dashboard")}
                />
              )}

              {/* Premium view */}
              {currentView === "premium" && (
                <PremiumScreen 
                  userProfile={userProfile}
                  currentPayment={currentPayment}
                  showToast={showToast}
                  onPaymentSubmitted={(pay) => {
                    setCurrentPayment(pay);
                  }}
                />
              )}

              {/* Ranking view */}
              {currentView === "ranking" && (
                <RankingScreen 
                  currentUserProfile={userProfile}
                  showToast={showToast}
                />
              )}

              {/* Profile view */}
              {currentView === "profile" && (
                <ProfileScreen 
                  userProfile={userProfile}
                  completedExams={completedExams}
                  showToast={showToast}
                  onLogout={handleLogout}
                />
              )}

            </div>
          )}

        </AnimatePresence>
      </main>

      {/* 3. Global Footer Layout */}
      <footer className="bg-neutral-950 border-t border-neutral-900 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>
            <span>© 2026 DTM MASTER Prep Platform. O'zbekiston Davlat Test Markazi talablari asosida.</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick hidden link/button for Admin portal access */}
            <button
              onClick={() => setCurrentView("admin")}
              className="hover:text-red-500 flex items-center gap-1 transition-all font-semibold uppercase tracking-wider text-[10px]"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin kirish</span>
            </button>
            <span>•</span>
            <span className="font-medium">Version 1.0.4 PROD</span>
          </div>
        </div>
      </footer>

      {/* 4. Global Toast alerts renderer */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            <div className={`p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md ${
              toast.type === "success" 
                ? "bg-neutral-900 border-emerald-500/30 text-emerald-400" 
                : toast.type === "error" 
                  ? "bg-neutral-900 border-red-500/30 text-red-400" 
                  : "bg-neutral-900 border-amber-500/30 text-amber-500"
            }`}>
              <div className="shrink-0 pt-0.5">
                {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                {toast.type === "info" && <Info className="w-4 h-4 text-amber-500" />}
              </div>
              <div>
                <p className="text-xs font-semibold leading-relaxed text-white">
                  {toast.message}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
