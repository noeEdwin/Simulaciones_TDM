/**
 * Controlador COMPARATIVA TDM - Versión con Formato [DATA|ADDR]
 * Sin JSX, usando React.createElement para evitar problemas de Babel
 * ORDEN DE TRAMAS: Inverso (último canal con datos primero)
 */

var useState = React.useState;
var useEffect = React.useEffect;
var useRef = React.useRef;

// --- COMPONENTES VISUALES ---

// Buffer Individual
function SingleBuffer(props) {
    var queue = props.queue || [];
    var displayQueue = queue.slice(0, 5);
    
    return React.createElement('div', { className: 'buffer-card' },
        React.createElement('div', { className: 'buffer-header' },
            React.createElement('span', null, props.label || 'Canal ' + props.id),
            React.createElement('span', null, queue.length)
        ),
        React.createElement('div', { className: 'buffer-box' },
            queue.length === 0 
                ? React.createElement('span', { style: { color: '#cbd5e1', fontSize: '0.75rem' } }, '(vacío)')
                : displayQueue.map(function(item, i) {
                    return React.createElement('div', { key: i, className: 'buffer-item' }, item);
                })
        )
    );
}

// Fila de Buffers
function BufferRow(props) {
    var buffers = props.buffers || [];
    return React.createElement('div', null,
        React.createElement('h4', { style: { margin: '0 0 12px 0', fontSize: '0.95rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' } },
            React.createElement('i', { className: 'fas fa-layer-group', style: { color: '#6366f1' } }), 
            ' ', 
            props.title
        ),
        React.createElement('div', { className: 'buffer-row' },
            buffers.map(function(buf, idx) {
                return React.createElement(SingleBuffer, { key: idx, id: idx + 1, queue: buf });
            })
        )
    );
}

// Segmento de Trama - FORMATO [DATA|ADDR]
function FrameSegment(props) {
    var content = props.data;
    
    // Si tiene dirección y no es framing ni vacío, mostrar [DATA|ADDR]
    if (props.addr && props.type !== 'framing' && props.type !== 'empty') {
        content = '[' + props.data + '|' + props.addr + ']';
    } else if (props.type === 'empty') {
        content = '[∅]';
    }
    
    return React.createElement('div', { className: 'frame-segment ' + props.type }, content);
}

// Historial Frame Row con slots totales
function HistoryFrame(props) {
    var totalSlots = props.totalSlots || props.slots.length;
    return React.createElement('div', { className: 'frame-row' },
        React.createElement('div', { className: 'frame-header' },
            'Trama #' + props.id + ' (' + props.slots.length + '/' + totalSlots + ' slots)'
        ),
        React.createElement('div', { className: 'frame-bar' },
            props.slots.map(function(s, idx) {
                return React.createElement(FrameSegment, { 
                    key: idx, 
                    type: s.type, 
                    data: s.data, 
                    addr: s.addr 
                });
            }),
            React.createElement(FrameSegment, { type: 'framing', data: props.framingBit })
        )
    );
}

// Device Box
function Device(props) {
    return React.createElement('div', { className: 'device-box ' + props.type },
        React.createElement('i', { className: 'fas fa-bolt' }), ' ', props.label
    );
}

// Arrow
function ArrowMove() {
    return React.createElement('div', { className: 'flow-arrow' },
        React.createElement('i', { className: 'fas fa-arrow-down' })
    );
}

