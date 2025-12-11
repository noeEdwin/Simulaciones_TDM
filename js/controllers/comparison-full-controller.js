/**
 * ============================================================================
 * CONTROLADOR DE COMPARATIVA TDM (SÍNCRONO VS ASÍNCRONO)
 * ============================================================================
 *
 * Este archivo gestiona la lógica de la página de "Comparativa TDM", permitiendo
 * visualizar en tiempo real las diferencias entre TDM Síncrono (STDM) y Asíncrono (ATDM).
 *
 * CARACTERÍSTICAS PRINCIPALES:
 * - Renderizado directo con React.createElement para máxima compatibilidad.
 * - Simulación paso a paso controlada por un "tick" (reloj).
 * - Implementación de lógica Round Robin persistente para ATDM.
 * - Visualización de buffers de entrada/salida y tramas generadas.
 * - Cálculo en tiempo real de eficiencia y bits (totales vs reales).
 *
 * @author Edwin Noé
 * @version 2.1.0
 */

var useState = React.useState;
var useEffect = React.useEffect;
var useRef = React.useRef;

// ============================================================================
// COMPONENTES VISUALES AUXILIARES
// ============================================================================

/**
 * Componente: SingleBuffer
 * Visualiza una cola de datos (buffer) de un canal específico.
 * Muestra los primeros 5 elementos para no saturar la UI.
 */
function SingleBuffer(props) {
  var queue = props.queue || [];
  var displayQueue = queue.slice(0, 5); // Solo mostrar los primeros 5

  return React.createElement(
    "div",
    { className: "buffer-card" },
    React.createElement(
      "div",
      { className: "buffer-header" },
      React.createElement("span", null, props.label || "Canal " + props.id),
      React.createElement("span", null, queue.length)
    ),
    React.createElement(
      "div",
      { className: "buffer-box" },
      queue.length === 0
        ? React.createElement(
            "span",
            { style: { color: "#cbd5e1", fontSize: "0.75rem" } },
            "(vacío)"
          )
        : displayQueue.map(function (item, i) {
            return React.createElement(
              "div",
              { key: i, className: "buffer-item" },
              item
            );
          })
    )
  );
}

/**
 * Componente: BufferRow
 * Contenedor para mostrar una fila completa de buffers (uno por canal).
 */
function BufferRow(props) {
  var buffers = props.buffers || [];
  return React.createElement(
    "div",
    null,
    React.createElement(
      "h4",
      {
        style: {
          margin: "0 0 12px 0",
          fontSize: "0.95rem",
          color: "#1e293b",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        },
      },
      React.createElement("i", {
        className: "fas fa-layer-group",
        style: { color: "#6366f1" },
      }),
      " ",
      props.title
    ),
    React.createElement(
      "div",
      { className: "buffer-row" },
      buffers.map(function (buf, idx) {
        return React.createElement(SingleBuffer, {
          key: idx,
          id: idx + 1,
          queue: buf,
        });
      })
    )
  );
}

/**
 * Componente: FrameSegment
 * Representa un "slot" o ranura dentro de una trama.
 * Visualiza el par [DATO|DIRECCIÓN] si es asíncrono, o solo el dato si es síncrono.
 */
function FrameSegment(props) {
  var content = props.data;

  // Si tiene dirección (addr) y no es bit de framing ni vacío, mostrar formato [D|A]
  if (props.addr && props.type !== "framing" && props.type !== "empty") {
    content = "[" + props.data + "|" + props.addr + "]";
  } else if (props.type === "empty") {
    content = "[∅]"; // Símbolo de vacío
  }

  return React.createElement(
    "div",
    { className: "frame-segment " + props.type },
    content
  );
}

/**
 * Componente: HistoryFrame
 * Muestra una trama completa en el historial, compuesta por múltiples segmentos (slots).
 * Incluye el bit de sincronización (framing bit) al final.
 */
