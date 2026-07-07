import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical,
  Award,
  Sparkles,
  BookOpen,
  MessageSquare,
  HelpCircle,
  BrainCircuit,
  ArrowRight,
  Plus,
  LogOut,
  Send,
  Loader,
  CheckCircle2,
  AlertCircle,
  Sliders,
  CheckSquare
} from "lucide-react";
import { Student, Doubt, CHEMISTRY_TOPICS, PHYSICS_TOPICS, MATHS_TOPICS, ALL_TOPICS, TopicName, TOPIC_RESOURCES } from "../types";
import katex from "katex";
import "katex/dist/katex.min.css";
import { fetchWithRetry } from "../lib/fetch";

// Dynamic translation map for standard topic formulas into beautiful textbook LaTeX
const FORMULA_LATEX_MAP: Record<string, string> = {
  // Chemistry
  "p_A = x_A • p_A°": "p_A = x_A \\cdot p_A^{\\circ}",
  "ΔT_b = i • K_b • m": "\\Delta T_b = i \\cdot K_b \\cdot m",
  "ΔT_f = i • K_f • m": "\\Delta T_f = i \\cdot K_f \\cdot m",
  "π = i • C • R • T": "\\pi = i \\cdot C \\cdot R \\cdot T",
  
  "E = E° - (0.0591 / n) • log(Q) [at 298K]": "E = E^{\\circ} - \\frac{0.0591}{n} \\log(Q) \\quad \\text{[at 298 K]}",
  "ΔG° = -n • F • E°": "\\Delta G^{\\circ} = -n \\cdot F \\cdot E^{\\circ}",
  "Λ°_m = ν_+ • λ°_+ + ν_- • λ°_-": "\\Lambda^{\\circ}_m = \\nu_+ \\lambda^{\\circ}_+ + \\nu_- \\lambda^{\\circ}_-",
  "R = ρ • (l/A) = (1/κ) • G*": "R = \\rho \\left(\\frac{l}{A}\\right) = \\frac{1}{\\kappa} G^*",
  
  "k = ([R]_0 - [R]) / t": "k = \\frac{[R]_0 - [R]}{t}",
  "k = (2.303 / t) • log([R]_0 / [R])": "k = \\frac{2.303}{t} \\log\\left(\\frac{[R]_0}{[R]}\\right)",
  "t_1/2 = 0.693 / k": "t_{1/2} = \\frac{0.693}{k}",
  "log(k_2/k_1) = (E_a / 2.303 R) • [1/T_1 - 1/T_2]": "\\log\\left(\\frac{k_2}{k_1}\\right) = \\frac{E_a}{2.303 R} \\left[\\frac{1}{T_1} - \\frac{1}{T_2}\\right]",
  
  "μ = √[n(n+2)] Bohr Magneton (BM)": "\\mu = \\sqrt{n(n+2)} \\quad \\text{BM}",
  "EAN = Z - (Oxidation State) + 2 • (Coordination Number)": "\\text{EAN} = Z - (\\text{Oxidation State}) + 2 \\cdot (\\text{Coordination Number})",
  
  // Physics
  "F = (1 / 4πε₀) • (q₁ q₂ / r²)": "F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}",
  "E = q / (4πε₀ r²)": "E = \\frac{q}{4\\pi\\varepsilon_0 r^2}",
  "V = q / (4πε₀ r)": "V = \\frac{q}{4\\pi\\varepsilon_0 r}",
  "C = K ε₀ A / d": "C = \\frac{K \\varepsilon_0 A}{d}",
  
  "v_d = e • E • τ / m": "v_d = \\frac{e E \\tau}{m}",
  "J = σ • E": "J = \\sigma E",
  "Σ ΔV = 0": "\\Sigma \\Delta V = 0",
  "P / Q = l / (100 - l)": "\\frac{P}{Q} = \\frac{l}{100 - l}",
  
  "dB = (μ₀ / 4π) • I (dl × r) / r³": "dB = \\frac{\\mu_0}{4\\pi} \\frac{I (dl \\times r)}{r^3}",
  "B = μ₀ I / (2π r)": "B = \\frac{\\mu_0 I}{2\\pi r}",
  "∮ B • dl = μ₀ I_encl": "\\oint B \\cdot dl = \\mu_0 I_{\\text{encl}}",
  "F_m = q (v × B)": "F_m = q (v \\times B)",
  
  "e = -dΦ / dt": "e = -\\frac{d\\Phi}{dt}",
  "e = B • v • l": "e = B v l",
  "Z = √[R² + (X_L - X_C)²]": "Z = \\sqrt{R^2 + (X_L - X_C)^2}",
  "f_r = 1 / (2π √(L C))": "f_r = \\frac{1}{2\\pi\\sqrt{L C}}",
  
  "I_d = ε₀ (dΦ_E / dt)": "I_d = \\varepsilon_0 \\left(\\frac{d\\Phi_E}{dt}\\right)",
  "c = 1 / √(μ₀ ε₀) = E₀ / B₀": "c = \\frac{1}{\\sqrt{\\mu_0\\varepsilon_0}} = \\frac{E_0}{B_0}",
  "I = c ε₀ E_rms²": "I = c \\varepsilon_0 E_{\\text{rms}}^2",
  
  "μ = sin((A + D_m)/2) / sin(A/2)": "\\mu = \\frac{\\sin\\left(\\frac{A + D_m}{2}\\right)}{\\sin\\left(\\frac{A}{2}\\right)}",
  "1/f = (μ - 1) • (1/R₁ - 1/R₂)": "\\frac{1}{f} = (\\mu - 1) \\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right)",
  "m = -(L/f_o) • (1 + D/f_e)": "m = -\\frac{L}{f_o} \\left(1 + \\frac{D}{f_e}\\right)",
  "m = -f_o / f_e": "m = -\\frac{f_o}{f_e}",
  
  "Δx = n • λ": "\\Delta x = n \\lambda",
  "Δx = (2n - 1) • λ / 2": "\\Delta x = (2n - 1) \\frac{\\lambda}{2}",
  "β = λ D / d": "\\beta = \\frac{\\lambda D}{d}",
  "μ = tan(i_p)": "\\mu = \\tan(i_p)",
  
  "K_max = h ν - Φ₀ = h ν - h ν₀": "K_{\\text{max}} = h\\nu - \\Phi_0 = h\\nu - h\\nu_0",
  "e V₀ = h ν - h ν₀": "e V_0 = h\\nu - h\\nu_0",
  "λ = h / p = h / √(2 m K)": "\\lambda = \\frac{h}{p} = \\frac{h}{\\sqrt{2 m K}}",
  "λ = 12.27 / √V Å": "\\lambda = \\frac{12.27}{\\sqrt{V}} \\text{ \\AA}",
  
  "m v r = n h / 2π": "m v r = \\frac{n h}{2\\pi}",
  "E_n = -13.6 • Z² / n² [eV]": "E_n = -13.6 \\frac{Z^2}{n^2} \\text{ eV}",
  "R = R₀ • A^(1/3)": "R = R_0 A^{1/3}",
  "E = Δm • c²": "E = \\Delta m \\cdot c^2",
  
  "n_i² = n_e • n_h": "n_i^2 = n_e \\cdot n_h",
  
  // Maths
  "2^(n(n+1)/2)": "2^{\\frac{n(n+1)}{2}}",
  "2^(n² - n)": "2^{n^2 - n}",
  "D: [-1, 1], R: [-π/2, π/2]": "\\text{Domain: } [-1, 1], \\quad \\text{Range: } \\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]",
  "D: [-1, 1], R: [0, π]": "\\text{Domain: } [-1, 1], \\quad \\text{Range: } [0, \\pi]",
  "D: R, R: (-π/2, π/2)": "\\text{Domain: } \\mathbb{R}, \\quad \\text{Range: } \\left(-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]",
  
  "A⁻¹ = (1 / |A|) • adj(A)": "A^{-1} = \\frac{1}{|A|} \\text{adj}(A)",
  "|adj(A)| = |A|^(n - 1)": "|\\text{adj}(A)| = |A|^{n-1}",
  "|A • B| = |A| • |B|": "|A \\cdot B| = |A| \\cdot |B|",
  "Area = 0.5 • |x₁(y₂ - y₃) + x₂(y₃ - y₁) + x₃(y₁ - y₂)|": "\\text{Area} = \\frac{1}{2} |x_1(y_2 - y_3) + x_2(y_3 - y_1) + x_3(y_1 - y_2)|",
  
  "d/dx (x^x) = x^x (1 + ln x)": "\\frac{d}{dx}(x^x) = x^x(1 + \\ln x)",
  "dy/dx = (dy/du) • (du/dx)": "\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}",
  "dy/dx = (dy/dt) / (dx/dt)": "\\frac{dy}{dx} = \\frac{dy/dt}{dx/dt}",
  
  "m_t = f'(x_0)": "m_t = f'(x_0)",
  "m_n = -1 / f'(x_0)": "m_n = -\\frac{1}{f'(x_0)}",
  "f'(c) = 0": "f'(c) = 0",
  
  "∫ u v dx = u ∫ v dx - ∫ [u' ∫ v dx] dx": "\\int u v \\, dx = u \\int v \\, dx - \\int \\left(u' \\int v \\, dx\\right) dx",
  "∫_a^b f(x) dx = ∫_a^b f(a + b - x) dx": "\\int_{a}^{b} f(x) \\, dx = \\int_{a}^{b} f(a + b - x) \\, dx",
  "∫_{-a}^a f(x) dx = 2∫_0^a f(x) dx [if even], 0 [if odd]": "\\int_{-a}^{a} f(x) \\, dx = \\begin{cases} 2\\int_{0}^{a} f(x) \\, dx & \\text{if even} \\\\ 0 & \\text{if odd} \\end{cases}",
  "∫ dx / √(a² - x²) = sin⁻¹(x/a) + C": "\\int \\frac{dx}{\\sqrt{a^2 - x^2}} = \\sin^{-1}\\left(\\frac{x}{a}\\right) + C",
  
  "Area = ∫_a^b y dx": "\\text{Area} = \\int_{a}^{b} y \\, dx",
  "Area = ∫_a^b (y_upper - y_lower) dx": "\\text{Area} = \\int_{a}^{b} (y_{\\text{upper}} - y_{\\text{lower}}) \\, dx",
  
  "dy/dx + P • y = Q": "\\frac{dy}{dx} + P y = Q",
  "I.F. = e^(∫ P dx)": "\\text{I.F.} = e^{\\int P \\, dx}",
  "y • I.F. = ∫ (Q • I.F.) dx + C": "y \\cdot \\text{I.F.} = \\int (Q \\cdot \\text{I.F.}) \\, dx + C",
  
  "a • b = |a| |b| cos(θ)": "\\vec{a} \\cdot \\vec{b} = |\\vec{a}| |\\vec{b}| \\cos(\\theta)",
  "a × b = |a| |b| sin(θ) n̂": "\\vec{a} \\times \\vec{b} = |\\vec{a}| |\\vec{b}| \\sin(\\theta) \\hat{n}",
  "d = |(a₂ - a₁) • (b₁ × b₂)| / |b₁ × b₂|": "d = \\frac{|(\\vec{a}_2 - \\vec{a}_1) \\cdot (\\vec{b}_1 \\times \\vec{b}_2)|}{|\\vec{b}_1 \\times \\vec{b}_2|}",
  "cos(θ) = |A₁A₂ + B₁B₂ + C₁C₂| / [√(ΣA₁²) √(ΣA₂²)]": "\\cos(\\theta) = \\frac{|A_1 A_2 + B_1 B_2 + C_1 C_2|}{\\sqrt{\\Sigma A_1^2} \\sqrt{\\Sigma A_2^2}}",
  
  "P(A|B) = P(A ∩ B) / P(B)": "P(A|B) = \\frac{P(A \\cap B)}{P(B)}",
  "P(E_i|A) = P(E_i)P(A|E_i) / [Σ P(E_j)P(A|E_j)]": "P(E_i|A) = \\frac{P(E_i)P(A|E_i)}{\\sum P(E_j)P(A|E_j)}",
  "E(X) = Σ x_i • p(x_i)": "E(X) = \\sum x_i p(x_i)"
};

