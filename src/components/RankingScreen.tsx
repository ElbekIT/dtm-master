import React, { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile } from "../types";
import { motion } from "motion/react";
import { 
  Trophy, 
  Crown, 
  Clock, 
  HelpCircle, 
  RefreshCw, 
  Award, 
  User,
  Zap,
  Target
} from "lucide-react";

interface RankingScreenProps {
  currentUserProfile: UserProfile | null;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function RankingScreen({ currentUserProfile, showToast }: RankingScreenProps) {
  const [rankings, setRankings] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Attempt to load cached rankings first to make rendering instant
    const cached = localStorage.getItem("dtm_rankings_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as UserProfile[];
        if (parsed && parsed.length > 0) {
          setRankings(parsed);
          setIsLoading(false);
        }
      } catch (e) {
        console.warn("Failed to parse cached rankings:", e);
      }
    }

    // 1. Fetch real-time ranking data directly from Firestore 'users' collection
    // No mock users, only real users sorted strictly by Highest Score, lowest Time, lowest help used
    const usersRef = collection(db, "users");
    
    // Query without compound sorting to avoid index requirements
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        const u = doc.data() as UserProfile;
        if (u.examCount && u.examCount > 0) {
          list.push(u);
        }
      });

      // Sort client-side on multiple fields flawlessly
      list.sort((a, b) => {
        // 1. Highest Score (descending)
        if (b.highestScore !== a.highestScore) {
          return b.highestScore - a.highestScore;
        }
        // 2. Lowest Time spent (ascending)
        const aTime = a.lowestTime || 999999;
        const bTime = b.lowestTime || 999999;
        if (aTime !== bTime) {
          return aTime - bTime;
        }
        // 3. Help Used Total (ascending)
        return (a.helpUsedTotal || 0) - (b.helpUsedTotal || 0);
      });

      const sliced = list.slice(0, 100);
      setRankings(sliced);
      localStorage.setItem("dtm_rankings_cache", JSON.stringify(sliced));
      setIsLoading(false);
    }, (error) => {
      console.warn("Realtime ranking subscription error (safely using offline mode):", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTimeSpent = (seconds: number) => {
    if (!seconds || seconds <= 0) return "N/A";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}s ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div id="ranking-portal" className="max-w-4xl mx-auto px-6 py-8 space-y-10">
      {/* 1. Header display */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex p-3 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-500">
          <Trophy className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">
          Milliy Reyting Jadvali
        </h1>
        <p className="text-zinc-400 max-w-lg mx-auto text-xs leading-relaxed">
          Platformaning eng kuchli talabalari reytingi. Reyting natijalari real vaqtda yangilanadi va barcha foydalanuvchilar uchun bir xildir.
        </p>
      </div>

      {/* 2. Podium display for Top 3 */}
      {!isLoading && rankings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end max-w-2xl mx-auto pt-4">
          {/* 2nd Place */}
          {rankings[1] && (
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 text-center shadow-lg flex flex-col items-center order-2 md:order-1 relative md:h-[220px] justify-center hover:border-zinc-700 transition-colors duration-300">
              <span className="absolute top-4 left-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">2-O'RIN</span>
              <img 
                src={rankings[1].photoURL} 
                alt={rankings[1].displayName} 
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full border-2 border-zinc-700/60 mb-3 object-cover shadow-md" 
              />
              <h3 className="font-bold text-white text-sm truncate max-w-full">
                {rankings[1].displayName}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">@{rankings[1].username}</p>
              <div className="mt-3 text-amber-500 font-bold text-lg font-mono">
                {rankings[1].highestScore} <span className="text-[11px] text-zinc-500 font-normal">ball</span>
              </div>
            </div>
          )}

          {/* 1st Place (Crown) */}
          {rankings[0] && (
            <div className="bg-zinc-900/60 border border-amber-500/20 rounded-2xl p-8 text-center shadow-xl flex flex-col items-center order-1 md:order-2 relative md:h-[260px] justify-center ring-1 ring-amber-500/10 hover:border-amber-500/40 transition-colors duration-300">
              <div className="absolute -top-6 text-amber-400 drop-shadow-md">
                <Crown className="w-10 h-10 animate-bounce" style={{ animationDuration: '4s' }} />
              </div>
              <span className="absolute top-4 left-4 text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">G'OLIB</span>
              <img 
                src={rankings[0].photoURL} 
                alt={rankings[0].displayName} 
                referrerPolicy="no-referrer"
                className="w-18 h-18 rounded-full border-2 border-amber-500 mb-3 object-cover shadow-lg" 
              />
              <h3 className="font-extrabold text-white text-base truncate max-w-full">
                {rankings[0].displayName}
              </h3>
              <p className="text-[10px] text-amber-500/80 font-mono font-bold">@{rankings[0].username}</p>
              <div className="mt-4 text-amber-500 font-extrabold text-2xl font-mono">
                {rankings[0].highestScore} <span className="text-xs text-zinc-400 font-medium">ball</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {rankings[2] && (
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 text-center shadow-lg flex flex-col items-center order-3 md:order-3 relative md:h-[200px] justify-center hover:border-zinc-700 transition-colors duration-300">
              <span className="absolute top-4 left-4 text-[10px] font-bold text-amber-800 uppercase tracking-widest">3-O'RIN</span>
              <img 
                src={rankings[2].photoURL} 
                alt={rankings[2].displayName} 
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full border-2 border-amber-900/40 mb-3 object-cover shadow-md" 
              />
              <h3 className="font-bold text-white text-sm truncate max-w-full">
                {rankings[2].displayName}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">@{rankings[2].username}</p>
              <div className="mt-3 text-amber-500 font-bold text-base font-mono">
                {rankings[2].highestScore} <span className="text-[11px] text-zinc-500 font-normal">ball</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Leaders Table List */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/20">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Top 100 Talabalar</span>
          <span className="text-[10px] bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800 text-zinc-500 font-mono flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-500" /> Live Sync
          </span>
        </div>

        {isLoading ? (
          <div className="p-20 text-center flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-zinc-500 font-medium">Natijalar jadvali yuklanmoqda...</p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="p-20 text-center text-xs text-zinc-500">
            Hozircha reyting jadvalida hech kim yo'q. Birinchi bo'ling!
          </div>
        ) : (
          <div className="divide-y divide-zinc-900/60 overflow-x-auto">
            {/* Table Header */}
            <div className="grid grid-cols-12 p-4.5 text-[10px] font-bold text-zinc-500 uppercase bg-zinc-950/40 select-none min-w-[640px] border-b border-zinc-900/40">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4 pl-4">Foydalanuvchi</div>
              <div className="col-span-2 text-center">Maks Ball</div>
              <div className="col-span-2 text-center">O'rtacha Ball</div>
              <div className="col-span-2 text-center">Eng Tez Vaqt</div>
              <div className="col-span-1 text-center">Yordam</div>
            </div>

            {/* Table Rows list */}
            {rankings.map((user, idx) => {
              const isCurrentUser = currentUserProfile?.uid === user.uid;

              return (
                <div 
                  key={user.uid}
                  className={`grid grid-cols-12 p-4 items-center text-xs text-zinc-300 min-w-[640px] transition-all hover:bg-zinc-900/60 ${
                    isCurrentUser ? "bg-amber-500/5 border-l-2 border-l-amber-500" : ""
                  }`}
                >
                  {/* Rank No */}
                  <div className="col-span-1 text-center font-bold text-sm">
                    {idx === 0 && <span className="text-amber-500 font-extrabold text-base">🥇</span>}
                    {idx === 1 && <span className="text-zinc-400 font-extrabold text-base">🥈</span>}
                    {idx === 2 && <span className="text-amber-700 font-extrabold text-base">🥉</span>}
                    {idx > 2 && idx + 1}
                  </div>

                  {/* Identity */}
                  <div className="col-span-4 flex items-center gap-3 pl-4">
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-zinc-800 object-cover shrink-0 shadow-sm" 
                    />
                    <div className="truncate pr-2">
                      <span className={`font-bold block truncate ${isCurrentUser ? "text-amber-500" : "text-white"}`}>
                        {user.displayName}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono block">@{user.username}</span>
                    </div>
                  </div>

                  {/* High Score */}
                  <div className="col-span-2 text-center font-bold font-mono text-white text-sm">
                    {user.highestScore} <span className="text-[10px] text-zinc-500 font-normal">/ 90</span>
                  </div>

                  {/* Average Score */}
                  <div className="col-span-2 text-center font-semibold font-mono text-zinc-400">
                    {user.avgScore}
                  </div>

                  {/* Lowest Time spent */}
                  <div className="col-span-2 text-center font-mono text-zinc-400 flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-600" />
                    <span>{formatTimeSpent(user.lowestTime)}</span>
                  </div>

                  {/* Help Lifelines Used */}
                  <div className="col-span-1 text-center font-mono text-zinc-500">
                    {user.helpUsedTotal}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