function HistoryFrame(props) {
  var totalSlots = props.totalSlots || props.slots.length;
  return React.createElement(
    "div",
    { className: "frame-row" },
    React.createElement(
      "div",
      { className: "frame-header" },
      "Trama #" +
        props.id +
        " (" +
        props.slots.length +
        "/" +
        totalSlots +
        " slots)"
    ),
    React.createElement(
      "div",
      { className: "frame-bar" },
      // Renderizar los slots de datos
      props.slots.map(function (s, idx) {
        return React.createElement(FrameSegment, {
          key: idx,
          type: s.type,
          data: s.data,
          addr: s.addr,
        });
      }),
      // Renderizar el bit de framing
      React.createElement(FrameSegment, {
        type: "framing",
        data: props.framingBit,
      })
    )
  );
}

/**
 * Componente: Device
 * Caja visual simple para representar Mux/Demux.
 */
function Device(props) {
  return React.createElement(
    "div",
    { className: "device-box " + props.type },
    React.createElement("i", { className: "fas fa-bolt" }),
    " ",
    props.label
  );
}

/**
 * Componente: ArrowMove
 * Flecha visual para indicar flujo de datos hacia abajo.
 */
function ArrowMove() {
  return React.createElement(
    "div",
    { className: "flow-arrow" },
    React.createElement("i", { className: "fas fa-arrow-down" })
  );
}

// ============================================================================
// APLICACIÓN PRINCIPAL
// ============================================================================

