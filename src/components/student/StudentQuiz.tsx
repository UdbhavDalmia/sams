import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, ChevronDown, Zap, Loader, RefreshCw, ChevronRight } from "lucide-react";
import { Student } from "../../types";
import { parseMarkdownAndMath, parseBoldAndMathInline } from "./shared";
import { ActiveQuizState } from "../../types"; // Assuming this is exported from types, or I might need to define it

interface StudentQuizProps {
  student: Student;
  darkMode: boolean;
  activeTopics: string[];
  syncStudentData: (silent?: boolean) => Promise<void>;
  initialQuizState?: ActiveQuizState | null; // Passed from parent if there's an active quiz
  onQuizStateChange?: (isActive: boolean) => void;
}

const fetchWithRetry = async (url: string, options: RequestInit, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // exponential backoff
    }
  }
};

const getSubjectForTopic = (topic: string) => {
  // Rough categorization based on topic name for AI context
  const t = topic.toLowerCase();
  if (t.includes("electric") || t.includes("magnetic") || t.includes("optics") || t.includes("nucleus") || t.includes("semiconductor")) return "Physics";
  if (t.includes("solution") || t.includes("electro") || t.includes("kinetic") || t.includes("block") || t.includes("halo") || t.includes("alcohol") || t.includes("aldehyde") || t.includes("amine") || t.includes("biomolecule")) return "Chemistry";
  if (t.includes("reproduction") || t.includes("genetics") || t.includes("evolution") || t.includes("disease") || t.includes("microbe") || t.includes("biotech") || t.includes("ecology") || t.includes("biodiversity")) return "Biology";
  return "Mathematics";
};

