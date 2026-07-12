# SAMS - Student Academic Monitoring System

SAMS (Student Academic Monitoring System) is a modern, full-stack tutoring and academic tracking platform designed for Class XII students preparing for board exams and competitive engineering/medical entrance exams (JEE/NEET). The system monitors student progress in **Physics, Chemistry, Mathematics, and Biology**, tracks learning milestones based on NCERT topics, runs AI-generated adaptive quizzes, and provides a real-time AI Tutor chatbot powered by the Gemini API.

---

## 🔑 Key Features

### 1. Student Portal
*   **Performance Tracking:** Real-time visual dashboards showing subject-wise percentage scores and chapter completion tracking.
*   **Milestone Trackers:** Structured checklist progress for each chapter across **5 to 6 detailed NCERT core syllabus topics** (aligned exactly with the NCERT textbook).
*   **AI Tutoring & Chatbot:** Interactive math-and-science tutor capable of explaining complex formulas and concepts. Supports streaming text via Server-Sent Events (SSE) and displays LaTeX equations.
*   **Adaptive Quiz (1-Question-at-a-Time):** A dynamic testing interface that adjusts question difficulty (Easy / Medium / Hard) on the fly based on student accuracy. Generates questions using Gemini, prefetches subsequent questions to eliminate wait times, and provides a breakdown report upon completing 5 rounds.
*   **Achievements System:** Client-side achievements engine calculating milestones, subject performance, and quiz completions to award **Bronze, Silver, Gold, and Platinum** badges.

### 2. Teacher Portal
*   **Class Selection:** Dashboard support for managing multiple classes (e.g., `XII-A` and `XII-B`).
*   **Performance Monitoring:** Detailed academic registries featuring completion bars, subject averages, and individual profiles for all students.

---

## 📂 Project Directory Structure

```
sams/
├── data/                           # Local Database Storage (JSON Database Fallback)
│   ├── students/
│   │   ├── xii-a/                  # Class XII-A Student profiles (1.json to 37.json)
│   │   └── xii-b/                  # Class XII-B Student profiles (1.json to 18.json)
│   └── teachers/                   # Registered Teacher credentials (T1.json to T4.json)
├── src/                            # Frontend Source Code
│   ├── components/                 # React Components
│   │   ├── LoginPortal.tsx         # Combined manual / Google OAuth Login & Linking Portal
│   │   ├── SAMSLogo.tsx            # Unified SVG Bar-Chart Logo
│   │   ├── StudentView.tsx         # Core Student dashboard, AI Chatbot, and Quiz
│   │   └── TeacherView.tsx         # Teacher administration portal
│   ├── lib/
│   │   ├── fetch.ts                # Fetch utility wrapper with request retry and timeout handlers
│   │   └── firebase.ts             # Client-side Firebase SDK initialization
│   ├── App.tsx                     # App routing & session restoration
│   ├── main.tsx                    # React Entry point
│   ├── types.ts                    # Main TypeScript Interfaces, Topics lists & LaTeX resources
│   └── index.css                   # Global styles & Tailwind CSS imports
├── server.ts                       # Backend Express Server, Gemini integrations & Seeding script
├── firebase-applet-config.json     # Firebase Client Application Configuration (projectId, appId, keys)
├── firestore.rules                 # Cloud Firestore Security Rules
├── package.json                    # Dependencies and runtime scripts
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite bundler configurations & tailwind plugins
```

---

## 💾 Data Models & Schemas

