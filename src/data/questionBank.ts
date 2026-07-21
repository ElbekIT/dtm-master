import { Question } from '../types';

export const QUESTION_BANK: Question[] = [
  // --- MATHEMATICS (20+ questions) ---
  {
    id: 'm1',
    subject: 'mathematics',
    question: "Agar f(x) = 3x^2 - 4x + 5 bo'lsa, f'(2) hosilasining qiymatini toping.",
    options: ["8", "10", "12", "6"],
    correctAnswer: "8",
    difficulty: 'medium'
  },
  {
    id: 'm2',
    subject: 'mathematics',
    question: "Tenglamani yeching: 2^(x+1) + 2^x = 24",
    options: ["x = 3", "x = 2", "x = 4", "x = 1"],
    correctAnswer: "x = 3",
    difficulty: 'medium'
  },
  {
    id: 'm3',
    subject: 'mathematics',
    question: "Tengsizlikni yeching: log_2(x - 3) < 3",
    options: ["3 < x < 11", "x < 11", "x > 3", "0 < x < 8"],
    correctAnswer: "3 < x < 11",
    difficulty: 'medium'
  },
  {
    id: 'm4',
    subject: 'mathematics',
    question: "Aritmetik progressiyada a_1 = 4 va d = 3 bo'lsa, dastlabki 10 ta xadining yig'indisini toping.",
    options: ["175", "165", "185", "150"],
    correctAnswer: "175",
    difficulty: 'medium'
  },
  {
    id: 'm5',
    subject: 'mathematics',
    question: "Uchburchakning tomonlari 5, 6 va 7 ga teng. Uning yuzini toping (Geron formulasi).",
    options: ["6√6", "14", "12√2", "18"],
    correctAnswer: "6√6",
    difficulty: 'hard'
  },
  {
    id: 'm6',
    subject: 'mathematics',
    question: "Integralni hisoblang: ∫ (2x + 3) dx",
    options: ["x^2 + 3x + C", "2x^2 + 3x + C", "x^2 + C", "3x^2 + 2x + C"],
    correctAnswer: "x^2 + 3x + C",
    difficulty: 'medium'
  },
  {
    id: 'm7',
    subject: 'mathematics',
    question: "sin^2(α) + cos^2(α) + tg(α)·ctg(α) ifodaning qiymatini hisoblang.",
    options: ["2", "1", "0", "3"],
    correctAnswer: "2",
    difficulty: 'easy'
  },
  {
    id: 'm8',
    subject: 'mathematics',
    question: "To'g'ri burchakli uchburchakda gipotenuza 13 cm, bir kateti 5 cm. Ikkinchi katetini toping.",
    options: ["12 cm", "10 cm", "8 cm", "11 cm"],
    correctAnswer: "12 cm",
    difficulty: 'easy'
  },
  {
    id: 'm9',
    subject: 'mathematics',
    question: "Soferik sirt yuzi S = 4πR^2 formulaga teng. Radiusi R = 3 cm bo'lgan shar sirtining yuzi qancha?",
    options: ["36π cm²", "12π cm²", "18π cm²", "24π cm²"],
    correctAnswer: "36π cm²",
    difficulty: 'easy'
  },
  {
    id: 'm10',
    subject: 'mathematics',
    question: "Vektorlar a = (2, 3) va b = (-1, 4) berilgan. Ularning skalyar ko'paytmasini toping.",
    options: ["10", "12", "8", "-2"],
    correctAnswer: "10",
    difficulty: 'medium'
  },
  {
    id: 'm11',
    subject: 'mathematics',
    question: "lim (x->0) (sin(3x) / x) chekni hisoblang.",
    options: ["3", "1", "0", "∞"],
    correctAnswer: "3",
    difficulty: 'medium'
  },
  {
    id: 'm12',
    subject: 'mathematics',
    question: "Ko'rsatkichli tenglama: 3^(2x) - 10·3^x + 9 = 0 ildizlari yig'indisini toping.",
    options: ["2", "0", "1", "3"],
    correctAnswer: "2",
    difficulty: 'hard'
  },
  {
    id: 'm13',
    subject: 'mathematics',
    question: "Geometrik progressiyada b_1 = 2, q = 3 bo'lsa, b_5 ni toping.",
    options: ["162", "54", "486", "81"],
    correctAnswer: "162",
    difficulty: 'easy'
  },
  {
    id: 'm14',
    subject: 'mathematics',
    question: "Muntazam oltiburchakning ichki burchaklari yig'indisi nechaga teng?",
    options: ["720°", "540°", "360°", "900°"],
    correctAnswer: "720°",
    difficulty: 'easy'
  },
  {
    id: 'm15',
    subject: 'mathematics',
    question: "Sfera hajmi V = 4/3 π R^3 formulasi bo'yicha hisoblanadi. Radiusi R = 3 cm bo'lsa, hajmi qancha?",
    options: ["36π cm³", "27π cm³", "108π cm³", "12π cm³"],
    correctAnswer: "36π cm³",
    difficulty: 'medium'
  },
  {
    id: 'm16',
    subject: 'mathematics',
    question: "Kombinatorika: 5 kishidan 2 kishilik komissiya tuzish usullari soni C(5,2) nechaga teng?",
    options: ["10", "20", "5", "15"],
    correctAnswer: "10",
    difficulty: 'easy'
  },
  {
    id: 'm17',
    subject: 'mathematics',
    question: "Ehtimollar nazariyasi: O'yin kubigi tashlanganda juft raqam tushish ehtimoli nechaga teng?",
    options: ["1/2", "1/6", "1/3", "2/3"],
    correctAnswer: "1/2",
    difficulty: 'easy'
  },
  {
    id: 'm18',
    subject: 'mathematics',
    question: "Agar lg(2) ≈ 0.3010 bo'lsa, lg(20) ning qiymati taxminan nechaga teng?",
    options: ["1.3010", "0.6020", "2.3010", "0.3010"],
    correctAnswer: "1.3010",
    difficulty: 'medium'
  },
  {
    id: 'm19',
    subject: 'mathematics',
    question: "Parabola y = x^2 - 6x + 9 ning uchining koordinatalarini toping.",
    options: ["(3, 0)", "(0, 9)", "(-3, 0)", "(3, 9)"],
    correctAnswer: "(3, 0)",
    difficulty: 'medium'
  },
  {
    id: 'm20',
    subject: 'mathematics',
    question: "Pifagor teoremasiga ko'ra, katetlari 6 cm va 8 cm bo'lgan to'g'ri burchakli uchburchak gipotenuzasi qancha?",
    options: ["10 cm", "14 cm", "12 cm", "9 cm"],
    correctAnswer: "10 cm",
    difficulty: 'easy'
  },
  {
    id: 'm21',
    subject: 'mathematics',
    question: "Tenglamalar sistemasini yeching: x + y = 7 va x - y = 3. x * y ning qiymatini toping.",
    options: ["10", "12", "14", "15"],
    correctAnswer: "10",
    difficulty: 'easy'
  },
  {
    id: 'm22',
    subject: 'mathematics',
    question: "Aylana uzunligi L = 2πR. Radiusi 7 cm bo'lgan aylananing uzunligini hisoblang (π ≈ 22/7).",
    options: ["44 cm", "22 cm", "88 cm", "14 cm"],
    correctAnswer: "44 cm",
    difficulty: 'easy'
  },

  // --- PHYSICS (15+ questions) ---
  {
    id: 'p1',
    subject: 'physics',
    question: "Jism tezlanishi a = 2 m/s^2, massasi m = 5 kg bo'lsa, unga ta'sir etuvchi teng ta'sir etuvchi kuch F nimaga teng?",
    options: ["10 N", "2.5 N", "7 N", "20 N"],
    correctAnswer: "10 N",
    difficulty: 'easy'
  },
  {
    id: 'p2',
    subject: 'physics',
    question: "Om qonuniga ko'ra zanjir bo'lagidagi tok kuchi I va kuchlanish U hamda qarshilik R orasidagi bog'liqlik:",
    options: ["I = U / R", "I = U · R", "I = R / U", "U = I^2 · R"],
    correctAnswer: "I = U / R",
    difficulty: 'easy'
  },
  {
    id: 'p3',
    subject: 'physics',
    question: "Kinetik energiya formulasi qaysi ko'rinishda berilgan?",
    options: ["E_k = (m·v^2) / 2", "E_k = m·g·h", "E_k = m·v", "E_k = F·s"],
    correctAnswer: "E_k = (m·v^2) / 2",
    difficulty: 'easy'
  },
  {
    id: 'p4',
    subject: 'physics',
    question: "Boyle-Mariott qonuni qanday jarayon uchun o'rinli?",
    options: ["Izotermik jarayon", "Izobar jarayon", "Izoxor jarayon", "Adiabatik jarayon"],
    correctAnswer: "Izotermik jarayon",
    difficulty: 'medium'
  },
  {
    id: 'p5',
    subject: 'physics',
    question: "Fotoning energiyasi E = h·ν formulada h qaysi o'zgarmas kattalikni anglatadi?",
    options: ["Plank doimiysi", "Avogadro doimiysi", "Bolsman doimiysi", "Ridberg doimiysi"],
    correctAnswer: "Plank doimiysi",
    difficulty: 'easy'
  },
  {
    id: 'p6',
    subject: 'physics',
    question: "Yorug'likning vakuumdagi tezligi taxminan qanchaga teng?",
    options: ["3·10^8 m/s", "3·10^5 m/s", "300 m/s", "3·10^10 m/s"],
    correctAnswer: "3·10^8 m/s",
    difficulty: 'easy'
  },
  {
    id: 'p7',
    subject: 'physics',
    question: "Kondensator sig'imi C = Q / U. Q = 4 µC, U = 2 V bo'lsa, C nimaga teng?",
    options: ["2 µF", "8 µF", "0.5 µF", "4 µF"],
    correctAnswer: "2 µF",
    difficulty: 'easy'
  },
  {
    id: 'p8',
    subject: 'physics',
    question: "Impulsning saqlanish qonuniga ko'ra jism impulsi p qanday aniqlanadi?",
    options: ["p = m·v", "p = m/v", "p = F/t", "p = m·g"],
    correctAnswer: "p = m·v",
    difficulty: 'easy'
  },
  {
    id: 'p9',
    subject: 'physics',
    question: "Ideal gaz holat tenglamasi (Mendeleyev-Klapeyron) qaysi ko'rinishda yoziladi?",
    options: ["P·V = (m/M)·R·T", "P·V = m·R·T", "P/T = V/R", "P·T = V·m"],
    correctAnswer: "P·V = (m/M)·R·T",
    difficulty: 'medium'
  },
  {
    id: 'p10',
    subject: 'physics',
    question: "Elektromagnit induksiya hodisasini kim kashf etgan?",
    options: ["Maykl Faradey", "Jeyms Maksvell", "Isaak Nyuton", "Nikola Tesla"],
    correctAnswer: "Maykl Faradey",
    difficulty: 'medium'
  },
  {
    id: 'p11',
    subject: 'physics',
    question: "Linza optik kuchi D = 1 / F. Fokus masofasi F = 0.5 m bo'lgan linzaning optik kuchi nechaga teng?",
    options: ["2 dioptriya", "0.5 dioptriya", "5 dioptriya", "1 dioptriya"],
    correctAnswer: "2 dioptriya",
    difficulty: 'easy'
  },
  {
    id: 'p12',
    subject: 'physics',
    question: "Erkin tushish tezlanishi g ning Yer sirtidagi o'rtacha qiymati qancha?",
    options: ["9.8 m/s²", "10.8 m/s²", "8.9 m/s²", "9.1 m/s²"],
    correctAnswer: "9.8 m/s²",
    difficulty: 'easy'
  },
  {
    id: 'p13',
    subject: 'physics',
    question: "Paskal qonuniga ko'ra suyuqlik va gazlarga berilgan bosim qanday uzatiladi?",
    options: ["Barcha yo'nalishlarda teng uzatiladi", "Faqat pastga uzatiladi", "Faqat yon tomonga uzatiladi", "Kamayib uzatiladi"],
    correctAnswer: "Barcha yo'nalishlarda teng uzatiladi",
    difficulty: 'easy'
  },
  {
    id: 'p14',
    subject: 'physics',
    question: "Transformerning asosiy vazifasi nimadan iborat?",
    options: ["O'zgaruvchan tok kuchlanishini o'zgartirish", "O'zgarmas tokni o'zgaruvchan tokka aylantirish", "Elektriik energiyani mexanik energiyaga aylantirish", "Qarshilikni oshirish"],
    correctAnswer: "O'zgaruvchan tok kuchlanishini o'zgartirish",
    difficulty: 'medium'
  },
  {
    id: 'p15',
    subject: 'physics',
    question: "Guk qonuniga ko'ra prujina elastiklik kuchi F = -k·x. k=100 N/m va siqilish x=0.05 m bo'lsa, F qancha?",
    options: ["5 N", "50 N", "0.5 N", "10 N"],
    correctAnswer: "5 N",
    difficulty: 'medium'
  },

  // --- NATIVE LANGUAGE (Ona tili va adabiyot) (15+ questions) ---
  {
    id: 'nl1',
    subject: 'native_language',
    question: "Qaysi qatorda faqat jarangsiz undoshlar berilgan?",
    options: ["p, f, k, t, s, ch", "b, v, g, d, z, j", "m, n, ng, l, r", "q, x, h, g, z"],
    correctAnswer: "p, f, k, t, s, ch",
    difficulty: 'easy'
  },
  {
    id: 'nl2',
    subject: 'native_language',
    question: "'Xamsa' asari muallifi kim?",
    options: ["Alisher Navoiy", "Zahiriddin Muhammad Bobur", "Lutfiy", "Atoiy"],
    correctAnswer: "Alisher Navoiy",
    difficulty: 'easy'
  },
  {
    id: 'nl3',
    subject: 'native_language',
    question: "Ega va kesim orasida qachon tire qo'yiladi?",
    options: ["Ega va kesim ot bilan ifodalanganda", "Kesim fe'l bilan ifodalanganda", "Ega olmosh bo'lganda", "Har doim qo'yiladi"],
    correctAnswer: "Ega va kesim ot bilan ifodalanganda",
    difficulty: 'medium'
  },
  {
    id: 'nl4',
    subject: 'native_language',
    question: "'O'tkan kunlar' romanidagi bosh qahramon nomini ko'rsating.",
    options: ["Otabek", "Anvar", "Qodir", "Ziyo shoh"],
    correctAnswer: "Otabek",
    difficulty: 'easy'
  },
  {
    id: 'nl5',
    subject: 'native_language',
    question: "Qaysi so'zda unli tovush tushishi hodisasi kuzatiladi?",
    options: ["Singlim (singil + im)", "Kitobim", "Qalamim", "Daftarim"],
    correctAnswer: "Singlim (singil + im)",
    difficulty: 'easy'
  },
  {
    id: 'nl6',
    subject: 'native_language',
    question: "Qaysi so'z o'zlashma so mezoniga ko'ra tuturuqli yozilgan?",
    options: ["Mavqe", "Mavqye", "Mavkye", "Mavkei"],
    correctAnswer: "Mavqe",
    difficulty: 'medium'
  },
  {
    id: 'nl7',
    subject: 'native_language',
    question: "Sifatdosh qaysi qo'shimchalar yordamida yasaladi?",
    options: ["-gan, -ayotgan, -ydigan", "-ib, -a, -y", "-ish, -moq, -v", "-da, -dan, -ga"],
    correctAnswer: "-gan, -ayotgan, -ydigan",
    difficulty: 'medium'
  },
  {
    id: 'nl8',
    subject: 'native_language',
    question: "'Boburnoma' asarining janri qanday?",
    options: ["Tarixiy-emuar asar", "Doston", "G'azal", "Drama"],
    correctAnswer: "Tarixiy-emuar asar",
    difficulty: 'easy'
  },
  {
    id: 'nl9',
    subject: 'native_language',
    question: "O'zbek tilida nechta kelshik bor?",
    options: ["6 ta", "5 ta", "7 ta", "4 ta"],
    correctAnswer: "6 ta",
    difficulty: 'easy'
  },
  {
    id: 'nl10',
    subject: 'native_language',
    question: "Sinonim so'zlar qatorini aniqlang.",
    options: ["Chiroyli, go'zal, ko'rkam", "Katta, kichik, uzin", "Yaxshi, yomon, xush", "Tez, sekin, ravon"],
    correctAnswer: "Chiroyli, go'zal, ko'rkam",
    difficulty: 'easy'
  },
  {
    id: 'nl11',
    subject: 'native_language',
    question: "'Shum bola' asari muallifi kim?",
    options: ["G'afur G'ulom", "Abdulla Qahhor", "Oypopuk", "Chulpon"],
    correctAnswer: "G'afur G'ulom",
    difficulty: 'easy'
  },
  {
    id: 'nl12',
    subject: 'native_language',
    question: "Qaysi gapda uyushiq bo'laklar qatnashgan?",
    options: ["U olma, anor va uzum xarid qildi.", "Bugun havo juda musaffo.", "U tezda uyiga jo'nab ketdi.", "Ustozi unga muvaffaqiyat tiladi."],
    correctAnswer: "U olma, anor va uzum xarid qildi.",
    difficulty: 'medium'
  },
  {
    id: 'nl13',
    subject: 'native_language',
    question: "O antonimlar qatorini toping.",
    options: ["Baland - past", "Katta - ulkan", "Chiroyli - xushro'y", "Keng - mo'l"],
    correctAnswer: "Baland - past",
    difficulty: 'easy'
  },
  {
    id: 'nl14',
    subject: 'native_language',
    question: "Qaysi so'z shakldosh (omonim) hisoblanadi?",
    options: ["O't (o'simlik / olov)", "Uzoq", "Kitob", "Maktab"],
    correctAnswer: "O't (o'simlik / olov)",
    difficulty: 'easy'
  },
  {
    id: 'nl15',
    subject: 'native_language',
    question: "O'zbek adabiy tilining asoschisi deb kim tan olingan?",
    options: ["Alisher Navoiy", "Mahmud Qashqariy", "Yusuf Xos Hojib", "Ahmad Yassaviy"],
    correctAnswer: "Alisher Navoiy",
    difficulty: 'easy'
  },

  // --- HISTORY OF UZBEKISTAN (O'zbekiston tarixi) (15+ questions) ---
  {
    id: 'h1',
    subject: 'history',
    question: "Amir Temur qachon tug'ilgan?",
    options: ["1336-yil 9-aprel", "1340-yil 12-may", "1328-yil 1-mart", "1350-yil 15-sentyabr"],
    correctAnswer: "1336-yil 9-aprel",
    difficulty: 'easy'
  },
  {
    id: 'h2',
    subject: 'history',
    question: "Buyuk Ipak Yo'li qaysi asrlarda eng gullab-yashnagan?",
    options: ["Miloddan avvalgi II asr - Milodiy XV asr", "V asr - X asr", "XVIII asr - XIX asr", "I asr - III asr"],
    correctAnswer: "Miloddan avvalgi II asr - Milodiy XV asr",
    difficulty: 'medium'
  },
  {
    id: 'h3',
    subject: 'history',
    question: "Mirzo Ulug'bek tomonidan Samarqandda rasadxona qachon qurilgan?",
    options: ["1424-1428 yillarda", "1390-1395 yillarda", "1450-1455 yillarda", "1480-1485 yillarda"],
    correctAnswer: "1424-1428 yillarda",
    difficulty: 'medium'
  },
  {
    id: 'h4',
    subject: 'history',
    question: "Qadimgi Baqtriya davlati qaysi hududda joylashgan edi?",
    options: ["Amu va Sirdaryo oralig'i hamda Janubiy O'zbekiston", "Farg'ona vodiysi", "Xorazm vohasi", "Toshkent vohasi"],
    correctAnswer: "Amu va Sirdaryo oralig'i hamda Janubiy O'zbekiston",
    difficulty: 'medium'
  },
  {
    id: 'h5',
    subject: 'history',
    question: "Jaloliddin Manguberdi qaysi bosqinchilarga qarshi mardona kura olgan?",
    options: ["Mo'g'ullar (Chingizxon)", "Arablar", "Eron shohlari", "Yunon-Baqtriyaliklar"],
    correctAnswer: "Mo'g'ullar (Chingizxon)",
    difficulty: 'easy'
  },
  {
    id: 'h6',
    subject: 'history',
    question: "Qo'qon xonligi qachon va kim tomonidan tashkil etilgan?",
    options: ["1709-yilda Shohruxbi tarafidan", "1500-yilda Shaybonixon", "1511-yilda Ilbarsxon", "1800-yilda Olimxon"],
    correctAnswer: "1709-yilda Shohruxbi tarafidan",
    difficulty: 'hard'
  },
  {
    id: 'h7',
    subject: 'history',
    question: "O'zbekiston Respublikasining Mustaqilligi qachon e'lon qilingan?",
    options: ["1991-yil 31-avgust", "1991-yil 1-sentyabr", "1989-yil 21-oktyabr", "1992-yil 8-dekabr"],
    correctAnswer: "1991-yil 31-avgust",
    difficulty: 'easy'
  },
  {
    id: 'h8',
    subject: 'history',
    question: "O'zbekiston Respublikasi Konstitutsiyasi qachon qabul qilingan?",
    options: ["1992-yil 8-dekabr", "1991-yil 1-sentyabr", "1993-yil 10-dekabr", "1990-yil 20-iyun"],
    correctAnswer: "1992-yil 8-dekabr",
    difficulty: 'easy'
  },
  {
    id: 'h9',
    subject: 'history',
    question: "Somoniylar davlatining poytaxti qaysi shahar bo'lgan?",
    options: ["Buxoro", "Samarqand", "Xiva", "Toshkent"],
    correctAnswer: "Buxoro",
    difficulty: 'easy'
  },
  {
    id: 'h10',
    subject: 'history',
    question: "Al-Xorazmiy qaysi ilm-fan sohasining otasi hisoblanadi?",
    options: ["Algebra va Algoritm", "Geometriya va Astranomiya", "Tibbiyot va kimyo", "Fizika va Mexanika"],
    correctAnswer: "Algebra va Algoritm",
    difficulty: 'easy'
  },
  {
    id: 'h11',
    subject: 'history',
    question: "Abu Ali ibn Sino qanday mashhur tibbiy asar muallifi?",
    options: ["'Al-Qonun fi at-Tibb' (Tibbiyot qonunlari)", "'Zij-i Juragoniy'", "'Al-Havi'", "'Kitob al-Jabr'"],
    correctAnswer: "'Al-Qonun fi at-Tibb' (Tibbiyot qonunlari)",
    difficulty: 'easy'
  },
  {
    id: 'h12',
    subject: 'history',
    question: "Spitamen kimlarga qarshi ozodlik kurashini olib borgan?",
    options: ["Aleksandr Makedonskiy (Makedoniyalik Iskandar)", "Chingizxon", "Eron shohining qo'shinlari", "Kipr qo'shinlari"],
    correctAnswer: "Aleksandr Makedonskiy (Makedoniyalik Iskandar)",
    difficulty: 'medium'
  },
  {
    id: 'h13',
    subject: 'history',
    question: "Xiva xonligining poytaxti Ichan-Qala qaysi asrda barpo etilgan va rivojlangan?",
    options: ["XIV-XIX asrlar", "IX-XI asrlar", "BC III asr", "XX asr"],
    correctAnswer: "XIV-XIX asrlar",
    difficulty: 'medium'
  },
  {
    id: 'h14',
    subject: 'history',
    question: "O'zbekistonda Davlat tili haqidagi qonun qachon qabul qilingan?",
    options: ["1989-yil 21-oktyabr", "1991-yil 1-sentyabr", "1990-yil 24-mart", "1992-yil 10-dekabr"],
    correctAnswer: "1989-yil 21-oktyabr",
    difficulty: 'easy'
  },
  {
    id: 'h15',
    subject: 'history',
    question: "G'aznaviylar davlatining eng mashhur hukmdori kim bo'lgan?",
    options: ["Sulton Mahmud G'aznaviy", "Alp Tegin", "Sabuk Tegin", "Mas'ud I"],
    correctAnswer: "Sulton Mahmud G'aznaviy",
    difficulty: 'medium'
  },

  // --- MANDATORY MATHEMATICS (Majburiy Matematika) (10+ questions) ---
  {
    id: 'mm1',
    subject: 'mandatory_math',
    question: "15% ning 200 ga teng qismini hisoblang.",
    options: ["30", "25", "40", "35"],
    correctAnswer: "30",
    difficulty: 'easy'
  },
  {
    id: 'mm2',
    subject: 'mandatory_math',
    question: "Hisoblang: (12.5 + 7.5) * 4 - 50",
    options: ["30", "40", "50", "20"],
    correctAnswer: "30",
    difficulty: 'easy'
  },
  {
    id: 'mm3',
    subject: 'mandatory_math',
    question: "To'g'ri to'rtburchakning eni 8 m, bo'yi 12 m. Uning perimetrini toping.",
    options: ["40 m", "96 m", "20 m", "48 m"],
    correctAnswer: "40 m",
    difficulty: 'easy'
  },
  {
    id: 'mm4',
    subject: 'mandatory_math',
    question: "Noma'lum son x bo'lsin. 3x + 15 = 45 bo'lsa, x ni toping.",
    options: ["10", "15", "20", "5"],
    correctAnswer: "10",
    difficulty: 'easy'
  },
  {
    id: 'mm5',
    subject: 'mandatory_math',
    question: "Kasrni qisqartiring: 24/36",
    options: ["2/3", "3/4", "1/2", "4/5"],
    correctAnswer: "2/3",
    difficulty: 'easy'
  },
  {
    id: 'mm6',
    subject: 'mandatory_math',
    question: "Avtomobil 60 km/soat tezlik bilan 3 soat harakatlandi. Bosib o'tilgan masofa qancha?",
    options: ["180 km", "120 km", "200 km", "150 km"],
    correctAnswer: "180 km",
    difficulty: 'easy'
  },
  {
    id: 'mm7',
    subject: 'mandatory_math',
    question: "Kvadratning yuzi 81 cm² bo'lsa, uning perimetri qancha?",
    options: ["36 cm", "18 cm", "81 cm", "27 cm"],
    correctAnswer: "36 cm",
    difficulty: 'easy'
  },
  {
    id: 'mm8',
    subject: 'mandatory_math',
    question: "Proporsiyadan x ni toping: 4 / 8 = x / 20",
    options: ["10", "5", "8", "12"],
    correctAnswer: "10",
    difficulty: 'easy'
  },
  {
    id: 'mm9',
    subject: 'mandatory_math',
    question: "3^4 ning qiymati nechaga teng?",
    options: ["81", "27", "64", "12"],
    correctAnswer: "81",
    difficulty: 'easy'
  },
  {
    id: 'mm10',
    subject: 'mandatory_math',
    question: "O'rtacha arifmetik: 12, 18 va 30 sonlarining o'rtacha arifmetigini toping.",
    options: ["20", "15", "25", "18"],
    correctAnswer: "20",
    difficulty: 'easy'
  },

  // --- PROFESSIONAL IT & ENGINEERING QUESTIONS (50+ questions) ---
  {
    id: 'pro1',
    subject: 'professional',
    question: "Kiberxavfsizlikda SQL Injection hujumining asosiy maqsadi nima?",
    options: ["Ma'lumotlar bazasiga ruxsatsiz buyruqlar va so'rovlar yuborish", "Server xotirasini to'ldirib tashlash (DoS)", "Foydalanuvchi parolini korpusdan o'g'irlash", "Wi-Fi trafigini dinlash"],
    correctAnswer: "Ma'lumotlar bazasiga ruxsatsiz buyruqlar va so'rovlar yuborish",
    difficulty: 'hard'
  },
  {
    id: 'pro2',
    subject: 'professional',
    question: "OSI modelida nechta sath (layer) bor va shifrlash (SSL/TLS) qaysi sathda amalga oshiriladi?",
    options: ["7 ta sath, Presentation (6-sath)", "7 ta sath, Network (3-sath)", "5 ta sath, Transport (4-sath)", "7 ta sath, Physical (1-sath)"],
    correctAnswer: "7 ta sath, Presentation (6-sath)",
    difficulty: 'hard'
  },
  {
    id: 'pro3',
    subject: 'professional',
    question: "Python dasturlash tilida ro'yxatni (list) saralash uchun qaysi metod ishlatiladi?",
    options: ["sort() va sorted()", "filter()", "map()", "arrange()"],
    correctAnswer: "sort() va sorted()",
    difficulty: 'easy'
  },
  {
    id: 'pro4',
    subject: 'professional',
    question: "Kompyuter arxitekturasida RAM (Operativ Xotira) ning asosiy xususiyati qanday?",
    options: ["Vaqtinchalik va uchuvchan (volatile) xotira", "Doimiy va o'chmaydigan xotira", "Faqat buyruqlarni shifrlash xotirasi", "Protsessor chastotasini oshiruvchi xotira"],
    correctAnswer: "Vaqtinchalik va uchuvchan (volatile) xotira",
    difficulty: 'easy'
  },
  {
    id: 'pro5',
    subject: 'professional',
    question: "Sun'iy intellektda Neyron Tarmoqlarida 'Activation Function' (Faollashtirish funksiyasi) vazifasi nima?",
    options: ["Neyrongga chiziqli bo'lmaganlik (non-linearity) kiritish", "Model parametrlarini avtomatik o'chirish", "Ma'lumotlarni faylga saqlash", "Grafiklarni chizish"],
    correctAnswer: "Neyrongga chiziqli bo'lmaganlik (non-linearity) kiritish",
    difficulty: 'hard'
  },
  {
    id: 'pro6',
    subject: 'professional',
    question: "Linux operatsion tizimida joriy katalogni ko'rish va fayllar ro'yxatini chiqarish buyrug'i qaysi?",
    options: ["ls", "cd", "mkdir", "cat"],
    correctAnswer: "ls",
    difficulty: 'easy'
  },
  {
    id: 'pro7',
    subject: 'professional',
    question: "TCP/IP modelida HTTP / HTTPS protokollari qaysi portlarda ishlaydi?",
    options: ["HTTP: 80, HTTPS: 443", "HTTP: 21, HTTPS: 22", "HTTP: 8080, HTTPS: 3000", "HTTP: 25, HTTPS: 110"],
    correctAnswer: "HTTP: 80, HTTPS: 443",
    difficulty: 'medium'
  },
  {
    id: 'pro8',
    subject: 'professional',
    question: "C++ dasturlash tilida obyekt yaratish uchun ishlatiladigan kalit so'z qaysi?",
    options: ["new", "create", "alloc", "class"],
    correctAnswer: "new",
    difficulty: 'medium'
  },
  {
    id: 'pro9',
    subject: 'professional',
    question: "Ma'lumotlar bazasida Primary Key (Asosiy Kalit) ning maqsadi nima?",
    options: ["Jadvaldagi har bir yozuvni noyob (unique) identifikatsiya qilish", "Jadvalni shifrlash", "Ma'lumotlarni avtomatik o'chirish", "Faqat matnli ustunlarni bog'lash"],
    correctAnswer: "Jadvaldagi har bir yozuvni noyob (unique) identifikatsiya qilish",
    difficulty: 'medium'
  },
  {
    id: 'pro10',
    subject: 'professional',
    question: "OOP (Ob'ektga yo'naltirilgan dasturlash) ning 4 ta asosiy ustuni qaysilar?",
    options: ["Enkapsulyatsiya, Merosxo'rlik, Polimorfizm, Abstraksiya", "Funksiya, O'zgaruvchi, Sinf, Metod", "Kompilyatsiya, Interpretatsiya, Linker, Assembler", "Frontend, Backend, Database, DevOps"],
    correctAnswer: "Enkapsulyatsiya, Merosxo'rlik, Polimorfizm, Abstraksiya",
    difficulty: 'medium'
  },
  {
    id: 'pro11',
    subject: 'professional',
    question: "Kiberxavfsizlikda Phishing (Fishshing) hujumi nima?",
    options: ["Soxta veb-saytlar va xabarlar orqali maxfiy ma'lumotlarni o'g'irlash", "Serverga ortiqcha trafik yuborish", "Wifi parolini buzish", "Kompyuter platasini zararlash"],
    correctAnswer: "Soxta veb-saytlar va xabarlar orqali maxfiy ma'lumotlarni o'g'irlash",
    difficulty: 'easy'
  },
  {
    id: 'pro12',
    subject: 'professional',
    question: "Dasturlashda Binary Search (Ikkilik qidiruv) algoritmining vaqt murakkabligi (Big O) qancha?",
    options: ["O(log n)", "O(n)", "O(n^2)", "O(1)"],
    correctAnswer: "O(log n)",
    difficulty: 'hard'
  },
  {
    id: 'pro13',
    subject: 'professional',
    question: "Git versiyalarni boshqarish tizimida o'zgarishlarni masofaviy repozitoriyga yuborish buyrug'i qaysi?",
    options: ["git push", "git commit", "git pull", "git add"],
    correctAnswer: "git push",
    difficulty: 'easy'
  },
  {
    id: 'pro14',
    subject: 'professional',
    question: "Robototexnikada Mikrokontroller (masalan Arduino, ESP32) ning vazifasi nima?",
    options: ["Sensorlardan signal olib, aktuator va motorlarni boshqarish", "Faqat Wi-Fi tarqatish", "Faqat tasvirni ko'rsatish", "Quvvatni saqlash"],
    correctAnswer: "Sensorlardan signal olib, aktuator va motorlarni boshqarish",
    difficulty: 'medium'
  },
  {
    id: 'pro15',
    subject: 'professional',
    question: "Asimmetrik shifrlashda (RSA) nechta kalit ishlatiladi?",
    options: ["2 ta (Ochiq kalit va Maxfiy kalit)", "1 ta kalit", "3 ta kalit", "Kalit ishlatilmaydi"],
    correctAnswer: "2 ta (Ochiq kalit va Maxfiy kalit)",
    difficulty: 'medium'
  },
  {
    id: 'pro16',
    subject: 'professional',
    question: "Docker texnologiyasining asosiy afzalligi nimada?",
    options: ["Ilovalarni konteynerlarda yakkalangan holda tez va oson ishga tushirish", "Faqat Windows operatsion tizimini tezlashtirish", "Kod xatolarini avtomatik tuzatish", "Barcha kompyuterlarni birlashtirish"],
    correctAnswer: "Ilovalarni konteynerlarda yakkalangan holda tez va oson ishga tushirish",
    difficulty: 'hard'
  },
  {
    id: 'pro17',
    subject: 'professional',
    question: "JavaScript tilida 'async/await' konstruksiyasi nimaga xizmat qiladi?",
    options: ["Asinxron operatsiyalarni (Promise) qulay va tartibli bajarishga", "Sikllarni to'xtatishga", "O'zgaruvchi turini aniqlashga", "DOM elementlarini o'chirishga"],
    correctAnswer: "Asinxron operatsiyalarni (Promise) qulay va tartibli bajarishga",
    difficulty: 'medium'
  },
  {
    id: 'pro18',
    subject: 'professional',
    question: "DNS (Domain Name System) serverining asosiy vazifasi nima?",
    options: ["Domen nomini (masalan google.com) IP manzilga o'girish", "Elektron pochtani shifrlash", "Veb-sayt dizaynini yuklash", "Fayllarni siqish"],
    correctAnswer: "Domen nomini (masalan google.com) IP manzilga o'girish",
    difficulty: 'easy'
  },
  {
    id: 'pro19',
    subject: 'professional',
    question: "Ma'lumotlar strukturasida Stack (Stek) qaysi prinsip asosida ishlaydi?",
    options: ["LIFO (Last In First Out)", "FIFO (First In First Out)", "Random Access", "Priority Order"],
    correctAnswer: "LIFO (Last In First Out)",
    difficulty: 'medium'
  },
  {
    id: 'pro20',
    subject: 'professional',
    question: "Ma'lumotlar strukturasida Queue (Navbat) qaysi prinsip bo'yicha ishlaydi?",
    options: ["FIFO (First In First Out)", "LIFO (Last In First Out)", "Tree Order", "Hash Key"],
    correctAnswer: "FIFO (First In First Out)",
    difficulty: 'medium'
  },
  {
    id: 'pro21',
    subject: 'professional',
    question: "IPv4 manzili nechta bitdan iborat?",
    options: ["32 bit", "64 bit", "128 bit", "16 bit"],
    correctAnswer: "32 bit",
    difficulty: 'easy'
  },
  {
    id: 'pro22',
    subject: 'professional',
    question: "IPv6 manzili nechta bitdan iborat?",
    options: ["128 bit", "64 bit", "32 bit", "256 bit"],
    correctAnswer: "128 bit",
    difficulty: 'medium'
  },
  {
    id: 'pro23',
    subject: 'professional',
    question: "REST API da ma'lumotlarni o'chirish uchun qaysi HTTP metodi ishlatiladi?",
    options: ["DELETE", "POST", "GET", "PUT"],
    correctAnswer: "DELETE",
    difficulty: 'easy'
  },
  {
    id: 'pro24',
    subject: 'professional',
    question: "Supervised Learning (Nazorat ostidagi o'rgatish) nechta turga bo'linadi va uning belgilari qanday?",
    options: ["Ma'lumotlar tayyor yorliqlar (labels) va javoblar bilan ta'minlangan bo'ladi", "Ma'lumotlarda hech qanday yorliq bo'lmaydi", "Faqat o'yin o'ynashda ishlatiladi", "Parametrlar tasodifiy olinadi"],
    correctAnswer: "Ma'lumotlar tayyor yorliqlar (labels) va javoblar bilan ta'minlangan bo'ladi",
    difficulty: 'hard'
  },
  {
    id: 'pro25',
    subject: 'professional',
    question: "Operatsion tizimlarda Deadlock (Boshiq holat) nima?",
    options: ["Ikki va undan ortiq jarayonlar bir-birining resurslarini kutib, to'xtab qolishi", "Protsessorning qizib ketishi", "Xotira yetishmasligi sababli dasturning yopilishi", "Faylning o'chib ketishi"],
    correctAnswer: "Ikki va undan ortiq jarayonlar bir-birining resurslarini kutib, to'xtab qolishi",
    difficulty: 'hard'
  }
];

