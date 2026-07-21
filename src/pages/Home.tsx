/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Compass, Shield, Cpu, Code, Database, Radio, 
  HelpCircle, Trophy, BookOpen, Clock, Activity, ArrowRight, Zap 
} from "lucide-react";
import { User } from "../types";

interface HomeProps {
  currentUser: User;
  onStartTest: (directionId: string, directionName: string) => void;
  setCurrentTab: (tab: string) => void;
}

export default function Home({ currentUser, onStartTest, setCurrentTab }: HomeProps) {
  const [showDirections, setShowDirections] = useState(false);

  const directions = [
    {
      id: "comp_eng",
      name: "Kompyuter Injenering",
      description: "Kompyuter arxitekturasi, tizimli dasturlash, ma'lumotlar bazasi va tarmoq texnologiyalari.",
      icon: Cpu,
      color: "from-blue-500 to-indigo-600",
      bgLight: "bg-blue-50 text-blue-600",
      subjects: ["Matematika", "Fizika", "Kompyuter Arxitekturasi", "Ma'lumotlar bazasi"]
    },
    {
      id: "cyber_sec",
      name: "Kiber Xavfsizlik",
      description: "Kriptografiya, tarmoq xavfsizligi, operatsion tizimlar va zaifliklarni aniqlash.",
      icon: Shield,
      color: "from-red-500 to-rose-600",
      bgLight: "bg-red-50 text-red-600",
      subjects: ["Matematika", "Fizika", "Kriptografiya", "Tarmoq xavfsizligi"]
    },
    {
      id: "ai",
      name: "Sun'iy Intellekt",
      description: "Mashinali o'rganish, neyron tarmoqlar, ma'lumotlar tahlili va Python dasturlash.",
      icon: Compass,
      color: "from-purple-500 to-violet-600",
      bgLight: "bg-purple-50 text-purple-600",
      subjects: ["Matematika", "Fizika", "Machine Learning", "Algoritmlar"]
    },
    {
      id: "soft_eng",
      name: "Dasturiy Injenering",
      description: "Dasturiy ta'minot arxitekturasi, loyihalash, ma'lumotlar tuzilmalari va algoritmlar.",
      icon: Code,
      color: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50 text-emerald-600",
      subjects: ["Matematika", "Fizika", "Algoritmlar va Ma'lumotlar Strukturasi", "Dasturlash"]
    },
    {
      id: "it",
      name: "Axborot Texnologiyalari",
      description: "Tizimlar integratsiyasi, veb dasturlash, bulutli texnologiyalar va tarmoq boshqaruvi.",
      icon: Database,
      color: "from-cyan-500 to-blue-600",
      bgLight: "bg-cyan-50 text-cyan-600",
      subjects: ["Matematika", "Fizika", "Bulutli Hisoblashlar", "Veb dasturlash"]
    },
    {
      id: "telecom",
      name: "Telekommunikatsiya",
      description: "Aloqa tizimlari, raqamli signallar, chastotalar boshqaruvi va tolali optik aloqa.",
      icon: Radio,
      color: "from-orange-500 to-amber-600",
      bgLight: "bg-orange-50 text-orange-600",
      subjects: ["Matematika", "Fizika", "Signal Processing", "Aloqa tizimlari"]
    },
    {
      id: "robotics",
      name: "Robototexnika",
      description: "Mikrokontrollerlar, datchiklar, mexatronika va elektronika asoslari.",
      icon: Zap,
      color: "from-amber-500 to-yellow-600",
      bgLight: "bg-amber-50 text-amber-600",
      subjects: ["Matematika", "Fizika", "Mikrokontrollerlar", "Mexatronika"]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Normal Welcome Dashboard */}
      {!showDirections ? (
        <div className="space-y-12">
          {/* Welcome Card / Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl opacity-50 -z-10 translate-x-20 -translate-y-20" />
            
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center space-x-1.5 bg-primary-50 text-primary-600 px-3 py-1.5 rounded-full text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Muddati: 3 soat | 90 ta Savol</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
                Assalomu alaykum, <span className="text-primary-600">{currentUser.nickname}</span>!
              </h1>
              <p className="text-slate-600 text-base sm:text-lg">
                DTM MASTER platformasiga xush kelibsiz. Bu yerda siz DTM, Perevod (o'qishni ko'chirish) va Universitet kirish imtihonlariga professional tarzda, real sharoitlarda tayyorlanishingiz mumkin.
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  id="start-exam-flow"
                  onClick={() => setShowDirections(true)}
                  className="dtm-btn-primary flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-primary-500/10 hover:shadow-lg"
                >
                  <span>TESTNI BOSHLASH</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentTab("ranking")}
                  className="dtm-btn-secondary flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>Global Reytingni ko'rish</span>
                </button>
              </div>
            </div>

            {/* Quick stats on the right */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between w-full md:w-80 min-h-[180px]">
              <div className="text-sm font-semibold text-slate-500 mb-4 flex items-center space-x-1">
                <Activity className="w-4 h-4 text-primary-500" />
                <span>Sizning statistika</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200/50">
                  <div className="text-xs text-slate-400 font-medium">Imtihonlar</div>
                  <div className="text-xl font-bold text-slate-800">{currentUser.testsSolved} ta</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/50">
                  <div className="text-xs text-slate-400 font-medium">O'rtacha ball</div>
                  <div className="text-xl font-bold text-slate-800">{currentUser.score || "0"} ball</div>
                </div>
              </div>
              <div className="mt-4 text-center text-xs text-slate-400">
                O'tish bali: <span className="font-semibold text-emerald-600">94.0 ball</span>
              </div>
            </div>
          </motion.div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="dtm-card p-6 flex items-start space-x-4">
              <div className="p-3 bg-blue-50 text-primary-600 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-800 text-lg mb-1">90 ta Savol tizimi</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Matematika, Fizika, Ona Tili, O'zbekiston Tarixi hamda mutaxassislik fani bo'yicha to'liq taqsimot.
                </p>
              </div>
            </div>

            <div className="dtm-card p-6 flex items-start space-x-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-800 text-lg mb-1">Global Reyting</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Uzbekistan bo'yicha barcha abituriyentlar orasida o'z bilim darajangizni va egallagan o'rningizni solishtiring.
                </p>
              </div>
            </div>

            <div className="dtm-card p-6 flex items-start space-x-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-800 text-lg mb-1">Kopiya va Cheatga qarshi</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Sizning bilmingiz haqqoniy baholanishi uchun maxsus fiksatsiya tizimlari joriy qilingan.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 2. Direction Selection Screen */
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <button 
                onClick={() => setShowDirections(false)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2 inline-flex items-center space-x-1 cursor-pointer"
              >
                <span>← Orqaga qaytish</span>
              </button>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                Yo'nalishni tanlang
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Siz tayyorlanayotgan yoki hujjat topshirgan mutaxassislik yo'nalishini tanlang.
              </p>
            </div>
            <div className="text-xs bg-amber-50 text-amber-700 font-semibold p-3 border border-amber-100 rounded-xl">
              Eslatma: Imtihon boshlangandan keyin uni to'xtatib bo'lmaydi!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {directions.map((dir, idx) => {
              const Icon = dir.icon;
              return (
                <motion.div
                  key={dir.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="dtm-card p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                  onClick={() => onStartTest(dir.id, dir.name)}
                >
                  <div className="space-y-4">
                    <div className={`p-3 w-12 h-12 rounded-xl ${dir.bgLight} flex items-center justify-center font-bold`}>
                      <Icon className="w-6 h-6 stroke-[2]" />
                    </div>
                    
                    <div>
                      <h3 className="font-display font-bold text-slate-800 text-lg group-hover:text-primary-600 transition-colors">
                        {dir.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        {dir.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                      90 ta Savol
                    </span>
                    <span className="text-primary-600 inline-flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                      <span>Boshlash</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
