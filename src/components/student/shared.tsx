import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Dynamic translation map for standard topic formulas into beautiful textbook LaTeX
export const FORMULA_LATEX_MAP: Record<string, string> = {
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

export const getProgressColor = (score: number, alpha = 1) => {
  const s = Math.max(0, Math.min(100, score));
  const hue = s <= 50 ? (s / 50) * 45 : 45 + ((s - 50) / 50) * 95;
  return `hsla(${Math.round(hue)}, 85%, 45%, ${alpha})`;
};

// KaTeX Math Renderer
export const MathRenderer: React.FC<{ math: string; block?: boolean }> = ({ math, block = false }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

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
export const parseBoldAndMathInline = (text: string): React.ReactNode[] => {
  const result: React.ReactNode[] = [];
  const parts = text.split(/(\$[\s\S]*?\$)/g);

  parts.forEach((part, index) => {
    if (part.startsWith("$") && part.endsWith("$")) {
      const math = part.slice(1, -1).trim();
      result.push(<MathRenderer key={`math-${index}`} math={math} block={false} />);
      return;
    }

    const boldParts = part.split(/(\*\*[\s\S]*?\*\*)/g);
    boldParts.forEach((bPart, bIndex) => {
      if (bPart.startsWith("**") && bPart.endsWith("**")) {
        result.push(<strong key={`bold-${index}-${bIndex}`} className="font-extrabold text-slate-900 dark:text-white">{bPart.slice(2, -2)}</strong>);
        return;
      }

      const codeParts = bPart.split(/(`[\s\S]*?`)/g);
      codeParts.forEach((cPart, cIndex) => {
        if (cPart.startsWith("`") && cPart.endsWith("`")) {
          result.push(
            <code key={`code-${index}-${bIndex}-${cIndex}`} className="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded font-mono text-[11px] font-bold">
              {cPart.slice(1, -1)}
            </code>
          );
        } else {
          result.push(<span key={`text-${index}-${bIndex}-${cIndex}`}>{cPart}</span>);
        }
      });
    });
  });

  return result;
};

export const parseMarkdownAndMath = (text: string) => {
  if (!text) return null;
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

    const paragraphs = part.split(/\n\n+/);
    return (
      <div key={`part-${index}`} className="space-y-2.5">
        {paragraphs.map((p, pIdx) => {
          const trimmed = p.trim();
          if (!trimmed) return null;

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

export const playChime = (completed: boolean) => { };

export const triggerConfetti = () => {
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

export const getInitials = (name: string) => {
  if (!name) return "ST";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getTopicAbbreviation = (topic: string): { code: string; colorClass: string; barColor: string } => {
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
