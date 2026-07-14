import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with 14 experiments...');

  // Clean existing data (order matters for FK constraints)
  await prisma.vivaQuestion.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.graphResult.deleteMany({});
  await prisma.observationRow.deleteMany({});
  await prisma.experimentRun.deleteMany({});
  await prisma.subjectExperiment.deleteMany({});

  // =====================================================
  // PHYSICS EXPERIMENTS (7)
  // =====================================================

  // 1. Simple Pendulum — plots T² vs L
  const simplePendulum = await prisma.subjectExperiment.create({
    data: {
      subject: 'Physics',
      name: 'Simple Pendulum',
      aim: 'To study the relationship between the length of a simple pendulum and its time period, and to verify that T² is directly proportional to L.',
      formula: 'T = 2π√(L/g)',
      procedure: '1. Set up the pendulum with a known length L.\n2. Displace the bob through a small angle and release.\n3. Measure the time for 20 complete oscillations and calculate the time period T.\n4. Repeat for different lengths (30, 40, 50, 60, 70, 80 cm).\n5. Plot T² (Y-axis) vs L (X-axis) — a straight line through the origin verifies the relationship.',
      precautions: 'Keep amplitude small (< 10°). Count oscillations from the mean position. Avoid air drafts.',
      applications: 'Determination of acceleration due to gravity (g). Used in clock mechanisms and seismometers.',
      rawColumns: '["Length (L)", "Time Period (T)"]',
      rawUnits: '["cm", "s"]',
      xTransform: 'none',
      yTransform: 'square',
      xAxisLabel: 'Length L (cm)',
      yAxisLabel: 'T² (s²)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: simplePendulum.id, category: 'basic', question: 'What is a simple pendulum?', answer: 'A simple pendulum consists of a point mass (bob) suspended from a fixed support by a light, inextensible string, free to oscillate in a vertical plane.' },
      { experimentId: simplePendulum.id, category: 'conceptual', question: 'Why do we plot T² vs L instead of T vs L?', answer: 'Since T = 2π√(L/g), squaring both sides gives T² = (4π²/g)L, which is a linear equation. Plotting T² vs L gives a straight line whose slope equals 4π²/g, allowing direct calculation of g.' },
      { experimentId: simplePendulum.id, category: 'formula', question: 'How do you calculate g from the graph?', answer: 'g = 4π² / slope, where slope = T²/L from the best-fit line.' },
      { experimentId: simplePendulum.id, category: 'tricky', question: 'Does the time period depend on the mass of the bob?', answer: 'No. For a simple pendulum with small oscillations, the time period is independent of the mass of the bob. It depends only on the length and the acceleration due to gravity.' },
    ]
  });

  // 2. Young's Modulus — plots Extension (ΔL) vs Load (Force)
  const youngsModulus = await prisma.subjectExperiment.create({
    data: {
      subject: 'Physics',
      name: "Young's Modulus",
      aim: "To determine Young's Modulus of elasticity of a given wire by Searle's method.",
      formula: 'Y = (F × L₀) / (A × ΔL)',
      procedure: "1. Measure the original length L₀ and diameter of the wire.\n2. Apply increasing loads in steps (0.5 kg each).\n3. Measure the extension ΔL for each load using the micrometer.\n4. Plot Extension ΔL (Y-axis) vs Load/Force (X-axis).\n5. Calculate Young's Modulus from the slope.",
      precautions: 'Do not exceed the elastic limit. Take readings while both loading and unloading.',
      applications: "Structural engineering, material selection for bridges and buildings, understanding material elasticity.",
      rawColumns: '["Load (Force)", "Extension (ΔL)"]',
      rawUnits: '["N", "mm"]',
      xTransform: 'none',
      yTransform: 'none',
      xAxisLabel: 'Load / Force (N)',
      yAxisLabel: 'Extension ΔL (mm)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: youngsModulus.id, category: 'basic', question: "What is Young's Modulus?", answer: "Young's Modulus (Y) is the ratio of longitudinal stress to longitudinal strain within the elastic limit of a material. It measures the stiffness of a solid material." },
      { experimentId: youngsModulus.id, category: 'conceptual', question: 'Why must we not exceed the elastic limit?', answer: 'Beyond the elastic limit, the material undergoes permanent (plastic) deformation and Hooke\'s Law no longer holds. The wire would not return to its original length.' },
      { experimentId: youngsModulus.id, category: 'formula', question: "Write the formula for Young's Modulus.", answer: "Y = (F × L₀) / (A × ΔL), where F = applied force, L₀ = original length, A = cross-sectional area, ΔL = extension." },
      { experimentId: youngsModulus.id, category: 'tricky', question: 'Why do we use a thin, long wire?', answer: 'A longer wire produces a larger, more easily measurable extension for the same stress. A thinner wire has a smaller cross-sectional area, producing greater strain for a given force.' },
    ]
  });

  // 3. Hooke's Law (Spring) — plots Force vs Extension
  const hookesLaw = await prisma.subjectExperiment.create({
    data: {
      subject: 'Physics',
      name: "Hooke's Law (Spring)",
      aim: "To verify Hooke's Law for a helical spring and determine the spring constant.",
      formula: 'F = kx',
      procedure: "1. Hang the spring vertically and note the natural length.\n2. Add known masses in steps and measure the extension x for each.\n3. Record the applied force F = mg for each mass.\n4. Plot Force F (Y-axis) vs Extension x (X-axis).\n5. The slope of the straight line gives the spring constant k.",
      precautions: "Do not exceed the elastic limit of the spring. Ensure the spring hangs freely without touching anything.",
      applications: "Spring balances, vehicle suspension systems, mechanical watches, seismometers.",
      rawColumns: '["Extension", "Force"]',
      rawUnits: '["cm", "N"]',
      xTransform: 'none',
      yTransform: 'none',
      xAxisLabel: 'Extension (cm)',
      yAxisLabel: 'Force (N)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: hookesLaw.id, category: 'basic', question: "State Hooke's Law.", answer: "Hooke's Law states that the extension of an elastic body is directly proportional to the applied force, provided the elastic limit is not exceeded: F = kx." },
      { experimentId: hookesLaw.id, category: 'conceptual', question: 'What happens beyond the elastic limit?', answer: "Beyond the elastic limit, the spring undergoes permanent deformation. The linear relationship between force and extension no longer holds, and the spring won't return to its original length." },
      { experimentId: hookesLaw.id, category: 'formula', question: 'What is the spring constant and its SI unit?', answer: 'The spring constant k is the force per unit extension (k = F/x). Its SI unit is Newton per meter (N/m).' },
      { experimentId: hookesLaw.id, category: 'tricky', question: 'Does the spring constant depend on the number of coils?', answer: 'Yes. For a given wire material and coil diameter, more coils mean a lower spring constant (softer spring), because each coil contributes to the total extension.' },
    ]
  });

  // 4. Cooling of Water — plots Temperature vs Time
  const coolingWater = await prisma.subjectExperiment.create({
    data: {
      subject: 'Physics',
      name: 'Cooling of Water',
      aim: "To study the cooling of water and verify Newton's Law of Cooling by plotting a cooling curve (Temperature vs Time).",
      formula: 'dT/dt = -k(T - T₀)',
      procedure: "1. Heat water to about 80°C in a calorimeter.\n2. Record the temperature every minute as it cools.\n3. Continue recording until the temperature drops to near room temperature.\n4. Plot Temperature (Y-axis) vs Time (X-axis).\n5. The curve should be an exponential decay, verifying Newton's Law of Cooling.",
      precautions: "Stir the water gently before each reading. Shield the calorimeter from air drafts. Note room temperature.",
      applications: "Forensic science (time of death estimation), food industry cooling processes, HVAC system design.",
      rawColumns: '["Time", "Temperature"]',
      rawUnits: '["min", "°C"]',
      xTransform: 'none',
      yTransform: 'none',
      xAxisLabel: 'Time (min)',
      yAxisLabel: 'Temperature (°C)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: coolingWater.id, category: 'basic', question: "State Newton's Law of Cooling.", answer: "Newton's Law of Cooling states that the rate of heat loss of a body is directly proportional to the difference in temperature between the body and its surroundings, provided the difference is small." },
      { experimentId: coolingWater.id, category: 'conceptual', question: 'Why is the cooling curve not a straight line?', answer: 'As the temperature difference between the water and surroundings decreases, the rate of cooling slows down. This results in an exponential decay curve rather than a linear one.' },
      { experimentId: coolingWater.id, category: 'formula', question: 'Write the differential equation for Newton\'s Law of Cooling.', answer: 'dT/dt = -k(T - T₀), where T is the body temperature, T₀ is the ambient temperature, and k is the cooling constant.' },
      { experimentId: coolingWater.id, category: 'tricky', question: "Does Newton's Law of Cooling work for very high temperatures?", answer: "No. Newton's Law of Cooling is a good approximation only when the temperature difference is relatively small. For very high temperatures, radiative heat loss (Stefan's Law) becomes dominant." },
    ]
  });

  // 5. Newton's Rings — plots D² vs Ring Number (n)
  const newtonsRings = await prisma.subjectExperiment.create({
    data: {
      subject: 'Physics',
      name: "Newton's Rings",
      aim: "To determine the wavelength of monochromatic light using Newton's Rings apparatus.",
      formula: 'D²ₙ = 4nRλ',
      procedure: "1. Set up the Newton's Rings apparatus with a plano-convex lens on an optical flat.\n2. Illuminate with monochromatic sodium light.\n3. Measure the diameter D of the nth dark ring using a travelling microscope.\n4. Record diameters for ring numbers n = 2, 4, 6, 8, 10, ...\n5. Plot D² (Y-axis) vs Ring Number n (X-axis).\n6. The slope gives 4Rλ, from which wavelength λ can be calculated.",
      precautions: "Clean all optical surfaces thoroughly. Ensure the lens makes gentle contact with the glass plate. Measure diameters across the center of the pattern.",
      applications: "Testing optical flatness of surfaces, measuring wavelength of light, quality control in lens manufacturing.",
      rawColumns: '["Ring Number (n)", "Diameter (D)"]',
      rawUnits: '["", "cm"]',
      xTransform: 'none',
      yTransform: 'square',
      xAxisLabel: 'Ring Number (n)',
      yAxisLabel: 'D² (cm²)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: newtonsRings.id, category: 'basic', question: "What are Newton's Rings?", answer: "Newton's Rings are a series of concentric bright and dark circular fringes formed by the interference of light reflected from the two surfaces of an air film between a plano-convex lens and a flat glass plate." },
      { experimentId: newtonsRings.id, category: 'conceptual', question: 'Why is the center of the pattern dark?', answer: 'At the center, the air film thickness is zero. The light reflected from the denser medium (glass plate) undergoes a phase change of π, causing destructive interference, making the center dark.' },
      { experimentId: newtonsRings.id, category: 'formula', question: 'How is wavelength calculated from the graph?', answer: 'slope = D²/n = 4Rλ, so λ = slope / (4R), where R is the radius of curvature of the plano-convex lens.' },
      { experimentId: newtonsRings.id, category: 'tricky', question: 'Why do we use D²ₘ - D²ₙ instead of individual D² values?', answer: 'Using the difference D²ₘ - D²ₙ eliminates the error due to the exact contact point being uncertain, and also accounts for any deformation at the contact point.' },
    ]
  });

  // 6. Planck's Constant (LED/Photoelectric) — plots Stopping Voltage (Vₛ) vs Frequency (ν)
  const plancksConstant = await prisma.subjectExperiment.create({
    data: {
      subject: 'Physics',
      name: "Planck's Constant (LED)",
      aim: "To determine Planck's constant by studying the photoelectric effect using LEDs of different colours.",
      formula: 'eVₛ = hν - φ',
      procedure: "1. Connect LEDs of different colours (red, yellow, green, blue, violet) one at a time.\n2. Gradually increase the voltage until the LED just begins to glow.\n3. Record the threshold voltage Vₛ (knee voltage) for each LED.\n4. Calculate the frequency ν from the known wavelength of each LED.\n5. Plot Stopping Voltage Vₛ (Y-axis) vs Frequency ν (X-axis).\n6. The slope gives h/e, from which Planck's constant h is determined.",
      precautions: "Use a dark room to clearly identify the glow threshold. Use a sensitive voltmeter. Handle LEDs carefully to avoid damage.",
      applications: "Foundation of quantum mechanics, solar cell design, spectroscopy, LED technology.",
      rawColumns: '["Frequency (ν)", "Stopping Voltage (Vₛ)"]',
      rawUnits: '["×10¹⁴ Hz", "V"]',
      xTransform: 'none',
      yTransform: 'none',
      xAxisLabel: 'Frequency ν (×10¹⁴ Hz)',
      yAxisLabel: 'Stopping Voltage Vₛ (V)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: plancksConstant.id, category: 'basic', question: 'What is the photoelectric effect?', answer: 'The photoelectric effect is the emission of electrons from a metal surface when light of sufficient frequency (above the threshold frequency) falls on it.' },
      { experimentId: plancksConstant.id, category: 'conceptual', question: 'Why does blue light cause emission but red light does not (for some metals)?', answer: 'Blue light has a higher frequency (and thus higher photon energy) than red light. If the photon energy (hν) exceeds the work function (φ) of the metal, electrons are emitted. Red light photons may not have enough energy.' },
      { experimentId: plancksConstant.id, category: 'formula', question: 'How is Planck\'s constant calculated from the graph?', answer: 'The slope of the Vₛ vs ν graph equals h/e. So h = slope × e, where e = 1.6 × 10⁻¹⁹ C.' },
      { experimentId: plancksConstant.id, category: 'tricky', question: 'What does the Y-intercept of the Vₛ vs ν graph represent?', answer: 'The Y-intercept equals -φ/e, where φ is the work function of the photocathode material. It represents the minimum energy needed to free an electron from the surface.' },
    ]
  });

  // 7. Stefan's Law — plots log(P) vs log(T)
  const stefansLaw = await prisma.subjectExperiment.create({
    data: {
      subject: 'Physics',
      name: "Stefan's Law",
      aim: "To verify Stefan's Law of radiation by plotting log(P) vs log(T) and confirming the slope is approximately 4.",
      formula: 'P = σAT⁴',
      procedure: "1. Heat a blackbody radiator (tungsten filament lamp) to different temperatures.\n2. Measure the electrical power P = VI at each temperature setting.\n3. Determine the filament temperature T from resistance-temperature calibration.\n4. Calculate log₁₀(P) and log₁₀(T) for each reading.\n5. Plot log(P) (Y-axis) vs log(T) (X-axis).\n6. A straight line with slope ≈ 4 verifies Stefan's Law.",
      precautions: "Allow the filament to reach thermal equilibrium before taking readings. Use a dimly lit room. Ensure electrical connections are secure.",
      applications: "Astrophysics (stellar luminosity), thermal imaging, climate science, furnace design.",
      rawColumns: '["Temperature (T)", "Power (P)"]',
      rawUnits: '["K", "W"]',
      xTransform: 'log',
      yTransform: 'log',
      xAxisLabel: 'log₁₀(T)',
      yAxisLabel: 'log₁₀(P)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: stefansLaw.id, category: 'basic', question: "State Stefan's Law.", answer: "Stefan's Law states that the total radiant heat energy emitted per unit time from the surface of a black body is proportional to the fourth power of its absolute temperature: P = σAT⁴." },
      { experimentId: stefansLaw.id, category: 'conceptual', question: 'Why do we plot log(P) vs log(T)?', answer: 'Taking logarithms of P = σAT⁴ gives log(P) = log(σA) + 4·log(T). This is a linear equation with slope 4, making it easy to verify the T⁴ dependence graphically.' },
      { experimentId: stefansLaw.id, category: 'formula', question: "What is the value of Stefan-Boltzmann constant?", answer: "σ = 5.67 × 10⁻⁸ W·m⁻²·K⁻⁴" },
      { experimentId: stefansLaw.id, category: 'tricky', question: 'Does Stefan\'s Law apply to non-black bodies?', answer: "For non-black (grey) bodies, the law is modified as P = εσAT⁴, where ε is the emissivity (0 < ε < 1). A perfect black body has ε = 1." },
    ]
  });

  // =====================================================
  // ELECTRICAL EXPERIMENTS (3)
  // =====================================================

  // 8. Ohm's Law — plots Voltage (V) vs Current (I)
  const ohmsLaw = await prisma.subjectExperiment.create({
    data: {
      subject: 'Electrical',
      name: "Ohm's Law",
      aim: "To verify Ohm's Law by studying the relationship between Potential Difference (Voltage) across a conductor and the Current flowing through it, and to calculate the unknown resistance.",
      formula: 'V = IR',
      procedure: "1. Connect the resistor, ammeter, voltmeter, and power supply as shown in the circuit diagram.\n2. Turn on the power supply and set the voltage to 1V.\n3. Record the current reading from the ammeter.\n4. Repeat for different voltages (2V, 3V, 4V, 5V).\n5. Plot a graph of Voltage (X-axis) vs Current (Y-axis) and find the slope to compute resistance.",
      precautions: "Ensure connections are tight. Do not leave current flowing for long periods as heating can change resistance.",
      applications: "Design of electronic components, circuit analysis, and selecting correct resistor sizes.",
      rawColumns: '["Voltage", "Current"]',
      rawUnits: '["V", "mA"]',
      xTransform: 'none',
      yTransform: 'none',
      xAxisLabel: 'Voltage (V)',
      yAxisLabel: 'Current (mA)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: ohmsLaw.id, category: 'basic', question: "State Ohm's Law.", answer: "Ohm's Law states that the current flowing through a conductor is directly proportional to the potential difference across its ends, provided physical conditions like temperature remain constant." },
      { experimentId: ohmsLaw.id, category: 'conceptual', question: 'Why does the temperature of the conductor need to remain constant?', answer: 'As temperature increases, the thermal vibrations of metal ions increase, which increases collision rates for flowing electrons, thereby increasing the electrical resistance.' },
      { experimentId: ohmsLaw.id, category: 'formula', question: 'What is the SI unit of resistance, and how is it defined?', answer: 'The SI unit is the Ohm (Ω). One Ohm is defined as the resistance of a conductor when a potential difference of 1 Volt produces a current of 1 Ampere.' },
      { experimentId: ohmsLaw.id, category: 'tricky', question: "Does Ohm's Law apply to semiconductor diodes or vacuum tubes?", answer: "No. Ohm's Law only applies to ohmic conductors (like metals). Non-ohmic devices like diodes, transistors, and vacuum tubes have a non-linear relationship between voltage and current." },
    ]
  });

  // 9. Meter Bridge — plots Resistance vs Balance Length
  const meterBridge = await prisma.subjectExperiment.create({
    data: {
      subject: 'Electrical',
      name: 'Meter Bridge',
      aim: 'To determine the unknown resistance of a wire using a Meter Bridge (Wheatstone Bridge principle).',
      formula: 'R/S = l/(100-l)',
      procedure: "1. Connect the known resistance R in one gap and unknown resistance S in the other.\n2. Slide the jockey along the bridge wire to find the balance point.\n3. Record the balance length l.\n4. Repeat with different known resistances.\n5. Plot Resistance R (Y-axis) vs Balance Length l (X-axis).",
      precautions: "Ensure all connections are clean and tight. Do not press the jockey too hard on the wire. Take readings at multiple balance points.",
      applications: "Measurement of unknown resistances, calibration of resistance standards, laboratory training in bridge circuits.",
      rawColumns: '["Balance Length", "Resistance"]',
      rawUnits: '["cm", "Ω"]',
      xTransform: 'none',
      yTransform: 'none',
      xAxisLabel: 'Balance Length (cm)',
      yAxisLabel: 'Resistance (Ω)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: meterBridge.id, category: 'basic', question: 'What is the principle of the Meter Bridge?', answer: 'The Meter Bridge works on the principle of the Wheatstone Bridge. At the balance point, the ratio of resistances in the two arms equals the ratio of the corresponding lengths of the bridge wire.' },
      { experimentId: meterBridge.id, category: 'conceptual', question: 'Why should the balance point be near the middle of the wire?', answer: 'Sensitivity of the bridge is maximum when the balance point is near the center. Near the ends, a small change in length corresponds to a large change in resistance ratio, increasing measurement error.' },
      { experimentId: meterBridge.id, category: 'formula', question: 'Derive the formula for unknown resistance.', answer: 'At balance: R/S = l/(100-l), so S = R(100-l)/l, where R is the known resistance and l is the balance length from the R side.' },
      { experimentId: meterBridge.id, category: 'tricky', question: 'What are end corrections in a Meter Bridge?', answer: 'End corrections account for the additional resistance at the ends of the bridge wire where it connects to the thick copper strips. They shift the effective zero and can cause systematic errors if not accounted for.' },
    ]
  });

  // 10. Potentiometer (EMF) — plots Potential Difference vs Length
  const potentiometer = await prisma.subjectExperiment.create({
    data: {
      subject: 'Electrical',
      name: 'Potentiometer (EMF)',
      aim: 'To compare the EMFs of two cells and determine the internal resistance of a cell using a potentiometer.',
      formula: 'E₁/E₂ = l₁/l₂',
      procedure: "1. Set up the potentiometer with a driver cell and the cell to be measured.\n2. Find the balance length l₁ for cell E₁ and l₂ for cell E₂.\n3. Record balance lengths for multiple trials.\n4. Plot Potential Difference (Y-axis) vs Length (X-axis).\n5. The slope gives the potential gradient.",
      precautions: "Ensure the driver cell EMF is greater than the cell being measured. The potentiometer wire should be uniform.",
      applications: "Accurate EMF measurement without drawing current, calibration of voltmeters, comparing cell EMFs.",
      rawColumns: '["Length", "Potential Difference"]',
      rawUnits: '["cm", "V"]',
      xTransform: 'none',
      yTransform: 'none',
      xAxisLabel: 'Length (cm)',
      yAxisLabel: 'Potential Difference (V)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: potentiometer.id, category: 'basic', question: 'What is the principle of a potentiometer?', answer: 'A potentiometer works on the principle that the potential drop across a uniform wire is proportional to its length when a constant current flows through it.' },
      { experimentId: potentiometer.id, category: 'conceptual', question: 'Why is a potentiometer preferred over a voltmeter for measuring EMF?', answer: 'A potentiometer draws no current from the cell at the balance point, so it measures the true EMF. A voltmeter always draws some current, so it measures terminal voltage (which is less than EMF due to internal resistance).' },
      { experimentId: potentiometer.id, category: 'formula', question: 'How do you calculate internal resistance using a potentiometer?', answer: 'r = R(l₁ - l₂)/l₂, where R is the external resistance, l₁ is the balance length with open circuit (EMF), and l₂ is the balance length with R connected (terminal voltage).' },
      { experimentId: potentiometer.id, category: 'tricky', question: 'What happens if the driver cell EMF is less than the cell being measured?', answer: 'No balance point will be found on the wire, because the potential drop across the entire wire length would still be less than the EMF of the test cell.' },
    ]
  });

  // =====================================================
  // ELECTRONICS EXPERIMENTS (4)
  // =====================================================

  // 11. PN Junction Diode (Forward Bias) — plots Current (I) vs Voltage (V)
  const pnForward = await prisma.subjectExperiment.create({
    data: {
      subject: 'Electronics',
      name: 'PN Junction Diode (Forward Bias)',
      aim: 'To study the forward bias V-I characteristics of a PN junction diode and determine the knee voltage.',
      formula: 'I = I₀(e^(V/ηVₜ) - 1)',
      procedure: "1. Connect the PN junction diode in forward bias with a variable DC supply.\n2. Increase the voltage in small steps (0.1V) starting from 0V.\n3. Record the forward current for each voltage.\n4. Plot Current I (Y-axis) vs Voltage V (X-axis).\n5. Identify the knee voltage where current starts increasing rapidly.",
      precautions: "Do not exceed the maximum rated current. Use a current-limiting resistor. Increase voltage slowly near the knee point.",
      applications: "Rectifiers, signal demodulation, voltage regulation, LED circuits.",
      rawColumns: '["Voltage", "Current"]',
      rawUnits: '["V", "mA"]',
      xTransform: 'none',
      yTransform: 'none',
      xAxisLabel: 'Voltage (V)',
      yAxisLabel: 'Current (mA)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: pnForward.id, category: 'basic', question: 'What is a PN junction diode?', answer: 'A PN junction diode is a semiconductor device formed by joining P-type and N-type semiconductor materials. It allows current to flow easily in one direction (forward bias) and blocks it in the other (reverse bias).' },
      { experimentId: pnForward.id, category: 'conceptual', question: 'What is the knee voltage?', answer: 'The knee voltage (or cut-in voltage) is the forward voltage at which the diode begins to conduct significantly. It is approximately 0.7V for silicon and 0.3V for germanium diodes.' },
      { experimentId: pnForward.id, category: 'formula', question: 'Write the diode equation.', answer: 'I = I₀(e^(V/ηVₜ) - 1), where I₀ is the reverse saturation current, η is the ideality factor (1-2), and Vₜ = kT/q is the thermal voltage (≈26mV at room temperature).' },
      { experimentId: pnForward.id, category: 'tricky', question: 'Why does a diode not conduct below the knee voltage?', answer: 'Below the knee voltage, the applied voltage is not sufficient to overcome the built-in potential barrier of the depletion region. Only a negligible leakage current flows.' },
    ]
  });

  // 12. PN Junction Diode (Reverse Bias) — plots Reverse Current vs Reverse Voltage
  const pnReverse = await prisma.subjectExperiment.create({
    data: {
      subject: 'Electronics',
      name: 'PN Junction Diode (Reverse Bias)',
      aim: 'To study the reverse bias V-I characteristics of a PN junction diode and determine the breakdown voltage.',
      formula: 'I ≈ -I₀ (constant until breakdown)',
      procedure: "1. Connect the PN junction diode in reverse bias.\n2. Increase the reverse voltage in steps (1V, 2V, 5V, 10V, etc.).\n3. Record the reverse current (in µA) for each voltage.\n4. Plot Reverse Current (Y-axis) vs Reverse Voltage (X-axis).\n5. Identify the breakdown voltage where current increases sharply.",
      precautions: "Use a current-limiting resistor to prevent damage at breakdown. Do not exceed the maximum reverse voltage rating.",
      applications: "Voltage regulation (Zener diodes), photodiodes, varactor diodes for tuning.",
      rawColumns: '["Reverse Voltage", "Reverse Current"]',
      rawUnits: '["V", "µA"]',
      xTransform: 'none',
      yTransform: 'none',
      xAxisLabel: 'Reverse Voltage (V)',
      yAxisLabel: 'Reverse Current (µA)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: pnReverse.id, category: 'basic', question: 'What happens when a diode is reverse biased?', answer: 'In reverse bias, the depletion region widens, and only a very small leakage current (reverse saturation current I₀) flows due to minority carriers. The diode essentially blocks current flow.' },
      { experimentId: pnReverse.id, category: 'conceptual', question: 'What is reverse breakdown?', answer: 'Reverse breakdown occurs when the reverse voltage is so high that it causes a sudden, large increase in reverse current. This can be due to Zener effect (low voltage) or Avalanche effect (high voltage).' },
      { experimentId: pnReverse.id, category: 'formula', question: 'What is the typical reverse saturation current for a silicon diode?', answer: 'For a silicon diode at room temperature, the reverse saturation current I₀ is typically in the range of 10⁻⁹ to 10⁻¹² A (nanoamperes to picoamperes).' },
      { experimentId: pnReverse.id, category: 'tricky', question: 'How does temperature affect reverse current?', answer: 'Reverse saturation current approximately doubles for every 10°C rise in temperature, because more minority carriers are generated thermally. This makes the diode more "leaky" at higher temperatures.' },
    ]
  });

  // 13. Zener Diode — plots Current (I) vs Voltage (V)
  const zenerDiode = await prisma.subjectExperiment.create({
    data: {
      subject: 'Electronics',
      name: 'Zener Diode',
      aim: 'To study the V-I characteristics of a Zener diode and determine the Zener breakdown voltage.',
      formula: 'V_Z = constant (in breakdown region)',
      procedure: "1. Connect the Zener diode in reverse bias with a variable DC supply and series resistor.\n2. Increase the reverse voltage gradually.\n3. Record the current for each voltage setting.\n4. Plot Current I (Y-axis) vs Voltage V (X-axis) for both forward and reverse regions.\n5. Identify the Zener breakdown voltage V_Z.",
      precautions: "Use an appropriate series resistor to limit current. Do not exceed the maximum power dissipation rating of the Zener diode.",
      applications: "Voltage regulation in power supplies, voltage reference circuits, overvoltage protection, waveform clipping.",
      rawColumns: '["Voltage", "Current"]',
      rawUnits: '["V", "mA"]',
      xTransform: 'none',
      yTransform: 'none',
      xAxisLabel: 'Voltage (V)',
      yAxisLabel: 'Current (mA)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: zenerDiode.id, category: 'basic', question: 'What is a Zener diode?', answer: 'A Zener diode is a specially designed PN junction diode that is intended to operate in the reverse breakdown region. It maintains a nearly constant voltage (Zener voltage) across it when reverse biased beyond the breakdown point.' },
      { experimentId: zenerDiode.id, category: 'conceptual', question: 'How does a Zener diode regulate voltage?', answer: 'In breakdown, the Zener diode acts like a constant voltage source. If the input voltage increases, the Zener current increases but the voltage across it remains nearly constant, thus providing regulation.' },
      { experimentId: zenerDiode.id, category: 'formula', question: 'What is the Zener resistance?', answer: 'The Zener resistance (r_z) is the small dynamic resistance in the breakdown region, defined as r_z = ΔV_Z / ΔI_Z. An ideal Zener diode would have r_z = 0.' },
      { experimentId: zenerDiode.id, category: 'tricky', question: 'What is the difference between Zener and Avalanche breakdown?', answer: 'Zener breakdown occurs in heavily doped, narrow junctions (V_Z < 5V) due to quantum tunneling. Avalanche breakdown occurs in lightly doped, wider junctions (V_Z > 7V) due to impact ionization. Between 5-7V, both mechanisms can contribute.' },
    ]
  });

  // 14. Optical Fibre — plots Output Intensity vs Distance/Angle
  const opticalFibre = await prisma.subjectExperiment.create({
    data: {
      subject: 'Electronics',
      name: 'Optical Fibre',
      aim: 'To study the characteristics of an optical fibre and measure the numerical aperture and propagation loss.',
      formula: 'NA = sin(θ_max)',
      procedure: "1. Set up the optical fibre kit with the LED source and detector.\n2. Vary the distance between the fibre end and the detector.\n3. Record the output intensity at each distance/angle.\n4. Plot Output Intensity (Y-axis) vs Distance or Angle (X-axis).\n5. Determine the numerical aperture from the acceptance angle.",
      precautions: "Handle the fibre carefully to avoid micro-bending losses. Ensure clean fibre end faces. Keep the source stable.",
      applications: "Telecommunications, medical endoscopy, internet backbone, sensors, military communications.",
      rawColumns: '["Distance/Angle", "Output Intensity"]',
      rawUnits: '["cm/°", "µW"]',
      xTransform: 'none',
      yTransform: 'none',
      xAxisLabel: 'Distance/Angle (cm/°)',
      yAxisLabel: 'Output Intensity (µW)',
      plotXColumn: 0,
      plotYColumn: 1,
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      { experimentId: opticalFibre.id, category: 'basic', question: 'What is an optical fibre?', answer: 'An optical fibre is a thin, flexible, transparent fibre made of glass or plastic that transmits light signals over long distances by total internal reflection.' },
      { experimentId: opticalFibre.id, category: 'conceptual', question: 'What is total internal reflection?', answer: 'Total internal reflection occurs when light travelling from a denser medium to a rarer medium strikes the boundary at an angle greater than the critical angle. All light is reflected back into the denser medium.' },
      { experimentId: opticalFibre.id, category: 'formula', question: 'Define Numerical Aperture.', answer: 'Numerical Aperture (NA) = sin(θ_max) = √(n₁² - n₂²), where n₁ is the refractive index of the core and n₂ is the refractive index of the cladding. It indicates the light-gathering ability of the fibre.' },
      { experimentId: opticalFibre.id, category: 'tricky', question: 'What causes signal loss in optical fibres?', answer: 'Signal loss (attenuation) occurs due to: absorption (material impurities), scattering (Rayleigh scattering from density fluctuations), bending losses (macro and micro bending), and connector/splice losses.' },
    ]
  });

  console.log('Seeding completed successfully! 14 experiments created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
