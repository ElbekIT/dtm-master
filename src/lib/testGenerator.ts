import { Question } from "../types";

// Fisher-Yates Shuffle Algorithm to randomize arrays
export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Procedural Question Generator for client side fallback
export function generateDynamicQuestion(subject: string, directionName: string, index: number): Question {
  const seed = Math.random();
  const id = `client_dyn_${subject.toLowerCase().replace(/\s+/g, '_')}_${index}_${Math.floor(seed * 10000)}`;

  // 1. Mathematics Questions
  if (subject === "Mathematics") {
    const types = ["quadratic", "logarithm", "trig", "derivative"];
    const type = types[Math.floor(seed * types.length)];

    if (type === "quadratic") {
      const x1 = Math.floor(seed * 5) + 1;
      const x2 = Math.floor(seed * 5) + 6;
      const p = -(x1 + x2);
      const q = x1 * x2;
      return {
        id,
        question: `x² ${p >= 0 ? "+ " + p : p}x ${q >= 0 ? "+ " + q : q} = 0 tenglamaning ildizlari yig'indisini toping.`,
        options: {
          A: `${x1 + x2}`,
          B: `${-(x1 + x2)}`,
          C: `${x1 * x2}`,
          D: `${x1 - x2}`
        },
        correctAnswer: "A",
        subject,
        difficulty: "medium"
      };
    } else if (type === "logarithm") {
      const base = [2, 3, 5][Math.floor(seed * 3)];
      const power = Math.floor(seed * 3) + 2; // 2, 3, 4
      const ans = Math.pow(base, power);
      return {
        id,
        question: `Hisoblang: log_${base}(${ans}) + log_${base}(${base})`,
        options: {
          A: `${power + 1}`,
          B: `${power}`,
          C: `${power - 1}`,
          D: `${power * base}`
        },
        correctAnswer: "A",
        subject,
        difficulty: "medium"
      };
    } else if (type === "trig") {
      const angles = [30, 45, 60];
      const angle = angles[Math.floor(seed * angles.length)];
      return {
        id,
        question: `Hisoblang: sin(${angle}°) * cos(${90 - angle}°) + cos(${angle}°) * sin(${90 - angle}°)`,
        options: {
          A: "1",
          B: "0",
          C: "1/2",
          D: "√3/2"
        },
        correctAnswer: "A",
        subject,
        difficulty: "easy"
      };
    } else {
      const a = Math.floor(seed * 10) + 1;
      const b = Math.floor(seed * 10) + 2;
      return {
        id,
        question: `f(x) = ${a}x² + ${b}x funksiyaning hosilasini toping.`,
        options: {
          A: `${2*a}x + ${b}`,
          B: `${a}x + ${b}`,
          C: `${2*a}x`,
          D: `${a}x² + ${b}`
        },
        correctAnswer: "A",
        subject,
        difficulty: "medium"
      };
    }
  }

  // 2. Physics Questions
  if (subject === "Physics") {
    const speed = Math.floor(seed * 20) + 10;
    const time = Math.floor(seed * 5) + 2;
    const dist = speed * time;
    return {
      id,
      question: `Tezligi v = ${speed} m/s bo'lgan avtomobil t = ${time} s davomida tekis harakat qilib necha metr yo'l bosadi?`,
      options: {
        A: `${dist} m`,
        B: `${Math.round(speed / time)} m`,
        C: `${dist * 2} m`,
        D: `${dist - 10} m`
      },
      correctAnswer: "A",
      subject,
      difficulty: "easy"
    };
  }

  // 3. Native Language Questions
  if (subject === "Native Language") {
    const wordList = [
      { wrong: "harkat", right: "harakat" },
      { wrong: "mashulot", right: "mashg'ulot" },
      { wrong: "tafakkur", right: "tafakkur" },
      { wrong: "sinif", right: "sinf" },
      { wrong: "temur", right: "Temur" }
    ];
    const pair = wordList[Math.floor(seed * wordList.length)];
    return {
      id,
      question: `Qaysi so'z imlo jihatdan to'g'ri yozilgan?`,
      options: {
        A: `${pair.right}`,
        B: `${pair.wrong}`,
        C: `${pair.right}iy`,
        D: `${pair.wrong}li`
      },
      correctAnswer: "A",
      subject,
      difficulty: "easy"
    };
  }

  // 4. History of Uzbekistan Questions
  if (subject === "History of Uzbekistan") {
    const historicalFacts = [
      { q: "Buyuk ipak yo'li nechanchi asrlarda gullab-yashnagan?", a: "Miloddan avvalgi II asr - Milodiy XV asr", b: "X-XII asrlar", c: "XV-XVIII asrlar", d: "V-VIII asrlar" },
      { q: "Samarqand shahrining 2750 yilligi qachon nishonlangan?", a: "2007-yil", b: "1997-yil", c: "2010-yil", d: "2012-yil" },
      { q: "Mirzo Ulug'bek tomonidan bunyod etilgan rasadxona qaysi shaharda joylashgan?", a: "Samarqand", b: "Buxoro", c: "Xiva", d: "Toshkent" },
      { q: "Jaloliddin Manguberdi mo'g'ullarga qarshi qaysi daryo bo'yida jang qilgan?", a: "Sind daryosi", b: "Amudaryo", c: "Sirdaryo", d: "Zarafshon" }
    ];
    const fact = historicalFacts[Math.floor(seed * historicalFacts.length)];
    return {
      id,
      question: fact.q,
      options: {
        A: fact.a,
        B: fact.b,
        C: fact.c,
        D: fact.d
      },
      correctAnswer: "A",
      subject,
      difficulty: "medium"
    };
  }

  // 5. Mandatory Mathematics Questions
  if (subject === "Mandatory Mathematics") {
    const val = [100, 200, 300, 500][Math.floor(seed * 4)];
    const pct = [10, 20, 25, 50][Math.floor(seed * 4)];
    const result = (val * pct) / 100;
    return {
      id,
      question: `${val} sonining ${pct}% ini hisoblang.`,
      options: {
        A: `${result}`,
        B: `${result + 5}`,
        C: `${result - 5}`,
        D: `${result * 2}`
      },
      correctAnswer: "A",
      subject,
      difficulty: "easy"
    };
  }

  // 6. Professional Subject Questions
  const engineeringTopics: Record<string, Array<{q: string, a: string, b: string, c: string, d: string}>> = {
    "Kiber Xavfsizlik": [
      { q: "Tarmoq trafigini kuzatish va ruxsatsiz kirishlarni aniqlash tizimi qanday nomlanadi?", a: "IDS (Intrusion Detection System)", b: "WAF (Web Application Firewall)", c: "VPN (Virtual Private Network)", d: "Proxy" },
      { q: "Shifrlangan ma'lumotlarni kalitsiz ochishga urinish jarayoni nima deyiladi?", a: "Kriptotahlil (Cryptanalysis)", b: "Dekodlash", c: "Hashing", d: "Symmetric Encryption" },
      { q: "Qaysi xavfsizlik protokoli internet saytlari uchun shifrlashni ta'minlaydi?", a: "HTTPS / TLS", b: "FTP", c: "HTTP", d: "Telnet" }
    ],
    "Kompyuter Injenering": [
      { q: "Katta hajmdagi ma'lumotlarni saqlaydigan va protsessordan sekinroq ishlaydigan xotira?", a: "Qattiq disk (HDD/SSD)", b: "Registr", c: "Kesh xotira L1", d: "RAM" },
      { q: "Ikkilik sanoq tizimidagi 1010 soni o'nlik sanoq tizimida nimaga teng?", a: "10", b: "12", c: "8", d: "14" },
      { q: "Yarim o'tkazgichli diodning asosiy vazifasi nima?", a: "Tokni faqat bir tomonga o'tkazish", b: "Kuchlanishni oshirish", c: "Signalni kuchaytirish", d: "Energiya saqlash" }
    ],
    "Dasturiy Injenering": [
      { q: "Qidiruv algoritmlari ichida eng tezkor hisoblanadigan tartiblangan massivlar uchun algoritm qaysi?", a: "Binar qidiruv (Binary Search)", b: "Chiziqli qidiruv (Linear Search)", c: "Ko'piksimon (Bubble Search)", d: "Deykstra algoritmi" },
      { q: "Kodni versiyalarini boshqarish va guruhda ishlash uchun eng mashhur tizim qaysi?", a: "Git", b: "Docker", c: "Jenkins", d: "Kubernetes" },
      { q: "REST API arxitekturasida ma'lumotlarni yaratish uchun qaysi HTTP metodi ishlatiladi?", a: "POST", b: "GET", c: "PUT", d: "DELETE" }
    ],
    "Sun'iy Intellekt": [
      { q: "Neyron tarmoqlarida har bir neyronning kirish qiymatlarini qayta ishlaydigan funksiya qanday nomlanadi?", a: "Aktivizatsiya funksiyasi (Activation Function)", b: "Yo'qotish funksiyasi (Loss Function)", c: "Gradient tushishi (Gradient Descent)", d: "Chiziqli regressiya" },
      { q: "AI va Data Science yo'nalishida eng keng qo'llaniladigan dasturlash tili qaysi?", a: "Python", b: "C++", c: "PHP", d: "Java" },
      { q: "Qaysi texnologiya inson tili va nutqini tahlil qilish uchun mo'ljallangan?", a: "NLP (Natural Language Processing)", b: "Computer Vision", c: "Reinforcement Learning", d: "Blockchain" }
    ]
  };

  const topics = engineeringTopics[directionName] || [
    { q: "Axborot texnologiyalarida eng asosiy ma'lumotlar uzatish tarmog'i nima?", a: "Internet (TCP/IP)", b: "Bluetooth", c: "Intranet", d: "NFC" },
    { q: "Ma'lumotlar bazasini boshqarish tili (SQL) dagi qaysi buyruq yangi ma'lumot qo'shadi?", a: "INSERT", b: "SELECT", c: "UPDATE", d: "DELETE" },
    { q: "Bulutli hisoblashlar (Cloud Computing) ning eng mashhur provayderi kim?", a: "AWS, Google Cloud va Azure", b: "Oracle Database", c: "GitLab", d: "MySQL" }
  ];

  const fact = topics[index % topics.length];
  return {
    id,
    question: fact.q,
    options: {
      A: fact.a,
      B: fact.b,
      C: fact.c,
      D: fact.d
    },
    correctAnswer: "A",
    subject,
    difficulty: "hard"
  };
}

