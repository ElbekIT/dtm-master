import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NicknameModal } from './components/NicknameModal';
import { WelcomeModal } from './components/WelcomeModal';
import { HomePage } from './pages/HomePage';
import { DirectionSelectPage } from './pages/DirectionSelectPage';
import { TestExamPage } from './pages/TestExamPage';
import { ResultPage } from './pages/ResultPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { PremiumPage } from './pages/PremiumPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminPage } from './pages/AdminPage';
import { AboutPage } from './pages/AboutPage';
import { Direction, TestResult } from './types';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { needsNickname, needsWelcome, canTakeTest, userProfile, isTrialActive, isPremiumActive } = useAuth();
  
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedDirection, setSelectedDirection] = useState<Direction | null>(null);
  const [examResult, setExamResult] = useState<TestResult | null>(null);

  const handleStartTestClick = () => {
    if (!canTakeTest) {
      setActiveTab('premium');
      return;
    }
    setActiveTab('select_direction');
  };

  const handleDirectionChosen = (direction: Direction) => {
    if (!canTakeTest) {
      setActiveTab('premium');
      return;
    }
    setSelectedDirection(direction);
    setActiveTab('test');
  };

  const handleFinishExam = (result: TestResult) => {
    setExamResult(result);
    setActiveTab('result');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-200">
      
      {/* Header */}
      {activeTab !== 'test' && (
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && (
              <HomePage 
                onStartTest={handleStartTestClick}
                onOpenPremium={() => setActiveTab('premium')}
                onOpenRanking={() => setActiveTab('ranking')}
              />
            )}

            {activeTab === 'select_direction' && (
              <DirectionSelectPage 
                onSelectDirection={handleDirectionChosen} 
              />
            )}

            {activeTab === 'test' && selectedDirection && (
              <TestExamPage 
                direction={selectedDirection}
                onFinishExam={handleFinishExam}
                onCancelExam={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'result' && examResult && (
              <ResultPage 
                result={examResult}
                onRetakeTest={handleStartTestClick}
                onOpenRanking={() => setActiveTab('ranking')}
              />
            )}

            {activeTab === 'ranking' && (
              <LeaderboardPage />
            )}

            {activeTab === 'profile' && (
              <ProfilePage />
            )}

            {activeTab === 'notifications' && (
              <NotificationsPage />
            )}

            {activeTab === 'premium' && (
              <PremiumPage />
            )}

            {activeTab === 'admin' && (
              <AdminPage />
            )}

            {activeTab === 'about' && (
              <AboutPage />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      {activeTab !== 'test' && <Footer onNavigate={setActiveTab} />}

      {/* Nickname Entry Modal for New Users */}
      {needsNickname && <NicknameModal />}

      {/* Welcome Confirmation Modal for First Entrance */}
      {needsWelcome && <WelcomeModal />}

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
