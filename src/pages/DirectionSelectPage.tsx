import React, { useState } from 'react';
import { DIRECTIONS_LIST } from '../data/directions';
import { Direction } from '../types';
import { 
  ShieldAlert, 
  Code, 
  Cpu, 
  Brain, 
  Server, 
  Radio, 
  Bot, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  Play,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface DirectionSelectPageProps {
  onSelectDirection: (direction: Direction) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  ShieldAlert: <ShieldAlert className="w-7 h-7 text-emerald-600" />,
  Code: <Code className="w-7 h-7 text-blue-600" />,
  Cpu: <Cpu className="w-7 h-7 text-indigo-600" />,
  Brain: <Brain className="w-7 h-7 text-purple-600" />,
  Server: <Server className="w-7 h-7 text-sky-600" />,
  Radio: <Radio className="w-7 h-7 text-amber-600" />,
  Bot: <Bot className="w-7 h-7 text-rose-600" />,
  Globe: <Globe className="w-7 h-7 text-teal-600" />
};

export const DirectionSelectPage: React.FC<DirectionSelectPageProps> = ({ onSelectDirection }) => {
  const [selectedId, setSelectedId] = useState<string>(DIRECTIONS_LIST[0].id);

  const selectedDirection = DIRECTIONS_LIST.find(d => d.id === selectedId) || DIRECTIONS_LIST[0];

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Ta'lim Yo'nalishini Tanlang</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Qaysi mutaxassislik bo'yicha imtihon topshirasiz?
        </h2>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Har bir yo'nalish bo'yicha 90 ta savoldan iborat maxsus tasodifiy test to'plami shakllantiriladi.
        </p>
      </div>

      {/* Grid of Directions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DIRECTIONS_LIST.map((direction) => {
          const isSelected = selectedId === direction.id;
          return (
            <motion.div
              key={direction.id}
              whileHover={{ y: -3 }}
              onClick={() => setSelectedId(direction.id)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                isSelected 
                  ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20' 
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-blue-600">
                  <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white" />
                </div>
              )}

              <div className="space-y-3">
                <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center">
                  {ICON_MAP[direction.iconName] || <Code className="w-7 h-7 text-blue-600" />}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {direction.title}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                    {direction.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100/80 text-[11px] text-slate-400 font-medium">
                90 savol • 4 soat
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Direction Details & Launch Button */}
      {selectedDirection && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Tanlangan Yo'nalish</span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900">{selectedDirection.title}</h3>
            <p className="text-slate-500 text-sm max-w-lg">{selectedDirection.description}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                Matematika (20 ta)
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                Fizika (15 ta)
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                Ona tili (15 ta)
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                Tarix (15 ta)
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                Majburiy Math (10 ta)
              </span>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                Sohaviy (15 ta)
              </span>
            </div>
          </div>

          <button
            onClick={() => onSelectDirection(selectedDirection)}
            className="w-full md:w-auto py-4 px-8 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 transition cursor-pointer text-base shrink-0"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Imtihonni Boshlash</span>
          </button>
        </motion.div>
      )}

    </div>
  );
};