// --- APP PRINCIPAL ---
function ComparisonFullApp() {
    var inputDataState = useState("AAAAA,,CCCC,,EEEE");
    var inputData = inputDataState[0];
    var setInputData = inputDataState[1];

    var speedState = useState(500);
    var speed = speedState[0];
    var setSpeed = speedState[1];

    var slotsState = useState(3);
    var slotsPerFrame = slotsState[0];
    var setSlotsPerFrame = slotsState[1];

    var runningState = useState(false);
    var isRunning = runningState[0];
    var setIsRunning = runningState[1];

    var tickState = useState(0);
    var tick = tickState[0];
    var setTick = tickState[1];

    var intervalRef = useRef(null);

    var channelsState = useState(5);
    var numChannels = channelsState[0];
    var setNumChannels = channelsState[1];

    var inputBuffersState = useState([]);
    var inputBuffers = inputBuffersState[0];
    var setInputBuffers = inputBuffersState[1];

    var outputBuffersState = useState([]);
    var outputBuffersAsync = outputBuffersState[0];
    var setOutputBuffersAsync = outputBuffersState[1];

    var syncHistState = useState([]);
    var syncHistory = syncHistState[0];
    var setSyncHistory = syncHistState[1];

    var syncMetricsState = useState({ real: 0, total: 0 });
    var syncMetrics = syncMetricsState[0];
    var setSyncMetrics = syncMetricsState[1];

    var asyncHistState = useState([]);
    var asyncHistory = asyncHistState[0];
    var setAsyncHistory = asyncHistState[1];

    var asyncMetricsState = useState({ real: 0, total: 0 });
    var asyncMetrics = asyncMetricsState[0];
    var setAsyncMetrics = asyncMetricsState[1];

    // Frame counter para orden ascendente
    var frameCounterRef = useRef(0);
    
    // Track del índice de iteración para orden inverso de canales
    var channelIterRef = useRef(0);
    
    // Puntero de escaneo Round Robin (persistente entre ticks para ATDM real)
    var scanPointerRef = useRef(0);

    // Helper para binario
    function decimalToBinary(decimal, bits) {
        return decimal.toString(2).padStart(bits, '0');
    }

    // Reset
    function resetSim() {
        setIsRunning(false);
        setTick(0);
        frameCounterRef.current = 0;
        channelIterRef.current = 0;
        scanPointerRef.current = 0;
        
        var rawChannels = inputData.split(',').map(function(s) { return s.trim(); });
        var n = rawChannels.length;
        setNumChannels(n);
        
        var initialBuffers = rawChannels.map(function(str) {
            return str.split('').filter(function(c) { return c !== ""; });
        });
        setInputBuffers(initialBuffers);
        setOutputBuffersAsync(Array(n).fill(null).map(function() { return []; }));
        
        setSyncHistory([]);
        setAsyncHistory([]);
        setSyncMetrics({ real: 0, total: 0 });
        setAsyncMetrics({ real: 0, total: 0 });
    }

    // Init on mount/input change
    useEffect(function() {
        resetSim();
    }, [inputData, slotsPerFrame]);

    // Timer
    useEffect(function() {
        if (isRunning) {
            intervalRef.current = setInterval(function() {
                setTick(function(t) { return t + 1; });
            }, speed);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return function() { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, speed]);

    // Simulation Step
    useEffect(function() {
        if (tick === 0) return;

        // ASYNC - Lógica basada en ATDMSimulator.js (Round Robin persistente)
        var currentBuffers = inputBuffers;
        var nextBuffers = currentBuffers.map(function(b) { return b.slice(); });
        var numCh = nextBuffers.length;
        var asyncSlots = [];
        
        // Simular el llenado de slots uno por uno usando el puntero de escaneo
        for (var s = 0; s < slotsPerFrame; s++) {
            var scannedCount = 0;
            var slotFound = false;
            
            // Buscar siguiente canal con datos (Round Robin)
            while (scannedCount < numCh && !slotFound) {
                var chIdx = (scanPointerRef.current + scannedCount) % numCh;
                
                if (nextBuffers[chIdx] && nextBuffers[chIdx].length > 0) {
                    // Encontramos datos
                    var char = nextBuffers[chIdx].shift();
                    
                    asyncSlots.push({
                        type: 'async-data',
                        data: char,
                        addr: decimalToBinary(chIdx, Math.ceil(Math.log2(numChannels))),
                        chIdx: chIdx
                    });
                    
                    // Actualizar puntero para la próxima vez (siguiente canal)
                    scanPointerRef.current = (chIdx + 1) % numCh;
                    slotFound = true;
                } else {
                    scannedCount++;
                }
            }
            
            // Si escaneamos todos y no encontramos nada, terminamos este frame (quedará parcial o vacío)
            if (!slotFound) {
                // Avanzamos el puntero si no encontramos nada pero había datos globales (opcional, pero mantiene el giro)
                // En ATDMSimulator: if (!slotCreated && hasData) scanPointer = (scanPointer + 1) % num;
                // Aquí simplificamos: si no hay datos en NINGÚN canal, salimos del loop de slots
                var hasAnyData = nextBuffers.some(function(b) { return b.length > 0; });
                if (hasAnyData) {
                     scanPointerRef.current = (scanPointerRef.current + 1) % numCh;
                } else {
                     break; // No hay más datos en absoluto
                }
            }
        }

        // Si se generaron slots (o si el usuario quiere ver frames vacíos, pero ATDM suele ser bajo demanda)
        // En la visualización anterior siempre generábamos frame si había datos.
        if (asyncSlots.length > 0) {
            // Invertir orden: El primer canal encontrado (A) va al último slot visual
            asyncSlots.reverse();

            // Padding al inicio para alineación visual a la derecha (estilo solicitado previamente)
            while (asyncSlots.length < slotsPerFrame) {
                asyncSlots.unshift({ type: 'empty', data: '∅', addr: '-' });
            }

            frameCounterRef.current++;
            var newFrame = { 
                id: frameCounterRef.current, 
                slots: asyncSlots, 
                framingBit: frameCounterRef.current % 2 
            };

            setAsyncHistory(function(prev) { 
                var updated = prev.concat([newFrame]);
                if (updated.length > 10) updated = updated.slice(updated.length - 10);
                return updated;
            });

            var bitsNeeded = Math.ceil(Math.log2(numChannels));
            var realsCount = asyncSlots.filter(function(s) { return s.type === 'async-data'; }).length;
            var bitsRealThisFrame = realsCount * 8; 
            var bitsTotalThisFrame = (slotsPerFrame * 8) + (slotsPerFrame * bitsNeeded) + 1;
            
            setAsyncMetrics(function(prev) {
                return { 
                    real: prev.real + bitsRealThisFrame, 
                    total: prev.total + bitsTotalThisFrame 
                };
            });

            // Output buffers
            setOutputBuffersAsync(function(prevOut) {
                var nextOut = prevOut.map(function(b) { return b.slice(); });
                asyncSlots.forEach(function(slot) {
                    if (slot.type === 'async-data' && nextOut[slot.chIdx]) {
                        nextOut[slot.chIdx].push(slot.data);
                    }
                });
                return nextOut;
            });
            
            // Actualizar buffers de entrada
            setInputBuffers(nextBuffers);
        }


        // SYNC - Simulación paralela
        var rawChannels = inputData.split(',').map(function(s) { return s.trim(); });
        var charIdx = tick - 1;
        var maxLen = Math.max.apply(null, rawChannels.map(function(c) { return c.length; }));
        
        if (charIdx < maxLen) {
            var syncSlots = [];
            var realCount = 0;
            // Número de canales para sync
            var numCh = rawChannels.length;
            
            // ORDEN INVERSO: De último canal a primero
            for (var i = numCh - 1; i >= 0; i--) {
                var char = rawChannels[i] ? rawChannels[i][charIdx] : undefined;
                var hasData = char !== undefined && char !== "";
                syncSlots.push({
                    type: hasData ? 'sync-data' : 'empty',
                    data: hasData ? char : '∅',
                    addr: 'CH' + i
                });
                if (hasData) realCount++;
            }
            var newSyncFrame = { id: tick, slots: syncSlots, framingBit: tick % 2, totalSlots: numCh };
            setSyncHistory(function(prev) { 
                var updated = prev.concat([newSyncFrame]);
                if (updated.length > 10) updated = updated.slice(updated.length - 10);
                return updated;
            });
            // Bits Síncrono:
            // Reales: Solo datos (8 bits)
            // Total: (NumCanales * 8) + 1 bit framing
            var bitsRealSync = realCount * 8;
            var bitsTotalSync = (numCh * 8) + 1; 
            setSyncMetrics(function(prev) {
                return { 
                    real: prev.real + bitsRealSync, 
                    total: prev.total + bitsTotalSync 
                };
            });
        }
    }, [tick]);

    // Calcular bits de dirección
    var bitsDir = Math.max(1, Math.ceil(Math.log2(numChannels + 1)));

    // Contar dispositivos con datos y vacíos
    var rawChannelsDisplay = inputData.split(',').map(function(s) { return s.trim(); });
    var conDatos = rawChannelsDisplay.filter(function(s) { return s.length > 0; }).length;
    var vacios = rawChannelsDisplay.length - conDatos;
    
    // Determinar si el slider debe estar bloqueado (cuando m = n)
    var sliderBlocked = slotsPerFrame >= numChannels;

    // RENDER
    return React.createElement('div', { className: 'app-container' },
        
        // SIDEBAR
        React.createElement('div', { className: 'sidebar' },
            React.createElement('div', { className: 'sidebar-title' },
                React.createElement('i', { className: 'fas fa-sliders-h', style: { color: '#6366f1' } }),
                ' Configuración'
            ),
            
            // Parámetros del Sistema
            React.createElement('div', { className: 'control-card' },
                React.createElement('div', { className: 'section-header' },
                    React.createElement('div', { className: 'section-header-title' },
                        React.createElement('i', { className: 'fas fa-cog' }),
                        'Parámetros del Sistema'
                    ),
                    React.createElement('i', { className: 'fas fa-chevron-down', style: { color: '#94a3b8' } })
                ),
                
                // Canales (n)
                React.createElement('div', { className: 'slider-row' },
                    React.createElement('span', { className: 'slider-label' },
                        'Canales (n) ',
                        React.createElement('i', { className: 'fas fa-info-circle', style: { color: '#94a3b8', fontSize: '0.7rem' } })
                    ),
                    React.createElement('span', { className: 'slider-badge' }, numChannels)
                ),
                React.createElement('div', { className: 'slider-hint' }, 'Bits de dirección: ' + bitsDir),
                
                // Slots por Trama (m)
                React.createElement('div', { className: 'slider-row' },
                    React.createElement('span', { className: 'slider-label' },
                        'Slots por Trama (m) ',
                        React.createElement('i', { className: 'fas fa-info-circle', style: { color: '#94a3b8', fontSize: '0.7rem' } })
                    ),
                    React.createElement('span', { className: 'slider-badge' }, slotsPerFrame)
                ),
                React.createElement('input', {
                    type: 'range',
                    className: 'range-input' + (sliderBlocked ? ' slider-locked' : ''),
                    min: 1, max: numChannels, step: 1,
                    value: Math.min(slotsPerFrame, numChannels),
                    onChange: function(e) { 
                        var newVal = parseInt(e.target.value) || 3;
                        if (newVal <= numChannels) setSlotsPerFrame(newVal); 
                    },
                    disabled: isRunning || sliderBlocked
                }),
                React.createElement('div', { className: 'slider-hint' + (sliderBlocked ? ' slider-warning' : '') }, 
                    sliderBlocked ? '🔒 m = n (máximo alcanzado)' : 'm ≤ n (Multiplexación Estadística)'
                ),
                
                // Velocidad
                React.createElement('div', { className: 'slider-row' },
                    React.createElement('span', { className: 'slider-label' },
                        'Velocidad ',
                        React.createElement('i', { className: 'fas fa-info-circle', style: { color: '#94a3b8', fontSize: '0.7rem' } })
                    ),
                    React.createElement('span', { className: 'slider-badge' }, speed + 'ms')
                ),
                React.createElement('input', {
                    type: 'range',
                    className: 'range-input',
                    min: 200, max: 2000, step: 100,
                    value: speed,
                    onChange: function(e) { setSpeed(Number(e.target.value)); }
                }),
                React.createElement('div', { className: 'slider-hint' }, 
                    speed <= 500 ? '⚡ Muy rápido' : speed <= 1000 ? '🚀 Rápido' : '🐢 Lento'
                )
            ),
            
            // Datos de Simulación
            React.createElement('div', { className: 'control-card' },
                React.createElement('div', { className: 'section-header' },
                    React.createElement('div', { className: 'section-header-title' },
                        React.createElement('i', { className: 'fas fa-edit', style: { color: '#10b981' } }),
                        'Datos de Simulación'
                    ),
                    React.createElement('i', { className: 'fas fa-chevron-down', style: { color: '#94a3b8' } })
                ),
                
                React.createElement('div', { className: 'input-group' },
                    React.createElement('div', { className: 'input-label' },
                        'Datos de Entrada',
                        React.createElement('i', { className: 'fas fa-check-circle checkmark' })
                    ),
                    React.createElement('textarea', {
                        className: 'text-area-styled',
                        value: inputData,
                        onChange: function(e) { setInputData(e.target.value); },
                        disabled: isRunning
                    }),
                    React.createElement('div', { className: 'input-status-text' },
                        conDatos + ' dispositivos con datos, ' + vacios + ' vacíos'
                    )
                ),
                
                React.createElement('button', {
                    className: isRunning ? 'btn-block btn-reset' : 'btn-block btn-primary',
                    onClick: function() { setIsRunning(!isRunning); }
                },
                    React.createElement('i', { className: isRunning ? 'fas fa-stop' : 'fas fa-play' }),
                    isRunning ? ' Detener' : ' Iniciar'
                ),
                
                React.createElement('button', {
                    className: 'btn-block btn-reset',
                    onClick: resetSim
                },
                    React.createElement('i', { className: 'fas fa-redo' }),
                    ' Reiniciar'
                )
            ),
            
            // Métricas Asíncrono
            React.createElement('div', { className: 'metrics-card' },
                React.createElement('div', { className: 'metrics-title' },
                    React.createElement('i', { className: 'fas fa-layer-group', style: { color: '#6366f1', marginRight: '8px' } }),
                    'Asíncrono (ATDM)'
                ),
                React.createElement('div', { className: 'metric-row' },
                    React.createElement('span', null, 'Bits Totales:'),
                    React.createElement('span', { className: 'metric-value' }, asyncMetrics.total)
                ),
                React.createElement('div', { className: 'metric-row' },
                    React.createElement('span', null, 'Bits Reales:'),
                    React.createElement('span', { className: 'metric-value', style: { color: '#10b981' } }, asyncMetrics.real)
                )
            ),
            
            // Métricas Síncrono
            React.createElement('div', { className: 'metrics-card' },
                React.createElement('div', { className: 'metrics-title' },
                    React.createElement('i', { className: 'fas fa-bolt', style: { color: '#818cf8', marginRight: '8px' } }),
                    'Síncrono (STDM)'
                ),
                React.createElement('div', { className: 'metric-row' },
                    React.createElement('span', null, 'Bits Totales:'),
                    React.createElement('span', { className: 'metric-value' }, syncMetrics.total)
                ),
                React.createElement('div', { className: 'metric-row' },
                    React.createElement('span', null, 'Bits Reales:'),
                    React.createElement('span', { className: 'metric-value', style: { color: '#10b981' } }, syncMetrics.real)
                ),
                React.createElement('div', { className: 'metric-row' },
                    React.createElement('span', null, 'Núm. Slots/Trama:'),
                    React.createElement('span', { className: 'metric-value', style: { color: '#6366f1' } }, numChannels)
                )
            )
        ),

        // MAIN CONTENT
        React.createElement('div', { className: 'main-content' },
            React.createElement(BufferRow, { buffers: inputBuffers, title: 'Buffers de Entrada' }),
            React.createElement(ArrowMove, null),
            React.createElement(Device, { type: 'mux', label: 'MULTIPLEXOR' }),
            React.createElement(ArrowMove, null),
            
            // Historial Async
            React.createElement('div', { className: 'hist-card' },
                React.createElement('h3', null,
                    React.createElement('i', { className: 'fas fa-layer-group', style: { color: '#6366f1' } }),
                    ' Historial de Tramas (Asíncrono)'
                ),
                React.createElement('div', { className: 'history-list' },
                    asyncHistory.length === 0
                        ? React.createElement('p', { style: { textAlign: 'center', color: '#94a3b8' } }, 'Esperando tramas...')
                        : asyncHistory.map(function(frame) {
                            return React.createElement(HistoryFrame, {
                                key: 'async' + frame.id,
                                id: frame.id,
                                slots: frame.slots,
                                framingBit: frame.framingBit
                            });
                        })
                )
            ),
            
            // Historial Sync
            React.createElement('div', { className: 'hist-card' },
                React.createElement('h3', null,
                    React.createElement('i', { className: 'fas fa-bolt', style: { color: '#818cf8' } }),
                    ' Historial de Tramas (Síncrono)'
                ),
                React.createElement('div', { className: 'history-list' },
                    syncHistory.length === 0
                        ? React.createElement('p', { style: { textAlign: 'center', color: '#94a3b8' } }, 'Esperando tramas...')
                        : syncHistory.map(function(frame) {
                            return React.createElement(HistoryFrame, {
                                key: 'sync' + frame.id,
                                id: frame.id,
                                slots: frame.slots,
                                framingBit: frame.framingBit,
                                totalSlots: frame.totalSlots || numChannels
                            });
                        })
                )
            ),
            
            React.createElement(ArrowMove, null),
            React.createElement(Device, { type: 'demux', label: 'DEMULTIPLEXOR' }),
            React.createElement(ArrowMove, null),
            React.createElement(BufferRow, { buffers: outputBuffersAsync, title: 'Buffers de Salida (Recepción)' })
        )
    );
}

// RENDER
var rootElement = document.getElementById('root');
if (rootElement) {
    try {
        var root = ReactDOM.createRoot(rootElement);
        root.render(React.createElement(ComparisonFullApp, null));
        console.log("TDM Comparison App Loaded Successfully");
    } catch (e) {
        console.error("Render Error:", e);
        rootElement.innerHTML = '<div style="color:red;padding:20px;"><h3>Error</h3><pre>' + e.message + '</pre></div>';
    }
}
