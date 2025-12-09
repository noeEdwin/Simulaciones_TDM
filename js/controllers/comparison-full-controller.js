
const { useState, useEffect, useRef, useCallback, useMemo } = React;

// =======================================
// PART 1: SYNC TDM COMPONENTS
// Adapted from js/synchronous/react-animation-sincrono.js
// =======================================

function SyncInputChannels({ channels, activeChannel }) {
    return React.createElement('div', { className: 'input-channels-grid' },
        channels.map((channel, index) =>
            React.createElement('div', {
                key: `input-${index}`,
                className: `channel-card ${activeChannel === index ? 'active' : ''}`
            },
                React.createElement('div', { className: 'channel-header' },
                    React.createElement('span', { className: 'channel-number' }, index + 1),
                    React.createElement('span', { className: 'channel-label' }, `Canal ${index + 1}`)
                ),
                React.createElement('div', { className: 'channel-visual' },
                    React.createElement('div', { className: 'wave-indicator' }),
                    React.createElement('div', { className: 'data-display' }, channel.data)
                ),
                React.createElement('div', {
                    className: `status-indicator ${activeChannel === index ? 'active' : ''}`
                })
            )
        )
    );
}

function SyncMultiplexer({ isActive, activeChannel }) {
    return React.createElement('div', { className: 'multiplexer-modern' },
        React.createElement('div', { className: 'mux-container' },
            React.createElement('div', {
                className: `mux-core ${isActive ? 'active' : ''}`
            },
                React.createElement('div', { className: 'mux-icon' }, '⚡'),
                React.createElement('div', { className: 'mux-label' }, 'MUX'),
                React.createElement('div', { className: 'mux-status' },
                    isActive ? `CH${activeChannel + 1}` : 'ESPERA'
                )
            ),
            React.createElement('div', { className: 'signal-flow' },
                React.createElement('div', { className: 'flow-indicator' })
            )
        )
    );
}

function SyncFrameVisualization({ channels, currentSlot, currentFrame, numChannels }) {
    // Basic visualization of current frame slot
    const currentTramaIndex = Math.floor(currentFrame / numChannels);
    return React.createElement('div', { className: 'frame-visualization' },
        React.createElement('h3', { className: 'frame-title' },
            'Trama Actual - Ciclo ', currentTramaIndex + 1
        ),
        React.createElement('div', { className: 'frame-slots' },
            channels.map((channel, index) => {
                const isActive = currentSlot === index;
                const hasData = currentTramaIndex < channel.data.length;
                const bitToShow = hasData ? channel.data[currentTramaIndex] : '';
                return React.createElement('div', {
                    key: `slot-${index}`,
                    className: `frame-slot ${isActive ? 'active' : ''} ${hasData ? 'has-data' : ''}`
                },
                    React.createElement('div', { className: 'slot-header' },
                        React.createElement('span', { className: 'channel-id' }, `C${index + 1}`),
                        isActive && React.createElement('div', { className: 'active-pulse' })
                    ),
                    React.createElement('div', { className: 'slot-content' },
                        React.createElement('div', { className: 'bit-display' }, bitToShow),
                        !hasData && React.createElement('div', { className: 'empty-indicator' }, '—')
                    )
                );
            })
        )
    );
}

// --- New Components for Sync Completeness ---

function SyncDemultiplexer({ isActive, activeChannel }) {
    return React.createElement('div', { className: 'multiplexer-modern', style: { marginTop: '20px' } },
        React.createElement('div', { className: 'mux-container' },
            React.createElement('div', {
                className: `mux-core ${isActive ? 'active' : ''}`,
                style: { background: 'var(--primary-purple)', boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)' } // Purple for Demux
            },
                React.createElement('div', { className: 'mux-icon' }, '⚡'),
                React.createElement('div', { className: 'mux-label' }, 'DEMUX'),
                React.createElement('div', { className: 'mux-status' },
                     isActive ? `CH${activeChannel + 1}` : 'ESPERA'
                )
            )
        )
    );
}

