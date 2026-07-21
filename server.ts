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
  hintsUsed?: number;
}> = {};

// In-memory banned user list
const bannedUsers: Set<string> = new Set();
const userBans: Record<string, string> = {};

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
    const types = ["quadratic", "logarithm", "trig", "derivative"];
    const type = types[index % types.length];

    if (type === "quadratic") {
      const x1 = index + 2;
      const x2 = index + 6;
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
      const bases = [2, 3, 5];
      const base = bases[index % bases.length];
      const power = 2 + (index % 3);
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
      const angle = angles[index % angles.length];
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
      const a = index + 2;
      const b = 2 * index + 3;
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
    const speed = 10 + index * 4 + Math.floor(seed * 3);
    const time = 2 + (index % 5);
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

  // 3. Native Language Questions (Expanded pool of 25 to guarantee NO duplicates)
  if (subject === "Native Language") {
    const wordList = [
      { wrong: "harkat", right: "harakat" },
      { wrong: "mashulot", right: "mashg'ulot" },
      { wrong: "tafakur", right: "tafakkur" },
      { wrong: "sinif", right: "sinf" },
      { wrong: "temur", right: "Temur" },
      { wrong: "shaxar", right: "shahar" },
      { wrong: "extiyoj", right: "ehtiyoj" },
      { wrong: "raxmat", right: "rahmat" },
      { wrong: "hursand", right: "xursand" },
      { wrong: "xayot", right: "hayot" },
      { wrong: "muxim", right: "muhim" },
      { wrong: "mashxur", right: "mashhur" },
      { wrong: "boyliq", right: "boylik" },
      { wrong: "maqtab", right: "maktab" },
      { wrong: "hujat", right: "hujjat" },
      { wrong: "talapchan", right: "talabchan" },
      { wrong: "galaba", right: "g'alaba" },
      { wrong: "shoroyit", right: "sharoit" },
      { wrong: "ofqat", right: "ovqat" },
      { wrong: "ijtimoy", right: "ijtimoiy" },
      { wrong: "badiy", right: "badiiy" },
      { wrong: "tabiy", right: "tabiiy" },
      { wrong: "jamoyat", right: "jamoat" },
      { wrong: "ijtixod", right: "ijtihod" },
      { wrong: "marifat", right: "ma'rifat" }
    ];
    const pair = wordList[index % wordList.length];
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

  // 4. History of Uzbekistan Questions (Expanded pool of 20 to guarantee NO duplicates)
  if (subject === "History of Uzbekistan") {
    const historicalFacts = [
      { q: "Buyuk ipak yo'li nechanchi asrlarda gullab-yashnagan?", a: "Miloddan avvalgi II asr - Milodiy XV asr", b: "X-XII asrlar", c: "XV-XVIII asrlar", d: "V-VIII asrlar" },
      { q: "Samarqand shahrining 2750 yilligi qachon nishonlangan?", a: "2007-yil", b: "1997-yil", c: "2010-yil", d: "2012-yil" },
      { q: "Mirzo Ulug'bek tomonidan bunyod etilgan rasadxona qaysi shaharda joylashgan?", a: "Samarqand", b: "Buxoro", c: "Xiva", d: "Toshkent" },
      { q: "Jaloliddin Manguberdi mo'g'ullarga qarshi qaysi daryo bo'yida jang qilgan?", a: "Sind daryosi", b: "Amudaryo", c: "Sirdaryo", d: "Zarafshon" },
      { q: "Amir Temur nechanchi yilda tavallud topgan?", a: "1336-yil 9-aprel", b: "1346-yil 9-aprel", c: "1326-yil 9-aprel", d: "1356-yil 9-aprel" },
      { q: "Avesto muqaddas kitobi qaysi hududda vujudga kelgan?", a: "Xorazm", b: "So'g'diyona", c: "Baqtriya", d: "Marg'iyona" },
      { q: "O'zbekiston Respublikasi Konstitutsiyasi qachon qabul qilingan?", a: "1992-yil 8-dekabr", b: "1991-yil 31-avgust", c: "1993-yil 8-dekabr", d: "1990-yil 20-iyun" },
      { q: "Al-Xorazmiy qaysi ilmiy dargohga rahbarlik qilgan?", a: "Bayt ul-Hikma (Bag'dod)", b: "Ma'mun akademiyasi", c: "Ulug'bek madrasasi", d: "Al-Azhar" },
      { q: "Zahiriddin Muhammad Bobur qayerda vafot etgan?", a: "Agra (Hindiston)", b: "Kobul", c: "Andijon", d: "Dehli" },
      { q: "G'aznaviylar davlatining asoschisi kim?", a: "Alptegin", b: "Subuktegin", c: "Mahmud G'aznaviy", d: "Mas'ud G'aznaviy" },
      { q: "Qoraqalpog'iston Respublikasining poytaxti qaysi shahar?", a: "Nukus", b: "Qo'ng'irot", c: "Xo'jayli", d: "Mo'ynoq" },
      { q: "Amir Temur saltanatining poytaxti qaysi shahar bo'lgan?", a: "Samarqand", b: "Shahrisabz", c: "Buxoro", d: "Toshkent" },
      { q: "Qadimgi Baqtriya davlati qaysi hududlarni qamrab olgan?", a: "Tojikiston, Janubiy O'zbekiston va Shimoliy Afg'oniston", b: "Xorazm va Qoraqalpog'iston", c: "Farg'ona vodiysi", d: "Zarafshon vodiysi" },
      { q: "Toshkent shahri necha yillik tarixga ega?", a: "2200 yildan ortiq", b: "1500 yil", c: "3000 yil", d: "1000 yil" },
      { q: "O'zbekiston BMTga nechanchi yilda a'zo bo'ldi?", a: "1992-yil 2-mart", b: "1991-yil 1-sentabr", c: "1993-yil 5-may", d: "1990-yil 12-iyun" },
      { q: "Shayboniylar sulolasining asoschisi kim?", a: "Muhammad Shayboniyxon", b: "Abulxayrxon", c: "Ko'chkunchixon", d: "Ubaydullaxon" },
      { q: "Ibn Sino jahon ilm-faniga qaysi asari bilan ulkan hissa qo'shgan?", a: "Tib qonunlari", b: "Al-Qonun", c: "Kitob ash-Shifo", d: "Astronomiya asoslari" },
      { q: "Al-Farg'oniy qaysi sohaga oid kashfiyotlari bilan tanilgan?", a: "Astronomiya va matematika", b: "Tibbiyot", c: "Adabiyot", d: "Kimyo" },
      { q: "Qo'qon xonligi nechanchi yilda tashkil topgan?", a: "1709-yil", b: "1710-yil", c: "1500-yil", d: "1800-yil" },
      { q: "Buxoro amirligida bosh vazir lavozimi qanday nomlangan?", a: "Qushbegi", b: "Devonbegi", c: "Otaliq", d: "Parvanachi" }
    ];
    const fact = historicalFacts[index % historicalFacts.length];
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
    const val = 100 + index * 30 + Math.floor(seed * 15);
    const pcts = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75];
    const pct = pcts[index % pcts.length];
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

  // 6. Professional Subject Questions (Expanded pools of 20 unique questions per topic to guarantee NO duplicates)
  const engineeringTopics = {
    "Kiber Xavfsizlik": [
      { q: "Tarmoq trafigini kuzatish va ruxsatsiz kirishlarni aniqlash tizimi qanday nomlanadi?", a: "IDS (Intrusion Detection System)", b: "WAF (Web Application Firewall)", c: "VPN (Virtual Private Network)", d: "Proxy" },
      { q: "Shifrlangan ma'lumotlarni kalitsiz ochishga urinish jarayoni nima deyiladi?", a: "Kriptotahlil (Cryptanalysis)", b: "Dekodlash", c: "Hashing", d: "Symmetric Encryption" },
      { q: "Qaysi xavfsizlik protokoli internet saytlari uchun shifrlashni ta'minlaydi?", a: "HTTPS / TLS", b: "FTP", c: "HTTP", d: "Telnet" },
      { q: "Kiberxavfsizlikda 'Zero Trust' arxitekturasining asosiy tamoyili nima?", a: "Hech qachon ishonmaslik, har doim tekshirish", b: "Faqat ichki foydalanuvchilarga ishonish", c: "Faqat parollardan foydalanish", d: "Tarmoqni xavfsiz deb hisoblash" },
      { q: "DDoS hujumining asosiy maqsadi nima?", a: "Tizim yoki serverni yuklama bilan ishdan chiqarish", b: "Ma'lumotlarni o'g'irlash", c: "Parolni buzish", d: "Kodni shifrlash" },
      { q: "Foydalanuvchini soxta veb-saytlar orqali maxfiy ma'lumotlarini kiritishga majburlash hujumi qanday ataladi?", a: "Phishing (Fishig)", b: "Malware", c: "SQL Injection", d: "Ransomware" },
      { q: "Smetrik shifrlash algoritmini ko'rsating.", a: "AES", b: "RSA", c: "ECC", d: "Diffie-Hellman" },
      { q: "Asimmetrik shifrlashda nechta kalit ishlatiladi?", a: "2 ta (Ochiq va yopiq kalit)", b: "1 ta (Faqat umumiy kalit)", c: "3 ta", d: "Uchta mustaqil kalit" },
      { q: "SHA-256 algoritmining vazifasi nima?", a: "Bir tomonlama xesh qiymat hosil qilish", b: "Ma'lumotni qayta shifrlash", c: "Faylni siqish", d: "Raqamli imzoni tekshirish" },
      { q: "SQL inyeksiya (SQL Injection) hujumi qayerga qaratilgan bo'ladi?", a: "Ma'lumotlar bazasi so'rovlariga", b: "Foydalanuvchi brauzeriga", c: "Router qurilmasiga", d: "Operatsion tizim yadrosiga" },
      { q: "Ransomware dasturlarining asosiy maqsadi nima?", a: "Tizim ma'lumotlarini shifrlab, tovon puli talab qilish", b: "Parollarni josuslik orqali o'g'irlash", c: "Klaviatura bosilishini yozib olish", d: "Reklamalar ko'rsatish" },
      { q: "VPN texnologiyasi nima uchun xizmat qiladi?", a: "Shifrlangan va xavfsiz tarmoq kanali yaratish", b: "Internet tezligini oshirish", c: "Viruslarni o'chirish", d: "IP-manzilni butunlay yo'q qilish" },
      { q: "Qaysi zararli dastur turi o'z-o'zidan tarmoq orqali tarqalish xususiyatiga ega?", a: "Gijja (Worm)", b: "Troyalik ot (Trojan)", c: "Josus dastur (Spyware)", d: "Adware" },
      { q: "Xavfsizlik devori (Firewall) qanday vazifani bajaradi?", a: "Tarmoq trafigini qoidalar asosida filtrlash", b: "Operativ xotirani tozalash", c: "Slaydlarni namoyish qilish", d: "IP-manzilni o'zgartirish" },
      { q: "Ikki faktorli autentifikatsiya (2FA) nima?", a: "Shaxsni tasdiqlash uchun ikki xil mustaqil usuldan foydalanish", b: "Parolni ikki marta kiritish", c: "Ikki kishi tomonidan tizimga kirish", d: "Ikki xil brauzerda ishlash" },
      { q: "Xavfsizlik devorida 'Port' nima?", a: "Tarmoqdagi aloqa interfeysi raqami", b: "Fayl turi", c: "Kompyuter qismlari bog'lovchisi", d: "Kompilyator sozlamasi" },
      { q: "Tarmoq paketlarini tahlil qiluvchi dastur (Sniffer) ga misol keltiring.", a: "Wireshark", b: "Apache", c: "Visual Studio", d: "Docker" },
      { q: "Man-in-the-Middle (MitM) hujumi nima?", a: "Ikki tomon orasidagi aloqani yashirincha kuzatish yoki o'zgartirish", b: "Serverni jismonan sindirish", c: "Parolni noto'g'ri kiritish", d: "Ma'lumotlar bazasini o'chirish" },
      { q: "Shifrlangan xavfsiz masofaviy ulanish protokoli qaysi?", a: "SSH", b: "Telnet", c: "HTTP", d: "FTP" },
      { q: "Kiberxavfsizlikda 'Exploit' nima?", a: "Tizimdagi zaiflikdan foydalanuvchi kod yoki dastur", b: "Antivirus dasturi", c: "Ma'lumotlar ombori", d: "Router sozlamasi" }
    ],
    "Kompyuter Injenering": [
      { q: "Katta hajmdagi ma'lumotlarni saqlaydigan va protsessordan sekinroq ishlaydigan xotira?", a: "Qattiq disk (HDD/SSD)", b: "Registr", c: "Kesh xotira L1", d: "RAM" },
      { q: "Ikkilik sanoq tizimidagi 1010 soni o'nlik sanoq tizimida nimaga teng?", a: "10", b: "12", c: "8", d: "14" },
      { q: "Yarim o'tkazgichli diodning asosiy vazifasi nima?", a: "Tokni faqat bir tomonga o'tkazish", b: "Kuchlanishni oshirish", c: "Signalni kuchaytirish", d: "Energiya saqlash" },
      { q: "Kompyuter tizimlarida kesh (Cache) xotiraning vazifasi nima?", a: "Tez-tez ishlatiladigan ma'lumotlarni tezkor yetkazib berish", b: "Ma'lumotlarni uzoq muddat saqlash", c: "Tizimni sovutish", d: "Elektr energiyasini tejash" },
      { q: "Protsessorning tezligi qaysi o'lchov birligida o'lchanadi?", a: "Gers (Ggts / GHz)", b: "Bayt", c: "Amper", d: "Volt" },
      { q: "Kompyuterdagi BIOS dasturining asosiy vazifasi nima?", a: "Apparat ta'minotini testdan o'tkazish va yuklash (POST)", b: "Hujjatlarni tahrirlash", c: "Internetga ulanish", d: "Video fayllarni ijro etish" },
      { q: "Tezkor xotira (RAM) qanday xususiyatga ega?", a: "Energiya o'chganda ma'lumotlar o'chib ketadi (Vaqtinchalik)", b: "Ma'lumotlar abadiy saqlanadi", c: "Faqat o'qish uchun mo'ljallangan", d: "Mexanik disklardan tashkil topgan" },
      { q: "Protsessor tarkibidagi ALU (Arithmetic Logic Unit) nima ish bajaradi?", a: "Arifmetik va mantiqiy amallarni bajaradi", b: "Xotira manzillarini boshqaradi", c: "Ma'lumotlarni uzatadi", d: "Kadr chastotasini oshiradi" },
      { q: "Kompyuter arxitekturasida 'Shina' (Bus) nima?", a: "Kompyuter qismlari o'rtasida ma'lumot uzatuvchi simlar tizimi", b: "Kabel kanali", c: "Operatsion tizim dasturi", d: "Sovutgich ventilyatori" },
      { q: "Sanoq tizimlarida o'n oltilik (Hexadecimal) tizimida 'A' belgisi qaysi songa mos keladi?", a: "10", b: "11", c: "12", d: "15" },
      { q: "SSD (Solid State Drive) xotiraning HDD dan asosiy afzalligi nima?", a: "Harakatlanuvchi mexanik qismlari yo'qligi va yuqori tezligi", b: "Arzonligi", c: "Kattaligi", d: "Elektr quvvatini ko'p sarflashi" },
      { q: "Tizimli plata (Motherboard) nima vazifani bajaradi?", a: "Barcha apparat qismlarini birlashtiradi va aloqasini ta'minlaydi", b: "Faqat protsessorni quvvatlaydi", c: "Klaviatura vazifasini bajaradi", d: "Operatsion tizimni yuklaydi" },
      { q: "Kompyuter sovutish tizimidagi 'Termopasta' nima uchun surtiladi?", a: "Protsessor va radiator orasidagi issiqlik uzatishni yaxshilash", b: "Qismlarni bir-biriga yopishtirish", c: "Elektr tokini o'tkazish", d: "Chang kirishini oldini olish" },
      { q: "Raqamli mantiqiy sxemadagi 'AND' (VA) mantiqiy elementi qachon 1 (rost) chiqish beradi?", a: "Barcha kirish signallari 1 bo'lganda", b: "Hech bo'lmaganda bitta kirish 1 bo'lganda", c: "Kirish signallari 0 bo'lganda", d: "Har doim" },
      { q: "Mantiqiy 'OR' (YOKI) elementi qachon 1 (rost) chiqish beradi?", a: "Hech bo'lmaganda bitta kirish 1 bo'lganda", b: "Faqat barcha kirishlar 1 bo'lganda", c: "Faqat kirishlar 0 bo'lganda", d: "Hech qachon" },
      { q: "Kompyuterning asosiy doimiy xotirasi (ROM) nima uchun ishlatiladi?", a: "Yuklovchi va tizim dasturlarini (masalan, BIOS) saqlash", b: "O'yinlarni yuklash", c: "Foydalanuvchi fayllarini vaqtincha saqlash", d: "Internet brauzer keshini yuritish" },
      { q: "Protsessor yadrosi (Core) nima?", a: "Ko'rsatmalarni bajaradigan mustaqil hisoblash bloki", b: "Protsessorning plastik qoplamasi", c: "Kesh xotira bo'limi", d: "Sovutish fanining markazi" },
      { q: "Kompyuter grafik kartasining (GPU) asosiy vazifasi nima?", a: "Grafik ma'lumotlarni hisoblash va tasvirni ekranga chiqarish", b: "Matnli hujjatlarni tahrirlash", c: "Ovozli signallarni yozish", d: "Tarmoq aloqasini boshqarish" },
      { q: "Tarmoq kartasining MAC manzili necha bitdan iborat bo'ladi?", a: "48 bit", b: "32 bit", c: "64 bit", d: "128 bit" },
      { q: "Ikkilik sanoq tizimida 1 + 1 yig'indi nimaga teng?", a: "10 (ikkilik tizimda)", b: "2 (ikkilik tizimda)", c: "1", d: "0" }
    ],
    "Dasturiy Injenering": [
      { q: "Qidiruv algoritmlari ichida eng tezkor hisoblanadigan tartiblangan massivlar uchun algoritm qaysi?", a: "Binar qidiruv (Binary Search)", b: "Chiziqli qidiruv (Linear Search)", c: "Ko'piksimon (Bubble Search)", d: "Deykstra algoritmi" },
      { q: "Kodni versiyalarini boshqarish va guruhda ishlash uchun eng mashhur tizim qaysi?", a: "Git", b: "Docker", c: "Jenkins", d: "Kubernetes" },
      { q: "REST API arxitekturasida ma'lumotlarni yaratish uchun qaysi HTTP metodi ishlatiladi?", a: "POST", b: "GET", c: "PUT", d: "DELETE" },
      { q: "OOP (Object-Oriented Programming) ning 4 ta asosiy ustuni qaysilar?", a: "Inkapsulyatsiya, Polimorfizm, Merosxo'rlik, Abstratsiya", b: "Klasslar, Obyektlar, Funksiyalar, O'zgaruvchilar", c: "Sinf, Funksiya, Massiv, Sikl", d: "Modullik, Shifrlash, Aloqa, Sinov" },
      { q: "Dasturlashda DRY (Don't Repeat Yourself) tamoyili nima haqida?", a: "Kodni takrorlamaslik va modullikka intilish", b: "O'zgaruvchilarni qayta ishlatmaslik", c: "Faqat bitta faylda kod yozish", d: "Doimiy izohlar yozish" },
      { q: "Agile metodologiyasidagi 'Sprint' nima?", a: "Belgilangan qisqa vaqt ichida bajariladigan ishlar sikli (odatda 2-4 hafta)", b: "Kodni tezkor yozish musobaqasi", c: "Serverni qayta yuklash jarayoni", d: "Dasturni mijozga topshirish kuni" },
      { q: "Klassdan olingan aniq nusxa dasturlashda nima deb ataladi?", a: "Obyekt (Instance)", b: "Metod", c: "Konstruktor", d: "Atribut" },
      { q: "Infrastruktura va dasturlarni konteynerlar ichida ishga tushirish uchun qaysi platforma eng mashhur?", a: "Docker", b: "Xcode", c: "NPM", d: "GitLab" },
      { q: "Ma'lumotlar tuzilmasida FIFO (First In, First Out) tamoyili qaysi tuzilmaga tegishli?", a: "Navbat (Queue)", b: "Stek (Stack)", c: "Daraxt (Tree)", d: "Graf (Graph)" },
      { q: "Stek (Stack) ma'lumotlar tuzilmasi qaysi tamoyil asosida ishlaydi?", a: "LIFO (Last In, First Out)", b: "FIFO (First In, First Out)", c: "Random Access", d: "Hech qaysi" },
      { q: "Dasturdagi xatolarni qidirish va bartaraf etish jarayoni nima deb ataladi?", a: "Otladka (Debugging)", b: "Kompilyatsiya", c: "Refaktoring", d: "Deploy" },
      { q: "Kodni funksional o'zgarishsiz uning tuzilishini yaxshilash jarayoni nima?", a: "Refaktoring (Refactoring)", b: "Kompilyatsiya", c: "Testlash", d: "Merj qilish" },
      { q: "MVC arxitektura namunasining kengaytmasi nima?", a: "Model-View-Controller", b: "Micro-Variable-Compiler", c: "Many-View-Classes", d: "Main-Vector-Code" },
      { q: "Qaysi test turi dasturning alohida eng kichik funksiya yoki modullarini tekshirish uchun ishlatiladi?", a: "Unit Test (Yunit test)", b: "Integration Test", c: "Stress Test", d: "UI Test" },
      { q: "Boshqa klass xususiyatlari va metodlarini o'zlashtirish OOPda qanday ataladi?", a: "Merosxo'rlik (Inheritance)", b: "Inkapsulyatsiya", c: "Polimorfizm", d: "Abstratsiya" },
      { q: "Polimorfizm nima?", a: "Turli obyektlarning bir xil nomli metodga turlicha javob berish xususiyati", b: "Kodni shifrlash", c: "Ma'lumotlarni yashirish", d: "Klasslarni meros olish" },
      { q: "Ma'lumotlarni sinf ichida yashirish va faqat maxsus metodlar orqali murojaat qilish nima deyiladi?", a: "Inkapsulyatsiya (Encapsulation)", b: "Abstratsiya", c: "Polimorfizm", d: "Merosxo'rlik" },
      { q: "Dasturlashda binar (ikkilik) faylni mashina kodiga o'tkazadigan dastur nima?", a: "Kompilyator (Compiler)", b: "Interpretator", c: "Linter", d: "Debugger" },
      { q: "Interpretator va Kompilyator o'rtasidagi asosiy farq nima?", a: "Interpretator kodni qatorma-qator bajaradi, kompilyator esa butun kodni birdaniga tarjima qiladi", b: "Kompilyator sekinroq ishlaydi", c: "Hech qanday farqi yo'q", d: "Interpretator faqat HTML uchun ishlaydi" },
      { q: "Dasturiy mahsulotni ishlab chiqish hayotiy sikli (SDLC) ning birinchi bosqichi nima?", a: "Talablarni yig'ish va tahlil qilish", b: "Kodni yozish", c: "Dizayn yaratish", d: "Testdan o'tkazish" }
    ],
    "Sun'iy Intellekt": [
      { q: "Neyron tarmoqlarida har bir neyronning kirish qiymatlarini qayta ishlaydigan funksiya qanday nomlanadi?", a: "Aktivizatsiya funksiyasi (Activation Function)", b: "Yo'qotish funksiyasi (Loss Function)", c: "Gradient tushishi (Gradient Descent)", d: "Chiziqli regressiya" },
      { q: "AI va Data Science yo'nalishida eng keng qo'llaniladigan dasturlash tili qaysi?", a: "Python", b: "C++", c: "PHP", d: "Java" },
      { q: "Qaysi texnologiya inson tili va nutqini tahlil qilish uchun mo'ljallangan?", a: "NLP (Natural Language Processing)", b: "Computer Vision", c: "Reinforcement Learning", d: "Blockchain" },
      { q: "Mashinali o'rganishda (Machine Learning) 'Supervised Learning' nima?", a: "Belgilangan (etiketlangan) ma'lumotlar yordamida o'qitish", b: "Nazoratsiz, o'z-o'zidan o'rganish", c: "Robotlar bilan ishlash", d: "Faqat tasvirlarni o'rganish" },
      { q: "Neyron tarmoqlari qaysi biologik tuzilmadan ilhomlanib yaratilgan?", a: "Inson miyasi va neyronlari", b: "O'simlik hujayralari", c: "DNK tuzilmasi", d: "Yurak qon tomirlari" },
      { q: "Chuqur o'rganish (Deep Learning) mashinali o'rganishning qaysi yo'nalishidan farq qiladi?", a: "Ko'p qatlamli sun'iy neyron tarmoqlaridan foydalanishi bilan", b: "Faqat matnlar bilan ishlashi bilan", c: "Tezligining pastligi bilan", d: "Hech qanday farqi yo'q" },
      { q: "Tasvirlarni aniqlash va kompyuter ko'rishi (Computer Vision) sohasida eng samarali neyron tarmog'i turi qaysi?", a: "CNN (Convolutional Neural Network)", b: "RNN (Recurrent Neural Network)", c: "LSTM", d: "GAN" },
      { q: "Matnlar va ketma-ketlik ma'lumotlari (masalan, tarjimalar) bilan ishlash uchun qaysi tarmoq turi ko'proq mos keladi?", a: "RNN (Recurrent Neural Network)", b: "CNN", c: "Linear Regression", d: "K-Means" },
      { q: "Neyron tarmog'ini o'qitishda xatolikni hisoblovchi funksiya nima deb ataladi?", a: "Yo'qotish funksiyasi (Loss Function)", b: "Aktivizatsiya funksiyasi", c: "Optimayzer (Optimizer)", d: "Eshik funksiyasi" },
      { q: "Neyron tarmog'ini optimallashtirish va xatolikni minimallashtirish uchun eng mashhur algoritm?", a: "Gradient tushishi (Gradient Descent)", b: "Binar qidiruv", c: "Deykstra algoritmi", d: "Saralash algoritmi" },
      { q: "Sun'iy intellektda 'Overfitting' (O'ta moslashish) muammosi nima?", a: "Model o'quv ma'lumotlarini yodlab olib, yangi ma'lumotlarda past natija ko'rsatishi", b: "Modelning umuman o'rgana olmasligi", c: "Modelning juda tez ishlashi", d: "Xotirada joy qolmasligi" },
      { q: "Mashinali o'rganishda 'Clustering' (Klasterlash) qaysi o'qitish turiga misol bo'ladi?", a: "Unsupervised Learning (Nazoratsiz o'qitish)", b: "Supervised Learning", c: "Reinforcement Learning", d: "Hech biriga" },
      { q: "Atrof-muhit bilan o'zaro aloqa va mukofot / jazo tizimi orqali o'rganish qanday ataladi?", a: "Reinforcement Learning (Mustahkamlovchi o'rganish)", b: "Supervised Learning", c: "Linear Regression", d: "Decision Tree" },
      { q: "Qaysi kutubxona Pythonda sun'iy neyron tarmoqlarini yaratish va o'qitish uchun ishlatiladi?", a: "TensorFlow / PyTorch", b: "Django", c: "Flask", d: "Requests" },
      { q: "Sun'iy intellektda 'Turing Testi' nima maqsadda qo'llaniladi?", a: "Mashinaning insonga xos aqlli xulq-atvor namoyish eta olish qobiliyatini tekshirish", b: "Protsessor tezligini tekshirish", c: "Xotira hajmini o'lchash", d: "Tarmoq xavfsizligini aniqlash" },
      { q: "Mashinali o'rganishda chiziqli bog'liqlikni aniqlash uchun qo'llaniladigan eng sodda model qaysi?", a: "Chiziqli regressiya (Linear Regression)", b: "Neyron tarmog'i", c: "SVM (Support Vector Machine)", d: "Random Forest" },
      { q: "NLP (Tabiiy tilni qayta ishlash) sohasidagi 'Tokenizatsiya' nima?", a: "Matnni alohida so'zlar yoki belgilarga (tokenlarga) bo'lish", b: "Matnni shifrlash", c: "Matnni ingliz tiliga tarjima qilish", d: "Matnni o'chirib yuborish" },
      { q: "Generativ AI modellarining eng mashhur arxitekturasi qaysi (masalan, ChatGPT asosi)?", a: "Transformer", b: "CNN", c: "RNN", d: "Decision Tree" },
      { q: "Mashinali o'rganishda 'Dataset' nima?", a: "Modelni o'qitish va testlash uchun mo'ljallangan ma'lumotlar to'plami", b: "Dasturlash muhiti", c: "Ma'lumotlar bazasi serveri", d: "Kutubxonalar yig'indisi" },
      { q: "Sun'iy intellektda 'Feature' nima?", a: "Ma'lumotlar to'plamidagi o'rganiluvchi ustun yoki xususiyat (masalan, uyning maydoni)", b: "Dastur xatosi", c: "Neyron qatlami", d: "Hisoblash vaqti" }
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

// Ensure all options are strictly unique and not identical
function deduplicateQuestionOptions(q: any): any {
  if (!q || !q.options) return q;
  const correctKey = q.correctAnswer || "A";
  const correctVal = q.options[correctKey];
  const keys = ["A", "B", "C", "D"];
  const seen = new Set<string>();
  seen.add(correctVal);

  const updatedOptions: Record<string, string> = { [correctKey]: correctVal };

  keys.forEach((key) => {
    if (key === correctKey) return;
    let val = q.options[key];
    let attempts = 0;
    while ((seen.has(val) || val === undefined || val === null || val === "") && attempts < 25) {
      attempts++;
      const num = parseFloat(val);
      if (!isNaN(num)) {
        const offset = Math.floor(Math.random() * 5) + 1;
        const sign = Math.random() > 0.5 ? 1 : -1;
        val = String(num + (sign * offset));
      } else {
        val = val + " (Muqobil variant " + attempts + ")";
      }
    }
    seen.add(val);
    updatedOptions[key] = val;
  });

  q.options = updatedOptions;
  return q;
}

// 1. Dynamic Test Creation Endpoint
app.post("/api/test/start", (req, res) => {
  const { uid, directionId, directionName } = req.body;

  if (!uid || !directionId || !directionName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const nowTime = Date.now();
  const banExpiry = userBans[uid];
  if (banExpiry) {
    if (banExpiry === "permanent" || new Date(banExpiry).getTime() > nowTime) {
      return res.status(403).json({ error: `Sizning hisobingiz admin tomonidan bloklangan! Blok muddati: ${banExpiry === "permanent" ? "Umrbod" : new Date(banExpiry).toLocaleString()}` });
    } else {
      bannedUsers.delete(uid);
      delete userBans[uid];
    }
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

  // CRITICAL FIX: Deep-clone questions using JSON parse/stringify to prevent mutating original templates!
  const clonedQuestions = finalQuestions.map(q => JSON.parse(JSON.stringify(q)));

  // Fully randomize the 90 questions overall order using Fisher-Yates
  const fullyRandomizedQuestions = shuffleArray(clonedQuestions);

  // Randomize option order and deduplicate them for each question securely on server-side
  const preppedQuestionsForClient = fullyRandomizedQuestions.map((q) => {
    // Deduplicate options first to ensure none are identical
    deduplicateQuestionOptions(q);

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
    durationSeconds: 14400, // 4 hours
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

// 2.5 Use Hint (Yordam) Endpoint
app.post("/api/test/use-hint", (req, res) => {
  const { testSessionId, questionId, uid } = req.body;

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
    return res.status(400).json({ error: "Test yakunlangan. Yordamdan foydalanib bo'lmaydi." });
  }

  if (session.hintsUsed === undefined) {
    session.hintsUsed = 0;
  }

  if (session.hintsUsed >= 3) {
    return res.status(400).json({ error: "Siz barcha 3 ta yordam imkoniyatidan foydalanib bo'ldingiz!" });
  }

  const q = session.questions.find((question: any) => question.id === questionId);
  if (!q) {
    return res.status(404).json({ error: "Savol topilmadi." });
  }

  const correctKey = q.correctAnswer;
  const allKeys = ["A", "B", "C", "D"];
  const wrongKeys = allKeys.filter(k => k !== correctKey);

  const shuffledWrong = shuffleArray(wrongKeys);
  const optionsToHide = shuffledWrong.slice(0, 2);

  session.hintsUsed += 1;

  res.json({
    success: true,
    optionsToHide,
    hintsUsed: session.hintsUsed
  });
});

// 3. Complete Test & Secure Score Calculation Endpoint
app.post("/api/test/finish", (req, res) => {
  const { testSessionId, uid, timeUsedSeconds, hintsUsed } = req.body;

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
  session.hintsUsed = hintsUsed || 0;

  res.json({
    score: totalScore,
    correctCount,
    wrongCount,
    emptyCount,
    percentage: Math.round((correctCount / session.questions.length) * 100),
    timeUsed: timeUsedFormatted,
    directionName: session.directionName,
    passed: totalScore >= 94,
    hintsUsed: session.hintsUsed
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
  const { uid, action, duration } = req.body; // action: 'ban' | 'unban', duration: '1_hour' | '12_hours' | '1_day' | etc
  if (!uid) return res.status(400).json({ error: "Missing uid" });

  if (action === "ban") {
    bannedUsers.add(uid);
    let bannedUntil = "permanent";
    if (duration && duration !== "permanent") {
      const now = Date.now();
      let ms = 0;
      if (duration === "1_hour") ms = 3600000;
      else if (duration === "12_hours") ms = 43200000;
      else if (duration === "1_day") ms = 86400000;
      else if (duration === "7_days") ms = 604800000;
      else if (duration === "30_days") ms = 2592000000;
      else if (duration === "1_year") ms = 31536000000;
      
      bannedUntil = new Date(now + ms).toISOString();
    }
    userBans[uid] = bannedUntil;
  } else {
    bannedUsers.delete(uid);
    delete userBans[uid];
  }
  res.json({ success: true, banned: bannedUsers.has(uid), bannedUntil: userBans[uid] || null });
});

app.get("/api/admin/banned-users", (req, res) => {
  const now = Date.now();
  const activeBans: string[] = [];
  
  for (const uid in userBans) {
    const until = userBans[uid];
    if (until === "permanent" || new Date(until).getTime() > now) {
      activeBans.push(uid);
    } else {
      bannedUsers.delete(uid);
      delete userBans[uid];
    }
  }
  res.json({ banned: activeBans, details: userBans });
});

// Premium Purchase Endpoint - Sends receipt details and image to Telegram bot
app.post("/api/premium/purchase", async (req, res) => {
  const { uid, nickname, email, plan, price, receiptImage } = req.body;
  
  if (!uid || !plan || !price || !receiptImage) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || "8793002359:AAHEv9w1N7x3Q1ud_UB1hxAJS2qAo4IEPDs";
  const telegramChatId = process.env.TELEGRAM_CHAT_ID || "8269163077";

  const caption = `<b>📥 YANGI PREMIUM TO'LOV SO'ROVI!</b>\n\n` +
                  `👤 <b>Abituriyent:</b> ${nickname} (UID: ${uid})\n` +
                  `📧 <b>Email:</b> ${email || "Mavjud emas"}\n` +
                  `💎 <b>Tanlangan tarif:</b> ${plan.toUpperCase()}\n` +
                  `💰 <b>To'lov miqdari:</b> ${Number(price).toLocaleString('uz-UZ')} UZS\n` +
                  `📅 <b>Sana:</b> ${new Date().toLocaleString('uz-UZ')}\n\n` +
                  `<i>Tasdiqlash yoki rad etish uchun DTM MASTER Admin Paneliga kiring.</i>`;

  try {
    const base64Data = receiptImage.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    
    const formData = new FormData();
    const blob = new Blob([buffer], { type: "image/jpeg" });
    formData.append("chat_id", telegramChatId);
    formData.append("photo", blob, "receipt.jpg");
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");

    console.log(`[Telegram Bot] Sending photo to chat ${telegramChatId}...`);
    const tgRes = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendPhoto`, {
      method: "POST",
      body: formData
    });

    const tgData = await tgRes.json();
    if (tgData.ok) {
      console.log(`[Telegram Bot] Photo sent successfully!`);
      return res.json({ success: true });
    } else {
      console.error("[Telegram Bot] Photo send failed, falling back to text-only message:", tgData);
      
      const textMsg = `<b>📥 YANGI TO'LOV SO'ROVI (Chek rasmisiz)</b>\n\n` +
                      `👤 <b>Abituriyent:</b> ${nickname}\n` +
                      `💎 <b>Tarif:</b> ${plan.toUpperCase()}\n` +
                      `💰 <b>To'lov:</b> ${Number(price).toLocaleString('uz-UZ')} UZS\n` +
                      `<i>Eslatma: Chek rasmi yuborishda muammo bo'ldi, lekin so'rov muvaffaqiyatli saqlandi.</i>`;
                      
      const textRes = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: textMsg,
          parse_mode: "HTML"
        })
      });
      const textData = await textRes.json();
      return res.json({ success: textData.ok });
    }
  } catch (err: any) {
    console.error("Telegram forwarding error:", err);
    // Even if Telegram fails, we return success so the user does not get stuck,
    // since the record is already saved in Firestore on the client side.
    return res.json({ success: true, warning: "Telegram botga yuborilmadi: " + err.message });
  }
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