// Pure React component for rendering any math strings via KaTeX
const MathRenderer: React.FC<{ math: string; block?: boolean }> = ({ math, block = false }) => {
  const containerRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      try {
        const formulaToRender = FORMULA_LATEX_MAP[math] || math;
        katex.render(formulaToRender, containerRef.current, {
          displayMode: block,
          throwOnError: false,
        });
      } catch (err) {
        console.error("KaTeX render error:", err);
        containerRef.current.textContent = math;
      }
    }
  }, [math, block]);

  return <span ref={containerRef} className={block ? "block my-2" : "inline-block"} />;
};

// Markdown + LaTeX Parser and Renderer
const parseMarkdownAndMath = (text: string) => {
  if (!text) return null;
  // First, parse into blocks (either standard text or block math)
  const parts = text.split(/(\$\$[\s\S]*?\$\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const math = part.slice(2, -2).trim();
      return <MathRenderer key={index} math={math} block={true} />;
    }
    
    // Now split the normal text by inline math $...$
    const subParts = part.split(/(\$[\s\S]*?\$)/g);
    return subParts.map((subPart, subIndex) => {
      if (subPart.startsWith("$") && subPart.endsWith("$")) {
        const math = subPart.slice(1, -1).trim();
        return <MathRenderer key={`${index}-${subIndex}`} math={math} block={false} />;
      }
      
      // For standard text, render simple line/bullet elements
      return renderSimpleMarkdown(subPart, `${index}-${subIndex}`);
    });
  });
};

