import express from "express";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp as initAdminApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { Student, Teacher, ALL_TOPICS, CHEMISTRY_TOPICS, PHYSICS_TOPICS, MATHS_TOPICS, BIOLOGY_TOPICS } from "./src/types.ts";

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
const SESSION_COOKIE_NAME = "sams_session";
const sessionStore = new Map<string, { role: "student" | "teacher"; student?: Student; passcode?: string; name?: string }>();

app.use(express.json({ limit: "10mb" }));

function parseCookies(cookieHeader = "") {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (!name) return;
    cookies[name] = decodeURIComponent(rest.join("="));
  });
  return cookies;
}

function getSessionFromRequest(req: express.Request) {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[SESSION_COOKIE_NAME];
  return token ? sessionStore.get(token) || null : null;
}

function writeSessionCookie(res: express.Response, token: string) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
}

function clearSessionCookie(res: express.Response) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

const DATA_DIR = path.join(process.cwd(), "data");
const STUDENTS_DIR = path.join(DATA_DIR, "students");
const TEACHERS_DIR = path.join(DATA_DIR, "teachers");

// Ensure directories exist
[DATA_DIR, STUDENTS_DIR, TEACHERS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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

const XIIB_STUDENTS_DATA = [
  { rollNo: 1, name: "Om Kumar", phone: "9891675231", email: "om3004229@gmail.com" },
  { rollNo: 2, name: "Nancy", phone: "7678139241", email: "poojacaptaan@gmail.com" },
  { rollNo: 3, name: "Nikul Parveen", phone: "9582293142", email: "nikulparveen13@gmail.com" },
  { rollNo: 4, name: "Riya", phone: "8076784963", email: "dk6570338@gmail.com" },
  { rollNo: 5, name: "Muskan", phone: "7678668033", email: "ayeshaang021@gmail.com" },
  { rollNo: 6, name: "Dhruv Thakur", phone: "8447393993", email: "tdhruv905@gmail.com" },
  { rollNo: 7, name: "Aarya Tiwari", phone: "8010707571", email: "tsicity@gmail.com" },
  { rollNo: 8, name: "Sushant Kumar", phone: "8595740842", email: "sushantkumarroy1909@gmail.com" },
  { rollNo: 9, name: "Khyati", phone: "9810626252", email: "k9895464@gmail.com" },
  { rollNo: 10, name: "Ritika Singh", phone: "8860445115", email: "ritikasin2008@gmail.com" },
  { rollNo: 11, name: "Aastha", phone: "8766284954", email: "shakyaaastha66@gmail.com" },
  { rollNo: 12, name: "Arpit", phone: "9560475013", email: "x1987mukesh@gmail.com" },
  { rollNo: 13, name: "Poorvanshi Singh", phone: "9911562542", email: "ak1148843@gmail.com" },
  { rollNo: 14, name: "Mohd. Uvesh", phone: "7827070130", email: "uveshmohd609@gmail.com" },
  { rollNo: 15, name: "Caleb Abrol", phone: "9871818919", email: "calebmasin45@gmail.com" },
  { rollNo: 16, name: "Mayank Pal", phone: "9811508668", email: "mayankp8433@gmail.com" },
  { rollNo: 17, name: "Naitik Khurana", phone: "9818954695", email: "naitikkhurana10@gmail.com" },
  { rollNo: 18, name: "Kushal Kumar", phone: "9871594160", email: "20230201272.kushal@doe.delhi.gov.in" }
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
    const hasServiceAccount = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
    const hasGoogleCreds = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    if (hasServiceAccount) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
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

    if (hasServiceAccount || hasGoogleCreds) {
      const adminApp = initAdminApp(options);
      db = getFirestore(adminApp, databaseId);
      console.log(`[Firestore] Initialized successfully with Database: ${databaseId}`);

      ensureFirestoreSeeded()
        .catch((err) => {
          console.error("[Firestore] Seeding error:", err);
        });
    } else {
      console.log("[Firestore] No Firebase service account or application credentials detected. Operating in local-only fallback mode.");
    }
  } catch (err) {
    console.error("[Firestore] Initialization failed. Falling back to local storage.", err);
  }
} else {
  console.log("[Firestore] firebase-applet-config.json missing. Operating in local-only fallback mode.");
}

