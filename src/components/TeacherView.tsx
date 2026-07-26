import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { gsap, useGSAP } from "../lib/gsap";
import { playChime } from "./student/shared";
import {
  Users,
  TrendingDown,
  Search,
  ArrowUpDown,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  Edit,
  ClipboardCheck,
  LogOut,
  GraduationCap,
  Sparkles,
  BookOpen,
  Mail,
  History,
  Moon,
  Sun
} from "lucide-react";
import { Student, CHEMISTRY_TOPICS, PHYSICS_TOPICS, MATHS_TOPICS, BIOLOGY_TOPICS, getStudentSubjects } from "../types";
import { fetchWithRetry } from "../lib/fetch";
import SAMSLogo from "./SAMSLogo";


const getProgressColor = (score: number, alpha = 1) => {
  const s = Math.max(0, Math.min(100, score));
  // 0-50: Red (0) to Amber (45)
  // 50-100: Amber (45) to Emerald (140)
  const hue = s <= 50 ? (s / 50) * 45 : 45 + ((s - 50) / 50) * 95;
  return `hsla(${Math.round(hue)}, 85%, 45%, ${alpha})`;
};

const getStudentDiagnostic = (s: Student, subject: string, topics: readonly string[]) => {
  const scores = topics.map(t => s.scores?.[t] || 0);
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  let lowestScore = 101;
  let weakestTopic = topics[0] || "General";
  let highestScore = -1;
  let strongestTopic = topics[0] || "General";
  let zeroCount = 0;
  let masteredCount = 0;

  topics.forEach(t => {
    const sc = s.scores?.[t] || 0;
    if (sc === 0) zeroCount++;
    if (sc >= 80) masteredCount++;
    if (sc < lowestScore) {
      lowestScore = sc;
      weakestTopic = t;
    }
    if (sc > highestScore) {
      highestScore = sc;
      strongestTopic = t;
    }
  });

  const totalQuizzes = s.quizStats?.totalQuizzes || 0;

  let isInactive = true;
  let daysInactiveStr = "No activity recorded";
  if (s.recentSessions && s.recentSessions.length > 0) {
    const latestSessionTime = new Date(s.recentSessions[0].timestamp).getTime();
    const days = Math.floor((Date.now() - latestSessionTime) / (1000 * 60 * 60 * 24));
    daysInactiveStr = days === 0 ? "Active today" : `${days}d ago`;
    if (days <= 7) isInactive = false;
  }

  let priority: "critical" | "warning" | "success" | "info" = "info";
  let actionTitle = "";
  let suggestion = "";
  let badgeLabel = "";

  if (isInactive) {
    priority = "critical";
    badgeLabel = "Inactivity Alert";
    actionTitle = "Schedule Direct Check-in";
    suggestion = `No activity recorded recently. Recommend following up with Roll #${s.rollNo} (${s.name}) to ensure syllabus alignment.`;
  } else if (avg < 35 || zeroCount >= Math.ceil(topics.length / 2)) {
    priority = "critical";
    badgeLabel = "Needs Remediation";
    actionTitle = `Focus on ${weakestTopic}`;
    suggestion = `Current ${subject} average is ${avg}%. Recommend starting with fundamental concept checkpoints in ${weakestTopic} (${lowestScore}%).`;
  } else if (totalQuizzes === 0 && avg > 30) {
    priority = "warning";
    badgeLabel = "Quiz Check Needed";
    actionTitle = "Assign AI Practice Quiz";
    suggestion = `Checklist progress logged, but 0 quizzes completed. Suggest triggering a 5-question AI practice quiz to test retention.`;
  } else if (avg >= 85 && masteredCount >= Math.floor(topics.length * 0.6)) {
    priority = "success";
    badgeLabel = "Exam Ready";
    actionTitle = "Exemplary Momentum";
    suggestion = `Outstanding ${subject} performance (${avg}% mean across ${masteredCount} topics). Ready for advanced level problem sets.`;
  } else {
    priority = "info";
    badgeLabel = "Steady Progress";
    actionTitle = `Target ${weakestTopic}`;
    suggestion = `Progressing steadily at ${avg}%. Focus next on boosting ${weakestTopic} (${lowestScore}%) to push overall score above 80%.`;
  }

  return {
    avg,
    weakestTopic,
    lowestScore,
    strongestTopic,
    highestScore,
    masteredCount,
    zeroCount,
    totalQuizzes,
    isInactive,
    daysInactiveStr,
    priority,
    badgeLabel,
    actionTitle,
    suggestion,
  };
};

interface TeacherViewProps {
  passcode: string;
  onLogout: () => void;
}

