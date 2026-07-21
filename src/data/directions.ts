import { Direction } from '../types';

export const DIRECTIONS_LIST: Direction[] = [
  {
    id: 'cyber_security',
    title: "Kiber Xavfsizlik",
    description: "Tizimlar xavfsizligi, tarmoq himoyasi, kriptografiya va axborot daxlsizligi.",
    iconName: 'ShieldAlert',
    professionalSubjects: ["Dasturlash", "Kiberxavfsizlik", "Kompyuter tarmoqlari"],
    totalQuestions: 90
  },
  {
    id: 'software_engineering',
    title: "Dasturiy Injenering",
    description: "Algoritmlar, ob'ektga yo'naltirilgan dasturlash, dasturiy ta'minot arxitekturasi va Web texnologiyalar.",
    iconName: 'Code',
    professionalSubjects: ["Dasturlash va Algoritmlar", "Dasturiy Ta'minot Injeneriyasi"],
    totalQuestions: 90
  },
  {
    id: 'computer_engineering',
    title: "Kompyuter Injenering",
    description: "Mikroprotsessorlar, kompyuter arxitekturasi, operatsion tizimlar va apparat ta'minoti.",
    iconName: 'Cpu',
    professionalSubjects: ["Kompyuter Arxitekturasi", "Dasturlash va Elektronika"],
    totalQuestions: 90
  },
  {
    id: 'artificial_intelligence',
    title: "Sun'iy Intellekt",
    description: "Mashinali o'rgatish, neyron tarmoqlar, ma'lumotlar tahlili va intellektual tizimlar.",
    iconName: 'Brain',
    professionalSubjects: ["Sun'iy Intellekt Asoslari", "Dasturlash va Algoritmlar"],
    totalQuestions: 90
  },
  {
    id: 'info_tech',
    title: "Axborot Texnologiyalari",
    description: "Ma'lumotlar bazasi, korporativ tizimlar, cloud texnologiyalar va IT loyihalarni boshqarish.",
    iconName: 'Server',
    professionalSubjects: ["Ma'lumotlar Bazasi va Tizimlar", "Dasturlash"],
    totalQuestions: 90
  },
  {
    id: 'telecommunication',
    title: "Telekommunikatsiya",
    description: "Mobil va optik aloqa, signallarni qayta ishlash, simsiz texnologiyalar va radioaloqa.",
    iconName: 'Radio',
    professionalSubjects: ["Telekommunikatsiya Tizimlari", "Fizika va Aloqa"],
    totalQuestions: 90
  },
  {
    id: 'robotics',
    title: "Robototexnika",
    description: "Mikrokontrollerlar, mexatronika, avtomatlashtirilgan boshqaruv va sensorlar.",
    iconName: 'Bot',
    professionalSubjects: ["Robototexnika Asoslari", "Elektronika va Dasturlash"],
    totalQuestions: 90
  },
  {
    id: 'web_data',
    title: "Web Dasturlash va Ma'lumotlar Bazasi",
    description: "Full-stack web dasturlash, SQL/NoSQL ma'lumotlar bazasi, cloud xizmatlar.",
    iconName: 'Globe',
    professionalSubjects: ["Web Dasturlash", "Ma'lumotlar Bazasi"],
    totalQuestions: 90
  }
];
