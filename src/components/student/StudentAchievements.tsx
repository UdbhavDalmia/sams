import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Star, BookOpen, TrendingUp, Sliders, Award, Zap, Target, Dna, BrainCircuit, CheckSquare, Sparkles } from "lucide-react";
import { Student } from "../../types";
import { CHEMISTRY_TOPICS, PHYSICS_TOPICS, MATHS_TOPICS, BIOLOGY_TOPICS } from "../../types";

interface StudentAchievementsProps {
  student: Student;
  darkMode: boolean;
  studentSubjects: string[];
  overallAvg: number;
  chemAvg: number;
  physAvg: number;
  mathAvg: number;
  bioAvg: number;
}

export function StudentAchievementsMobile({
  student,
  darkMode,
  studentSubjects,
  overallAvg,
  chemAvg,
  physAvg,
  mathAvg,
  bioAvg
}: StudentAchievementsProps) {
  const [selectedMobileAchievement, setSelectedMobileAchievement] = useState<string | null>(null);

  const getAchievementIcon = (id: string, tier: string, earned: boolean, className = "h-4 w-4") => {
    const tierColors: Record<string, string> = {
      bronze: earned ? "text-amber-500" : "text-slate-400",
      silver: earned ? "text-slate-300" : "text-slate-400",
      gold: earned ? "text-yellow-400" : "text-slate-400",
      platinum: earned ? "text-cyan-400 animate-pulse" : "text-slate-400",
    };

    const colorClass = tierColors[tier] || "text-slate-400";

    switch (id) {
      case "first_steps": return <Star className={`${className} ${colorClass}`} />;
      case "quiz_warrior": return <Trophy className={`${className} ${colorClass}`} />;
      case "subject_starter": return <BookOpen className={`${className} ${colorClass}`} />;
      case "on_track": return <TrendingUp className={`${className} ${colorClass}`} />;
      case "half_way": return <Sliders className={`${className} ${colorClass}`} />;
      case "chem_star": return <Award className={`${className} ${colorClass}`} />;
      case "phys_pro": return <Zap className={`${className} ${colorClass}`} />;
      case "math_maestro": return <Target className={`${className} ${colorClass}`} />;
      case "bio_star": return <Dna className={`${className} ${colorClass}`} />;
      case "quiz_addict": return <BrainCircuit className={`${className} ${colorClass}`} />;
      case "triple_threat": return <Trophy className={`${className} ${colorClass} scale-110`} />;
      case "milestone_master": return <CheckSquare className={`${className} ${colorClass}`} />;
      case "excellence": return <Sparkles className={`${className} ${colorClass}`} />;
      case "sams_scholar": return <Award className={`${className} ${colorClass} scale-110`} />;
      case "jee_ready": return <Zap className={`${className} ${colorClass} scale-110`} />;
      default: return <Award className={`${className} ${colorClass}`} />;
    }
  };

  const computeAchievements = () => {
    const totalQuizzes = student.quizStats?.totalQuizzes || 0;
    const milestoneValues = Object.values(student.milestones || {}) as boolean[][];
    const anyMilestone100 = milestoneValues.some(arr => arr && arr.length > 0 && arr.every(Boolean));
    const scoresValues = Object.values(student.scores || {}) as number[];

    const defs = [
      { id: "first_steps", title: "First Steps", desc: "Started studying at least one chapter", icon: "🌱", tier: "bronze", earned: scoresValues.some(s => s > 0) },
      { id: "quiz_warrior", title: "Quiz Warrior", desc: "Completed your first quiz", icon: "⚔️", tier: "bronze", earned: totalQuizzes >= 1 },
      {
        id: "subject_starter",
        title: "Subject Starter",
        desc: "Any subject average ≥ 10%",
        icon: "📘",
        tier: "bronze",
        earned: (studentSubjects.includes("Chemistry") && chemAvg >= 10) ||
          (studentSubjects.includes("Physics") && physAvg >= 10) ||
          (studentSubjects.includes("Mathematics") && mathAvg >= 10) ||
          (studentSubjects.includes("Biology") && bioAvg >= 10)
      },
      { id: "on_track", title: "On Track", desc: "Overall average ≥ 25%", icon: "🎯", tier: "silver", earned: overallAvg >= 25 },
      { id: "half_way", title: "Half Way There", desc: "Overall average ≥ 50%", icon: "🏃", tier: "silver", earned: overallAvg >= 50 },
    ];

    if (studentSubjects.includes("Chemistry")) defs.push({ id: "chem_star", title: "Chemistry Star", desc: "Chemistry average ≥ 60%", icon: "⚗️", tier: "silver", earned: chemAvg >= 60 });
    if (studentSubjects.includes("Physics")) defs.push({ id: "phys_pro", title: "Physics Pro", desc: "Physics average ≥ 60%", icon: "⚡", tier: "silver", earned: physAvg >= 60 });
    if (studentSubjects.includes("Mathematics")) defs.push({ id: "math_maestro", title: "Maths Maestro", desc: "Maths average ≥ 60%", icon: "📐", tier: "silver", earned: mathAvg >= 60 });
    if (studentSubjects.includes("Biology")) defs.push({ id: "bio_star", title: "Biology Star", desc: "Biology average ≥ 60%", icon: "🧬", tier: "silver", earned: bioAvg >= 60 });

    defs.push(
      { id: "quiz_addict", title: "Quiz Addict", desc: "Completed 5 or more quizzes", icon: "🧠", tier: "silver", earned: totalQuizzes >= 5 },
      {
        id: "triple_threat",
        title: "Multi-Subject Master",
        desc: "All subjects ≥ 60%",
        icon: "🏆",
        tier: "gold",
        earned: studentSubjects.length > 0 && studentSubjects.every(sub => {
          if (sub === "Chemistry") return chemAvg >= 60;
          if (sub === "Physics") return physAvg >= 60;
          if (sub === "Mathematics") return mathAvg >= 60;
          if (sub === "Biology") return bioAvg >= 60;
          return true;
        })
      },
      { id: "milestone_master", title: "Milestone Master", desc: "Completed all milestones for a topic", icon: "✅", tier: "gold", earned: anyMilestone100 },
      { id: "excellence", title: "Excellence", desc: "Overall average ≥ 75%", icon: "🌟", tier: "gold", earned: overallAvg >= 75 },
      { id: "sams_scholar", title: "SAMS Scholar", desc: "Overall average ≥ 90%", icon: "🎓", tier: "platinum", earned: overallAvg >= 90 },
      {
        id: "jee_ready",
        title: "Exam Ready",
        desc: "All subjects ≥ 80%",
        icon: "🚀",
        tier: "platinum",
        earned: studentSubjects.length > 0 && studentSubjects.every(sub => {
          if (sub === "Chemistry") return chemAvg >= 80;
          if (sub === "Physics") return physAvg >= 80;
          if (sub === "Mathematics") return mathAvg >= 80;
          if (sub === "Biology") return bioAvg >= 80;
          return true;
        })
      }
    );
    return defs;
  };

  const achievements = computeAchievements();
  const earnedCount = achievements.filter(a => a.earned).length;

  const tierColors: Record<string, string> = {
    bronze: "from-amber-600 to-amber-400",
    silver: "from-slate-400 to-slate-300",
    gold: "from-yellow-500 to-amber-400",
    platinum: "from-indigo-400 to-cyan-400",
  };
  const tierBg: Record<string, string> = {
    bronze: darkMode ? "bg-amber-950/40 border-amber-800/40" : "bg-amber-50 border-amber-200",
    silver: darkMode ? "bg-slate-800/60 border-slate-700/40" : "bg-slate-50 border-slate-200",
    gold: darkMode ? "bg-yellow-950/40 border-yellow-800/40" : "bg-yellow-50 border-yellow-200",
    platinum: darkMode ? "bg-indigo-950/40 border-indigo-800/40" : "bg-indigo-50 border-indigo-200",
  };
  const tierLabel: Record<string, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum" };
  const tierTxtColors: Record<string, string> = {
    bronze: darkMode ? "text-amber-400" : "text-amber-600",
    silver: darkMode ? "text-slate-300" : "text-slate-500",
    gold: darkMode ? "text-yellow-300" : "text-yellow-600",
    platinum: darkMode ? "text-indigo-300" : "text-indigo-600",
  };

  return (
    <>
      {/* ── MOBILE: Achievements relative wrapper container ── */}
      <div className="relative lg:hidden">
        {/* Achievements horizontal strip */}
        <div className={`px-4 py-2.5 border-b overflow-x-auto transition-colors duration-300 ${darkMode ? "bg-slate-900/40 border-slate-800/80" : "bg-white/60 border-slate-200"}`}>
          <div className="flex items-center gap-2 min-w-max">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest shrink-0 mr-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              🏅 Achievements ({earnedCount}/{achievements.length})
            </span>
            {(["bronze", "silver", "gold", "platinum"] as const).map((tier, tIdx) => {
              const tierItems = achievements.filter(a => a.tier === tier);
              if (tierItems.length === 0) return null;
              return (
                <React.Fragment key={tier}>
                  {tIdx > 0 && (
                    <div className={`w-px h-5 shrink-0 ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
                  )}
                  <span className={`text-[8px] font-black uppercase tracking-widest shrink-0 px-1 ${tierTxtColors[tier]}`}>
                    {tierLabel[tier]}
                  </span>
                  {tierItems.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedMobileAchievement(prev => prev === a.id ? null : a.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold shrink-0 transition-all cursor-pointer ${a.earned
                        ? tierBg[a.tier]
                        : darkMode ? "bg-slate-800/40 border-slate-700/30 opacity-35" : "bg-slate-100 border-slate-200 opacity-40"
                        } ${selectedMobileAchievement === a.id ? "ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-950" : ""}`}
                    >
                      <span>{getAchievementIcon(a.id, a.tier, a.earned, "h-3.5 w-3.5")}</span>
                      <span className={darkMode ? "text-slate-200" : "text-slate-700"}>{a.title}</span>
                    </button>
                  ))}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Floating absolute overlay popup */}
        <AnimatePresence>
          {selectedMobileAchievement && (() => {
            const activeAch = achievements.find((a) => a.id === selectedMobileAchievement);
            if (!activeAch) return null;

            const requirementHints: Record<string, string> = {
              first_steps: "Start studying and record preparation score > 0% on any syllabus chapter.",
              quiz_warrior: "Complete at least one full adaptive AI Quiz session (5 rounds) in any topic.",
              subject_starter: "Achieve a preparation average score of 10% or higher in any single subject.",
              on_track: "Maintain a cumulative overall syllabus preparation index of 25% or higher.",
              half_way: "Maintain a cumulative overall syllabus preparation index of 50% or higher.",
              chem_star: "Reach a chemistry subject average score of 60% or higher.",
              phys_pro: "Reach a physics subject average score of 60% or higher.",
              math_maestro: "Reach a mathematics subject average score of 60% or higher.",
              quiz_addict: "Complete 5 or more interactive adaptive AI Quiz sessions.",
              triple_threat: "Achieve and maintain a subject average of 60% or higher in all three subjects.",
              milestone_master: "Check off every milestone box in the prep checklist for any chapter.",
              excellence: "Achieve and maintain a cumulative overall syllabus preparation index of 75% or higher.",
              sams_scholar: "Maintain an outstanding cumulative overall syllabus preparation index of 90% or higher.",
              jee_ready: "Achieve and maintain a subject average of 80% or higher in Chemistry, Physics, and Maths.",
            };

            return (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={`absolute left-4 right-4 mt-1 p-4 rounded-2xl border shadow-2xl z-50 text-xs transition-all duration-300 ${darkMode ? "bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/90" : "bg-white border-indigo-100 text-slate-850 shadow-indigo-950/15"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${activeAch.earned
                    ? (darkMode ? "bg-indigo-500/15 border border-indigo-500/20" : "bg-indigo-50 border border-indigo-100")
                    : (darkMode ? "bg-slate-800/60 border-slate-700/40" : "bg-slate-100 border border-slate-200")
                    }`}>
                    {getAchievementIcon(activeAch.id, activeAch.tier, activeAch.earned, "h-5 w-5")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="font-extrabold text-xs flex items-center gap-1.5">
                        {activeAch.title}
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r ${tierColors[activeAch.tier]} text-white shrink-0`}>
                          {tierLabel[activeAch.tier]}
                        </span>
                      </h5>
                      <button
                        onClick={() => setSelectedMobileAchievement(null)}
                        className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 text-xs font-black cursor-pointer p-0.5"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="mt-1 text-slate-500 dark:text-slate-355 font-bold leading-relaxed">
                      {activeAch.desc}
                    </p>
                    <div className={`mt-2.5 p-2 rounded-lg border text-[10px] font-bold leading-relaxed ${activeAch.earned
                      ? (darkMode ? "bg-emerald-950/25 border-emerald-900/35 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700")
                      : (darkMode ? "bg-slate-800/30 border-slate-700/20 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600")
                      }`}>
                      {activeAch.earned ? (
                        <span className="flex items-center gap-1">🏆 <strong>Earned:</strong> Requirement met! Keep going.</span>
                      ) : (
                        <span>🎯 <strong>How to unlock:</strong> {requirementHints[activeAch.id] || "Complete target milestones and quizzes."}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </>
  );
}

export function StudentAchievementsDesktop({
  student,
  darkMode,
  studentSubjects,
  overallAvg,
  chemAvg,
  physAvg,
  mathAvg,
  bioAvg
}: StudentAchievementsProps) {
  const getAchievementIcon = (id: string, tier: string, earned: boolean, className = "h-4 w-4") => {
    const tierColors: Record<string, string> = {
      bronze: earned ? "text-amber-500" : "text-slate-400",
      silver: earned ? "text-slate-300" : "text-slate-400",
      gold: earned ? "text-yellow-400" : "text-slate-400",
      platinum: earned ? "text-cyan-400 animate-pulse" : "text-slate-400",
    };

    const colorClass = tierColors[tier] || "text-slate-400";

    switch (id) {
      case "first_steps": return <Star className={`${className} ${colorClass}`} />;
      case "quiz_warrior": return <Trophy className={`${className} ${colorClass}`} />;
      case "subject_starter": return <BookOpen className={`${className} ${colorClass}`} />;
      case "on_track": return <TrendingUp className={`${className} ${colorClass}`} />;
      case "half_way": return <Sliders className={`${className} ${colorClass}`} />;
      case "chem_star": return <Award className={`${className} ${colorClass}`} />;
      case "phys_pro": return <Zap className={`${className} ${colorClass}`} />;
      case "math_maestro": return <Target className={`${className} ${colorClass}`} />;
      case "bio_star": return <Dna className={`${className} ${colorClass}`} />;
      case "quiz_addict": return <BrainCircuit className={`${className} ${colorClass}`} />;
      case "triple_threat": return <Trophy className={`${className} ${colorClass} scale-110`} />;
      case "milestone_master": return <CheckSquare className={`${className} ${colorClass}`} />;
      case "excellence": return <Sparkles className={`${className} ${colorClass}`} />;
      case "sams_scholar": return <Award className={`${className} ${colorClass} scale-110`} />;
      case "jee_ready": return <Zap className={`${className} ${colorClass} scale-110`} />;
      default: return <Award className={`${className} ${colorClass}`} />;
    }
  };

  const computeAchievements = () => {
    const totalQuizzes = student.quizStats?.totalQuizzes || 0;
    const milestoneValues = Object.values(student.milestones || {}) as boolean[][];
    const anyMilestone100 = milestoneValues.some(arr => arr && arr.length > 0 && arr.every(Boolean));
    const scoresValues = Object.values(student.scores || {}) as number[];

    const defs = [
      { id: "first_steps", title: "First Steps", desc: "Started studying at least one chapter", icon: "🌱", tier: "bronze", earned: scoresValues.some(s => s > 0) },
      { id: "quiz_warrior", title: "Quiz Warrior", desc: "Completed your first quiz", icon: "⚔️", tier: "bronze", earned: totalQuizzes >= 1 },
      {
        id: "subject_starter",
        title: "Subject Starter",
        desc: "Any subject average ≥ 10%",
        icon: "📘",
        tier: "bronze",
        earned: (studentSubjects.includes("Chemistry") && chemAvg >= 10) ||
          (studentSubjects.includes("Physics") && physAvg >= 10) ||
          (studentSubjects.includes("Mathematics") && mathAvg >= 10) ||
          (studentSubjects.includes("Biology") && bioAvg >= 10)
      },
      { id: "on_track", title: "On Track", desc: "Overall average ≥ 25%", icon: "🎯", tier: "silver", earned: overallAvg >= 25 },
      { id: "half_way", title: "Half Way There", desc: "Overall average ≥ 50%", icon: "🏃", tier: "silver", earned: overallAvg >= 50 },
    ];

    if (studentSubjects.includes("Chemistry")) defs.push({ id: "chem_star", title: "Chemistry Star", desc: "Chemistry average ≥ 60%", icon: "⚗️", tier: "silver", earned: chemAvg >= 60 });
    if (studentSubjects.includes("Physics")) defs.push({ id: "phys_pro", title: "Physics Pro", desc: "Physics average ≥ 60%", icon: "⚡", tier: "silver", earned: physAvg >= 60 });
    if (studentSubjects.includes("Mathematics")) defs.push({ id: "math_maestro", title: "Maths Maestro", desc: "Maths average ≥ 60%", icon: "📐", tier: "silver", earned: mathAvg >= 60 });
    if (studentSubjects.includes("Biology")) defs.push({ id: "bio_star", title: "Biology Star", desc: "Biology average ≥ 60%", icon: "🧬", tier: "silver", earned: bioAvg >= 60 });

    defs.push(
      { id: "quiz_addict", title: "Quiz Addict", desc: "Completed 5 or more quizzes", icon: "🧠", tier: "silver", earned: totalQuizzes >= 5 },
      {
        id: "triple_threat",
        title: "Multi-Subject Master",
        desc: "All subjects ≥ 60%",
        icon: "🏆",
        tier: "gold",
        earned: studentSubjects.length > 0 && studentSubjects.every(sub => {
          if (sub === "Chemistry") return chemAvg >= 60;
          if (sub === "Physics") return physAvg >= 60;
          if (sub === "Mathematics") return mathAvg >= 60;
          if (sub === "Biology") return bioAvg >= 60;
          return true;
        })
      },
      { id: "milestone_master", title: "Milestone Master", desc: "Completed all milestones for a topic", icon: "✅", tier: "gold", earned: anyMilestone100 },
      { id: "excellence", title: "Excellence", desc: "Overall average ≥ 75%", icon: "🌟", tier: "gold", earned: overallAvg >= 75 },
      { id: "sams_scholar", title: "SAMS Scholar", desc: "Overall average ≥ 90%", icon: "🎓", tier: "platinum", earned: overallAvg >= 90 },
      {
        id: "jee_ready",
        title: "Exam Ready",
        desc: "All subjects ≥ 80%",
        icon: "🚀",
        tier: "platinum",
        earned: studentSubjects.length > 0 && studentSubjects.every(sub => {
          if (sub === "Chemistry") return chemAvg >= 80;
          if (sub === "Physics") return physAvg >= 80;
          if (sub === "Mathematics") return mathAvg >= 80;
          if (sub === "Biology") return bioAvg >= 80;
          return true;
        })
      }
    );
    return defs;
  };

  const achievements = computeAchievements();
  const earnedCount = achievements.filter(a => a.earned).length;

  const tierColors: Record<string, string> = {
    bronze: "from-amber-600 to-amber-400",
    silver: "from-slate-400 to-slate-300",
    gold: "from-yellow-500 to-amber-400",
    platinum: "from-indigo-400 to-cyan-400",
  };
  const tierBg: Record<string, string> = {
    bronze: darkMode ? "bg-amber-950/40 border-amber-800/40" : "bg-amber-50 border-amber-200",
    silver: darkMode ? "bg-slate-800/60 border-slate-700/40" : "bg-slate-50 border-slate-200",
    gold: darkMode ? "bg-yellow-950/40 border-yellow-800/40" : "bg-yellow-50 border-yellow-200",
    platinum: darkMode ? "bg-indigo-950/40 border-indigo-800/40" : "bg-indigo-50 border-indigo-200",
  };
  const tierLabel: Record<string, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum" };

  const tierAccent: Record<string, string> = {
    bronze: darkMode ? "bg-amber-500" : "bg-amber-600",
    silver: darkMode ? "bg-slate-400" : "bg-slate-500",
    gold: darkMode ? "bg-yellow-400" : "bg-yellow-500",
    platinum: darkMode ? "bg-indigo-400" : "bg-indigo-500",
  };

  return (
    <aside className={`hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r overflow-y-auto transition-colors duration-300 ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
      <div className="p-4 border-b sticky top-0 z-10 backdrop-blur-sm" style={{ backdropFilter: "blur(12px)" }}>
        <div className={`${darkMode ? "bg-slate-800/60 border-slate-700" : "bg-indigo-50 border-indigo-100"} border rounded-2xl p-3`}>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-indigo-600" />
            <span className={`text-xs font-black uppercase tracking-widest ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Achievements</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-indigo-600">{earnedCount}</span>
            <span className={`text-[10px] font-bold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>/ {achievements.length}</span>
            <span className={`ml-auto text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${darkMode ? "bg-slate-700 text-slate-300" : "bg-indigo-100 text-indigo-700"}`}>
              {Math.round((earnedCount / achievements.length) * 100)}%
            </span>
          </div>
          <div className={`h-1.5 rounded-full mt-2.5 ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-700" style={{ width: `${(earnedCount / achievements.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3 pb-8">
        {(["bronze", "silver", "gold", "platinum"] as const).map((tier, tIdx) => {
          const tierAchievements = achievements.filter(a => a.tier === tier);
          if (tierAchievements.length === 0) return null;
          const tierEarned = tierAchievements.filter(a => a.earned).length;
          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: tIdx * 0.08, ease: "easeOut" }}
              className="space-y-1"
            >
              <div className={`flex items-center gap-2 px-1 py-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                <div className={`h-px flex-1 ${darkMode ? "bg-slate-800" : "bg-slate-200"}`} />
                <span className="text-[9px] font-black uppercase tracking-widest">{tierLabel[tier]} <span className="opacity-60">({tierEarned}/{tierAchievements.length})</span></span>
                <div className={`h-px flex-1 ${darkMode ? "bg-slate-800" : "bg-slate-200"}`} />
              </div>
              <div className="space-y-1">
                {tierAchievements.map((a, aIdx) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: tIdx * 0.08 + aIdx * 0.04, ease: "easeOut" }}
                    className={`relative flex items-start gap-2.5 p-2.5 rounded-xl border transition-all duration-200 group overflow-hidden ${a.earned
                      ? tierBg[a.tier]
                      : `${darkMode ? "bg-slate-800/20 border-slate-800/40" : "bg-slate-50 border-slate-100"} opacity-45 hover:opacity-70`
                      }`}
                  >
                    {a.earned ? (
                      <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full ${tierAccent[a.tier]}`} />
                    ) : (
                      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                        style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, currentColor 3px, currentColor 5px)" }} />
                    )}
                    <div className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center transition-all ${a.earned
                      ? (darkMode ? "bg-indigo-500/15 border border-indigo-500/20" : "bg-indigo-50 border border-indigo-100")
                      : (darkMode ? "bg-slate-800/80 border border-slate-700/60" : "bg-slate-100/80 border border-slate-200/60")
                      }`}>
                      {getAchievementIcon(a.id, a.tier, a.earned, "h-3.5 w-3.5")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`text-[11px] font-extrabold leading-tight truncate ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{a.title}</p>
                        {a.earned ? (
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r ${tierColors[a.tier]} text-white shrink-0`}>
                            {tierLabel[a.tier]}
                          </span>
                        ) : (
                          <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-slate-400/10 text-slate-400 border border-slate-400/20 shrink-0">
                            LOCKED
                          </span>
                        )}
                      </div>
                      <p className={`text-[9px] mt-0.5 leading-snug ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{a.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </aside>
  );
}
