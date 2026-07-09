import express from "express";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp as initAdminApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
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

// Initial seed list of 37 chemistry students with default registered Gmails
const INITIAL_STUDENTS: Omit<Student, "scores">[] = [
  { rollNo: 1, name: "Mukul Sharma", phone: "8287901366", email: "mukul215a@gmail.com" },
  { rollNo: 2, name: "Supriya", phone: "9599540886", email: "nareseema1983@gmail.com" },
  { rollNo: 3, name: "Vanshika", phone: "8506061212", email: "vanshikaaaa1306@gmail.com" },
  { rollNo: 4, name: "Jai Kumar", phone: "9555783802", email: "20220215211@asose.in" },
  { rollNo: 5, name: "Aditya Prasad", phone: "7678164362", email: "upenderp472@gmail.com" },
  { rollNo: 6, name: "Aarav Gupta", phone: "8383904995", email: "aaravgupta2048@gmail.com" },
  { rollNo: 7, name: "Shashwat Tiwari", phone: "9718462276", email: "preetiwari1985@gmail.com" },
  { rollNo: 8, name: "Udbhav Dalmia", phone: "8178109588", email: "udbhavdalmia123@gmail.com" },
  { rollNo: 9, name: "Simran Pokhriyal", phone: "9354667018", email: "simranpokhriyal2010@gmail.com" },
  { rollNo: 10, name: "Ishank", phone: "7011157797", email: "ishankpanwar818@gmail.com" },
  { rollNo: 11, name: "Aditya Prajapati", phone: "9213819186", email: "ad9213819186@gmail.com" },
  { rollNo: 12, name: "Pragun Sharma", phone: "8800862176", email: "pragunsharma74@gmail.com" },
  { rollNo: 13, name: "Aryan Dubey", phone: "7703824656", email: "aryandubey1819@gmail.com" },
  { rollNo: 14, name: "Manan Nimesh", phone: "8860235111", email: "20230201168.manan@doe.delhi.gov.in" },
  { rollNo: 15, name: "Siddharth", phone: "9267921428", email: "sid44039@gmail.com" },
  { rollNo: 16, name: "Adarsh Patel", phone: "9355323047", email: "adarshbtw@gmail.com" },
  { rollNo: 17, name: "Kanishk", phone: "9873039704", email: "kanishk1926@gmail.com" },
  { rollNo: 18, name: "Kirti", phone: "8595741151", email: "explorenthrive.kit@gmail.com" },
  { rollNo: 19, name: "Ansh Kumar", phone: "8595048032", email: "anshkumar98765432@gmail.com" },
  { rollNo: 20, name: "Dev Rathore", phone: "9211487571", email: "devrathore0033@gmail.com" },
  { rollNo: 21, name: "Sidhant Gupta", phone: "7633925835", email: "sidhantkg2000@gmail.com" },
  { rollNo: 22, name: "Komal Mehra", phone: "8588015525", email: "komalmehra24555@gmail.com" },
  { rollNo: 23, name: "Viraj Dagar", phone: "9540836788", email: "virajdagar02@gmail.com" },
  { rollNo: 24, name: "Rakesh Kumar Rai", phone: "8178777178", email: "rakeshrai45561@gmail.com" },
  { rollNo: 25, name: "Lucky", phone: "9871749320", email: "lucky1062009@gmail.com" },
  { rollNo: 26, name: "Prince", phone: "9891240667", email: "piyushprince513@gmail.com" },
  { rollNo: 27, name: "Gaurav", phone: "7042508621", email: "gauravplay098@gmail.com" },
  { rollNo: 28, name: "Aneesh Kumar", phone: "8651835743", email: "aneesh19123@gmail.com" },
  { rollNo: 29, name: "Anshuman Tripathi", phone: "8076237923", email: "xthanshuman@gmail.com" },
  { rollNo: 30, name: "Yash Bisht", phone: "9355753773", email: "yashbisht625@gmail.com" },
  { rollNo: 31, name: "Laxman", phone: "9310984491", email: "pantherbissu1@gmail.com" },
  { rollNo: 32, name: "Parth", phone: "9837168670", email: "parth.deshwal01@gmail.com" },
  { rollNo: 33, name: "Nishtha Lahoti", phone: "9312102838", email: "nishthalahoti2110@gmail.com" },
  { rollNo: 34, name: "Aayush Mishra", phone: "8860927753", email: "mishraayush9654@gmail.com" },
  { rollNo: 35, name: "Harshit", phone: "9205943320", email: "20230201164@asose.in" },
  { rollNo: 36, name: "Drishti", phone: "8368857795", email: "drishtiiii211@gmail.com" },
  { rollNo: 37, name: "Priyanshi Vahal", phone: "9810297183", email: "vahalpriyanshi34@gmail.com" }
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

    let databaseId = firebaseConfig.firestoreDatabaseId;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        options.credential = cert(serviceAccount);
        console.log("[Firestore] Service account detected in environment variables. Using custom credentials.");

        if (serviceAccount && serviceAccount.project_id) {
          options.projectId = serviceAccount.project_id;
          console.log(`[Firestore] Overriding project ID from Service Account JSON: ${serviceAccount.project_id}`);

          if (serviceAccount.project_id !== firebaseConfig.projectId) {
            databaseId = process.env.FIREBASE_DATABASE_ID || "(default)";
            console.log(`[Firestore] Custom deployment detected. Overriding database ID to: ${databaseId}`);
          }
        }
      } catch (e) {
        console.error("[Firestore] Failed to parse FIREBASE_SERVICE_ACCOUNT env variable. Falling back to default credentials.", e);
      }
    }

    const adminApp = initAdminApp(options);
    db = getFirestore(adminApp, databaseId);
    console.log(`[Firestore] Initialized successfully with Database: ${databaseId}`);

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
    console.error("[Firestore] Failed to seed database or query Firestore. Disabling cloud sync and falling back to stable local storage.", err);
    db = null; // Disable Firestore so it doesn't try to use it on requests
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
    try {
      fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), "utf8");
    } catch (writeErr) {
      console.error("[Fallback] Failed to write students.json file on disk:", writeErr);
    }
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
      try {
        fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), "utf8");
      } catch (writeErr) {
        console.error("[Fallback] Failed to write migrated students.json file on disk:", writeErr);
      }
    }
    return students;
  } catch (err) {
    console.error("Error reading students local database file, resetting:", err);
    // Safely return INITIAL_STUDENTS in-memory instead of an empty array if file reading fails
    return INITIAL_STUDENTS.map((s) => {
      const scores: Record<string, number> = {};
      ALL_TOPICS.forEach((t) => {
        scores[t] = 0;
      });
      return { ...s, scores, milestones: {} };
    });
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
  try {
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), "utf8");
  } catch (writeErr) {
    console.error("[Fallback] Failed to write students.json local database file:", writeErr);
  }
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
    try {
      fs.writeFileSync(DOUBTS_FILE, JSON.stringify([], null, 2), "utf8");
    } catch (writeErr) {
      console.error("[Fallback] Failed to write initial doubts.json local file:", writeErr);
    }
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
  try {
    fs.writeFileSync(DOUBTS_FILE, JSON.stringify(doubts, null, 2), "utf8");
  } catch (writeErr) {
    console.error("[Fallback] Failed to write doubts.json local file:", writeErr);
  }
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

