import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  FlaskConical,
  MessageSquare,
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
  BookOpen
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Student, Doubt, TopicName, CHEMISTRY_TOPICS, PHYSICS_TOPICS, MATHS_TOPICS, ALL_TOPICS } from "../types";
import { fetchWithRetry } from "../lib/fetch";

interface TeacherViewProps {
  passcode: string;
  onLogout: () => void;
}

export default function TeacherView({ passcode, onLogout }: TeacherViewProps) {
  const getTeacherDetails = (pass: string) => {
    const p = pass.toUpperCase();
    if (p === "PHYS12A" || p === "NARENDRA12" || p === "SATISH12") {
      return { name: "Mr. Narendra Kumar", role: "Physics Faculty", subject: "Physics" as const, initials: "NK" };
    }
    if (p === "MATH12A" || p === "TARUN12" || p === "AMIT12") {
      return { name: "Mr. Tarun Makkar", role: "Mathematics Faculty", subject: "Mathematics" as const, initials: "TM" };
    }
    return { name: "Mr. Pradeep Gusain", role: "Class XII-A Coordinator", subject: "Chemistry" as const, initials: "PG" };
  };

  const teacherDetails = getTeacherDetails(passcode);

  const [students, setStudents] = useState<Student[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rollNo" | "name" | "average">("rollNo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Active Subject Selection State
  const [activeSubject, setActiveSubject] = useState<"Chemistry" | "Physics" | "Mathematics">(teacherDetails.subject);
  
  // Score editor states
  const [editScores, setEditScores] = useState<Record<string, number>>({});
  const [savingScores, setSavingScores] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Doubt states
  const [answeringDoubtId, setAnsweringDoubtId] = useState<string | null>(null);
  const [doubtAnswerText, setDoubtAnswerText] = useState("");
  const [answeringLoading, setAnsweringLoading] = useState(false);



  // Determine active topics list based on selected subject
  const activeTopics = activeSubject === "Physics" 
    ? PHYSICS_TOPICS 
    : (activeSubject === "Mathematics" ? MATHS_TOPICS : CHEMISTRY_TOPICS);

  // Load class data and doubts on mount
  const fetchClassData = async () => {
    try {
      const classRes = await fetchWithRetry("/api/students", {
        headers: { "x-teacher-passcode": passcode },
      });
      const doubtsRes = await fetchWithRetry("/api/teacher/doubts", {
        headers: { "x-teacher-passcode": passcode },
      });

      if (classRes.ok) {
        const classList = await classRes.json();
        setStudents(classList);
      }
      if (doubtsRes.ok) {
        const doubtList = await doubtsRes.json();
        setDoubts(doubtList);
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

  // Handle student score save
  const handleSaveScores = async () => {
    if (!selectedStudent) return;
    setSavingScores(true);
    setSaveSuccess(false);

    try {
      // Send individual scores update requests sequentially or concurrently for the active subject's topics
      const promises = activeTopics.map(async (topic) => {
        const originalScore = selectedStudent.scores[topic] || 0;
        const newScore = editScores[topic] !== undefined ? editScores[topic] : originalScore;

        if (originalScore !== newScore) {
          // If student has milestones and we change score, let's keep milestones synchronized
          // If we drag to 100%, check all milestones. If 0%, uncheck all.
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
            body: JSON.stringify({ topic, score: newScore, milestones: milestonesArr }),
          });
        }
      });

      await Promise.all(promises);

      setSaveSuccess(true);
      // Refresh class data
      await fetchClassData();
      
      // Update selectedStudent with new values
      const updatedStudents = students.map((s) => {
        if (s.rollNo === selectedStudent.rollNo) {
          return {
            ...s,
            scores: { ...s.scores, ...editScores },
          };
        }
        return s;
      });
      const refreshedS = updatedStudents.find((s) => s.rollNo === selectedStudent.rollNo);
      if (refreshedS) setSelectedStudent(refreshedS);

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving student scores:", err);
    } finally {
      setSavingScores(false);
    }
  };

  // Handle answering doubt
  const handleAnswerDoubt = async (doubtId: string) => {
    if (!doubtAnswerText.trim()) return;
    setAnsweringLoading(true);

    try {
      const res = await fetchWithRetry(`/api/teacher/doubt/${doubtId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-teacher-passcode": passcode,
        },
        body: JSON.stringify({ answer: doubtAnswerText }),
      });

      if (res.ok) {
        setDoubtAnswerText("");
        setAnsweringDoubtId(null);
        await fetchClassData();
      }
    } catch (err) {
      console.error("Error answering doubt:", err);
    } finally {
      setAnsweringLoading(false);
    }
  };



  // Calculations for charts and metrics (Relative to the selected activeSubject)
  const totalStudents = students.length;
  
  const calculateStudentAvg = (s: Student) => {
    const scores = activeTopics.map(t => s.scores[t] || 0);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length);
  };

  const classAvg = totalStudents > 0
    ? Math.round(students.reduce((sum, s) => sum + calculateStudentAvg(s), 0) / totalStudents)
    : 0;

  const pendingDoubts = doubts.filter((d) => d.answer === null).length;

  // Calculate topic-specific averages for the class progress bar chart
  const topicAverages = activeTopics.map((topic) => {
    let sum = 0;
    students.forEach((s) => {
      sum += s.scores[topic] || 0;
    });
    const avg = totalStudents > 0 ? Math.round(sum / totalStudents) : 0;
    return { name: topic, avg };
  });

  // Find most challenging chapter in the current subject
  let mostChallengingChapter = "None";
  let lowestAvg = 100;
  if (students.length > 0) {
    topicAverages.forEach((t) => {
      if (t.avg < lowestAvg) {
        lowestAvg = t.avg;
        mostChallengingChapter = t.name;
      }
    });
  }

  // Filter and sort class list
  const filteredStudents = students
    .filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.rollNo.toString().includes(q) ||
        s.phone.includes(q)
      );
    })
    .sort((a, b) => {
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
    <div id="teacher-view-container" className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Sleek Navigation Bar */}
      <nav id="teacher-nav-bar" className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-600/10">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">SAMS <span className="text-indigo-600">Analytics</span></span>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 md:gap-6 justify-center sm:justify-end">
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Teacher Terminal</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500 uppercase leading-none mb-1">{teacherDetails.role}</p>
              <p className="text-sm font-bold text-slate-800 leading-none">{teacherDetails.name}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-indigo-100 shadow-sm flex items-center justify-center font-bold text-indigo-600 text-xs uppercase" title={teacherDetails.name}>
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
            { id: "Mathematics", color: "text-violet-800 bg-violet-500/15" }
          ].filter((sub) => sub.id === teacherDetails.subject).map((sub) => (
            <button
              key={sub.id}
              onClick={() => {
                setActiveSubject(sub.id as any);
                setSelectedStudent(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-sm tracking-tight transition-all flex items-center justify-center gap-2 ${
                activeSubject === sub.id
                  ? "bg-white text-indigo-700 shadow-md border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/40"
              }`}
            >
              <span>{sub.id} Monitor</span>
              <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                activeSubject === sub.id ? sub.color : "bg-slate-300/50 text-slate-500"
              }`}>
                Active
              </span>
            </button>
          ))}
        </div>

        {/* Core Metric Cards (Relative to activeSubject) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Students */}
          <div className="glass-panel p-6 rounded-[1.5rem] shadow-xl shadow-slate-100/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-display">
                Total Class Size
              </span>
              <span className="text-3xl font-black text-slate-900 block mt-1 font-display">{totalStudents}</span>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">Class XII-A Directory</span>
            </div>
            <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl shrink-0">
              <Users className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: Class Average */}
          <div className="glass-panel p-6 rounded-[1.5rem] shadow-xl shadow-slate-100/40 flex items-center justify-between">
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

          {/* Card 3: Pending Doubts */}
          <div className="glass-panel p-6 rounded-[1.5rem] shadow-xl shadow-slate-100/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-display">
                Active Doubt Queue
              </span>
              <span className="text-3xl font-black text-rose-500 block mt-1 font-display">{pendingDoubts}</span>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">Awaiting response</span>
            </div>
            <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl shrink-0">
              <MessageSquare className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4: Most Challenging */}
          <div className="glass-panel p-6 rounded-[1.5rem] shadow-xl shadow-slate-100/40 flex items-center justify-between">
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

        {/* Recharts Analytics Section */}
        <section className="glass-panel p-6 rounded-[1.5rem] shadow-xl shadow-slate-100/40 space-y-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 font-display">{activeSubject} Class Performance Analytics</h3>
            <p className="text-xs text-slate-400 font-medium">Average student completion percentage across all {activeTopics.length} chapters</p>
          </div>
          <div className="h-72 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicAverages} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ background: "#0f172a", borderRadius: "12px", border: "none", color: "#f8fafc" }}
                  labelStyle={{ fontWeight: "bold", fontSize: "11px" }}
                />
                <Bar dataKey="avg" name="Class Average (%)" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Student Doubt Inbox resolution board */}
        {doubts.filter((d) => d.answer === null).length > 0 && (
          <section className="bg-rose-50/50 border border-rose-100 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500 animate-pulse shrink-0" />
              <div>
                <h3 className="text-md font-extrabold text-slate-900">Urgent Student Doubts Desk</h3>
                <p className="text-xs text-slate-500 font-medium">Respond to students' subject doubts directly.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doubts
                .filter((d) => d.answer === null)
                .map((d) => (
                  <div key={d.id} className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-indigo-500 font-bold block">
                          {d.topic}
                        </span>
                        <span className="text-xs font-black text-slate-800">
                          {d.studentName} (Roll No: {d.studentRollNo})
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                      "{d.question}"
                    </p>

                    {answeringDoubtId === d.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={doubtAnswerText}
                          onChange={(e) => setDoubtAnswerText(e.target.value)}
                          placeholder="Type answers or solution steps..."
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setAnsweringDoubtId(null);
                              setDoubtAnswerText("");
                            }}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAnswerDoubt(d.id)}
                            disabled={answeringLoading || !doubtAnswerText.trim()}
                            className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-500 disabled:bg-slate-300 transition-colors"
                          >
                            Send Answer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAnsweringDoubtId(d.id);
                          setDoubtAnswerText("");
                        }}
                        className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors w-full"
                      >
                        Write Answer
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Master Student Class & Directory Table */}
        <section className="glass-panel p-6 rounded-[1.5rem] shadow-xl shadow-slate-100/40 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">Student Progress Directory</h3>
              <p className="text-xs text-slate-400 font-medium">Class XII-A status reports for {activeSubject}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search name, roll, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto touch-pan-y border border-slate-100 rounded-2xl">
            <table className="min-w-full divide-y divide-slate-100 font-sans">
              <thead className="bg-slate-50">
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
                    Phone Contact
                  </th>
                  <th
                    onClick={() => toggleSort("average")}
                    className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {activeSubject} Completion <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
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
                    <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400 font-medium">
                      No student records match this query in the Class XII-A directory.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const avg = calculateStudentAvg(s);
                    let badgeColor = "text-slate-400 bg-slate-50 border-slate-100";
                    let stateLabel = "Not Started";

                    if (avg === 0) {
                      badgeColor = "text-slate-400 bg-slate-50 border-slate-200";
                      stateLabel = "Not Commenced";
                    } else if (avg > 0 && avg <= 30) {
                      badgeColor = "text-rose-600 bg-rose-50 border-rose-100";
                      stateLabel = "Incipient Mastery";
                    } else if (avg > 30 && avg <= 69) {
                      badgeColor = "text-amber-600 bg-amber-50 border-amber-100";
                      stateLabel = "Developing Proficiency";
                    } else if (avg > 69 && avg <= 99) {
                      badgeColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
                      stateLabel = "Advanced Proficiency";
                    } else if (avg === 100) {
                      badgeColor = "text-purple-600 bg-purple-50 border-purple-100";
                      stateLabel = "Comprehensive Mastery";
                    }

                    return (
                      <tr key={s.rollNo} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500">
                          {s.rollNo}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-extrabold text-slate-800">{s.name}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                          {s.phone}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-slate-900">{avg}%</span>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0 hidden md:block">
                              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${avg}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                            {stateLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setEditScores({ ...s.scores });
                            }}
                            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors inline-flex items-center gap-1 text-[10px] font-extrabold"
                          >
                            <Edit className="h-3.5 w-3.5" /> Adjust scores
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
                <span className="text-[10px] font-mono text-cyan-400 font-black">
                  STUDENT PORTFOLIO MANAGER
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1 pr-8">
                  {selectedStudent.name}
                </h3>
                <p className="text-slate-400 text-xs mt-1">
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
              <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {activeSubject} Chapters Completion (%)
                </h4>

                <div className="space-y-4">
                  {activeTopics.map((topic) => {
                    const currentScore = editScores[topic] !== undefined ? editScores[topic] : (selectedStudent.scores[topic] || 0);
                    return (
                      <div key={topic} className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
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
                            className="w-12 border border-slate-200 rounded-lg p-1 text-center font-mono text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Action Bar */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-2">
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-600 text-xs font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Portfolio changes synced successfully.
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSaveScores}
                    disabled={savingScores}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/15"
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
