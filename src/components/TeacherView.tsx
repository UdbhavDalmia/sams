import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { gsap } from "../lib/gsap";
import { playChime } from "./student/shared";
import {
  Users,
  FlaskConical,
  TrendingDown,
  Search,
  ArrowUpDown,
  Download,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
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
import { Student, TopicName, CHEMISTRY_TOPICS, PHYSICS_TOPICS, MATHS_TOPICS, BIOLOGY_TOPICS, ALL_TOPICS, getStudentSubjects } from "../types";
import { fetchWithRetry } from "../lib/fetch";
import SAMSLogo from "./SAMSLogo";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

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

  // Analytics View Toggle State: "bars" (Static Averages), "trends" (Growth Velocity & Trendlines)
  const [analyticsView, setAnalyticsView] = useState<"bars" | "trends">("bars");

  // Score & Email editor states
  const [editScores, setEditScores] = useState<Record<string, number>>({});
  const [editEmail, setEditEmail] = useState("");
  const [savingScores, setSavingScores] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const darkToggleRef = useRef<HTMLButtonElement>(null);

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


  // Calculate topic-specific averages for the class progress bar chart
  const topicAverages = activeTopics.map((topic) => {
    let sum = 0;
    subjectStudents.forEach((s) => {
      sum += s.scores[topic] || 0;
    });
    const avg = totalStudents > 0 ? Math.round(sum / totalStudents) : 0;
    return { name: topic, avg };
  });

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
    <div id="teacher-view-container" className={`min-h-screen transition-colors duration-300 font-sans flex flex-col ${darkMode ? "bg-slate-950 text-slate-100 dark" : "bg-[#eaf4fc] text-slate-900"}`}>
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
            <button
              id="teacher-logout-button"
              onClick={onLogout}
              className={`p-2 rounded-xl transition-all ${darkMode ? "text-slate-400 hover:text-rose-400 hover:bg-rose-950/30" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"}`}
              title="Close Session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8 overflow-y-auto">

        {/* Core Multi-Subject Switcher */}
        <div className={`p-1.5 rounded-2xl border flex gap-3 ${darkMode ? "bg-slate-800/50 border-slate-700/30" : "bg-slate-200/50 border-slate-300/30"}`}>
          {[
            { id: "Chemistry", color: "text-amber-800 bg-amber-500/15" },
            { id: "Physics", color: "text-blue-800 bg-blue-500/15" },
            { id: "Mathematics", color: "text-violet-800 bg-violet-500/15" },
            { id: "Biology", color: "text-emerald-800 bg-emerald-500/15" }
          ].filter((sub) => sub.id === teacherDetails.subject).map((sub) => (
            <button
              key={sub.id}
              onClick={() => {
                setActiveSubject(sub.id as any);
                setSelectedStudent(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-sm tracking-tight transition-all flex items-center justify-center gap-2 shadow-md ${darkMode ? "bg-slate-800 text-indigo-300 border border-slate-700/50" : "bg-white text-indigo-700 border border-slate-200/50"}`}
            >
              <span>{sub.id} Monitor</span>
              <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${sub.color}`}>
                Active
              </span>
            </button>
          ))}
        </div>

        {/* Core Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card 1: Total Students */}
          <div className={`p-6 rounded-[1.5rem] shadow-xl flex items-center justify-between ${darkMode ? "glass-panel-dark bg-slate-900/50 border-slate-800 shadow-slate-950/90" : "glass-panel bg-white border-slate-200/50 shadow-slate-100/40"}`}>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-display">
                Total Class Size
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1 font-display">{totalStudents}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">{teacherDetails.classLabel} Student List</span>
            </div>
            <div className={`p-4 rounded-2xl shrink-0 ${darkMode ? "bg-indigo-950/60 text-indigo-400" : "bg-indigo-50 text-indigo-500"}`}>
              <Users className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: Class Average */}
          <div className={`p-6 rounded-[1.5rem] shadow-xl flex items-center justify-between ${darkMode ? "glass-panel-dark bg-slate-900/50 border-slate-800 shadow-slate-950/90" : "glass-panel bg-white border-slate-200/50 shadow-slate-100/40"}`}>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-display">
                {activeSubject} Average
              </span>
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 block mt-1 font-display">{classAvg}%</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">Class Mean Mastery</span>
            </div>
            <div className={`p-4 rounded-2xl shrink-0 ${darkMode ? "bg-indigo-950/60 text-indigo-400" : "bg-indigo-50 text-indigo-500"}`}>
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: Most Challenging */}
          <div className={`p-6 rounded-[1.5rem] shadow-xl flex items-center justify-between ${darkMode ? "glass-panel-dark bg-slate-900/50 border-slate-800 shadow-slate-950/90" : "glass-panel bg-white border-slate-200/50 shadow-slate-100/40"}`}>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-display">
                Challenging {activeSubject} Chapter
              </span>
              <span className="text-sm font-black text-slate-800 dark:text-white block mt-2 line-clamp-1 font-display" title={mostChallengingChapter}>
                {mostChallengingChapter}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">Lowest Mean: {lowestAvg}%</span>
            </div>
            <div className={`p-4 rounded-2xl shrink-0 ${darkMode ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-500"}`}>
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Performance Analytics Section - Toggleable (Static Averages | Growth Velocity) */}
        <section className={`p-6 rounded-[1.5rem] shadow-xl space-y-4 ${darkMode ? "glass-panel-dark bg-slate-900/50 border-slate-800 shadow-slate-950/90" : "glass-panel bg-white shadow-slate-100/40"}`}>
          {/* Header & View Toggle */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">{activeSubject} Class Performance Analytics</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {analyticsView === "bars" ? "Static View" : "Velocity Mode"}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {analyticsView === "bars" && `Average completion % per chapter · ${activeTopics.length} chapters`}
                {analyticsView === "trends" && `Growth velocity & chapter progression curves across ${subjectStudents.length} students`}
              </p>
            </div>

            {/* Segmented View Toggle Switch */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shrink-0">
              <button
                onClick={() => setAnalyticsView("bars")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  analyticsView === "bars"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Static Averages
              </button>
              <button
                onClick={() => setAnalyticsView("trends")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  analyticsView === "trends"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Growth & Trends
              </button>
            </div>
          </div>

          {/* Mode 1: Static Chapter Progress Bars */}
          {analyticsView === "bars" && (
            <div className="overflow-y-auto max-h-[360px] pr-1 space-y-2.5 scrollbar-none pt-1">
              {topicAverages.map((t) => {
                const pct = t.avg;
                const tone = getScoreStatus(pct);
                return (
                  <div key={t.name} className="flex items-center gap-3 group">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 w-52 shrink-0 truncate" title={t.name}>
                      {t.name}
                    </span>
                    <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: tone.color }}
                      />
                    </div>
                    <span className="text-[11px] font-black w-10 text-right shrink-0" style={{ color: tone.color }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mode 2: Growth Velocity & Trendlines */}
          {analyticsView === "trends" && (() => {
            const studentCount = subjectStudents.length;

            const trendChartData = activeTopics.map((topic, idx) => {
              const topicScores = subjectStudents.map((s) => s.scores?.[topic] || 0);
              const totalScore = topicScores.reduce((sum, v) => sum + v, 0);

              const classAvg = studentCount > 0 ? Math.round(totalScore / studentCount) : 0;

              // Top quartile (top 25% students) real mean score
              const sortedScores = [...topicScores].sort((a, b) => b - a);
              const topCutoff = Math.max(1, Math.ceil(studentCount * 0.25));
              const topQuartileScores = sortedScores.slice(0, topCutoff);
              const topAvg = topQuartileScores.length > 0
                ? Math.round(topQuartileScores.reduce((sum, v) => sum + v, 0) / topQuartileScores.length)
                : classAvg;

              // Real milestone completion count (% of students with all milestones checked)
              let completedMilestoneCount = 0;
              subjectStudents.forEach((s) => {
                const ms = s.milestones?.[topic];
                if (ms && ms.length > 0 && ms.every(Boolean)) {
                  completedMilestoneCount++;
                }
              });
              const milestoneCompletionPct = studentCount > 0 ? Math.round((completedMilestoneCount / studentCount) * 100) : 0;

              // Growth velocity: difference in class mean score vs preceding chapter
              const prevTopic = activeTopics[idx - 1];
              let prevAvg = classAvg;
              if (prevTopic) {
                const prevScores = subjectStudents.map((s) => s.scores?.[prevTopic] || 0);
                prevAvg = studentCount > 0 ? Math.round(prevScores.reduce((sum, v) => sum + v, 0) / studentCount) : classAvg;
              }
              const growthVelocity = classAvg - prevAvg;

              return {
                topicShort: topic.length > 12 ? topic.substring(0, 12) + "…" : topic,
                topicName: topic,
                classAvg,
                topAvg,
                milestoneCompletionPct,
                velocity: growthVelocity,
              };
            });

            const overallTopAvg = trendChartData.length > 0
              ? Math.round(trendChartData.reduce((acc, c) => acc + c.topAvg, 0) / trendChartData.length)
              : 0;

            const highestMasteryTopic = topicAverages.reduce(
              (max, t) => (t.avg > max.avg ? t : max),
              topicAverages[0] || { name: "N/A", avg: 0 }
            );

            return (
              <div className="space-y-4 pt-1">
                {/* Summary Metrics Cards - Mobile Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <div className={`p-3 rounded-xl border text-xs ${darkMode ? "bg-slate-800/50 border-slate-700/60 text-slate-200" : "bg-indigo-50/60 border-indigo-100 text-slate-800"}`}>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500 block">Class Mean Mastery</span>
                    <span className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">{classAvg}%</span>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5 block">{studentCount} enrolled learners</span>
                  </div>
                  <div className={`p-3 rounded-xl border text-xs ${darkMode ? "bg-slate-800/50 border-slate-700/60 text-slate-200" : "bg-emerald-50/60 border-emerald-100 text-slate-800"}`}>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 block">Top Quartile (25%) Mean</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {overallTopAvg}%
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5 block">High achievement benchmark</span>
                  </div>
                  <div className={`p-3 rounded-xl border text-xs ${darkMode ? "bg-slate-800/50 border-slate-700/60 text-slate-200" : "bg-amber-50/60 border-amber-100 text-slate-800"}`}>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 block">Strongest Chapter</span>
                    <span className="text-xs font-extrabold truncate block mt-1" title={highestMasteryTopic.name}>
                      {highestMasteryTopic.name}
                    </span>
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 mt-0.5 block">Highest mean: {highestMasteryTopic.avg}%</span>
                  </div>
                </div>

                {/* Recharts Area Chart - Touch Accessible Scrollable Container on Mobile */}
                <div className="w-full overflow-x-auto scrollbar-thin pt-1 pb-2">
                  <div className="h-64 sm:h-72 min-w-[540px] sm:min-w-0 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendChartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="classAvgGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="topAvgGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={darkMode ? 0.15 : 0.4} />
                        <XAxis
                          dataKey="topicShort"
                          tick={{ fontSize: 10, fill: darkMode ? "#94a3b8" : "#64748b" }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                          height={45}
                        />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: darkMode ? "#94a3b8" : "#64748b" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                            borderColor: darkMode ? "#334155" : "#e2e8f0",
                            borderRadius: "12px",
                            fontSize: "11px",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.25)",
                            padding: "10px",
                          }}
                          formatter={(val: any, name: any) => {
                            if (name === "Class Mean") return [`${val}%`, "Class Mean"];
                            if (name === "Top 25% Quartile") return [`${val}%`, "Top 25% Quartile"];
                            return [`${val}%`, name];
                          }}
                          labelFormatter={(label, items) => {
                            const payload = items?.[0]?.payload;
                            if (!payload) return label;
                            const velStr = payload.velocity >= 0 ? `+${payload.velocity}%` : `${payload.velocity}%`;
                            return `${payload.topicName} (Velocity: ${velStr})`;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                        <Area type="monotone" dataKey="classAvg" name="Class Mean" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#classAvgGrad)" />
                        <Area type="monotone" dataKey="topAvg" name="Top 25% Quartile" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#topAvgGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Master Student Class & List Table */}
        <section className={`p-6 rounded-[1.5rem] shadow-xl space-y-4 border ${darkMode ? "glass-panel-dark bg-slate-900/50 border-slate-800 shadow-slate-950/90" : "glass-panel bg-white border-slate-200/50 shadow-slate-100/40"}`}>
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
                  filteredStudents.map((s) => {
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
                      <tr key={`${s.classId || "unknown"}-${s.rollNo}`} className={`transition-colors ${darkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50"}`}>
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
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setEditScores({ ...s.scores });
                              setEditEmail(s.email || "");
                            }}
                            className={`p-1.5 rounded-xl transition-colors inline-flex items-center gap-1 text-[10px] font-extrabold cursor-pointer ${darkMode ? "bg-indigo-950/60 text-indigo-400 hover:bg-indigo-950/80" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                          >
                            <Edit className="h-3.5 w-3.5" /> Adjust Portfolio
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Dynamic Student Score Adjuster Panel */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-slate-900"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`relative w-full max-w-md shadow-2xl h-[100dvh] flex flex-col z-10 ${darkMode ? "bg-slate-900" : "bg-white"}`}
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
                    <div className={`p-4 rounded-2xl border space-y-2.5 shadow-sm ${
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
                    </div>
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
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className={`flex-1 py-3 border rounded-xl text-sm font-bold transition-colors ${darkMode ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSaveScores}
                    disabled={savingScores}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-lg transition-colors ${savingScores ? "bg-slate-600 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/15"}`}
                  >
                    <Save className="h-4 w-4" />
                    {savingScores ? "Syncing..." : "Sync Portfolio"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