async function ensureFirestoreSeeded() {
  // Check local directory for xii-a
  const xiiADir = path.join(STUDENTS_DIR, "xii-a");
  if (!fs.existsSync(xiiADir)) {
    fs.mkdirSync(xiiADir, { recursive: true });
  }

  // Create local JSON files for xii-a if they don't exist
  INITIAL_STUDENTS.forEach((s) => {
    const filePath = path.join(xiiADir, `${s.rollNo}.json`);
    if (!fs.existsSync(filePath)) {
      const scores: Record<string, number> = {};
      CHEMISTRY_TOPICS.forEach(t => scores[t] = 0);
      PHYSICS_TOPICS.forEach(t => scores[t] = 0);
      MATHS_TOPICS.forEach(t => scores[t] = 0);

      const studentData: Student = {
        ...s,
        classId: "xii-a",
        scores,
        milestones: {},
        quizStats: {
          totalQuizzes: 0,
          bySubject: { chemistry: 0, physics: 0, maths: 0 }
        }
      };
      fs.writeFileSync(filePath, JSON.stringify(studentData, null, 2), "utf8");
    }
  });

  // First, check local directory for xii-b
  const xiiBDir = path.join(STUDENTS_DIR, "xii-b");
  if (!fs.existsSync(xiiBDir)) {
    fs.mkdirSync(xiiBDir, { recursive: true });
  }

  // Create local JSON files for xii-b if they don't exist
  XIIB_STUDENTS_DATA.forEach((s) => {
    const filePath = path.join(xiiBDir, `${s.rollNo}.json`);
    if (!fs.existsSync(filePath)) {
      const isPCMB = [7, 14, 17].includes(s.rollNo);
      const scores: Record<string, number> = {};

      // Initialize scores based on subject profile
      CHEMISTRY_TOPICS.forEach(t => scores[t] = 0);
      PHYSICS_TOPICS.forEach(t => scores[t] = 0);
      BIOLOGY_TOPICS.forEach(t => scores[t] = 0);
      if (isPCMB) {
        MATHS_TOPICS.forEach(t => scores[t] = 0);
      }

      const studentData: Student = {
        ...s,
        classId: "xii-b",
        scores,
        milestones: {},
        quizStats: {
          totalQuizzes: 0,
          bySubject: { chemistry: 0, physics: 0, maths: 0, biology: 0 }
        }
      };
      fs.writeFileSync(filePath, JSON.stringify(studentData, null, 2), "utf8");
    }
  });

  // Seed/update local teacher files
  const teachersList = ["T1", "T2", "T3", "T4"];
  teachersList.forEach((tId) => {
    const tPath = path.join(TEACHERS_DIR, `${tId}.json`);
    let teacherData: Teacher;

    if (fs.existsSync(tPath)) {
      teacherData = JSON.parse(fs.readFileSync(tPath, "utf8")) as Teacher;
      if (!teacherData.classes) {
        teacherData.classes = tId === "T4" ? ["xii-b"] : ["xii-a", "xii-b"];
      }
      if (tId === "T4") {
        if (!teacherData.passcodes.includes("BIO12B")) {
          teacherData.passcodes.push("BIO12B");
        }
        teacherData.passcodes = Array.from(new Set(teacherData.passcodes.map(p => p.trim().toUpperCase())));
        teacherData.classes = ["xii-b"];
      } else {
        teacherData.classes = ["xii-a", "xii-b"];
      }
      fs.writeFileSync(tPath, JSON.stringify(teacherData, null, 2), "utf8");
    } else {
      if (tId === "T1") {
        teacherData = { id: "T1", name: "Dr. Pradeep Gusain", subject: "Chemistry", passcodes: ["CHEM12A", "PRADEEP12", "SAMS12"], email: "", classes: ["xii-a", "xii-b"] };
      } else if (tId === "T2") {
        teacherData = { id: "T2", name: "Mr. Narendra Kumar", subject: "Physics", passcodes: ["PHYS12A", "NARENDRA12", "SATISH12"], email: "", classes: ["xii-a", "xii-b"] };
      } else if (tId === "T3") {
        teacherData = { id: "T3", name: "Mr. Tarun Makkar", subject: "Mathematics", passcodes: ["MATH12A", "TARUN12", "AMIT12"], email: "", classes: ["xii-a", "xii-b"] };
      } else {
        teacherData = { id: "T4", name: "Ms. Manishi Chawla", subject: "Biology", passcodes: ["BIO12B", "MANISHI12"], email: "", classes: ["xii-b"] };
      }
      fs.writeFileSync(tPath, JSON.stringify(teacherData, null, 2), "utf8");
    }
  });

  if (!db) return;
  try {
    // 1. Seed xii-a in Firestore if missing
    const xiiARef = db.collection("xii-a");
    const snapshotA = await xiiARef.limit(1).get();
    if (snapshotA.empty) {
      console.log("[Firestore] xii-a is empty. Seeding from local files...");
      const files = fs.readdirSync(xiiADir);
      const batch = db.batch();
      files.forEach((file) => {
        if (file.endsWith(".json")) {
          const s = JSON.parse(fs.readFileSync(path.join(xiiADir, file), "utf8")) as Student;
          batch.set(xiiARef.doc(String(s.rollNo)), s);
        }
      });
      await batch.commit();
      console.log("[Firestore] Seeding xii-a complete.");
    } else {
      console.log("[Firestore] Verification: xii-a is already seeded.");
    }

    // 2. Seed xii-b in Firestore if missing
    const xiiBRef = db.collection("xii-b");
    const snapshotB = await xiiBRef.limit(1).get();
    if (snapshotB.empty) {
      console.log("[Firestore] xii-b is empty. Seeding from local files...");
      const files = fs.readdirSync(xiiBDir);
      const batch = db.batch();
      files.forEach((file) => {
        if (file.endsWith(".json")) {
          const s = JSON.parse(fs.readFileSync(path.join(xiiBDir, file), "utf8")) as Student;
          batch.set(xiiBRef.doc(String(s.rollNo)), s);
        }
      });
      await batch.commit();
      console.log("[Firestore] Seeding xii-b complete.");
    } else {
      console.log("[Firestore] Verification: xii-b is already seeded.");
    }

    // 3. Seed teacher T4 in Firestore if missing
    // 3. Seed teachers in Firestore if missing
    const teachersList = ["T1", "T2", "T3", "T4"];
    for (const tId of teachersList) {
      const tDoc = await db.collection("teachers").doc(tId).get();
      if (!tDoc.exists) {
        const tPath = path.join(TEACHERS_DIR, `${tId}.json`);
        if (fs.existsSync(tPath)) {
          console.log(`[Firestore] Teacher ${tId} missing in Firestore. Seeding from local JSON file...`);
          const tLocal = JSON.parse(fs.readFileSync(tPath, "utf8")) as Teacher;
          await db.collection("teachers").doc(tId).set(tLocal);
          console.log(`[Firestore] Teacher ${tId} seeding complete.`);
        }
      }
    }
  } catch (err) {
    console.error("[Firestore] Failed to seed database or query Firestore. Disabling cloud sync and falling back to stable local storage.", err);
    db = null; // Disable Firestore so it doesn't try to use it on requests
  }
}