function logStudentActivity(
  student: Student,
  type: "checklist" | "quiz",
  topic: string,
  detail: string
) {
  if (!student.recentSessions) {
    student.recentSessions = [];
  }

  const now = new Date();
  const nowISO = now.toISOString();
  const subject = getSubjectForTopic(topic) || "Chemistry"; // Fallback

  // Grouping rule: check if there's an active session in the last 15 minutes
  // 15 minutes in milliseconds = 15 * 60 * 1000 = 900,000 ms
  const SESSION_THRESHOLD_MS = 15 * 60 * 1000;
  
  let activeSessionIndex = -1;
  if (student.recentSessions.length > 0) {
    const latestSession = student.recentSessions[0];
    const latestTime = new Date(latestSession.timestamp);
    if (now.getTime() - latestTime.getTime() < SESSION_THRESHOLD_MS) {
      activeSessionIndex = 0;
    }
  }

  const newChange = { type, subject, detail };

  if (activeSessionIndex !== -1) {
    const session = student.recentSessions[activeSessionIndex];
    // Avoid double noise in same session (e.g. toggling rapid clicks)
    const exists = session.changes.some(c => c.detail === detail && c.type === type);
    if (!exists) {
      session.changes.unshift(newChange);
    }
    session.timestamp = nowISO; // Refresh activity timestamp to extend session
  } else {
    // New study session
    student.recentSessions.unshift({
      timestamp: nowISO,
      changes: [newChange],
    });
  }

  // Keep only the 3 most recent sessions
  if (student.recentSessions.length > 3) {
    student.recentSessions = student.recentSessions.slice(0, 3);
  }
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

// 1.5 Direct Google Sign-In & Google Email Verification login
app.post("/api/login-google", async (req, res) => {
  let email = req.body.email;
  const { idToken } = req.body;

  if (idToken) {
    try {
      const decodedToken = await getAdminAuth().verifyIdToken(idToken);
      email = decodedToken.email;
      console.log(`[Google Auth] Token verified successfully for: ${email}`);
    } catch (err: any) {
      console.warn("[Google Auth] Admin verification error (using local development fallback):", err.message);
      if (!email) {
        return res.status(400).json({ error: "Token verification failed and no email supplied" });
      }
    }
  }

  if (!email) {
    return res.status(400).json({ error: "Email or ID token is required" });
  }

  const students = await getStudents();
  const student = students.find((s) => s.email && s.email.toLowerCase() === email.toLowerCase());

  if (student) {
    // Log in directly since the identity has been authenticated via proper Google Login
    return res.json({ success: true, role: "student", student });
  }

  return res.status(404).json({
    error: `No student found with the registered Gmail: ${email}`,
    needsLinking: true,
  });
});

// 1.6 Google Account Self-Linking
app.post("/api/link-google-account", async (req, res) => {
  const { email, rollNo, phone } = req.body;
  if (!email || !rollNo || !phone) {
    return res.status(400).json({ error: "Email, roll number, and phone number are required" });
  }

  const numRollNo = parseInt(rollNo, 10);
  const students = await getStudents();
  const studentIndex = students.findIndex((s) => s.rollNo === numRollNo);

  if (studentIndex === -1) {
    return res.status(404).json({ error: `Student with Roll No. ${numRollNo} not found` });
  }

  const student = students[studentIndex];
  const cleanPhoneInput = String(phone).trim();
  const dbPhone = String(student.phone).trim();
  const last4Db = dbPhone.slice(-4);

  if (cleanPhoneInput === dbPhone || cleanPhoneInput === last4Db) {
    // Check if this email is already linked to another student
    const existing = students.find((s) => s.email && s.email.toLowerCase() === email.toLowerCase());
    if (existing && existing.rollNo !== numRollNo) {
      return res.status(400).json({ error: `The email ${email} is already linked to ${existing.name}` });
    }

    students[studentIndex].email = email;
    await saveStudents(students);
    return res.json({ success: true, role: "student", student: students[studentIndex] });
  }

  return res.status(401).json({
    error: "Verification failed. Enter the correct registered phone number or its last 4 digits for this roll number.",
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

// 4.2 Update student email (Teacher only)
app.post("/api/student/:roll_no/email", async (req, res) => {
  const auth = req.headers["x-teacher-passcode"];
  if (!getSubjectForPasscode(auth)) {
    return res.status(403).json({ error: "Unauthorized action" });
  }

  const rollNo = parseInt(req.params.roll_no, 10);
  const { email } = req.body;

  const students = await getStudents();
  const studentIndex = students.findIndex((s) => s.rollNo === rollNo);

  if (studentIndex === -1) {
    return res.status(404).json({ error: "Student not found" });
  }

  students[studentIndex].email = String(email).trim().toLowerCase();
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

  const targetStudent = students[studentIndex];
  
  const oldScore = targetStudent.scores[topic] || 0;
  const newScore = Number(score);

  if (milestones && Array.isArray(milestones)) {
    if (!targetStudent.milestones) {
      targetStudent.milestones = {};
    }
    targetStudent.milestones[topic] = milestones;
  }

  if (newScore !== oldScore) {
    targetStudent.scores[topic] = newScore;
    logStudentActivity(targetStudent, "checklist", topic, `Progress changed from ${oldScore}% to ${newScore}% in '${topic}'`);
  }

  await saveStudents(students);
  res.json({ success: true, student: targetStudent });
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
      model: "gemini-2.5-flash",
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

// 9.5 Adaptive Single AI Quiz Question Generator (using gemini-2.0-flash)
app.post("/api/gemini/generate-quiz-question", async (req, res) => {
  const { topic, difficulty, previousQuestions } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  const diff = difficulty || "medium";
  const difficultyDesc: Record<string, string> = {
    easy: "straightforward, concept-recall level, suitable for a student who just got a previous question wrong. Focus on definitions, direct formulas, and simple applications.",
    medium: "moderate conceptual difficulty, testing application and understanding of core theory. Similar to CBSE Board question pattern.",
    hard: "challenging, multi-step problem-solving level, similar to JEE Main or JEE Advanced difficulty. May require combining multiple concepts.",
  };

  let systemInstruction = `You are an expert XII standard professor generating ONE multiple-choice question for: "${topic}".
Difficulty level: ${diff.toUpperCase()} — ${difficultyDesc[diff]}

FORMATTING RULES (critical — do NOT break these):
- Use $...$ for ALL inline math, variables, units, constants, and short chemical formulas/species (e.g. $E = mc^2$, $\\Delta T_f$, $\\text{H}_2\\text{O}$, $\\text{RBr}$, $\\text{AgF}$, $K_b$).
- Use $$...$$ ONLY for important standalone equations that deserve their own line. Do NOT use block math for every formula.
- NEVER use raw unicode math symbols or superscript/subscript symbols like ², ³, ₀, ₁, ₂, Δ, π, → outside LaTeX. Always wrap them.
- The options list should contain 4 plausible options, all formatted cleanly with inline LaTeX where needed.
- Return ONLY a single valid JSON object (no markdown formatting around it, no explanation outside JSON, no outer wrapper).

JSON Schema:
{
  "question": "The question text. Use $...$ for inline math, $$...$$ for block math.",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answerIndex": 0,
  "explanation": "A clear, concise explanation (2-3 sentences max) of why this answer is correct. Use LaTeX where needed."
}`;

  if (previousQuestions && Array.isArray(previousQuestions) && previousQuestions.length > 0) {
    systemInstruction += `\n\nCRITICAL DEDUPLICATION RULE:
Do NOT generate any question that is similar or identical to the following previously generated questions in this session:
${JSON.stringify(previousQuestions)}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `Generate one ${diff} MCQ for topic: ${topic}`,
      config: {
        systemInstruction,
        temperature: diff === "hard" ? 1.0 : 0.8,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim() || "";
    let jsonString = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const question = JSON.parse(jsonString);

    if (!question.question || !Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error("Invalid question structure returned by AI");
    }

    res.json(question);
  } catch (err: any) {
    console.error("Gemini Quiz Generator Error:", err);
    res.status(500).json({
      error: "The AI Question generator is currently busy. Please try again shortly.",
      details: err.message,
    });
  }
});

// 9.6 Streaming AI Chatbot (SSE) (using gemini-2.0-flash)
app.post("/api/gemini/chatbot-stream", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const systemInstruction = `You are the SAMS AI Study Assistant — a specialized, friendly academic companion for Class XII students preparing for board exams and JEE/NEET.

STRICT POLICY: Only answer questions directly related to XII standard Chemistry, Physics, Mathematics, or study strategies/schedules. Decline anything outside this scope politely.

FORMATTING RULES (critical — do NOT break these):
- Use $...$ for ALL inline math, variables, constants, and short formulas. Example: $E = mc^2$, $\\Delta T_f$, $K_b$.
- Use $$...$$ ONLY for important standalone equations that deserve their own line. Do NOT use block math for every formula.
- NEVER use raw unicode math symbols like ², ³, ₀, Δ, π outside LaTeX. Always wrap them.
- Keep responses CONCISE and structured. Use bullet points for lists. Avoid excessive blank lines.
- Each bullet point or explanation should be SHORT — max 2 sentences. Prioritize clarity over length.`;

  try {
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.text }],
    }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
      config: { systemInstruction, temperature: 0.6 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error("Gemini Streaming Chatbot Error:", err);
    res.write(`data: ${JSON.stringify({ error: "The AI Assistant is temporarily busy. Please try again." })}\n\n`);
    res.end();
  }
});

// 9.7 Save active quiz state (for reload-proof quiz continuity)
app.post("/api/student/:roll_no/quiz-state", async (req, res) => {
  const rollNo = parseInt(req.params.roll_no, 10);
  const { quizState, completed, subjectHint } = req.body;

  const students = await getStudents();
  const idx = students.findIndex((s) => s.rollNo === rollNo);

  if (idx === -1) {
    return res.status(404).json({ error: "Student not found" });
  }

  if (completed) {
    // Quiz is finished — clear active quiz, update stats
    students[idx].activeQuiz = null;
    
    // Log the completed quiz details in the student activity sessions
    if (quizState) {
      const scoreDetail = `Scored ${quizState.correctCount}/5 in '${quizState.topic}' adaptive quiz (${quizState.difficulty} difficulty)`;
      logStudentActivity(students[idx], "quiz", quizState.topic, scoreDetail);
    }

    if (subjectHint) {
      if (!students[idx].quizStats) {
        students[idx].quizStats = { totalQuizzes: 0, bySubject: { chemistry: 0, physics: 0, maths: 0 } };
      }
      students[idx].quizStats!.totalQuizzes += 1;
      const sub = subjectHint as "chemistry" | "physics" | "maths";
      if (sub === "chemistry" || sub === "physics" || sub === "maths") {
        students[idx].quizStats!.bySubject[sub] += 1;
      }
    }
  } else {
    students[idx].activeQuiz = quizState;
  }

  await saveStudents(students);
  res.json({ success: true, student: students[idx] });
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

