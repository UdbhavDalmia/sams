import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Award,
  Sparkles,
  BookOpen,
  BrainCircuit,
  ArrowRight,
  LogOut,
  Send,
  Loader,
  CheckCircle2,
  AlertCircle,
  Sliders,
  CheckSquare,
  Sun,
  Moon,
  MessageSquare,
  X,
  ChevronDown,
  Trophy,
  Zap,
  TrendingUp,
  Star,
  Target,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  BarChart2,
  Dna
} from "lucide-react";
import { Student, ActiveQuizState, CHEMISTRY_TOPICS, PHYSICS_TOPICS, MATHS_TOPICS, BIOLOGY_TOPICS, TopicName, TOPIC_RESOURCES, getStudentSubjects } from "../types";
import katex from "katex";
import "katex/dist/katex.min.css";
import { fetchWithRetry } from "../lib/fetch";
import SAMSLogo from "./SAMSLogo";

// Dynamic translation map for standard topic formulas into beautiful textbook LaTeX
const FORMULA_LATEX_MAP: Record<string, string> = {
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

// KaTeX Math Renderer
const MathRenderer: React.FC<{ math: string; block?: boolean }> = ({ math, block = false }) => {
  const containerRef = React.useRef<HTMLSpanElement>(null);

  useEffect(() => {
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

// Markdown + LaTeX Parser
const parseBoldAndMathInline = (text: string): React.ReactNode[] => {
  // Split by inline math ($...$) first
  const parts = text.split(/(\$[\s\S]*?\$)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith("$") && part.endsWith("$")) {
      const math = part.slice(1, -1).trim();
      return <MathRenderer key={`math-${index}`} math={math} block={false} />;
    }
    
    // For non-math, parse bold text (**...**)
    const boldParts = part.split(/(\*\*[\s\S]*?\*\*)/g);
    return boldParts.map((bPart, bIndex) => {
      if (bPart.startsWith("**") && bPart.endsWith("**")) {
        return <strong key={`bold-${index}-${bIndex}`} className="font-extrabold text-slate-900 dark:text-white">{bPart.slice(2, -2)}</strong>;
      }
      
      // Parse inline code blocks (`...`)
      const codeParts = bPart.split(/(`[\s\S]*?`)/g);
      return codeParts.map((cPart, cIndex) => {
        if (cPart.startsWith("`") && cPart.endsWith("`")) {
          return (
            <code key={`code-${index}-${bIndex}-${cIndex}`} className="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded font-mono text-[11px] font-bold">
              {cPart.slice(1, -1)}
            </code>
          );
        }
        return <span key={`text-${index}-${bIndex}-${cIndex}`}>{cPart}</span>;
      });
    });
  });
};

const parseMarkdownAndMath = (text: string) => {
  if (!text) return null;
  
  // Split by block math $$...$$
  const parts = text.split(/(\$\$[\s\S]*?\$\$)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const math = part.slice(2, -2).trim();
      return (
        <div key={`block-math-${index}`} className="my-3 flex items-center justify-center overflow-x-auto w-full select-all">
          <MathRenderer math={math} block={true} />
        </div>
      );
    }
    
    // For non-block-math parts, parse paragraph blocks
    const paragraphs = part.split(/\n\n+/);
    return (
      <div key={`part-${index}`} className="space-y-2.5">
        {paragraphs.map((p, pIdx) => {
          const trimmed = p.trim();
          if (!trimmed) return null;
          
          // Check for headings
          if (trimmed.startsWith("### ")) {
            return (
              <h4 key={pIdx} className="text-xs font-black mt-3 mb-1">
                {parseBoldAndMathInline(trimmed.slice(4))}
              </h4>
            );
          }
          if (trimmed.startsWith("## ")) {
            return (
              <h3 key={pIdx} className="text-sm font-black mt-4 mb-1.5">
                {parseBoldAndMathInline(trimmed.slice(3))}
              </h3>
            );
          }
          if (trimmed.startsWith("# ")) {
            return (
              <h2 key={pIdx} className="text-base font-black mt-5 mb-2">
                {parseBoldAndMathInline(trimmed.slice(2))}
              </h2>
            );
          }
          
          // Check for lists
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.match(/^\d+\.\s/)) {
            const listLines = trimmed.split("\n");
            return (
              <div key={pIdx} className="space-y-1.5 pl-1 my-1.5">
                {listLines.map((line, lIdx) => {
                  const cleanLine = line.trim();
                  if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ")) {
                    return (
                      <div key={lIdx} className="flex gap-2 text-xs leading-relaxed">
                        <span className="text-indigo-500 font-black shrink-0 mt-0.5">•</span>
                        <span className="font-medium">{parseBoldAndMathInline(cleanLine.slice(2))}</span>
                      </div>
                    );
                  }
                  const numMatch = cleanLine.match(/^(\d+)\.\s(.*)/);
                  if (numMatch) {
                    return (
                      <div key={lIdx} className="flex gap-2 text-xs leading-relaxed">
                        <span className="text-indigo-500 font-extrabold shrink-0">{numMatch[1]}.</span>
                        <span className="font-medium">{parseBoldAndMathInline(numMatch[2])}</span>
                      </div>
                    );
                  }
                  return (
                    <p key={lIdx} className="text-xs leading-relaxed font-medium pl-3">
                      {parseBoldAndMathInline(cleanLine)}
                    </p>
                  );
                })}
              </div>
            );
          }
          
          // Standard text paragraph - replace single newlines inside standard text with a space
          const cleanText = trimmed.replace(/\n+/g, " ");
          return (
            <p key={pIdx} className="text-xs leading-relaxed font-medium">
              {parseBoldAndMathInline(cleanText)}
            </p>
          );
        })}
      </div>
    );
  });
};

interface StudentViewProps {
  student: Student;
  onLogout: () => void;
}

// Chime Sound Synthesizer via Web Audio API (Disabled)
const playChime = (completed: boolean) => { };

// Canvas Particle Confetti Shower Trigger
const triggerConfetti = () => {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", handleResize);

  const colors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
  }> = [];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: width / 2,
      y: height + 20,
      vx: (Math.random() - 0.5) * 18,
      vy: -Math.random() * 22 - 12,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.25,
    });
  }

  let animationFrameId: number;
  const update = () => {
    ctx.clearRect(0, 0, width, height);
    let active = false;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.52; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.rotationSpeed;

      if (p.y < height + 50) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (active) {
      animationFrameId = requestAnimationFrame(update);
    } else {
      window.removeEventListener("resize", handleResize);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  };

  update();
};