// Caching mechanism for getStudents to prevent excessive reads
let studentsCache: Student[] | null = null;
let studentsCacheTime = 0;
let teacherProfileCache: Map<string, { value: any; cachedAt: number }> = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds
const pendingStudentWrites = new Map<string, ReturnType<typeof setTimeout>>();
const pendingStudentPatches = new Map<string, Record<string, any>>();

function mergeData<T>(base: T, patch: Partial<T>): T {
  if (!patch || typeof patch !== "object") return base;
  if (!base || typeof base !== "object") return patch as T;

  const merged = Array.isArray(base) ? [...base] : { ...(base as Record<string, unknown>) };
  const mergedRecord = merged as Record<string, unknown>;

  Object.entries(patch as Record<string, unknown>).forEach(([key, value]) => {
    const currentValue = mergedRecord[key];

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      currentValue &&
      typeof currentValue === "object" &&
      !Array.isArray(currentValue)
    ) {
      mergedRecord[key] = mergeData(currentValue, value as Record<string, unknown>);
    } else {
      mergedRecord[key] = value;
    }
  });

  return merged as T;
}

async function saveStudentPartial(student: Student, patch: Record<string, any>): Promise<void> {
  studentsCache = null;
  const classId = student.classId || "xii-a";
  const existingStudent = await getStudentByRollNo(student.rollNo, classId);
  const mergedStudent = mergeData(existingStudent || student, patch);

  if (db) {
    try {
      await db.collection(classId).doc(String(student.rollNo)).set(mergedStudent, { merge: true });
      return;
    } catch (err) {
      console.error(`[Firestore] Error partial-saving student ${student.rollNo}:`, err);
    }
  }

  try {
    const classDir = path.join(STUDENTS_DIR, classId);
    if (!fs.existsSync(classDir)) fs.mkdirSync(classDir, { recursive: true });
    fs.writeFileSync(path.join(classDir, `${student.rollNo}.json`), JSON.stringify(mergedStudent, null, 2), "utf8");
  } catch (writeErr) {
    console.error(`[Fallback] Failed to partial-save student ${student.rollNo} locally:`, writeErr);
  }
}

