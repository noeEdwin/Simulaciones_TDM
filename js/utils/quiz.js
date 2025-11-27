/* ===== BANCO DE PREGUNTAS (POOL) ===== */
// Aquí ponemos muchas preguntas, el sistema elegirá 5 al azar cada vez.
const questionBank = [
  {
    question: "¿Qué significa TDM?",
    options: [
      "Time Data Management",
      "Time Division Multiplexing",
      "Total Digital Modulation",
      "Transmission Dual Mode",
    ],
    correct: 1,
  },
  {
    question: "¿Cuál es la principal ventaja del TDM Síncrono?",
    options: [
      "Los time slots son dinámicos",
      "No requiere sincronización",
      "Garantiza un ancho de banda fijo por usuario",
      "Es más eficiente si hay pocos datos",
    ],
    correct: 2,
  },
  {
    question: "En TDM Asíncrono, ¿qué sucede si un canal no tiene datos?",
    options: [
      "Se envía un slot vacío",
      "El sistema se detiene",
      "El MUX asigna el slot al siguiente canal activo",
      "Se genera ruido digital",
    ],
    correct: 2,
  },
  {
    question: "¿Qué componente es necesario para separar la señal al final?",
    options: [
      "Multiplexor (MUX)",
      "Demultiplexor (DEMUX)",
      "Amplificador",
      "Osciloscopio",
    ],
    correct: 1,
  },
  {
    question: "¿El TDM se utiliza principalmente para señales...?",
    options: ["Analógicas", "Digitales", "De radio AM", "Acústicas"],
    correct: 1,
  },
  {
    question: "¿Qué es un 'Time Slot' o Ranura de Tiempo?",
    options: [
      "Un cable físico extra",
      "El tiempo asignado a un usuario para transmitir",
      "Una pausa para enfriar el sistema",
      "La hora a la que se enciende el router",
    ],
    correct: 1,
  },
  {
    question: "¿Qué tipo de TDM es más eficiente en el uso del ancho de banda?",
    options: [
      "TDM Síncrono",
      "TDM Asíncrono (Estadístico)",
      "Ambos son iguales",
      "Ninguno es eficiente",
    ],
    correct: 1,
  },
  {
    question: "¿Qué problema soluciona la Multiplexación?",
    options: [
      "La falta de electricidad",
      "Transmitir múltiples señales por un solo medio",
      "Mejorar la calidad de audio analógico",
      "Aumentar el voltaje de la señal",
    ],
    correct: 1,
  },
  {
    question: "¿Qué son los 'Bits de entramado' (Framing bits)?",
    options: [
      "Bits usados para sincronizar transmisor y receptor",
      "Virus informáticos",
      "Datos del usuario",
      "Bits de relleno inútiles",
    ],
    correct: 0,
  },
  {
    question:
      "Si tengo 4 canales de 1 Kbps en TDM Síncrono, ¿cuál es la velocidad mínima de salida?",
    options: ["1 Kbps", "2 Kbps", "4 Kbps", "8 Kbps"],
    correct: 2,
  },
  {
    question: "¿El TDM Asíncrono requiere el uso de...?",
    options: [
      "Cables de cobre únicamente",
      "Buffers (memoria) y direccionamiento",
      "Menos energía eléctrica",
      "Señales de humo",
    ],
    correct: 1,
  },
  {
    question:
      "¿En qué capa del modelo OSI suele operar la multiplexación física?",
    options: [
      "Capa de Aplicación",
      "Capa Física",
      "Capa de Sesión",
      "Capa de Presentación",
    ],
    correct: 1,
  },
  {
    question: "¿Qué significa 'MUX'?",
    options: [
      "Maximum User Xperience",
      "Multiplexor",
      "Multi User Exchange",
      "Modulación Ultra X",
    ],
    correct: 1,
  },
  {
    question: "¿Cuál NO es una aplicación común de TDM?",
    options: [
      "Redes GSM (Celulares)",
      "Líneas telefónicas digitales (E1/T1)",
      "Radio FM analógica",
      "Transmisión de satélites",
    ],
    correct: 2,
  },
  {
    question: "La 'Banda de Guarda' (Guard Time) sirve para...",
    options: [
      "Proteger el equipo del polvo",
      "Evitar solapamiento entre time slots",
      "Aumentar la velocidad",
      "Encriptar los datos",
    ],
    correct: 1,
  },
];

/* ===== LÓGICA DEL JUEGO ===== */
let questions = [];
let currentQuestion = 0;
let score = 0;
let canAnswer = true;

// Elementos del DOM
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const questionCount = document.getElementById("question-count");
const progressFill = document.getElementById("progress-fill");
const quizBox = document.getElementById("quiz-box");
const resultBox = document.getElementById("result-box");
const scoreNumber = document.getElementById("score-number");
const scoreMessage = document.getElementById("score-message");

// Función para mezclar y elegir 5 preguntas
function initGame() {
  // 1. Copiamos el banco para no modificar el original
  let tempBank = [...questionBank];

  // 2. Mezclamos aleatoriamente (Algoritmo simple)
  tempBank.sort(() => Math.random() - 0.5);

  // 3. Tomamos solo las primeras 5
  questions = tempBank.slice(0, 5);

  // 4. Reseteamos variables
  currentQuestion = 0;
  score = 0;
  canAnswer = true;

  // 5. Interfaz
  resultBox.classList.add("hidden");
  quizBox.classList.remove("hidden");
  loadQuestion();
}

function loadQuestion() {
  const q = questions[currentQuestion];
  questionText.textContent = q.question;
  optionsContainer.innerHTML = "";

  // Actualizar progreso
  questionCount.textContent = `Pregunta ${currentQuestion + 1} de ${
    questions.length
  }`;
  progressFill.style.width = `${
    ((currentQuestion + 1) / questions.length) * 100
  }%`;

  q.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = option;
    btn.onclick = () => checkAnswer(index, btn);
    optionsContainer.appendChild(btn);
  });
  canAnswer = true; // Permitir responder
}

function checkAnswer(selectedIndex, btn) {
  if (!canAnswer) return; // Evitar doble clic
  canAnswer = false;

  const correctIndex = questions[currentQuestion].correct;
  const allOptions = optionsContainer.children;

  if (selectedIndex === correctIndex) {
    btn.classList.add("correct");
    score++;
  } else {
    btn.classList.add("wrong");
    // Mostrar la correcta automáticamente para que aprendan
    allOptions[correctIndex].classList.add("correct");
  }

  // Esperar un poco y pasar a la siguiente
  setTimeout(() => {
    currentQuestion++;
    if (currentQuestion < questions.length) {
      loadQuestion();
    } else {
      showResults();
    }
  }, 1500);
}

function showResults() {
  quizBox.classList.add("hidden");
  resultBox.classList.remove("hidden");
  scoreNumber.textContent = score;

  // Mensajes personalizados según el puntaje
  if (score === 5) {
    scoreMessage.textContent = "¡Perfecto! Eres un experto en TDM.";
  } else if (score >= 3) {
    scoreMessage.textContent = "¡Buen trabajo! Entiendes bien los conceptos.";
  } else {
    scoreMessage.textContent = "Te recomiendo repasar el simulador.";
  }
}

function restartQuiz() {
  initGame();
}

initGame();
