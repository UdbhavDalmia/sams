import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp as initAdminApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { Student, Doubt, ALL_TOPICS, CHEMISTRY_TOPICS, PHYSICS_TOPICS, MATHS_TOPICS } from "./src/types";

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

// Paths for JSON storage (fallback)
const DATA_DIR = path.join(process.cwd(), "data");
const STUDENTS_FILE = path.join(DATA_DIR, "students.json");
const DOUBTS_FILE = path.join(DATA_DIR, "doubts.json");

// Ensure data directory exists for fallback
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed list of 37 chemistry students
const INITIAL_STUDENTS: Omit<Student, "scores">[] = [
  { rollNo: 1, name: "Mukul Sharma", phone: "8287901366" },
  { rollNo: 2, name: "Supriya", phone: "9599540886" },
  { rollNo: 3, name: "Vanshika", phone: "8506061212" },
  { rollNo: 4, name: "Jai Kumar", phone: "9555783802" },
  { rollNo: 5, name: "Aditya Prasad", phone: "7678164362" },
  { rollNo: 6, name: "Aarav Gupta", phone: "8383904995" },
  { rollNo: 7, name: "Shashwat Tiwari", phone: "9718462276" },
  { rollNo: 8, name: "Udbhav Dalmia", phone: "8178109588" },
  { rollNo: 9, name: "Simran Pokhriyal", phone: "9354667018" },
  { rollNo: 10, name: "Ishank", phone: "7011157797" },
  { rollNo: 11, name: "Aditya Prajapati", phone: "9213819186" },
  { rollNo: 12, name: "Pragun Sharma", phone: "8800862176" },
  { rollNo: 13, name: "Aryan Dubey", phone: "7703824656" },
  { rollNo: 14, name: "Manan Nimesh", phone: "8860235111" },
  { rollNo: 15, name: "Siddharth", phone: "9267921428" },
  { rollNo: 16, name: "Adarsh Patel", phone: "9355323047" },
  { rollNo: 17, name: "Kanishk", phone: "9873039704" },
  { rollNo: 18, name: "Kirti", phone: "8595741151" },
  { rollNo: 19, name: "Ansh Kumar", phone: "8595048032" },
  { rollNo: 20, name: "Dev Rathore", phone: "9211487571" },
  { rollNo: 21, name: "Sidhant Gupta", phone: "7633925835" },
  { rollNo: 22, name: "Komal Mehra", phone: "8588015525" },
  { rollNo: 23, name: "Viraj Dagar", phone: "9540836788" },
  { rollNo: 24, name: "Rakesh Kumar Rai", phone: "8178777178" },
  { rollNo: 25, name: "Lucky", phone: "9871749320" },
  { rollNo: 26, name: "Prince", phone: "9891240667" },
  { rollNo: 27, name: "Gaurav", phone: "7042508621" },
  { rollNo: 28, name: "Aneesh Kumar", phone: "8651835743" },
  { rollNo: 29, name: "Anshuman Tripathi", phone: "8076237923" },
  { rollNo: 30, name: "Yash Bisht", phone: "9355753773" },
  { rollNo: 31, name: "Laxman", phone: "9310984491" },
  { rollNo: 32, name: "Parth", phone: "9837168670" },
  { rollNo: 33, name: "Nishtha Lahoti", phone: "9312102838" },
  { rollNo: 34, name: "Aayush Mishra", phone: "8860927753" },
  { rollNo: 35, name: "Harshit", phone: "9205943320" },
  { rollNo: 36, name: "Drishti", phone: "8368857795" },
  { rollNo: 37, name: "Priyanshi Vahal", phone: "9810297183" }
];

// Initialize Firestore Admin Client
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let db: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    
    // Support custom Service Account key configuration in external hosting environments (like Render)
    let options: any = {
      projectId: firebaseConfig.projectId,
    };
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        options.credential = cert(serviceAccount);
        console.log("[Firestore] Service account detected in environment variables. Using custom credentials.");
      } catch (e) {
        console.error("[Firestore] Failed to parse FIREBASE_SERVICE_ACCOUNT env variable. Falling back to default credentials.", e);
      }
    }

    const adminApp = initAdminApp(options);
    db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
    console.log(`[Firestore] Initialized successfully with Database: ${firebaseConfig.firestoreDatabaseId}`);
    
    // Asynchronously trigger seeding
    ensureFirestoreSeeded().catch((err) => {
      console.error("[Firestore] Seeding error:", err);
    });
  } catch (err) {
    console.error("[Firestore] Initialization failed. Falling back to local storage.", err);
  }
} else {
  console.log("[Firestore] firebase-applet-config.json missing. Operating in local-only fallback mode.");
}