async function queueStudentPatch(student: Student, patch: Record<string, any>, delay = 250): Promise<void> {
  const key = `${student.classId || "xii-a"}:${student.rollNo}`;
  
  // Accumulate patches for this student
  const existingPatch = pendingStudentPatches.get(key) || {};
  pendingStudentPatches.set(key, mergeData(existingPatch, patch));

  const existingTimer = pendingStudentWrites.get(key);
  if (existingTimer) clearTimeout(existingTimer);

  return await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(async () => {
      try {
        const accumulatedPatch = pendingStudentPatches.get(key) || {};
        pendingStudentPatches.delete(key);
        await saveStudentPartial(student, accumulatedPatch);
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        pendingStudentWrites.delete(key);
      }
    }, delay);

    pendingStudentWrites.set(key, timer);
  });
}

// Asynchronous Data Managers (with robust fallbacks)
async function getStudents(): Promise<Student[]> {
  if (studentsCache && Date.now() - studentsCacheTime < CACHE_TTL) {
    return studentsCache;
  }

  let students: Student[] = [];

  if (db) {
    try {
      // Query root class collections
      const [snapshotA, snapshotB] = await Promise.all([
        db.collection("xii-a").get(),
        db.collection("xii-b").get()
      ]);
      snapshotA.forEach((doc: any) => {
        students.push(doc.data() as Student);
      });
      snapshotB.forEach((doc: any) => {
        students.push(doc.data() as Student);
      });

      if (students.length > 0) {
        students.forEach((s) => {
          sanitizeStudentProfile(s);
        });

        students.sort((a, b) => a.rollNo - b.rollNo);
        studentsCache = students;
        studentsCacheTime = Date.now();
        return students;
      }
    } catch (err) {
      console.error("[Firestore] Error reading students via collectionGroup. Falling back to local directory.", err);
    }
  }

  // Local Directory Fallback
  try {
    const classes = ["xii-a", "xii-b"];
    for (const cls of classes) {
      const classDir = path.join(STUDENTS_DIR, cls);
      if (fs.existsSync(classDir)) {
        const files = fs.readdirSync(classDir);
        for (const file of files) {
          if (file.endsWith(".json")) {
            const s = JSON.parse(fs.readFileSync(path.join(classDir, file), "utf8"));
            sanitizeStudentProfile(s);
            students.push(s);
          }
        }
      }
    }
    students.sort((a, b) => a.rollNo - b.rollNo);
    studentsCache = students;
    studentsCacheTime = Date.now();
    return students;
  } catch (err) {
    console.error("Error reading students local directory:", err);
  }
  return [];
}