function SyncFrameHistory({ savedFrames }) {
    return React.createElement('div', { className: 'frame-list-container' },
        React.createElement('h3', { className: 'frame-list-title' }, 'Tramas Completadas'),
        React.createElement('div', { className: 'frames-grid' },
             savedFrames.length === 0 ? 
             React.createElement('p', { style:{textAlign:'center', color:'#94a3b8'} }, 'Las tramas aparecerán aquí...') :
             savedFrames.map(frame => 
                 React.createElement('div', { key: frame.index, className: 'frame-item completed' },
                     React.createElement('div', { className: 'frame-header' },
                         React.createElement('span', { className: 'frame-number' }, `Trama ${frame.index + 1}`),
                         React.createElement('span', { className: 'frame-time' }, frame.timestamp)
                     ),
                     React.createElement('div', { className: 'frame-slots-mini' },
                         frame.slots.map((slot, i) => 
                             React.createElement('div', { key: i, className: `slot-mini ${slot.data ? 'has-data' : 'empty'}` },
                                 React.createElement('span', { className: 'slot-channel' }, `C${slot.channel}`),
                                 React.createElement('span', { className: 'slot-data' }, slot.data || '—')
                             )
                         )
                     )
                 )
             )
        )
    );
}

function SyncOutputChannels({ channels, activeChannel }) {
      return React.createElement('div', { className: 'output-channels-grid', style: { marginTop: '20px' } },
        channels.map((channel, index) => {
            const receivedData = channel.data.substring(0, channel.currentBit);
            return React.createElement('div', {
                key: `out-${index}`,
                className: `channel-card ${activeChannel === index ? 'active' : ''}`
            },
                React.createElement('div', { className: 'channel-header' },
                    React.createElement('span', { className: 'channel-number' }, index + 1),
                    React.createElement('span', { className: 'channel-label' }, `Salida ${index + 1}`)
                ),
                React.createElement('div', { className: 'channel-visual', style: { background: '#f0fdf4' } }, // Greenish for output
                    React.createElement('div', { className: 'data-display', style: { color: '#15803d' } }, receivedData)
                )
            )
        })
    );
}

function SyncStatsPanel({ stats, numChannels, maxFrames, savedFrames, inputData }) {
    // Calculate Sync Metrics
    const calculateMetrics = () => {
         // ... (existing metric logic) ...
         const dataParts = inputData.split(',').map(d => d.trim().substring(0, 8));
         let bitsExtras = 0; // Wasted slots
         let bitsSobrecarga = 0; // Sync bits
         const completedFrames = savedFrames.length;
         
         if (savedFrames.length > 0) {
             savedFrames.forEach(frame => {
                 if (frame.slots) {
                     frame.slots.forEach(slot => {
                         if (!slot.data || slot.data === '' || slot.data === ' ') bitsExtras += 8;
                     });
                 }
                 bitsSobrecarga += 1;
             });
         }
         
         const bitsPorTrama = (numChannels * 8) + 1;
         const bitsTotales = completedFrames * bitsPorTrama;
         const bitsUtiles = bitsTotales - bitsExtras - bitsSobrecarga;
         const efficiency = bitsTotales > 0 ? ((bitsUtiles / bitsTotales) * 100).toFixed(1) : 0;
         
         return { bitsTotales, bitsUtiles, efficiency, bitsExtras };
    };
    
    const metrics = calculateMetrics();

    return React.createElement('div', { className: 'stats-modern' },
        React.createElement('div', { className: 'stats-grid' },
            React.createElement('div', { className: 'stat-card stat-primary' },
                React.createElement('h4', {}, 'Eficiencia'),
                React.createElement('div', { className: 'stat-value' }, `${metrics.efficiency}%`)
            ),
             React.createElement('div', { className: 'stat-card stat-warning' },
                React.createElement('h4', {}, 'Bits Espurios (Vacíos)'),
                React.createElement('div', { className: 'stat-value' }, metrics.bitsExtras)
            ),
             React.createElement('div', { className: 'stat-card stat-accent' },
                React.createElement('h4', {}, 'Bits Totales'),
                React.createElement('div', { className: 'stat-value' }, metrics.bitsTotales)
            )
        )
    );
}