The application enforces strong typing using TypeScript. The primary schemas are defined in [src/types.ts](file:///Users/adityadalmia/Desktop/sams/src/types.ts):

### 1. Student Schema
```typescript
interface Student {
  rollNo: number;
  classId?: string;                                             // e.g. "xii-a" or "xii-b"
  name: string;
  phone: string;                                                // Registration phone number
  email?: string;                                               // Linked Google Account email
  scores: Record<string, number>;                               // Topic Name -> Progress Percentage (0 - 100)
  milestones?: Record<string, boolean[]>;                       // Topic Name -> Array of booleans mapping to NCERT concepts list
  activeQuiz?: ActiveQuizState | null;                          // Interrupted quiz session (reload-proof)
  quizStats?: {
    totalQuizzes: number;
    bySubject: { chemistry: number; physics: number; maths: number; biology?: number };
  };
  recentSessions?: ActivitySession[];                           // Local logs of study/checklist changes
}
```

### 2. Teacher Schema
```typescript
interface Teacher {
  id: string;
  name: string;
  subject: string;                                              // e.g. "Chemistry" | "Physics" | "Mathematics" | "Biology"
  passcodes: string[];                                          // Passcodes authorizing login (e.g. ["CHEM12A"])
  email: string;                                                // Linked Google Account email
  classes: string[];                                            // Authorized classes (e.g. ["xii-a", "xii-b"])
}
```

### 3. Active Quiz State Schema
```typescript
interface ActiveQuizState {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  roundsCompleted: number;
  correctCount: number;
  history: Array<{
    question: string;
    selectedIndex: number;
    correctIndex: number;
    correct: boolean;
    difficulty: "easy" | "medium" | "hard";
    explanation: string;
  }>;
  startedAt: string;
}
```

---

## ⚙️ Core Workflows & Business Logic

### 1. Dual-Mode Database Fallback & Seeding
On startup, the Express server parses [firebase-applet-config.json](file:///Users/adityadalmia/Desktop/sams/firebase-applet-config.json):
*   **Firestore Connected:** If config file exists and credentials resolve, server uses `firebase-admin` to operate on Cloud Firestore.
    *   **Self-Seeding:** If Firestore collections (`xii-a`, `xii-b`, `teachers`) are empty, the backend reads default students (`INITIAL_STUDENTS` and `XIIB_STUDENTS_DATA`) and teachers from memory, writes JSON seeds locally, and imports them to Firestore.
*   **Local JSON Database:** If config is missing or Firestore rejects connections, the backend switches to local read/writes using standard Node.js filesystem `fs` module inside the `data/` subdirectory.

### 2. Adaptive Quiz Loop
The quiz consists of exactly **5 questions** generated dynamically.
*   **Difficulty Scaling:** 
    *   Starts at `medium`.
    *   *Correct Answer:* Upgrades difficulty (`easy` -> `medium`, `medium` -> `hard`, `hard` -> `hard`).
    *   *Incorrect Answer:* Downgrades difficulty (`hard` -> `medium`, `medium` -> `easy`, `easy` -> `easy`).
*   **Continuity:** State is updated on the database in real-time via `POST /api/student/:roll_no/quiz-state` so student sessions are preserved if they reload the page.
*   **Prefetching Optimization:** To bypass Gemini latency, as soon as a student confirms an answer, the client triggers a background prefetch request matching the *next* estimated difficulty level. When the student clicks "Next Question", the page loads instantly.

### 3. SSE Chatbot Stream
The AI chatbot uses `generateContentStream` from `@google/genai` to stream tokens to the client.
*   **Strict Scope Policy:** System prompt locks responses to standard high-school Chemistry, Physics, Mathematics, Biology, and study schedules. Any off-topic queries are politely declined.
*   **LaTeX Rendering:** All mathematical formulas, chemical variables, and physical coordinates are strictly formatted using `$` (inline) and `$$` (block) LaTeX equations, parsed in the UI using KaTeX.

### 4. Achievements Calculation
Badges are computed client-side in [StudentView.tsx](file:///Users/adityadalmia/Desktop/sams/src/components/StudentView.tsx):
*   **Bronze:**
    *   `First Steps`: Any chapter score > 0%
    *   `Quiz Warrior`: Total quizzes completed >= 1
    *   `Subject Starter`: Any subject average >= 10%
*   **Silver:**
    *   `On Track`: Overall average >= 25%
    *   `Half Way There`: Overall average >= 50%
    *   `Subject Stars` (Chemistry, Physics, Maths, Biology): Subject average >= 60%
    *   `Quiz Addict`: Total quizzes completed >= 5
*   **Gold:**
    *   `Multi-Subject Master`: All enrolled subjects average >= 60%
    *   `Milestone Master`: Completion of all 5-6 milestone checkboxes in any single topic (100% completion)
    *   `Excellence`: Overall average >= 75%
*   **Platinum:**
    *   `SAMS Scholar`: Overall average >= 90%
    *   `Exam Ready`: All enrolled subjects average >= 80%

---

## 📡 API Reference

All requests and responses use JSON bodies, except streaming endpoints which utilize SSE formats.

| Endpoint | Method | Headers / Params | Request Body | Response Payload | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/login` | `POST` | None | `{ role, rollNo, phone, passcode, classId }` | `{ success: true, role, student?, name?, passcode? }` | Authenticates students via phone/roll number or teachers via custom passcode. |
| `/api/login-google` | `POST` | None | `{ email, idToken? }` | `{ success: true, role, student?, name?, passcode? }` | Direct Google Sign-In verification. Returns matching profile or flags account linking requirement. |
| `/api/link-google-account` | `POST` | None | `{ email, rollNo?, phone?, passcode?, role, classId? }` | `{ success: true, role, student?, name?, passcode? }` | Binds a Google Gmail account to a pre-existing manual registration record. |
| `/api/student/:roll_no` | `GET` | `classId` (query param) | None | `Student` | Fetches progress profile of a specific student. |
| `/api/students` | `GET` | `x-teacher-passcode` (header) | None | `Student[]` | [Teacher Only] Retrieves progress records for all students in the school database. |
| `/api/teacher/profile` | `GET` | `x-teacher-passcode` (header) | None | `{ name, subject, email, classes }` | Retrieves dynamic teacher profile metadata based on passcode lookup. |
| `/api/student/:roll_no/score` | `POST` | `x-teacher-passcode` (header) | `{ topic, score, milestones, classId }` | `{ success: true, student }` | [Teacher Only] Updates academic topic progress and milestone metrics for a student. |
| `/api/student/:roll_no/email` | `POST` | `x-teacher-passcode` (header) | `{ email, classId }` | `{ success: true, student }` | [Teacher Only] Directly overrides / assigns a registered email address to a student. |
| `/api/student/:roll_no/save-progress` | `POST` | `classId` (query) | `{ topic, score, milestones }` | `{ success: true, student }` | Saves student score changes and milestone checkbox parameters. |
| `/api/gemini/explain` | `POST` | None | `{ topic, question }` | `{ reply }` | [Gemini API] Solves standard conceptual queries on the current topic. |
| `/api/gemini/generate-quiz-question` | `POST` | None | `{ topic, difficulty, previousQuestions[] }` | `{ question, options[], answerIndex, explanation }` | [Gemini API] Generates a randomized multiple-choice question. |
| `/api/gemini/chatbot-stream` | `POST` | None | `{ messages: Array<{ role, text }> }` | *SSE Stream of tokens* (`data: {"text": "..."}`) | [Gemini API] Starts real-time streaming SSE chatbot conversation. |
| `/api/student/:roll_no/quiz-state` | `POST` | None | `{ quizState, completed, subjectHint }` | `{ success: true, student }` | Saves active quiz state or clears it on completion while incrementing stats. |
| `/api/health` | `GET` | None | None | `{ status, database: { mode, isConfigured, isHealthy }, ... }` | Diagnostic report of uptime, Firestore connection health, and memory footprint. |