const renderSimpleMarkdown = (text: string, keyPrefix: string) => {
  const lines = text.split("\n");
  return (
    <div key={keyPrefix} className="space-y-1.5">
      {lines.map((line, idx) => {
        const cleanLine = line;
        
        // Headers: e.g. ### Header or ## Header
        if (cleanLine.startsWith("### ")) {
          return (
            <h4 key={idx} className="text-xs font-black text-slate-800 mt-2.5 mb-1 flex items-center gap-1.5">
              {parseBoldText(cleanLine.slice(4))}
            </h4>
          );
        }
        if (cleanLine.startsWith("## ")) {
          return (
            <h3 key={idx} className="text-sm font-black text-slate-900 mt-3.5 mb-1.5 flex items-center gap-2">
              {parseBoldText(cleanLine.slice(3))}
            </h3>
          );
        }
        if (cleanLine.startsWith("# ")) {
          return (
            <h2 key={idx} className="text-base font-black text-slate-900 mt-4 mb-2 flex items-center gap-2.5">
              {parseBoldText(cleanLine.slice(2))}
            </h2>
          );
        }

        // Bullet points: e.g., - Item or * Item
        if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ")) {
          return (
            <div key={idx} className="flex gap-2 text-xs text-slate-700 font-medium pl-2 leading-relaxed">
              <span className="text-indigo-500 font-black shrink-0">•</span>
              <span>{parseBoldText(cleanLine.slice(2))}</span>
            </div>
          );
        }
        
        // Ordered list item: e.g., 1. Item
        const numberedMatch = cleanLine.match(/^(\d+)\.\s(.*)/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex gap-2 text-xs text-slate-700 font-medium pl-2 leading-relaxed">
              <span className="text-indigo-500 font-extrabold shrink-0">{numberedMatch[1]}.</span>
              <span>{parseBoldText(numberedMatch[2])}</span>
            </div>
          );
        }

        // Standard paragraph
        if (!cleanLine.trim()) return <div key={idx} className="h-1" />;
        
        return (
          <p key={idx} className="text-xs text-slate-600 leading-relaxed font-medium">
            {parseBoldText(cleanLine)}
          </p>
        );
      })}
    </div>
  );
};

const parseBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return <strong key={index} className="font-extrabold text-slate-900">{boldText}</strong>;
    }
    
    const subParts = part.split(/(`.*?`)/g);
    return subParts.map((subPart, subIndex) => {
      if (subPart.startsWith("`") && subPart.endsWith("`")) {
        const codeText = subPart.slice(1, -1);
        return (
          <code key={`${index}-${subIndex}`} className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded font-mono text-[11px] font-bold">
            {codeText}
          </code>
        );
      }
      return subPart;
    });
  });
};

interface StudentViewProps {
  student: Student;
  onLogout: () => void;
}

// Mini chemistry-quiz questions
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What is the unit of rate constant (k) for a first-order chemical reaction?",
    options: ["s⁻¹", "mol L⁻¹ s⁻¹", "L mol⁻¹ s⁻¹", "L² mol⁻² s⁻¹"],
    answerIndex: 0,
    explanation: "For a first-order reaction, rate = k[A]. Thus k = s⁻¹."
  },
  {
    id: 2,
    question: "Which of the following colligative properties is most suitable for determining the molecular mass of proteins?",
    options: ["Relative lowering of vapor pressure", "Elevation of boiling point", "Depression of freezing point", "Osmotic pressure"],
    answerIndex: 3,
    explanation: "Osmotic pressure is measured at room temperature and has significant magnitude even for dilute polymer solutions."
  },
  {
    id: 3,
    question: "In coordination compounds, primary valency is ionizable and represents the _______ of the metal.",
    options: ["Coordination Number", "Oxidation State", "Hybridization", "Magnetic Moment"],
    answerIndex: 1,
    explanation: "According to Werner, primary valency corresponds to the oxidation state of the central metal."
  },
  {
    id: 4,
    question: "Which organic name reaction is used to prepare primary amines from phthalimide?",
    options: ["Hoffmann Bromamide Degradation", "Gabriel Phthalimide Synthesis", "Carbylamine Reaction", "Stephen Reaction"],
    answerIndex: 1,
    explanation: "Gabriel Phthalimide synthesis is specifically used for preparing pure primary aliphatic amines."
  },
  {
    id: 5,
    question: "What stabilizes the secondary alpha-helix structure of proteins?",
    options: ["Disulfide cross-linkages", "Covalent peptide bonds", "Intramolecular Hydrogen bonds", "Hydrophobic interactions"],
    answerIndex: 2,
    explanation: "Alpha-helix and Beta-sheet folds are stabilized by hydrogen bonding between amide C=O and N-H groups."
  }
];

