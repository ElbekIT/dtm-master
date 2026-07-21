import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory active test sessions (securely stored on server-side)
const activeSessions: Record<string, {
  id: string;
  uid: string;
  directionId: string;
  directionName: string;
  startTime: number;
  questions: any[]; // Full questions including correctAnswers
  answers: Record<string, string>; // questionId -> option
  completed: boolean;
}> = {};

// In-memory banned user list
const bannedUsers: Set<string> = new Set();

// Load initial questions from database file
let questionBank: any[] = [];
try {
  const dbPath = path.join(process.cwd(), "server", "questions_db.json");
  if (fs.existsSync(dbPath)) {
    const rawData = fs.readFileSync(dbPath, "utf-8");
    questionBank = JSON.parse(rawData).questions || [];
  }
} catch (error) {
  console.error("Error loading question bank:", error);
}

// Fisher-Yates Shuffle Algorithm to randomize arrays
function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Procedural Question Generator for Uzbek DTM Exam
// This ensures that we can scale up to 90 highly realistic questions instantly!
function generateDynamicQuestion(subject: string, directionName: string, index: number): any {
  const seed = Math.random();
  const id = `dynamic_${subject.toLowerCase().replace(/\s+/g, '_')}_${index}_${Math.floor(seed * 10000)}`;

  // 1. Mathematics Questions
  if (subject === "Mathematics") {
    const types = [
      "quadratic", "logarithm", "trig", "arithmetic_prog", "geom_prog", "derivative"
    ];
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
      let value = "1/2";
      if (angle === 45) value = "√2/2";
      if (angle === 60) value = "√3/2";
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
    const speed = Math.floor(seed * 20) + 10; // 10 to 30
    const time = Math.floor(seed * 5) + 2; // 2 to 6
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
  // Depending on directionName, let's tailor the computer science/engineering questions
  const engineeringTopics = {
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

  const topics = engineeringTopics[directionName as keyof typeof engineeringTopics] || [
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

// 1. Dynamic Test Creation Endpoint
app.post("/api/test/start", (req, res) => {
  const { uid, directionId, directionName } = req.body;

  if (!uid || !directionId || !directionName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (bannedUsers.has(uid)) {
    return res.status(403).json({ error: "Sizning hisobingiz admin tomonidan bloklangan!" });
  }

  const testSessionId = `test_session_${uid}_${Date.now()}`;

  // Subject distribution
  const distribution = [
    { name: "Mathematics", count: 20 },
    { name: "Physics", count: 15 },
    { name: "Native Language", count: 15 },
    { name: "History of Uzbekistan", count: 15 },
    { name: "Mandatory Mathematics", count: 10 },
    { name: "Professional Subject", count: 15 }
  ];

  const finalQuestions: any[] = [];

  distribution.forEach((dist) => {
    // 1. Find matching questions in static bank
    let matching = questionBank.filter(q => 
      q.subject === dist.name && 
      (!q.direction || q.direction === directionName)
    );

    // 2. Shuffle matched questions
    matching = shuffleArray(matching);

    // 3. Take up to count
    let selected = matching.slice(0, dist.count);

    // 4. If not enough questions in static bank, dynamically generate high quality procedurally randomized variants
    let needed = dist.count - selected.length;
    for (let i = 0; i < needed; i++) {
      selected.push(generateDynamicQuestion(dist.name, directionName, i));
    }

    finalQuestions.push(...selected);
  });

  // Fully randomize the 90 questions overall order using Fisher-Yates
  const fullyRandomizedQuestions = shuffleArray(finalQuestions);

  // Randomize option order for each question securely on server-side
  const preppedQuestionsForClient = fullyRandomizedQuestions.map((q) => {
    // Save correct answer value before shuffling keys
    const correctVal = q.options[q.correctAnswer];
    const optionPairs = Object.entries(q.options);
    const shuffledPairs = shuffleArray(optionPairs);

    const newOptions: Record<string, string> = {};
    let newCorrectAnswerKey = "A";

    shuffledPairs.forEach(([oldKey, value], idx) => {
      const newKey = ["A", "B", "C", "D"][idx];
      newOptions[newKey] = value as string;
      if (value === correctVal) {
        newCorrectAnswerKey = newKey;
      }
    });

    // Update session store copy with correct scrambled key
    q.options = newOptions;
    q.correctAnswer = newCorrectAnswerKey;

    // Return sanitized copy for client side (DO NOT leak the correctAnswer!)
    const { correctAnswer, ...clientQuestion } = q;
    return clientQuestion;
  });

  // Store active session on server with secure answers
  activeSessions[testSessionId] = {
    id: testSessionId,
    uid,
    directionId,
    directionName,
    startTime: Date.now(),
    questions: fullyRandomizedQuestions, // keeps correct answers inside
    answers: {},
    completed: false
  };

  res.json({
    testSessionId,
    directionName,
    durationSeconds: 10800, // 3 hours
    questions: preppedQuestionsForClient
  });
});

// 2. Auto-save answers Endpoint
app.post("/api/test/save-answer", (req, res) => {
  const { testSessionId, questionId, chosenOption, uid } = req.body;

  if (!testSessionId || !questionId || !uid) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const session = activeSessions[testSessionId];
  if (!session) {
    return res.status(404).json({ error: "Test sessiyasi topilmadi." });
  }

  if (session.uid !== uid) {
    return res.status(403).json({ error: "Ruxsat etilmagan amal." });
  }

  if (session.completed) {
    return res.status(400).json({ error: "Test yakunlangan. Javoblarni saqlab bo'lmaydi." });
  }

  // Update in-memory answer
  if (chosenOption === null || chosenOption === undefined) {
    delete session.answers[questionId];
  } else {
    session.answers[questionId] = chosenOption;
  }

  res.json({ success: true, savedAnswersCount: Object.keys(session.answers).length });
});

// 3. Complete Test & Secure Score Calculation Endpoint
app.post("/api/test/finish", (req, res) => {
  const { testSessionId, uid, timeUsedSeconds } = req.body;

  if (!testSessionId || !uid) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const session = activeSessions[testSessionId];
  if (!session) {
    return res.status(404).json({ error: "Test sessiyasi topilmadi." });
  }

  if (session.uid !== uid) {
    return res.status(403).json({ error: "Ruxsat etilmagan amal." });
  }

  if (session.completed) {
    return res.status(400).json({ error: "Ushbu test allaqachon yakunlangan." });
  }

  // Calculate scores securely
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

  session.questions.forEach((q) => {
    const userAnswer = session.answers[q.id];
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

  // Cap score to standard max of 189.0 (Uzbekistan DTM standard)
  totalScore = Math.min(189.0, Math.round(totalScore * 10) / 10);

  // Format time used
  const totalSeconds = timeUsedSeconds || Math.floor((Date.now() - session.startTime) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const timeUsedFormatted = `${minutes}:${secs.toString().padStart(2, '0')}`;

  session.completed = true;

  res.json({
    score: totalScore,
    correctCount,
    wrongCount,
    emptyCount,
    percentage: Math.round((correctCount / session.questions.length) * 100),
    timeUsed: timeUsedFormatted,
    directionName: session.directionName,
    passed: totalScore >= 94
  });
});

// Admin Panel management APIs
app.get("/api/admin/stats", (req, res) => {
  const sessionsList = Object.values(activeSessions);
  res.json({
    totalTestsStarted: sessionsList.length,
    activeSessionsCount: sessionsList.filter(s => !s.completed).length,
    completedSessionsCount: sessionsList.filter(s => s.completed).length,
    bannedUsersCount: bannedUsers.size,
    questionsDatabaseCount: questionBank.length
  });
});

app.post("/api/admin/ban", (req, res) => {
  const { uid, action } = req.body; // action: 'ban' | 'unban'
  if (!uid) return res.status(400).json({ error: "Missing uid" });

  if (action === "ban") {
    bannedUsers.add(uid);
  } else {
    bannedUsers.delete(uid);
  }
  res.json({ success: true, banned: bannedUsers.has(uid) });
});

app.get("/api/admin/banned-users", (req, res) => {
  res.json({ banned: Array.from(bannedUsers) });
});

// Add new questions
app.post("/api/admin/questions/add", (req, res) => {
  const { question, A, B, C, D, correctAnswer, subject, direction, difficulty } = req.body;
  
  if (!question || !A || !B || !C || !D || !correctAnswer || !subject) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  const newQuestion = {
    id: `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    question,
    options: { A, B, C, D },
    correctAnswer,
    subject,
    direction: direction || null,
    difficulty: difficulty || "medium"
  };

  questionBank.push(newQuestion);

  // Save to file database persistently
  try {
    const dbPath = path.join(process.cwd(), "server", "questions_db.json");
    fs.writeFileSync(dbPath, JSON.stringify({ questions: questionBank }, null, 2));
  } catch (err) {
    console.error("Failed to write questions database file:", err);
  }

  res.json({ success: true, question: newQuestion });
});

// Import bulk JSON questions
app.post("/api/admin/questions/import-json", (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ error: "Data must be an array of questions." });
  }

  const formatted = questions.map((q, idx) => ({
    id: q.id || `imported_${Date.now()}_${idx}`,
    question: q.question,
    options: q.options || { A: q.A, B: q.B, C: q.C, D: q.D },
    correctAnswer: q.correctAnswer,
    subject: q.subject || "Mathematics",
    direction: q.direction || null,
    difficulty: q.difficulty || "medium"
  }));

  questionBank.push(...formatted);

  try {
    const dbPath = path.join(process.cwd(), "server", "questions_db.json");
    fs.writeFileSync(dbPath, JSON.stringify({ questions: questionBank }, null, 2));
  } catch (err) {
    console.error("Failed to write questions database file:", err);
  }

  res.json({ success: true, count: formatted.length });
});

// Vite & Static file handler setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DTM MASTER Server] Running securely on port ${PORT}`);
  });
}

startServer();
