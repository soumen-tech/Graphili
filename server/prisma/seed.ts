import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.vivaQuestion.deleteMany({});
  await prisma.subjectExperiment.deleteMany({});

  // 1. Ohm's Law (Physics)
  const ohmsLaw = await prisma.subjectExperiment.create({
    data: {
      subject: 'Physics',
      name: "Ohm's Law",
      aim: "To verify Ohm's Law by studying the relationship between Potential Difference (Voltage) across a conductor and the Current flowing through it, and to calculate the unknown resistance.",
      formula: "V = IR",
      procedure: "1. Connect the resistor, ammeter, voltmeter, and power supply as shown in the circuit diagram.\n2. Turn on the power supply and set the voltage to 1V.\n3. Record the current reading from the ammeter.\n4. Repeat for different voltages (2V, 3V, 4V, 5V).\n5. Plot a graph of Voltage (X-axis) vs Current (Y-axis) and find the slope to compute resistance.",
      precautions: "Ensure connections are tight. Do not leave current flowing for long periods as heating can change resistance.",
      applications: "Design of electronic components, circuit analysis, and selecting correct resistor sizes.",
    }
  });

  // Seed default Viva questions for Ohm's Law
  await prisma.vivaQuestion.createMany({
    data: [
      {
        experimentId: ohmsLaw.id,
        category: 'basic',
        question: "State Ohm's Law.",
        answer: "Ohm's Law states that the current flowing through a conductor is directly proportional to the potential difference across its ends, provided physical conditions like temperature remain constant."
      },
      {
        experimentId: ohmsLaw.id,
        category: 'conceptual',
        question: "Why does the temperature of the conductor need to remain constant?",
        answer: "As temperature increases, the thermal vibrations of metal ions increase, which increases collision rates for flowing electrons, thereby increasing the electrical resistance."
      },
      {
        experimentId: ohmsLaw.id,
        category: 'formula',
        question: "What is the SI unit of resistance, and how is it defined?",
        answer: "The SI unit is the Ohm (Ω). One Ohm is defined as the resistance of a conductor when a potential difference of 1 Volt produces a current of 1 Ampere."
      },
      {
        experimentId: ohmsLaw.id,
        category: 'tricky',
        question: "Does Ohm's Law apply to semiconductor diodes or vacuum tubes?",
        answer: "No. Ohm's Law only applies to ohmic conductors (like metals). Non-ohmic devices like diodes, transistors, and vacuum tubes have a non-linear relationship between voltage and current."
      }
    ]
  });

  // 2. RC Circuit Response (Electronics)
  const rcCircuit = await prisma.subjectExperiment.create({
    data: {
      subject: 'Electronics',
      name: 'RC Circuit Response',
      aim: "To study the charging and discharging characteristics of a capacitor in an RC circuit and determine the time constant.",
      formula: "τ = R × C",
      procedure: "1. Set up the RC series circuit connected to a DC voltage source.\n2. Turn on the switch and measure the voltage across the capacitor at fixed time intervals (e.g. every 5 seconds).\n3. Plot voltage (Y-axis) vs time (X-axis) to get the exponential charging curve.\n4. Find the time at which voltage reaches 63.2% of its maximum to determine the time constant.",
      precautions: "Make sure the capacitor is fully discharged before starting. Match polarities of electrolytic capacitors correctly.",
      applications: "Timing delays, signal filtering, smoothing power supplies, and wave-shaping circuits.",
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      {
        experimentId: rcCircuit.id,
        category: 'basic',
        question: "What is a capacitor, and what does it store?",
        answer: "A capacitor is a passive component that stores electrical energy in an electrostatic field between two conducting plates separated by a dielectric."
      },
      {
        experimentId: rcCircuit.id,
        category: 'conceptual',
        question: "What is the physical meaning of the RC time constant?",
        answer: "The time constant (τ) is the time required for the capacitor voltage to charge to approximately 63.2% of its maximum value, or discharge down to 36.8% of its initial value."
      },
      {
        experimentId: rcCircuit.id,
        category: 'formula',
        question: "If R = 10kΩ and C = 100μF, what is the time constant?",
        answer: "τ = R × C = 10,000 Ω × 0.0001 F = 1.0 second."
      },
      {
        experimentId: rcCircuit.id,
        category: 'tricky',
        question: "Why does the charging current decrease as the capacitor charges?",
        answer: "As the capacitor accumulates charge, the voltage across its plates rises and opposes the source voltage. This reduces the net voltage driving current through the resistor, causing current to fall exponentially to zero."
      }
    ]
  });

  // 3. LCR Circuit Response (Electrical)
  const lcrCircuit = await prisma.subjectExperiment.create({
    data: {
      subject: 'Electrical',
      name: 'LCR Circuit Response',
      aim: "To study the frequency response of a series LCR resonance circuit and determine the resonant frequency.",
      formula: "f_r = 1 / (2π × √(L × C))",
      procedure: "1. Connect the inductor, capacitor, and resistor in series with an AC signal generator.\n2. Keep the source voltage constant while increasing frequency step-by-step.\n3. Measure the circuit current at each frequency step.\n4. Plot current (Y-axis) vs frequency (X-axis).\n5. Identify the resonant frequency corresponding to peak current.",
      precautions: "Keep source amplitude constant throughout the run. Minimize internal resistance of inductor winding.",
      applications: "Radio tuning receivers, television tuning circuits, filters, and oscillator circuit design.",
    }
  });

  await prisma.vivaQuestion.createMany({
    data: [
      {
        experimentId: lcrCircuit.id,
        category: 'basic',
        question: "What is resonance in a series LCR circuit?",
        answer: "Resonance occurs at a frequency where the inductive reactance (X_L) equals the capacitive reactance (X_C). The reactances cancel out, leaving the circuit purely resistive."
      },
      {
        experimentId: lcrCircuit.id,
        category: 'conceptual',
        question: "What is the impedance of a series LCR circuit at resonance?",
        answer: "At resonance, the impedance is at its minimum and is equal to the resistance (R) of the circuit. Thus, current reaches its maximum value."
      },
      {
        experimentId: lcrCircuit.id,
        category: 'formula',
        question: "Write the formula for the Quality Factor (Q) of a series LCR circuit.",
        answer: "Q = (1/R) × √(L/C). A higher Q factor indicates a sharper resonance peak and higher selectivity."
      },
      {
        experimentId: lcrCircuit.id,
        category: 'tricky',
        question: "What happens to the phase difference between voltage and current at resonance?",
        answer: "At resonance, the phase difference is zero. The voltage and current are in phase because the net reactance is zero, making the circuit behave like a pure resistor."
      }
    ]
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
