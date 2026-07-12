import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  History
} from "lucide-react";
import { Student, TopicName, CHEMISTRY_TOPICS, PHYSICS_TOPICS, MATHS_TOPICS, BIOLOGY_TOPICS, ALL_TOPICS, getStudentSubjects } from "../types";
import { fetchWithRetry } from "../lib/fetch";
import SAMSLogo from "./SAMSLogo";

const getProgressColor = (score: number, alpha = 1) => {
  const s = Math.max(0, Math.min(100, score));
  // 0-50: Red (0) to Amber (45)
  // 50-100: Amber (45) to Emerald (140)
  const hue = s <= 50 ? (s / 50) * 45 : 45 + ((s - 50) / 50) * 95;
  return `hsla(${Math.round(hue)}, 85%, 45%, ${alpha})`;
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

  // Score & Email editor states
  const [editScores, setEditScores] = useState<Record<string, number>>({});
  const [editEmail, setEditEmail] = useState("");
  const [savingScores, setSavingScores] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
        const initials = data.name.split(" ").filter((n: string) => !n.includes(".")).map((n: string) => n[0]).join("").toUpperCase() || "T";
        const subject = data.subject;
        const classes = data.classes || (subject === "Biology" ? ["xii-b"] : ["xii-a", "xii-b"]);
        const role = subject === "Biology" 
          ? "Biology Faculty / Class XII-B Coordinator" 
          : (subject === "Chemistry" ? "Class XII-A Coordinator" : `${subject} Faculty`);
        const classLabel = classes.length > 1
          ? "Class XII-A & XII-B"
          : `Class ${classes[0].toUpperCase()}`;
        
        setTeacherDetails({
          name: data.name,
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

  // Calculate perfect 100% chapters completed across the class for active subject
  let perfectChaptersCount = 0;
  subjectStudents.forEach((s) => {
    activeTopics.forEach((t) => {
      if ((s.scores[t] || 0) === 100) {
        perfectChaptersCount++;
      }
    });
  });

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
    <div id="teacher-view-container" className="min-h-screen bg-[#eaf4fc] font-sans text-slate-900 flex flex-col">
      {/* Sleek Navigation Bar */}
      <nav id="teacher-nav-bar" className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <SAMSLogo size={36} />
          <span className="font-bold text-xl tracking-tight text-[#0f2d4a]">SAMS <span className="text-[#3b6b95]">Analytics</span></span>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:gap-6 justify-center sm:justify-end">
          <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-1.5 rounded-full border border-blue-200/40">
            <span className="text-xs font-semibold text-[#3b6b95] uppercase tracking-wider">Teacher Terminal</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500 uppercase leading-none mb-1">{teacherDetails.role}</p>
              <p className="text-sm font-bold text-slate-800 leading-none">{teacherDetails.name}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50/50 border-2 border-blue-200/40 shadow-sm flex items-center justify-center font-bold text-[#3b6b95] text-xs uppercase" title={teacherDetails.name}>
              {teacherDetails.initials}
            </div>
            <button
              id="teacher-logout-button"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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
        <div className="bg-slate-200/50 p-1.5 rounded-2xl border border-slate-300/30 flex gap-3">
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
              className="flex-1 py-3 px-4 rounded-xl font-extrabold text-sm tracking-tight transition-all flex items-center justify-center gap-2 bg-white text-indigo-700 shadow-md border border-slate-200/50"
            >
              <span>{sub.id} Monitor</span>
              <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${sub.color}`}>
                Active
              </span>
            </button>
          ))}
        </div>

        {/* Core Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Students */}
          <div className="glass-panel p-6 rounded-[1.5rem] shadow-xl shadow-slate-100/40 flex items-center justify-between bg-white border border-slate-200/50">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-display">
                Total Class Size
              </span>
              <span className="text-3xl font-black text-slate-900 block mt-1 font-display">{totalStudents}</span>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">{teacherDetails.classLabel} Student List</span>
            </div>
            <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl shrink-0">
              <Users className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: Class Average */}
          <div className="glass-panel p-6 rounded-[1.5rem] shadow-xl shadow-slate-100/40 flex items-center justify-between bg-white border border-slate-200/50">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-display">
                {activeSubject} Average
              </span>
              <span className="text-3xl font-black text-indigo-600 block mt-1 font-display">{classAvg}%</span>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">Class Mean Mastery</span>
            </div>
            <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: Perfect Chapters Completed */}
          <div className="glass-panel p-6 rounded-[1.5rem] shadow-xl shadow-slate-100/40 flex items-center justify-between bg-white border border-slate-200/50">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-display">
                Perfect Completions (100%)
              </span>
              <span className="text-3xl font-black text-emerald-600 block mt-1 font-display">{perfectChaptersCount}</span>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">Total Mastered Chapters</span>
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4: Most Challenging */}
          <div className="glass-panel p-6 rounded-[1.5rem] shadow-xl shadow-slate-100/40 flex items-center justify-between bg-white border border-slate-200/50">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-display">
                Challenging {activeSubject} Chapter
              </span>
              <span className="text-sm font-black text-slate-800 block mt-2 line-clamp-1 font-display" title={mostChallengingChapter}>
                {mostChallengingChapter}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">Lowest Mean: {lowestAvg}%</span>
            </div>
            <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl shrink-0">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Performance Analytics Section - Chapter Progress Bars */}
        <section className="glass-panel p-6 rounded-[1.5rem] shadow-xl shadow-slate-100/40 space-y-4 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">{activeSubject} Class Performance Analytics</h3>
              <p className="text-xs text-slate-400 font-medium">Average completion % per chapter · {activeTopics.length} chapters</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-indigo-500"/> Class Avg</span>
            </div>
          </div>

          {/* Scrollable chapter rows */}
          <div className="overflow-y-auto max-h-[360px] pr-1 space-y-2 scrollbar-none">
            {topicAverages.map((t) => {
              const pct = t.avg;
              const tone = getScoreStatus(pct);
              return (
                <div key={t.name} className="flex items-center gap-3 group">
                  <span className="text-[11px] font-semibold text-slate-600 w-52 shrink-0 truncate" title={t.name}>
                    {t.name}
                  </span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%`, backgroundColor: tone.color }}
                    />
                  </div>
                  <span className={`text-[11px] font-black w-10 text-right shrink-0`} style={{ color: tone.color }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Master Student Class & List Table */}
        <section className="glass-panel p-6 rounded-[1.5rem] shadow-xl shadow-slate-100/40 space-y-4 bg-white border border-slate-200/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">Student Progress List</h3>
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
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-sm font-bold cursor-pointer"
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
                  className="block w-full pl-7 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-base font-medium"
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
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-base font-medium"
                />
              </div>
            </div>
          </div>

          {/* Student List Table */}
          <div className="overflow-x-auto overflow-y-auto max-h-[520px] touch-auto border border-slate-100 rounded-2xl">
            <table className="min-w-full divide-y divide-slate-100 font-sans">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th
                    onClick={() => toggleSort("rollNo")}
                    className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Roll No <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("name")}
                    className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Student Name <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Contact Details
                  </th>
                  <th
                    onClick={() => toggleSort("average")}
                    className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {activeSubject} Completion <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 min-w-[160px]">
                    SAMS State
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
                        <div className="rounded-full bg-indigo-50 p-3 text-indigo-600">
                          <Users className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-black text-slate-700">No students match this view yet.</p>
                        <p className="text-xs font-medium text-slate-500">Try a different name, roll number, or class filter to surface the right learners.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const avg = calculateStudentAvg(s);
                    const tone = getScoreStatus(avg);
                    let stateLabel = tone.label;
                    if (avg === 0) stateLabel = "Not Commenced";

                    return (
                      <tr key={`${s.classId || "unknown"}-${s.rollNo}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono font-bold text-slate-500">
                          {s.rollNo}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-extrabold text-slate-800 block">
                            {s.name}
                            {classFilter === "all" && (
                              <span className="ml-2 inline-block px-1.5 py-0.5 text-[9px] font-black uppercase bg-slate-100 text-slate-500 rounded border border-slate-200">
                                {s.classId?.toUpperCase() || "XII-A"}
                              </span>
                            )}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{s.email || "No Gmail Linked"}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500">
                          {s.phone}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-slate-900">{avg}%</span>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0 hidden md:block">
                              <div className={`h-full rounded-full`} style={{ width: `${avg}%`, backgroundColor: tone.color }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap`}
                            style={{ color: tone.color, backgroundColor: tone.bg, borderColor: tone.bg }}
                          >
                            {stateLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setEditScores({ ...s.scores });
                              setEditEmail(s.email || "");
                            }}
                            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors inline-flex items-center gap-1 text-[10px] font-extrabold cursor-pointer"
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
              className="relative w-full max-w-md bg-white shadow-2xl h-[100dvh] flex flex-col z-10"
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

                {/* Registered Google Gmail Input Box */}
                <div className="space-y-2 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
                  <label className="flex items-center gap-1.5 text-sm font-black uppercase tracking-wider text-indigo-900">
                    <Mail className="h-4 w-4 text-indigo-500" /> Registered Student Gmail
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. mukul.sharma@gmail.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-base focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-medium"
                  />
                  <p className="text-xs text-indigo-500 font-medium">Used for secure Google Sign-In verification.</p>
                </div>

                {/* Recent Study Sessions (Last 3 logins activity logs) */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <History className="h-4.5 w-4.5 text-slate-400" /> Recent Study Sessions (Last 3)
                  </h4>
                  {(!selectedStudent.recentSessions || selectedStudent.recentSessions.length === 0) ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-sm font-black text-slate-700">No study sessions recorded yet.</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">A student’s first checklist update or quiz completion will appear here with a clear timeline.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedStudent.recentSessions.map((session, sIdx) => {
                        const date = new Date(session.timestamp);
                        const formattedTime = date.toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        });
                        return (
                          <div key={sIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
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
                                    ch.type === "quiz" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                  }`}>
                                    {ch.type}
                                  </span>
                                  <span className="font-semibold text-slate-700">
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
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-400">
                    {activeSubject} Chapters Completion (%)
                  </h4>

                  <div className="space-y-4">
                    {activeTopics.map((topic) => {
                      const currentScore = editScores[topic] !== undefined ? editScores[topic] : (selectedStudent.scores[topic] || 0);
                      return (
                        <div key={topic} className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                            <span className="truncate pr-4" title={topic}>{topic}</span>
                            <span className="font-mono text-indigo-600 text-sm">{currentScore}%</span>
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
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
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
                              className="w-14 border border-slate-200 rounded-lg p-1.5 text-center font-mono text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer Action Bar */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-2">
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-600 text-sm font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Portfolio changes synced successfully.
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSaveScores}
                    disabled={savingScores}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/15"
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
