export interface ActiveQuizState {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  roundsCompleted: number;
  correctCount: number;
  history: Array<{
    question: string;
    selectedIndex: number;
    correctIndex: number;
    correct: boolean;
    difficulty: "easy" | "medium" | "hard";
    explanation: string;
  }>;
  startedAt: string;
}

export interface ActivitySession {
  timestamp: string;
  changes: Array<{
    type: "checklist" | "quiz";
    subject: "Chemistry" | "Physics" | "Mathematics";
    detail: string;
  }>;
}

export interface Student {
  rollNo: number;
  name: string;
  phone: string;
  scores: Record<string, number>;
  milestones?: Record<string, boolean[]>; // stores topic name -> [NCERT Theory, NCERT Back Ex, JEE Main PYQs, JEE Adv PYQs]
  email?: string;
  activeQuiz?: ActiveQuizState | null;
  quizStats?: {
    totalQuizzes: number;
    bySubject: { chemistry: number; physics: number; maths: number };
  };
  recentSessions?: ActivitySession[];
}

export interface Doubt {
  id: string;
  studentRollNo: number;
  studentName: string;
  topic: string;
  question: string;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  badgeType: "bronze" | "silver" | "gold" | "platinum";
}

export const CHEMISTRY_TOPICS = [
  "Solutions",
  "Electrochemistry",
  "Chemical Kinetics",
  "d- and f-Block",
  "Coordination Compounds",
  "Haloalkanes and Haloarenes",
  "Alcohols Phenols and Ethers",
  "Aldehydes Ketones and Carboxylic Acids",
  "Amines",
  "Biomolecules"
] as const;

export const PHYSICS_TOPICS = [
  "Electrostatics",
  "Current Electricity",
  "Magnetic Effects of Current",
  "Electromagnetic Induction and AC",
  "Electromagnetic Waves",
  "Ray Optics and Optical Instruments",
  "Wave Optics",
  "Dual Nature of Matter",
  "Atoms and Nuclei",
  "Electronic Devices"
] as const;

export const MATHS_TOPICS = [
  "Relations and Functions",
  "Inverse Trigonometric Functions",
  "Matrices and Determinants",
  "Continuity and Differentiability",
  "Application of Derivatives",
  "Integrals",
  "Application of Integrals",
  "Differential Equations",
  "Vector Algebra and 3D Geometry",
  "Probability and LPP"
] as const;

export const ALL_TOPICS = [
  ...CHEMISTRY_TOPICS,
  ...PHYSICS_TOPICS,
  ...MATHS_TOPICS
];

export type TopicName = string;

export interface TopicDetail {
  name: string;
  formulas: { label: string; formula: string }[];
  concepts: string[];
  tips: string[];
}

