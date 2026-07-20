import React, { useRef, useEffect } from "react";
import { Sun, Moon, LogOut, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SAMSLogo from "../SAMSLogo";
import { getInitials, playChime } from "./shared";
import { gsap } from "../../lib/gsap";
import { Student } from "../../types";

interface StudentNavbarProps {
  student: Student;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onLogout: () => void;
  showProfilePopup: boolean;
  setShowProfilePopup: (val: boolean) => void;
  studentSubjects: string[];
}

export default function StudentNavbar({
  student,
  darkMode,
  setDarkMode,
  onLogout,
  showProfilePopup,
  setShowProfilePopup,
  studentSubjects
}: StudentNavbarProps) {
  const darkToggleRef = useRef<HTMLButtonElement>(null);

  // Gamified interaction on dark mode
  const handleToggleDark = () => {
    setDarkMode(!darkMode);
    playChime(!darkMode);
    if (darkToggleRef.current) {
      gsap.fromTo(darkToggleRef.current, { rotate: -120, scale: 0.6 }, { rotate: 0, scale: 1, duration: 0.5, ease: "back.out(2)" });
    }
  };

  return (
    <>
      <header className={`px-6 py-4 flex justify-between items-center border-b shrink-0 z-10 transition-colors duration-300 ${darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <SAMSLogo size={32} />
          <span className="font-bold text-lg tracking-tight text-[#0f2d4a] dark:text-white">
            SAMS <span className="text-[#3b6b95]">Analytics</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            ref={darkToggleRef}
            onClick={handleToggleDark}
            className={`p-2.5 rounded-xl border transition-all ${darkMode ? "bg-slate-800 border-slate-700 text-yellow-400" : "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            title="Toggle Dark Canvas"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div
            onClick={() => setShowProfilePopup(true)}
            className="flex items-center gap-3 cursor-pointer hover:opacity-85 active:scale-95 transition-all group"
            title="View Academic Profile"
          >
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">Class {(student.classId || "xii-a").toUpperCase()} Roll {student.rollNo}</p>
              <p className="text-xs font-extrabold">{student.name}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs tracking-tight shadow-md shadow-indigo-600/10 uppercase transition-transform group-hover:scale-105">
              {getInitials(student.name)}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onLogout(); }}
              className={`p-2.5 rounded-xl border transition-all hover:text-rose-600 hover:bg-rose-50 ${darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-400"
                }`}
              title="Close Portal"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showProfilePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfilePopup(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className={`relative w-[90%] max-w-xs sm:max-w-md rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 border shadow-2xl z-10 overflow-hidden font-sans ${darkMode ? "bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/90" : "bg-white border-slate-200 text-slate-800 shadow-indigo-950/10"
                }`}
            >
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#3b6b95] dark:text-[#88b0d6] font-display">
                  SAMS Student Profile
                </span>
                <button
                  onClick={() => setShowProfilePopup(false)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#3b6b95] text-white font-black text-base sm:text-xl tracking-tight shadow-lg shadow-[#3b6b95]/15 flex items-center justify-center uppercase mb-2 sm:mb-3">
                  {getInitials(student.name)}
                </div>
                <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-none mb-1">
                  {student.name}
                </h3>
                <span className="text-[9px] sm:text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                  Class XII Student Portal
                </span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="grid grid-cols-3 text-[11px] sm:text-xs py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-450 dark:text-slate-555 font-bold uppercase tracking-wider">Roll Number</span>
                  <span className="col-span-2 font-mono font-black text-right">{student.rollNo}</span>
                </div>
                <div className="grid grid-cols-3 text-[11px] sm:text-xs py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-450 dark:text-slate-555 font-bold uppercase tracking-wider">Class ID</span>
                  <span className="col-span-2 font-black text-right uppercase">{(student.classId || "xii-a")}</span>
                </div>
                <div className="grid grid-cols-3 text-[11px] sm:text-xs py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-450 dark:text-slate-555 font-bold uppercase tracking-wider">Mobile No</span>
                  <span className="col-span-2 font-mono font-bold text-right">{student.phone || "Not Registered"}</span>
                </div>
                {student.email && (
                  <div className="grid grid-cols-3 text-[11px] sm:text-xs py-1 border-b border-slate-50 dark:border-slate-800/40">
                    <span className="text-slate-450 dark:text-slate-555 font-bold uppercase tracking-wider">Email Address</span>
                    <span className="col-span-2 font-mono font-semibold text-right text-slate-600 dark:text-slate-300 break-all">{student.email}</span>
                  </div>
                )}

                <div className="pt-1.5 sm:pt-2">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block mb-1.5 sm:mb-2">
                    Class Faculty Members
                  </span>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 font-sans">
                    {studentSubjects.includes("Chemistry") && (
                      <div className="flex justify-between items-center text-[11px] sm:text-xs">
                        <span className="font-bold text-slate-500 dark:text-slate-400">Chemistry</span>
                        <span className="font-extrabold text-[#3b6b95]">Dr. Pradeep Gusain</span>
                      </div>
                    )}
                    {studentSubjects.includes("Physics") && (
                      <div className="flex justify-between items-center text-[11px] sm:text-xs">
                        <span className="font-bold text-slate-500 dark:text-slate-400">Physics</span>
                        <span className="font-extrabold text-[#3b6b95]">Narendra Kumar</span>
                      </div>
                    )}
                    {studentSubjects.includes("Mathematics") && (
                      <div className="flex justify-between items-center text-[11px] sm:text-xs">
                        <span className="font-bold text-slate-500 dark:text-slate-400">Mathematics</span>
                        <span className="font-extrabold text-[#3b6b95]">Tarun Makkar</span>
                      </div>
                    )}
                    {studentSubjects.includes("Biology") && (
                      <div className="flex justify-between items-center text-[11px] sm:text-xs">
                        <span className="font-bold text-slate-500 dark:text-slate-400">Biology</span>
                        <span className="font-extrabold text-[#3b6b95]">Manishi Chawla</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowProfilePopup(false)}
                className="w-full mt-4 sm:mt-6 py-2.5 sm:py-3 bg-[#3b6b95] hover:bg-[#2c5375] text-white rounded-xl sm:rounded-2xl text-sm font-bold shadow-md shadow-[#3b6b95]/15 transition-all cursor-pointer text-center font-sans"
              >
                Close Profile
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