async function saveStudents(students: Student[]): Promise<void> {
  // Clear cache
  studentsCache = null;

  if (db) {
    try {
      const batchSize = 100;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = db.batch();
        const chunk = students.slice(i, i + batchSize);
        chunk.forEach((s) => {
          const docRef = db.collection(s.classId || "xii-a").doc(String(s.rollNo));
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
    students.forEach((s) => {
      const classDir = path.join(STUDENTS_DIR, s.classId || "xii-a");
      if (!fs.existsSync(classDir)) fs.mkdirSync(classDir, { recursive: true });
      fs.writeFileSync(path.join(classDir, `${s.rollNo}.json`), JSON.stringify(s, null, 2), "utf8");
    });
  } catch (writeErr) {
    console.error("[Fallback] Failed to save students locally:", writeErr);
  }
}

async function getStudentByRollNo(rollNo: number, classId: string = "xii-a"): Promise<Student | null> {
  if (db) {
    try {
      const doc = await db.collection(classId).doc(String(rollNo)).get();
      if (doc.exists) {
        const s = doc.data() as Student;
        return sanitizeStudentProfile(s);
      }
      return null;
    } catch (err) {
      console.error(`[Firestore] Error reading student ${rollNo} in class ${classId}:`, err);
    }
  }
  // Fallback to local fallback json
  const classDir = path.join(STUDENTS_DIR, classId);
  const filePath = path.join(classDir, `${rollNo}.json`);
  if (fs.existsSync(filePath)) {
    const s = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return sanitizeStudentProfile(s);
  }
  return null;
}

function getTopicsForStudent(rollNo: number, classId: string): string[] {
  if (classId === "xii-a") {
    return [...CHEMISTRY_TOPICS, ...PHYSICS_TOPICS, ...MATHS_TOPICS];
  } else if (classId === "xii-b") {
    const isPCMB = [7, 14, 17].includes(rollNo);
    if (isPCMB) {
      return [...CHEMISTRY_TOPICS, ...PHYSICS_TOPICS, ...BIOLOGY_TOPICS, ...MATHS_TOPICS];
    } else {
      return [...CHEMISTRY_TOPICS, ...PHYSICS_TOPICS, ...BIOLOGY_TOPICS];
    }
  }
  return [];
}

function sanitizeStudentProfile(student: Student): Student {
  if (!student) return student;
  const classId = student.classId || "xii-a";
  const allowedTopics = getTopicsForStudent(student.rollNo, classId);
  const allowedSet = new Set(allowedTopics);

  if (!student.scores) student.scores = {};
  if (!student.milestones) student.milestones = {};
  if (!student.preferences) {
    student.preferences = {
      theme: "system",
      notificationsEnabled: true,
      reminderWindowMinutes: 30,
      targetScore: 75,
    };
  }
  if (!student.studyPlan) {
    student.studyPlan = {
      dailyGoalMinutes: 45,
      weeklyTargets: {
        Chemistry: 2,
        Physics: 2,
        Mathematics: 2,
        Biology: 2,
      },
      focusSubjects: ["Chemistry", "Physics", "Mathematics"],
    };
  }
  if (!student.notifications) {
    student.notifications = [];
  }
  if (!student.goals) {
    student.goals = ["Improve conceptual clarity", "Complete one chapter per week"];
  }
  if (!student.profileStatus) {
    student.profileStatus = "active";
  }
  if (!student.streakDays) {
    student.streakDays = 0;
  }
  if (!student.lastActiveAt) {
    student.lastActiveAt = new Date().toISOString();
  }

  Object.keys(student.scores).forEach((topic) => {
    if (!allowedSet.has(topic)) {
      delete student.scores[topic];
    }
  });

  Object.keys(student.milestones).forEach((topic) => {
    if (!allowedSet.has(topic)) {
      delete student.milestones[topic];
    }
  });

  allowedTopics.forEach((t) => {
    if (student.scores[t] === undefined) {
      student.scores[t] = 0;
    }
  });

  return student;
}

async function getStudentByEmail(email: string): Promise<Student | null> {
  if (db) {
    try {
      // Query both root class collections
      const [snapshotA, snapshotB] = await Promise.all([
        db.collection("xii-a").where("email", "==", email.trim().toLowerCase()).limit(1).get(),
        db.collection("xii-b").where("email", "==", email.trim().toLowerCase()).limit(1).get()
      ]);
      let doc = !snapshotA.empty ? snapshotA.docs[0] : (!snapshotB.empty ? snapshotB.docs[0] : null);
      if (doc) {
        const s = doc.data() as Student;
        return sanitizeStudentProfile(s);
      }
      return null;
    } catch (err) {
      console.error(`[Firestore] Error reading student by email ${email}:`, err);
    }
  }
  const students = await getStudents();
  const matched = students.find((s) => s.email && s.email.toLowerCase() === email.trim().toLowerCase()) || null;
  return matched ? sanitizeStudentProfile(matched) : null;
}

async function saveStudent(student: Student): Promise<void> {
  studentsCache = null; // Invalidate cache
  if (db) {
    try {
      await db.collection(student.classId || "xii-a").doc(String(student.rollNo)).set(student);
      return;
    } catch (err) {
      console.error(`[Firestore] Error saving student ${student.rollNo}:`, err);
    }
  }
  try {
    const classDir = path.join(STUDENTS_DIR, student.classId || "xii-a");
    if (!fs.existsSync(classDir)) fs.mkdirSync(classDir, { recursive: true });
    fs.writeFileSync(path.join(classDir, `${student.rollNo}.json`), JSON.stringify(student, null, 2), "utf8");
  } catch (writeErr) {
    console.error(`[Fallback] Failed to save student ${student.rollNo} locally:`, writeErr);
  }
}

let teachersCache: Teacher[] | null = null;
let teachersCacheTime = 0;

async function getTeachers(): Promise<Teacher[]> {
  if (teachersCache && Date.now() - teachersCacheTime < CACHE_TTL) {
    return teachersCache;
  }
  const teachers: Teacher[] = [];

  if (db) {
    try {
      const snapshot = await db.collection("teachers").get();
      snapshot.forEach((doc: any) => teachers.push(doc.data() as Teacher));
      if (teachers.length > 0) {
        teachersCache = teachers;
        teachersCacheTime = Date.now();
        return teachers;
      }
    } catch (err) {
      console.error("[Firestore] Error reading teachers:", err);
    }
  }

  try {
    if (fs.existsSync(TEACHERS_DIR)) {
      const files = fs.readdirSync(TEACHERS_DIR);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const t = JSON.parse(fs.readFileSync(path.join(TEACHERS_DIR, file), "utf8"));
          teachers.push(t);
        }
      }
    }
    teachersCache = teachers;
    teachersCacheTime = Date.now();
    return teachers;
  } catch (err) {
    console.error("Error reading teachers directory:", err);
  }
  return [];
}

async function getTeacherByEmail(email: string): Promise<Teacher | null> {
  const teachers = await getTeachers();
  return teachers.find((t) => t.email && t.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

async function getTeacherByPasscode(passcode: string): Promise<Teacher | null> {
  const teachers = await getTeachers();
  const cleanPass = passcode.trim().toUpperCase();
  return teachers.find((t) => t.passcodes.includes(cleanPass)) || null;
}

async function getTeacherProfile(passcode: string): Promise<any> {
  const cacheKey = String(passcode).trim().toUpperCase();
  const cached = teacherProfileCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return cached.value;
  }

  const teacher = await getTeacherByPasscode(cacheKey);
  const profile = teacher
    ? {
      name: teacher.id === "T1" ? "Dr. Pradeep Gusain" : teacher.name,
      subject: teacher.subject,
      email: teacher.email,
      classes: teacher.classes,
    }
    : null;

  teacherProfileCache.set(cacheKey, { value: profile, cachedAt: Date.now() });
  return profile;
}

async function saveTeacher(teacher: Teacher): Promise<void> {
  teachersCache = null;
  teacherProfileCache.clear();
  if (db) {
    try {
      await db.collection("teachers").doc(teacher.id).set(teacher);
    } catch (err) {
      console.error(`[Firestore] Error saving teacher ${teacher.id}:`, err);
    }
  }
  try {
    if (!fs.existsSync(TEACHERS_DIR)) fs.mkdirSync(TEACHERS_DIR, { recursive: true });
    fs.writeFileSync(path.join(TEACHERS_DIR, `${teacher.id}.json`), JSON.stringify(teacher, null, 2), "utf8");
  } catch (writeErr) {
    console.error(`[Fallback] Failed to save teacher ${teacher.id} locally:`, writeErr);
  }
}
// Teacher & Subject Authorization Helpers
async function getSubjectForPasscode(passcode: any): Promise<"Chemistry" | "Physics" | "Mathematics" | "Biology" | null> {
  if (!passcode) return null;
  const teacher = await getTeacherByPasscode(String(passcode));
  return teacher ? teacher.subject as any : null;
}

function getSubjectForTopic(topic: string): "Chemistry" | "Physics" | "Mathematics" | "Biology" | null {
  if (CHEMISTRY_TOPICS.includes(topic as any)) return "Chemistry";
  if (PHYSICS_TOPICS.includes(topic as any)) return "Physics";
  if (MATHS_TOPICS.includes(topic as any)) return "Mathematics";
  if (BIOLOGY_TOPICS.includes(topic as any)) return "Biology";
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
app.get("/api/session", (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: "No active session" });
  }
  return res.json({ session });
});

