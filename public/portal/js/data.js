/**
 * Ethiopian New Curriculum – Topics to Textbook Pages
 * Grades 9–12 | Official MoE Student Textbooks (2023+)
 *
 * Structure:
 *   grade, subject, topic, unit, unitTitle, pages, keywords[]
 *
 * Page ranges are approximate (based on official textbooks).
 * Exact pages may vary slightly by print run.
 */

const TOPICS = [

  // =========================================================
  // BIOLOGY
  // =========================================================

  // ----- Grade 9 Biology (6 units, ~171 pages) -----
  { grade: 9, subject: "Biology", topic: "Introduction to Biology", unit: 1, unitTitle: "Introduction to Biology", pages: "1–25", keywords: ["scientific method", "branches of biology", "importance of biology"] },
  { grade: 9, subject: "Biology", topic: "Characteristics and Classification of Organisms", unit: 2, unitTitle: "Characteristics and Classification of Organisms", pages: "26–55", keywords: ["taxonomy", "binomial nomenclature", "kingdoms", "classification"] },
  { grade: 9, subject: "Biology", topic: "Cells", unit: 3, unitTitle: "Cells", pages: "56–90", keywords: ["cell structure", "prokaryotic", "eukaryotic", "organelles", "cell theory"] },
  { grade: 9, subject: "Biology", topic: "Reproduction", unit: 4, unitTitle: "Reproduction", pages: "91–120", keywords: ["asexual reproduction", "sexual reproduction", "human reproduction", "gametogenesis"] },
  { grade: 9, subject: "Biology", topic: "Human Health, Nutrition and Disease", unit: 5, unitTitle: "Human Health, Nutrition and Disease", pages: "121–150", keywords: ["nutrition", "balanced diet", "disease", "immunity", "pathogens"] },
  { grade: 9, subject: "Biology", topic: "Ecology", unit: 6, unitTitle: "Ecology", pages: "151–171", keywords: ["ecosystem", "food chain", "food web", "biodiversity", "conservation"] },

  // ----- Grade 10 Biology (6 units, ~182 pages) -----
  { grade: 10, subject: "Biology", topic: "Sub-fields of Biology", unit: 1, unitTitle: "Sub-fields of Biology", pages: "1–20", keywords: ["pure biology", "applied biology", "branches of biology"] },
  { grade: 10, subject: "Biology", topic: "Plants", unit: 2, unitTitle: "Plants", pages: "21–55", keywords: ["photosynthesis", "plant transport", "tropism", "medicinal plants", "plant structure"] },
  { grade: 10, subject: "Biology", topic: "Biochemical Molecules", unit: 3, unitTitle: "Biochemical Molecules", pages: "56–85", keywords: ["carbohydrates", "proteins", "lipids", "nucleic acids", "water"] },
  { grade: 10, subject: "Biology", topic: "Cell Reproduction / Cell Cycle", unit: 4, unitTitle: "Cell Reproduction", pages: "86–115", keywords: ["mitosis", "meiosis", "cell cycle", "chromosomes"] },
  { grade: 10, subject: "Biology", topic: "Human Biology", unit: 5, unitTitle: "Human Biology", pages: "116–155", keywords: ["digestive system", "circulatory system", "respiratory system", "urinary system", "immune system"] },
  { grade: 10, subject: "Biology", topic: "Ecological Interactions", unit: 6, unitTitle: "Ecological Interactions", pages: "156–182", keywords: ["population", "community", "ecosystem", "symbiosis", "competition"] },

  // ----- Grade 11 Biology (6 units, ~294 pages) -----
  { grade: 11, subject: "Biology", topic: "Biology and Technology", unit: 1, unitTitle: "Biology and Technology", pages: "1–40", keywords: ["biotechnology", "applications of biology", "genetic engineering intro"] },
  { grade: 11, subject: "Biology", topic: "Characteristics of Animals", unit: 2, unitTitle: "Characteristics of Animals", pages: "41–90", keywords: ["animal diversity", "adaptations", "animal classification"] },
  { grade: 11, subject: "Biology", topic: "Enzymes", unit: 3, unitTitle: "Enzymes", pages: "91–130", keywords: ["enzyme structure", "enzyme action", "factors affecting enzymes", "enzyme inhibitors"] },
  { grade: 11, subject: "Biology", topic: "Genetics", unit: 4, unitTitle: "Genetics", pages: "131–200", keywords: ["DNA", "RNA", "Mendelian genetics", "protein synthesis", "genetic engineering", "pedigree"] },
  { grade: 11, subject: "Biology", topic: "Human Body Systems", unit: 5, unitTitle: "The Human Body Systems", pages: "201–250", keywords: ["nervous system", "endocrine system", "musculoskeletal", "reproductive system"] },
  { grade: 11, subject: "Biology", topic: "Population and Natural Resources", unit: 6, unitTitle: "Population and Natural Resources", pages: "251–294", keywords: ["population ecology", "carrying capacity", "natural resources", "biodiversity loss", "pollution"] },

  // ----- Grade 12 Biology (6 units, ~358 pages) -----
  { grade: 12, subject: "Biology", topic: "Application of Biology", unit: 1, unitTitle: "Application of Biology", pages: "1–50", keywords: ["biotechnology applications", "biology in daily life", "livelihood"] },
  { grade: 12, subject: "Biology", topic: "Microorganisms", unit: 2, unitTitle: "Microorganisms", pages: "51–110", keywords: ["bacteria", "viruses", "fungi", "protozoa", "microbial diseases", "industrial uses"] },
  { grade: 12, subject: "Biology", topic: "Energy Transformation", unit: 3, unitTitle: "Energy Transformation", pages: "111–180", keywords: ["photosynthesis", "cellular respiration", "fermentation", "Calvin cycle", "ATP"] },
  { grade: 12, subject: "Biology", topic: "Evolution", unit: 4, unitTitle: "Evolution", pages: "181–240", keywords: ["natural selection", "evidence of evolution", "theories of evolution", "human evolution"] },
  { grade: 12, subject: "Biology", topic: "Human Body Systems (Advanced)", unit: 5, unitTitle: "The Human Body Systems", pages: "241–300", keywords: ["homeostasis", "advanced organ systems", "coordination"] },
  { grade: 12, subject: "Biology", topic: "Climate Change", unit: 6, unitTitle: "Climate Change", pages: "301–358", keywords: ["causes of climate change", "effects", "mitigation", "adaptation", "Ethiopia context"] },

  // =========================================================
  // MATHEMATICS
  // =========================================================

  // ----- Grade 9 Mathematics (9 units, ~375 pages) -----
  { grade: 9, subject: "Mathematics", topic: "Further on Sets", unit: 1, unitTitle: "Further on Sets", pages: "1–35", keywords: ["set operations", "Venn diagrams", "set relations"] },
  { grade: 9, subject: "Mathematics", topic: "The Number System", unit: 2, unitTitle: "The Number System", pages: "36–80", keywords: ["rational numbers", "irrational numbers", "real numbers", "number line"] },
  { grade: 9, subject: "Mathematics", topic: "Solving Equations", unit: 3, unitTitle: "Solving Equations", pages: "81–120", keywords: ["linear equations", "quadratic equations", "systems of equations"] },
  { grade: 9, subject: "Mathematics", topic: "Solving Inequalities", unit: 4, unitTitle: "Solving Inequalities", pages: "121–155", keywords: ["linear inequalities", "absolute value inequalities", "quadratic inequalities"] },
  { grade: 9, subject: "Mathematics", topic: "Introduction to Trigonometry", unit: 5, unitTitle: "Introduction to Trigonometry", pages: "156–190", keywords: ["trigonometric ratios", "sine", "cosine", "tangent", "right triangles"] },
  { grade: 9, subject: "Mathematics", topic: "Regular Polygons", unit: 6, unitTitle: "Regular Polygons", pages: "191–225", keywords: ["interior angles", "exterior angles", "regular polygons"] },
  { grade: 9, subject: "Mathematics", topic: "Congruency and Similarity", unit: 7, unitTitle: "Congruency and Similarity", pages: "226–265", keywords: ["congruent triangles", "similar figures", "scale factor", "similarity theorems"] },
  { grade: 9, subject: "Mathematics", topic: "Vectors in Two Dimensions", unit: 8, unitTitle: "Vectors in Two Dimensions", pages: "266–310", keywords: ["vector addition", "magnitude", "direction", "component form"] },
  { grade: 9, subject: "Mathematics", topic: "Statistics and Probability", unit: 9, unitTitle: "Statistics and Probability", pages: "311–375", keywords: ["mean", "median", "mode", "probability", "data presentation", "frequency"] },

  // ----- Grade 10 Mathematics (7 units, ~394 pages) -----
  { grade: 10, subject: "Mathematics", topic: "Relations and Functions", unit: 1, unitTitle: "Relations and Functions", pages: "1–55", keywords: ["relations", "functions", "domain", "range", "mapping"] },
  { grade: 10, subject: "Mathematics", topic: "Polynomial Functions", unit: 2, unitTitle: "Polynomial Functions", pages: "56–110", keywords: ["polynomials", "zeros", "factor theorem", "graphing polynomials"] },
  { grade: 10, subject: "Mathematics", topic: "Exponential and Logarithmic Functions", unit: 3, unitTitle: "Exponential and Logarithmic Functions", pages: "111–165", keywords: ["exponents", "logarithms", "exponential growth", "log laws"] },
  { grade: 10, subject: "Mathematics", topic: "Trigonometric Functions", unit: 4, unitTitle: "Trigonometric Functions", pages: "166–220", keywords: ["radians", "trig identities", "trig equations", "unit circle"] },
  { grade: 10, subject: "Mathematics", topic: "Circles", unit: 5, unitTitle: "Circles", pages: "221–270", keywords: ["circle theorems", "chords", "tangents", "angles in circle"] },
  { grade: 10, subject: "Mathematics", topic: "Solid Figures", unit: 6, unitTitle: "Solid Figures", pages: "271–325", keywords: ["volume", "surface area", "prisms", "pyramids", "cylinders", "cones", "spheres"] },
  { grade: 10, subject: "Mathematics", topic: "Coordinate Geometry", unit: 7, unitTitle: "Coordinate Geometry", pages: "326–394", keywords: ["distance formula", "midpoint", "equation of a line", "parallel", "perpendicular"] },

  // ----- Grade 11 Mathematics (8 units, ~494 pages) -----
  { grade: 11, subject: "Mathematics", topic: "Relations and Functions", unit: 1, unitTitle: "Relations and Functions", pages: "1–60", keywords: ["relations", "functions", "inverse functions", "composition"] },
  { grade: 11, subject: "Mathematics", topic: "Rational Expressions and Rational Functions", unit: 2, unitTitle: "Rational Expressions and Rational Functions", pages: "61–120", keywords: ["rational expressions", "rational functions", "asymptotes", "graphing"] },
  { grade: 11, subject: "Mathematics", topic: "Matrices", unit: 3, unitTitle: "Matrices", pages: "121–180", keywords: ["matrix operations", "matrix multiplication", "inverse matrix", "systems of equations"] },
  { grade: 11, subject: "Mathematics", topic: "Determinants and their Properties", unit: 4, unitTitle: "Determinants and their Properties", pages: "181–230", keywords: ["determinants", "Cramer's rule", "minors", "cofactors"] },
  { grade: 11, subject: "Mathematics", topic: "Vectors", unit: 5, unitTitle: "Vectors", pages: "231–290", keywords: ["vector operations", "dot product", "cross product", "applications"] },
  { grade: 11, subject: "Mathematics", topic: "Transformations of the Plane", unit: 6, unitTitle: "Transformations of the Plane", pages: "291–350", keywords: ["translation", "reflection", "rotation", "dilation"] },
  { grade: 11, subject: "Mathematics", topic: "Statistics", unit: 7, unitTitle: "Statistics", pages: "351–420", keywords: ["measures of central tendency", "dispersion", "frequency distribution"] },
  { grade: 11, subject: "Mathematics", topic: "Probability", unit: 8, unitTitle: "Probability", pages: "421–494", keywords: ["probability rules", "conditional probability", "independent events"] },

  // ----- Grade 12 Mathematics (5 units, ~426 pages) -----
  { grade: 12, subject: "Mathematics", topic: "Sequence and Series", unit: 1, unitTitle: "Sequence and Series", pages: "1–80", keywords: ["arithmetic sequence", "geometric sequence", "sigma notation", "infinite series", "partial sums"] },
  { grade: 12, subject: "Mathematics", topic: "Introduction to Calculus", unit: 2, unitTitle: "Introduction to Calculus", pages: "81–180", keywords: ["derivatives", "differentiation", "integration", "rate of change", "area under curve"] },
  { grade: 12, subject: "Mathematics", topic: "Statistics", unit: 3, unitTitle: "Statistics", pages: "181–260", keywords: ["dispersion", "standard deviation", "sampling techniques", "frequency curves"] },
  { grade: 12, subject: "Mathematics", topic: "Introduction to Linear Programming", unit: 4, unitTitle: "Introduction to Linear Programming", pages: "261–330", keywords: ["linear inequalities", "graphical method", "optimization", "maximum minimum"] },
  { grade: 12, subject: "Mathematics", topic: "Mathematical Applications in Business", unit: 5, unitTitle: "Mathematical Applications in Business", pages: "331–426", keywords: ["time value of money", "interest", "saving", "investing", "taxation"] },

  // =========================================================
  // CHEMISTRY
  // =========================================================

  // ----- Grade 9 Chemistry (5 units, ~183 pages) -----
  { grade: 9, subject: "Chemistry", topic: "Chemistry and Its Importance", unit: 1, unitTitle: "Chemistry and Its Importance", pages: "1–30", keywords: ["scope of chemistry", "branches of chemistry", "chemistry in society"] },
  { grade: 9, subject: "Chemistry", topic: "Measurements and Scientific Methods", unit: 2, unitTitle: "Measurements and Scientific Methods", pages: "31–60", keywords: ["SI units", "scientific method", "accuracy", "precision", "significant figures"] },
  { grade: 9, subject: "Chemistry", topic: "Structure of the Atom", unit: 3, unitTitle: "Structure of the Atom", pages: "61–100", keywords: ["atomic theory", "subatomic particles", "isotopes", "atomic models"] },
  { grade: 9, subject: "Chemistry", topic: "Periodic Classification of Elements", unit: 4, unitTitle: "Periodic Classification of Elements", pages: "101–140", keywords: ["periodic table", "Mendeleev", "groups", "periods", "periodic trends"] },
  { grade: 9, subject: "Chemistry", topic: "Chemical Bonding", unit: 5, unitTitle: "Chemical Bonding", pages: "141–183", keywords: ["ionic bond", "covalent bond", "metallic bond", "Lewis structures"] },

  // ----- Grade 10 Chemistry (approx 6 units) -----
  { grade: 10, subject: "Chemistry", topic: "Chemical Reactions and Stoichiometry", unit: 1, unitTitle: "Chemical Reactions and Stoichiometry", pages: "1–50", keywords: ["balancing equations", "mole concept", "stoichiometry", "limiting reactant"] },
  { grade: 10, subject: "Chemistry", topic: "States of Matter and Kinetic Theory", unit: 2, unitTitle: "States of Matter", pages: "51–100", keywords: ["gas laws", "kinetic theory", "phase changes"] },
  { grade: 10, subject: "Chemistry", topic: "Solutions and Solubility", unit: 3, unitTitle: "Solutions", pages: "101–150", keywords: ["concentration", "solubility", "colligative properties"] },
  { grade: 10, subject: "Chemistry", topic: "Acids, Bases and Salts", unit: 4, unitTitle: "Acids, Bases and Salts", pages: "151–210", keywords: ["pH", "neutralization", "indicators", "titration"] },
  { grade: 10, subject: "Chemistry", topic: "Electrochemistry Basics", unit: 5, unitTitle: "Electrochemistry", pages: "211–260", keywords: ["redox", "oxidation", "reduction", "electrolysis"] },
  { grade: 10, subject: "Chemistry", topic: "Organic Chemistry Introduction", unit: 6, unitTitle: "Introduction to Organic Chemistry", pages: "261–306", keywords: ["hydrocarbons", "functional groups", "alkanes", "alkenes"] },

  // ----- Grade 11 Chemistry -----
  { grade: 11, subject: "Chemistry", topic: "Atomic Structure and Periodicity (Advanced)", unit: 1, unitTitle: "Atomic Structure and Periodicity", pages: "1–60", keywords: ["quantum numbers", "electron configuration", "periodic trends"] },
  { grade: 11, subject: "Chemistry", topic: "Chemical Bonding and Molecular Structure", unit: 2, unitTitle: "Chemical Bonding", pages: "61–120", keywords: ["VSEPR", "hybridization", "molecular geometry"] },
  { grade: 11, subject: "Chemistry", topic: "Thermochemistry", unit: 3, unitTitle: "Thermochemistry", pages: "121–180", keywords: ["enthalpy", "Hess's law", "calorimetry", "entropy"] },
  { grade: 11, subject: "Chemistry", topic: "Chemical Equilibrium", unit: 4, unitTitle: "Chemical Equilibrium", pages: "181–240", keywords: ["equilibrium constant", "Le Chatelier", "acid-base equilibrium"] },
  { grade: 11, subject: "Chemistry", topic: "Electrochemistry", unit: 5, unitTitle: "Electrochemistry", pages: "241–300", keywords: ["galvanic cells", "electrolytic cells", "Nernst equation"] },
  { grade: 11, subject: "Chemistry", topic: "Organic Chemistry", unit: 6, unitTitle: "Organic Chemistry", pages: "301–360", keywords: ["isomerism", "reaction mechanisms", "functional group reactions"] },

  // ----- Grade 12 Chemistry -----
  { grade: 12, subject: "Chemistry", topic: "Chemical Kinetics", unit: 1, unitTitle: "Chemical Kinetics", pages: "1–60", keywords: ["rate of reaction", "rate laws", "activation energy", "catalysts"] },
  { grade: 12, subject: "Chemistry", topic: "Chemical Equilibrium (Advanced)", unit: 2, unitTitle: "Chemical Equilibrium", pages: "61–120", keywords: ["Kp", "Kc", "solubility product", "common ion effect"] },
  { grade: 12, subject: "Chemistry", topic: "Acids and Bases (Advanced)", unit: 3, unitTitle: "Acids and Bases", pages: "121–180", keywords: ["strong/weak acids", "buffers", "titration curves", "pH calculations"] },
  { grade: 12, subject: "Chemistry", topic: "Electrochemistry (Advanced)", unit: 4, unitTitle: "Electrochemistry", pages: "181–240", keywords: ["standard electrode potential", "electrolysis applications", "corrosion"] },
  { grade: 12, subject: "Chemistry", topic: "Organic Chemistry (Advanced)", unit: 5, unitTitle: "Organic Chemistry", pages: "241–320", keywords: ["aromatic compounds", "polymers", "biomolecules", "organic synthesis"] },
  { grade: 12, subject: "Chemistry", topic: "Industrial Chemistry", unit: 6, unitTitle: "Industrial Chemistry", pages: "321–380", keywords: ["Haber process", "Contact process", "fertilizers", "Ethiopian industries"] },

  // =========================================================
  // PHYSICS
  // =========================================================

  // ----- Grade 9 Physics -----
  { grade: 9, subject: "Physics", topic: "Physical Quantities and Measurement", unit: 1, unitTitle: "Physical Quantities and Measurement", pages: "1–40", keywords: ["SI units", "precision", "accuracy", "vectors", "scalars"] },
  { grade: 9, subject: "Physics", topic: "Motion in One Dimension", unit: 2, unitTitle: "Motion in One Dimension", pages: "41–90", keywords: ["speed", "velocity", "acceleration", "equations of motion"] },
  { grade: 9, subject: "Physics", topic: "Forces and Newton's Laws", unit: 3, unitTitle: "Forces and Newton's Laws", pages: "91–140", keywords: ["Newton's laws", "friction", "free body diagrams"] },
  { grade: 9, subject: "Physics", topic: "Work, Energy and Power", unit: 4, unitTitle: "Work, Energy and Power", pages: "141–190", keywords: ["work", "kinetic energy", "potential energy", "power", "conservation of energy"] },
  { grade: 9, subject: "Physics", topic: "Thermal Physics", unit: 5, unitTitle: "Thermal Physics", pages: "191–240", keywords: ["temperature", "heat", "thermal expansion", "specific heat"] },
  { grade: 9, subject: "Physics", topic: "Waves and Sound", unit: 6, unitTitle: "Waves and Sound", pages: "241–290", keywords: ["wave properties", "sound waves", "echo", "Doppler effect"] },

  // ----- Grade 10 Physics -----
  { grade: 10, subject: "Physics", topic: "Motion in Two Dimensions", unit: 1, unitTitle: "Motion in Two Dimensions", pages: "1–50", keywords: ["projectile motion", "relative velocity"] },
  { grade: 10, subject: "Physics", topic: "Newton's Laws and Applications", unit: 2, unitTitle: "Newton's Laws and Applications", pages: "51–100", keywords: ["circular motion", "centripetal force", "momentum"] },
  { grade: 10, subject: "Physics", topic: "Gravitation", unit: 3, unitTitle: "Gravitation", pages: "101–140", keywords: ["Newton's law of gravitation", "satellites", "weightlessness"] },
  { grade: 10, subject: "Physics", topic: "Static Electricity", unit: 4, unitTitle: "Static Electricity", pages: "141–190", keywords: ["charge", "Coulomb's law", "electric field", "potential"] },
  { grade: 10, subject: "Physics", topic: "Current Electricity", unit: 5, unitTitle: "Current Electricity", pages: "191–240", keywords: ["Ohm's law", "resistance", "circuits", "Kirchhoff"] },
  { grade: 10, subject: "Physics", topic: "Magnetism", unit: 6, unitTitle: "Magnetism", pages: "241–290", keywords: ["magnetic field", "electromagnetism", "motors", "generators"] },

  // ----- Grade 11 Physics -----
  { grade: 11, subject: "Physics", topic: "Mechanics (Advanced)", unit: 1, unitTitle: "Mechanics", pages: "1–60", keywords: ["rotational motion", "torque", "angular momentum"] },
  { grade: 11, subject: "Physics", topic: "Fluid Mechanics", unit: 2, unitTitle: "Fluid Mechanics", pages: "61–110", keywords: ["pressure", "Bernoulli", "Archimedes", "viscosity"] },
  { grade: 11, subject: "Physics", topic: "Heat and Thermodynamics", unit: 3, unitTitle: "Heat and Thermodynamics", pages: "111–170", keywords: ["laws of thermodynamics", "heat engines", "entropy"] },
  { grade: 11, subject: "Physics", topic: "Oscillations and Waves", unit: 4, unitTitle: "Oscillations and Waves", pages: "171–220", keywords: ["SHM", "wave equation", "interference", "standing waves"] },
  { grade: 11, subject: "Physics", topic: "Electrostatics and Capacitance", unit: 5, unitTitle: "Electrostatics", pages: "221–270", keywords: ["Gauss's law", "capacitors", "dielectrics"] },
  { grade: 11, subject: "Physics", topic: "Current Electricity and Magnetism", unit: 6, unitTitle: "Current Electricity and Magnetism", pages: "271–320", keywords: ["magnetic force", "Ampere's law", "electromagnetic induction"] },
  { grade: 11, subject: "Physics", topic: "Electromagnetic Induction and AC", unit: 7, unitTitle: "Electromagnetic Induction", pages: "321–370", keywords: ["Faraday's law", "Lenz's law", "transformers", "AC circuits"] },

  // ----- Grade 12 Physics -----
  { grade: 12, subject: "Physics", topic: "Electromagnetic Waves and Optics", unit: 1, unitTitle: "Electromagnetic Waves and Optics", pages: "1–70", keywords: ["EM spectrum", "reflection", "refraction", "lenses", "interference", "diffraction"] },
  { grade: 12, subject: "Physics", topic: "Dual Nature of Matter and Radiation", unit: 2, unitTitle: "Dual Nature of Matter", pages: "71–120", keywords: ["photoelectric effect", "de Broglie", "wave-particle duality"] },
  { grade: 12, subject: "Physics", topic: "Atoms and Nuclei", unit: 3, unitTitle: "Atoms and Nuclei", pages: "121–180", keywords: ["Bohr model", "radioactivity", "nuclear reactions", "fission", "fusion"] },
  { grade: 12, subject: "Physics", topic: "Electronic Devices", unit: 4, unitTitle: "Electronic Devices", pages: "181–230", keywords: ["semiconductors", "diodes", "transistors", "logic gates"] },
  { grade: 12, subject: "Physics", topic: "Communication Systems", unit: 5, unitTitle: "Communication Systems", pages: "231–280", keywords: ["modulation", "radio", "TV", "satellite communication"] },
  { grade: 12, subject: "Physics", topic: "Modern Physics Applications", unit: 6, unitTitle: "Modern Physics Applications", pages: "281–330", keywords: ["lasers", "X-rays", "medical physics", "Ethiopia applications"] },

  // =========================================================
  // GEOGRAPHY
  // =========================================================

  // Grade 9
  { grade: 9, subject: "Geography", topic: "Geological History and Topography of Ethiopia", unit: 1, unitTitle: "Geological History And Topography Of Ethiopia", pages: "1–35", keywords: ["geology", "topography", "rift valley", "highlands"] },
  { grade: 9, subject: "Geography", topic: "Climate of Ethiopia", unit: 2, unitTitle: "Climate Of Ethiopia", pages: "36–70", keywords: ["climate zones", "rainfall", "temperature", "seasons"] },
  { grade: 9, subject: "Geography", topic: "Natural Resource Base of Ethiopia", unit: 3, unitTitle: "Natural Resource Base Of Ethiopia", pages: "71–105", keywords: ["soil", "water", "minerals", "forests", "wildlife"] },
  { grade: 9, subject: "Geography", topic: "Population and Demographic Characteristics", unit: 4, unitTitle: "Population And Demographic Characteristics Of Ethiopia", pages: "106–140", keywords: ["population distribution", "growth", "density", "migration"] },
  { grade: 9, subject: "Geography", topic: "Major Economic and Cultural Activities", unit: 5, unitTitle: "Major Economic And Cultural Activities In Ethiopia", pages: "141–175", keywords: ["agriculture", "industry", "trade", "culture"] },
  { grade: 9, subject: "Geography", topic: "Human–Natural Environment Interactions", unit: 6, unitTitle: "Human – Natural Environment Interactions In Ethiopia", pages: "176–200", keywords: ["environmental degradation", "conservation", "sustainability"] },
  { grade: 9, subject: "Geography", topic: "Contemporary Geographic Issues", unit: 7, unitTitle: "Contemporary Geographic Issues And Public Concerns In Ethiopia", pages: "201–220", keywords: ["urbanization", "climate change", "food security"] },
  { grade: 9, subject: "Geography", topic: "Geographic Inquiry Skills", unit: 8, unitTitle: "Geographic Inquiry Skills And Techniques", pages: "221–237", keywords: ["maps", "GIS", "fieldwork", "data analysis"] },

  // =========================================================
  // HISTORY
  // =========================================================

  // Grade 9
  { grade: 9, subject: "History", topic: "The Discipline of History and Human Evolution", unit: 1, unitTitle: "The Discipline of History and Human Evolution", pages: "1–30", keywords: ["historiography", "human evolution", "prehistory"] },
  { grade: 9, subject: "History", topic: "Ancient World Civilizations", unit: 2, unitTitle: "Ancient World Civilizations up to c. 500 AD", pages: "31–60", keywords: ["Egypt", "Mesopotamia", "Greece", "Rome", "China"] },
  { grade: 9, subject: "History", topic: "Peoples and States in Ethiopia and the Horn", unit: 3, unitTitle: "Peoples and States in Ethiopia and the Horn to the End of 13th Century", pages: "61–95", keywords: ["Aksum", "Zagwe", "medieval Ethiopia"] },
  { grade: 9, subject: "History", topic: "The Middle Ages and Early Modern World", unit: 4, unitTitle: "The Middle Ages and Early Modern World, C. 500 to 1750s", pages: "96–125", keywords: ["feudalism", "Renaissance", "Reformation"] },
  { grade: 9, subject: "History", topic: "Peoples and States of Africa to 1500", unit: 5, unitTitle: "Peoples and States of Africa to 1500", pages: "126–150", keywords: ["West African kingdoms", "Swahili coast", "Great Zimbabwe"] },
  { grade: 9, subject: "History", topic: "Africa and the Outside World 1500-1880s", unit: 6, unitTitle: "Africa and the Outside World 1500-1880s", pages: "151–175", keywords: ["slave trade", "European exploration", "early colonialism"] },
  { grade: 9, subject: "History", topic: "States and Population Movements in Ethiopia", unit: 7, unitTitle: "States, Principalities, Population Movements & Interactions in Ethiopia 13th to Mid-16th C.", pages: "176–195", keywords: ["Solomonic dynasty", "Oromo expansion"] },
  { grade: 9, subject: "History", topic: "Political, Social and Economic Processes in Ethiopia", unit: 8, unitTitle: "Political, Social, and Economic Processes in Ethiopia Mid-16th to Mid-19th C.", pages: "196–210", keywords: ["Gondarine period", "Zemene Mesafint"] },
  { grade: 9, subject: "History", topic: "The Age of Revolutions", unit: 9, unitTitle: "The Age of Revolutions 1750s to 1815", pages: "211–219", keywords: ["American Revolution", "French Revolution", "Industrial Revolution"] },

  // =========================================================
  // ECONOMICS
  // =========================================================

  // Grade 9
  { grade: 9, subject: "Economics", topic: "Introducing Economics", unit: 1, unitTitle: "Introducing Economics", pages: "1–15", keywords: ["definition of economics", "scarcity", "choice"] },
  { grade: 9, subject: "Economics", topic: "Basic Economic Problems and Systems", unit: 2, unitTitle: "The Basic Economic Problems and Economic Systems", pages: "16–30", keywords: ["what, how, for whom", "market system", "command system"] },
  { grade: 9, subject: "Economics", topic: "Economic Resources and Markets", unit: 3, unitTitle: "Economic Resources and Markets", pages: "31–45", keywords: ["factors of production", "market", "price mechanism"] },
  { grade: 9, subject: "Economics", topic: "Demand and Supply", unit: 4, unitTitle: "Introduction to Demand and Supply", pages: "46–65", keywords: ["demand curve", "supply curve", "equilibrium", "elasticity"] },
  { grade: 9, subject: "Economics", topic: "Production and Cost", unit: 5, unitTitle: "Introduction to Production and Cost", pages: "66–80", keywords: ["production function", "costs", "profit"] },
  { grade: 9, subject: "Economics", topic: "Money", unit: 6, unitTitle: "Introduction to Money", pages: "81–95", keywords: ["functions of money", "banking", "money supply"] },
  { grade: 9, subject: "Economics", topic: "Macroeconomics Introduction", unit: 7, unitTitle: "Introduction to Macroeconomics", pages: "96–110", keywords: ["GDP", "inflation", "unemployment"] },
  { grade: 9, subject: "Economics", topic: "Basic Entrepreneurship", unit: 8, unitTitle: "Basic Entrepreneurship", pages: "111–119", keywords: ["entrepreneur", "business plan", "startup"] },

  // =========================================================
  // CITIZENSHIP EDUCATION
  // =========================================================

  // Grade 9
  { grade: 9, subject: "Citizenship", topic: "Ethical Values", unit: 1, unitTitle: "ETHICAL VALUES", pages: "1–25", keywords: ["ethics", "values", "morality"] },
  { grade: 9, subject: "Citizenship", topic: "Culture of Using Digital Technology", unit: 2, unitTitle: "THE CULTURE OF USING DIGITAL TECHNOLOGY", pages: "26–45", keywords: ["digital citizenship", "internet safety", "cyber ethics"] },
  { grade: 9, subject: "Citizenship", topic: "Constitution and Constitutionalism", unit: 3, unitTitle: "Constitution and Constitutionalism", pages: "46–70", keywords: ["constitution", "rule of law", "rights"] },
  { grade: 9, subject: "Citizenship", topic: "Indigenous Knowledge", unit: 4, unitTitle: "UNDERSTANDING INDIGENOUS KNOWLEDGE", pages: "71–90", keywords: ["indigenous knowledge", "local wisdom", "cultural heritage"] },
  { grade: 9, subject: "Citizenship", topic: "Multiculturalism in Ethiopia", unit: 5, unitTitle: "MULTICULTURALISM IN ETHIOPIA", pages: "91–110", keywords: ["diversity", "multiculturalism", "tolerance"] },
  { grade: 9, subject: "Citizenship", topic: "National Unity through Diversity", unit: 6, unitTitle: "NATIONAL UNITY THROUGH DIVERSITY", pages: "111–130", keywords: ["unity", "federalism", "nation building"] },
  { grade: 9, subject: "Citizenship", topic: "Problem-Solving Skills", unit: 7, unitTitle: "PROBLEM-SOLVING SKILLS", pages: "131–150", keywords: ["critical thinking", "decision making", "conflict resolution"] },
  { grade: 9, subject: "Citizenship", topic: "Ethiopia’s Foreign Relations", unit: 8, unitTitle: "ETHIOPIA’S FOREIGN RELATIONS IN EAST AFRICA", pages: "151–173", keywords: ["foreign policy", "diplomacy", "regional cooperation"] },

  // =========================================================
  // INFORMATION TECHNOLOGY
  // =========================================================

  // Grade 9
  { grade: 9, subject: "IT", topic: "Organization of Files", unit: 1, unitTitle: "Organization Of Files", pages: "1–40", keywords: ["files", "folders", "file management", "drives"] },
  { grade: 9, subject: "IT", topic: "Computer Network", unit: 2, unitTitle: "Computer Network", pages: "41–80", keywords: ["network types", "LAN", "WAN", "internet"] },
  { grade: 9, subject: "IT", topic: "Application Software", unit: 3, unitTitle: "Application Software", pages: "81–130", keywords: ["word processing", "spreadsheet", "presentation"] },
  { grade: 9, subject: "IT", topic: "Image Processing and Multimedia", unit: 4, unitTitle: "Image Processing And Multimedia", pages: "131–180", keywords: ["image editing", "multimedia", "graphics"] },
  { grade: 9, subject: "IT", topic: "Information and Computer Security", unit: 5, unitTitle: "Information And Computer Security", pages: "181–210", keywords: ["cybersecurity", "passwords", "malware", "privacy"] },
  { grade: 9, subject: "IT", topic: "Fundamentals of Programming", unit: 6, unitTitle: "Fundamentals Of Programming", pages: "211–251", keywords: ["programming basics", "algorithms", "pseudocode", "coding"] },

];