// Generate complete offline / client fallback test session
export function generateClientTestSession(directionId: string, directionName: string) {
  const distribution = [
    { name: "Mathematics", count: 20 },
    { name: "Physics", count: 15 },
    { name: "Native Language", count: 15 },
    { name: "History of Uzbekistan", count: 15 },
    { name: "Mandatory Mathematics", count: 10 },
    { name: "Professional Subject", count: 15 }
  ];

  const finalQuestions: Question[] = [];

  distribution.forEach((dist) => {
    for (let i = 0; i < dist.count; i++) {
      finalQuestions.push(generateDynamicQuestion(dist.name, directionName, i));
    }
  });

  const fullyRandomizedQuestions = shuffleArray(finalQuestions);

  // Scramble option keys so answer is not always "A"
  const preppedQuestionsForClient = fullyRandomizedQuestions.map((q) => {
    const correctVal = q.options[q.correctAnswer];
    const optionPairs = Object.entries(q.options);
    const shuffledPairs = shuffleArray(optionPairs);

    const newOptions: Record<string, string> = {};
    let newCorrectAnswerKey = "A";

    shuffledPairs.forEach(([oldKey, value], idx) => {
      const newKey = ["A", "B", "C", "D"][idx];
      newOptions[newKey] = value;
      if (value === correctVal) {
        newCorrectAnswerKey = newKey;
      }
    });

    return {
      ...q,
      options: newOptions,
      correctAnswer: newCorrectAnswerKey
    };
  });

  return {
    testSessionId: `client_session_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    directionName,
    durationSeconds: 10800,
    questions: preppedQuestionsForClient
  };
}

// Client-side local secure score calculator
export function calculateClientScore(questions: Question[], answers: Record<string, string>, timeUsedSeconds: number, directionName: string) {
  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let emptyCount = 0;

  const pointsMap: Record<string, number> = {
    "Mathematics": 3.1,
    "Physics": 2.1,
    "Native Language": 1.1,
    "History of Uzbekistan": 1.1,
    "Mandatory Mathematics": 1.1,
    "Professional Subject": 3.1
  };

  questions.forEach((q) => {
    const userAnswer = answers[q.id];
    const points = pointsMap[q.subject] || 1.1;

    if (!userAnswer) {
      emptyCount++;
    } else if (userAnswer === q.correctAnswer) {
      correctCount++;
      totalScore += points;
    } else {
      wrongCount++;
    }
  });

  totalScore = Math.min(189.0, Math.round(totalScore * 10) / 10);

  const minutes = Math.floor(timeUsedSeconds / 60);
  const secs = timeUsedSeconds % 60;
  const timeUsedFormatted = `${minutes}:${secs.toString().padStart(2, '0')}`;

  return {
    score: totalScore,
    correctCount,
    wrongCount,
    emptyCount,
    percentage: Math.round((correctCount / questions.length) * 100),
    timeUsed: timeUsedFormatted,
    directionName,
    passed: totalScore >= 94
  };
}