app.post("/api/logout", (req, res) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[SESSION_COOKIE_NAME];
  if (token) {
    sessionStore.delete(token);
  }
  clearSessionCookie(res);
  return res.json({ success: true });
});

app.post("/api/login", async (req, res) => {
  const { role, rollNo, phone, passcode, classId } = req.body;

  if (role === "teacher") {
    const cleanPass = String(passcode).trim().toUpperCase();
    const teacher = await getTeacherByPasscode(cleanPass);
    if (teacher) {
      const token = randomUUID();
      sessionStore.set(token, { role: "teacher", name: teacher.name, passcode: teacher.passcodes[0] });
      writeSessionCookie(res, token);
      return res.json({ success: true, role: "teacher", name: teacher.name, passcode: teacher.passcodes[0] });
    }
    return res.status(401).json({ error: "Invalid teacher passcode. Hints: CHEM12A (Chemistry), PHYS12A (Physics), MATH12A (Maths), BIO12B (Biology)" });
  }

  const numRollNo = parseInt(rollNo, 10);
  if (isNaN(numRollNo)) {
    return res.status(400).json({ error: "Roll number must be a valid number" });
  }

  const student = await getStudentByRollNo(numRollNo, classId || "xii-a");

  if (!student) {
    return res.status(404).json({ error: `Student with Roll No. ${numRollNo} not found` });
  }

  const cleanPhoneInput = String(phone).trim();
  const dbPhone = String(student.phone).trim();
  const last4Db = dbPhone.slice(-4);

  if (cleanPhoneInput === dbPhone || cleanPhoneInput === last4Db) {
    const token = randomUUID();
    sessionStore.set(token, { role: "student", student });
    writeSessionCookie(res, token);
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

  const teacher = await getTeacherByEmail(email);
  if (teacher) {
    const token = randomUUID();
    sessionStore.set(token, { role: "teacher", name: teacher.name, passcode: teacher.passcodes[0] });
    writeSessionCookie(res, token);
    return res.json({ success: true, role: "teacher", name: teacher.name, passcode: teacher.passcodes[0] });
  }

  const student = await getStudentByEmail(email);

  if (student) {
    const token = randomUUID();
    sessionStore.set(token, { role: "student", student });
    writeSessionCookie(res, token);
    return res.json({ success: true, role: "student", student });
  }

  return res.status(404).json({
    error: `No user found with the registered Gmail: ${email}`,
    needsLinking: false,
  });
});

// 1.6 Google Account Self-Linking (Disabled)
app.post("/api/link-google-account", async (req, res) => {
  return res.status(403).json({
    error: "Google account self-linking is disabled. Please contact your teacher/administrator to register your email.",
  });
});

// 2. Fetch specific student
app.get("/api/student/:roll_no", async (req, res) => {
  const rollNo = parseInt(req.params.roll_no, 10);
  const classId = req.query.classId as string || "xii-a";
  const student = await getStudentByRollNo(rollNo, classId);

  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }
  res.json(student);
});