async function ensureFirestoreSeeded() {
  if (!db) return;
  try {
    const studentsRef = db.collection("students");
    const snapshot = await studentsRef.limit(1).get();
    if (snapshot.empty) {
      console.log("[Firestore] Database is empty. Seeding INITIAL_STUDENTS class...");
      const batch = db.batch();
      INITIAL_STUDENTS.forEach((s) => {
        const scores: Record<string, number> = {};
        ALL_TOPICS.forEach((t) => {
          scores[t] = 0;
        });
        const docRef = studentsRef.doc(String(s.rollNo));
        batch.set(docRef, {
          ...s,
          scores,
          milestones: {}
        });
      });
      await batch.commit();
      console.log("[Firestore] Seeding complete! 37 students inserted.");
    } else {
      console.log("[Firestore] Verification: Database is already seeded.");
    }
  } catch (err) {
    console.error("[Firestore] Failed to seed database:", err);
  }
}

// Asynchronous Data Managers (with robust fallbacks)
async function getStudents(): Promise<Student[]> {
  if (db) {
    try {
      const snapshot = await db.collection("students").get();
      const students: Student[] = [];
      snapshot.forEach((doc: any) => {
        students.push(doc.data() as Student);
      });
      
      if (students.length > 0) {
        // Auto-migration to ensure all topics are initialized in Firestore
        let migrationRequired = false;
        students.forEach((s) => {
          if (!s.scores) s.scores = {};
          if (!s.milestones) s.milestones = {};
          ALL_TOPICS.forEach((t) => {
            if (s.scores[t] === undefined) {
              s.scores[t] = 0;
              migrationRequired = true;
            }
          });
        });

        if (migrationRequired) {
          console.log("[Firestore] Database records required schema migration. Syncing...");
          const batch = db.batch();
          students.forEach((s) => {
            const docRef = db.collection("students").doc(String(s.rollNo));
            batch.set(docRef, s);
          });
          await batch.commit();
        }

        return students.sort((a, b) => a.rollNo - b.rollNo);
      }
    } catch (err) {
      console.error("[Firestore] Error reading students. Falling back to local file.", err);
    }
  }

  // Local File Fallback
  let students: Student[] = [];
  if (!fs.existsSync(STUDENTS_FILE)) {
    students = INITIAL_STUDENTS.map((s) => {
      const scores: Record<string, number> = {};
      ALL_TOPICS.forEach((t) => {
        scores[t] = 0;
      });
      return { ...s, scores, milestones: {} };
    });
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), "utf8");
    return students;
  }
  try {
    students = JSON.parse(fs.readFileSync(STUDENTS_FILE, "utf8"));
    
    let migrated = false;
    students = students.map((s) => {
      let changed = false;
      if (!s.scores) {
        s.scores = {};
        changed = true;
      }
      ALL_TOPICS.forEach((t) => {
        if (s.scores[t] === undefined) {
          s.scores[t] = 0;
          changed = true;
        }
      });
      if (!s.milestones) {
        s.milestones = {};
        changed = true;
      }
      if (changed) migrated = true;
      return s;
    });

    if (migrated) {
      fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), "utf8");
    }
    return students;
  } catch (err) {
    console.error("Error reading students local database file, resetting:", err);
    return [];
  }
}

async function saveStudents(students: Student[]): Promise<void> {
  if (db) {
    try {
      // Chunk batch operations to stay safely under Firestore's 500-write limit
      const batchSize = 100;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = db.batch();
        const chunk = students.slice(i, i + batchSize);
        chunk.forEach((s) => {
          const docRef = db.collection("students").doc(String(s.rollNo));
          batch.set(docRef, s);
        });
        await batch.commit();
      }
      return;
    } catch (err) {
      console.error("[Firestore] Error during bulk save. Saving locally.", err);
    }
  }
  fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), "utf8");
}