function ComparisonFullApp() {
  // --- ESTADOS (VARIABLES REACTIVAS) ---

  // Datos de entrada crudos (string separado por comas)
  var inputDataState = useState("AAAAAA,,CCCC,,EEEE");
  var inputData = inputDataState[0];
  var setInputData = inputDataState[1];

  // Velocidad de simulación en ms
  var speedState = useState(500);
  var speed = speedState[0];
  var setSpeed = speedState[1];

  // Número de slots por trama (m) -> ATDM puede tener m < n
  var slotsState = useState(3);
  var slotsPerFrame = slotsState[0];
  var setSlotsPerFrame = slotsState[1];

  // Estado de ejecución (play/pause)
  var runningState = useState(false);
  var isRunning = runningState[0];
  var setIsRunning = runningState[1];

  // "Reloj" de la simulación (contador de pasos)
  var tickState = useState(0);
  var tick = tickState[0];
  var setTick = tickState[1];

  // Referencia al intervalo del timer (para poder limpiarlo)
  var intervalRef = useRef(null);

  // Número de canales detectados (n)
  var channelsState = useState(5);
  var numChannels = channelsState[0];
  var setNumChannels = channelsState[1];

  // Buffers de entrada (Arrays de caracteres por canal)
  var inputBuffersState = useState([]);
  var inputBuffers = inputBuffersState[0];
  var setInputBuffers = inputBuffersState[1];

  // Buffers de salida Asíncrono (Recepción)
  var outputBuffersState = useState([]);
  var outputBuffersAsync = outputBuffersState[0];
  var setOutputBuffersAsync = outputBuffersState[1];

  // Historial y métricas de Síncrono (STDM)
  var syncHistState = useState([]);
  var syncHistory = syncHistState[0];
  var setSyncHistory = syncHistState[1];

  var syncMetricsState = useState({ real: 0, total: 0 });
  var syncMetrics = syncMetricsState[0];
  var setSyncMetrics = syncMetricsState[1];

  // Historial y métricas de Asíncrono (ATDM)
  var asyncHistState = useState([]);
  var asyncHistory = asyncHistState[0];
  var setAsyncHistory = asyncHistState[1];

  var asyncMetricsState = useState({ real: 0, total: 0 });
  var asyncMetrics = asyncMetricsState[0];
  var setAsyncMetrics = asyncMetricsState[1];

  // Contadores de referencia (no disparan re-render)
  var frameCounterRef = useRef(0); // ID único para las tramas
  var channelIterRef = useRef(0); // (Legacy) Iterador simple
  var scanPointerRef = useRef(0); // IMPORTANTE: Puntero persistente para Round Robin en ATDM

  /**
   * Helper: decimalToBinary
   * Convierte un número a string binario con padding (ceros a la izquierda).
   * @param {number} decimal - Valor a convertir
   * @param {number} bits - Longitud deseada
   */
  function decimalToBinary(decimal, bits) {
    return decimal.toString(2).padStart(bits, "0");
  }

  /**
   * Función: resetSim
   * Reinicia toda la simulación a su estado inicial.
   * Analiza el inputData para configurar los canales e inicializar buffers.
   */
  function resetSim() {
    setIsRunning(false);
    setTick(0);
    frameCounterRef.current = 0;
    channelIterRef.current = 0;
    scanPointerRef.current = 0; // Reiniciar puntero de escaneo al canal 0

    // Parsear entrada
    var rawChannels = inputData.split(",").map(function (s) {
      return s.trim();
    });
    var n = rawChannels.length;
    setNumChannels(n);

    // Inicializar buffers de entrada con los caracteres
    var initialBuffers = rawChannels.map(function (str) {
      return str.split("").filter(function (c) {
        return c !== "";
      });
    });
    setInputBuffers(initialBuffers);
    setOutputBuffersAsync(
      Array(n)
        .fill(null)
        .map(function () {
          return [];
        })
    );

    // Limpiar historiales y métricas
    setSyncHistory([]);
    setAsyncHistory([]);
    setSyncMetrics({ real: 0, total: 0 });
    setAsyncMetrics({ real: 0, total: 0 });
  }

  // Efecto: Inicialización al montar o cambiar datos
  useEffect(
    function () {
      resetSim();
    },
    [inputData, slotsPerFrame]
  );

  // Efecto: Temporizador (Ciclo de Reloj)
  useEffect(
    function () {
      if (isRunning) {
        intervalRef.current = setInterval(function () {
          setTick(function (t) {
            return t + 1;
          });
        }, speed);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      return function () {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    },
    [isRunning, speed]
  );

  // ========================================================================
  // LÓGICA CORE DE SIMULACIÓN (Ejecutada en cada Tick)
  // ========================================================================
  useEffect(
    function () {
      if (tick === 0) return; // No hacer nada en el tick inicial (reset)

      // --------------------------------------------------------------------
      // LÓGICA ASÍNCRONA (ATDM) - Basada en Round Robin
      // --------------------------------------------------------------------
      var currentBuffers = inputBuffers;
      // Crear copia profunda de buffers para no mutar estado directamente
      var nextBuffers = currentBuffers.map(function (b) {
        return b.slice();
      });
      var numCh = nextBuffers.length;
      var asyncSlots = [];

      // Intentar llenar la trama actual slot por slot
      for (var s = 0; s < slotsPerFrame; s++) {
        var scannedCount = 0;
        var slotFound = false;

        // Ciclo de búsqueda (Round Robin)
        // Empieza desde donde se quedó la última vez con (scanPointerRef)
        while (scannedCount < numCh && !slotFound) {
          var chIdx = (scanPointerRef.current + scannedCount) % numCh;

          // Si el canal apuntado tiene datos...
          if (nextBuffers[chIdx] && nextBuffers[chIdx].length > 0) {
            var char = nextBuffers[chIdx].shift(); // Extraer dato

            // Agregar slot a la trama
            asyncSlots.push({
              type: "async-data",
              data: char,
              // Dirección binaria: log2 del número de canales
              addr: decimalToBinary(chIdx, Math.ceil(Math.log2(numChannels))),
              chIdx: chIdx,
            });

            // Mover puntero al siguiente canal para la próxima búsqueda
            scanPointerRef.current = (chIdx + 1) % numCh;
            slotFound = true;
          } else {
            scannedCount++; // Seguir buscando en el siguiente canal
          }
        }

        // Si después de revisar todos los canales no encontramos nada...
        if (!slotFound) {
          // Verificar si queda algún dato en todo el sistema
          var hasAnyData = nextBuffers.some(function (b) {
            return b.length > 0;
          });
          if (hasAnyData) {
            // Si hay datos pero el puntero actual cayó en vacíos, avanzar para no estancarse
            scanPointerRef.current = (scanPointerRef.current + 1) % numCh;
          } else {
            break; // Sistema vacío, dejar de llenar slots
          }
        }
      }

      // Si se logra generar slots de datos
      if (asyncSlots.length > 0) {
        // VISUALIZACIÓN: Invertir orden para que el primer canal encontrado aparezca a la derecha
        asyncSlots.reverse();

        // PADDING: Rellenar con slots vacíos si la trama no está llena
        // "unshift" agrega al inicio (visual izquierdo) para mantener alineación derecha
        while (asyncSlots.length < slotsPerFrame) {
          asyncSlots.unshift({ type: "empty", data: "∅", addr: "-" });
        }

        frameCounterRef.current++;
        var newFrame = {
          id: frameCounterRef.current,
          slots: asyncSlots,
          framingBit: frameCounterRef.current % 2, // Bit alternante 0/1
        };

        // Guardar en historial (máximo 10 tramas recientes) para optimización de la visualización en la pagina
        setAsyncHistory(function (prev) {
          var updated = prev.concat([newFrame]);
          if (updated.length > 10) updated = updated.slice(updated.length - 10);
          return updated;
        });

        // CÁLCULO DE MÉTRICAS ATDM
        // Bits necesarios para dirección = techo(log2(N))
        var bitsNeeded = Math.ceil(Math.log2(numChannels));

        // Slots Reales = Solo los que contienen datos 'async-data'
        var realsCount = asyncSlots.filter(function (s) {
          return s.type === "async-data";
        }).length;
        var bitsRealThisFrame = realsCount * 8;

        // Bits Totales por trama = (Slots * 8 datos) + (Slots * BitsDir) + 1 framing
        // Nota: Se cobra overhead por todos los slots de la trama fija, incluso vacíos
        var bitsTotalThisFrame =
          slotsPerFrame * 8 + slotsPerFrame * bitsNeeded + 1;

        setAsyncMetrics(function (prev) {
          return {
            real: prev.real + bitsRealThisFrame,
            total: prev.total + bitsTotalThisFrame,
          };
        });

        // Actualizar Buffers de Salida (Recepción)
        setOutputBuffersAsync(function (prevOut) {
          var nextOut = prevOut.map(function (b) {
            return b.slice();
          });
          asyncSlots.forEach(function (slot) {
            if (slot.type === "async-data" && nextOut[slot.chIdx]) {
              nextOut[slot.chIdx].push(slot.data);
            }
          });
          return nextOut;
        });

        // Actualizar Buffers de Entrada (consumir datos)
        setInputBuffers(nextBuffers);
      }

      // --------------------------------------------------------------------
      // LÓGICA SÍNCRONA (STDM) - Simulación Paralela Simplificada
      // --------------------------------------------------------------------
      var rawChannels = inputData.split(",").map(function (s) {
        return s.trim();
      });
      var charIdx = tick - 1; // Un caracter por tick
      var maxLen = Math.max.apply(
        null,
        rawChannels.map(function (c) {
          return c.length;
        })
      );

      if (charIdx < maxLen) {
        var syncSlots = [];
        var realCount = 0;
        var numCh = rawChannels.length;

        // Recorrer canales en orden inverso para visualizar
        for (var i = numCh - 1; i >= 0; i--) {
          var char = rawChannels[i] ? rawChannels[i][charIdx] : undefined;
          var hasData = char !== undefined && char !== "";
          syncSlots.push({
            type: hasData ? "sync-data" : "empty",
            data: hasData ? char : "∅",
            addr: "CH" + i, // Dirección implícita por posición
          });
          if (hasData) realCount++;
        }

        var newSyncFrame = {
          id: tick,
          slots: syncSlots,
          framingBit: tick % 2,
          totalSlots: numCh,
        };
        setSyncHistory(function (prev) {
          var updated = prev.concat([newSyncFrame]);
          if (updated.length > 10) updated = updated.slice(updated.length - 10);
          return updated;
        });

        // Métricas Síncrono:
        // Reales: Solo datos (8 bits)
        // Total: (NumCanales * 8) + 1 bit framing (SIN bits de dirección)
        var bitsRealSync = realCount * 8;
        var bitsTotalSync = numCh * 8 + 1;

        setSyncMetrics(function (prev) {
          return {
            real: prev.real + bitsRealSync,
            total: prev.total + bitsTotalSync,
          };
        });
      }
    },
    [tick]
  ); // Se ejecuta cada vez que cambia 'tick'

  // Cálculos auxiliares para UI
  var bitsDir = Math.max(1, Math.ceil(Math.log2(numChannels + 1)));
  var rawChannelsDisplay = inputData.split(",").map(function (s) {
    return s.trim();
  });
  var conDatos = rawChannelsDisplay.filter(function (s) {
    return s.length > 0;
  }).length;
  var vacios = rawChannelsDisplay.length - conDatos;
  var sliderBlocked = slotsPerFrame >= numChannels;

  // --- RENDERIZADO DE LA INTERFAZ ---
  return React.createElement(
    "div",
    { className: "app-container" },

    // BARRA LATERAL (CONFIGURACIÓN)
    React.createElement(
      "div",
      { className: "sidebar" },
      React.createElement(
        "div",
        { className: "sidebar-title" },
        React.createElement("i", {
          className: "fas fa-sliders-h",
          style: { color: "#6366f1" },
        }),
        " Configuración"
      ),

      // Panel: Parámetros del Sistema
      React.createElement(
        "div",
        { className: "control-card" },
        React.createElement(
          "div",
          { className: "section-header" },
          React.createElement(
            "div",
            { className: "section-header-title" },
            React.createElement("i", { className: "fas fa-cog" }),
            "Parámetros del Sistema"
          ),
          React.createElement("i", {
            className: "fas fa-chevron-down",
            style: { color: "#94a3b8" },
          })
        ),

        // Slider: Número de Canales
        React.createElement(
          "div",
          { className: "slider-row" },
          React.createElement(
            "span",
            { className: "slider-label" },
            "Canales (n) ",
            React.createElement("i", {
              className: "fas fa-info-circle",
              style: { color: "#94a3b8", fontSize: "0.7rem" },
            })
          ),
          React.createElement(
            "span",
            { className: "slider-badge" },
            numChannels
          )
        ),
        React.createElement(
          "div",
          { className: "slider-hint" },
          "Bits de dirección: " + bitsDir
        ),

        // Slider: Slots por Trama
        React.createElement(
          "div",
          { className: "slider-row" },
          React.createElement(
            "span",
            { className: "slider-label" },
            "Slots por Trama (m) ",
            React.createElement("i", {
              className: "fas fa-info-circle",
              style: { color: "#94a3b8", fontSize: "0.7rem" },
            })
          ),
          React.createElement(
            "span",
            { className: "slider-badge" },
            slotsPerFrame
          )
        ),
        React.createElement("input", {
          type: "range",
          className: "range-input" + (sliderBlocked ? " slider-locked" : ""),
          min: 1,
          max: numChannels,
          step: 1,
          value: Math.min(slotsPerFrame, numChannels),
          onChange: function (e) {
            var newVal = parseInt(e.target.value) || 3;
            if (newVal <= numChannels) setSlotsPerFrame(newVal);
          },
          disabled: isRunning || sliderBlocked,
        }),
        React.createElement(
          "div",
          {
            className: "slider-hint" + (sliderBlocked ? " slider-warning" : ""),
          },
          sliderBlocked
            ? "🔒 m = n (máximo alcanzado)"
            : "m ≤ n (Multiplexación Estadística)"
        ),

        // Slider: Velocidad
        React.createElement(
          "div",
          { className: "slider-row" },
          React.createElement(
            "span",
            { className: "slider-label" },
            "Velocidad ",
            React.createElement("i", {
              className: "fas fa-info-circle",
              style: { color: "#94a3b8", fontSize: "0.7rem" },
            })
          ),
          React.createElement(
            "span",
            { className: "slider-badge" },
            speed + "ms"
          )
        ),
        React.createElement("input", {
          type: "range",
          className: "range-input",
          min: 200,
          max: 2000,
          step: 100,
          value: speed,
          onChange: function (e) {
            setSpeed(Number(e.target.value));
          },
        }),
        React.createElement(
          "div",
          { className: "slider-hint" },
          speed <= 500
            ? "⚡ Muy rápido"
            : speed <= 1000
            ? "🚀 Rápido"
            : "🐢 Lento"
        )
      ),

      // Panel: Datos de Simulación
      React.createElement(
        "div",
        { className: "control-card" },
        React.createElement(
          "div",
          { className: "section-header" },
          React.createElement(
            "div",
            { className: "section-header-title" },
            React.createElement("i", {
              className: "fas fa-edit",
              style: { color: "#10b981" },
            }),
            "Datos de Simulación"
          ),
          React.createElement("i", {
            className: "fas fa-chevron-down",
            style: { color: "#94a3b8" },
          })
        ),

        React.createElement(
          "div",
          { className: "input-group" },
          React.createElement(
            "div",
            { className: "input-label" },
            "Datos de Entrada",
            React.createElement("i", {
              className: "fas fa-check-circle checkmark",
            })
          ),
          React.createElement("textarea", {
            className: "text-area-styled",
            value: inputData,
            onChange: function (e) {
              setInputData(e.target.value);
            },
            disabled: isRunning,
          }),
          React.createElement(
            "div",
            { className: "input-status-text" },
            conDatos + " dispositivos con datos, " + vacios + " vacíos"
          )
        ),

        // Botones de Control
        React.createElement(
          "button",
          {
            className: isRunning
              ? "btn-block btn-reset"
              : "btn-block btn-primary",
            onClick: function () {
              setIsRunning(!isRunning);
            },
          },
          React.createElement("i", {
            className: isRunning ? "fas fa-stop" : "fas fa-play",
          }),
          isRunning ? " Detener" : " Iniciar"
        ),

        React.createElement(
          "button",
          {
            className: "btn-block btn-reset",
            onClick: resetSim,
          },
          React.createElement("i", { className: "fas fa-redo" }),
          " Reiniciar"
        )
      ),

      // Panel: Métricas Asíncrono
      React.createElement(
        "div",
        { className: "metrics-card" },
        React.createElement(
          "div",
          { className: "metrics-title" },
          React.createElement("i", {
            className: "fas fa-layer-group",
            style: { color: "#6366f1", marginRight: "8px" },
          }),
          "Asíncrono (ATDM)"
        ),
        React.createElement(
          "div",
          { className: "metric-row" },
          React.createElement("span", null, "Bits Totales:"),
          React.createElement(
            "span",
            { className: "metric-value" },
            asyncMetrics.total
          )
        ),
        React.createElement(
          "div",
          { className: "metric-row" },
          React.createElement("span", null, "Bits Reales:"),
          React.createElement(
            "span",
            { className: "metric-value", style: { color: "#10b981" } },
            asyncMetrics.real
          )
        )
      ),

      // Panel: Métricas Síncrono
      React.createElement(
        "div",
        { className: "metrics-card" },
        React.createElement(
          "div",
          { className: "metrics-title" },
          React.createElement("i", {
            className: "fas fa-bolt",
            style: { color: "#818cf8", marginRight: "8px" },
          }),
          "Síncrono (STDM)"
        ),
        React.createElement(
          "div",
          { className: "metric-row" },
          React.createElement("span", null, "Bits Totales:"),
          React.createElement(
            "span",
            { className: "metric-value" },
            syncMetrics.total
          )
        ),
        React.createElement(
          "div",
          { className: "metric-row" },
          React.createElement("span", null, "Bits Reales:"),
          React.createElement(
            "span",
            { className: "metric-value", style: { color: "#10b981" } },
            syncMetrics.real
          )
        ),
        React.createElement(
          "div",
          { className: "metric-row" },
          React.createElement("span", null, "Núm. Slots/Trama:"),
          React.createElement(
            "span",
            { className: "metric-value", style: { color: "#6366f1" } },
            numChannels
          )
        )
      )
    ),

    // CONTENIDO PRINCIPAL (VISUALIZACIÓN)
    React.createElement(
      "div",
      { className: "main-content" },
      React.createElement(BufferRow, {
        buffers: inputBuffers,
        title: "Buffers de Entrada",
      }),
      React.createElement(ArrowMove, null),
      React.createElement(Device, { type: "mux", label: "MULTIPLEXOR" }),
      React.createElement(ArrowMove, null),

      // Historial Async
      React.createElement(
        "div",
        { className: "hist-card" },
        React.createElement(
          "h3",
          null,
          React.createElement("i", {
            className: "fas fa-layer-group",
            style: { color: "#6366f1" },
          }),
          " Historial de Tramas (Asíncrono)"
        ),
        React.createElement(
          "div",
          { className: "history-list" },
          asyncHistory.length === 0
            ? React.createElement(
                "p",
                { style: { textAlign: "center", color: "#94a3b8" } },
                "Esperando tramas..."
              )
            : asyncHistory.map(function (frame) {
                return React.createElement(HistoryFrame, {
                  key: "async" + frame.id,
                  id: frame.id,
                  slots: frame.slots,
                  framingBit: frame.framingBit,
                });
              })
        )
      ),

      // Historial Sync
      React.createElement(
        "div",
        { className: "hist-card" },
        React.createElement(
          "h3",
          null,
          React.createElement("i", {
            className: "fas fa-bolt",
            style: { color: "#818cf8" },
          }),
          " Historial de Tramas (Síncrono)"
        ),
        React.createElement(
          "div",
          { className: "history-list" },
          syncHistory.length === 0
            ? React.createElement(
                "p",
                { style: { textAlign: "center", color: "#94a3b8" } },
                "Esperando tramas..."
              )
            : syncHistory.map(function (frame) {
                return React.createElement(HistoryFrame, {
                  key: "sync" + frame.id,
                  id: frame.id,
                  slots: frame.slots,
                  framingBit: frame.framingBit,
                  totalSlots: frame.totalSlots || numChannels,
                });
              })
        )
      ),

      React.createElement(ArrowMove, null),
      React.createElement(Device, { type: "demux", label: "DEMULTIPLEXOR" }),
      React.createElement(ArrowMove, null),
      React.createElement(BufferRow, {
        buffers: outputBuffersAsync,
        title: "Buffers de Salida (Recepción)",
      })
    )
  );
}

// ============================================================================
// MONTAJE DE LA APLICACIÓN
// ============================================================================
var rootElement = document.getElementById("root");
if (rootElement) {
  try {
    var root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(ComparisonFullApp, null));
    console.log("TDM Comparison App Loaded Successfully - Author: Edwin Noé");
  } catch (e) {
    console.error("Render Error:", e);
    rootElement.innerHTML =
      '<div style="color:red;padding:20px;"><h3>Error de Renderizado</h3><pre>' +
      e.message +
      "</pre></div>";
  }
}