export default function StudentView({ student: initialStudent, onLogout }: StudentViewProps) {
  const [student, setStudent] = useState<Student>(initialStudent);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicName | null>(null);
  
  // Subject Navigation Tab
  const [activeSubject, setActiveSubject] = useState<"Chemistry" | "Physics" | "Mathematics">("Chemistry");

  // Chapter Companion Tabs
  const [activeTab, setActiveTab] = useState<"cheat" | "milestones" | "ai" | "doubts">("cheat");
  
  // AI Tutor States
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiChat, setAiChat] = useState<{ q: string; a: string; loading?: boolean }[]>([]);
  
  // Submit Doubt States
  const [newDoubtQuestion, setNewDoubtQuestion] = useState("");
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [doubtSuccess, setDoubtSuccess] = useState(false);

  // Quiz States
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Milestones local checklist states
  const [localMilestones, setLocalMilestones] = useState<boolean[]>([false, false, false, false]);
  const [localScore, setLocalScore] = useState<number>(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [saveProgressSuccess, setSaveProgressSuccess] = useState(false);

  // Determine active topics based on chosen subject
  const activeTopics = activeSubject === "Physics" 
    ? PHYSICS_TOPICS 
    : (activeSubject === "Mathematics" ? MATHS_TOPICS : CHEMISTRY_TOPICS);

  // Fetch updated student record and doubts on mount
  useEffect(() => {
    // Sync current student progress from db
    fetchWithRetry(`/api/student/${student.rollNo}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setStudent(data);
      })
      .catch((err) => console.error("Error refreshing student data:", err));

    // Fetch doubts
    fetchWithRetry(`/api/student/${student.rollNo}/doubts`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDoubts(data);
      })
      .catch((err) => console.error("Error fetching doubts:", err));
  }, [student.rollNo]);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (selectedTopic) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedTopic]);

  // Sync modal states whenever a topic is selected
  useEffect(() => {
    if (selectedTopic) {
      const currentScore = student.scores[selectedTopic] || 0;
      setLocalScore(currentScore);
      
      const currentMilestones = student.milestones?.[selectedTopic] || [false, false, false, false];
      setLocalMilestones(currentMilestones);
      setSaveProgressSuccess(false);
    }
  }, [selectedTopic, student]);

  // Calculate overall progress (for active subject or total)
  const topicKeys = Object.keys(student.scores);
  
  // Calculate average for active subject
  const subjectScores = activeTopics.map(t => student.scores[t] || 0);
  const activeSubjectAvg = subjectScores.length > 0
    ? Math.round(subjectScores.reduce((sum, v) => sum + v, 0) / subjectScores.length)
    : 0;

  // Calculate overall master average across all 30 subjects
  const overallAvg = topicKeys.length > 0
    ? Math.round(topicKeys.reduce((sum, k) => sum + (student.scores[k] || 0), 0) / topicKeys.length)
    : 0;

  // Gamified Chemical State classification
  let chemicalState = "Absolute Zero";
  let chemicalStateDesc = "No particles are currently moving. Energy level is minimal.";
  let stateColor = "text-slate-400 bg-slate-900/50 border-slate-800";
  let beakerLiquidColor = "bg-slate-500/30";

  if (overallAvg > 0 && overallAvg <= 30) {
    chemicalState = "Excited Gas";
    chemicalStateDesc = "Highly active particles moving in all directions! Highly disordered, rapid reaction.";
    stateColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
    beakerLiquidColor = "bg-rose-500/60";
  } else if (overallAvg > 30 && overallAvg <= 69) {
    chemicalState = "Homogeneous Solute";
    chemicalStateDesc = "Flowing steadily. Molecules are suspended, forming a stable chemical mixture.";
    stateColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
    beakerLiquidColor = "bg-amber-500/60";
  } else if (overallAvg > 69 && overallAvg <= 99) {
    chemicalState = "Solid Lattice Crystal";
    chemicalStateDesc = "Highly structured! Molecules are arranged in a perfect crystalline state.";
    stateColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    beakerLiquidColor = "bg-emerald-500/60";
  } else if (overallAvg === 100) {
    chemicalState = "Stable Noble Gas";
    chemicalStateDesc = "Perfect inert octet completed! Highly stable and completely mastered.";
    stateColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
    beakerLiquidColor = "bg-purple-500/70";
  }

  // Calculated Lab IQ
  const labIq = 100 + Math.round(overallAvg * 0.8) + (quizSubmitted && quizScore === 5 ? 20 : 0);

  const getInitials = (name: string) => {
    if (!name) return "ST";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getTopicAbbreviation = (topic: string): { code: string; colorClass: string; barColor: string } => {
    // Generate code from topic name
    const words = topic.split(/[\s-]+/);
    let code = "SC";
    if (words.length >= 2) {
      code = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words[0]) {
      code = words[0].slice(0, 2).toUpperCase();
    }
    
    // Choose nice color scheme based on first letter or hash
    const charCode = topic.charCodeAt(0) + topic.charCodeAt(topic.length - 1 || 0);
    const colors = [
      { colorClass: "bg-blue-50 text-blue-600 border border-blue-100", barColor: "bg-blue-500" },
      { colorClass: "bg-amber-50 text-amber-600 border border-amber-100", barColor: "bg-amber-500" },
      { colorClass: "bg-violet-50 text-violet-600 border border-violet-100", barColor: "bg-violet-500" },
      { colorClass: "bg-rose-50 text-rose-600 border border-rose-100", barColor: "bg-rose-500" },
      { colorClass: "bg-emerald-50 text-emerald-600 border border-emerald-100", barColor: "bg-emerald-500" },
      { colorClass: "bg-cyan-50 text-cyan-600 border border-cyan-100", barColor: "bg-cyan-500" },
      { colorClass: "bg-purple-50 text-purple-600 border border-purple-100", barColor: "bg-purple-500" },
      { colorClass: "bg-orange-50 text-orange-600 border border-orange-100", barColor: "bg-orange-500" },
      { colorClass: "bg-indigo-50 text-indigo-600 border border-indigo-100", barColor: "bg-indigo-500" },
      { colorClass: "bg-teal-50 text-teal-600 border border-teal-100", barColor: "bg-teal-500" },
    ];
    const color = colors[charCode % colors.length];
    return { code, ...color };
  };

  const lowestTopic = activeTopics.reduce((lowest, topic) => {
    const currentScore = student.scores[topic] || 0;
    const lowestScore = student.scores[lowest] || 0;
    return currentScore < lowestScore ? topic : lowest;
  }, activeTopics[0]);

  // Handle AI question submission
  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    const userQ = aiQuestion;
    setAiQuestion("");
    setAiChat((prev) => [...prev, { q: userQ, a: "", loading: true }]);

    try {
      const res = await fetchWithRetry("/api/gemini/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: selectedTopic, question: userQ }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI could not process this prompt");

      setAiChat((prev) =>
        prev.map((chat) => (chat.q === userQ ? { q: userQ, a: data.reply } : chat))
      );
    } catch (err: any) {
      setAiChat((prev) =>
        prev.map((chat) =>
          chat.q === userQ
            ? { q: userQ, a: `AI Tutor Desk is currently busy. Please try again shortly!` }
            : chat
        )
      );
    }
  };

  // Handle doubt submission
  const handleAddDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoubtQuestion.trim() || !selectedTopic) return;

    setDoubtLoading(true);
    setDoubtSuccess(false);

    try {
      const res = await fetchWithRetry(`/api/student/${student.rollNo}/doubt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          question: newDoubtQuestion,
          studentName: student.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit doubt");

      setDoubts((prev) => [...prev, data.doubt]);
      setNewDoubtQuestion("");
      setDoubtSuccess(true);
      setTimeout(() => setDoubtSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setDoubtLoading(false);
    }
  };

  // Handle Quiz Submission
  const handleQuizSubmit = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (quizAnswers[q.id] === q.answerIndex) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  // Milestone checkbook details & weights
  const milestonesList = [
    { label: "NCERT Reading, Theory & Solved Examples", weight: 30, desc: "Line-by-line reading & board-level derivation mastery" },
    { label: "NCERT Back Exercises & Exemplar Problems", weight: 20, desc: "Solving standard questions & conceptual board problems" },
    { label: "JEE Main Chapter-wise PYQs (Last 5 Years)", weight: 30, desc: "Timed practice of online shift papers with error tracking" },
    { label: "JEE Advanced Selected PYQs & Mock Practice", weight: 20, desc: "Deep analytical problems and multiple-correct question tests" }
  ];

  // Toggle checklist checkbox
  const handleToggleMilestone = (idx: number) => {
    const updatedMilestones = [...localMilestones];
    updatedMilestones[idx] = !updatedMilestones[idx];
    setLocalMilestones(updatedMilestones);

    // Compute hardcoded progress
    const computedScore = updatedMilestones.reduce((sum, checked, i) => {
      return sum + (checked ? milestonesList[i].weight : 0);
    }, 0);

    setLocalScore(computedScore);
  };

  // Slider manual adjustments
  const handleSliderChange = (val: number) => {
    setLocalScore(val);
    if (val === 100) {
      setLocalMilestones([true, true, true, true]);
    } else if (val === 0) {
      setLocalMilestones([false, false, false, false]);
    }
  };

  // Push score and milestones progress to backend SAMS (No Google Sheets required)
  const handleSaveProgress = async () => {
    if (!selectedTopic) return;
    setSavingProgress(true);
    setSaveProgressSuccess(false);

    try {
      const res = await fetchWithRetry(`/api/student/${student.rollNo}/save-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          score: localScore,
          milestones: localMilestones
        })
      });

      const data = await res.json();
      if (res.ok && data.student) {
        setStudent(data.student);
        setSaveProgressSuccess(true);
        setTimeout(() => setSaveProgressSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error saving milestones:", err);
    } finally {
      setSavingProgress(false);
    }
  };

  return (
    <div id="student-view-container" className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Sleek Navigation Bar */}
      <nav id="student-nav-bar" className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-600/10">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">SAMS <span className="text-indigo-600">Academic Monitor</span></span>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 md:gap-6 justify-center sm:justify-end">
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Active Server Connection</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500 uppercase leading-none mb-1">Student Portal</p>
              <p className="text-sm font-bold text-slate-800 leading-none">{student.name}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600 text-xs uppercase" title={`Roll No: ${student.rollNo}`}>
              {getInitials(student.name)}
            </div>
            <button
              id="student-logout-button"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Terminate session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 grid grid-cols-12 gap-6 md:gap-8 overflow-y-auto max-w-7xl w-full mx-auto">
        {/* Left Column: Sidebar widgets */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          {/* Profile Overview Card */}
          <div className="glass-panel rounded-[1.5rem] p-6 shadow-xl shadow-slate-100/50">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-display">Academic Credentials</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Registration Number</p>
                <p className="font-semibold text-slate-800 text-sm">2026-XII-A-{String(student.rollNo).padStart(3, '0')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Academic Coordinator</p>
                <p className="font-semibold text-slate-800 text-sm">Mr. Pradeep Gusain</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Registered Contact</p>
                <p className="font-semibold text-slate-800 text-sm">{student.phone}</p>
              </div>
            </div>
          </div>

          {/* Mastery Score Card (Deep Indigo Theme) */}
          <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-800 rounded-full blur-2xl opacity-50 pointer-events-none" />
            <h2 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 font-display">{activeSubject} Average</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black font-display">{activeSubjectAvg}%</span>
              <span className="text-indigo-300 text-xs">Unit Completion</span>
            </div>
            <div className="mt-6 w-full h-2 bg-indigo-800 rounded-full overflow-hidden">
              <div className="bg-indigo-400 h-full rounded-full transition-all duration-1000" style={{ width: `${activeSubjectAvg}%` }} />
            </div>
            <p className="mt-4 text-xs text-indigo-200 leading-relaxed italic">
              "Focus on {lowestTopic} to raise your {activeSubject} standing."
            </p>
          </div>

          {/* Global Average Progress Card */}
          <div className="bg-gradient-to-tr from-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <h2 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2 font-display">Overall Academic Average</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-display">{overallAvg}%</span>
              <span className="text-indigo-200 text-xs">Across All Core Syllabus Units</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Chemistry</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Physics</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Mathematics</span>
            </div>
          </div>

          {/* Research Badges section */}
          <div className="glass-panel rounded-[1.5rem] p-6 shadow-xl shadow-slate-100/50 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Academic Accomplishments
              </h4>
              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full font-mono">
                {
                  [
                    overallAvg > 0,
                    topicKeys.filter((k) => student.scores[k] === 100).length >= 3,
                    topicKeys.every((k) => (student.scores[k] || 0) >= 50),
                    doubts.length > 0,
                    quizSubmitted && quizScore === 5
                  ].filter(Boolean).length
                }/5 Verified
              </span>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {/* Badge 1: Reaction Initiated */}
              <div className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${overallAvg > 0 ? "bg-emerald-50/50 border-emerald-100 text-slate-800" : "bg-slate-50/50 border-slate-100 grayscale opacity-50"}`}>
                <div className="p-1.5 rounded-lg bg-emerald-500 text-white shrink-0">
                  <FlaskConical className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h5 className="text-[11px] font-extrabold text-slate-800 leading-none">Curriculum Initiated</h5>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Commenced first syllabus unit</p>
                </div>
              </div>

              {/* Badge 2: Stable Octet */}
              <div className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${topicKeys.filter((k) => student.scores[k] === 100).length >= 3 ? "bg-purple-50/50 border-purple-100 text-slate-800" : "bg-slate-50/50 border-slate-100 grayscale opacity-50"}`}>
                <div className="p-1.5 rounded-lg bg-purple-500 text-white shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h5 className="text-[11px] font-extrabold text-slate-800 leading-none">Distinction Mastery</h5>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Completed three units at 100%</p>
                </div>
              </div>

              {/* Badge 3: Universal Catalyst */}
              <div className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${topicKeys.every((k) => (student.scores[k] || 0) >= 50) ? "bg-indigo-50/50 border-indigo-100 text-slate-800" : "bg-slate-50/50 border-slate-100 grayscale opacity-50"}`}>
                <div className="p-1.5 rounded-lg bg-indigo-500 text-white shrink-0">
                  <BrainCircuit className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h5 className="text-[11px] font-extrabold text-slate-800 leading-none">Syllabus Proficiency</h5>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">All units evaluated at &ge; 50%</p>
                </div>
              </div>

              {/* Badge 4: Doubt Buster */}
              <div className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${doubts.length > 0 ? "bg-cyan-50/50 border-cyan-100 text-slate-800" : "bg-slate-50/50 border-slate-100 grayscale opacity-50"}`}>
                <div className="p-1.5 rounded-lg bg-cyan-500 text-white shrink-0">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h5 className="text-[11px] font-extrabold text-slate-800 leading-none">Academic Inquiry</h5>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Submitted academic query to desk</p>
                </div>
              </div>

              {/* Badge 5: Lab Champ */}
              <div className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${quizSubmitted && quizScore === 5 ? "bg-amber-50/50 border-amber-100 text-slate-800" : "bg-slate-50/50 border-slate-100 grayscale opacity-50"}`}>
                <div className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0">
                  <Award className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h5 className="text-[11px] font-extrabold text-slate-800 leading-none">Conceptual Excellence</h5>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Perfect 5/5 score on assessment</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Academic Syllabus grid and other blocks */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
          
          {/* Elegant Horizontal Subject Navigation Bar */}
          <div className="bg-slate-200/60 p-1.5 rounded-2xl border border-slate-300/40 flex flex-col sm:flex-row gap-2">
            {[
              { id: "Chemistry", count: CHEMISTRY_TOPICS.length, bg: "hover:bg-amber-500/10 text-amber-900 border-amber-200" },
              { id: "Physics", count: PHYSICS_TOPICS.length, bg: "hover:bg-blue-500/10 text-blue-900 border-blue-200" },
              { id: "Mathematics", count: MATHS_TOPICS.length, bg: "hover:bg-violet-500/10 text-violet-900 border-violet-200" }
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setActiveSubject(sub.id as any);
                  setSelectedTopic(null); // Clear selected chapter to prevent subject leakage
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-xs md:text-sm tracking-tight transition-all flex items-center justify-center gap-2 ${
                  activeSubject === sub.id
                    ? "bg-white text-indigo-700 shadow-md border border-slate-200/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                }`}
              >
                <span>{sub.id}</span>
                <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                  activeSubject === sub.id ? "bg-indigo-50 text-indigo-600" : "bg-slate-300/60 text-slate-600"
                }`}>
                  {sub.count} Units
                </span>
              </button>
            ))}
          </div>

          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-black text-slate-900 font-display tracking-tight">{activeSubject} Syllabus</h1>
              <p className="text-slate-500 mt-1 text-sm">Monitor evaluation benchmarks across core curricular units.</p>
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600">Active: {activeSubject}</span>
              <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">Sort: Curricular Sequence</span>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {activeTopics.map((topic, idx) => {
              const score = student.scores[topic] || 0;
              const { code, colorClass, barColor } = getTopicAbbreviation(topic);

              return (
                <button
                  key={topic}
                  onClick={() => {
                    setSelectedTopic(topic);
                    setActiveTab("cheat");
                    setAiChat([]);
                  }}
                  className="glass-panel p-5 rounded-[1.5rem] hover:shadow-lg hover:border-slate-300/80 transition-all text-left flex flex-col justify-between h-48 relative group cursor-pointer"
                >
                  <div className="flex justify-between items-start w-full">
                    <div className={`w-10 h-10 ${colorClass} rounded-xl flex items-center justify-center font-black text-sm uppercase tracking-tight`}>
                      {code}
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="mt-3 flex-1">
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                      {topic}
                    </h3>
                  </div>

                  <div className="flex items-end justify-between w-full mt-2">
                    <span className="text-2xl font-black text-slate-900">{score}%</span>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full mb-1.5 overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Formal Syllabus Conceptual Evaluation */}
          <section className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden mt-4">
            <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500 rounded-full blur-[80px] opacity-20 pointer-events-none" />
            
            {!quizStarted ? (
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-mono font-bold">
                  <BrainCircuit className="h-4 w-4" /> Conceptual Evaluation
                </div>
                <h3 className="text-2xl font-black">Class XII &amp; Competitive Syllabus Comprehensive Assessment</h3>
                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                  Validate your core subject knowledge against standard board and competitive frameworks. Complete this 5-question comprehensive conceptual assessment. A perfect score of 5/5 qualifies you for the official **Conceptual Excellence** designation.
                </p>
                <button
                  id="start-quiz-button"
                  onClick={() => {
                    setQuizStarted(true);
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="inline-flex items-center gap-2 bg-white text-slate-900 px-5 py-3 rounded-xl font-extrabold text-sm hover:bg-slate-100 transition-all shadow-lg cursor-pointer"
                >
                  Begin Assessment <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-indigo-800/40 pb-4">
                  <h4 className="font-extrabold text-lg text-indigo-300 flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5" /> Active Assessment Session
                  </h4>
                  <button
                    onClick={() => setQuizStarted(false)}
                    className="text-xs text-slate-400 hover:text-white font-semibold cursor-pointer"
                  >
                    Exit Assessment
                  </button>
                </div>

                <div className="space-y-6">
                  {QUIZ_QUESTIONS.map((q, idx) => (
                    <div key={q.id} className="space-y-3 bg-white/5 border border-white/5 p-4 rounded-2xl">
                      <p className="text-sm font-bold">
                        Q{idx + 1}: {q.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = quizAnswers[q.id] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => {
                                setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                              }}
                              className={`p-3.5 rounded-xl text-left text-xs font-bold transition-all border cursor-pointer ${
                                isSelected
                                  ? "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/10"
                                  : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-800 text-slate-200"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      
                      {quizSubmitted && (
                        <div className={`text-xs p-3 rounded-xl border font-medium ${
                          quizAnswers[q.id] === q.answerIndex
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        }`}>
                          <p className="font-extrabold">
                            {quizAnswers[q.id] === q.answerIndex ? "✓ Correct" : `✗ Incorrect (Correct Option: ${q.options[q.answerIndex]})`}
                          </p>
                          <p className="opacity-90 mt-1">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t border-indigo-800/40 pt-4">
                  {quizSubmitted ? (
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-indigo-300">
                        Evaluated Score: {quizScore}/5
                      </span>
                      {quizScore === 5 && (
                        <span className="bg-emerald-500 text-slate-900 text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-widest animate-bounce">
                          Criteria Met (Perfect Score)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-indigo-300 font-semibold">
                      Complete all questions to initiate evaluation.
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!quizSubmitted ? (
                      <button
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(quizAnswers).length < 5}
                        className="bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        Submit Assessment
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setQuizStarted(false);
                        }}
                        className="bg-white text-slate-900 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all hover:bg-slate-100 cursor-pointer"
                      >
                        Close Assessment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Chapter Companion Modal/Drawer */}
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
              className="relative w-full max-w-2xl bg-white shadow-2xl h-[100dvh] flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="bg-slate-900 text-white p-6 shrink-0 relative">
                <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest">
                  {activeSubject} Academic Companion
                </span>
                <h3 className="text-xl font-extrabold text-white leading-tight mt-1 pr-8">
                  {selectedTopic}
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Current Completion Status: <span className="text-emerald-400 font-extrabold">{student.scores[selectedTopic] || 0}%</span>
                </p>
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white text-lg font-black cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50 shrink-0 overflow-x-auto scrollbar-none touch-pan-y">
                <button
                  onClick={() => setActiveTab("cheat")}
                  className={`flex-1 min-w-[120px] shrink-0 flex items-center justify-center gap-2 py-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                    activeTab === "cheat"
                      ? "border-indigo-600 text-indigo-600 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <BookOpen className="h-4 w-4" /> Academic Resources
                </button>
                <button
                  onClick={() => setActiveTab("milestones")}
                  className={`flex-1 min-w-[120px] shrink-0 flex items-center justify-center gap-2 py-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                    activeTab === "milestones"
                      ? "border-indigo-600 text-indigo-600 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <CheckSquare className="h-4 w-4 text-emerald-500" /> Prep Milestones
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`flex-1 min-w-[120px] shrink-0 flex items-center justify-center gap-2 py-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                    activeTab === "ai"
                      ? "border-indigo-600 text-indigo-600 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <BrainCircuit className="h-4 w-4 text-purple-500 animate-pulse" /> Ask AI Assistant
                </button>
                <button
                  onClick={() => setActiveTab("doubts")}
                  className={`flex-1 min-w-[120px] shrink-0 flex items-center justify-center gap-2 py-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                    activeTab === "doubts"
                      ? "border-indigo-600 text-indigo-600 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" /> Inquiry Desk
                </button>
              </div>

              {/* Drawer Content */}
              <div className={`flex-1 min-h-0 flex flex-col ${activeTab !== "ai" ? "overflow-y-auto overscroll-contain p-6 space-y-6" : "p-6"}`}>
                {/* 1. Cheat Sheet Tab */}
                {activeTab === "cheat" && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Formulas */}
                    {TOPIC_RESOURCES[selectedTopic]?.formulas?.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                          Essential formulas
                        </h4>
                        <div className="grid grid-cols-1 gap-2.5">
                          {TOPIC_RESOURCES[selectedTopic].formulas.map((item) => (
                            <div
                              key={item.label}
                              className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex justify-between items-center font-sans"
                            >
                              <span className="text-xs font-bold text-slate-600">{item.label}</span>
                              <div className="text-xs font-black text-indigo-600 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100/30 max-w-[70%] overflow-x-auto touch-pan-y text-right">
                                <MathRenderer math={item.formula} block={false} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Core Concepts */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Critical Syllabus Concepts
                      </h4>
                      <ul className="space-y-2">
                        {TOPIC_RESOURCES[selectedTopic]?.concepts?.map((c) => (
                          <li key={c} className="flex gap-2.5 text-xs text-slate-600 font-medium">
                            <span className="text-indigo-500 font-bold shrink-0">✓</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Study Tips */}
                    <div className="space-y-2.5 bg-indigo-50/40 border border-indigo-100/50 p-4 rounded-2xl">
                      <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-indigo-600" /> Examiner's Study Tip
                      </h4>
                      <ul className="space-y-2">
                        {TOPIC_RESOURCES[selectedTopic]?.tips?.map((t, idx) => (
                          <li key={idx} className="text-xs text-slate-600 leading-relaxed font-medium">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 2. Prep Milestones Tab (Includes checklist checkbook & slider overrides) */}
                {activeTab === "milestones" && (
                  <div className="space-y-6 animate-fadeIn pb-2">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                      <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" /> Academic Milestones Tracker
                      </h4>
                      <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                        Select completed milestones to automatically calculate cumulative progress based on standard curricular weighting. You may manually refine the exact score using the slider control. All changes must be synchronized.
                      </p>
                    </div>

                    {/* Checkbook List */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                        Milestones Checklist
                      </h5>
                      <div className="space-y-2">
                        {milestonesList.map((m, mIdx) => (
                          <button
                            key={mIdx}
                            onClick={() => handleToggleMilestone(mIdx)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                              localMilestones[mIdx]
                                ? "bg-indigo-50/40 border-indigo-200 text-slate-800"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={localMilestones[mIdx]}
                              readOnly
                              className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 pointer-events-none shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-extrabold text-xs text-slate-800 leading-tight">
                                  {m.label}
                                </span>
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  localMilestones[mIdx] ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                                }`}>
                                  +{m.weight}%
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">
                                {m.desc}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fine-Tuning Slider */}
                    <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Sliders className="h-4 w-4 text-slate-400" /> Manual Progress Adjustment
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
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold uppercase">
                        <span>Incomplete</span>
                        <span>Intermediate (50%)</span>
                        <span>Complete (100%)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Ask Gemini AI Tab */}
                {activeTab === "ai" && (
                  <div className="flex-1 min-h-0 flex flex-col justify-between space-y-4">
                    <div className="space-y-3 flex-1 overflow-y-auto overscroll-contain pr-1">
                      {aiChat.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                          <BrainCircuit className="h-10 w-10 text-slate-300 mx-auto" />
                          <div>
                            <p className="text-sm font-extrabold text-slate-700">
                              Your AI Prep Partner
                            </p>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 font-medium">
                              Ask any doubt about derivations, board exam patterns, formulas, or logical steps. Powered by Gemini 3.5-flash.
                            </p>
                          </div>
                        </div>
                      ) : (
                        aiChat.map((chat, idx) => (
                          <div key={idx} className="space-y-3">
                            <div className="flex justify-end">
                              <span className="bg-slate-100 text-slate-800 px-3.5 py-2.5 rounded-2xl rounded-tr-none text-xs font-medium max-w-sm">
                                {chat.q}
                              </span>
                            </div>
                            <div className="flex justify-start">
                              <div className="bg-indigo-50 border border-indigo-100/50 text-slate-800 px-4 py-3 rounded-2xl rounded-tl-none text-xs leading-relaxed max-w-md space-y-2 font-medium">
                                {chat.loading ? (
                                  <div className="flex items-center gap-2 text-indigo-500 font-bold">
                                    <Loader className="h-4 w-4 animate-spin" /> Analyzing concepts...
                                  </div>
                                ) : (
                                  <div className="space-y-2 prose prose-slate max-w-none">
                                    {parseMarkdownAndMath(chat.a)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleAskAi} className="flex gap-2 shrink-0 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                      <input
                        type="text"
                        placeholder={`Ask Gemini about ${selectedTopic}...`}
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        className="flex-1 bg-transparent px-3 py-2 text-xs focus:outline-none text-slate-800 placeholder-slate-400 font-medium"
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-colors shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                )}

                {/* 4. Doubt Desk Tab */}
                {activeTab === "doubts" && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Doubt History */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Previous Academic Inquiries
                      </h4>

                      {doubts.filter((d) => d.topic === selectedTopic).length === 0 ? (
                        <p className="text-xs text-slate-400 italic font-medium">
                          No inquiries have been registered for this syllabus unit. Please use the form below to submit your question.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {doubts
                             .filter((d) => d.topic === selectedTopic)
                             .map((d) => (
                              <div key={d.id} className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase">
                                    Submitted Inquiry
                                  </span>
                                  <p className="text-xs font-extrabold text-slate-800">{d.question}</p>
                                </div>
                                {d.answer ? (
                                  <div className="bg-emerald-500/5 border-l-4 border-emerald-500 pl-3 py-2">
                                    <span className="text-[9px] font-black text-emerald-600 block uppercase">
                                      Coordinator's Resolution
                                    </span>
                                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                                      {d.answer}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="bg-amber-500/5 border-l-4 border-amber-400 pl-3 py-2 flex items-center gap-1.5 text-amber-700">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span className="text-[10px] font-bold">
                                      Awaiting coordinator review
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Submit New Doubt Form */}
                    <div className="border-t border-slate-100 pt-6 space-y-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Register New Academic Inquiry
                      </h4>
                      <form onSubmit={handleAddDoubt} className="space-y-3">
                        <textarea
                          rows={3}
                          placeholder="Specify your question for the academic coordinator..."
                          required
                          value={newDoubtQuestion}
                          onChange={(e) => setNewDoubtQuestion(e.target.value)}
                          className="w-full border border-slate-200 rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-slate-800 font-medium"
                        />

                        {doubtSuccess && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-600 text-xs font-medium">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            Inquiry successfully submitted. The SAMS Academic Coordinator will review and provide a response here.
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={doubtLoading}
                          className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors ml-auto cursor-pointer"
                        >
                          {doubtLoading && <Loader className="h-3.5 w-3.5 animate-spin" />}
                          Submit Inquiry
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer - Always visible sync bar for milestones tab */}
              {activeTab === "milestones" && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-[11px] text-slate-500 font-medium max-w-xs text-center sm:text-left">
                      {saveProgressSuccess ? (
                        <span className="text-emerald-600 font-bold flex items-center justify-center sm:justify-start gap-1">
                          ✓ Progress successfully synchronized.
                        </span>
                      ) : (
                        "Modifications will be immediately reflected on your academic report."
                      )}
                    </div>

                    <button
                      onClick={handleSaveProgress}
                      disabled={savingProgress}
                      className="w-full sm:w-auto bg-indigo-600 text-white font-extrabold px-6 py-3 rounded-xl text-xs hover:bg-indigo-500 disabled:bg-indigo-300 flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/15 cursor-pointer"
                    >
                      {savingProgress && <Loader className="h-3.5 w-3.5 animate-spin" />}
                      Sync &amp; Save Progress
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