async function getDoubts(): Promise<Doubt[]> {
  if (db) {
    try {
      const snapshot = await db.collection("doubts").get();
      const doubts: Doubt[] = [];
      snapshot.forEach((doc: any) => {
        doubts.push(doc.data() as Doubt);
      });
      return doubts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (err) {
      console.error("[Firestore] Error reading doubts. Falling back to local file.", err);
    }
  }

  // Local File Fallback
  if (!fs.existsSync(DOUBTS_FILE)) {
    fs.writeFileSync(DOUBTS_FILE, JSON.stringify([], null, 2), "utf8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(DOUBTS_FILE, "utf8"));
  } catch (err) {
    console.error("Error reading doubts file:", err);
    return [];
  }
}

async function saveDoubts(doubts: Doubt[]): Promise<void> {
  if (db) {
    try {
      // Chunk batch operations
      const batchSize = 100;
      for (let i = 0; i < doubts.length; i += batchSize) {
        const batch = db.batch();
        const chunk = doubts.slice(i, i + batchSize);
        chunk.forEach((d) => {
          const docRef = db.collection("doubts").doc(d.id);
          batch.set(docRef, d);
        });
        await batch.commit();
      }
      return;
    } catch (err) {
      console.error("[Firestore] Error saving doubts. Saving locally.", err);
    }
  }
  fs.writeFileSync(DOUBTS_FILE, JSON.stringify(doubts, null, 2), "utf8");
}

// Teacher & Subject Authorization Helpers
function getSubjectForPasscode(passcode: any): "Chemistry" | "Physics" | "Mathematics" | null {
  if (!passcode) return null;
  const p = String(passcode).trim().toUpperCase();
  if (p === "CHEM12A" || p === "PRADEEP12" || p === "SAMS12") return "Chemistry";
  if (p === "PHYS12A" || p === "NARENDRA12" || p === "SATISH12") return "Physics";
  if (p === "MATH12A" || p === "TARUN12" || p === "AMIT12") return "Mathematics";
  return null;
}

function getSubjectForTopic(topic: string): "Chemistry" | "Physics" | "Mathematics" | null {
  if (CHEMISTRY_TOPICS.includes(topic as any)) return "Chemistry";
  if (PHYSICS_TOPICS.includes(topic as any)) return "Physics";
  if (MATHS_TOPICS.includes(topic as any)) return "Mathematics";
  return null;
}

// REST APIs

// 1. Authentication
app.post("/api/login", async (req, res) => {
  const { role, rollNo, phone, passcode } = req.body;

  if (role === "teacher") {
    const cleanPass = String(passcode).trim().toUpperCase();
    if (cleanPass === "CHEM12A" || cleanPass === "PRADEEP12" || cleanPass === "SAMS12") {
      return res.json({ success: true, role: "teacher", name: "Mr. Pradeep Gusain", passcode: "CHEM12A" });
    }
    if (cleanPass === "PHYS12A" || cleanPass === "NARENDRA12" || cleanPass === "SATISH12") {
      return res.json({ success: true, role: "teacher", name: "Mr. Narendra Kumar", passcode: "PHYS12A" });
    }
    if (cleanPass === "MATH12A" || cleanPass === "TARUN12" || cleanPass === "AMIT12") {
      return res.json({ success: true, role: "teacher", name: "Mr. Tarun Makkar", passcode: "MATH12A" });
    }
    return res.status(401).json({ error: "Invalid teacher passcode. Hints: CHEM12A (Chemistry), PHYS12A (Physics), MATH12A (Maths)" });
  }

  const numRollNo = parseInt(rollNo, 10);
  if (isNaN(numRollNo)) {
    return res.status(400).json({ error: "Roll number must be a valid number" });
  }

  const students = await getStudents();
  const student = students.find((s) => s.rollNo === numRollNo);

  if (!student) {
    return res.status(404).json({ error: `Student with Roll No. ${numRollNo} not found` });
  }

  const cleanPhoneInput = String(phone).trim();
  const dbPhone = String(student.phone).trim();
  const last4Db = dbPhone.slice(-4);

  if (cleanPhoneInput === dbPhone || cleanPhoneInput === last4Db) {
    return res.json({ success: true, role: "student", student });
  }

  return res.status(401).json({
    error: "Authentication failed. Enter your registered phone number or its last 4 digits.",
  });
});

// 2. Fetch specific student
app.get("/api/student/:roll_no", async (req, res) => {
  const rollNo = parseInt(req.params.roll_no, 10);
  const students = await getStudents();
  const student = students.find((s) => s.rollNo === rollNo);

  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }
  res.json(student);
});

// 3. Fetch all students (Teacher only, checked via header)
app.get("/api/students", async (req, res) => {
  const auth = req.headers["x-teacher-passcode"];
  if (!getSubjectForPasscode(auth)) {
    return res.status(403).json({ error: "Unauthorized access to teacher class details" });
  }
  res.json(await getStudents());
});

// 4. Update student score (Teacher only)
app.post("/api/student/:roll_no/score", async (req, res) => {
  const auth = req.headers["x-teacher-passcode"];
  const teacherSubject = getSubjectForPasscode(auth);
  if (!teacherSubject) {
    return res.status(403).json({ error: "Unauthorized action" });
  }

  const rollNo = parseInt(req.params.roll_no, 10);
  const { topic, score, milestones } = req.body;

  if (!topic || score === undefined || score < 0 || score > 100) {
    return res.status(400).json({ error: "Invalid topic name or score value (must be 0-100)" });
  }

  const topicSubject = getSubjectForTopic(topic);
  if (topicSubject !== teacherSubject) {
    return res.status(403).json({ error: `You are only authorized to update scores for ${teacherSubject}` });
  }

  const students = await getStudents();
  const studentIndex = students.findIndex((s) => s.rollNo === rollNo);

  if (studentIndex === -1) {
    return res.status(404).json({ error: "Student not found" });
  }

  students[studentIndex].scores[topic] = Number(score);
  if (milestones) {
    if (!students[studentIndex].milestones) {
      students[studentIndex].milestones = {};
    }
    students[studentIndex].milestones[topic] = milestones;
  }
  await saveStudents(students);

  res.json({ success: true, student: students[studentIndex] });
});

// 4.5 Save Student Progress & Milestones (Self-Entry API for both Students and Teachers)
app.post("/api/student/:roll_no/save-progress", async (req, res) => {
  const rollNo = parseInt(req.params.roll_no, 10);
  const { topic, score, milestones } = req.body;

  if (!topic || score === undefined || score < 0 || score > 100) {
    return res.status(400).json({ error: "Invalid topic name or score value (must be 0-100)" });
  }

  const students = await getStudents();
  const studentIndex = students.findIndex((s) => s.rollNo === rollNo);

  if (studentIndex === -1) {
    return res.status(404).json({ error: "Student not found" });
  }

  students[studentIndex].scores[topic] = Number(score);
  if (milestones) {
    if (!students[studentIndex].milestones) {
      students[studentIndex].milestones = {};
    }
    students[studentIndex].milestones[topic] = milestones;
  }
  
  await saveStudents(students);
  res.json({ success: true, student: students[studentIndex] });
});

// 5. Submit doubt (Student)
app.post("/api/student/:roll_no/doubt", async (req, res) => {
  const rollNo = parseInt(req.params.roll_no, 10);
  const { topic, question, studentName } = req.body;

  if (!topic || !question) {
    return res.status(400).json({ error: "Topic and question are required" });
  }

  const doubts = await getDoubts();
  const newDoubt: Doubt = {
    id: Math.random().toString(36).substring(2, 9),
    studentRollNo: rollNo,
    studentName: studentName || "Student",
    topic,
    question,
    answer: null,
    createdAt: new Date().toISOString(),
    answeredAt: null,
  };

  doubts.push(newDoubt);
  await saveDoubts(doubts);

  res.json({ success: true, doubt: newDoubt });
});

// 6. Get doubts for a specific student
app.get("/api/student/:roll_no/doubts", async (req, res) => {
  const rollNo = parseInt(req.params.roll_no, 10);
  const doubts = await getDoubts();
  const studentDoubts = doubts.filter((d) => d.studentRollNo === rollNo);
  res.json(studentDoubts);
});

// 7. Get all doubts (Teacher only)
app.get("/api/teacher/doubts", async (req, res) => {
  const auth = req.headers["x-teacher-passcode"];
  const teacherSubject = getSubjectForPasscode(auth);
  if (!teacherSubject) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const allDoubts = await getDoubts();
  const filteredDoubts = allDoubts.filter((d) => getSubjectForTopic(d.topic) === teacherSubject);
  res.json(filteredDoubts);
});

// 8. Answer a doubt (Teacher only)
app.post("/api/teacher/doubt/:id/answer", async (req, res) => {
  const auth = req.headers["x-teacher-passcode"];
  const teacherSubject = getSubjectForPasscode(auth);
  if (!teacherSubject) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const doubtId = req.params.id;
  const { answer } = req.body;

  if (!answer) {
    return res.status(400).json({ error: "Answer content cannot be empty" });
  }

  const doubts = await getDoubts();
  const index = doubts.findIndex((d) => d.id === doubtId);

  if (index === -1) {
    return res.status(404).json({ error: "Doubt thread not found" });
  }

  const topicSubject = getSubjectForTopic(doubts[index].topic);
  if (topicSubject !== teacherSubject) {
    return res.status(403).json({ error: `You are only authorized to answer doubts for ${teacherSubject}` });
  }

  doubts[index].answer = answer;
  doubts[index].answeredAt = new Date().toISOString();
  await saveDoubts(doubts);

  res.json({ success: true, doubt: doubts[index] });
});

// 9. Explain a Concept via Gemini 3.5-flash
app.post("/api/gemini/explain", async (req, res) => {
  const { topic, question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Prompt/Question is required" });
  }

  const systemInstruction = `You are an expert high school tutor helping XII standard students prepare for their board examinations as well as competitive exams like JEE Main and Advanced.

CRITICAL INSTRUCTION - STRICT TOPIC RELEVANCE:
You must strictly validate if the student's question is directly related or relevant to the active context topic: "${topic || "the active study chapter"}".
- If the question is NOT relevant to this topic (e.g., questions about irrelevant subjects, general off-topic chat, politics, coding, gaming, pop culture, or unrelated curriculum chapters), you MUST politely but firmly decline to answer.
- Explain to the student that you are dedicated to helping them excel in "${topic || "the active study chapter"}" and can only answer questions directly relevant to this topic.
- Gently prompt them to ask a relevant doubt or check the resources for this chapter.

MATHEMATICAL AND FORMULA FORMATTING:
- To prevent malformed or distorted expressions, never use raw unicode superscripts/subscripts (e.g. ₀, ₁, ₂, ³, ⁴, x², Δ) or ASCII approximations in math formulas.
- Every single equation, chemical reaction, formula, variable, constant, or numerical value MUST be wrapped in standard LaTeX.
- Use $$[equation]$$ on its own line for centered block equations, derivations, or major formulas.
- Use $[equation]$ for inline equations or isolated mathematical variables, chemical species, and constants (e.g., $E = h\\nu$, $\\Delta T_f$, $\\text{H}_2\\text{O}$, $k = A e^{-E_a / RT}$).
- Ensure all brackets, fractions, integrals, and matrices are syntactically valid LaTeX.
- Keep your explanations concise, encouraging, structured, and visually beautiful.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: topic ? `Context topic: ${topic}\n\nStudent Question: ${question}` : question,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I apologize, I could not formulate an answer. Please try asking again.";
    res.json({ reply });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({
      error: "The AI Tutor is currently busy. Please try again shortly.",
      details: err.message,
    });
  }
});

// Global Process Exception Handlers to prevent backend resets/crashes
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Backend Watchdog] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Backend Watchdog] Uncaught Exception thrown:", error);
});

// 10. Health Check and Connection Diagnostic API
app.get("/api/health", async (req, res) => {
  try {
    const isFirestoreConfigured = fs.existsSync(firebaseConfigPath);
    let firestoreStatus = "local-fallback";
    let isFirestoreHealthy = false;

    if (db) {
      try {
        // Quick active ping test to verify Firestore query health
        await db.collection("students").limit(1).get();
        firestoreStatus = "connected";
        isFirestoreHealthy = true;
      } catch (e: any) {
        console.error("[Health Check] Firestore query test failed:", e.message);
        firestoreStatus = "degraded (falling back to local)";
      }
    } else if (isFirestoreConfigured) {
      firestoreStatus = "failed-init";
    }

    res.json({
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        mode: firestoreStatus,
        isConfigured: isFirestoreConfigured,
        isHealthy: isFirestoreHealthy || !isFirestoreConfigured, // fallback mode counts as healthy if firebase is unconfigured
      },
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Vite / Static files routing

const isProduction = process.env.NODE_ENV === "production" || 
  (typeof __filename !== "undefined" && (__filename.endsWith("server.cjs") || __filename.includes("dist"))) ||
  (process.argv[1] && (process.argv[1].endsWith("server.cjs") || process.argv[1].includes("dist")));

if (!isProduction) {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  })
    .then((vite) => {
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Development server active at http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("[Backend Start] Failed to initialize Vite dev server:", err);
      // Fallback listening so the backend APIs can still be pinged/accessed
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Emergency backend-only server active at http://localhost:${PORT}`);
      });
    });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production server active on port ${PORT}`);
  });
}

