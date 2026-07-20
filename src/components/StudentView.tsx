import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, BookOpen } from "lucide-react";
import { Student, ActiveQuizState, CHEMISTRY_TOPICS, PHYSICS_TOPICS, MATHS_TOPICS, BIOLOGY_TOPICS, TopicName, TOPIC_RESOURCES, getStudentSubjects } from "../types";
import { fetchWithRetry } from "../lib/fetch";
import { gsap } from "../lib/gsap";

import StudentNavbar from "./student/StudentNavbar";
import { StudentAchievementsMobile, StudentAchievementsDesktop } from "./student/StudentAchievements";
import StudentSummaries from "./student/StudentSummaries";
import StudentChapters from "./student/StudentChapters";
import StudentQuiz from "./student/StudentQuiz";
import StudentChatbot from "./student/StudentChatbot";

interface StudentViewProps {
  student: Student;
  onLogout: () => void;
}

export default function StudentView({ student: initialStudent, onLogout }: StudentViewProps) {
  const [student, setStudent] = useState<Student>(initialStudent);
  const [studentDataStatus, setStudentDataStatus] = useState<"loading" | "ready" | "error" | "empty">("loading");
  const [studentDataError, setStudentDataError] = useState<string | null>(null);
  const [initialQuizState, setInitialQuizState] = useState<any>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  const studentRootRef = useRef<HTMLDivElement>(null);

  const studentSubjects = getStudentSubjects(student.scores);
  const [activeSubject, setActiveSubject] = useState<string>(
    studentSubjects.includes("Chemistry") ? "Chemistry" : (studentSubjects[0] as string || "Physics")
  );

  const [activeTab, setActiveTab] = useState<"cheat" | "milestones">("cheat");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);


  const topicKeys = Object.keys(student.scores || {});

  // Computed Values
  const overallAvg = topicKeys.length > 0
    ? Math.round(topicKeys.reduce((sum, k) => sum + (student.scores[k] || 0), 0) / topicKeys.length)
    : 0;

  const chemScores = CHEMISTRY_TOPICS.map(t => student.scores[t] || 0);
  const chemAvg = chemScores.length > 0 ? Math.round(chemScores.reduce((sum, v) => sum + v, 0) / chemScores.length) : 0;
  const physScores = PHYSICS_TOPICS.map(t => student.scores[t] || 0);
  const physAvg = physScores.length > 0 ? Math.round(physScores.reduce((sum, v) => sum + v, 0) / physScores.length) : 0;
  const mathScores = MATHS_TOPICS.map(t => student.scores[t] || 0);
  const mathAvg = mathScores.length > 0 ? Math.round(mathScores.reduce((sum, v) => sum + v, 0) / mathScores.length) : 0;
  const bioScores = BIOLOGY_TOPICS.map(t => student.scores[t] || 0);
  const bioAvg = bioScores.length > 0 ? Math.round(bioScores.reduce((sum, v) => sum + v, 0) / bioScores.length) : 0;

  const totalTopicsCount = topicKeys.length;
  const studiedTopicsCount = (Object.values(student.scores) as number[]).filter(score => score > 0).length;
  const completedChaptersCount = (Object.values(student.scores) as number[]).filter(score => score === 100).length;

  const activeTopics = (activeSubject === "Physics"
    ? PHYSICS_TOPICS
    : (activeSubject === "Mathematics"
      ? MATHS_TOPICS
      : (activeSubject === "Biology"
        ? BIOLOGY_TOPICS
        : (activeSubject === "Chemistry"
          ? CHEMISTRY_TOPICS
          : getStudentSubjects(student.scores).reduce((acc, sub) => {
            if (sub === "Chemistry") return [...acc, ...CHEMISTRY_TOPICS];
            if (sub === "Physics") return [...acc, ...PHYSICS_TOPICS];
            if (sub === "Mathematics") return [...acc, ...MATHS_TOPICS];
            if (sub === "Biology") return [...acc, ...BIOLOGY_TOPICS];
            return acc;
          }, [] as string[])
        )
      )
    )) as string[];

  const subjectScores = activeTopics.map(t => student.scores[t] || 0);
  const activeSubjectAvg = subjectScores.length > 0
    ? Math.round(subjectScores.reduce((sum, v) => sum + v, 0) / subjectScores.length)
    : 0;

  // Sync Student Data
  const syncStudentData = async (silent = false) => {
    if (!silent) setStudentDataStatus("loading");
    if (!silent) setStudentDataError(null);
    try {
      const res = await fetchWithRetry(`/api/student/${student.rollNo}?classId=${student.classId || "xii-a"}`);
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error || "Unable to load your student profile.");
      if (!data?.scores || Object.keys(data.scores).length === 0) {
        if (!silent) {
          setStudentDataStatus("empty");
          setStudentDataError("Your profile is available but no syllabus data has been loaded yet.");
        }
        return;
      }
      setStudent(data);
      if (data.activeQuiz) {
        setInitialQuizState(data.activeQuiz);
        setIsQuizActive(true);
      }
      setStudentDataStatus("ready");
    } catch (err: any) {
      if (!silent) {
        setStudentDataStatus("error");
        setStudentDataError(err.message || "We could not refresh your academic profile. Please try again.");
      }
    }
  };

  useEffect(() => {
    syncStudentData();
  }, [student.rollNo]);

  useEffect(() => {
    if (!studentRootRef.current) return;
    gsap.fromTo(studentRootRef.current, { opacity: 0.35 }, { opacity: 1, duration: 0.45, ease: "power2.out" });
  }, [darkMode]);

  useEffect(() => {
    const overlayOpen = selectedTopic !== null || showProfilePopup;
    if (!overlayOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [selectedTopic, showProfilePopup]);

  useEffect(() => {
    if (selectedTopic) {
      const concepts = TOPIC_RESOURCES[selectedTopic as TopicName]?.concepts || [];
      const currentMilestones = student.milestones?.[selectedTopic] || new Array(concepts.length).fill(false);

      const adjustedMilestones = new Array(concepts.length).fill(false);
      for (let i = 0; i < Math.min(currentMilestones.length, concepts.length); i++) {
        adjustedMilestones[i] = currentMilestones[i];
      }
    }
  }, [selectedTopic, student]);



  if (studentDataStatus === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-300">Loading profile</p>
          <p className="text-xs text-slate-400">Syncing your academic dashboard...</p>
        </div>
      </div>
    );
  }

  if (studentDataStatus === "error") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full rounded-3xl border border-rose-900/40 bg-slate-900 p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-300">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black">Profile unavailable</h2>
            <p className="text-sm text-slate-300">{studentDataError || "We could not load your academic profile right now."}</p>
          </div>
          <button
            onClick={syncStudentData}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-black"
          >
            Retry loading profile
          </button>
        </div>
      </div>
    );
  }

  if (studentDataStatus === "empty") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full rounded-3xl border border-amber-900/40 bg-slate-900 p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-300">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black">No syllabus data yet</h2>
            <p className="text-sm text-slate-300">{studentDataError || "Your profile is active, but it does not contain syllabus progress yet."}</p>
          </div>
          <button
            onClick={syncStudentData}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black"
          >
            Refresh profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="student-view-container" ref={studentRootRef} className={`min-h-screen transition-colors duration-300 font-sans flex flex-col ${darkMode ? "bg-slate-950 text-slate-100 dark" : "bg-[#eaf4fc] text-slate-900"}`}>
      <StudentNavbar
        student={student}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={onLogout}
        showProfilePopup={showProfilePopup}
        setShowProfilePopup={setShowProfilePopup}
        studentSubjects={studentSubjects}
      />

      <StudentAchievementsMobile
        student={student}
        darkMode={darkMode}
        studentSubjects={studentSubjects}
        overallAvg={overallAvg}
        chemAvg={chemAvg}
        physAvg={physAvg}
        mathAvg={mathAvg}
        bioAvg={bioAvg}
      />

      <div className="flex flex-1 overflow-hidden">
        <StudentAchievementsDesktop
          student={student}
          darkMode={darkMode}
          studentSubjects={studentSubjects}
          overallAvg={overallAvg}
          chemAvg={chemAvg}
          physAvg={physAvg}
          mathAvg={mathAvg}
          bioAvg={bioAvg}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          <section className="grid grid-cols-1 gap-6">
            <StudentSummaries
              student={student}
              darkMode={darkMode}
              overallAvg={overallAvg}
              totalTopics={totalTopicsCount}
              topicsAttempted={studiedTopicsCount}
              completedTopics={completedChaptersCount}
            />
          </section>

          <section>
            <StudentChapters
              student={student}
              setStudent={setStudent}
              darkMode={darkMode}
              studentSubjects={studentSubjects}
              activeSubject={activeSubject}
              setActiveSubject={setActiveSubject}
              activeTopics={activeTopics}
              activeSubjectAvg={activeSubjectAvg}
              selectedTopic={selectedTopic}
              setSelectedTopic={setSelectedTopic}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              syncStudentData={syncStudentData}
            />
          </section>

          <section>
            <StudentQuiz
              student={student}
              darkMode={darkMode}
              activeTopics={activeTopics}
              syncStudentData={syncStudentData}
              initialQuizState={initialQuizState}
              onQuizStateChange={setIsQuizActive}
            />
          </section>
        </main>
      </div>

      <StudentChatbot
        student={student}
        darkMode={darkMode}
        disabled={isQuizActive}
      />
    </div>
  );
}
