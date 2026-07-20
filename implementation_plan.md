# Goal
1. Refactor `StudentView.tsx` into multiple smaller, maintainable component files.
2. Fix a bug where the active quiz state persists in the database even after the user exits or restarts the quiz, causing it to resume on the next load.

## Proposed Changes

### 1. Fix Quiz State Persistence Bug

The issue occurs because `handleRestartQuiz` clears the local state but doesn't notify the backend to clear the saved `activeQuiz` for the student.

- **Action**: Update `handleRestartQuiz` in the quiz logic to call `await persistQuizState(null, false)`. This will remove the quiz state from the database so it doesn't automatically resume on reload.

### 2. Refactor `StudentView.tsx` into Components

I will create a new directory `src/components/student/` and extract sections of `StudentView.tsx` into separate files. The main `StudentView.tsx` will become a container that manages the high-level state (like the `student` object) and passes props to these sub-components.

#### [NEW] `src/components/student/StudentNavbar.tsx`
- Extracts the top header (SAMS Logo, Dark Mode Toggle, Profile Badge).
- Handles opening the profile popup and logout.

#### [NEW] `src/components/student/StudentAchievements.tsx`
- Extracts the logic for computing achievements and rendering both the mobile achievements strip and the desktop sidebar.

#### [NEW] `src/components/student/StudentSummaries.tsx`
- Extracts the "Curriculum Coverage Summary" and "Preparation Rating" gauge.
- Calculates and displays `overallAvg` and syllabus completion counts.

#### [NEW] `src/components/student/StudentChapters.tsx`
- Extracts the dynamic subject navigation tabs (Chemistry, Physics, etc.).
- Extracts the grid of topic/chapter cards.
- Manages the "Academic Companion" slide panel (Cheat sheet and Milestones tracker).

#### [NEW] `src/components/student/StudentQuiz.tsx`
- Extracts the entire "Adaptive AI Quiz Panel".
- Manages quiz fetching, progression, difficulty scaling, and the bug fix for clearing the quiz state.

#### [NEW] `src/components/student/StudentChatbot.tsx`
- Extracts the "Always Visible SAMS AI Persistent Chatbot" component.

#### [MODIFY] `src/components/StudentView.tsx`
- Remove the extracted JSX and localized state/effects.
- Import and render the new components from `src/components/student/`.
- Keep shared global state (e.g., `student`, `darkMode`) and data fetching (`syncStudentData`) in this parent component to pass down via props.

## User Review Required
Refactoring a 2500+ line file is a significant architectural change. I will need to carefully pass state (like `student`, `darkMode`, and update functions) between the main `StudentView` and its child components. 

> [!WARNING]
> Since React state will be distributed across these new components, let me know if there are any specific state management tools (like React Context or Zustand) you'd prefer me to use, or if standard prop drilling is fine for now.

## Verification Plan
1. **Automated Tests**: I'll ensure there are no TypeScript or compilation errors after the refactor.
2. **Manual Verification**: I will ask you to verify that all sections of the UI load correctly, the dark mode toggle works across all components, and clicking "Exit" on a quiz successfully clears it so it doesn't reappear on page refresh.