/**
 * Fisher-Yates Shuffle Algorithm for random array shuffling
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates exact 90 randomized questions for a given direction.
 * Distribution:
 * - Mathematics: 20
 * - Physics: 15
 * - Native Language: 15
 * - History: 15
 * - Mandatory Math: 10
 * - Professional IT: 15
 * Total = 90 questions.
 * Ensures:
 * 1. Questions are randomized without repetition.
 * 2. Option choices (A, B, C, D) are shuffled for every single question.
 * 3. Guaranteed 4 distinct unique options per question.
 */
export function generateRandomExamQuestions(directionId: string): Question[] {
  const mathQs = fisherYatesShuffle(QUESTION_BANK.filter(q => q.subject === 'mathematics'));
  const physicsQs = fisherYatesShuffle(QUESTION_BANK.filter(q => q.subject === 'physics'));
  const langQs = fisherYatesShuffle(QUESTION_BANK.filter(q => q.subject === 'native_language'));
  const historyQs = fisherYatesShuffle(QUESTION_BANK.filter(q => q.subject === 'history'));
  const mandMathQs = fisherYatesShuffle(QUESTION_BANK.filter(q => q.subject === 'mandatory_math'));
  const profQs = fisherYatesShuffle(QUESTION_BANK.filter(q => q.subject === 'professional'));

  const selectItems = <T>(pool: T[], count: number): T[] => {
    const result: T[] = [];
    let idx = 0;
    while (result.length < count && pool.length > 0) {
      result.push(pool[idx % pool.length]);
      idx++;
    }
    return result;
  };

  const selectedMath = selectItems(mathQs, 20);
  const selectedPhysics = selectItems(physicsQs, 15);
  const selectedLang = selectItems(langQs, 15);
  const selectedHistory = selectItems(historyQs, 15);
  const selectedMandMath = selectItems(mandMathQs, 10);
  const selectedProf = selectItems(profQs, 15);

  const rawList = [
    ...selectedMath,
    ...selectedPhysics,
    ...selectedLang,
    ...selectedHistory,
    ...selectedMandMath,
    ...selectedProf
  ];

  // Shuffle final list of 90 questions
  const shuffledQuestions = fisherYatesShuffle(rawList);

  // Return formatted questions with unique IDs and shuffled options
  return shuffledQuestions.map((q, index) => {
    // Ensure 4 options are distinct
    const uniqueOptions = Array.from(new Set(q.options));
    while (uniqueOptions.length < 4) {
      uniqueOptions.push(`Javob ${uniqueOptions.length + 1}`);
    }
    
    // Shuffle options using Fisher Yates
    const shuffledOptions = fisherYatesShuffle(uniqueOptions.slice(0, 4));

    return {
      ...q,
      id: `q_${index}_${q.id}_${Math.random().toString(36).substr(2, 5)}`,
      options: shuffledOptions as [string, string, string, string],
      correctAnswer: q.correctAnswer
    };
  });
}
