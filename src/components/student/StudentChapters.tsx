import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, X, CheckCircle, Circle } from "lucide-react";
import { gsap } from "../../lib/gsap";
import { Student } from "../../types";
import { CHEMISTRY_TOPICS, PHYSICS_TOPICS, MATHS_TOPICS, BIOLOGY_TOPICS } from "../../types";
import { getTopicAbbreviation, getProgressColor, parseMarkdownAndMath, MathRenderer, parseBoldAndMathInline } from "./shared";
import { TOPIC_RESOURCES } from "../../types";
import { BookOpen, CheckSquare, Sliders, CheckCircle2, AlertCircle, Award } from "lucide-react";
import AnimatedCounter from "../animations/AnimatedCounter";

interface StudentChaptersProps {
  student: Student;
  darkMode: boolean;
  studentSubjects: string[];
  activeSubject: string;
  setActiveSubject: (subject: string) => void;
  activeTopics: string[];
  activeSubjectAvg: number;
  selectedTopic: string | null;
  setSelectedTopic: (topic: string | null) => void;
  activeTab: "cheat" | "milestones";
  setActiveTab: (tab: "cheat" | "milestones") => void;
  syncStudentData: (silent?: boolean) => Promise<void>;
  setStudent: (student: Student) => void;
}

export default function StudentChapters({
  student,
  darkMode,
  studentSubjects,
  activeSubject,
  setActiveSubject,
  activeTopics,
  activeSubjectAvg,
  selectedTopic,
  setSelectedTopic,
  activeTab,
  setActiveTab,
  syncStudentData,
  setStudent
}: StudentChaptersProps) {
  const [localMilestones, setLocalMilestones] = React.useState<boolean[]>([false, false, false, false]);
  const [localScore, setLocalScore] = React.useState<number>(0);
  const [savingProgress, setSavingProgress] = React.useState(false);
  const [saveProgressSuccess, setSaveProgressSuccess] = React.useState(false);
  const [progressSaveError, setProgressSaveError] = React.useState<string | null>(null);

  const CONFETTI_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
  interface StoredParticle {
    id: number;
    x: number;
    color: string;
    size: number;
    explodeX?: number;
    explodeY?: number;
    explodeRotate?: number;
  }
  const [storedParticles, setStoredParticles] = React.useState<StoredParticle[]>([]);
  const [isExploding, setIsExploding] = React.useState(false);
  const particleIdRef = React.useRef(0);

  React.useEffect(() => {
    if (selectedTopic) {
      const currentScore = student.scores?.[selectedTopic] || 0;
      setLocalScore(currentScore);

      const concepts = (TOPIC_RESOURCES as any)[selectedTopic]?.concepts || [];
      const currentMilestones = student.milestones?.[selectedTopic] || new Array(concepts.length).fill(false);
      if (currentMilestones.length !== concepts.length) {
        const adjustedMilestones = new Array(concepts.length).fill(false);
        for (let i = 0; i < Math.min(currentMilestones.length, concepts.length); i++) {
          adjustedMilestones[i] = currentMilestones[i];
        }
        setLocalMilestones(adjustedMilestones);
      } else {
        setLocalMilestones(currentMilestones);
      }
      setSaveProgressSuccess(false);
      setProgressSaveError(null);
    }
  }, [selectedTopic, student.scores, student.milestones]);

  const handleToggleMilestone = (index: number) => {
    const newMilestones = [...localMilestones];
    const previousState = newMilestones[index];
    newMilestones[index] = !previousState;
    
    setLocalMilestones(newMilestones);

    if (selectedTopic) {
      const concepts = (TOPIC_RESOURCES as any)[selectedTopic]?.concepts || [];
      const numConcepts = concepts.length || 4;
      const checkedCount = newMilestones.filter(m => m).length;
      let newScore = Math.round((checkedCount / numConcepts) * 100);
      if (checkedCount === numConcepts) newScore = 100;
      setLocalScore(newScore);
    }

    if (!previousState) {
      const newParticles: StoredParticle[] = [];
      const particlesPerCheck = 8;
      for (let i = 0; i < particlesPerCheck; i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: 5 + Math.random() * 90,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 4 + Math.random() * 5,
        });
      }
      setStoredParticles(prev => [...prev, ...newParticles]);
    }
  };

  const handleSliderChange = (value: number) => {
    setLocalScore(value);
    if (selectedTopic) {
      const concepts = (TOPIC_RESOURCES as any)[selectedTopic]?.concepts || [];
      const numConcepts = concepts.length || 4;
      const weight = numConcepts > 0 ? 100 / numConcepts : 25;
      const newCheckedCount = Math.min(numConcepts, Math.round(value / weight));
      const oldCheckedCount = localMilestones.filter(m => m).length;
      const diff = newCheckedCount - oldCheckedCount;

      const newMilestones = concepts.map((_: any, i: number) => i < newCheckedCount);
      setLocalMilestones(newMilestones);

      if (diff > 0) {
        const newParticles: StoredParticle[] = [];
        for (let i = 0; i < diff * 8; i++) {
          newParticles.push({
            id: particleIdRef.current++,
            x: 5 + Math.random() * 90,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            size: 4 + Math.random() * 5,
          });
        }
        setStoredParticles(prev => [...prev, ...newParticles]);
      } else if (diff < 0) {
        setStoredParticles(prev => prev.slice(0, diff * 8));
      }
    }
  };

  const handleSaveProgress = async () => {
    if (!selectedTopic) return;
    setSavingProgress(true);
    setSaveProgressSuccess(false);
    setProgressSaveError(null);

    try {
      const payload = {
        topic: selectedTopic,
        score: localScore,
        milestones: localMilestones,
        classId: student.classId || "xii-a"
      };

      const res = await fetch(`/api/student/${student.rollNo}/save-progress?classId=${student.classId || "xii-a"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error("Failed to sync progress");
      }

      setSaveProgressSuccess(true);
      if (data.student) {
        setStudent(data.student);
      } else {
        await syncStudentData(true);
      }
      
      if (storedParticles.length > 0) {
        setStoredParticles(prev => prev.map(p => ({
          ...p,
          explodeX: (Math.random() - 0.5) * window.innerWidth * 1.2,
          explodeY: -(200 + Math.random() * 500) * (0.5 + (localMilestones.filter(m => m).length / (TOPIC_RESOURCES[selectedTopic]?.concepts?.length || 6)) * 0.5),
          explodeRotate: Math.random() * 1080,
        })));
        setIsExploding(true);
        setTimeout(() => {
          setStoredParticles([]);
          setIsExploding(false);
        }, 2000);
      }
      
      setTimeout(() => {
        setSaveProgressSuccess(false);
      }, 3000);
    } catch (err) {
      setProgressSaveError("Could not update progress. Please check your connection.");
    } finally {
      setSavingProgress(false);
    }
  };
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`p-5 sm:p-7 rounded-[2rem] border transition-all duration-300 ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white/80 border-slate-200"}`}
      >
        {/* Header and Subject Tabs */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-6 gap-4 border-b pb-5 dark:border-slate-800/80">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="w-full xl:w-auto flex-1"
          >
            <motion.h3
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
              className={`text-xl font-black font-display tracking-tight mb-3 ${darkMode ? "text-slate-100" : "text-slate-900"}`}
            >
              Academic Curriculum
            </motion.h3>
            
            {/* Dynamic Subject Nav tabs - Segmented Control */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.95 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
              className={`flex flex-col sm:flex-row p-1.5 sm:p-2 rounded-2xl sm:rounded-[2rem] border transition-colors duration-300 items-stretch sm:items-center justify-between gap-1.5 w-full bg-transparent ${darkMode ? "border-slate-800" : "border-slate-200/80"}`}
            >
              {studentSubjects.map((sub, idx) => {
                const isSelected = activeSubject === sub;
                const unitCount = sub === "Chemistry" ? CHEMISTRY_TOPICS.length : sub === "Physics" ? PHYSICS_TOPICS.length : sub === "Mathematics" ? MATHS_TOPICS.length : BIOLOGY_TOPICS.length;

                return (
                  <motion.button
                    key={sub}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 + idx * 0.08, ease: "easeOut" }}
                    onClick={() => setActiveSubject(sub)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer relative ${isSelected
                      ? darkMode
                        ? "text-white"
                        : "text-indigo-700"
                      : darkMode
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    <span>{sub}</span>
                    <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${isSelected 
                      ? darkMode ? "bg-slate-800 text-slate-300" : "bg-indigo-50 text-indigo-600" 
                      : darkMode ? "bg-slate-800/50 text-slate-500" : "bg-slate-200/50 text-slate-400"}`}>
                      {unitCount} Units
                    </span>
                    {isSelected && (
                      <motion.div
                        layoutId="active-subject"
                        className={`absolute -bottom-[5px] left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full ${darkMode ? "bg-indigo-400" : "bg-indigo-600"}`}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            className={`w-full xl:w-auto text-center xl:text-right ${darkMode ? "bg-indigo-950/40 border border-indigo-900/40" : "bg-indigo-50 border border-indigo-100"} px-5 py-3.5 rounded-2xl flex flex-row xl:flex-col items-center xl:items-end justify-between xl:justify-center mt-2 xl:mt-0 shrink-0`}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500 mb-0 xl:mb-0.5">Subject Average</span>
            <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              <AnimatedCounter value={activeSubjectAvg} suffix="%" />
            </span>
          </motion.div>
        </div>

        {/* Chapter Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4"
        >
          {activeTopics.map((topic, idx) => {
            const score = student.scores?.[topic] || 0;
            const { code, colorClass } = getTopicAbbreviation(topic);
            const isOpen = selectedTopic === topic;
            return (
              <motion.div
                key={topic}
                className="w-full"
                variants={{
                  hidden: { opacity: 0, y: 16, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1 }
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
              <button
                onClick={() => {
                  setSelectedTopic(topic);
                  setActiveTab("cheat");
                }}
                onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.03, y: -4, duration: 0.25, ease: "power2.out" })}
                onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, y: 0, duration: 0.3, ease: "power2.out" })}
                className={`relative overflow-hidden p-4 rounded-3xl border text-left cursor-pointer flex flex-col justify-between w-full h-40 transition-all duration-200 ${darkMode
                  ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                  : "bg-white border-slate-200/60 hover:border-slate-300"
                  } ${isOpen ? "ring-2 ring-indigo-500/60" : ""}`}
              >
                <div
                  className="absolute inset-0 pointer-events-none rounded-3xl"
                  style={{ background: `linear-gradient(135deg, ${getProgressColor(score, 0.12)} 0%, transparent 50%)` }}
                />
                <div className="space-y-3 relative z-0">
                  <div className="flex justify-between items-center">
                    <div className={`w-9 h-9 rounded-xl font-black flex items-center justify-center text-xs tracking-wider shadow-sm ${colorClass}`}>
                      {code}
                    </div>
                  </div>
                  <h4 className="text-xs font-extrabold line-clamp-2 leading-snug">{topic}</h4>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-900 dark:text-slate-400">
                    <span>Progression</span>
                    <span className={`font-extrabold`} style={{ color: getProgressColor(score) }}>
                      <AnimatedCounter value={score} suffix="%" />
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${score}%`, backgroundColor: getProgressColor(score) }}
                    />
                  </div>
                </div>
              </button>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* SAMS Academic Chapter Companion Slide panel */}
      <AnimatePresence>
        {selectedTopic && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTopic(null)}
              className="absolute inset-0 bg-slate-900"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`relative w-full max-w-2xl shadow-2xl h-[100dvh] flex flex-col z-10 transition-colors duration-300 ${darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
                }`}
            >
              {/* Drawer Header */}
              <div className={`p-6 shrink-0 relative border-b ${darkMode ? "bg-slate-950 text-white border-slate-850" : "bg-slate-50 text-slate-900 border-slate-200"
                }`}>
                <span className={`text-[10px] font-mono font-extrabold uppercase tracking-widest ${darkMode ? "text-indigo-400" : "text-indigo-600"
                  }`}>
                  {activeSubject} Academic Companion
                </span>
                <h3 className={`text-xl font-extrabold leading-tight mt-1 pr-8 ${darkMode ? "text-white" : "text-slate-900"
                  }`}>
                  {selectedTopic}
                </h3>
                <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-900"
                  }`}>
                  Current Completion Status: <span className="text-emerald-500 font-extrabold">{student.scores[selectedTopic] || 0}%</span>
                </p>
                <button
                  onClick={() => setSelectedTopic(null)}
                  className={`absolute top-6 right-6 text-lg font-black cursor-pointer transition-all ${darkMode ? "text-slate-400 hover:text-white" : "text-slate-900 hover:text-black"
                    }`}
                >
                  ✕
                </button>
              </div>

              {/* Drawer Tabs (Only Resources & Milestones) */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 shrink-0 overflow-x-auto scrollbar-none touch-pan-y">
                <button
                  onClick={() => setActiveTab("cheat")}
                  className={`flex-1 min-w-[120px] shrink-0 flex items-center justify-center gap-2 py-3 text-sm font-black border-b-2 transition-all cursor-pointer ${activeTab === "cheat"
                    ? "border-indigo-600 text-indigo-700 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-900 hover:text-black dark:text-slate-400 dark:hover:text-slate-100"
                    }`}
                >
                  <BookOpen className="h-4 w-4 text-indigo-500" /> Academic Resources
                </button>
                <button
                  onClick={() => setActiveTab("milestones")}
                  className={`flex-1 min-w-[120px] shrink-0 flex items-center justify-center gap-2 py-3 text-sm font-black border-b-2 transition-all cursor-pointer ${activeTab === "milestones"
                    ? "border-indigo-600 text-indigo-700 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-900 hover:text-black dark:text-slate-400 dark:hover:text-slate-100"
                    }`}
                >
                  <CheckSquare className="h-4 w-4 text-emerald-500" /> Prep Milestones
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6">

                {/* 1. Academic Resources Tab */}
                {activeTab === "cheat" && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Formulas */}
                    {TOPIC_RESOURCES[selectedTopic]?.formulas?.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-300">
                          Essential Formulas
                        </h4>
                        <div className="grid grid-cols-1 gap-2.5">
                          {TOPIC_RESOURCES[selectedTopic]?.formulas?.map((item) => (
                            <div
                              key={item.label}
                              className={`p-4 rounded-2xl border flex flex-col gap-2 ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
                                }`}
                            >
                              <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase block">
                                {parseBoldAndMathInline(item.label)}
                              </span>
                              <div className={`px-3.5 py-3 rounded-xl flex items-center justify-center select-all border overflow-x-auto ${darkMode
                                ? "bg-slate-800 border-slate-700 text-indigo-200"
                                : "bg-indigo-600/5 border-indigo-100/50 text-indigo-700"
                                }`}>
                                <MathRenderer math={item.formula} block={false} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Core Concepts */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-300">
                        Critical Syllabus Concepts
                      </h4>
                      <ul className="space-y-2">
                        {TOPIC_RESOURCES[selectedTopic]?.concepts?.map((c) => (
                          <li key={c} className="flex gap-2.5 text-xs text-slate-950 dark:text-slate-200 font-bold leading-relaxed">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">✓</span>
                            {parseBoldAndMathInline(c)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Study Tips */}
                    <div className="space-y-2.5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/20 p-4 rounded-2xl">
                      <h4 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-indigo-600" /> Examiner's Study Tip
                      </h4>
                      <ul className="space-y-2">
                        {TOPIC_RESOURCES[selectedTopic]?.tips?.map((t, idx) => (
                          <li key={idx} className="text-xs text-slate-950 dark:text-slate-300 leading-relaxed font-bold">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 2. Prep Milestones Tab */}
                {activeTab === "milestones" && (
                  <div className="space-y-6 animate-fadeIn pb-2">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl">
                      <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" /> Academic Milestones Tracker
                      </h4>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                        Toggle your completed syllabus concepts below! Toggling plays pleasant academic chimes and increases prep score dynamically. Complete all topics to master the chapter!
                      </p>
                    </div>

                    {/* Checkbook List */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-black text-slate-900 dark:text-slate-300 uppercase tracking-wider">
                        NCERT Core Topics Checklist
                      </h5>
                      <div className="space-y-2">
                        {(TOPIC_RESOURCES[selectedTopic]?.concepts || []).map((concept, cIdx) => {
                          const isChecked = localMilestones[cIdx] || false;
                          const weight = Math.round(100 / (TOPIC_RESOURCES[selectedTopic]?.concepts?.length || 4));
                          return (
                            <button
                              key={cIdx}
                              onClick={() => handleToggleMilestone(cIdx)}
                              className={`w-full text-left rounded-xl border transition-all flex items-stretch cursor-pointer overflow-hidden ${isChecked
                                ? "border-indigo-200 dark:border-indigo-800/60"
                                : "border-slate-200 dark:border-slate-700/60 hover:border-indigo-200 dark:hover:border-indigo-800/40"
                                }`}
                            >
                              {/* Left accent stripe */}
                              <div className={`w-1 shrink-0 rounded-l-xl transition-colors ${isChecked ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
                                }`} />

                              <div className={`flex items-center gap-3 px-3.5 py-3 flex-1 min-w-0 transition-colors ${isChecked
                                ? "bg-indigo-50/50 dark:bg-indigo-950/20"
                                : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                                }`}>
                                {/* Custom checkbox circle */}
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isChecked
                                  ? "bg-indigo-500 border-indigo-500"
                                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                  }`}>
                                  {isChecked && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>

                                <span className={`flex-1 text-xs leading-snug transition-colors ${isChecked
                                  ? "font-bold text-indigo-900 dark:text-indigo-200 line-through decoration-indigo-300 dark:decoration-indigo-700 decoration-1"
                                  : "font-semibold text-slate-700 dark:text-slate-300"
                                  }`}>
                                  {parseBoldAndMathInline(concept)}
                                </span>

                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${isChecked
                                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                  }`}>
                                  +{weight}%
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Slider overrides */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
                      <h5 className="text-xs font-black text-slate-900 dark:text-slate-300 uppercase tracking-wider">
                        Fine-Tune Mastery Score
                      </h5>
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Sliders className="h-4 w-4 text-slate-900 dark:text-slate-400" /> Manual Progress Adjustment
                          </span>
                          <span className="text-indigo-600 bg-indigo-50 border border-indigo-100/30 px-2.5 py-0.5 rounded font-mono font-black text-sm">
                            {localScore}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={localScore}
                          onChange={(e) => handleSliderChange(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-[8px] sm:text-[9px] text-slate-900 dark:text-slate-400 font-mono font-bold uppercase">
                          <span>Incomplete</span>
                          <span>Emerging</span>
                          <span>Intermediate</span>
                          <span>Advanced</span>
                          <span>Complete</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 shrink-0 space-y-2">
                {saveProgressSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Progress Portfolio synchronized successfully.
                  </motion.div>
                )}

                {progressSaveError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {progressSaveError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSaveProgress}
                    disabled={savingProgress}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    {savingProgress ? "Syncing..." : "Sync Progress"}
                  </button>
                </div>
              </div>

              {storedParticles.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-52 pointer-events-none z-50 overflow-visible">
                  {storedParticles.map(p => {
                    const checkedCount = localMilestones.filter(m => m).length;
                    const totalConcepts = (TOPIC_RESOURCES[selectedTopic || ""]?.concepts?.length) || 6;
                    const intensity = Math.min(checkedCount / totalConcepts, 1);
                    return (
                      <motion.div
                        key={p.id}
                        className="absolute bottom-2"
                        style={{
                          left: `${p.x}%`,
                          width: p.size,
                          height: p.size * 1.6,
                          backgroundColor: p.color,
                          borderRadius: 1,
                        }}
                        animate={isExploding && p.explodeX !== undefined ? {
                          x: p.explodeX,
                          y: p.explodeY,
                          rotate: p.explodeRotate,
                          opacity: 0,
                          transition: { duration: 1 + Math.random() * 0.5, ease: "easeOut" }
                        } : {
                          y: intensity > 0.8
                            ? [0, -10 - intensity * 14, 3, -12 - intensity * 12, 0]
                            : [0, -(2 + intensity * 8), 0],
                          rotate: intensity > 0.6
                            ? [0, 12, -12, 8, -8, 0]
                            : intensity > 0.3
                              ? [0, 6, -6, 0]
                              : 0,
                          scale: intensity > 0.8
                            ? [1, 1.12, 0.95, 1.08, 1]
                            : intensity > 0.5
                              ? [1, 1.06, 0.98, 1]
                              : 1,
                          transition: {
                            y: { duration: 0.5 + (1 - intensity) * 0.8, repeat: Infinity, ease: "easeInOut", delay: p.id * 0.02 },
                            rotate: { duration: 0.4 + (1 - intensity) * 0.4, repeat: Infinity, ease: "linear" },
                            scale: { duration: 0.3 + (1 - intensity) * 0.3, repeat: Infinity, ease: "easeInOut" },
                          }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