export default function StudentQuiz({
  student,
  darkMode,
  activeTopics,
  syncStudentData,
  initialQuizState,
  onQuizStateChange
}: StudentQuizProps) {
  const [quizTopic, setQuizTopic] = useState("");
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizState, setQuizState] = useState<ActiveQuizState | null>(initialQuizState || null);
  const [quizError, setQuizError] = useState<string | null>(null);

  const quizCardRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (activeTopics.length > 0) {
      if (!quizTopic || !activeTopics.includes(quizTopic)) {
        setQuizTopic(activeTopics[0]);
      }
    }
  }, [activeTopics, quizTopic]);

  // Sync initial quiz state if parent passes it
  useEffect(() => {
    if (initialQuizState && !quizStarted) {
      setQuizState(initialQuizState);
      setQuizTopic(initialQuizState.topic);
      setQuizStarted(true);
      if (initialQuizState.roundsCompleted < 5) {
        fetchNextQuestion(initialQuizState);
      } else {
        setQuizFinished(true);
      }
    }
  }, [initialQuizState]);

  const cancelPrefetch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const persistQuizState = async (state: ActiveQuizState | null, completed = false) => {
    try {
      const subjectHint = state?.topic ? getSubjectForTopic(state.topic) : undefined;
      await fetchWithRetry(`/api/student/${student.rollNo}/quiz-state?classId=${student.classId || "xii-a"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizState: state, completed, subjectHint }),
      });
    } catch (err) {
      console.error("Failed to persist quiz state:", err);
    }
  };

  const fetchNextQuestion = async (currentState: ActiveQuizState) => {
    cancelPrefetch();
    setQuizLoading(true);
    setQuizError(null);
    abortControllerRef.current = new AbortController();

    try {
      const subjectHint = getSubjectForTopic(currentState.topic);
      const res = await fetch("/api/gemini/generate-quiz-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: currentState.topic, 
          difficulty: currentState.difficulty, 
          previousQuestions: currentState.history.map(h => h.question)
        }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error("Failed to generate question");
      const data = await res.json();
      setCurrentQuestion(data);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setQuizLoading(false);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error(err);
      setQuizError("Connection interrupted. The AI couldn't generate the next question.");
      setQuizLoading(false);
    }
  };

  const handleStartQuiz = () => {
    if (!quizTopic) return;
    const initialState: ActiveQuizState = {
      topic: quizTopic,
      difficulty: "medium",
      roundsCompleted: 0,
      correctCount: 0,
      history: [],
      startedAt: new Date().toISOString()
    };
    setQuizState(initialState);
    setQuizStarted(true);
    setQuizFinished(false);
    setCurrentQuestion(null);
    setQuizError(null);
    persistQuizState(initialState);
    fetchNextQuestion(initialState);
    if (onQuizStateChange) onQuizStateChange(true);
  };

  const handleSelectAnswer = (index: number) => {
    if (!showFeedback) setSelectedAnswer(index);
  };

  const handleConfirmAnswer = async () => {
    if (selectedAnswer === null || !quizState || !currentQuestion) return;
    setShowFeedback(true);
    const isCorrect = selectedAnswer === currentQuestion.answerIndex;

    const newHistory = [...quizState.history, {
      question: currentQuestion.question,
      userAnswer: currentQuestion.options[selectedAnswer],
      correctAnswer: currentQuestion.options[currentQuestion.answerIndex],
      correct: isCorrect,
      difficulty: quizState.difficulty,
      explanation: currentQuestion.explanation
    }];

    let newDifficulty = quizState.difficulty;
    if (isCorrect) {
      if (quizState.difficulty === "easy") newDifficulty = "medium";
      else if (quizState.difficulty === "medium") newDifficulty = "hard";
    } else {
      if (quizState.difficulty === "hard") newDifficulty = "medium";
      else if (quizState.difficulty === "medium") newDifficulty = "easy";
    }

    const newState: ActiveQuizState = {
      ...quizState,
      correctCount: quizState.correctCount + (isCorrect ? 1 : 0),
      roundsCompleted: quizState.roundsCompleted + 1,
      history: newHistory,
      difficulty: newDifficulty
    };

    setQuizState(newState);

    if (newState.roundsCompleted >= 5) {
      await persistQuizState(newState, true); // True indicates completion, backend processes score
      setTimeout(() => {
        setQuizFinished(true);
        if (onQuizStateChange) onQuizStateChange(false);
        syncStudentData(true);
      }, 2000);
    } else {
      await persistQuizState(newState);
      // Pre-fetch next question in background (ignored for now since we wait for user click, but let's keep logic simple)
    }
  };

  const handleNextQuestion = () => {
    if (quizState && quizState.roundsCompleted < 5) {
      fetchNextQuestion(quizState);
    }
  };

  const handleRestartQuiz = async () => {
    cancelPrefetch();
    // BUG FIX: clear from backend so it doesn't resume on reload
    await persistQuizState(null, false);
    
    setQuizStarted(false);
    setQuizFinished(false);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setQuizState(null);
    setQuizError(null);
    if (onQuizStateChange) onQuizStateChange(false);
  };

  return (
    <div className={`p-5 sm:p-7 rounded-[2rem] border transition-all duration-300 relative overflow-hidden flex flex-col ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
      {/* Quiz UI Header and Content */}
      <div className="flex items-center justify-between mb-6 z-10 relative">
        <h3 className={`text-sm font-black font-display tracking-tight flex items-center gap-2 ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          Adaptive AI Quiz Panel
        </h3>
        {quizStarted && !quizFinished && (
          <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400">
            Round {(quizState?.roundsCompleted || 0) + 1} of 5
          </div>
        )}
      </div>

      <div className="relative z-10 space-y-6">
        <AnimatePresence>
          {!quizStarted ? (
            /* Pre-Quiz Selection */
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full border ${darkMode
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/20"
                  : "bg-indigo-50 text-indigo-600 border-indigo-100"}`}>
                  Adaptive AI Quiz
                </span>
              </div>
              <h3 className={`text-2xl font-black font-display ${darkMode ? "text-white" : "text-slate-900"}`}>
                Adaptive Assessment Session
              </h3>
              <p className={`text-sm leading-relaxed font-semibold ${darkMode ? "text-indigo-200" : "text-slate-700"}`}>
                5 questions, one at a time. Difficulty adjusts based on your answers — correct gets harder, wrong gets easier. Full performance report at the end.
              </p>

              {quizError && (
                <div className="p-3 bg-rose-950/60 border border-rose-900/40 text-rose-300 rounded-xl flex items-center gap-2 text-sm font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{quizError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-3 items-stretch sm:items-end">
                <div className="flex-1 min-w-0 space-y-2">
                  <label className={`block text-xs font-black uppercase tracking-wider ${darkMode ? "text-indigo-300" : "text-indigo-600"}`}>
                    Select Topic
                  </label>
                  <div className="relative">
                    <select
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      className={`w-full border rounded-xl pl-4 pr-10 py-3 text-base font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none ${darkMode
                        ? "bg-slate-950 text-white border-slate-800"
                        : "bg-slate-50 text-slate-900 border-slate-200"}`}
                    >
                      {activeTopics.map((chap) => (
                        <option key={chap} value={chap}>{chap}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <button
                  onClick={handleStartQuiz}
                  disabled={quizLoading}
                  className={`font-extrabold text-sm px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 min-w-[180px] ${darkMode
                    ? "bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white"}`}
                >
                  {quizLoading ? (
                    <><Loader className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Start Quiz</>
                  )}
                </button>
              </div>
            </div>
          ) : quizFinished && quizState ? (
            /* Performance Report */
            <div className="space-y-6 max-w-2xl">
              <div className="text-center space-y-2">
                <span className={`text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full border ${darkMode ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                  Session Complete
                </span>
                <h3 className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                  Performance Report
                </h3>
                <p className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Topic: {quizState.topic}
                </p>
              </div>

              {/* Score card */}
              <div className={`p-5 rounded-2xl border text-center ${darkMode ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-6xl font-black text-indigo-600">{quizState.correctCount}</span>
                  <div className="text-left">
                    <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>out of 5</p>
                    <p className={`text-sm font-extrabold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                      {quizState.correctCount === 5 ? "🏆 Perfect!" : quizState.correctCount >= 4 ? "🌟 Excellent!" : quizState.correctCount >= 3 ? "👍 Good work" : quizState.correctCount >= 2 ? "📚 Keep practicing" : "💪 Don't give up!"}
                    </p>
                  </div>
                </div>
                <div className={`h-2 rounded-full mt-4 ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                  <div className={`h-full rounded-full transition-all duration-700 ${quizState.correctCount >= 4 ? "bg-emerald-500" : quizState.correctCount >= 3 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ width: `${(quizState.correctCount / 5) * 100}%` }} />
                </div>
              </div>

              {/* Difficulty progression */}
              <div>
                <p className={`text-xs font-black uppercase tracking-wider mb-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Question Breakdown</p>
                <div className="space-y-2">
                  {quizState.history.map((h, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${darkMode ? "bg-slate-800/40 border-slate-700/40" : "bg-slate-50 border-slate-100"}`}>
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${h.correct ? (darkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700") : (darkMode ? "bg-rose-500/20 text-rose-400" : "bg-rose-100 text-rose-600")}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${h.difficulty === "hard" ? "bg-rose-100 text-rose-600" : h.difficulty === "medium" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                            {h.difficulty}
                          </span>
                          <span className={`text-xs font-bold ${h.correct ? (darkMode ? "text-emerald-400" : "text-emerald-700") : (darkMode ? "text-rose-400" : "text-rose-600")}`}>
                            {h.correct ? "✓ Correct" : "✗ Incorrect"}
                          </span>
                        </div>
                        <div className={`text-xs mt-1 leading-snug line-clamp-2 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{parseMarkdownAndMath(h.question)}</div>
                        {!h.correct && (
                          <div className={`text-[10px] mt-1 leading-snug ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{parseMarkdownAndMath(h.explanation)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              {quizState.correctCount < 5 && (
                <div className={`p-4 rounded-2xl border ${darkMode ? "bg-indigo-950/40 border-indigo-800/40" : "bg-indigo-50 border-indigo-100"}`}>
                  <p className={`text-xs font-extrabold uppercase tracking-wider mb-1 ${darkMode ? "text-indigo-300" : "text-indigo-600"}`}>Study Recommendation</p>
                  <p className={`text-xs font-semibold leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Review the incorrect questions above and revisit your {quizState.topic} notes. Focus on the explanations provided — they target the exact concept gaps.
                  </p>
                </div>
              )}

              <button
                onClick={handleRestartQuiz}
                className="w-full flex items-center justify-center gap-2 py-3 font-extrabold text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
              >
                <RefreshCw className="h-4 w-4" /> Start New Quiz
              </button>
            </div>
          ) : (
            /* Active Question */
            <div className="space-y-5 max-w-2xl">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className={`text-[10px] font-extrabold tracking-widest uppercase ${darkMode ? "text-indigo-300" : "text-indigo-600"}`}>
                    Active Assessment
                  </span>
                  <h4 className={`text-base font-black mt-0.5 ${darkMode ? "text-white" : "text-slate-900"}`}>
                    {quizState?.topic || quizTopic}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  {/* Progress dots */}
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i < (quizState?.roundsCompleted || 0)
                        ? (quizState?.history[i]?.correct ? "bg-emerald-500" : "bg-rose-500")
                        : i === (quizState?.roundsCompleted || 0) ? "bg-indigo-500 animate-pulse" : (darkMode ? "bg-slate-700" : "bg-slate-200")}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-bold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {(quizState?.roundsCompleted || 0) + 1}/5
                  </span>
                  {/* Difficulty badge */}
                  {quizState && (
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${quizState.difficulty === "hard" ? "bg-rose-100 text-rose-700" : quizState.difficulty === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {quizState.difficulty}
                    </span>
                  )}
                </div>
              </div>

              {quizLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className={`text-sm font-bold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Generating next question...</p>
                </div>
              ) : quizError ? (
                <div className="space-y-4 py-8 text-center max-w-md mx-auto">
                  <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className={`text-sm font-black ${darkMode ? "text-white" : "text-slate-900"}`}>Failed to load question</h4>
                    <p className={`text-xs font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{quizError}</p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => quizState && fetchNextQuestion(quizState)}
                      className="px-4 py-2 font-extrabold text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleRestartQuiz}
                      className={`px-4 py-2 font-extrabold text-xs rounded-xl border transition-all cursor-pointer ${darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      Exit Quiz
                    </button>
                  </div>
                </div>
              ) : currentQuestion ? (
                <div ref={quizCardRef} className={`p-5 rounded-2xl border space-y-4 ${darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  {/* Question */}
                  <div className={`text-sm font-bold leading-relaxed select-text ${darkMode ? "text-white" : "text-slate-900"}`}>
                    {parseMarkdownAndMath(currentQuestion.question)}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentQuestion.options.map((opt: string, optIdx: number) => {
                      const isSelected = selectedAnswer === optIdx;
                      const isCorrect = optIdx === currentQuestion.answerIndex;

                      let style = "";
                      if (showFeedback) {
                        if (isCorrect) style = darkMode ? "bg-emerald-600 border-emerald-400 text-white" : "bg-emerald-50 border-emerald-300 text-emerald-700 font-extrabold";
                        else if (isSelected) style = darkMode ? "bg-rose-600 border-rose-400 text-white" : "bg-rose-50 border-rose-200 text-rose-600";
                        else style = "opacity-40 " + (darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-500");
                      } else {
                        style = isSelected
                          ? darkMode ? "bg-indigo-600 border-indigo-400 text-white" : "bg-indigo-50 border-indigo-300 text-indigo-700 font-extrabold"
                          : darkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750 hover:border-indigo-700" : "bg-white border-slate-200 text-slate-800 hover:bg-indigo-50 hover:border-indigo-200";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(optIdx)}
                          disabled={showFeedback}
                          className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all ${style} ${!showFeedback ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <span className="font-black text-[10px] opacity-60 mr-1.5">{["A", "B", "C", "D"][optIdx]}.</span>
                          <span>{parseBoldAndMathInline(opt)}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback area */}
                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-xl border ${selectedAnswer === currentQuestion.answerIndex
                        ? (darkMode ? "bg-emerald-950/40 border-emerald-800/40" : "bg-emerald-50 border-emerald-200")
                        : (darkMode ? "bg-rose-950/40 border-rose-800/40" : "bg-rose-50 border-rose-200")}`}
                    >
                      <p className={`text-xs font-extrabold mb-1 ${selectedAnswer === currentQuestion.answerIndex ? (darkMode ? "text-emerald-400" : "text-emerald-700") : (darkMode ? "text-rose-400" : "text-rose-600")}`}>
                        {selectedAnswer === currentQuestion.answerIndex ? "✓ Correct!" : "✗ Incorrect"}
                      </p>
                      <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                        {parseMarkdownAndMath(currentQuestion.explanation)}
                      </p>
                    </motion.div>
                  )}

                  {/* Action row */}
                  <div className="flex items-center justify-between gap-3">
                    {!showFeedback ? (
                      <button
                        onClick={handleConfirmAnswer}
                        disabled={selectedAnswer === null}
                        className="flex-1 py-3 font-extrabold text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
                      >
                        Confirm Answer
                      </button>
                    ) : (quizState?.roundsCompleted || 0) < 5 ? (
                      <button
                        onClick={handleNextQuestion}
                        className="flex-1 py-3 font-extrabold text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center justify-center gap-2"
                      >
                        Next Question <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button
                      onClick={handleRestartQuiz}
                      className={`px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${darkMode ? "bg-slate-800 text-slate-400 hover:text-slate-200" : "bg-slate-100 text-slate-500 hover:text-slate-700"}`}
                    >
                      Exit
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