export default function TeacherView({ passcode, onLogout }: TeacherViewProps) {
  const getTeacherDetails = (pass: string) => {
    const p = pass.toUpperCase();
    if (p === "PHYS12A" || p === "NARENDRA12" || p === "SATISH12") {
      return { name: "Mr. Narendra Kumar", role: "Physics Faculty", subject: "Physics" as const, initials: "NK", classLabel: "Class XII-A & XII-B", classes: ["xii-a", "xii-b"] };
    }
    if (p === "MATH12A" || p === "TARUN12" || p === "AMIT12") {
      return { name: "Mr. Tarun Makkar", role: "Mathematics Faculty", subject: "Mathematics" as const, initials: "TM", classLabel: "Class XII-A & XII-B", classes: ["xii-a", "xii-b"] };
    }
    if (p === "BIO12A" || p === "MANISHI12" || p === "BIO12B") {
      return { name: "Ms. Manishi Chawla", role: "Biology Faculty / Class XII-B Coordinator", subject: "Biology" as const, initials: "MC", classLabel: "Class XII-B", classes: ["xii-b"] };
    }
    return { name: "Dr. Pradeep Gusain", role: "Class XII-A Coordinator", subject: "Chemistry" as const, initials: "PG", classLabel: "Class XII-A & XII-B", classes: ["xii-a", "xii-b"] };
  };

  const [teacherDetails, setTeacherDetails] = useState(getTeacherDetails(passcode));

  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rollNo" | "name" | "average">("rollNo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [rollNoFilter, setRollNoFilter] = useState("");
  const [classFilter, setClassFilter] = useState<"all" | "xii-a" | "xii-b">(
    getTeacherDetails(passcode).classes.length === 1 ? (getTeacherDetails(passcode).classes[0] as any) : "all"
  );

  // Active Subject Selection State
  const [activeSubject, setActiveSubject] = useState<"Chemistry" | "Physics" | "Mathematics" | "Biology">(teacherDetails.subject);

  // Chapter Summary Filter, Sort, & Selection State
  const [chapterSearch, setChapterSearch] = useState("");
  const [chapterSort, setChapterSort] = useState<"syllabus" | "lowest" | "highest">("syllabus");
  const [chapterFilter, setChapterFilter] = useState<"all" | "attention" | "mastered">("all");
  const [selectedChapterName, setSelectedChapterName] = useState<string | null>(null);



  // Score & Email editor states
  const [editScores, setEditScores] = useState<Record<string, number>>({});
  const [editEmail, setEditEmail] = useState("");
  const [savingScores, setSavingScores] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const darkToggleRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo("#teacher-nav-bar", { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
      .fromTo("#subject-switcher", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.2")
      .fromTo("#metric-cards > div", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, "-=0.15")
      .fromTo("#analytics-section", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.2")
      .fromTo("#chapter-progress-list > div", { y: 20, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.04 }, "-=0.2")
      .fromTo("#student-table-section", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.2");
  }, { scope: containerRef });

  const handleToggleDark = () => {
    setDarkMode(!darkMode);
    playChime(!darkMode);
    if (darkToggleRef.current) {
      gsap.fromTo(darkToggleRef.current, { rotate: -120, scale: 0.6 }, { rotate: 0, scale: 1, duration: 0.5, ease: "back.out(2)" });
    }
  };

  // Determine active topics list based on selected subject
  const activeTopics = activeSubject === "Physics"
    ? PHYSICS_TOPICS
    : (activeSubject === "Mathematics"
      ? MATHS_TOPICS
      : (activeSubject === "Biology" ? BIOLOGY_TOPICS : CHEMISTRY_TOPICS));

  // Load class data on mount
  const fetchClassData = async () => {
    try {
      // 1. Fetch dynamic teacher profile
      const profileRes = await fetchWithRetry("/api/teacher/profile", {
        headers: { "x-teacher-passcode": passcode },
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        const rawName = data.name || "Dr. Pradeep Gusain";
        const normalizedName = rawName === "Mr. Pradeep Gusain" || rawName === "Pradeep Gusain"
          ? "Dr. Pradeep Gusain"
          : rawName;
        const initials = normalizedName.split(" ").filter((n: string) => !n.includes(".")).map((n: string) => n[0]).join("").toUpperCase() || "T";
        const subject = data.subject;
        const classes = data.classes || (subject === "Biology" ? ["xii-b"] : ["xii-a", "xii-b"]);
        const role = subject === "Biology" 
          ? "Biology Faculty / Class XII-B Coordinator" 
          : (subject === "Chemistry" ? "Class XII-A Coordinator" : `${subject} Faculty`);
        const classLabel = classes.length > 1
          ? "Class XII-A & XII-B"
          : `Class ${classes[0].toUpperCase()}`;
        
        setTeacherDetails({
          name: normalizedName,
          role,
          subject,
          initials,
          classLabel,
          classes
        });
        setActiveSubject(subject);
        if (classes.length === 1) {
          setClassFilter(classes[0]);
        } else {
          setClassFilter("all");
        }
      }

      // 2. Fetch students list
      const classRes = await fetchWithRetry("/api/students", {
        headers: { "x-teacher-passcode": passcode },
      });

      if (classRes.ok) {
        const classList = await classRes.json();
        setStudents(classList);
      }
    } catch (err) {
      console.error("Error fetching class data:", err);
    }
  };

  useEffect(() => {
    fetchClassData();
  }, [passcode]);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (selectedStudent) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedStudent]);

  // Handle student score and email save
  const handleSaveScores = async () => {
    if (!selectedStudent) return;
    setSavingScores(true);
    setSaveSuccess(false);

    try {
      // 1. Save scores/milestones update requests sequentially or concurrently for the active subject's topics
      const promises = activeTopics.map(async (topic) => {
        const originalScore = selectedStudent.scores[topic] || 0;
        const newScore = editScores[topic] !== undefined ? editScores[topic] : originalScore;

        if (originalScore !== newScore) {
          let milestonesArr = selectedStudent.milestones?.[topic] || [false, false, false, false];
          if (newScore === 100) {
            milestonesArr = [true, true, true, true];
          } else if (newScore === 0) {
            milestonesArr = [false, false, false, false];
          }

          await fetchWithRetry(`/api/student/${selectedStudent.rollNo}/score`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-teacher-passcode": passcode,
            },
            body: JSON.stringify({ topic, score: newScore, milestones: milestonesArr, classId: selectedStudent.classId || "xii-a" }),
          });
        }
      });

      await Promise.all(promises);

      // 2. Save student's registered Google Gmail if modified
      if ((selectedStudent.email || "").trim().toLowerCase() !== editEmail.trim().toLowerCase()) {
        await fetchWithRetry(`/api/student/${selectedStudent.rollNo}/email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-teacher-passcode": passcode,
          },
          body: JSON.stringify({ email: editEmail.trim().toLowerCase(), classId: selectedStudent.classId || "xii-a" }),
        });
      }

      setSaveSuccess(true);
      // Refresh class data
      await fetchClassData();

      // Update selectedStudent with new values
      const updatedStudents = students.map((s) => {
        if (s.rollNo === selectedStudent.rollNo) {
          return {
            ...s,
            scores: { ...s.scores, ...editScores },
            email: editEmail,
          };
        }
        return s;
      });
      const refreshedS = updatedStudents.find((s) => s.rollNo === selectedStudent.rollNo);
      if (refreshedS) setSelectedStudent(refreshedS);

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving student portfolio:", err);
    } finally {
      setSavingScores(false);
    }
  };

  // Calculations for charts and metrics
  const subjectStudents = students.filter(s => {
    const matchesSubject = getStudentSubjects(s.scores).includes(activeSubject);
    const matchesClass = classFilter === "all" || s.classId === classFilter;
    return matchesSubject && matchesClass;
  });
  const totalStudents = subjectStudents.length;

  const getScoreStatus = (score: number) => {
    let label = "Needs Attention";
    if (score >= 80) label = "Mastered";
    else if (score >= 60) label = "Strong";
    else if (score >= 40) label = "Developing";
    return { 
      label, 
      color: getProgressColor(score),
      bg: getProgressColor(score, 0.15)
    };
  };

  const calculateStudentAvg = (s: Student) => {
    const scores = activeTopics.map(t => s.scores[t] || 0);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length);
  };

  const classAvg = totalStudents > 0
    ? Math.round(subjectStudents.reduce((sum, s) => sum + calculateStudentAvg(s), 0) / totalStudents)
    : 0;


  // Calculate topic-specific averages, top quartile benchmarks, and student counts for static summary
  const topicAverages = activeTopics.map((topic, index) => {
    let sum = 0;
    const scores = subjectStudents.map((s) => s.scores?.[topic] || 0);
    scores.forEach((sc) => { sum += sc; });
    const avg = totalStudents > 0 ? Math.round(sum / totalStudents) : 0;

    // Top 25% Quartile average
    const sorted = [...scores].sort((a, b) => b - a);
    const topCutoff = Math.max(1, Math.ceil(totalStudents * 0.25));
    const topQuartile = sorted.slice(0, topCutoff);
    const topAvg = topQuartile.length > 0 ? Math.round(topQuartile.reduce((a, b) => a + b, 0) / topQuartile.length) : avg;

    const highCount = scores.filter((sc) => sc >= 75).length;
    const proficientCount = scores.filter((sc) => sc >= 60 && sc < 75).length;
    const strugglingCount = scores.filter((sc) => sc < 50).length;

    return {
      index: index + 1,
      name: topic,
      avg,
      topAvg,
      highCount,
      proficientCount,
      strugglingCount,
    };
  });

  const masteredCount = topicAverages.filter((t) => t.avg >= 75).length;
  const attentionCount = topicAverages.filter((t) => t.avg < 60).length;

  const displayedTopics = topicAverages
    .filter((t) => {
      const matchesSearch = chapterSearch.trim() === "" || t.name.toLowerCase().includes(chapterSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (chapterFilter === "attention") return t.avg < 60;
      if (chapterFilter === "mastered") return t.avg >= 75;
      return true;
    })
    .sort((a, b) => {
      if (chapterSort === "lowest") return a.avg - b.avg;
      if (chapterSort === "highest") return b.avg - a.avg;
      return a.index - b.index;
    });

  const selectedChapterData = topicAverages.find((t) => t.name === selectedChapterName);

  // Find most challenging chapter in the current subject
  let mostChallengingChapter = "None";
  let lowestAvg = 100;
  if (subjectStudents.length > 0) {
    topicAverages.forEach((t) => {
      if (t.avg < lowestAvg) {
        lowestAvg = t.avg;
        mostChallengingChapter = t.name;
      }
    });
  }

  // Filter and sort class list
  const filteredStudents = subjectStudents
    .filter((s) => {
      const q = searchQuery.toLowerCase();
      const rollMatch = rollNoFilter.trim() === "" || s.rollNo.toString() === rollNoFilter.trim();
      const textMatch = (
        s.name.toLowerCase().includes(q) ||
        s.rollNo.toString().includes(q) ||
        s.phone.includes(q) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
      return rollMatch && textMatch;
    })
    .sort((a, b) => {
      const classA = a.classId || "xii-a";
      const classB = b.classId || "xii-a";
      if (classA !== classB) {
        return classA.localeCompare(classB);
      }

      let comparison = 0;
      if (sortBy === "rollNo") {
        comparison = a.rollNo - b.rollNo;
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "average") {
        comparison = calculateStudentAvg(a) - calculateStudentAvg(b);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (field: "rollNo" | "name" | "average") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div ref={containerRef} id="teacher-view-container" className={`min-h-screen transition-colors duration-300 font-sans flex flex-col ${darkMode ? "bg-slate-950 text-slate-100 dark" : "bg-[#eaf4fc] text-slate-900"}`}>
      {/* Sleek Navigation Bar */}
      <nav id="teacher-nav-bar" className={`px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 z-10 transition-colors duration-300 ${darkMode ? "bg-slate-900/80 border-b border-slate-800" : "bg-white border-b border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <SAMSLogo size={36} />
          <span className="font-bold text-xl tracking-tight text-[#0f2d4a] dark:text-white">SAMS <span className="text-[#3b6b95]">Analytics</span></span>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:gap-6 justify-center sm:justify-end">
          <button
            ref={darkToggleRef}
            onClick={handleToggleDark}
            className={`p-2.5 rounded-xl border transition-all ${darkMode ? "bg-slate-800 border-slate-700 text-yellow-400" : "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800"}`}
            title="Toggle Dark Canvas"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${darkMode ? "bg-blue-950/40 border-blue-800/40" : "bg-blue-50/50 border-blue-200/40"}`}>
            <span className="text-xs font-semibold text-[#3b6b95] uppercase tracking-wider">Teacher Terminal</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase leading-none mb-1">{teacherDetails.role}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">{teacherDetails.name}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50/50 border-2 border-blue-200/40 shadow-sm flex items-center justify-center font-bold text-[#3b6b95] text-xs uppercase" title={teacherDetails.name}>
              {teacherDetails.initials}
            </div>
            <motion.button
              id="teacher-logout-button"
              onClick={onLogout}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className={`p-2 rounded-xl transition-colors ${darkMode ? "text-slate-400 hover:text-rose-400 hover:bg-rose-950/30" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"}`}
              title="Close Session"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Main Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-10 sm:space-y-12 md:space-y-14 overflow-y-auto">

        {/* Core Multi-Subject Switcher */}
        <div id="subject-switcher" className={`p-1.5 rounded-2xl border flex gap-3 ${darkMode ? "bg-slate-800/50 border-slate-700/30" : "bg-slate-200/50 border-slate-300/30"}`}>
          {[
            { id: "Chemistry", color: "text-amber-800 bg-amber-500/15" },
            { id: "Physics", color: "text-blue-800 bg-blue-500/15" },
            { id: "Mathematics", color: "text-violet-800 bg-violet-500/15" },
            { id: "Biology", color: "text-emerald-800 bg-emerald-500/15" }
          ].filter((sub) => sub.id === teacherDetails.subject).map((sub) => (
            <motion.button
              key={sub.id}
              onClick={() => {
                setActiveSubject(sub.id as any);
                setSelectedStudent(null);
              }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-sm tracking-tight transition-shadow flex items-center justify-center gap-2 shadow-md cursor-pointer ${darkMode ? "bg-slate-800 text-indigo-300 border border-slate-700/50" : "bg-white text-indigo-700 border border-slate-200/50"}`}
            >
              <span>{sub.id} Monitor</span>
              <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${sub.color}`}>
                Active
              </span>
            </motion.button>
          ))}
        </div>

        {/* Core Metric Cards */}
        <div id="metric-cards" className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: Total Students */}
          <motion.div
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`p-6 rounded-[1.5rem] shadow-xl flex items-center justify-between ${darkMode ? "glass-panel-dark bg-slate-900/50 border-slate-800 shadow-slate-950/90" : "glass-panel bg-white border-slate-200/50 shadow-slate-100/40"}`}
          >
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-display">
                Total Class Size
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1 font-display">{totalStudents}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">{teacherDetails.classLabel} Student List</span>
            </div>
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -5, 0] }}
              transition={{ duration: 0.5 }}
              className={`p-4 rounded-2xl shrink-0 ${darkMode ? "bg-indigo-950/60 text-indigo-400" : "bg-indigo-50 text-indigo-500"}`}
            >
              <Users className="h-6 w-6" />
            </motion.div>
          </motion.div>

          {/* Card 2: Class Average */}
          <motion.div
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`p-6 rounded-[1.5rem] shadow-xl flex items-center justify-between ${darkMode ? "glass-panel-dark bg-slate-900/50 border-slate-800 shadow-slate-950/90" : "glass-panel bg-white border-slate-200/50 shadow-slate-100/40"}`}
          >
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-display">
                {activeSubject} Average
              </span>
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 block mt-1 font-display">{classAvg}%</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">Class Mean Mastery</span>
            </div>
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -5, 0] }}
              transition={{ duration: 0.5 }}
              className={`p-4 rounded-2xl shrink-0 ${darkMode ? "bg-indigo-950/60 text-indigo-400" : "bg-indigo-50 text-indigo-500"}`}
            >
              <GraduationCap className="h-6 w-6" />
            </motion.div>
          </motion.div>

          {/* Card 3: Most Challenging */}
          <motion.div
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`p-6 rounded-[1.5rem] shadow-xl flex items-center justify-between ${darkMode ? "glass-panel-dark bg-slate-900/50 border-slate-800 shadow-slate-950/90" : "glass-panel bg-white border-slate-200/50 shadow-slate-100/40"}`}
          >
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-display">
                Challenging {activeSubject} Chapter
              </span>
              <span className="text-sm font-black text-slate-800 dark:text-white block mt-2 line-clamp-1 font-display" title={mostChallengingChapter}>
                {mostChallengingChapter}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">Lowest Mean: {lowestAvg}%</span>
            </div>
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -5, 0] }}
              transition={{ duration: 0.5 }}
              className={`p-4 rounded-2xl shrink-0 ${darkMode ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-500"}`}
            >
              <TrendingDown className="h-6 w-6" />
            </motion.div>
          </motion.div>
        </div>

        {/* Performance Analytics Section - Enhanced Static Summary */}
        <section id="analytics-section" className={`p-6 rounded-[1.5rem] shadow-xl space-y-5 ${darkMode ? "glass-panel-dark bg-slate-900/50 border-slate-800 shadow-slate-950/90" : "glass-panel bg-white shadow-slate-100/40"}`}>
          {/* Header & Quick Summary Badges */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                  {activeSubject} Class Performance Analytics
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Chapter Overview
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Class average mastery score per chapter across {subjectStudents.length} enrolled learners
              </p>
            </div>

            {/* Quick Summary Pill Counters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${darkMode ? "bg-slate-800/80 border-slate-700 text-slate-300" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                <span className="text-slate-400">Total:</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400">{activeTopics.length}</span>
              </div>
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${darkMode ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Mastered (≥75%):</span>
                <span className="font-black">{masteredCount}</span>
              </div>
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${darkMode ? "bg-rose-950/40 border-rose-800/60 text-rose-300" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Needs Focus (&lt;60%):</span>
                <span className="font-black">{attentionCount}</span>
              </div>
            </div>
          </div>

          {/* Search, Filter & Sort Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Chapter Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Filter chapter by name..."
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${
                  darkMode ? "bg-slate-800/70 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
              />
            </div>

            <div className="flex items-center gap-2.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
              {/* Category Filter Pills */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                <motion.button
                  onClick={() => setChapterFilter("all")}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    chapterFilter === "all"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  All
                </motion.button>
                <motion.button
                  onClick={() => setChapterFilter("attention")}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    chapterFilter === "attention"
                      ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Needs Focus
                </motion.button>
                <motion.button
                  onClick={() => setChapterFilter("mastered")}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    chapterFilter === "mastered"
                      ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Mastered
                </motion.button>
              </div>

              {/* Sort Selector */}
              <select
                value={chapterSort}
                onChange={(e) => setChapterSort(e.target.value as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500/25 cursor-pointer ${
                  darkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <option value="syllabus">Syllabus Order</option>
                <option value="lowest">Lowest Mean First</option>
                <option value="highest">Highest Mean First</option>
              </select>
            </div>
          </div>



          {/* Chapter Progress Bars List */}
          <div id="chapter-progress-list" className="overflow-y-auto max-h-[420px] pr-1 space-y-2.5 scrollbar-thin pt-1">
            {displayedTopics.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No chapters match your search filter criteria.
              </div>
            ) : (
              displayedTopics.map((t) => {
                const pct = t.avg;
                const tone = getScoreStatus(pct);
                const isSelected = selectedChapterName === t.name;

                // Custom status badge label
                let badgeLabel = "On Track";
                let badgeStyle = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
                if (pct >= 75) {
                  badgeLabel = "Mastered";
                  badgeStyle = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
                } else if (pct < 45) {
                  badgeLabel = "Critical Focus";
                  badgeStyle = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
                } else if (pct < 60) {
                  badgeLabel = "Needs Focus";
                  badgeStyle = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
                }

                return (
                  <motion.div
                    layout
                    key={t.name}
                    onClick={() => setSelectedChapterName(isSelected ? null : t.name)}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`p-3 rounded-xl border transition-shadow cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/90 dark:bg-slate-800 border-indigo-500/50 shadow-md ring-2 ring-indigo-500/20"
                        : darkMode
                        ? "bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70"
                        : "bg-slate-50/60 border-slate-200/70 hover:border-indigo-200 hover:bg-indigo-50/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-black text-slate-400 w-5 shrink-0">
                          #{t.index}
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate" title={t.name}>
                          {t.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${badgeStyle}`}>
                          {badgeLabel}
                        </span>
                        <span className="text-xs sm:text-sm font-black w-12 text-right" style={{ color: tone.color }}>
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Gradient Filled Progress Bar */}
                    <div className="w-full h-3 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden p-0.5">
                      <motion.div
                        layout
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                        className="h-full rounded-full shadow-xs"
                        style={{ backgroundColor: tone.color, boxShadow: `0 0 8px ${tone.color}44` }}
                      />
                    </div>
                    </motion.div>
                  );
                })
            )}
          </div>
        </section>

        {/* Master Student Class & List Table */}
        <section id="student-table-section" className={`p-6 rounded-[1.5rem] shadow-xl space-y-4 border ${darkMode ? "glass-panel-dark bg-slate-900/50 border-slate-800 shadow-slate-950/90" : "glass-panel bg-white border-slate-200/50 shadow-slate-100/40"}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">Student Progress List</h3>
              <p className="text-xs text-slate-400 font-medium">
                {classFilter === "all" ? teacherDetails.classLabel : `Class ${classFilter.toUpperCase()}`} status reports for {activeSubject}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Class Filter */}
              <div className="relative">
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value as any)}
                  className={`block w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm font-bold cursor-pointer ${darkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                >
                  {teacherDetails.classes && teacherDetails.classes.length > 1 && (
                    <option value="all">All Classes</option>
                  )}
                  {teacherDetails.classes && teacherDetails.classes.includes("xii-a") && (
                    <option value="xii-a">Class XII-A</option>
                  )}
                  {teacherDetails.classes && teacherDetails.classes.includes("xii-b") && (
                    <option value="xii-b">Class XII-B</option>
                  )}
                </select>
              </div>

              {/* Roll No Filter */}
              <div className="relative w-28">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-xs font-bold">#</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={classFilter === "xii-b" || (classFilter === "all" && activeSubject === "Biology") ? "18" : "37"}
                  placeholder="Roll No"
                  value={rollNoFilter}
                  onChange={(e) => setRollNoFilter(e.target.value)}
                  className={`block w-full pl-7 pr-2 py-2.5 border rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-base font-medium ${darkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
              </div>
              {/* Name/Text Search */}
              <div className="relative flex-1 sm:w-56">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search name, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`block w-full pl-9 pr-3 py-2.5 border rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-base font-medium ${darkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
              </div>
            </div>
          </div>

          {/* Student List Table */}
          <div className={`overflow-x-auto overflow-y-auto max-h-[520px] touch-auto rounded-2xl border ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
            <table className={`min-w-full divide-y font-sans ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
              <thead className={`sticky top-0 z-10 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}>
                <tr>
                  <th
                    onClick={() => toggleSort("rollNo")}
                    className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${darkMode ? "text-slate-400 hover:bg-slate-700" : "text-slate-500 hover:bg-slate-100"}`}
                  >
                    <div className="flex items-center gap-1">
                      Roll No <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("name")}
                    className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${darkMode ? "text-slate-400 hover:bg-slate-700" : "text-slate-500 hover:bg-slate-100"}`}
                  >
                    <div className="flex items-center gap-1">
                      Student Name <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Contact Details
                  </th>
                  <th
                    onClick={() => toggleSort("average")}
                    className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${darkMode ? "text-slate-400 hover:bg-slate-700" : "text-slate-500 hover:bg-slate-100"}`}
                  >
                    <div className="flex items-center gap-1">
                      {activeSubject} Completion <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest min-w-[170px] lg:min-w-[210px] hidden md:table-cell ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Teacher Insight
                  </th>
                  <th className={`px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? "divide-slate-800 bg-slate-900" : "divide-slate-100 bg-white"}`}>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center">
                      <div className={`mx-auto flex max-w-sm flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-8 text-center ${darkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                        <div className={`rounded-full p-3 ${darkMode ? "bg-indigo-950/60 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                          <Users className="h-5 w-5" />
                        </div>
                        <p className={`text-sm font-black ${darkMode ? "text-slate-300" : "text-slate-700"}`}>No students match this view yet.</p>
                        <p className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Try a different name, roll number, or class filter to surface the right learners.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => {
                    const avg = calculateStudentAvg(s);
                    const tone = getScoreStatus(avg);
                    const diag = getStudentDiagnostic(s, activeSubject, activeTopics);

                    let isInactive = true;
                    if (s.recentSessions && s.recentSessions.length > 0) {
                      const latestSessionTime = new Date(s.recentSessions[0].timestamp).getTime();
                      const daysInactive = (Date.now() - latestSessionTime) / (1000 * 60 * 60 * 24);
                      if (daysInactive <= 7) {
                        isInactive = false;
                      }
                    }

                    return (
                      <motion.tr
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: idx * 0.03, ease: "easeOut" }}
                        key={`${s.classId || "unknown"}-${s.rollNo}`}
                        className={`transition-colors ${darkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"}`}>
                        <td className={`px-6 py-4 text-sm font-mono font-bold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {s.rollNo}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-extrabold block ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                            {s.name}
                            {classFilter === "all" && (
                              <span className={`ml-2 inline-block px-1.5 py-0.5 text-[9px] font-black uppercase rounded border ${darkMode ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                {s.classId?.toUpperCase() || "XII-A"}
                              </span>
                            )}
                            {isInactive && (
                              <span className={`ml-2 inline-block px-1.5 py-0.5 text-[9px] font-black uppercase rounded border ${darkMode ? "bg-rose-950/40 text-rose-400 border-rose-800/40" : "bg-rose-100 text-rose-600 border-rose-200"}`} title="No study activity in the last 7 days">
                                Inactive 7d+
                              </span>
                            )}
                          </span>
                          <span className="text-xs font-mono text-slate-400 block">{s.email || "No Gmail Linked"}</span>
                          <span className={`text-[10px] font-extrabold mt-1 inline-block md:hidden ${
                            diag.priority === "critical" ? "text-rose-500" :
                            diag.priority === "warning" ? "text-amber-500" :
                            diag.priority === "success" ? "text-emerald-500" : "text-indigo-500"
                          }`}>
                            💡 {diag.actionTitle}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-mono ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {s.phone}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-black ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{avg}%</span>
                            <div className={`w-24 h-1.5 rounded-full overflow-hidden shrink-0 hidden md:block ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}>
                              <div className={`h-full rounded-full`} style={{ width: `${avg}%`, backgroundColor: tone.color }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell min-w-[170px] lg:min-w-[210px]">
                          <div className="flex flex-col gap-0.5 w-full max-w-[210px]">
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border w-fit whitespace-nowrap ${
                              diag.priority === "critical" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" :
                              diag.priority === "warning" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                              diag.priority === "success" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                              "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                            }`}>
                              {diag.badgeLabel}
                            </span>
                            <span className={`text-[11px] font-semibold leading-tight truncate ${darkMode ? "text-slate-200" : "text-slate-700"}`} title={diag.suggestion}>
                              {diag.actionTitle}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <motion.button
                            onClick={() => {
                              setSelectedStudent(s);
                              setEditScores({ ...s.scores });
                              setEditEmail(s.email || "");
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.92 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className={`p-1.5 rounded-xl transition-colors inline-flex items-center gap-1 text-[10px] font-extrabold cursor-pointer ${darkMode ? "bg-indigo-950/60 text-indigo-400 hover:bg-indigo-950/80" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                          >
                            <Edit className="h-3.5 w-3.5" /> Adjust Portfolio
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Dynamic Student Score Adjuster Panel */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {selectedStudent && (
            <div
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", zIndex: 999999 }}
              className="overflow-hidden flex justify-end font-sans pointer-events-auto"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedStudent(null)}
                style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", zIndex: 999999 }}
                className="bg-slate-950/80 backdrop-blur-xs cursor-pointer"
              />

              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                style={{ position: "fixed", top: 0, right: 0, bottom: 0, height: "100vh", zIndex: 1000000 }}
                className={`w-full max-w-md shadow-2xl flex flex-col overflow-hidden ${darkMode ? "bg-slate-900" : "bg-white"}`}
              >
              {/* Drawer Header */}
              <div className="bg-slate-900 text-white p-6 shrink-0 relative">
                <span className="text-xs font-mono text-cyan-400 font-black uppercase tracking-wider">
                  STUDENT PORTFOLIO MANAGER
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1 pr-8">
                  {selectedStudent.name}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Roll Number: {selectedStudent.rollNo} • Contact: {selectedStudent.phone}
                </p>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Slider Grid */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">

                {/* Featured Personalized Teacher Insight Card */}
                {(() => {
                  const diag = getStudentDiagnostic(selectedStudent, activeSubject, activeTopics);
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className={`p-4 rounded-2xl border space-y-2.5 shadow-sm ${
                      diag.priority === "critical" ? (darkMode ? "bg-rose-950/30 border-rose-900/50" : "bg-rose-50/70 border-rose-200/80") :
                      diag.priority === "warning" ? (darkMode ? "bg-amber-950/30 border-amber-900/50" : "bg-amber-50/70 border-amber-200/80") :
                      diag.priority === "success" ? (darkMode ? "bg-emerald-950/30 border-emerald-900/50" : "bg-emerald-50/70 border-emerald-200/80") :
                      (darkMode ? "bg-indigo-950/30 border-indigo-900/50" : "bg-indigo-50/70 border-indigo-200/80")
                    }`}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" /> Personalized Teacher Insight
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          diag.priority === "critical" ? "bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30" :
                          diag.priority === "warning" ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30" :
                          diag.priority === "success" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30" :
                          "bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/30"
                        }`}>
                          {diag.badgeLabel}
                        </span>
                      </div>
                      <p className={`text-xs font-extrabold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                        Recommended Action: {diag.actionTitle}
                      </p>
                      <p className={`text-xs font-medium leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        {diag.suggestion}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-bold text-slate-400 border-t border-slate-200/60 dark:border-slate-800">
                        <span>Weakest: <strong className="text-rose-500">{diag.weakestTopic} ({diag.lowestScore}%)</strong></span>
                        <span>•</span>
                        <span>Quizzes: <strong>{diag.totalQuizzes} taken</strong></span>
                        <span>•</span>
                        <span>Activity: <strong>{diag.daysInactiveStr}</strong></span>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Registered Google Gmail Input Box */}
                <div className={`space-y-2 p-4 rounded-2xl border ${darkMode ? "bg-indigo-950/30 border-indigo-900/50" : "bg-indigo-50/40 border-indigo-100"}`}>
                  <label className={`flex items-center gap-1.5 text-sm font-black uppercase tracking-wider ${darkMode ? "text-indigo-300" : "text-indigo-900"}`}>
                    <Mail className={`h-4 w-4 ${darkMode ? "text-indigo-400" : "text-indigo-500"}`} /> Registered Student Gmail
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. mukul.sharma@gmail.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className={`w-full border rounded-xl p-3 text-base focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium ${darkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}
                  />
                  <p className={`text-xs font-medium ${darkMode ? "text-indigo-400" : "text-indigo-500"}`}>Used for secure Google Sign-In verification.</p>
                </div>

                {/* Recent Study Sessions (Last 3 logins activity logs) */}
                <div className="space-y-3">
                  <h4 className={`text-sm font-black uppercase tracking-wider flex items-center gap-1.5 ${darkMode ? "text-slate-400" : "text-slate-400"}`}>
                    <History className={`h-4.5 w-4.5 ${darkMode ? "text-slate-500" : "text-slate-400"}`} /> Recent Study Sessions (Last 3)
                  </h4>
                  {(!selectedStudent.recentSessions || selectedStudent.recentSessions.length === 0) ? (
                    <div className={`rounded-2xl border border-dashed p-4 text-center ${darkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                      <p className={`text-sm font-black ${darkMode ? "text-slate-300" : "text-slate-700"}`}>No study sessions recorded yet.</p>
                      <p className={`mt-1 text-xs font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>A student's first checklist update or quiz completion will appear here with a clear timeline.</p>
                    </div>
                  ) : (() => {
                    const filteredSessions = selectedStudent.recentSessions
                      .map(session => ({
                        ...session,
                        changes: session.changes.filter(ch => ch.subject.toLowerCase() === activeSubject.toLowerCase())
                      }))
                      .filter(session => session.changes.length > 0);

                    if (filteredSessions.length === 0) {
                      return (
                        <div className={`rounded-2xl border border-dashed p-4 text-center ${darkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                          <p className={`text-sm font-black ${darkMode ? "text-slate-300" : "text-slate-700"}`}>No {activeSubject} study sessions recorded yet.</p>
                          <p className={`mt-1 text-xs font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Updates for this subject will appear here.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {filteredSessions.map((session, sIdx) => {
                          const date = new Date(session.timestamp);
                          const formattedTime = date.toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                          });
                          return (
                            <div key={sIdx} className={`p-4 rounded-2xl border space-y-2.5 ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                                  Session {sIdx + 1}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 font-mono">
                                  {formattedTime}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {session.changes.map((ch, cIdx) => (
                                  <div key={cIdx} className="flex items-start gap-2 text-xs leading-relaxed">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${
                                      ch.type === "quiz" 
                                        ? `${darkMode ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`
                                        : `${darkMode ? "bg-indigo-950/40 text-indigo-400 border border-indigo-800/40" : "bg-indigo-50 text-indigo-600 border border-indigo-100"}`
                                    }`}>
                                      {ch.type}
                                    </span>
                                    <span className={`font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                                      <span className="text-slate-400 font-bold mr-1">[{ch.subject}]</span>
                                      {ch.detail}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-4">
                  <h4 className={`text-sm font-black uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-400"}`}>
                    {activeSubject} Chapters Completion (%)
                  </h4>

                  <div className="space-y-4">
                    {activeTopics.map((topic) => {
                      const currentScore = editScores[topic] !== undefined ? editScores[topic] : (selectedStudent.scores[topic] || 0);
                      return (
                        <div key={topic} className={`space-y-1 p-3.5 rounded-2xl border ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
                          <div className={`flex justify-between items-center text-sm font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                            <span className="truncate pr-4" title={topic}>{topic}</span>
                            <span className={`font-mono text-sm ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>{currentScore}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={currentScore}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setEditScores((prev) => ({ ...prev, [topic]: val }));
                              }}
                              disabled={true}
                              className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none opacity-50 ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}
                            />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={currentScore}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                                setEditScores((prev) => ({ ...prev, [topic]: val }));
                              }}
                              disabled={true}
                              className={`w-14 border rounded-lg p-1.5 text-center font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-not-allowed ${darkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer Action Bar */}
              <div className={`p-4 border-t shrink-0 space-y-2 ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-slate-50"}`}>
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 border rounded-xl flex items-center gap-2 text-sm font-semibold ${darkMode ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Portfolio changes synced successfully.
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setSelectedStudent(null)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={`flex-1 py-3 border rounded-xl text-sm font-bold transition-colors cursor-pointer ${darkMode ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                  >
                    Discard Changes
                  </motion.button>
                  <motion.button
                    onClick={handleSaveScores}
                    disabled={savingScores}
                    whileHover={savingScores ? {} : { scale: 1.02 }}
                    whileTap={savingScores ? {} : { scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-lg transition-colors cursor-pointer ${savingScores ? "bg-slate-600 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/15"}`}
                  >
                    <Save className="h-4 w-4" />
                    {savingScores ? "Syncing..." : "Sync Portfolio"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* Selected Chapter Detail Drawer (Full Page Height Block Overlay) */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {selectedChapterData && (
            <div
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", zIndex: 999999 }}
              className="overflow-hidden flex justify-end font-sans pointer-events-auto"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedChapterName(null)}
                style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", zIndex: 999999 }}
                className="bg-slate-950/80 backdrop-blur-xs cursor-pointer"
              />

              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                style={{ position: "fixed", top: 0, right: 0, bottom: 0, height: "100vh", zIndex: 1000000 }}
                className={`w-full max-w-lg md:max-w-xl shadow-2xl flex flex-col overflow-hidden block ${
                  darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
                }`}
              >
                {/* Drawer Header */}
                <div className={`p-6 shrink-0 relative border-b ${
                  darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}>
                  <span className="text-xs font-mono text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-wider block">
                    {activeSubject} CHAPTER ANALYTICS & BREAKDOWN
                  </span>
                  <h3 className="text-xl font-extrabold mt-1 pr-8 truncate">
                    {selectedChapterData.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Class Average: <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{selectedChapterData.avg}%</span> • Chapter #{selectedChapterData.index}
                  </p>
                  <button
                    onClick={() => setSelectedChapterName(null)}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
                  {/* Benchmark Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className={`p-3.5 rounded-2xl border ${darkMode ? "bg-slate-800/60 border-slate-750" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Class Mean</span>
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1 block">{selectedChapterData.avg}%</span>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${darkMode ? "bg-slate-800/60 border-slate-750" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Top 25% Benchmark</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{selectedChapterData.topAvg}%</span>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${darkMode ? "bg-slate-800/60 border-slate-750" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">High Achievers (≥75%)</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{selectedChapterData.highCount} learners</span>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${darkMode ? "bg-slate-800/60 border-slate-750" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Struggling (&lt;50%)</span>
                      <span className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1 block">{selectedChapterData.strugglingCount} learners</span>
                    </div>
                  </div>

                  {/* Performance Roster for this chapter */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Learner Scores in {selectedChapterData.name}
                      </h4>
                      <span className="text-[10px] font-extrabold text-slate-400">
                        {subjectStudents.length} Students
                      </span>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {subjectStudents.map((st) => {
                        const score = st.scores?.[selectedChapterData.name] || 0;
                        let scoreColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                        if (score < 50) scoreColor = "text-rose-500 bg-rose-500/10 border-rose-500/20";
                        else if (score < 75) scoreColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";

                        return (
                          <div
                            key={st.rollNo}
                            onClick={() => {
                              setSelectedStudent(st);
                              setSelectedChapterName(null);
                            }}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              darkMode ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-200/80 hover:bg-slate-100"
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-extrabold block truncate">{st.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold">Roll #{st.rollNo} • Click to edit portfolio</span>
                            </div>
                            <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${scoreColor}`}>
                              {score}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className={`p-4 border-t shrink-0 ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                  <button
                    onClick={() => setSelectedChapterName(null)}
                    className="w-full py-3 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                  >
                    Close Chapter Analytics
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