// =========================================================
// HELPER FUNCTIONS
// =========================================================

function getTopicsByGrade(grade) {
  return TOPICS.filter(t => t.grade === Number(grade));
}

function getTopicsBySubject(subject) {
  return TOPICS.filter(t => t.subject.toLowerCase() === subject.toLowerCase());
}

function getTopicsByGradeSubject(grade, subject) {
  return TOPICS.filter(t => 
    t.grade === Number(grade) && 
    t.subject.toLowerCase() === subject.toLowerCase()
  );
}

function searchTopics(query) {
  if (!query || !query.trim()) return TOPICS;
  const q = query.toLowerCase().trim();
  return TOPICS.filter(t =>
    t.topic.toLowerCase().includes(q) ||
    t.unitTitle.toLowerCase().includes(q) ||
    t.subject.toLowerCase().includes(q) ||
    (t.keywords && t.keywords.some(k => k.toLowerCase().includes(q)))
  );
}

function getAllSubjects() {
  return [...new Set(TOPICS.map(t => t.subject))].sort();
}

function getAllGrades() {
  return [...new Set(TOPICS.map(t => t.grade))].sort((a, b) => a - b);
}

// Export for use in modules or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TOPICS, getTopicsByGrade, getTopicsBySubject, getTopicsByGradeSubject, searchTopics, getAllSubjects, getAllGrades };
}