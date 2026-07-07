import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical,
  Award,
  Sparkles,
  BookOpen,
  HelpCircle,
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
  Play,
  ChevronDown
} from "lucide-react";
import { Student, CHEMISTRY_TOPICS, PHYSICS_TOPICS, MATHS_TOPICS, TopicName, TOPIC_RESOURCES } from "../types";
import katex from "katex";
import "katex/dist/katex.min.css";
import { fetchWithRetry } from "../lib/fetch";

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
const parseMarkdownAndMath = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]*?\$\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const math = part.slice(2, -2).trim();
      return <MathRenderer key={index} math={math} block={true} />;
    }
    
    const subParts = part.split(/(\$[\s\S]*?\$)/g);
    return subParts.map((subPart, subIndex) => {
      if (subPart.startsWith("$") && subPart.endsWith("$")) {
        const math = subPart.slice(1, -1).trim();
        return <MathRenderer key={`${index}-${subIndex}`} math={math} block={false} />;
      }
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
        
        if (cleanLine.startsWith("### ")) {
          return (
            <h4 key={idx} className="text-xs font-black mt-2.5 mb-1 flex items-center gap-1.5">
              {parseBoldText(cleanLine.slice(4))}
            </h4>
          );
        }
        if (cleanLine.startsWith("## ")) {
          return (
            <h3 key={idx} className="text-sm font-black mt-3.5 mb-1.5 flex items-center gap-2">
              {parseBoldText(cleanLine.slice(3))}
            </h3>
          );
        }
        if (cleanLine.startsWith("# ")) {
          return (
            <h2 key={idx} className="text-base font-black mt-4 mb-2 flex items-center gap-2.5">
              {parseBoldText(cleanLine.slice(2))}
            </h2>
          );
        }

        if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ")) {
          return (
            <div key={idx} className="flex gap-2 text-xs pl-2 leading-relaxed">
              <span className="text-indigo-500 font-black shrink-0">•</span>
              <span>{parseBoldText(cleanLine.slice(2))}</span>
            </div>
          );
        }
        
        const numberedMatch = cleanLine.match(/^(\d+)\.\s(.*)/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex gap-2 text-xs pl-2 leading-relaxed">
              <span className="text-indigo-500 font-extrabold shrink-0">{numberedMatch[1]}.</span>
              <span>{parseBoldText(numberedMatch[2])}</span>
            </div>
          );
        }

        if (!cleanLine.trim()) return <div key={idx} className="h-1" />;
        
        return (
          <p key={idx} className="text-xs leading-relaxed font-medium">
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
      return <strong key={index} className="font-extrabold text-slate-900 dark:text-white">{boldText}</strong>;
    }
    
    const subParts = part.split(/(`.*?`)/g);
    return subParts.map((subPart, subIndex) => {
      if (subPart.startsWith("`") && subPart.endsWith("`")) {
        const codeText = subPart.slice(1, -1);
        return (
          <code key={`${index}-${subIndex}`} className="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded font-mono text-[11px] font-bold">
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

// Chime Sound Synthesizer via Web Audio API
const playChime = (completed: boolean) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (completed) {
      // Ascending pleasant chord
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      // Standard descending soft tick
      osc.type = "triangle";
      osc.frequency.setValueAtTime(392.00, ctx.currentTime); // G4
      osc.frequency.setValueAtTime(261.63, ctx.currentTime + 0.08); // C4
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn("Audio Context block or unsupported:", e);
  }
};

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
  
  // Subject Navigation Tab
  const [activeSubject, setActiveSubject] = useState<"Chemistry" | "Physics" | "Mathematics" | "All">("Chemistry");

  // Chapter Companion Tabs (No doubts / ask AI - only cheat and milestones)
  const [activeTab, setActiveTab] = useState<"cheat" | "milestones">("cheat");
  
  // SAMS Dynamic AI Quiz States
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizTopic, setQuizTopic] = useState("Solutions");
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Persistent SAMS AI Bot Panel States
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotMessages, setChatbotMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Hello! I am your SAMS AI Study Assistant. I am programmed specifically to support your Class XII standard curriculum (Chemistry, Physics, Mathematics) and build optimal study schedules. (Please note that non-syllabus topics like cooking or coding are strictly disabled!). Let's prepare to score high! What topic should we study?",
    },
  ]);
  const [chatbotInput, setChatbotInput] = useState("");
  const [chatbotLoading, setChatbotLoading] = useState(false);

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
  const activeTopics = activeSubject === "Physics" 
    ? PHYSICS_TOPICS 
    : (activeSubject === "Mathematics" 
        ? MATHS_TOPICS 
        : (activeSubject === "Chemistry" ? CHEMISTRY_TOPICS : [...CHEMISTRY_TOPICS, ...PHYSICS_TOPICS, ...MATHS_TOPICS] as TopicName[]));

  // Sync current student progress from database on mount
  const syncStudentData = async () => {
    try {
      const res = await fetchWithRetry(`/api/student/${student.rollNo}`);
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

  // Syllabus Coverage and Completion Counts
  const totalTopicsCount = 30;
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

  // Initiate Dynamic Quiz Generation on selected topic
  const handleStartQuiz = async () => {
    setQuizLoading(true);
    setQuizError(null);
    setQuizAnswers({});
    setQuizSubmitted(false);

    try {
      const res = await fetchWithRetry("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: quizTopic }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "The AI is busy generating questions. Please try again.");
      }

      setQuizQuestions(data);
      setQuizStarted(true);
    } catch (err: any) {
      setQuizError(err.message);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizAnswer = (qId: number, optIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleQuizSubmit = () => {
    let score = 0;
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.answerIndex) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);

    // Play chimes based on score and shoot confetti on 100% (5/5)
    if (score === 5) {
      playChime(true);
      triggerConfetti();
    } else if (score >= 3) {
      playChime(true);
    } else {
      playChime(false);
    }
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
      const res = await fetchWithRetry(`/api/student/${student.rollNo}/save-progress`, {
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

  // Chatbot message submission
  const handleChatbotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatbotInput.trim()) return;

    const userMsgText = chatbotInput;
    setChatbotInput("");
    setChatbotMessages((prev) => [...prev, { role: "user", text: userMsgText }]);
    setChatbotLoading(true);

    try {
      const activeMsgs = [...chatbotMessages, { role: "user" as const, text: userMsgText }];
      
      const res = await fetchWithRetry("/api/gemini/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: activeMsgs }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI partner is temporarily offline.");
      }

      setChatbotMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err: any) {
      setChatbotMessages((prev) => [
        ...prev,
        { role: "assistant", text: `I apologize, I am temporarily busy. Error: ${err.message}` },
      ]);
    } finally {
      setChatbotLoading(false);
    }
  };



  return (
    <div id="student-view-container" className={`min-h-screen transition-all duration-300 font-sans flex flex-col ${darkMode ? "bg-slate-950 text-slate-100 dark" : "bg-slate-50 text-slate-900"}`}>
      
      {/* Pristine Glass Header */}
      <header className={`px-6 py-4 flex justify-between items-center border-b shrink-0 z-10 transition-colors duration-300 ${darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/10">
            <FlaskConical className="h-5 w-5 text-white" />
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
            className={`p-2.5 rounded-xl border transition-all ${
              darkMode ? "bg-slate-800 border-slate-700 text-yellow-400" : "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800"
            }`}
            title="Toggle Dark Canvas"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Student Status Profile Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-400">Class XII-A Roll {student.rollNo}</p>
              <p className="text-xs font-extrabold">{student.name}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs tracking-tight shadow-md shadow-indigo-600/10 uppercase">
              {getInitials(student.name)}
            </div>
            <button
              onClick={onLogout}
              className={`p-2.5 rounded-xl border transition-all hover:text-rose-600 hover:bg-rose-50 ${
                darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-400"
              }`}
              title="Close Portal"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Formal Student Profile & Academic Contacts Bar */}
      <div className={`px-6 py-3 border-b text-[11px] font-bold flex flex-wrap gap-x-8 gap-y-2 items-center justify-center transition-colors duration-300 ${
        darkMode ? "bg-slate-900/40 border-slate-800/80 text-slate-300" : "bg-slate-100/50 border-slate-200 text-slate-800"
      }`}>
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
        <div className="flex items-center gap-2 justify-center text-center">
          <span className="text-slate-900 dark:text-slate-400">Class Faculty:</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
            Pradeep Gusain(Chem) • Narendra Kumar(Phy) • Tarun Makkar(Maths)
          </span>
        </div>
      </div>

      {/* Main Student Hub Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8 overflow-y-auto">
        
        {/* Top Highlight Welcome Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Curriculum Coverage Profile */}
          <div className={`p-6 rounded-[2rem] border transition-all duration-300 ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200/60 shadow-sm shadow-slate-100"
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
              
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-1 text-[10px] text-center font-extrabold text-slate-900 dark:text-slate-400">
                <div>
                  <span className="block text-slate-900 dark:text-slate-200 font-black text-xs">{chemAvg}%</span>
                  Chemistry
                </div>
                <div>
                  <span className="block text-slate-900 dark:text-slate-200 font-black text-xs">{physAvg}%</span>
                  Physics
                </div>
                <div>
                  <span className="block text-slate-900 dark:text-slate-200 font-black text-xs">{mathAvg}%</span>
                  Mathematics
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Cumulative Syllabus Mastery */}
          <div className={`p-6 rounded-[2rem] border transition-all duration-300 ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200/60 shadow-sm shadow-slate-100"
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
        <section className={`flex p-2 rounded-[2rem] border transition-colors duration-300 items-center justify-between gap-2 w-full ${
          darkMode ? "bg-slate-900 border-slate-800" : "bg-[#f1f5f9] border-slate-200/80"
        }`}>
          {["Chemistry", "Physics", "Mathematics"].map((sub) => {
            const isSelected = activeSubject === sub;
            const unitCount = sub === "Chemistry" ? CHEMISTRY_TOPICS.length : sub === "Physics" ? PHYSICS_TOPICS.length : MATHS_TOPICS.length;
            
            return (
              <button
                key={sub}
                onClick={() => setActiveSubject(sub as any)}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-black text-sm md:text-base transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? darkMode
                      ? "bg-slate-950 border-2 border-slate-200 text-white shadow-md"
                      : "bg-white border-[2.5px] border-black text-indigo-700 shadow-sm"
                    : darkMode
                      ? "bg-transparent border-[2.5px] border-transparent text-slate-400 hover:text-slate-200"
                      : "bg-transparent border-[2.5px] border-transparent text-slate-900 hover:text-black font-black"
                }`}
              >
                <span className="tracking-tight">{sub}</span>
                <span className={`text-[10px] md:text-xs font-mono font-bold px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                  isSelected
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
            <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 shrink-0 ${
              darkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-indigo-50/50 border-indigo-100/50 text-indigo-950"
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
                  className={`p-4 rounded-3xl border text-left transition-all hover:scale-[1.02] cursor-pointer hover:shadow-lg flex flex-col justify-between h-40 ${
                    darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200/60 hover:border-slate-300"
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

        {/* Refactored Interactive Gemini Academic Quiz Panel */}
        <section className={`p-6 rounded-[2rem] border relative overflow-hidden transition-all duration-300 ${
          darkMode 
            ? "bg-slate-900/60 border-slate-800 text-white" 
            : "bg-white border-slate-200/80 shadow-md shadow-slate-100 text-slate-900"
        }`}>
          {/* Animated Background Mesh */}
          <div className={`absolute inset-0 pointer-events-none z-0 ${
            darkMode 
              ? "bg-gradient-to-br from-indigo-950/10 via-slate-950/30 to-cyan-950/10" 
              : "bg-gradient-to-br from-indigo-50/20 via-white to-sky-50/20"
          }`} />

          <div className="relative z-10 space-y-6">
            {!quizStarted ? (
              /* Step 1: Pre-Quiz Selection and Instructions */
              <div className="max-w-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full border ${
                    darkMode 
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/20" 
                      : "bg-indigo-50 text-indigo-600 border-indigo-100"
                  }`}>
                    Interactive AI Quiz Desk
                  </span>
                </div>
                <h3 className={`text-2xl font-black font-display ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}>
                  Test Your Skills with On-Demand AI Assessments
                </h3>
                <p className={`text-xs leading-relaxed font-semibold ${
                  darkMode ? "text-indigo-200" : "text-slate-900"
                }`}>
                  Select any Class XII textbook unit or exam topic. SAMS will instruct Gemini 3.5-flash to set five conceptually rigorous MCQ questions customized directly for your selected topic, matching CBSE and JEE Main patterns.
                </p>

                {quizError && (
                  <div className="p-3 bg-rose-950/60 border border-rose-900/40 text-rose-300 rounded-xl flex items-center gap-2 text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{quizError}</span>
                  </div>
                )}

                {/* Topic selection row */}
                <div className="flex flex-col sm:flex-row gap-3 pt-3 items-stretch sm:items-end">
                  <div className="flex-1 min-w-0 space-y-2">
                    <label className={`block text-[10px] font-black uppercase tracking-wider ${
                      darkMode ? "text-indigo-300" : "text-indigo-600"
                    }`}>
                      Select Assessment Topic
                    </label>
                    <div className="relative">
                      <select
                        value={quizTopic}
                        onChange={(e) => setQuizTopic(e.target.value)}
                        className={`w-full max-w-full border rounded-xl pl-4 pr-10 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate appearance-none ${
                          darkMode 
                            ? "bg-slate-950 text-white border-slate-800" 
                            : "bg-slate-50 text-slate-850 border-slate-200"
                        }`}
                      >
                        {standardChaptersList.map((chap) => (
                          <option key={chap} value={chap} className="bg-slate-950 text-white font-medium">
                            {chap}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-900 dark:text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    onClick={handleStartQuiz}
                    disabled={quizLoading}
                    className={`font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                      darkMode 
                        ? "bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white shadow-indigo-600/10" 
                        : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white shadow-indigo-600/15"
                    }`}
                  >
                    {quizLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin text-white" />
                        Generating Assessment Questions...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 text-white fill-current" />
                        Generate Assessment Quiz
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Assessment Session Active */
              <div className="space-y-6">
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 ${
                  darkMode ? "border-slate-800" : "border-slate-100"
                }`}>
                  <div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                      darkMode ? "text-indigo-300" : "text-indigo-600"
                    }`}>
                      Active AI Assessment Unit
                    </span>
                    <h4 className={`text-lg font-black mt-1 ${
                      darkMode ? "text-white" : "text-slate-900"
                    }`}>Topic: {quizTopic}</h4>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold ${
                      darkMode ? "text-indigo-300" : "text-slate-900"
                    }`}>
                      Assessments are automatically graded with step-by-step rationales.
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {quizQuestions.map((q, qIdx) => (
                    <div key={q.id} className={`p-5 rounded-2xl border space-y-4 ${
                      darkMode 
                        ? "bg-slate-950/40 border-slate-900/40" 
                        : "bg-slate-50 border-slate-100"
                    }`}>
                      <div className="flex items-start gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                          darkMode ? "bg-indigo-500/25 text-indigo-300" : "bg-indigo-100 text-indigo-600"
                        }`}>
                          {qIdx + 1}
                        </span>
                        <div className={`text-xs font-black leading-relaxed pt-0.5 select-text ${
                          darkMode ? "text-white" : "text-black"
                        }`}>
                          {q.question}
                        </div>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isSelected = quizAnswers[q.id] === optIdx;
                          const isCorrect = q.answerIndex === optIdx;
                          
                          let optStyle = "";
                          if (darkMode) {
                            optStyle = "bg-indigo-950/30 border-indigo-800/50 text-indigo-100 hover:bg-indigo-900/30";
                            if (isSelected) {
                              optStyle = "bg-indigo-600 border-indigo-400 text-white";
                            }
                            if (quizSubmitted) {
                              if (isCorrect) {
                                optStyle = "bg-emerald-600 border-emerald-400 text-white font-extrabold";
                              } else if (isSelected && !isCorrect) {
                                optStyle = "bg-rose-600 border-rose-400 text-white";
                              } else {
                                optStyle = "opacity-40 bg-indigo-950/20 border-indigo-900 text-indigo-300";
                              }
                            }
                          } else {
                            optStyle = "bg-white border-slate-300 text-slate-900 hover:bg-indigo-50/50 hover:border-indigo-100";
                            if (isSelected) {
                              optStyle = "bg-indigo-50 border-indigo-300 text-indigo-700 font-extrabold shadow-sm";
                            }
                            if (quizSubmitted) {
                              if (isCorrect) {
                                optStyle = "bg-emerald-50 border-emerald-200 text-emerald-700 font-extrabold";
                              } else if (isSelected && !isCorrect) {
                                optStyle = "bg-rose-50 border-rose-200 text-rose-700 font-extrabold";
                              } else {
                                optStyle = "opacity-40 bg-slate-50 border-slate-200 text-slate-900 font-extrabold";
                              }
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleQuizAnswer(q.id, optIdx)}
                              disabled={quizSubmitted}
                              className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all ${optStyle} ${!quizSubmitted ? "cursor-pointer" : "cursor-default"}`}
                            >
                              <span className="mr-2 uppercase text-[10px] opacity-60">
                                {["A", "B", "C", "D"][optIdx]}.
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Show Academic Rationale after submission */}
                      {quizSubmitted && (
                        <div className={`pl-9 pt-2 border-t mt-2 space-y-1 ${
                          darkMode ? "text-indigo-200 border-indigo-850" : "text-slate-900 border-slate-200"
                        }`}>
                          <p className={`font-extrabold uppercase tracking-widest text-[9px] ${
                            darkMode ? "text-emerald-400" : "text-emerald-600"
                          }`}>
                            Academic Explanatory Rationale:
                          </p>
                          <p className="opacity-95 leading-relaxed font-bold">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Submit / Reset Actions */}
                <div className={`flex justify-between items-center border-t pt-4 ${
                  darkMode ? "border-slate-800" : "border-slate-100"
                }`}>
                  {quizSubmitted ? (
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-black ${
                        darkMode ? "text-indigo-300" : "text-indigo-650"
                      }`}>
                        Evaluated Score: {quizScore}/5
                      </span>
                      {quizScore === 5 && (
                        <span className="bg-emerald-500 text-slate-900 text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-widest animate-bounce">
                          Comprehensive Mastery Met
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className={`text-xs font-bold ${
                      darkMode ? "text-indigo-300" : "text-slate-900"
                    }`}>
                      Please respond to all five questions to submit.
                    </div>
                  )}

                  <div className="flex gap-3">
                    {!quizSubmitted ? (
                      <button
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(quizAnswers).length < 5}
                        className={`font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                          darkMode
                            ? "bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 disabled:text-indigo-700 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-indigo-600 font-extrabold"
                        }`}
                      >
                        Submit Assessment
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setQuizStarted(false);
                        }}
                        className={`font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                          darkMode
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                        }`}
                      >
                        New Assessment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

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
              className={`relative w-full max-w-2xl shadow-2xl h-[100dvh] flex flex-col z-10 transition-colors duration-300 ${
                darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
              }`}
            >
              {/* Drawer Header */}
              <div className={`p-6 shrink-0 relative border-b ${
                darkMode ? "bg-slate-950 text-white border-slate-850" : "bg-slate-50 text-slate-900 border-slate-200"
              }`}>
                <span className={`text-[10px] font-mono font-extrabold uppercase tracking-widest ${
                  darkMode ? "text-indigo-400" : "text-indigo-600"
                }`}>
                  {activeSubject} Academic Companion
                </span>
                <h3 className={`text-xl font-extrabold leading-tight mt-1 pr-8 ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}>
                  {selectedTopic}
                </h3>
                <p className={`text-xs mt-1 ${
                  darkMode ? "text-slate-400" : "text-slate-900"
                }`}>
                  Current Completion Status: <span className="text-emerald-500 font-extrabold">{student.scores[selectedTopic] || 0}%</span>
                </p>
                <button
                  onClick={() => setSelectedTopic(null)}
                  className={`absolute top-6 right-6 text-lg font-black cursor-pointer transition-all ${
                    darkMode ? "text-slate-400 hover:text-white" : "text-slate-900 hover:text-black"
                  }`}
                >
                  ✕
                </button>
              </div>

              {/* Drawer Tabs (Only Resources & Milestones) */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 shrink-0 overflow-x-auto scrollbar-none touch-pan-y">
                <button
                  onClick={() => setActiveTab("cheat")}
                  className={`flex-1 min-w-[120px] shrink-0 flex items-center justify-center gap-2 py-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                    activeTab === "cheat"
                      ? "border-indigo-600 text-indigo-700 bg-white dark:bg-slate-900"
                      : "border-transparent text-slate-900 hover:text-black dark:text-slate-400 dark:hover:text-slate-100"
                  }`}
                >
                  <BookOpen className="h-4 w-4 text-indigo-500" /> Academic Resources
                </button>
                <button
                  onClick={() => setActiveTab("milestones")}
                  className={`flex-1 min-w-[120px] shrink-0 flex items-center justify-center gap-2 py-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                    activeTab === "milestones"
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
                              className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                                darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
                              }`}
                            >
                              <div>
                                <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase block mb-1">
                                  {item.label}
                                </span>
                                <code className="text-xs font-mono font-black text-slate-950 dark:text-slate-300 tracking-tight block overflow-x-auto">
                                  {item.formula}
                                </code>
                              </div>
                              <div className="bg-indigo-600/5 dark:bg-indigo-50/50 px-3.5 py-3 rounded-xl flex items-center justify-center text-xs text-indigo-700 dark:text-indigo-600 select-all border border-indigo-100/50 dark:border-indigo-950">
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
                              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                                isChecked
                                  ? "bg-indigo-50/40 border-indigo-200 text-black dark:text-white dark:bg-indigo-950/20"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-900 dark:text-slate-300 font-extrabold"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 pointer-events-none shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="font-extrabold text-xs text-black dark:text-white leading-tight">
                                    {concept}
                                  </span>
                                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                    isChecked ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 dark:bg-slate-800 text-slate-900 font-extrabold"
                                  }`}>
                                    +{weight}%
                                  </span>
                                </div>
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
            <div className="bg-indigo-50 dark:bg-slate-950 border-b border-indigo-100 dark:border-slate-850 px-3.5 py-2 text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium shrink-0">
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
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-medium select-text ${
                      msg.role === "user"
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
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200/50 dark:border-slate-700/50 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
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
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
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
