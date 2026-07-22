import React from "react";
import { Student, getStudentSubjects } from "../../types";
import { getProgressColor } from "./shared";
import AnimatedCounter from "./AnimatedCounter"; // Will create or move this later, actually it's in StudentView.tsx currently. I should probably move it to shared.tsx or AnimatedCounter.tsx.

interface StudentSummariesProps {
  student: Student;
  darkMode: boolean;
  overallAvg: number;
  totalTopics: number;
  topicsAttempted: number;
  completedTopics: number;
}

export default function StudentSummaries({
  student,
  darkMode,
  overallAvg,
  totalTopics,
  topicsAttempted,
  completedTopics
}: StudentSummariesProps) {
  // SVG Gauge calculations
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallAvg / 100) * circumference;
  const color = getProgressColor(overallAvg);

  const targets = [
    { label: "Foundation Level", threshold: 40, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-950/30" },
    { label: "Boards Level", threshold: 80, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Competitive Level", threshold: 90, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30" },
  ];
  
  const currentTargetIndex = targets.findIndex(t => overallAvg < t.threshold);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
      {/* Overview Card */}
      <div className={`p-3 sm:p-4 lg:p-6 rounded-2xl sm:rounded-[2rem] border transition-all duration-300 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <h3 className={`text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 sm:mb-3 lg:mb-4 flex items-center gap-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Curriculum Coverage Summary
        </h3>
        <div className="flex justify-between items-end">
          <div className="space-y-1 sm:space-y-2">
            <p className="text-3xl sm:text-5xl font-black font-display tracking-tight text-indigo-600 dark:text-indigo-400">
              <AnimatedCounter value={topicsAttempted} />
            </p>
            <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Chapters Initiated
            </p>
          </div>
          <div className="h-10 sm:h-12 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1 sm:space-y-2 text-right">
            <p className="text-2xl sm:text-4xl font-black font-display tracking-tight text-emerald-600 dark:text-emerald-400">
              <AnimatedCounter value={completedTopics} />
            </p>
            <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Fully Mastered
            </p>
          </div>
        </div>
        <div className={`mt-2 sm:mt-3 lg:mt-4 pt-2 sm:pt-3 lg:pt-4 border-t flex justify-between items-center text-xs font-bold ${darkMode ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-600"}`}>
          <span>Total Syllabus</span>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-black text-slate-900 dark:text-white">
            {totalTopics} Chapters
          </span>
        </div>
      </div>

      {/* Global Prep Gauge */}
      <div className={`p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-[2rem] border transition-all duration-300 flex items-start justify-between gap-4 sm:gap-5 lg:gap-6 h-full ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex flex-col flex-1 min-w-0 min-h-0 h-full gap-2 sm:gap-3">
          <div className="shrink-0">
            <h3 className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Preparation Rating
            </h3>
            <p className={`text-[10px] sm:text-xs font-semibold leading-relaxed mt-0.5 sm:mt-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Your aggregate performance index.
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 sm:gap-1.5 w-full flex-1 overflow-y-auto min-h-0 pr-1">
            {targets.map((t, i) => {
              const completed = overallAvg >= t.threshold;
              const isCurrent = i === currentTargetIndex;
              const isNext = i > currentTargetIndex;
              return (
                <div
                  key={t.label}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all w-full ${completed ? "opacity-60" : isCurrent ? `${t.bg} scale-[1.02] shadow-sm` : "opacity-40"}`}
                >
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 transition-all ${completed ? "bg-emerald-500" : isCurrent ? "bg-indigo-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"}`} />
                  <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {completed ? "Done:" : isCurrent ? "Target:" : "Next:"}
                  </span>
                  <span className={`text-[10px] sm:text-xs font-black whitespace-nowrap ${completed ? `${t.color} line-through decoration-1` : isCurrent ? t.color : `${darkMode ? "text-slate-500" : "text-slate-400"}`}`}>
                    {t.label} ({t.threshold}%+)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative w-14 h-14 sm:w-20 sm:h-20 lg:w-28 lg:h-28 shrink-0 flex items-center justify-center self-center sm:self-start mt-0 sm:mt-1">
          <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="12" fill="none" />
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke={color}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              style={{ strokeDasharray: circumference, strokeDashoffset, transition: "stroke-dashoffset 1.5s ease-out, stroke 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm sm:text-xl lg:text-3xl font-black tracking-tighter" style={{ color }}>
              <AnimatedCounter value={overallAvg} />
            </span>
            <span className={`text-[5px] sm:text-[8px] lg:text-[10px] font-black uppercase tracking-widest -mt-0.5 sm:-mt-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Score</span>
          </div>
        </div>
      </div>
    </div>
  );
}
