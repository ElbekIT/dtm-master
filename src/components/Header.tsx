import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Award, 
  Crown, 
  User, 
  Bell, 
  Gift, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  X, 
  Home, 
  Info, 
  Sparkles 
} from 'lucide-react';
import { PromocodeModal } from './PromocodeModal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { userProfile, logout, isPremiumActive, isTrialActive, loginWithGoogle } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);

  const handleNav = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => handleNav('home')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1">
                DTM <span className="text-blue-600">MASTER</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                O'zbekiston Imtihon Platformasi
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => handleNav('home')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'home' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Asosiy</span>
            </button>

            <button
              onClick={() => handleNav('ranking')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ranking' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Reyting</span>
            </button>

            <button
              onClick={() => handleNav('notifications')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 relative cursor-pointer ${
                activeTab === 'notifications' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Habarnoma</span>
            </button>

            <button
              onClick={() => handleNav('profile')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profil</span>
            </button>

            <button
              onClick={() => handleNav('about')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'about' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Biz haqimizda</span>
            </button>

            <button
              onClick={() => handleNav('admin')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'admin' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Admin Panel</span>
            </button>
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-2.5">
            {userProfile ? (
              <>
                {/* Promocode Modal Trigger */}
                <button
                  onClick={() => setPromoModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span>Promokod</span>
                </button>

                {/* Premium / Trial Status Pill */}
                <button
                  onClick={() => handleNav('premium')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    isPremiumActive
                      ? 'bg-amber-500 text-white border-amber-400 shadow-sm shadow-amber-500/20 hover:bg-amber-600'
                      : isTrialActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-500 text-white border-rose-400 animate-pulse hover:bg-rose-600'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>
                    {isPremiumActive ? 'PREMIUM' : isTrialActive ? 'Sinov' : 'Premium Olish'}
                  </span>
                </button>

                {/* User Avatar & Nickname */}
                <div 
                  onClick={() => handleNav('profile')}
                  className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 rounded-full cursor-pointer transition"
                >
                  <span className="hidden lg:block text-xs font-bold text-slate-700 max-w-[100px] truncate">
                    {userProfile.nickname}
                  </span>
                  <img
                    src={userProfile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.nickname}`}
                    alt="User photo"
                    className="w-8 h-8 rounded-full border border-blue-200 object-cover"
                  />
                </div>

                {/* Admin Switch Link */}
                <button
                  onClick={() => handleNav('admin')}
                  title="Admin Panel"
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5" />
                </button>

                {/* Logout */}
                <button
                  onClick={logout}
                  title="Tizimdan chiqish"
                  className="hidden sm:flex p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Google orqali kirish</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2">
            <button
              onClick={() => handleNav('home')}
              className={`w-full p-3 rounded-xl text-left font-semibold text-sm flex items-center gap-3 ${
                activeTab === 'home' ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Asosiy</span>
            </button>

            <button
              onClick={() => handleNav('ranking')}
              className={`w-full p-3 rounded-xl text-left font-semibold text-sm flex items-center gap-3 ${
                activeTab === 'ranking' ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
              }`}
            >
              <Award className="w-5 h-5" />
              <span>Reyting</span>
            </button>

            <button
              onClick={() => handleNav('notifications')}
              className={`w-full p-3 rounded-xl text-left font-semibold text-sm flex items-center gap-3 ${
                activeTab === 'notifications' ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>Habarnoma</span>
            </button>

            <button
              onClick={() => handleNav('profile')}
              className={`w-full p-3 rounded-xl text-left font-semibold text-sm flex items-center gap-3 ${
                activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
              }`}
            >
              <User className="w-5 h-5" />
              <span>Profil</span>
            </button>

            <button
              onClick={() => handleNav('premium')}
              className={`w-full p-3 rounded-xl text-left font-semibold text-sm flex items-center gap-3 ${
                activeTab === 'premium' ? 'bg-amber-50 text-amber-600' : 'text-slate-700'
              }`}
            >
              <Crown className="w-5 h-5 text-amber-500" />
              <span>Premium Olish</span>
            </button>

            <button
              onClick={() => {
                setPromoModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full p-3 rounded-xl text-left font-semibold text-sm flex items-center gap-3 text-amber-700 bg-amber-50"
            >
              <Gift className="w-5 h-5 text-amber-600" />
              <span>Promokod Olish</span>
            </button>

            <button
              onClick={() => handleNav('admin')}
              className={`w-full p-3 rounded-xl text-left font-semibold text-sm flex items-center gap-3 ${
                activeTab === 'admin' ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Admin Panel</span>
            </button>

            {userProfile && (
              <button
                onClick={logout}
                className="w-full p-3 rounded-xl text-left font-semibold text-sm flex items-center gap-3 text-rose-600 bg-rose-50"
              >
                <LogOut className="w-5 h-5" />
                <span>Chiqish</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Promocode Modal */}
      <PromocodeModal isOpen={promoModalOpen} onClose={() => setPromoModalOpen(false)} />
    </>
  );
};
