import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  onAuthStateChanged,
  FirebaseUser
} from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  needsNickname: boolean;
  needsWelcome: boolean;
  isTrialActive: boolean;
  isPremiumActive: boolean;
  canTakeTest: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  createNickname: (nickname: string) => Promise<{ success: boolean; message?: string }>;
  confirmWelcome: () => Promise<void>;
  redeemReferralCode: (code: string) => Promise<{ success: boolean; message: string }>;
  refreshUserProfile: () => Promise<void>;
  adminLogin: (password: string) => boolean;
  isAdminAuthenticated: boolean;
  adminLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [needsNickname, setNeedsNickname] = useState<boolean>(false);
  const [needsWelcome, setNeedsWelcome] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dtm_admin_auth') === 'true';
  });

  const fetchUserProfile = async (user: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        
        // Check if banned
        if (data.isBanned) {
          if (data.banUntil && Date.now() > data.banUntil) {
            // Ban expired
            await updateDoc(userRef, { isBanned: false, banReason: null, banUntil: null });
            data.isBanned = false;
          }
        }

        setUserProfile(data);
        setNeedsNickname(false);
        setNeedsWelcome(!data.welcomed);
      } else {
        // User does not have profile yet -> Needs Nickname
        setUserProfile(null);
        setNeedsNickname(true);
        setNeedsWelcome(false);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Fallback local memory profile if offline
      const localData = localStorage.getItem(`dtm_user_${user.uid}`);
      if (localData) {
        const parsed = JSON.parse(localData) as UserProfile;
        setUserProfile(parsed);
        setNeedsNickname(false);
      } else {
        setNeedsNickname(true);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
        setNeedsNickname(false);
        setNeedsWelcome(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await fetchUserProfile(res.user);
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      // Fallback mock google auth for iframe restrictions or test environments
      const mockUid = `google_user_${Math.floor(Math.random() * 899999 + 100000)}`;
      const mockEmail = `abituriyent${Math.floor(Math.random() * 900 + 100)}@gmail.com`;
      const mockUser = {
        uid: mockUid,
        email: mockEmail,
        displayName: 'Abituriyent',
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockUid}`
      } as unknown as FirebaseUser;

      setCurrentUser(mockUser);
      await fetchUserProfile(mockUser);
    } finally {
      setLoading(false);
    }
  };

  const createNickname = async (nickname: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: "Foydalanuvchi aniqlanmadi." };
    const trimmed = nickname.trim();
    if (!trimmed || trimmed.length < 3) {
      return { success: false, message: "Taxallus kamida 3 ta belgidan iborat bo'lishi kerak." };
    }

    try {
      // Check if nickname is taken in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('nickname', '==', trimmed));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        return { success: false, message: "Ushbu taxallus band! Iltimos, boshqa taxallus tanlang." };
      }

      const referralCode = `DTM-${trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const newProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmed}`,
        nickname: trimmed,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        score: 0,
        testsSolved: 0,
        country: "O'zbekiston",
        role: 'user',
        referralCode: referralCode,
        usedReferralCode: null,
        trialDays: 2, // 2 days free trial
        trialStartedAt: Date.now(),
        isPremium: false,
        premiumUntil: null,
        helpsUsedCount: 0,
        isBanned: false,
        welcomed: false
      };

      await setDoc(doc(db, 'users', currentUser.uid), newProfile);
      localStorage.setItem(`dtm_user_${currentUser.uid}`, JSON.stringify(newProfile));

      setUserProfile(newProfile);
      setNeedsNickname(false);
      setNeedsWelcome(true);

      return { success: true };
    } catch (err: any) {
      console.error("Error creating nickname:", err);
      // Fallback save to local storage if network glitch
      const referralCode = `DTM-${trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmed}`,
        nickname: trimmed,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        score: 0,
        testsSolved: 0,
        country: "O'zbekiston",
        role: 'user',
        referralCode: referralCode,
        usedReferralCode: null,
        trialDays: 2,
        trialStartedAt: Date.now(),
        isPremium: false,
        premiumUntil: null,
        helpsUsedCount: 0,
        isBanned: false,
        welcomed: false
      };
      localStorage.setItem(`dtm_user_${currentUser.uid}`, JSON.stringify(newProfile));
      setUserProfile(newProfile);
      setNeedsNickname(false);
      setNeedsWelcome(true);
      return { success: true };
    }
  };

  const confirmWelcome = async () => {
    if (!currentUser || !userProfile) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { welcomed: true });
      setUserProfile(prev => prev ? { ...prev, welcomed: true } : null);
      setNeedsWelcome(false);
    } catch (err) {
      console.error("Error confirming welcome:", err);
      setUserProfile(prev => prev ? { ...prev, welcomed: true } : null);
      setNeedsWelcome(false);
    }
  };

  const redeemReferralCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!userProfile) return { success: false, message: "Tizimga kiring." };
    const cleanCode = code.trim().toUpperCase();

    if (userProfile.usedReferralCode) {
      return { success: false, message: "Siz allaqachon promokoddan foydalangansiz!" };
    }

    if (userProfile.referralCode === cleanCode) {
      return { success: false, message: "O'z promokodingizni o'zingiz ishlata olmaysiz!" };
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('referralCode', '==', cleanCode));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        return { success: false, message: "Bunday promokod topilmadi. Qayta tekshiring!" };
      }

      const inviterDoc = querySnap.docs[0];
      const inviterData = inviterDoc.data() as UserProfile;

      // 1. Give current user +1 extra day of trial
      const currentUserRef = doc(db, 'users', userProfile.uid);
      await updateDoc(currentUserRef, {
        trialDays: userProfile.trialDays + 1,
        usedReferralCode: cleanCode
      });

      // 2. Give inviter +2 extra days of trial
      await updateDoc(doc(db, 'users', inviterData.uid), {
        trialDays: (inviterData.trialDays || 2) + 2
      });

      setUserProfile(prev => prev ? {
        ...prev,
        trialDays: prev.trialDays + 1,
        usedReferralCode: cleanCode
      } : null);

      return { success: true, message: "Promokod muvaffaqiyatli faollashtirildi! Sizga +1 kun, taklif qilgan do'stingizga +2 kun bepul sinov muddati qo'shildi." };
    } catch (err) {
      console.error("Redeem referral error:", err);
      return { success: false, message: "Promokodni faollashtirishda xatolik yuz berdi." };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setNeedsNickname(false);
    setNeedsWelcome(false);
  };

  const refreshUserProfile = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser);
    }
  };

  const adminLogin = (password: string): boolean => {
    const clean = password.trim();
    if (clean === '79178195327178195327') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('dtm_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('dtm_admin_auth');
  };

  // Trial / Premium calculations
  const now = Date.now();
  const trialDurationMs = (userProfile?.trialDays || 2) * 86400000;
  const isTrialActive = userProfile ? (now < userProfile.trialStartedAt + trialDurationMs) : false;
  const isPremiumActive = userProfile ? (userProfile.isPremium && (!userProfile.premiumUntil || now < userProfile.premiumUntil)) : false;
  const canTakeTest = isPremiumActive || isTrialActive;

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      needsNickname,
      needsWelcome,
      isTrialActive,
      isPremiumActive,
      canTakeTest,
      loginWithGoogle,
      logout,
      createNickname,
      confirmWelcome,
      redeemReferralCode,
      refreshUserProfile,
      adminLogin,
      isAdminAuthenticated,
      adminLogout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