export const TOPIC_RESOURCES: Record<string, TopicDetail> = {
  // Chemistry
  "Solutions": {
    name: "Solutions",
    formulas: [
      { label: "Raoult's Law (Volatile)", formula: "p_A = x_A • p_A°" },
      { label: "Elevation in Boiling Pt", formula: "ΔT_b = i • K_b • m" },
      { label: "Depression in Freezing Pt", formula: "ΔT_f = i • K_f • m" },
      { label: "Osmotic Pressure", formula: "π = i • C • R • T" }
    ],
    concepts: [
      "Ideal & Non-ideal solutions (positive/negative deviations)",
      "Colligative properties depending only on solute particles count",
      "van 't Hoff factor (i) for association/dissociation"
    ],
    tips: [
      "Always check if the solute dissociates (like NaCl: i=2) or associates (like Benzoic acid: i=0.5) in colligative calculations.",
      "Understand the difference between molarity (temperature dependent) and molality (temperature independent)."
    ]
  },
  "Electrochemistry": {
    name: "Electrochemistry",
    formulas: [
      { label: "Nernst Equation", formula: "E = E° - (0.0591 / n) • log(Q) [at 298K]" },
      { label: "Gibbs Energy vs E°", formula: "ΔG° = -n • F • E°" },
      { label: "Kohlrausch's Law", formula: "Λ°_m = ν_+ • λ°_+ + ν_- • λ°_-" },
      { label: "Cell Resistance", formula: "R = ρ • (l/A) = (1/κ) • G*" }
    ],
    concepts: [
      "Galvanic vs Electrolytic cells",
      "Standard Hydrogen Electrode (SHE) calibration",
      "Primary (Dry, Mercury) vs Secondary batteries (Lead accumulator, Ni-Cd)",
      "Fuel cells (H2-O2 cell) & Corrosion mechanism"
    ],
    tips: [
      "In Nernst Equation, Q is [Products]/[Reactants]. Ensure pure solids and liquids are taken as unit activity (1).",
      "Standard reduction potential is anode if oxidation, cathode if reduction. Remember: LOAN (Left Oxidation Anode Negative)."
    ]
  },
  "Chemical Kinetics": {
    name: "Chemical Kinetics",
    formulas: [
      { label: "Zero Order Rate Constant", formula: "k = ([R]_0 - [R]) / t" },
      { label: "First Order Rate Equation", formula: "k = (2.303 / t) • log([R]_0 / [R])" },
      { label: "First Order Half-life", formula: "t_1/2 = 0.693 / k" },
      { label: "Arrhenius Equation", formula: "log(k_2/k_1) = (E_a / 2.303 R) • [1/T_1 - 1/T_2]" }
    ],
    concepts: [
      "Rate of reaction, order vs molecularity",
      "Pseudo first order reactions (e.g. Acid hydrolysis of ethyl acetate)",
      "Activation energy (Ea) and transition state theory",
      "Collision theory of chemical reactions"
    ],
    tips: [
      "Order can be fractional or zero and is determined experimentally. Molecularity is always a whole number and is theoretical.",
      "The unit of rate constant (k) depends on the order: M^(1-n) L^(n-1) s^-1."
    ]
  },
  "d- and f-Block": {
    name: "d- and f-Block",
    formulas: [
      { label: "Spin-only Magnetic Moment", formula: "μ = √[n(n+2)] Bohr Magneton (BM)" }
    ],
    concepts: [
      "General properties of transition elements (metallic character, ionic radii)",
      "Variable oxidation states and catalytic properties",
      "Lanthanoid Contraction: cause (poor shielding of 4f electrons) and consequences",
      "Preparation & properties of K2Cr2O7 and KMnO4"
    ],
    tips: [
      "Lanthanoid contraction causes Zr (4d) and Hf (5d) to have almost identical atomic radii, making their separation difficult.",
      "Calculate the magnetic moment by counting the number of unpaired d-electrons (n) in the transition metal ion."
    ]
  },
  "Coordination Compounds": {
    name: "Coordination Compounds",
    formulas: [
      { label: "Effective Atomic Number (EAN)", formula: "EAN = Z - (Oxidation State) + 2 • (Coordination Number)" }
    ],
    concepts: [
      "Werner's coordination theory (primary vs secondary valencies)",
      "IUPAC nomenclature of coordination complexes",
      "Valence Bond Theory (VBT): hybridization (d2sp3 vs sp3d2) & magnetic properties",
      "Crystal Field Theory (CFT): d-orbital splitting in octahedral (t2g and eg) & tetrahedral complexes",
      "Isomerism (structural and stereoisomerism)"
    ],
    tips: [
      "Strong field ligands (like CN-, CO, en, NH3) cause pairing of electrons (low spin), while weak field ligands (F-, Cl-, H2O) do not (high spin).",
      "Primary valency is ionizable (equals oxidation state); secondary valency is non-ionizable (equals coordination number)."
    ]
  },
  "Haloalkanes and Haloarenes": {
    name: "Haloalkanes and Haloarenes",
    formulas: [],
    concepts: [
      "SN1 vs SN2 reaction mechanisms (nucleophilic substitution)",
      "Electrophilic substitution of haloarenes (ortho/para directors)",
      "Chiral carbons, optical activity, enantiomers, and racemic mixtures",
      "Name Reactions: Sandmeyer, Finkelstein, Swarts, Wurtz, Wurtz-Fittig, Fittig"
    ],
    tips: [
      "SN2: Single-step, pentavalent transition state, inversion of configuration (Walden inversion), reactivity order: Methyl > 1° > 2° > 3°.",
      "SN1: Two-step, carbocation intermediate, racemization, reactivity order: 3° > 2° > 1° (due to carbocation stability)."
    ]
  },
  "Alcohols Phenols and Ethers": {
    name: "Alcohols Phenols and Ethers",
    formulas: [],
    concepts: [
      "Acidity of phenols compared to alcohols (resonance stabilization of phenoxide ion)",
      "Mechanism of dehydration of alcohols to alkenes/ethers",
      "Lucas Test for distinguishing 1°, 2°, 3° alcohols",
      "Name Reactions: Kolbe's Reaction, Reimer-Tiemann, Williamson Ether Synthesis"
    ],
    tips: [
      "Phenol undergoes Reimer-Tiemann with CHCl3 + aq. NaOH to yield Salicylaldehyde (ortho-hydroxybenzaldehyde).",
      "In Lucas Test: 3° alcohols give turbidity immediately, 2° within 5 minutes, 1° do not give turbidity at room temperature."
    ]
  },
  "Aldehydes Ketones and Carboxylic Acids": {
    name: "Aldehydes Ketones and Carboxylic Acids",
    formulas: [],
    concepts: [
      "Nucleophilic addition reactions of carbonyls (relative reactivity of aldehydes vs ketones)",
      "Tollens' Test (Silver Mirror) and Fehling's Test for aldehydes",
      "Acidity of carboxylic acids & effect of substituents (Electron Withdrawing Groups increase acidity)",
      "Name Reactions: Rosenmund Reduction, Stephen Reaction, Etard Reaction, Clemmensen and Wolff-Kishner Reductions, Aldol Condensation, Cannizzaro, Hell-Volhard-Zelinsky (HVZ)"
    ],
    tips: [
      "Aldol condensation requires α-hydrogen (base-catalyzed). Cannizzaro occurs in aldehydes lacking α-hydrogen (concentrated alkali).",
      "Tollens' reagent [Ag(NH3)2]+ oxidizes all aldehydes (aliphatic and aromatic) but not ketones."
    ]
  },
  "Amines": {
    name: "Amines",
    formulas: [],
    concepts: [
      "Basicity of amines in gaseous phase vs aqueous phase (influence of inductive, steric, and solvation effects)",
      "Hinsberg's Test to distinguish 1°, 2°, 3° amines",
      "Diazotization of aniline and coupling reactions of diazonium salts",
      "Name Reactions: Gabriel Phthalimide Synthesis, Hoffmann Bromamide Degradation, Carbylamine Reaction"
    ],
    tips: [
      "Basicity order in aqueous solution for methyl amines: 2° > 1° > 3° > NH3. For ethyl amines: 2° > 3° > 1° > NH3.",
      "Carbylamine test is given only by primary (1°) aliphatic and aromatic amines, releasing foul-smelling isocyanides."
    ]
  },
  "Biomolecules": {
    name: "Biomolecules",
    formulas: [],
    concepts: [
      "Monosaccharides: structure of D-Glucose (open vs cyclic ring, mutarotation, anomers)",
      "Peptide bond formation, classification of proteins (fibrous vs globular)",
      "Primary, secondary, tertiary, and quaternary structures of proteins & Denaturation",
      "Nucleic acids: Chemical composition of DNA and RNA, double helix model"
    ],
    tips: [
      "Glucose reduces Tollens' and Fehling's reagent because of the free/hemicetal aldehyde group, hence it is a reducing sugar.",
      "During denaturation of proteins, secondary and tertiary structures are destroyed, but primary structure (covalent peptide bonds) remains intact."
    ]
  },

  // Physics
  "Electrostatics": {
    name: "Electrostatics",
    formulas: [
      { label: "Coulomb's Force", formula: "F = (1 / 4πε₀) • (q₁ q₂ / r²)" },
      { label: "Electric Field (Point Charge)", formula: "E = q / (4πε₀ r²)" },
      { label: "Electric Potential", formula: "V = q / (4πε₀ r)" },
      { label: "Capacitance (Parallel Plate)", formula: "C = K ε₀ A / d" }
    ],
    concepts: [
      "Gauss's Law and its three standard applications",
      "Equipotential surfaces and work done in moving a charge",
      "Electric dipole moment, torque, and potential energy in external fields",
      "Energy density stored in a capacitor"
    ],
    tips: [
      "When integrating via Gauss's Law, ensure the Gaussian surface mimics the symmetry of the charge distribution (spherical, cylindrical, or planar).",
      "Remember that electric field is always perpendicular to equipotential surfaces, pointing in the direction of decreasing potential."
    ]
  },
  "Current Electricity": {
    name: "Current Electricity",
    formulas: [
      { label: "Drift Velocity", formula: "v_d = e • E • τ / m" },
      { label: "Ohm's Law (Microscopic)", formula: "J = σ • E" },
      { label: "Kirchhoff's Loop Rule", formula: "Σ ΔV = 0" },
      { label: "Meter Bridge Ratio", formula: "P / Q = l / (100 - l)" }
    ],
    concepts: [
      "Drift velocity, relaxation time, and temperature coefficient of resistance",
      "Internal resistance of a cell, terminal potential difference, and emf",
      "Series and parallel combinations of cells (equivalent emf and resistance)",
      "Wheatstone Bridge balanced condition"
    ],
    tips: [
      "For Kirchhoff's loop calculations, stay strict with your sign convention: traversing from (-) to (+) on a cell is +emf, and moving with the current across a resistor is -IR.",
      "Manganin and Constantan are used for wire-wound standard resistors because their resistivity changes negligibly with temperature."
    ]
  },
  "Magnetic Effects of Current": {
    name: "Magnetic Effects of Current",
    formulas: [
      { label: "Biot-Savart Law", formula: "dB = (μ₀ / 4π) • I (dl × r) / r³" },
      { label: "Magnetic Field (Straight Wire)", formula: "B = μ₀ I / (2π r)" },
      { label: "Ampere's Circuital Law", formula: "∮ B • dl = μ₀ I_encl" },
      { label: "Lorentz Magnetic Force", formula: "F_m = q (v × B)" }
    ],
    concepts: [
      "Biot-Savart Law and circular current loop field integration",
      "Ampere's law, infinitely long wire, and solenoid fields",
      "Force between two parallel current-carrying wires (definition of Ampere)",
      "Galvanometer conversion to Ammeter (shunt resistance) and Voltmeter (series resistance)"
    ],
    tips: [
      "Use Right Hand Rule to cross-product vectors. Fingers curl from velocity (v) to magnetic field (B), thumb indicates the positive charge force direction.",
      "To convert a galvanometer to an ammeter, a very low shunt resistance is added in parallel; for a voltmeter, a high resistance is added in series."
    ]
  },
  "Electromagnetic Induction and AC": {
    name: "Electromagnetic Induction and AC",
    formulas: [
      { label: "Induced EMF (Faraday)", formula: "e = -dΦ / dt" },
      { label: "Motional EMF", formula: "e = B • v • l" },
      { label: "Impedance in LCR Series", formula: "Z = √[R² + (X_L - X_C)²]" },
      { label: "Resonant Frequency", formula: "f_r = 1 / (2π √(L C))" }
    ],
    concepts: [
      "Lenz's Law as a statement of conservation of energy",
      "Self and Mutual induction coefficients",
      "Phasor diagrams and power factor in LCR circuits",
      "Quality Factor (Q-factor) and sharpness of resonance in tuning circuits"
    ],
    tips: [
      "Lenz's law always opposes the change in flux. If magnetic flux is increasing, the induced magnetic field will point in the opposite direction.",
      "At resonance, impedance Z becomes purely resistive (Z = R), meaning the current is maximum, and the phase difference is zero."
    ]
  },
  "Electromagnetic Waves": {
    name: "Electromagnetic Waves",
    formulas: [
      { label: "Displacement Current", formula: "I_d = ε₀ (dΦ_E / dt)" },
      { label: "Speed of EM Waves", formula: "c = 1 / √(μ₀ ε₀) = E₀ / B₀" },
      { label: "Wave Vector Intensity", formula: "I = c ε₀ E_rms²" }
    ],
    concepts: [
      "Maxwell's addition of displacement current to Ampere's Law",
      "Transverse nature of EM waves (electric and magnetic fields oscillate mutually perpendicularly)",
      "The Electromagnetic Spectrum: spectrum bands, wavelengths, sources, and practical uses"
    ],
    tips: [
      "EM waves carry both energy and momentum. When they strike a surface, they exert radiation pressure on it.",
      "Review the spectrum's common applications: Microwaves for radar/ovens, Infrared for remote sensors, UV for sterilizing water."
    ]
  },
  "Ray Optics and Optical Instruments": {
    name: "Ray Optics and Optical Instruments",
    formulas: [
      { label: "Refractive Index (Prism)", formula: "μ = sin((A + D_m)/2) / sin(A/2)" },
      { label: "Lens Maker's Formula", formula: "1/f = (μ - 1) • (1/R₁ - 1/R₂)" },
      { label: "Compound Microscope Mag.", formula: "m = -(L/f_o) • (1 + D/f_e)" },
      { label: "Astronomical Telescope Mag.", formula: "m = -f_o / f_e" }
    ],
    concepts: [
      "Total Internal Reflection: conditions, critical angle and optic fiber mechanism",
      "Refraction through spherical surface and prism properties",
      "Power of thin lenses in contact",
      "Ray diagrams of compound microscope and refracting/reflecting telescopes"
    ],
    tips: [
      "Always apply sign convention in every problem: directions along incident ray are positive, opposite are negative.",
      "For reflecting type telescopes, parabolic mirrors eliminate spherical aberration and have high light gathering power."
    ]
  },
  "Wave Optics": {
    name: "Wave Optics",
    formulas: [
      { label: "Constructive Path Diff.", formula: "Δx = n • λ" },
      { label: "Destructive Path Diff.", formula: "Δx = (2n - 1) • λ / 2" },
      { label: "Fringe Width in YDSE", formula: "β = λ D / d" },
      { label: "Brewster's Polarization", formula: "μ = tan(i_p)" }
    ],
    concepts: [
      "Huygens' Principle: secondary wavelets and proof of reflection/refraction laws",
      "Coherent sources requirement and Young's Double Slit Experiment (YDSE) intensity",
      "Single slit diffraction: central maximum width and comparison with interference",
      "Polarization by reflection (Brewster's angle) and Malus's Law"
    ],
    tips: [
      "Interference fringes are of equal width, whereas diffraction fringes decrease rapidly in width and brightness as order increases.",
      "Unpolarized light passing through a polarizer always has its intensity halved, regardless of the orientation of the transmission axis."
    ]
  },
  "Dual Nature of Matter": {
    name: "Dual Nature of Matter",
    formulas: [
      { label: "Photoelectric Equation", formula: "K_max = h ν - Φ₀ = h ν - h ν₀" },
      { label: "Einstein Cutoff Potential", formula: "e V₀ = h ν - h ν₀" },
      { label: "de Broglie Wavelength", formula: "λ = h / p = h / √(2 m K)" },
      { label: "Electron de Broglie Wavelength", formula: "λ = 12.27 / √V Å" }
    ],
    concepts: [
      "Hertz, Lenard, and Millikan observations on photoelectric emission",
      "Failure of wave theory of light in explaining photoelectric features",
      "Photon packet theory and relation of intensity vs saturation current",
      "Wave nature of matter and experimental Davisson-Germer confirmation"
    ],
    tips: [
      "Maximum kinetic energy of photoelectrons depends only on frequency of incident light, not on light intensity.",
      "Remember that de Broglie wavelength is inversely proportional to square root of voltage V for charged particles."
    ]
  },
  "Atoms and Nuclei": {
    name: "Atoms and Nuclei",
    formulas: [
      { label: "Bohr Quantization", formula: "m v r = n h / 2π" },
      { label: "Bohr Energy Levels", formula: "E_n = -13.6 • Z² / n² [eV]" },
      { label: "Nuclear Radius Scale", formula: "R = R₀ • A^(1/3)" },
      { label: "Mass-Energy Equivalence", formula: "E = Δm • c²" }
    ],
    concepts: [
      "Rutherford alpha-particle scattering experiment and nuclear size limits",
      "Postulates of Bohr model of hydrogen atom and spectral series lines",
      "Composition and size of nucleus, mass defect, and nuclear density constancy",
      "Binding Energy per Nucleon curve: stability implications (fission and fusion)"
    ],
    tips: [
      "Nuclear density is independent of mass number A. It is nearly identical for all nuclei (~2.3 × 10¹⁷ kg/m³).",
      "To find the shortest wavelength line in a hydrogen series, take the outer shell transition limit n_initial = infinity."
    ]
  },
  "Electronic Devices": {
    name: "Electronic Devices",
    formulas: [
      { label: "Charge Carrier Density", formula: "n_i² = n_e • n_h" }
    ],
    concepts: [
      "Classification of solids into metals, semiconductors, and insulators using energy band gaps",
      "Intrinsic vs extrinsic (n-type and p-type) semiconductor doping",
      "p-n junction formation: depletion layer, barrier potential, and forward/reverse bias curves",
      "Diodes as half-wave and full-wave rectifiers, Zener diode, LEDs, solar cells"
    ],
    tips: [
      "In forward bias, external field opposes barrier potential, narrowing the depletion layer. In reverse bias, it supports barrier potential, widening it.",
      "A solar cell requires no external bias battery. It works on the principle of photogeneration of electron-hole pairs inside the junction."
    ]
  },

  // Mathematics
  "Relations and Functions": {
    name: "Relations and Functions",
    formulas: [
      { label: "Symmetric Relations Count", formula: "2^(n(n+1)/2)" },
      { label: "Reflexive Relations Count", formula: "2^(n² - n)" }
    ],
    concepts: [
      "Types of relations: reflexive, symmetric, transitive, and equivalence relations",
      "Types of functions: injective (one-to-one), surjective (onto), and bijective (both)",
      "Composition of functions and invertible functions requirements"
    ],
    tips: [
      "To prove a function is one-to-one, set f(x₁) = f(x₂) and show that it algebraically guarantees x₁ = x₂.",
      "To check if a function is onto, represent x in terms of y and verify if for every y in codomain there exists a real domain pre-image x."
    ]
  },
  "Inverse Trigonometric Functions": {
    name: "Inverse Trigonometric Functions",
    formulas: [
      { label: "sin⁻¹(x) Domain / Range", formula: "D: [-1, 1], R: [-π/2, π/2]" },
      { label: "cos⁻¹(x) Domain / Range", formula: "D: [-1, 1], R: [0, π]" },
      { label: "tan⁻¹(x) Domain / Range", formula: "D: R, R: (-π/2, π/2)" }
    ],
    concepts: [
      "Principal value branch values and definitions",
      "Graphs of inverse trigonometric functions",
      "Basic algebraic property identities and conversions"
    ],
    tips: [
      "Always check if your solved angle lies strictly within the principal branch interval (e.g. for sin⁻¹(x), angle must be in [-90°, 90°]).",
      "Remember: sin⁻¹(sin x) = x ONLY when x lies in the principal range [-π/2, π/2]. Otherwise, reduce using quadrants first."
    ]
  },
  "Matrices and Determinants": {
    name: "Matrices and Determinants",
    formulas: [
      { label: "Matrix Inverse Rule", formula: "A⁻¹ = (1 / |A|) • adj(A)" },
      { label: "Adjoint Scalar Multiplier", formula: "|adj(A)| = |A|^(n - 1)" },
      { label: "Determinant Product", formula: "|A • B| = |A| • |B|" },
      { label: "Area of Triangle (Determinant)", formula: "Area = 0.5 • |x₁(y₂ - y₃) + x₂(y₃ - y₁) + x₃(y₁ - y₂)|" }
    ],
    concepts: [
      "Symmetric and skew-symmetric matrices (properties and summation splitting)",
      "Properties of determinants (expansion, scalar multiplication)",
      "Adjoint and inverse of a square matrix",
      "Solving system of linear equations using matrix inverse method"
    ],
    tips: [
      "For skew-symmetric matrices, all diagonal elements are always zero, and the determinant of an odd-order skew-symmetric matrix is always zero.",
      "Ensure |A| is non-zero before attempting to invert a matrix. If |A| is zero, the system is singular and could have zero or infinite solutions."
    ]
  },
  "Continuity and Differentiability": {
    name: "Continuity and Differentiability",
    formulas: [
      { label: "Logarithmic Derivative", formula: "d/dx (x^x) = x^x (1 + ln x)" },
      { label: "Chain Rule", formula: "dy/dx = (dy/du) • (du/dx)" },
      { label: "Parametric Derivative", formula: "dy/dx = (dy/dt) / (dx/dt)" }
    ],
    concepts: [
      "Continuity of a function at a point and in an interval",
      "Differentiability of composite, implicit, and inverse trig functions",
      "Exponential, logarithmic, and parametric differentiation methods",
      "Rolle's and Mean Value Theorems (MVT) geometrical meaning"
    ],
    tips: [
      "A function is differentiable at x = c if Left Hand Derivative (LHD) equals Right Hand Derivative (RHD). Note that differentiability implies continuity, but not vice versa.",
      "Use logarithmic differentiation whenever a function is raised to the power of another function (e.g., u(x)^v(x))."
    ]
  },
  "Application of Derivatives": {
    name: "Application of Derivatives",
    formulas: [
      { label: "Tangent Line Slope", formula: "m_t = f'(x_0)" },
      { label: "Normal Line Slope", formula: "m_n = -1 / f'(x_0)" },
      { label: "First Derivative critical pt", formula: "f'(c) = 0" }
    ],
    concepts: [
      "Rate of change of quantities in physics and geometry",
      "Strictly increasing and decreasing intervals of a function",
      "Local/absolute maxima and minima using first and second derivative tests",
      "Applied optimization word problems (finding max volume, min surface area)"
    ],
    tips: [
      "For maxima and minima word problems, find a single helper equation to express your target quantity in terms of exactly one variable before differentiating.",
      "Always verify local maximum vs minimum using the Second Derivative Test: f''(c) < 0 implies local maximum, f''(c) > 0 implies local minimum."
    ]
  },
  "Integrals": {
    name: "Integrals",
    formulas: [
      { label: "Integration by Parts", formula: "∫ u v dx = u ∫ v dx - ∫ [u' ∫ v dx] dx" },
      { label: "Definite Integral King Prop.", formula: "∫_a^b f(x) dx = ∫_a^b f(a + b - x) dx" },
      { label: "Definite Integral Odd/Even", formula: "∫_{-a}^a f(x) dx = 2∫_0^a f(x) dx [if even], 0 [if odd]" },
      { label: "Special Integral", formula: "∫ dx / √(a² - x²) = sin⁻¹(x/a) + C" }
    ],
    concepts: [
      "Integration as the inverse process of differentiation (indefinite integrals)",
      "Methods of integration: substitution, partial fractions, and integration by parts",
      "Fundamental Theorem of Calculus and definite integral evaluation",
      "Essential properties of definite integrals (splitting, symmetry, substitution limits)"
    ],
    tips: [
      "The ILATE rule is extremely useful for deciding first (u) and second (v) functions in integration by parts (Inverse, Logarithmic, Algebraic, Trigonometric, Exponential).",
      "Use the King's property (replacing x with a+b-x) to solve tricky definite integrals containing sin/cos combinations easily."
    ]
  },
  "Application of Integrals": {
    name: "Application of Integrals",
    formulas: [
      { label: "Area between Curve & X-axis", formula: "Area = ∫_a^b y dx" },
      { label: "Area between two Curves", formula: "Area = ∫_a^b (y_upper - y_lower) dx" }
    ],
    concepts: [
      "Area bounded by simple standard curves: lines, circles, parabolas, and ellipses",
      "Finding intersection points and setting up coordinate limits",
      "Calculating areas of symmetrical regions using multiplier coefficients"
    ],
    tips: [
      "Always sketch the curves first! A rough sketch ensures you select the correct upper/lower boundaries and prevents double-counting overlapping areas.",
      "For symmetric shapes like an ellipse, find the area of one quadrant and multiply by four to save time on integration bounds."
    ]
  },
  "Differential Equations": {
    name: "Differential Equations",
    formulas: [
      { label: "Linear DE Standard Form", formula: "dy/dx + P • y = Q" },
      { label: "Integrating Factor (I.F.)", formula: "I.F. = e^(∫ P dx)" },
      { label: "Linear DE Solution", formula: "y • I.F. = ∫ (Q • I.F.) dx + C" }
    ],
    concepts: [
      "Order (highest derivative) and degree (power of highest derivative) of a differential equation",
      "Formation of differential equations representing families of curves",
      "Solving separable variables and homogeneous differential equations",
      "Solving first-order linear differential equations"
    ],
    tips: [
      "Degree is only defined when the differential equation can be written as a polynomial in derivatives. E.g., sin(dy/dx) has no defined degree.",
      "For homogeneous differential equations, always substitute y = vx, which transforms the equation into a separable variable form."
    ]
  },
  "Vector Algebra and 3D Geometry": {
    name: "Vector Algebra and 3D Geometry",
    formulas: [
      { label: "Scalar Dot Product", formula: "a • b = |a| |b| cos(θ)" },
      { label: "Vector Cross Product", formula: "a × b = |a| |b| sin(θ) n̂" },
      { label: "Shortest Dist (Skew Lines)", formula: "d = |(a₂ - a₁) • (b₁ × b₂)| / |b₁ × b₂|" },
      { label: "Angle Between Planes", formula: "cos(θ) = |A₁A₂ + B₁B₂ + C₁C₂| / [√(ΣA₁²) √(ΣA₂²)]" }
    ],
    concepts: [
      "Direction cosines, direction ratios, and scalar/vector projection",
      "Line equations in vector and Cartesian 3D representations",
      "Skew lines shortest distance derivation",
      "Coplanarity of lines and angles between lines and planes"
    ],
    tips: [
      "Two vectors are orthogonal if their dot product is zero, and collinear/parallel if their cross product is the zero vector.",
      "Skew lines are lines in space that are neither parallel nor intersecting. The shortest distance line is perpendicular to both."
    ]
  },
  "Probability and LPP": {
    name: "Probability and LPP",
    formulas: [
      { label: "Conditional Probability", formula: "P(A|B) = P(A ∩ B) / P(B)" },
      { label: "Bayes' Theorem", formula: "P(E_i|A) = P(E_i)P(A|E_i) / [Σ P(E_j)P(A|E_j)]" },
      { label: "Expected Value (Mean)", formula: "E(X) = Σ x_i • p(x_i)" }
    ],
    concepts: [
      "Conditional probability, multiplication theorem, and independent events",
      "Total Probability Theorem and Bayes' Theorem application",
      "Linear Programming Problem (LPP) mathematical formulation",
      "Corner point method for finding optimal values in a bounded feasible region"
    ],
    tips: [
      "Bayes' theorem is used when an event has occurred and you need to trace its probability back to a specific prior cause.",
      "In LPP, the optimal (maximum or minimum) values of the objective function are guaranteed to occur at the corner points of the feasible region."
    ]
  }
};