// 2.8 Get Teacher profile details dynamically
app.get("/api/teacher/profile", async (req, res) => {
  const auth = req.headers["x-teacher-passcode"];
  if (!auth) return res.status(401).json({ error: "Missing passcode" });
  const profile = await getTeacherProfile(String(auth));
  if (!profile) return res.status(404).json({ error: "Teacher not found" });
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.json(profile);
});

// 3. Fetch all students (Teacher only, checked via header)
app.get("/api/students", async (req, res) => {
  const auth = req.headers["x-teacher-passcode"];
  if (!(await getSubjectForPasscode(auth))) {
    return res.status(403).json({ error: "Unauthorized access to teacher class details" });
  }
  res.json(await getStudents());
});

// 4. Update student score (Teacher only)
app.post("/api/student/:roll_no/score", async (req, res) => {
  const auth = req.headers["x-teacher-passcode"];
  const teacherSubject = await getSubjectForPasscode(auth);
  if (!teacherSubject) {
    return res.status(403).json({ error: "Unauthorized action" });
  }

  const rollNo = parseInt(req.params.roll_no, 10);
  const { topic, score, milestones, classId } = req.body;

  if (!topic || score === undefined || score < 0 || score > 100) {
    return res.status(400).json({ error: "Invalid topic name or score value (must be 0-100)" });
  }

  const topicSubject = getSubjectForTopic(topic);
  if (topicSubject !== teacherSubject) {
    return res.status(403).json({ error: `You are only authorized to update scores for ${teacherSubject}` });
  }

  const student = await getStudentByRollNo(rollNo, classId || "xii-a");

  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  student.scores[topic] = Number(score);
  const patch: Record<string, any> = {
    scores: { [topic]: Number(score) },
  };

  if (milestones) {
    if (!student.milestones) {
      student.milestones = {};
    }
    student.milestones[topic] = milestones;
    patch.milestones = { [topic]: milestones };
  }

  await queueStudentPatch(student, patch, 180);

  res.json({ success: true, student });
});

// 4.2 Update student email (Teacher only)
app.post("/api/student/:roll_no/email", async (req, res) => {
  const auth = req.headers["x-teacher-passcode"];
  if (!(await getSubjectForPasscode(auth))) {
    return res.status(403).json({ error: "Unauthorized action" });
  }

  const rollNo = parseInt(req.params.roll_no, 10);
  const { email, classId } = req.body;

  const student = await getStudentByRollNo(rollNo, classId || "xii-a");

  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  student.email = String(email).trim().toLowerCase();
  await queueStudentPatch(student, { email: student.email }, 180);

  res.json({ success: true, student });
});

