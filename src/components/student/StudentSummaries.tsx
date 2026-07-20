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

  const subjects = getStudentSubjects(student.scores);
  const hasBiology = subjects.includes("Biology");
  const hasMaths = subjects.includes("Mathematics");
  
  let targetLabel = "JEE/NEET Level (85%+)";
  if (hasBiology && !hasMaths) {
    targetLabel = "NEET Level (90%+)";
  } else if (hasMaths && !hasBiology) {
    targetLabel = "JEE Level (90%+)";
  } else if (hasBiology && hasMaths) {
    targetLabel = "JEE/NEET Level (85%+)";
  }

  const boardsThreshold = 80;
  const competitiveThreshold = targetLabel.includes("85") ? 85 : 90;
  
  const boardsCompleted = overallAvg >= boardsThreshold;
  const competitiveCompleted = overallAvg >= competitiveThreshold;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
      {/* Overview Card */}
      <div className={`p-5 sm:p-7 rounded-3xl sm:rounded-[2rem] border transition-all duration-300 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
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
        <div className={`mt-5 sm:mt-6 pt-5 sm:pt-6 border-t flex justify-between items-center text-xs font-bold ${darkMode ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-600"}`}>
          <span>Total Syllabus</span>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-black text-slate-900 dark:text-white">
            {totalTopics} Chapters
          </span>
        </div>
      </div>

      {/* Global Prep Gauge */}
      <div className={`p-5 sm:p-7 rounded-3xl sm:rounded-[2rem] border transition-all duration-300 flex items-center justify-between gap-6 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="space-y-3 flex-1 min-w-0">
          <h3 className={`text-xs font-black uppercase tracking-widest ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Preparation Rating
          </h3>
          <p className={`text-[10px] sm:text-xs font-semibold leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Your aggregate performance index across all subjects. Keep testing yourself to boost this score.
          </p>
          <div className="flex flex-col items-start gap-2">
            {/* Primary Target */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl ${(!boardsCompleted ? false : competitiveCompleted) ? 'opacity-70' : ''}`}>
              <span className={`text-xs font-black uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                {(!boardsCompleted ? false : competitiveCompleted) ? "Goal Reached:" : "Current Target:"}
              </span>
              <span className={`text-sm font-black ${(!boardsCompleted ? "text-sky-600 dark:text-sky-400" : "text-emerald-600 dark:text-emerald-400")} ${(!boardsCompleted ? false : competitiveCompleted) ? 'line-through decoration-2' : ''}`}>
                {!boardsCompleted ? "Boards (80%+)" : targetLabel}
              </span>
            </div>
            {/* Secondary Target */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800/50 ${(boardsCompleted) ? 'opacity-50' : ''}`}>
              <span className={`text-[10px] font-extrabold uppercase ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                {(boardsCompleted) ? "Completed:" : "Next Target:"}
              </span>
              <span className={`text-[10px] font-black ${(boardsCompleted ? "text-sky-600 dark:text-sky-400" : "text-emerald-600 dark:text-emerald-400")} ${(boardsCompleted) ? 'line-through decoration-1' : ''}`}>
                {boardsCompleted ? "Boards (80%+)" : targetLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
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
            <span className="text-xl sm:text-3xl font-black tracking-tighter" style={{ color }}>
              <AnimatedCounter value={overallAvg} />
            </span>
            <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest -mt-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Score</span>
          </div>
        </div>
      </div>
    </div>
  );
}
