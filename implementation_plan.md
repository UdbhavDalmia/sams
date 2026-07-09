# SAMS Feature Implementation Plan

## Overview
Five major features to implement across the SAMS codebase.

---

## 1. Achievements System

### Design
Pre-defined achievement list computed from the student's live data (scores, milestones, quiz performance). No new backend storage needed — achievements are derived client-side from existing `student.scores` and `student.milestones`.

**Achievement Categories:**
| Badge | Name | Condition |
|---|---|---|
| 🥉 Bronze | First Steps | Any chapter > 0% |
| 🥉 Bronze | Quiz Warrior | Complete first quiz session |
| 🥉 Bronze | Subject Starter | Any subject avg ≥ 10% |
| 🥈 Silver | On Track | Overall avg ≥ 25% |
| 🥈 Silver | Half Way There | Overall avg ≥ 50% |
| 🥈 Silver | Chemistry Star | Chem avg ≥ 60% |
| 🥈 Silver | Physics Pro | Physics avg ≥ 60% |
| 🥈 Silver | Maths Maestro | Maths avg ≥ 60% |
| 🥇 Gold | Triple Threat | All 3 subjects avg ≥ 60% |
| 🥇 Gold | Milestone Master | Any topic 100% milestone check |
| 🥇 Gold | Excellence | Overall avg ≥ 75% |
| 🏆 Platinum | SAMS Scholar | Overall avg ≥ 90% |
| 🏆 Platinum | JEE Ready | All subjects avg ≥ 80% |

### Layout
- **Desktop (≥ lg):** Sticky left sidebar column, always visible
- **Mobile:** Horizontal scrollable strip pinned just below the student info bar, before main content

---

## 2. Adaptive Quiz (1 Question at a Time)

### Changes to quiz logic:
- **Remove** the "5 questions at once" batch generation
- **Instead:** Generate 1 question at a time via `/api/gemini/generate-quiz-question`
- Track the difficulty level (easy / medium / hard) as state; start at medium
- After each answer: correct → bump difficulty; wrong → lower difficulty
- Show immediate feedback after each answer (correct/wrong highlight + brief explanation)
- Run for **5 rounds**, then show a full performance report

### Performance Report at End:
- Score (X/5)
- Topic-wise difficulty progression chart (was it going up or down?)
- Weakest concept identified (from which question got wrong)
- Study recommendation

### API Change:
Add `/api/gemini/generate-quiz-question` endpoint in `server.ts` that accepts `{ topic, difficulty: "easy" | "medium" | "hard" }` and returns **1 question**.

> [!NOTE]
> This also solves the **AI speed** issue — generating 1 question instead of 5 is ~5× faster.

---

## 3. AI Speed Optimization

### For Quiz:
- Switching to single-question generation (as above) dramatically reduces wait time

### For SAMS AI Chatbot:
- Enable **streaming responses** on the server: use `ai.models.generateContentStream()` instead of `generateContent()`
- Add a new `/api/gemini/chat-stream` endpoint that streams tokens
- On the client, use a `ReadableStream` reader to render text incrementally as it arrives — user sees response building word-by-word instead of waiting for the full response

---

## 4. Logo Consistency

- Replace `FlaskConical` with the **bar chart SVG** (already used in TeacherView header) in:
  - `StudentView.tsx` header (line 707)
  - `LoginPortal.tsx` logo (line 156)
- Extract the bar chart SVG into a shared `<SAMSLogo />` component used everywhere

---

## 5. Login UX Screens

### Unauthorized Screen
When a student's Google email isn't in the registry (currently shows a generic modal), replace with a full-screen beautiful **"Access Denied"** screen:
- SAMS logo + red/rose color scheme
- "This email is not registered in SAMS" message
- Note: "SAMS is exclusively for pre-registered XII-A students"
- Option to try a different account or use Roll/Phone login instead

### Login Success / Redirecting Screen
After successful login (both Google and manual), show a brief **"Login Successful"** overlay:
- Green check animation
- "Welcome, [Name]!" text
- "Redirecting to your dashboard in 2 seconds..."
- Disable all login form inputs while showing this
- Auto-redirect after 2s

---

## Proposed Changes

### Frontend

#### [MODIFY] StudentView.tsx
- Add achievements computation logic
- Add left sidebar column with achievements panel (lg+ screens)  
- Add horizontal achievements strip (mobile, below info bar)
- Replace quiz flow with 1-question adaptive flow + report

#### [MODIFY] LoginPortal.tsx
- Replace `FlaskConical` with bar chart logo
- Add `loginSuccess` state with redirecting overlay
- Add `unauthorized` full-screen state

#### [MODIFY] TeacherView.tsx
- No logo change needed (already bar chart)

#### [NEW] src/components/SAMSLogo.tsx
- Shared bar-chart logo component used in all three components

### Backend

#### [MODIFY] server.ts
- Add `/api/gemini/generate-quiz-question` endpoint (single question, with difficulty param)
- Add `/api/gemini/chat-stream` SSE endpoint for streaming chatbot responses

---

## Open Questions

> [!IMPORTANT]
> **Achievement data persistence:** Should quiz-based achievements (e.g. "Quiz Warrior") be stored in Firestore so they persist across sessions? Or computed fresh each time from scores? My plan is to compute from scores only (no extra storage), but quiz-specific achievements would need a `quizCount` field added to the Student type.

> [!IMPORTANT]
> **Streaming chatbot:** Streaming requires the client to handle SSE (Server-Sent Events). This changes the chatbot significantly. Do you want this, or is the current wait-for-full-response style okay and only the quiz speed matters?

## Verification Plan

### Automated
- Restart dev server, check `/api/gemini/generate-quiz-question` responds in < 3 seconds

### Manual
- Trigger quiz and verify 1 question appears, feedback shows on answer, difficulty adjusts, report appears at round 5
- Check achievements panel on desktop (left sidebar) and mobile (horizontal strip)
- Verify logo is bar chart in all three pages
- Test unauthorized Google email shows access denied screen
- Test successful login shows redirecting overlay