function SyncTDMSection({ inputData, speed, isRunning, isPaused, onLoad }) {
    const [numChannels, setNumChannels] = useState(4);
    const [channels, setChannels] = useState([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [savedFrames, setSavedFrames] = useState([]);
    const [stats, setStats] = useState({ bytesProcessed: 0, currentSlot: 0 });
    const [maxFrames, setMaxFrames] = useState(0);
    const animationInterval = useRef(null);

    // Initialization
    useEffect(() => {
        const dataParts = inputData.split(',').map(d => d.trim().substring(0, 8));
        setNumChannels(dataParts.length);
        const maxLength = Math.max(...dataParts.map(p => p.length));
        setMaxFrames(maxLength);
        
        const newChannels = dataParts.map((part, i) => ({
            id: i + 1,
            data: part || '',
            currentBit: 0
        }));
        setChannels(newChannels);
        
        // Reset on new input
        setCurrentFrame(0);
        setSavedFrames([]);
        setStats({ bytesProcessed: 0, currentSlot: 0 });
    }, [inputData]);

    const saveCompletedFrame = useCallback((frameIndex) => {
        const dataParts = inputData.split(',').map(d => d.trim().substring(0, 8));
        const completedFrame = {
            index: frameIndex,
            timestamp: new Date().toLocaleTimeString(),
            slots: []
        };
        for (let i = 0; i < dataParts.length; i++) {
             const word = dataParts[i] || '';
             const char = frameIndex < word.length ? word[frameIndex] : '';
             completedFrame.slots.push({ channel: i + 1, data: char });
        }
        setSavedFrames(prev => [...prev.filter(f => f.index !== frameIndex), completedFrame]);
    }, [inputData]);

    // Animation Tick
    const animateFrame = useCallback(() => {
        setCurrentFrame(prev => {
            const numCh = channels.length;
            const activeChannel = prev % numCh;
            const currentTrama = Math.floor(prev / numCh);

            if (currentTrama >= maxFrames && maxFrames > 0) return prev;

            // Save frame on cycle complete
            if (activeChannel === numCh - 1) {
                if (currentTrama < maxFrames) saveCompletedFrame(currentTrama);
            }

            return prev + 1;
        });
    }, [channels.length, maxFrames, saveCompletedFrame]);

    // Control Loop
    useEffect(() => {
        if (isRunning && !isPaused) {
            animationInterval.current = setInterval(animateFrame, speed);
        } else {
            clearInterval(animationInterval.current);
        }
        return () => clearInterval(animationInterval.current);
    }, [isRunning, isPaused, speed, animateFrame]);

    const activeChannel = currentFrame % (channels.length || 1);

    return React.createElement('div', { className: 'sync-visualization-root' },
        React.createElement('div', { className: 'animation-container' },
            React.createElement(SyncInputChannels, { channels, activeChannel }),
            React.createElement(SyncMultiplexer, { isActive: isRunning, activeChannel }),
            React.createElement(SyncFrameVisualization, { channels, currentSlot: activeChannel, currentFrame, numChannels: channels.length }),
            
            // New Full Features
            React.createElement(SyncDemultiplexer, { isActive: isRunning, activeChannel }),
            React.createElement(SyncOutputChannels, { channels, activeChannel }),
            React.createElement(SyncFrameHistory, { savedFrames }),

            React.createElement(SyncStatsPanel, { 
                stats, 
                numChannels: channels.length, 
                maxFrames, 
                savedFrames, 
                inputData 
            })
        )
    );
}


// =======================================
// PART 2: ASYNC TDM COMPONENTS
// Adapted from views/asynchronous/asincrono.html
// =======================================

// --- New Components for Async Completeness ---

function AsyncDemultiplexer({ isActive, activeChannel }) {
    return React.createElement('div', { className: 'processor-block', style: { margin: '20px 0', borderColor: 'var(--async-primary)' } },
        React.createElement('div', { className: 'processor-label' }, 'DEMUX ESTADÍSTICO'),
        isActive && React.createElement('div', { className: 'mux-status', style:{fontSize:'0.8rem'} }, `Procesando...`)
    );
}

function AsyncOutputChannels({ channels, displayData }) {
    return React.createElement('div', { className: 'buffers-grid', style: { marginTop: '20px' } },
        channels.map((channel, i) =>
             React.createElement('div', { key: i, className: 'buffer-card' },
                 React.createElement('div', { className: 'buffer-header' }, `Salida ${i+1}`),
                 React.createElement('div', { className: 'buffer-content', style: { color: 'var(--async-primary)' } }, 
                    displayData[i] || '—'
                 )
             )
        )
    );
}

function AsyncTDMSection({ inputData, speed, isRunning, isPaused }) {
    const [simulator, setSimulator] = useState(null);
    const [framesHistory, setFramesHistory] = useState([]);
    const [inputBuffers, setInputBuffers] = useState([]);
    const [outputBuffers, setOutputBuffers] = useState([]);
    const [stats, setStats] = useState(null);
    const [eventLog, setEventLog] = useState([]);
    const intervalRef = useRef(null);
    
    // Derived state for output display
    const dataParts = inputData.split(',').map(d => d.trim());
    const [reconstructedData, setReconstructedData] = useState(dataParts.map(() => ""));

    const numChannels = useMemo(() => inputData.split(',').length, [inputData]);
    const frameSize = Math.min(3, numChannels); 

    // Init Simulator
    useEffect(() => {
        const sim = new ATDMSimulator(numChannels, frameSize);
        sim.loadData(inputData);
        setSimulator(sim);
        setInputBuffers(sim.getInputBuffers());
        setOutputBuffers(sim.getOutputBuffers());
        setStats(sim.getStats());
        setFramesHistory([]);
        setReconstructedData(dataParts.map(() => "")); // Reset outputs
    }, [inputData, numChannels, frameSize]);

    // Animation Step
    const animationStep = useCallback(() => {
        if (!simulator) return;
        const frame = simulator.stepMux();
        if (frame) {
            setFramesHistory(prev => [...prev, frame]);
            simulator.stepDemux(frame); // This updates simulator logic
            
            // Visual output reconstruction simulation
            // In real Async TDM, we get chunks. Here we simulate gradual arrival.
            const outputs = simulator.getOutputBuffers();
            setReconstructedData(prev => outputs); // Update from simulator outputs
        }
        setInputBuffers(simulator.getInputBuffers());
        setOutputBuffers(simulator.getOutputBuffers());
        setStats(simulator.getStats());
    }, [simulator]);


    // Control Loop
    useEffect(() => {
        if (isRunning && !isPaused && simulator && !simulator.isComplete()) {
            intervalRef.current = setInterval(animationStep, speed);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning, isPaused, simulator, speed, animationStep]);

    return React.createElement('div', { className: 'visualization-main-modern' },
        React.createElement('div', { className: 'flow-diagram' },
            React.createElement('div', { className: 'flow-container' },
                // Buffers
                React.createElement('div', { className: 'buffers-grid' },
                    inputBuffers.map((buffer, i) =>
                         React.createElement('div', { key: i, className: 'buffer-card' },
                             React.createElement('div', { className: 'buffer-header' }, `C${i+1}`, React.createElement('span', {}, buffer.length)),
                             React.createElement('div', { className: 'buffer-content' }, buffer || '∅')
                         )
                    )
                ),
                // Mux
                React.createElement('div', { className: `processor-block ${isRunning ? 'active' : ''}`, style: { margin: '20px 0' } },
                    React.createElement('div', { className: 'processor-label' }, 'MUX ESTADÍSTICO')
                ),
                // Frames

                React.createElement('div', { className: 'frame-history-card' },
                    React.createElement('div', { className: 'frames-scroll' },
                         framesHistory.length === 0 ? 'Esperando...' : 
                         framesHistory.map((frame, i) => {
                             const reversed = [...frame].reverse();
                             return React.createElement('div', { key: i, className: 'frame-item' },
                                 React.createElement('div', { className: 'frame-slots-unified' },
                                     reversed.map((slot, idx) => 
                                         React.createElement('div', { key: idx, className: 'frame-slot-unified' }, 
                                            `[${slot.data}|${slot.binaryAddress}]`
                                         )
                                     )
                                 )
                             );
                         })
                    )
                ),
                // Async Demux
                React.createElement(AsyncDemultiplexer, { isActive: isRunning }),
                // Async Outputs
                React.createElement(AsyncOutputChannels, { channels: inputBuffers, displayData: reconstructedData })
            )
        ),
        // Stats
        stats && React.createElement('div', { className: 'stats-modern', style: { marginTop: '20px' } },
            React.createElement('div', { className: 'stats-grid' },
                React.createElement('div', { className: 'stat-card stat-success' },
                    React.createElement('h4', {}, 'Eficiencia'),
                    React.createElement('div', { className: 'stat-value' }, `${stats.efficiency}%`)
                ),
                React.createElement('div', { className: 'stat-card stat-primary' },
                    React.createElement('h4', {}, 'Bits Útiles'),
                    React.createElement('div', { className: 'stat-value' }, stats.realBits)
                ),
                React.createElement('div', { className: 'stat-card stat-warning' },
                     React.createElement('h4', {}, 'Bits Totales'),
                     React.createElement('div', { className: 'stat-value' }, stats.totalBits)
                 )
            )
        )
    );
}

// =======================================
// PART 3: MASTER CONTROLLER
// =======================================

function ComparisonApp() {
    const [inputData, setInputData] = useState("A,B,,D,E");
    const [speed, setSpeed] = useState(1000);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    // Theme State
    const [theme, setTheme] = useState('light');

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const toggleRun = () => {
        if (isRunning) {
            setIsPaused(!isPaused);
        } else {
            setIsRunning(true);
            setIsPaused(false);
        }
    };

    const stop = () => {
        setIsRunning(false);
        setIsPaused(false);
    };

    return React.createElement('div', {},
        // MASTER CONTROL BAR
        React.createElement('div', { className: 'master-control-bar' },
            React.createElement('div', { className: 'master-brand' },
                React.createElement('h1', { style: { fontSize: '1.2rem', margin: 0 } }, 'COMPARATIVA TDM'), // Reduced font size
                React.createElement('span', { style: { fontSize: '0.8rem', opacity: 0.7 } }, 'Síncrono vs Asíncrono')
            ),
            React.createElement('div', { className: 'master-controls' },
                // Theme Toggle
                React.createElement('button', {
                    className: 'theme-btn',
                    style: { marginRight: '20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' },
                    onClick: toggleTheme,
                    title: `Cambiar a modo ${theme === 'light' ? 'Oscuro' : 'Claro'}`
                }, theme === 'light' ? '🌙' : '☀️'),

                React.createElement('div', { className: 'control-group' },
                    React.createElement('label', {}, 'Datos de Entrada'),
                    React.createElement('input', {
                        className: 'master-input',
                        value: inputData,
                        onChange: (e) => !isRunning && setInputData(e.target.value),
                        disabled: isRunning
                    })
                ),
                React.createElement('div', { className: 'control-group' },
                     React.createElement('label', {}, `Velocidad: ${speed}ms`),
                     React.createElement('input', {
                         type: 'range', min: 200, max: 2000, step: 100,
                         value: speed,
                         onChange: (e) => setSpeed(Number(e.target.value))
                     })
                ),
                React.createElement('button', {
                    className: `start-btn ${isRunning ? (isPaused ? 'paused' : 'running') : ''}`,
                    onClick: toggleRun
                }, 
                    isRunning ? (isPaused ? 'REANUDAR' : 'PAUSAR') : 'INICIAR SIMULACIÓN'
                ),
                isRunning && React.createElement('button', {
                    className: 'start-btn stop',
                    onClick: stop
                }, 'DETENER'),
                React.createElement('a', { href: '../../index.html', className: 'return-link' },
                    React.createElement('i', { className: 'fas fa-home' }),
                    'Salir'
                )
            )
        ),

        // SPLIT LAYOUT CONTAINER
        React.createElement('div', { className: 'comparison-grid-container' },
            // SYNC SECTION
            React.createElement('div', { className: 'comparison-section sync-section' },
                React.createElement('div', { className: 'section-header-full' },
                    React.createElement('div', { className: 'section-badge' }, 'Método Clásico'),
                    React.createElement('div', { className: 'section-title' },
                        React.createElement('h2', {}, 'TDM Síncrono')
                    )
                ),
                React.createElement(SyncTDMSection, { inputData, speed, isRunning, isPaused })
            ),

            // ASYNC SECTION
            React.createElement('div', { className: 'comparison-section async-section' },
                React.createElement('div', { className: 'section-header-full' },
                    React.createElement('div', { className: 'section-badge' }, 'Método Moderno'),
                    React.createElement('div', { className: 'section-title' },
                        React.createElement('h2', {}, 'TDM Asíncrono')
                    )
                ),
                React.createElement(AsyncTDMSection, { inputData, speed, isRunning, isPaused })
            )
        )
    );
}

ReactDOM.render(React.createElement(ComparisonApp), document.getElementById('root'));