// 4.5 Save Student Progress & Milestones (Self-Entry API for both Students and Teachers)
app.post("/api/student/:roll_no/save-progress", async (req, res) => {
  const rollNo = parseInt(req.params.roll_no, 10);
  const { topic, score, milestones } = req.body;
  const classId = req.query.classId as string || req.body.classId as string || "xii-a";

  if (!topic || score === undefined || score < 0 || score > 100) {
    return res.status(400).json({ error: "Invalid topic name or score value (must be 0-100)" });
  }

  const student = await getStudentByRollNo(rollNo, classId);

  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  const oldScore = student.scores[topic] || 0;
  const newScore = Number(score);

  if (milestones && Array.isArray(milestones)) {
    if (!student.milestones) {
      student.milestones = {};
    }
    student.milestones[topic] = milestones;
  }

  const patch: Record<string, any> = {};

  if (newScore !== oldScore) {
    student.scores[topic] = newScore;
    patch.scores = { [topic]: newScore };
    logStudentActivity(student, "checklist", topic, `Progress changed from ${oldScore}% to ${newScore}% in '${topic}'`);
  }

  if (milestones && Array.isArray(milestones)) {
    patch.milestones = { [topic]: milestones };
  }

  if (student.recentSessions) {
    patch.recentSessions = student.recentSessions;
  }

  await queueStudentPatch(student, patch, 220);
  res.json({ success: true, student });
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
- Gently prompt them to ask a relevant question or check the resources for this chapter.

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
- Provide EXACTLY 4 plausible options. The correct answer MUST be undeniably correct and scientifically unambiguous.
- Do NOT use tricky wording like "None of the above" or "All of the above". Make every distractor option a specific, distinct concept or value.
- Do NOT generate questions with imperfect matches or debatable answers. 
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

  const MAX_ATTEMPTS = 3;
  let lastErr: any = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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
      if (!text) throw new Error("Empty response from AI model");

      let jsonString = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const question = JSON.parse(jsonString);

      if (!question.question || !Array.isArray(question.options) || question.options.length !== 4) {
        throw new Error("Invalid question structure returned by AI");
      }

      return res.json(question);
    } catch (err: any) {
      lastErr = err;
      const isRateLimit = err?.status === 429 || /quota|rate.?limit/i.test(err?.message || "");
      console.warn(`[Quiz Gen] Attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err?.message || err);

      if (isRateLimit) break; // no point retrying rate limits immediately

      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 600 * attempt)); // 600ms, 1200ms
      }
    }
  }

  const isRateLimit = lastErr?.status === 429 || /quota|rate.?limit/i.test(lastErr?.message || "");
  console.error("Gemini Quiz Generator: all attempts failed:", lastErr);
  res.status(500).json({
    error: isRateLimit
      ? "AI quota exceeded. Please wait a moment and try again."
      : "Failed to generate a question. Please tap \"Try Again\" — it usually works on the next attempt.",
    details: lastErr?.message,
  });
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
  const classId = req.query.classId as string || req.body.classId as string || "xii-a";

  const student = await getStudentByRollNo(rollNo, classId);

  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  if (completed) {
    // Quiz is finished — clear active quiz, update stats
    student.activeQuiz = null;

    // Log the completed quiz details in the student activity sessions
    if (quizState) {
      const scoreDetail = `Scored ${quizState.correctCount}/5 in '${quizState.topic}' adaptive quiz (${quizState.difficulty} difficulty)`;
      logStudentActivity(student, "quiz", quizState.topic, scoreDetail);
    }

    if (subjectHint) {
      if (!student.quizStats) {
        student.quizStats = { totalQuizzes: 0, bySubject: { chemistry: 0, physics: 0, maths: 0, biology: 0 } };
      }
      student.quizStats!.totalQuizzes += 1;
      const sub = subjectHint as "chemistry" | "physics" | "maths" | "biology";
      if (sub === "chemistry" || sub === "physics" || sub === "maths" || sub === "biology") {
        if (student.quizStats!.bySubject[sub] === undefined) {
          student.quizStats!.bySubject[sub] = 0;
        }
        student.quizStats!.bySubject[sub]! += 1;
      }
    }
  } else {
    student.activeQuiz = quizState;
  }

  await saveStudent(student);
  res.json({ success: true, student });
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
        await db.collection("xii-a").limit(1).get();
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

function startServer(port: number) {
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Server active at http://localhost:${port}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      const fallbackPort = port + 1;
      console.warn(`[Server] Port ${port} is busy. Retrying on ${fallbackPort}...`);
      startServer(fallbackPort);
      return;
    }

    console.error("[Backend Start] Failed to start server:", err);
    process.exit(1);
  });
}

if (!isProduction) {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  })
    .then((vite) => {
      app.use(vite.middlewares);
      startServer(PORT);
    })
    .catch((err) => {
      console.error("[Backend Start] Failed to initialize Vite dev server:", err);
      startServer(PORT);
    });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  startServer(PORT);
}

