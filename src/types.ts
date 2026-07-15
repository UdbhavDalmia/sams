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
    subject: "Chemistry" | "Physics" | "Mathematics" | "Biology";
    detail: string;
  }>;
}

export interface StudentPreferences {
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  reminderWindowMinutes: number;
  targetScore: number;
}

export interface StudentStudyPlan {
  dailyGoalMinutes: number;
  weeklyTargets: Record<string, number>;
  focusSubjects: Array<"Chemistry" | "Physics" | "Mathematics" | "Biology">;
}

export interface StudentNotification {
  id: string;
  type: "quiz" | "progress" | "system";
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  passcodes: string[];
  email: string;
  classes: string[];
}

export interface Student {
  rollNo: number;
  classId?: string;
  name: string;
  phone: string;
  scores: Record<string, number>;
  milestones?: Record<string, boolean[]>; // stores topic name -> array of booleans mapping to NCERT concepts list
  email?: string;
  profileStatus?: "active" | "needs-linking" | "suspended";
  preferences?: StudentPreferences;
  studyPlan?: StudentStudyPlan;
  notifications?: StudentNotification[];
  lastActiveAt?: string;
  streakDays?: number;
  goals?: string[];
  activeQuiz?: ActiveQuizState | null;
  quizStats?: {
    totalQuizzes: number;
    bySubject: { chemistry: number; physics: number; maths: number; biology?: number };
  };
  recentSessions?: ActivitySession[];
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

export const BIOLOGY_TOPICS = [
  "Sexual Reproduction in Flowering Plants",
  "Human Reproduction",
  "Reproductive Health",
  "Principles of Inheritance and Variation",
  "Molecular Basis of Inheritance",
  "Evolution",
  "Human Health and Diseases",
  "Microbes in Human Welfare",
  "Biotechnology Principles and Processes",
  "Biotechnology and its Applications"
] as const;

export const ALL_TOPICS = [
  ...CHEMISTRY_TOPICS,
  ...PHYSICS_TOPICS,
  ...MATHS_TOPICS,
  ...BIOLOGY_TOPICS
];

export function getStudentSubjects(scores: Record<string, number>): string[] {
  const subjects: string[] = [];
  if (CHEMISTRY_TOPICS.some(t => t in scores)) subjects.push("Chemistry");
  if (PHYSICS_TOPICS.some(t => t in scores)) subjects.push("Physics");
  if (MATHS_TOPICS.some(t => t in scores)) subjects.push("Mathematics");
  if (BIOLOGY_TOPICS.some(t => t in scores)) subjects.push("Biology");
  return subjects;
}

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
      "Types of solutions & concentration units (molarity, molality, mole fraction)",
      "Solubility of gases in liquids (Henry's Law)",
      "Raoult's Law & vapor pressure of liquid-liquid solutions",
      "Ideal and non-ideal solutions (positive & negative deviations)",
      "Colligative properties (vapor pressure lowering, boiling pt elevation, freezing pt depression, osmotic pressure)",
      "van 't Hoff factor (i) for association/dissociation of solutes"
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
      "Galvanic cells, EMF of a cell, and measurement of electrode potential",
      "Nernst equation, equilibrium constant, and Gibbs energy of cell reactions",
      "Conductance of electrolytic solutions & Kohlrausch's Law",
      "Electrolysis: Faraday's laws of electrolysis and product prediction",
      "Primary and secondary batteries (dry cell, lead storage battery, fuel cells)",
      "Corrosion: mechanism, factors, and methods of prevention"
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
      "Rate of reaction: average and instantaneous rates",
      "Factors affecting reaction rate (concentration, temperature, catalyst)",
      "Order and molecularity of a reaction",
      "Integrated rate equations and half-life for zero & first order reactions",
      "Temperature dependence of reaction rate (Arrhenius equation and activation energy)",
      "Collision theory of chemical reactions (elementary ideas)"
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
      "General characteristics & electronic configurations of transition elements (d-block)",
      "Trends in properties: metallic character, ionic radii, oxidation states",
      "Catalytic properties, interstitial compounds, and alloy formation",
      "Lanthanoids: electronic configuration, oxidation states, and lanthanoid contraction",
      "Actinoids: electronic configuration, oxidation states, and comparison with lanthanoids",
      "Preparation and properties of potassium dichromate ($K_2Cr_2O_7$) and potassium permanganate ($KMnO_4$)"
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
      "IUPAC nomenclature of coordination complexes and types of ligands",
      "Structural and stereoisomerism in coordination complexes",
      "Valence Bond Theory (VBT): hybridization, geometry, and magnetic properties",
      "Crystal Field Theory (CFT): d-orbital splitting in octahedral and tetrahedral complexes",
      "Stability, color, and bonding in metal carbonyls"
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
      "Classification, nomenclature, and nature of C-X bond in alkyl/aryl halides",
      "Methods of preparation of haloalkanes and haloarenes",
      "Physical properties: boiling points, density, and solubility trends",
      "SN1 and SN2 nucleophilic substitution reaction mechanisms",
      "Elimination reactions (Saytzeff's rule) and organometallic reactions (Grignard)",
      "Electrophilic substitution reactions in haloarenes and polyhalogen compounds"
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
      "Nomenclature, classification, and preparation of alcohols and phenols",
      "Physical properties: boiling points and solubility (hydrogen bonding effects)",
      "Chemical reactions: acidity of alcohols and phenols (substituent effects)",
      "Mechanisms of acid-catalyzed hydration & dehydration of alcohols",
      "Identification tests: Lucas test and chemical oxidation reactions",
      "Preparation and chemical reactions of ethers (Williamson synthesis, cleavage by HX)"
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
      "Nomenclature, structure, and preparation methods of carbonyl compounds",
      "Nucleophilic addition reaction mechanisms (HCN, NaHSO3, alcohols, Grignard)",
      "Oxidation reactions: Tollens' test, Fehling's test, and Haloform reaction",
      "Aldol condensation and Cannizzaro reactions (alpha-hydrogen significance)",
      "Nomenclature, structure, and preparation methods of carboxylic acids",
      "Acidity of carboxylic acids and reactions involving -COOH cleavage (esterification, HVZ)"
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
      "Classification, nomenclature, structure, and preparation methods of amines",
      "Physical properties: boiling points, solubility, and basicity trends",
      "Basicity of aliphatic and aromatic amines in gaseous and aqueous phases",
      "Chemical reactions: acylation, carbylamine reaction, Hinsberg's test",
      "Preparation and properties of diazonium salts",
      "Synthetic applications of diazonium salts (Sandmeyer and coupling reactions)"
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
      "Monosaccharides: structure, cyclic form, and chemical reactions of Glucose and Fructose",
      "Disaccharides (Sucrose, Lactose, Maltose) and Polysaccharides (Starch, Cellulose, Glycogen)",
      "Amino acids: classification, peptide bond, zwitterion structure",
      "Proteins: primary, secondary (alpha-helix, beta-pleated), tertiary, and quaternary structures",
      "Enzymes: mechanism of action and denaturation of proteins",
      "Nucleic acids: chemical composition of DNA/RNA, double helix model, and replication"
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
      "Coulomb's law, forces between multiple charges, and electric field lines",
      "Electric dipole: field, torque, and potential energy in a uniform field",
      "Gauss's law: statement and applications (infinite wire, infinite sheet, spherical shell)",
      "Electric potential, potential difference, and equipotential surfaces",
      "Capacitors, capacitance, and parallel plate capacitor with dielectric medium",
      "Combinations of capacitors, energy stored, and energy density in a capacitor"
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
      "Electric current, drift velocity, mobility, and their relation to current",
      "Ohm's law, electrical resistance, resistivity, and temperature dependence",
      "Carbon resistors, color coding, and electrical energy and power",
      "Internal resistance of a cell, EMF, terminal potential difference, and combinations of cells",
      "Kirchhoff's rules and their applications in circuit analysis",
      "Wheatstone bridge principle, slide wire meter bridge, and potentiometer"
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
      "Biot-Savart law and magnetic field on the axis of a circular current loop",
      "Ampere's circuital law and magnetic field of an infinitely long straight wire & solenoid",
      "Force on a moving charge and current-carrying conductor in a magnetic field",
      "Motion of a charged particle in a uniform magnetic/electric field (cyclotron)",
      "Magnetic force between two parallel current-carrying conductors (definition of Ampere)",
      "Torque on current loop in a magnetic field and moving coil galvanometer (sensitivity)"
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
      "Faraday's laws of induction, induced EMF, Lenz's law, and conservation of energy",
      "Motional electromotive force (EMF) and eddy currents (applications)",
      "Self-induction and mutual induction coefficients (solenoids, coils)",
      "Alternating current, peak and RMS values, reactance, and LCR series circuit impedance",
      "Resonance in LCR circuits: resonant frequency, Q-factor, and power factor",
      "Electrical generators and transformers (energy loss mechanisms)"
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
      "Displacement current: Ampere-Maxwell law modification",
      "Maxwell's equations (qualitative ideas only)",
      "Electromagnetic waves: source, transverse nature, and speed formula",
      "Energy, momentum, and radiation pressure of electromagnetic waves",
      "The electromagnetic spectrum: radio waves, microwaves, infrared, visible spectrum",
      "UV, X-rays, gamma rays: production, detection, and practical applications"
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
      "Reflection of light: spherical mirrors and mirror formula derivation",
      "Refraction of light: snell's law, apparent depth, and total internal reflection",
      "Refraction at spherical surfaces, thin lens formula, and lens maker's formula",
      "Refraction through a prism: angle of minimum deviation and prism formula",
      "Optical instruments: simple and compound microscopes (magnifying power)",
      "Astronomical refracting/reflecting telescopes (magnifying power and aberrations)"
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
      "Wavefronts and Huygens' principle: wave propagation explanation",
      "Proof of laws of reflection and refraction using Huygens' principle",
      "Coherent sources, light wave interference, and Young's double slit experiment (YDSE)",
      "Analytical expression for fringe width and dark/bright fringe conditions",
      "Diffraction of light: single slit diffraction, width of central maximum",
      "Polarization of light: Brewster's law, polaroids, and Malus's law"
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
      "Photoelectric effect: Hertz, Lenard, Millikan experimental observations",
      "Wave theory failure and Einstein's explanation using photon hypothesis",
      "Photoelectric equation: work function, threshold frequency, and stopping potential",
      "Wave-particle duality: de Broglie wavelength of matter waves",
      "de Broglie wavelength of an electron: formula and voltage dependency",
      "Davisson-Germer experiment (experimental confirmation of wave nature)"
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
      "Alpha-particle scattering experiment, Rutherford model, and distance of closest approach",
      "Bohr model of hydrogen atom: postulates, orbit radius, velocity, and energy levels",
      "Spectral series of hydrogen atom (Lyman, Balmer, Paschen, Brackett, Pfund)",
      "Composition of nucleus: proton-neutron model, size, and nuclear density",
      "Mass defect, binding energy, and binding energy per nucleon curve",
      "Nuclear forces, nuclear fission, and nuclear fusion mechanisms"
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
      "Energy bands in solids: valence band, conduction band, and band gap classification",
      "Intrinsic semiconductors and extrinsic doping (n-type and p-type)",
      "p-n junction diode: formation, depletion region, barrier potential, and I-V curves",
      "Junction diode as a rectifier: half-wave and full-wave rectification",
      "Special purpose p-n junction diodes: Zener diode (voltage regulator), photodiode",
      "Light emitting diodes (LEDs) and solar cell operational principles"
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
      "Equivalence classes and their algebraic properties",
      "Types of functions: injective (one-to-one), surjective (onto), and bijective functions",
      "Composition of functions: associative property and identity functions",
      "Invertible functions: condition of existence and properties of inverse functions",
      "Bijective mapping and counting of onto functions"
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
      "Definition, domain, range, and principal value branches of inverse trig functions",
      "Graphs of inverse trigonometric functions",
      "Properties of inverse trig functions: reciprocal, negative argument, and co-function relations",
      "Sum and difference formulas ($\\tan^{-1}x \\pm \\tan^{-1}y$)",
      "Double and triple angle conversions ($2\\sin^{-1}x$, $2\\cos^{-1}x$, $2\\tan^{-1}x$)",
      "Simplification of complex inverse trigonometric expressions"
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
      "Types of matrices, matrix operations (addition, scalar multiplication, multiplication)",
      "Symmetric and skew-symmetric matrices: properties and sum representation",
      "Determinant of a square matrix, minors, cofactors, and expansion properties",
      "Adjoint of a matrix and inverse of a square matrix (existence conditions)",
      "Solution of a system of linear equations using matrix inverse method",
      "Area of a triangle using determinants and test of consistency"
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
      "Continuity of a function at a point, in an interval, and algebra of continuous functions",
      "Differentiability of functions, relation between continuity and differentiability",
      "Differentiation of composite functions (chain rule) and implicit functions",
      "Derivatives of inverse trigonometric functions and exponential/logarithmic functions",
      "Logarithmic differentiation, parametric differentiation, and second-order derivatives",
      "Rolle's Theorem and Lagrange's Mean Value Theorem (geometrical interpretations)"
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
      "Rate of change of quantities: equations of motion, geometric expansion",
      "Increasing and decreasing functions: critical points, strictly increasing/decreasing intervals",
      "Tangents and normals: equations, slopes, and perpendicular/parallel conditions",
      "Maxima and minima: local maxima/minima, first and second derivative tests",
      "Absolute maxima and minima in a closed interval",
      "Applied optimization problems: maximizing volume, minimizing cost or material area"
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
      "Integration as the inverse process of differentiation: basic properties & formulas",
      "Integration by method of substitution: standard algebraic and trigonometric substitutions",
      "Integration using trigonometric identities and special integrals ($\\int \\frac{dx}{x^2 \\pm a^2}$)",
      "Integration by partial fractions: linear, repeated, and quadratic factors",
      "Integration by parts: ILATE rule and standard forms ($\\int e^x[f(x)+f'(x)]dx$)",
      "Definite integrals: Fundamental Theorem of Calculus and mathematical properties"
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
      "Finding intersection coordinates of curves to establish integration limits",
      "Area under a curve and area between two curves (splitting regions)",
      "Horizontal vs vertical integration methods ($\\int y\\,dx$ vs $\\int x\\,dy$)",
      "Symmetry in area calculations: identifying and calculating symmetrical parts",
      "Standard applications: area of circle/ellipse sectors and shaded regions"
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
      "Definition, order, and degree of a differential equation",
      "General and particular solutions of a differential equation",
      "Formation of a differential equation from a family of curves (eliminating constants)",
      "Separation of variables method for solving first-order differential equations",
      "Homogeneous differential equations: substitution $y = vx$ and solution",
      "First-order linear differential equations: integrating factor ($I.F.$) and solution"
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
      "Vectors and scalars, direction cosines/ratios, types of vectors, component form",
      "Operations: addition, scalar multiplication, and position vector projection",
      "Scalar (dot) product and vector (cross) product: algebraic properties and angle",
      "Equation of a line in 3D space: vector and Cartesian forms, angle between lines",
      "Shortest distance between two lines: skew lines and parallel lines formulas",
      "Direction cosines and coordinate geometry of intersecting systems"
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
      "Conditional probability and multiplication theorem on probability",
      "Independent events, Bayes' theorem, and total probability theorem",
      "Random variable, probability distribution, mean and variance",
      "Linear Programming Problem (LPP): mathematical formulation and terminologies",
      "Graphical method of solution for two-variable LPP: feasible and infeasible regions",
      "Corner point method: finding optimal values of objective function"
    ],
    tips: [
      "Bayes' theorem is used when an event has occurred and you need to trace its probability back to a specific prior cause.",
      "In LPP, the optimal (maximum or minimum) values of the objective function are guaranteed to occur at the corner points of the feasible region."
    ]
  },

  // Biology
  "Sexual Reproduction in Flowering Plants": {
    name: "Sexual Reproduction in Flowering Plants",
    formulas: [
      { label: "Pollen grains from 1 PMC", formula: "4 functional pollen grains" },
      { label: "Embryo sac structure", formula: "7-celled, 8-nucleate structure" }
    ],
    concepts: [
      "Structure of flower, pre-fertilization events: stamen, microsporangium, pollen grain",
      "Pistil, megasporangium (ovule), and embryo sac development (megasporogenesis)",
      "Pollination: types (autogamy, geitonogamy, xenogamy), agents, and outbreeding devices",
      "Pollen-pistil interaction, double fertilization (syngamy and triple fusion)",
      "Post-fertilization events: endosperm and embryo development",
      "Seed and fruit development, apomixis, parthenocarpy, and polyembryony"
    ],
    tips: [
      "In angiosperms, the endosperm is triploid (3n) while the embryo is diploid (2n).",
      "Exine of pollen grains is made of sporopollenin, one of the most resistant organic materials."
    ]
  },
  "Human Reproduction": {
    name: "Human Reproduction",
    formulas: [
      { label: "Spermatogenesis yield", formula: "1 Primary Spermatocyte -> 4 Sperms" },
      { label: "Oogenesis yield", formula: "1 Primary Oocyte -> 1 Ovum + Polar Bodies" }
    ],
    concepts: [
      "Male reproductive system: testes, accessory ducts, glands, and external genitalia",
      "Female reproductive system: ovaries, oviducts, uterus, cervix, vagina, and mammary glands",
      "Gametogenesis: sperms production (spermatogenesis) and egg production (oogenesis)",
      "Menstrual cycle: hormonal regulation, follicular, ovulatory, luteal, and menstrual phases",
      "Fertilization: acrosomal reaction, zygote formation, cleavage, and blastocyst formation",
      "Implantation, pregnancy, embryonic development, placenta, parturition, and lactation"
    ],
    tips: [
      "LH surge triggers ovulation around day 14 of a standard 28-day menstrual cycle.",
      "Colostrum, the first milk produced after birth, is rich in IgA antibodies."
    ]
  },
  "Reproductive Health": {
    name: "Reproductive Health",
    formulas: [
      { label: "Natural Rhythm Method", formula: "Avoid intercourse during days 10-17 of cycle" }
    ],
    concepts: [
      "Reproductive health: problems, strategies, and population stabilization measures",
      "Natural, barrier, and chemical contraceptive methods",
      "Intrauterine Devices (IUDs), oral contraceptives, implants, and surgical methods (sterilization)",
      "Medical Termination of Pregnancy (MTP): legality and clinical significance",
      "Sexually Transmitted Infections (STIs): types, symptoms, prevention, and treatment",
      "Infertility and Assisted Reproductive Technologies (ART): IVF, ET, ZIFT, GIFT, ICSI, AI"
    ],
    tips: [
      "Lippes loop is non-medicated, CuT/Cu7 are copper-releasing, and Progestasert is hormone-releasing IUD.",
      "Hepatitis-B, Genital Herpes, and HIV are not completely curable STIs."
    ]
  },
  "Principles of Inheritance and Variation": {
    name: "Principles of Inheritance and Variation",
    formulas: [
      { label: "Monohybrid F2 Ratio", formula: "3:1 (Phenotypic), 1:2:1 (Genotypic)" },
      { label: "Dihybrid F2 Ratio", formula: "9:3:3:1 (Phenotypic)" },
      { label: "Hardy-Weinberg Equilibrium", formula: "p² + 2pq + q² = 1" }
    ],
    concepts: [
      "Mendel's experiments, laws of inheritance: dominance, segregation, independent assortment",
      "Incomplete dominance, co-dominance (ABO blood grouping), and multiple alleles",
      "Chromosomal theory of inheritance, linkage, recombination, and genetic mapping",
      "Sex determination in humans, birds, and honey bees",
      "Mutation, pedigree analysis, Mendelian disorders (hemophilia, sickle-cell, phenylketonuria)",
      "Chromosomal disorders: Down's syndrome, Klinefelter's syndrome, Turner's syndrome"
    ],
    tips: [
      "Hemophilia and Color blindness are X-linked recessive disorders, whereas Sickle cell anemia is autosomal recessive.",
      "Down's syndrome is due to trisomy of chromosome 21."
    ]
  },
  "Molecular Basis of Inheritance": {
    name: "Molecular Basis of Inheritance",
    formulas: [
      { label: "DNA Helix Pitch", formula: "3.4 nm (10 base pairs per turn)" },
      { label: "Chargaff's Rule", formula: "[A] + [G] = [T] + [C] or A/T = G/C = 1" }
    ],
    concepts: [
      "DNA structure, nucleosome packaging, search for genetic material (Griffith, Hershey-Chase)",
      "Semiconservative DNA replication mechanism (Meselson-Stahl experiment)",
      "Transcription: prokaryotic vs eukaryotic transcription, promoter, terminator, and RNA processing",
      "Genetic code: characteristics, codon degeneracy, tRNA adapter molecule",
      "Translation: activation of amino acids, initiation, elongation, and termination",
      "Regulation of gene expression: Lac Operon model, Human Genome Project (HGP), DNA fingerprinting"
    ],
    tips: [
      "RNA polymerase transcribes DNA 5' to 3'. The codon AUG acts as both the start codon and codes for Methionine.",
      "Sanger sequencing was used for sequencing the human genome."
    ]
  },
  "Evolution": {
    name: "Evolution",
    formulas: [
      { label: "Gene frequency change", formula: "p + q = 1 (allele frequency)" }
    ],
    concepts: [
      "Origin of life theories, chemical evolution (Oparin-Haldane and Urey-Miller experiment)",
      "Paleontological, morphological, comparative anatomical (homology, analogy) evidences",
      "Theories of evolution: Lamarckism, Darwin's natural selection, Mutation theory (de Vries)",
      "Modern synthetic theory of evolution, Hardy-Weinberg principle (factors affecting)",
      "Adaptive radiation (Darwin's finches, Australian marsupials)",
      "Brief account of geological time scale, human evolution stages (Dryopithecus to Homo sapiens)"
    ],
    tips: [
      "Homologous organs show divergent evolution (common ancestry), while analogous organs show convergent evolution (common function).",
      "Miller used CH4, NH3, H2, and water vapor at 800°C to simulate early Earth's atmosphere."
    ]
  },
  "Human Health and Diseases": {
    name: "Human Health and Diseases",
    formulas: [
      { label: "Antibody structure", formula: "H2L2 (2 heavy, 2 light chains)" }
    ],
    concepts: [
      "Common infectious diseases in humans: pathogens, modes of transmission (typhoid, malaria, etc.)",
      "Life cycle of Plasmodium (malaria parasite)",
      "Immunity: innate vs acquired, active vs passive, vaccination and immunization",
      "Structure of antibody, cell-mediated vs humoral immune responses",
      "Autoimmunity, allergies, AIDS (HIV replication cycle), and cancer (causes, diagnosis, treatment)",
      "Drug, alcohol, and tobacco abuse: prevention and control measures"
    ],
    tips: [
      "Malaria sporozoites enter the human body via female Anopheles bite, reproduce in liver, then rupture RBCs releasing haemozoin.",
      "The HIV virus selectively attacks and destroys Helper T-cells (CD4+)."
    ]
  },
  "Microbes in Human Welfare": {
    name: "Microbes in Human Welfare",
    formulas: [
      { label: "BOD relationship", formula: "BOD ∝ Organic matter load" }
    ],
    concepts: [
      "Microbes in household food processing (curd, cheese, dough fermentation)",
      "Industrial microbiology: fermented beverages, antibiotics, enzymes, and bioactive molecules",
      "Sewage treatment: primary treatment (physical) and secondary biological treatment (flocs)",
      "Biogas (methane) production: role of methanogenic bacteria (Methanobacterium)",
      "Microbes as biocontrol agents: Bacillus thuringiensis, Trichoderma, Baculoviruses",
      "Microbes as biofertilizers: Rhizobium, Azotobacter, Mycorrhiza, Cyanobacteria"
    ],
    tips: [
      "Cyclosporin A (immunosuppressant) is produced by Trichoderma polysporum, and Statins (cholesterol-lowering) by Monascus purpureus.",
      "BOD is a measure of the organic matter present in water; higher BOD means higher pollution."
    ]
  },
  "Biotechnology Principles and Processes": {
    name: "Biotechnology Principles and Processes",
    formulas: [
      { label: "PCR Amplification", formula: "2^n copies (n = number of cycles)" }
    ],
    concepts: [
      "Core principles of biotechnology: genetic engineering and bioprocess engineering",
      "Recombinant DNA technology tools: restriction enzymes (endonucleases, palindromes)",
      "Gel electrophoresis for DNA separation, cloning vectors (plasmids, pBR322 marker genes)",
      "Methods of introducing foreign DNA: competent host preparation, gene gun, microinjection",
      "Processes of r-DNA technology: isolation of DNA, PCR amplification (steps)",
      "Downstream processing, bioreactors (stirred-tank types) for large-scale production"
    ],
    tips: [
      "DNA is negatively charged, so it moves towards the positive electrode (anode) during agarose gel electrophoresis.",
      "Taq polymerase remains stable at high temperatures during the denaturation step of PCR."
    ]
  },
  "Biotechnology and its Applications": {
    name: "Biotechnology and its Applications",
    formulas: [
      { label: "Bt Toxin activation", formula: "Alkaline pH of insect midgut" }
    ],
    concepts: [
      "Applications in agriculture: Bt cotton (mechanism of Bt toxin), RNA interference (RNAi)",
      "Applications in medicine: genetically engineered insulin production",
      "Gene therapy: treatment of Adenosine Deaminase (ADA) deficiency",
      "Molecular diagnosis: PCR, ELISA, and recombinant DNA technology detection",
      "Transgenic animals: production reasons, safety testing, and chemical testing",
      "Ethical issues, patent laws, biopiracy (case of Basmati rice)"
    ],
    tips: [
      "ADA deficiency can be cured permanently if treated with gene therapy at early embryonic stages.",
      "RNA interference takes place in all eukaryotic organisms as a method of cellular defense."
    ]
  }
};