export default function StudentView({ student: initialStudent, onLogout }: StudentViewProps) {
  const [student, setStudent] = useState<Student>(initialStudent);
  const [selectedTopic, setSelectedTopic] = useState<TopicName | null>(null);

  const studentSubjects = getStudentSubjects(student.scores);
  // Subject Navigation Tab
  const [activeSubject, setActiveSubject] = useState<"Chemistry" | "Physics" | "Mathematics" | "Biology" | "All">(
    studentSubjects.includes("Chemistry") ? "Chemistry" : (studentSubjects[0] as any || "Physics")
  );

  // Chapter Companion Tabs (No doubts / ask AI - only cheat and milestones)
  const [activeTab, setActiveTab] = useState<"cheat" | "milestones">("cheat");

  // Adaptive Quiz States (1 question at a time)
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizTopic, setQuizTopic] = useState("Solutions");
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);

  // Current question state
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Adaptive quiz session state (also persisted to DB)
  const [quizState, setQuizState] = useState<ActiveQuizState | null>(null);

  // Persistent SAMS AI Bot Panel States
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotMessages, setChatbotMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Hello! I am your SAMS AI Study Assistant. Let's prepare to score high! What topic should we study?",
    },
  ]);
  const [chatbotInput, setChatbotInput] = useState("");
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Selected Mobile Achievement for interactive description details
  const [selectedMobileAchievement, setSelectedMobileAchievement] = useState<string | null>(null);

  // Prefetch ref for the next question in active quiz
  const prefetchRef = useRef<{ controller: AbortController; promise: Promise<any> } | null>(null);

  // Global Dark Mode state
  const [darkMode, setDarkMode] = useState(false);

  // Milestones local checklist states
  const [localMilestones, setLocalMilestones] = useState<boolean[]>([false, false, false, false]);
  const [localScore, setLocalScore] = useState<number>(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [saveProgressSuccess, setSaveProgressSuccess] = useState(false);

  // List of standard subjects for the Quiz Topic Select
  const standardChaptersList = [
    // Chemistry
    "Solutions",
    "Electrochemistry",
    "Chemical Kinetics",
    "d- and f-Block Elements",
    "Coordination Compounds",
    "Haloalkanes and Haloarenes",
    "Alcohols, Phenols and Ethers",
    "Aldehydes, Ketones and Carboxylic Acids",
    "Amines",
    "Biomolecules",
    // Physics
    "Electric Charges and Fields",
    "Electrostatic Potential and Capacitance",
    "Current Electricity",
    "Moving Charges and Magnetism",
    "Magnetism and Matter",
    "Electromagnetic Induction",
    "Alternating Current",
    "Electromagnetic Waves",
    "Ray Optics and Optical Instruments",
    "Wave Optics",
    "Dual Nature of Radiation and Matter",
    "Atoms",
    "Nuclei",
    "Semiconductor Electronics",
    // Maths
    "Relations and Functions",
    "Inverse Trigonometric Functions",
    "Matrices",
    "Determinants",
    "Continuity and Differentiability",
    "Application of Derivatives",
    "Integrals",
    "Application of Integrals",
    "Differential Equations",
    "Vector Algebra",
    "Three Dimensional Geometry",
    "Linear Programming",
    "Probability",
  ];

  // Determine active topics based on chosen subject
  const activeTopics = (activeSubject === "Physics"
    ? PHYSICS_TOPICS
    : (activeSubject === "Mathematics"
      ? MATHS_TOPICS
      : (activeSubject === "Biology"
        ? BIOLOGY_TOPICS
        : (activeSubject === "Chemistry"
          ? CHEMISTRY_TOPICS
          : getStudentSubjects(student.scores).reduce((acc, sub) => {
              if (sub === "Chemistry") return [...acc, ...CHEMISTRY_TOPICS];
              if (sub === "Physics") return [...acc, ...PHYSICS_TOPICS];
              if (sub === "Mathematics") return [...acc, ...MATHS_TOPICS];
              if (sub === "Biology") return [...acc, ...BIOLOGY_TOPICS];
              return acc;
            }, [] as string[]) as TopicName[]
          )
        )
      )) as string[];

  // Sync quizTopic to first available chapter if current is not in active topics
  useEffect(() => {
    if (activeTopics.length > 0 && !activeTopics.includes(quizTopic)) {
      setQuizTopic(activeTopics[0]);
    }
  }, [activeTopics, quizTopic]);

  // Sync current student progress from database on mount
  const syncStudentData = async () => {
    try {
      const res = await fetchWithRetry(`/api/student/${student.rollNo}?classId=${student.classId || "xii-a"}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) setStudent(data);
      }
    } catch (err) {
      console.error("Error refreshing student data:", err);
    }
  };

  useEffect(() => {
    syncStudentData();
  }, [student.rollNo]);

  // Synchronize student state to localStorage to keep the session cache updated
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sams_session_v1");
      if (saved) {
        const session = JSON.parse(saved);
        session.student = student;
        localStorage.setItem("sams_session_v1", JSON.stringify(session));
      }
    } catch (err) {
      console.error("Error updating cached student session in localStorage:", err);
    }
  }, [student]);

  // Sync modal states whenever a topic is selected
  useEffect(() => {
    if (selectedTopic) {
      const currentScore = student.scores[selectedTopic] || 0;
      setLocalScore(currentScore);

      const concepts = TOPIC_RESOURCES[selectedTopic]?.concepts || [];
      const currentMilestones = student.milestones?.[selectedTopic] || new Array(concepts.length).fill(false);
      // Ensure local array matches the exact size of the active NCERT concepts list
      if (currentMilestones.length !== concepts.length) {
        const adjustedMilestones = new Array(concepts.length).fill(false);
        for (let i = 0; i < Math.min(currentMilestones.length, concepts.length); i++) {
          adjustedMilestones[i] = currentMilestones[i];
        }
        setLocalMilestones(adjustedMilestones);
      } else {
        setLocalMilestones(currentMilestones);
      }
      setSaveProgressSuccess(false);
    }
  }, [selectedTopic, student]);

  // Calculate overall progress
  const topicKeys = Object.keys(student.scores);

  // Calculate average for active subject
  const subjectScores = activeTopics.map(t => student.scores[t] || 0);
  const activeSubjectAvg = subjectScores.length > 0
    ? Math.round(subjectScores.reduce((sum, v) => sum + v, 0) / subjectScores.length)
    : 0;

  // Calculate overall master average across all subjects
  const overallAvg = topicKeys.length > 0
    ? Math.round(topicKeys.reduce((sum, k) => sum + (student.scores[k] || 0), 0) / topicKeys.length)
    : 0;

  // Calculate individual subject averages
  const chemScores = CHEMISTRY_TOPICS.map(t => student.scores[t] || 0);
  const chemAvg = chemScores.length > 0 ? Math.round(chemScores.reduce((sum, v) => sum + v, 0) / chemScores.length) : 0;

  const physScores = PHYSICS_TOPICS.map(t => student.scores[t] || 0);
  const physAvg = physScores.length > 0 ? Math.round(physScores.reduce((sum, v) => sum + v, 0) / physScores.length) : 0;

  const mathScores = MATHS_TOPICS.map(t => student.scores[t] || 0);
  const mathAvg = mathScores.length > 0 ? Math.round(mathScores.reduce((sum, v) => sum + v, 0) / mathScores.length) : 0;

  const bioScores = BIOLOGY_TOPICS.map(t => student.scores[t] || 0);
  const bioAvg = bioScores.length > 0 ? Math.round(bioScores.reduce((sum, v) => sum + v, 0) / bioScores.length) : 0;

  // Syllabus Coverage and Completion Counts
  const totalTopicsCount = topicKeys.length;
  const studiedTopicsCount = (Object.values(student.scores) as number[]).filter(score => score > 0).length;
  const completedTopicsCount = (Object.values(student.scores) as number[]).filter(score => score >= 75).length;

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
    const words = topic.split(/[\s-]+/);
    let code = "SC";
    if (words.length >= 2) {
      code = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words[0]) {
      code = words[0].slice(0, 2).toUpperCase();
    }

    const charCode = topic.charCodeAt(0) + topic.charCodeAt(topic.length - 1 || 0);
    const colors = [
      { colorClass: "bg-blue-100/80 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40", barColor: "bg-blue-600" },
      { colorClass: "bg-amber-100/80 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40", barColor: "bg-amber-600" },
      { colorClass: "bg-violet-100/80 text-violet-900 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-900/40", barColor: "bg-violet-600" },
      { colorClass: "bg-rose-100/80 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40", barColor: "bg-rose-600" },
      { colorClass: "bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40", barColor: "bg-emerald-600" },
    ];
    return { code, ...colors[charCode % colors.length] };
  };

  const lowestTopic = activeTopics.reduce((lowest, topic) => {
    const currentScore = student.scores[topic] || 0;
    const lowestScore = student.scores[lowest] || 0;
    return currentScore < lowestScore ? topic : lowest;
  }, activeTopics[0]);

  const getSubjectForTopic = (topic: string): "chemistry" | "physics" | "maths" | "biology" => {
    if ((CHEMISTRY_TOPICS as readonly string[]).includes(topic)) return "chemistry";
    if ((PHYSICS_TOPICS as readonly string[]).includes(topic)) return "physics";
    if ((BIOLOGY_TOPICS as readonly string[]).includes(topic)) return "biology";
    return "maths";
  };

  // Load active quiz from DB on mount (reload-proof)
  useEffect(() => {
    if (student.activeQuiz) {
      const aq = student.activeQuiz;
      setQuizState(aq);
      setQuizTopic(aq.topic);
      setQuizStarted(true);
      // Fetch the next question immediately
      fetchNextQuestion(aq);
    }
  }, []);

  const persistQuizState = async (state: ActiveQuizState | null, completed = false) => {
    try {
      const subjectHint = quizState?.topic ? getSubjectForTopic(quizState.topic) : undefined;
      await fetchWithRetry(`/api/student/${student.rollNo}/quiz-state?classId=${student.classId || "xii-a"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizState: state, completed, subjectHint }),
      });
    } catch (err) {
      console.error("Failed to persist quiz state:", err);
    }
  };

  const cancelPrefetch = () => {
    if (prefetchRef.current) {
      try { prefetchRef.current.controller.abort(); } catch {}
      prefetchRef.current = null;
    }
  };

  const startPrefetchNext = (topic: string, difficulty: "easy" | "medium" | "hard", previousQuestions: string[]) => {
    cancelPrefetch();

    const controller = new AbortController();
    const promise = fetchWithRetry("/api/gemini/generate-quiz-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, difficulty, previousQuestions }),
      signal: controller.signal,
      timeoutMs: 45000,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prefetch failed");
      return data;
    });

    prefetchRef.current = { controller, promise };
  };

  // Add cleanup on unmount
  useEffect(() => {
    return () => cancelPrefetch();
  }, []);

  const fetchNextQuestion = async (state: ActiveQuizState) => {
    setQuizLoading(true);
    setQuizError(null);
    setSelectedAnswer(null);
    setShowFeedback(false);
    try {
      const res = await fetchWithRetry("/api/gemini/generate-quiz-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: state.topic,
          difficulty: state.difficulty,
          previousQuestions: state.history.map(h => h.question),
        }),
        timeoutMs: 45000,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI is busy, try again.");
      setCurrentQuestion(data);
    } catch (err: any) {
      setQuizError(err.message);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    const newState: ActiveQuizState = {
      topic: quizTopic,
      difficulty: "medium",
      roundsCompleted: 0,
      correctCount: 0,
      history: [],
      startedAt: new Date().toISOString(),
    };
    setQuizState(newState);
    setQuizStarted(true);
    setQuizFinished(false);
    await persistQuizState(newState);
    await fetchNextQuestion(newState);
  };

  const handleSelectAnswer = (idx: number) => {
    if (showFeedback) return;
    setSelectedAnswer(idx);
  };

  const handleConfirmAnswer = async () => {
    if (selectedAnswer === null || !currentQuestion || !quizState) return;
    const isCorrect = selectedAnswer === currentQuestion.answerIndex;

    // Adaptive difficulty
    const nextDifficulty: "easy" | "medium" | "hard" = isCorrect
      ? quizState.difficulty === "easy" ? "medium" : "hard"
      : quizState.difficulty === "hard" ? "medium" : "easy";

    const historyEntry = {
      question: currentQuestion.question,
      selectedIndex: selectedAnswer,
      correctIndex: currentQuestion.answerIndex,
      correct: isCorrect,
      difficulty: quizState.difficulty,
      explanation: currentQuestion.explanation,
    };

    const updatedState: ActiveQuizState = {
      ...quizState,
      difficulty: nextDifficulty,
      roundsCompleted: quizState.roundsCompleted + 1,
      correctCount: quizState.correctCount + (isCorrect ? 1 : 0),
      history: [...quizState.history, historyEntry],
    };

    setQuizState(updatedState);
    setShowFeedback(true);

    if (isCorrect) triggerConfetti();

    if (updatedState.roundsCompleted >= 5) {
      setQuizFinished(true);
      await persistQuizState(updatedState, true);
      await syncStudentData();
    } else {
      await persistQuizState(updatedState);
      // PREFETCH NEXT QUESTION NOW (Exactly 1 call corresponding to the actual nextDifficulty!)
      startPrefetchNext(updatedState.topic, nextDifficulty, updatedState.history.map(h => h.question));
    }
  };

  const handleNextQuestion = async () => {
    if (!quizState) return;

    setQuizLoading(true);
    setQuizError(null);
    setSelectedAnswer(null);
    setShowFeedback(false);

    try {
      let prefetchedData: any = null;
      if (prefetchRef.current) {
        prefetchedData = await prefetchRef.current.promise;
      }

      if (prefetchedData) {
        setCurrentQuestion(prefetchedData);
        cancelPrefetch(); // clean up the slot
      } else {
        await fetchNextQuestion(quizState);
      }
    } catch (err: any) {
      // If aborted or failed, fall back to fetching normally
      await fetchNextQuestion(quizState);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleRestartQuiz = async () => {
    cancelPrefetch();
    setQuizStarted(false);
    setQuizFinished(false);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setQuizState(null);
    setQuizError(null);
  };

  // Toggle dynamic milestones checklist (using NCERT core topics)
  const handleToggleMilestone = (index: number) => {
    const nextMilestones = [...localMilestones];
    const toggledToChecked = !nextMilestones[index];
    nextMilestones[index] = toggledToChecked;

    // Play sound chimes!
    playChime(toggledToChecked);

    // Calculate score dynamically based on checked topics count / total topics count
    const concepts = TOPIC_RESOURCES[selectedTopic!]?.concepts || [];
    const K = concepts.length || 4;
    const checkedCount = nextMilestones.filter(Boolean).length;
    const computedScore = Math.round((checkedCount / K) * 100);

    setLocalMilestones(nextMilestones);
    setLocalScore(computedScore);

    // Gamified Completion Chime: If all are successfully checked!
    if (nextMilestones.every((m) => m === true)) {
      setTimeout(() => {
        playChime(true);
      }, 250);
    }
  };

  const handleSliderChange = (val: number) => {
    setLocalScore(val);

    // Reverse-calculate milestones if slider manipulated
    const concepts = TOPIC_RESOURCES[selectedTopic!]?.concepts || [];
    const K = concepts.length || 4;

    if (val === 100) {
      setLocalMilestones(new Array(K).fill(true));
    } else if (val === 0) {
      setLocalMilestones(new Array(K).fill(false));
    } else {
      const countToSet = Math.round((val / 100) * K);
      const nextMilestones = new Array(K).fill(false);
      for (let i = 0; i < countToSet; i++) {
        nextMilestones[i] = true;
      }
      setLocalMilestones(nextMilestones);
    }
  };

  // Save student milestones progress to SAMS primary DB
  const handleSaveProgress = async () => {
    if (!selectedTopic) return;
    setSavingProgress(true);
    setSaveProgressSuccess(false);

    try {
      const res = await fetchWithRetry(`/api/student/${student.rollNo}/save-progress?classId=${student.classId || "xii-a"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          score: localScore,
          milestones: localMilestones,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.student) {
          setStudent(data.student);
          setSaveProgressSuccess(true);
          // Show full confetti showers ONLY on 100% completion save!
          if (localScore === 100) {
            triggerConfetti();
          }
          setTimeout(() => setSaveProgressSuccess(false), 3000);
        }
      }
    } catch (err) {
      console.error("Error saving student progress:", err);
    } finally {
      setSavingProgress(false);
    }
  };

  // Streaming chatbot message submission
  const handleChatbotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatbotInput.trim() || chatbotLoading) return;

    const userMsgText = chatbotInput.trim();
    setChatbotInput("");
    const updatedMessages = [...chatbotMessages, { role: "user" as const, text: userMsgText }];
    setChatbotMessages(updatedMessages);
    setChatbotLoading(true);

    // Add placeholder assistant message for streaming
    setChatbotMessages((prev) => [...prev, { role: "assistant" as const, text: "" }]);

    try {
      const response = await fetch("/api/gemini/chatbot-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.body) throw new Error("No stream received.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                accumulated += parsed.text;
                // Update last message in state with streamed text
                setChatbotMessages((prev) => [
                  ...prev.slice(0, -1),
                  { role: "assistant" as const, text: accumulated },
                ]);
              }
            } catch {}
          }
        }
      }

      // Auto-scroll
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err: any) {
      setChatbotMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant" as const, text: `I apologize, I am temporarily busy. Please try again.` },
      ]);
    } finally {
      setChatbotLoading(false);
    }
  };

  // Helper to get beautiful custom-themed icon for each achievement
  const getAchievementIcon = (id: string, tier: string, earned: boolean, className = "h-4 w-4") => {
    const tierColors: Record<string, string> = {
      bronze: earned ? "text-amber-500" : "text-slate-400",
      silver: earned ? "text-slate-300" : "text-slate-400",
      gold: earned ? "text-yellow-400" : "text-slate-400",
      platinum: earned ? "text-cyan-400 animate-pulse" : "text-slate-400",
    };
    
    const colorClass = tierColors[tier] || "text-slate-400";
    
    switch (id) {
      case "first_steps":
        return <Star className={`${className} ${colorClass}`} />;
      case "quiz_warrior":
        return <Trophy className={`${className} ${colorClass}`} />;
      case "subject_starter":
        return <BookOpen className={`${className} ${colorClass}`} />;
      case "on_track":
        return <TrendingUp className={`${className} ${colorClass}`} />;
      case "half_way":
        return <Sliders className={`${className} ${colorClass}`} />;
      case "chem_star":
        return <Award className={`${className} ${colorClass}`} />;
      case "phys_pro":
        return <Zap className={`${className} ${colorClass}`} />;
      case "math_maestro":
        return <Target className={`${className} ${colorClass}`} />;
      case "bio_star":
        return <Dna className={`${className} ${colorClass}`} />;
      case "quiz_addict":
        return <BrainCircuit className={`${className} ${colorClass}`} />;
      case "triple_threat":
        return <Trophy className={`${className} ${colorClass} scale-110`} />;
      case "milestone_master":
        return <CheckSquare className={`${className} ${colorClass}`} />;
      case "excellence":
        return <Sparkles className={`${className} ${colorClass}`} />;
      case "sams_scholar":
        return <Award className={`${className} ${colorClass} scale-110`} />;
      case "jee_ready":
        return <Zap className={`${className} ${colorClass} scale-110`} />;
      default:
        return <Award className={`${className} ${colorClass}`} />;
    }
  };

  // Achievements computation
  const computeAchievements = () => {
    const totalQuizzes = student.quizStats?.totalQuizzes || 0;
    const chemQ = student.quizStats?.bySubject?.chemistry || 0;
    const physQ = student.quizStats?.bySubject?.physics || 0;
    const mathQ = student.quizStats?.bySubject?.maths || 0;
    const bioQ = student.quizStats?.bySubject?.biology || 0;
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

    if (studentSubjects.includes("Chemistry")) {
      defs.push({ id: "chem_star", title: "Chemistry Star", desc: "Chemistry average ≥ 60%", icon: "⚗️", tier: "silver", earned: chemAvg >= 60 });
    }
    if (studentSubjects.includes("Physics")) {
      defs.push({ id: "phys_pro", title: "Physics Pro", desc: "Physics average ≥ 60%", icon: "⚡", tier: "silver", earned: physAvg >= 60 });
    }
    if (studentSubjects.includes("Mathematics")) {
      defs.push({ id: "math_maestro", title: "Maths Maestro", desc: "Maths average ≥ 60%", icon: "📐", tier: "silver", earned: mathAvg >= 60 });
    }
    if (studentSubjects.includes("Biology")) {
      defs.push({ id: "bio_star", title: "Biology Star", desc: "Biology average ≥ 60%", icon: "🧬", tier: "silver", earned: bioAvg >= 60 });
    }

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



  return (
    <div id="student-view-container" className={`min-h-screen transition-all duration-300 font-sans flex flex-col ${darkMode ? "bg-slate-950 text-slate-100 dark" : "bg-slate-50 text-slate-900"}`}>

      {/* Pristine Glass Header */}
      <header className={`px-6 py-4 flex justify-between items-center border-b shrink-0 z-10 transition-colors duration-300 ${darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/10">
            <SAMSLogo size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            SAMS <span className="text-indigo-600">Analytics</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Global Dark Mode Switcher */}
          <button
            onClick={() => {
              setDarkMode(!darkMode);
              playChime(!darkMode);
            }}
            className={`p-2.5 rounded-xl border transition-all ${darkMode ? "bg-slate-800 border-slate-700 text-yellow-400" : "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            title="Toggle Dark Canvas"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Student Status Profile Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-400">Class {(student.classId || "xii-a").toUpperCase()} Roll {student.rollNo}</p>
              <p className="text-xs font-extrabold">{student.name}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs tracking-tight shadow-md shadow-indigo-600/10 uppercase">
              {getInitials(student.name)}
            </div>
            <button
              onClick={onLogout}
              className={`p-2.5 rounded-xl border transition-all hover:text-rose-600 hover:bg-rose-50 ${darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-400"
                }`}
              title="Close Portal"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Formal Student Profile & Academic Contacts Bar */}
      <div className={`px-4 sm:px-6 py-3 border-b text-[11px] font-bold transition-colors duration-300 ${darkMode ? "bg-slate-900/40 border-slate-800/80 text-slate-300" : "bg-slate-100/50 border-slate-200 text-slate-800"
        }`}>
        {/* Top row: Name, Roll, Mobile, Email */}
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="text-slate-900 dark:text-slate-400">Student Name:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{student.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-900 dark:text-slate-400">Roll No:</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">{student.rollNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-900 dark:text-slate-400">Mobile No:</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">{student.phone}</span>
          </div>
          {student.email && (
            <div className="flex items-center gap-2">
              <span className="text-slate-900 dark:text-slate-400">Email:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{student.email}</span>
            </div>
          )}
        </div>
        {/* Second row: Faculty - always on its own line so it doesn't break awkwardly */}
        <div className="flex flex-wrap items-center justify-center gap-1 mt-1.5 text-center text-xs">
          <span className="text-slate-900 dark:text-slate-400 font-medium">Class Faculty:</span>
          {(() => {
            const facultyList: React.ReactNode[] = [];
            if (studentSubjects.includes("Chemistry")) {
              facultyList.push(
                <span key="chem" className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  Pradeep Gusain (Chem)
                </span>
              );
            }
            if (studentSubjects.includes("Physics")) {
              facultyList.push(
                <span key="phy" className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  Narendra Kumar (Phy)
                </span>
              );
            }
            if (studentSubjects.includes("Mathematics")) {
              facultyList.push(
                <span key="math" className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  Tarun Makkar (Maths)
                </span>
              );
            }
            if (studentSubjects.includes("Biology")) {
              facultyList.push(
                <span key="bio" className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  Manishi Chawla (Bio)
                </span>
              );
            }
            const elements: React.ReactNode[] = [];
            facultyList.forEach((fac, idx) => {
              elements.push(fac);
              if (idx < facultyList.length - 1) {
                elements.push(
                  <span key={`bullet-${idx}`} className="text-slate-400 dark:text-slate-600 hidden sm:inline">•</span>
                );
              }
            });
            return elements;
          })()}
        </div>
      </div>

      {/* ── MOBILE: Achievements relative wrapper container ── */}
      <div className="relative lg:hidden">
        {/* Achievements horizontal strip */}
        <div className={`px-4 py-2.5 border-b overflow-x-auto transition-colors duration-300 ${darkMode ? "bg-slate-900/40 border-slate-800/80" : "bg-white/60 border-slate-200"}`}>
          <div className="flex items-center gap-2 min-w-max">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest shrink-0 mr-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              🏅 Achievements ({earnedCount}/{achievements.length})
            </span>
            {achievements.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedMobileAchievement(prev => prev === a.id ? null : a.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  a.earned
                    ? tierBg[a.tier]
                    : darkMode ? "bg-slate-800/40 border-slate-700/30 opacity-35" : "bg-slate-100 border-slate-200 opacity-40"
                } ${selectedMobileAchievement === a.id ? "ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-950" : ""}`}
              >
                <span>{getAchievementIcon(a.id, a.tier, a.earned, "h-3.5 w-3.5")}</span>
                <span className={darkMode ? "text-slate-200" : "text-slate-700"}>{a.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Floating absolute overlay popup (doesn't push down layout) */}
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
                className={`absolute left-4 right-4 mt-1 p-4 rounded-2xl border shadow-2xl z-50 text-xs transition-all duration-300 ${
                  darkMode ? "bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/90" : "bg-white border-indigo-100 text-slate-850 shadow-indigo-950/15"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
                    activeAch.earned
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
                    <div className={`mt-2.5 p-2 rounded-lg border text-[10px] font-bold leading-relaxed ${
                      activeAch.earned
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

      {/* ── BODY: Sidebar (lg+) + main content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Achievements Desktop Sidebar */}
        <aside className={`hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r overflow-y-auto transition-colors duration-300 ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="p-4 border-b sticky top-0 z-10 backdrop-blur-sm">
            <div className={`${darkMode ? "bg-slate-800/60 border-slate-700" : "bg-indigo-50 border-indigo-100"} border rounded-2xl p-3`}>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-indigo-600" />
                <span className={`text-xs font-black uppercase tracking-widest ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Achievements</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-indigo-600">{earnedCount}</span>
                <span className={`text-xs font-bold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>/ {achievements.length} earned</span>
              </div>
              {/* Progress bar */}
              <div className={`h-1.5 rounded-full mt-2 ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-700" style={{ width: `${(earnedCount / achievements.length) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="p-3 space-y-1.5 pb-8">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                  a.earned
                    ? tierBg[a.tier]
                    : darkMode ? "bg-slate-800/20 border-slate-800/40 opacity-40" : "bg-slate-50 border-slate-100 opacity-50"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
                  a.earned
                    ? (darkMode ? "bg-indigo-500/15 border border-indigo-500/20" : "bg-indigo-50 border border-indigo-100")
                    : (darkMode ? "bg-slate-850 border border-slate-800" : "bg-slate-100 border border-slate-200/60")
                }`}>
                  {getAchievementIcon(a.id, a.tier, a.earned, "h-4 w-4")}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-extrabold leading-tight truncate ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{a.title}</p>
                    {a.earned && (
                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r ${tierColors[a.tier]} text-white shrink-0`}>
                        {tierLabel[a.tier]}
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] mt-0.5 leading-snug ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

      {/* Main Student Hub Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">

        {/* Top Highlight Welcome Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Curriculum Coverage Profile */}
          <div className={`p-6 rounded-[2rem] border transition-all duration-300 ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200/60 shadow-sm shadow-slate-100"
            }`}>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-400">Class XII Syllabus profile</span>
            <h3 className="text-xl font-extrabold mt-1 tracking-tight text-indigo-700 dark:text-indigo-400">Curriculum Coverage</h3>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-900 dark:text-slate-300">Studied Chapters</span>
                <span className="font-black text-slate-900 dark:text-slate-100">{studiedTopicsCount} / {totalTopicsCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-900 dark:text-slate-300">Completed (≥75% prep)</span>
                <span className="font-black text-slate-900 dark:text-slate-100">{completedTopicsCount} / {totalTopicsCount}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid gap-1 text-[10px] text-center font-extrabold text-slate-900 dark:text-slate-400"
                   style={{ gridTemplateColumns: `repeat(${studentSubjects.length}, minmax(0, 1fr))` }}>
                {studentSubjects.map((sub) => {
                  const avg = sub === "Chemistry" ? chemAvg : sub === "Physics" ? physAvg : sub === "Mathematics" ? mathAvg : bioAvg;
                  return (
                    <div key={sub}>
                      <span className="block text-slate-900 dark:text-slate-200 font-black text-xs">{avg}%</span>
                      {sub}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Cumulative Syllabus Mastery */}
          <div className={`p-6 rounded-[2rem] border transition-all duration-300 ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200/60 shadow-sm shadow-slate-100"
            }`}>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-400">Cumulative preparation rating</span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-5xl font-black text-indigo-700 dark:text-indigo-400">{overallAvg}%</span>
              <span className="text-xs text-slate-900 dark:text-slate-300 font-bold uppercase">Overall Index</span>
            </div>

            {/* Dynamic visual progress gauge */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-500 rounded-full" style={{ width: `${overallAvg}%` }} />
            </div>

            <p className="text-[11px] text-slate-900 dark:text-slate-300 mt-4 leading-relaxed font-semibold">
              Average preparation level compiled across milestones, assessments, and revision lists.
            </p>
          </div>
        </section>

        {/* Dynamic Subject Nav tabs */}
        <section className={`flex flex-col sm:flex-row p-2 rounded-[2rem] border transition-colors duration-300 items-stretch sm:items-center justify-between gap-2 w-full ${darkMode ? "bg-slate-900 border-slate-800" : "bg-[#f1f5f9] border-slate-200/80"
          }`}>
          {studentSubjects.map((sub) => {
            const isSelected = activeSubject === sub;
            const unitCount = sub === "Chemistry" ? CHEMISTRY_TOPICS.length : sub === "Physics" ? PHYSICS_TOPICS.length : sub === "Mathematics" ? MATHS_TOPICS.length : BIOLOGY_TOPICS.length;

            return (
              <button
                key={sub}
                onClick={() => setActiveSubject(sub as any)}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 sm:py-4 px-4 sm:px-6 rounded-2xl font-black text-sm md:text-base transition-all duration-200 cursor-pointer ${isSelected
                  ? darkMode
                    ? "bg-slate-950 border-2 border-slate-200 text-white shadow-md"
                    : "bg-white border-[2.5px] border-black text-indigo-700 shadow-sm"
                  : darkMode
                    ? "bg-transparent border-[2.5px] border-transparent text-slate-400 hover:text-slate-200"
                    : "bg-transparent border-[2.5px] border-transparent text-slate-900 hover:text-black font-black"
                  }`}
              >
                <span className="tracking-tight">{sub}</span>
                <span className={`text-[10px] md:text-xs font-mono font-bold px-2 py-0.5 rounded-full shrink-0 transition-colors ${isSelected
                  ? darkMode
                    ? "bg-indigo-950 text-indigo-300"
                    : "bg-indigo-100/60 text-indigo-700"
                  : darkMode
                    ? "bg-slate-800 text-slate-500"
                    : "bg-slate-200 text-slate-900 font-extrabold"
                  }`}>
                  {unitCount} Units
                </span>
              </button>
            );
          })}
        </section>

        {/* Active Subject Progress Unit Cards */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-4">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-black dark:text-white" style={{ color: darkMode ? '#ffffff' : '#000000' }}>
                {activeSubject} Syllabus
              </h2>
              <p className="text-xs md:text-sm text-slate-900 dark:text-slate-400 font-medium">
                Monitor evaluation benchmarks across core curricular units.
              </p>
            </div>
            <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 shrink-0 ${darkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-indigo-50/50 border-indigo-100/50 text-indigo-950"
              }`}>
              <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-extrabold">Subject Average Prep:</span>
              <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">{activeSubjectAvg}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {activeTopics.map((topic) => {
              const score = student.scores[topic] || 0;
              const { code, colorClass, barColor } = getTopicAbbreviation(topic);
              return (
                <button
                  key={topic}
                  onClick={() => {
                    setSelectedTopic(topic);
                    setActiveTab("cheat");
                  }}
                  className={`p-4 rounded-3xl border text-left transition-all hover:scale-[1.02] cursor-pointer hover:shadow-lg flex flex-col justify-between h-40 ${darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200/60 hover:border-slate-300"
                    }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className={`w-9 h-9 rounded-xl font-black flex items-center justify-center text-xs tracking-wider shadow-sm ${colorClass}`}>
                        {code}
                      </div>
                      <span className="text-[10px] font-mono font-black text-slate-900 dark:text-slate-400 uppercase">Roll No {student.rollNo}</span>
                    </div>
                    <h4 className="text-xs font-extrabold line-clamp-2 leading-snug">{topic}</h4>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-900 dark:text-slate-400">
                      <span>Progression</span>
                      <span className="text-indigo-600 font-extrabold">{score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Adaptive AI Quiz Panel */}
        <section className={`p-6 rounded-[2rem] border relative overflow-hidden transition-all duration-300 ${darkMode
          ? "bg-slate-900/60 border-slate-800 text-white"
          : "bg-white border-slate-200/80 shadow-md shadow-slate-100 text-slate-900"}`}>
          <div className={`absolute inset-0 pointer-events-none z-0 ${darkMode
            ? "bg-gradient-to-br from-indigo-950/10 via-slate-950/30 to-cyan-950/10"
            : "bg-gradient-to-br from-indigo-50/20 via-white to-sky-50/20"}`} />

          <div className="relative z-10 space-y-6">
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
                        className={`px-4 py-2 font-extrabold text-xs rounded-xl border transition-all cursor-pointer ${
                          darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Exit Quiz
                      </button>
                    </div>
                  </div>
                ) : currentQuestion ? (
                  <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
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
                        className={`px-4 py-3 text-xs font-bold rounded-xl transition-all ${darkMode ? "bg-slate-800 text-slate-400 hover:text-slate-200" : "bg-slate-100 text-slate-500 hover:text-slate-700"}`}
                      >
                        Exit
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </main>
      </div>  {/* End sidebar flex wrapper */}


      {/* SAMS Academic Chapter Companion Slide panel */}
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
              className={`relative w-full max-w-2xl shadow-2xl h-[100dvh] flex flex-col z-10 transition-colors duration-300 ${darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
                }`}
            >
              {/* Drawer Header */}
              <div className={`p-6 shrink-0 relative border-b ${darkMode ? "bg-slate-950 text-white border-slate-850" : "bg-slate-50 text-slate-900 border-slate-200"
                }`}>
                <span className={`text-[10px] font-mono font-extrabold uppercase tracking-widest ${darkMode ? "text-indigo-400" : "text-indigo-600"
                  }`}>
                  {activeSubject} Academic Companion
                </span>
                <h3 className={`text-xl font-extrabold leading-tight mt-1 pr-8 ${darkMode ? "text-white" : "text-slate-900"
                  }`}>
                  {selectedTopic}
                </h3>
                <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-900"
                  }`}>
                  Current Completion Status: <span className="text-emerald-500 font-extrabold">{student.scores[selectedTopic] || 0}%</span>
                </p>
                <button
                  onClick={() => setSelectedTopic(null)}
                  className={`absolute top-6 right-6 text-lg font-black cursor-pointer transition-all ${darkMode ? "text-slate-400 hover:text-white" : "text-slate-900 hover:text-black"
                    }`}
                >
                  ✕
                </button>
              </div>

              {/* Drawer Tabs (Only Resources & Milestones) */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 shrink-0 overflow-x-auto scrollbar-none touch-pan-y">
                <button
                  onClick={() => setActiveTab("cheat")}
                  className={`flex-1 min-w-[120px] shrink-0 flex items-center justify-center gap-2 py-3 text-sm font-black border-b-2 transition-all cursor-pointer ${activeTab === "cheat"
                    ? "border-indigo-600 text-indigo-700 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-900 hover:text-black dark:text-slate-400 dark:hover:text-slate-100"
                    }`}
                >
                  <BookOpen className="h-4 w-4 text-indigo-500" /> Academic Resources
                </button>
                <button
                  onClick={() => setActiveTab("milestones")}
                  className={`flex-1 min-w-[120px] shrink-0 flex items-center justify-center gap-2 py-3 text-sm font-black border-b-2 transition-all cursor-pointer ${activeTab === "milestones"
                    ? "border-indigo-600 text-indigo-700 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-900 hover:text-black dark:text-slate-400 dark:hover:text-slate-100"
                    }`}
                >
                  <CheckSquare className="h-4 w-4 text-emerald-500" /> Prep Milestones
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6">

                {/* 1. Academic Resources Tab */}
                {activeTab === "cheat" && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Formulas */}
                    {TOPIC_RESOURCES[selectedTopic]?.formulas?.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-300">
                          Essential Formulas
                        </h4>
                        <div className="grid grid-cols-1 gap-2.5">
                          {TOPIC_RESOURCES[selectedTopic]?.formulas?.map((item) => (
                            <div
                              key={item.label}
                              className={`p-4 rounded-2xl border flex flex-col gap-2 ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
                                }`}
                            >
                              <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase block">
                                {item.label}
                              </span>
                              <div className={`px-3.5 py-3 rounded-xl flex items-center justify-center select-all border overflow-x-auto ${darkMode
                                ? "bg-slate-800 border-slate-700 text-indigo-200"
                                : "bg-indigo-600/5 border-indigo-100/50 text-indigo-700"
                                }`}>
                                <MathRenderer math={item.formula} block={false} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Core Concepts */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-300">
                        Critical Syllabus Concepts
                      </h4>
                      <ul className="space-y-2">
                        {TOPIC_RESOURCES[selectedTopic]?.concepts?.map((c) => (
                          <li key={c} className="flex gap-2.5 text-xs text-slate-950 dark:text-slate-200 font-bold leading-relaxed">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">✓</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Study Tips */}
                    <div className="space-y-2.5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/20 p-4 rounded-2xl">
                      <h4 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-indigo-600" /> Examiner's Study Tip
                      </h4>
                      <ul className="space-y-2">
                        {TOPIC_RESOURCES[selectedTopic]?.tips?.map((t, idx) => (
                          <li key={idx} className="text-xs text-slate-950 dark:text-slate-300 leading-relaxed font-bold">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 2. Prep Milestones Tab */}
                {activeTab === "milestones" && (
                  <div className="space-y-6 animate-fadeIn pb-2">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl">
                      <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" /> Academic Milestones Tracker
                      </h4>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                        Toggle your completed syllabus concepts below! Toggling plays pleasant academic chimes and increases prep score dynamically. Complete all topics to master the chapter!
                      </p>
                    </div>

                    {/* Checkbook List */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-black text-slate-900 dark:text-slate-300 uppercase tracking-wider">
                        NCERT Core Topics Checklist
                      </h5>
                      <div className="space-y-2">
                        {(TOPIC_RESOURCES[selectedTopic]?.concepts || []).map((concept, cIdx) => {
                          const isChecked = localMilestones[cIdx] || false;
                          const weight = Math.round(100 / (TOPIC_RESOURCES[selectedTopic]?.concepts?.length || 4));
                          return (
                            <button
                              key={cIdx}
                              onClick={() => handleToggleMilestone(cIdx)}
                              className={`w-full text-left rounded-xl border transition-all flex items-stretch cursor-pointer overflow-hidden ${isChecked
                                ? "border-indigo-200 dark:border-indigo-800/60"
                                : "border-slate-200 dark:border-slate-700/60 hover:border-indigo-200 dark:hover:border-indigo-800/40"
                                }`}
                            >
                              {/* Left accent stripe */}
                              <div className={`w-1 shrink-0 rounded-l-xl transition-colors ${isChecked ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
                                }`} />

                              <div className={`flex items-center gap-3 px-3.5 py-3 flex-1 min-w-0 transition-colors ${isChecked
                                ? "bg-indigo-50/50 dark:bg-indigo-950/20"
                                : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                                }`}>
                                {/* Custom checkbox circle */}
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isChecked
                                  ? "bg-indigo-500 border-indigo-500"
                                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                  }`}>
                                  {isChecked && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>

                                <span className={`flex-1 text-xs leading-snug transition-colors ${isChecked
                                  ? "font-bold text-indigo-900 dark:text-indigo-200 line-through decoration-indigo-300 dark:decoration-indigo-700 decoration-1"
                                  : "font-semibold text-slate-700 dark:text-slate-300"
                                  }`}>
                                  {concept}
                                </span>

                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${isChecked
                                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                  }`}>
                                  +{weight}%
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Slider overrides */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
                      <h5 className="text-xs font-black text-slate-900 dark:text-slate-300 uppercase tracking-wider">
                        Fine-Tune Mastery Score
                      </h5>
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Sliders className="h-4 w-4 text-slate-900 dark:text-slate-400" /> Manual Progress Adjustment
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
                          className="w-full h-2 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-[9px] text-slate-900 dark:text-slate-400 font-mono font-bold uppercase">
                          <span>Incomplete</span>
                          <span>Intermediate (50%)</span>
                          <span>Complete (100%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 shrink-0 space-y-2">
                {saveProgressSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Progress Portfolio synchronized successfully.
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSaveProgress}
                    disabled={savingProgress}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    {savingProgress ? "Syncing..." : "Sync Progress"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Always Visible SAMS AI Persistent Chatbot */}
      <button
        onClick={() => {
          setShowChatbot(!showChatbot);
          playChime(true);
        }}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl z-40 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-indigo-400 animate-pulse"
        title="SAMS AI Companion"
      >
        <BrainCircuit className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {showChatbot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-[360px] h-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden font-sans"
          >
            {/* Bot Header */}
            <div className="bg-slate-900 p-4 shrink-0 relative flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 relative">
                <BrainCircuit className="h-4 w-4" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">SAMS AI Study Companion</h4>
                <p className="text-[9px] text-indigo-300 font-bold leading-none mt-0.5">Syllabus & Prep Planner • (Active)</p>
              </div>
              <button
                onClick={() => setShowChatbot(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Disclaimer bar */}
            <div className="bg-indigo-50 dark:bg-slate-950 border-b border-indigo-100 dark:border-slate-850 px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400 leading-tight font-medium shrink-0">
              💡 <strong>Academic Guard:</strong> Programmed exclusively to answer XII Syllabus & prep schedules. Coding/cooking questions are disabled.
            </div>

            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
              {chatbotMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed font-medium select-text ${msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50"
                      }`}
                  >
                    <div className="space-y-1.5">
                      {parseMarkdownAndMath(msg.text)}
                    </div>
                  </div>
                </div>
              ))}

              {chatbotLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200/50 dark:border-slate-700/50 text-sm font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin text-indigo-500" />
                    Consulting class syllabus guides...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleChatbotSubmit} className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-950 flex gap-2">
              <input
                type="text"
                placeholder="Ask about organic mechanics, electromagnetic formulas..."
                value={chatbotInput}
                onChange={(e) => setChatbotInput(e.target.value)}
                disabled={chatbotLoading}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-base text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
              <button
                type="submit"
                disabled={chatbotLoading || !chatbotInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center cursor-pointer"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
