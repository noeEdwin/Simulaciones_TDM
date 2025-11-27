// ===== COMPONENTE PRINCIPAL DE ANIMACIÓN TDM MODERNO =====

const { useState, useEffect, useRef, useCallback } = React;

// Componente moderno para canales de entrada
function ModernInputChannels({ channels, activeChannel }) {
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

// Componente moderno para el multiplexor
function ModernMultiplexer({ isActive, activeChannel }) {
    return React.createElement('div', { className: 'multiplexer-modern' },
        React.createElement('div', { className: 'mux-container' },
            React.createElement('div', {
                className: `mux-core ${isActive ? 'active' : ''}`
            },
                React.createElement('div', { className: 'mux-icon' }, '⚡'),
                React.createElement('div', { className: 'mux-label' }, 'MUX'),
                React.createElement('div', { className: 'mux-status' },
                    isActive ? `CH${activeChannel + 1}`: '(Multiplexación)'
                )
            ),
            React.createElement('div', { className: 'signal-flow' },
                React.createElement('div', { className: 'flow-indicator' })
            )
        )
    );
}

// Componente para mostrar lista de tramas guardadas
function ModernFrameList({ frames, currentFrame }) {
    // Siempre mostrar las tramas, sin importar si hay animación en curso o no
    // Siempre que haya tramas guardadas, se deben mostrar
    const hasFrames = frames.length > 0;
    const hasCurrentFrame = currentFrame >= 0;

    // Separar trama actual de tramas completadas
    const currentFrameData = hasCurrentFrame ? frames.find(f => f.index === currentFrame) : null;

    // Si hay animación en curso, mostrar tramas completadas separadas
    // Si no hay animación pero hay tramas guardadas, mostrar todas como completadas
    const completedFrames = hasCurrentFrame
        ? frames.filter(f => f.index !== currentFrame).sort((a, b) => a.index - b.index)
        : frames.sort((a, b) => a.index - b.index);

    return React.createElement('div', { className: 'frame-list-container' },
        React.createElement('h3', { className: 'frame-list-title' },
            hasCurrentFrame ? 'Tramas Generadas' : (hasFrames ? 'Tramas Completadas (Animación Finalizada)' : 'Tramas Completadas')
        ),

        // Trama actual (solo si existe)
        currentFrameData && React.createElement('div', { className: 'frames-grid' },
            React.createElement('div', {
                key: `current-${currentFrameData.index}`,
                className: 'frame-item current'
            },
                React.createElement('div', { className: 'frame-header' },
                    React.createElement('span', { className: 'frame-number' }, `Trama ${currentFrameData.index + 1} (Actual)`),
                    React.createElement('span', { className: 'frame-time' }, currentFrameData.timestamp),
                    React.createElement('div', { className: 'current-indicator' }, '🔴 ACTUAL')
                ),
                React.createElement('div', { className: 'frame-slots-mini' },
                    currentFrameData.slots.map((slot, slotIndex) =>
                        React.createElement('div', {
                            key: `slot-${slotIndex}`,
                            className: `slot-mini ${slot.data ? 'has-data' : 'empty'} ${slot.isActive ? 'active' : ''}`
                        },
                            React.createElement('span', { className: 'slot-channel' }, `C${slot.channel}`),
                            React.createElement('span', { className: 'slot-data' }, slot.data || '—'),
                            slot.isActive && React.createElement('div', { className: 'slot-active-indicator' })
                        )
                    )
                ),
                React.createElement('div', { className: 'frame-complete-data' },
                    React.createElement('strong', {}, 'Datos actuales: '),
                    React.createElement('code', {}, currentFrameData.slots.map(s => s.data || '_').join(' | '))
                )
            )
        ),

        // Tramas completadas (solo mostrar si hay animación en curso)
        completedFrames.length > 0 && hasCurrentFrame && React.createElement('div', { style: { marginTop: '2rem' } },
            React.createElement('h4', { className: 'frame-list-title', style: { fontSize: '1.1rem', marginBottom: '1rem' } },
                `Tramas Completadas (${completedFrames.length})`
            ),
            React.createElement('div', { className: 'frames-grid' },
                completedFrames.map((frame) =>
                    React.createElement('div', {
                        key: `completed-${frame.index}`,
                        className: 'frame-item completed'
                    },
                        React.createElement('div', { className: 'frame-header' },
                            React.createElement('span', { className: 'frame-number' }, `Trama ${frame.index + 1}`),
                            React.createElement('span', { className: 'frame-time' }, frame.timestamp)
                        ),
                        React.createElement('div', { className: 'frame-slots-mini' },
                            frame.slots.map((slot, slotIndex) =>
                                React.createElement('div', {
                                    key: `slot-${slotIndex}`,
                                    className: `slot-mini ${slot.data ? 'has-data' : 'empty'}`
                                },
                                    React.createElement('span', { className: 'slot-channel' }, `C${slot.channel}`),
                                    React.createElement('span', { className: 'slot-data' }, slot.data || '—')
                                )
                            )
                        ),
                        React.createElement('div', { className: 'frame-complete-data' },
                            React.createElement('strong', {}, 'Datos completos: '),
                            React.createElement('code', {}, frame.slots.map(s => s.data || '_').join(' | '))
                        )
                    )
                )
            )
        ),

        // Todas las tramas cuando no hay animación en curso
        !hasCurrentFrame && completedFrames.length > 0 && React.createElement('div', { className: 'frames-grid' },
            completedFrames.map((frame) =>
                React.createElement('div', {
                    key: `saved-${frame.index}`,
                    className: 'frame-item completed'
                },
                    React.createElement('div', { className: 'frame-header' },
                        React.createElement('span', { className: 'frame-number' }, `Trama ${frame.index + 1}`),
                        React.createElement('span', { className: 'frame-time' }, frame.timestamp)
                    ),
                    React.createElement('div', { className: 'frame-slots-mini' },
                        frame.slots.map((slot, slotIndex) =>
                            React.createElement('div', {
                                key: `slot-${slotIndex}`,
                                className: `slot-mini ${slot.data ? 'has-data' : 'empty'}`
                            },
                                React.createElement('span', { className: 'slot-channel' }, `C${slot.channel}`),
                                React.createElement('span', { className: 'slot-data' }, slot.data || '—')
                            )
                        )
                    ),
                    React.createElement('div', { className: 'frame-complete-data' },
                        React.createElement('strong', {}, 'Datos completos: '),
                        React.createElement('code', {}, frame.slots.map(s => s.data || '_').join(' | '))
                    )
                )
            )
        ),

        // Mensaje cuando no hay tramas (solo si no hay ninguna trama guardada)
        !hasFrames && React.createElement('div', {
            style: {
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--text-secondary)',
                fontSize: '1.1rem'
            }
        },
            React.createElement('div', { style: { fontSize: '3rem', marginBottom: '1rem' } }, '📋'),
            React.createElement('p', {},
                hasCurrentFrame ? 'Presiona "Iniciar" para comenzar a generar tramas' : 'Presiona "Iniciar" para comenzar a generar tramas'
            ),
            React.createElement('p', { style: { fontSize: '0.9rem', marginTop: '0.5rem' } },
                'Las tramas aparecerán aquí una vez que la animación comience'
            )
        )
    );
}

// Componente moderno para visualización de tramas
function ModernFrameVisualization({ channels, currentSlot, currentFrame }) {
    const numChannels = channels.length;
    const currentTramaIndex = Math.floor(currentFrame / numChannels);

    return React.createElement('div', { className: 'frame-visualization' },
        React.createElement('h3', { className: 'frame-title' },
            'Trama Actual - Ciclo ', currentTramaIndex + 1
        ),
        React.createElement('div', { className: 'frame-slots' },
            channels.map((channel, index) => {
                const isActive = currentSlot === index;

                // MOSTRAR EL CARÁCTER CORRECTO DE LA TRAMA ACTUAL
                // En lugar de mostrar channel.currentBit, mostramos currentTramaIndex
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
                    ),
                    React.createElement('div', { className: 'slot-footer' },
                        React.createElement('span', { className: 'bit-position' },
                            `${currentTramaIndex + 1}/${channel.data.length}`
                        )
                    )
                );
            })
        )
    );
}

// Componente moderno para visualización de entrelazado
function ModernInterleaveVisualization({ channels, currentFrame, historyLength = 3 }) {
    const numChannels = channels.length;
    const frames = [];

    // Generar últimas tramas para historial
    for (let i = Math.max(0, currentFrame - historyLength * numChannels); i <= currentFrame; i++) {
        frames.push(i);
    }

    return React.createElement('div', { className: 'interleave-visualization' },
        React.createElement('h3', { className: 'interleave-title' }, 'Patrón de Entrelazado'),
        React.createElement('div', { className: 'frames-history' },
            frames.map((frame, frameIndex) => {
                const frameChannels = [];
                const currentFrameIndex = Math.floor(frame / numChannels);
                const isCurrentFrame = frame === currentFrame;

                for (let ch = 0; ch < numChannels; ch++) {
                    const bitPos = currentFrameIndex * numChannels + ch;
                    const channel = channels[ch];
                    const hasBit = channel && bitPos < channel.data.length * numChannels;
                    const isBitActive = frame % numChannels === ch && isCurrentFrame;

                    frameChannels.push({
                        channel: ch,
                        hasData: hasBit,
                        isActive: isBitActive,
                        bit: hasBit && channel.data[Math.floor(bitPos / numChannels)] || ''
                    });
                }

                return React.createElement('div', {
                    key: `frame-${frame}`,
                    className: `frame-cycle ${isCurrentFrame ? 'current' : 'previous'}`
                },
                    React.createElement('div', { className: 'cycle-label' },
                        isCurrentFrame ? 'Trama Actual' : `Trama ${frameIndex + 1}`
                    ),
                    React.createElement('div', { className: 'cycle-slots' },
                        frameChannels.map((slot) =>
                            React.createElement('div', {
                                key: `slot-${slot.channel}`,
                                className: `mini-slot ${slot.isActive ? 'active' : ''} ${slot.hasData ? 'has-data' : ''}`
                            },
                                React.createElement('span', { className: 'mini-channel' }, `C${slot.channel + 1}`),
                                React.createElement('span', { className: 'mini-data' }, slot.bit || '—'),
                                slot.isActive && React.createElement('div', { className: 'mini-active-indicator' })
                            )
                        )
                    )
                );
            })
        )
    );
}

// Componente moderno para el demultiplexor
function ModernDemultiplexer({ isActive, activeChannel }) {
    return React.createElement('div', { className: 'demultiplexer-modern' },
        React.createElement('div', { className: 'demux-container' },
            React.createElement('div', {
                className: `demux-core ${isActive ? 'active' : '(Demultiplexación)'}`
            },
                React.createElement('div', { className: 'demux-icon' }, '⚡'),
                React.createElement('div', { className: 'demux-label' }, 'DEMUX'),
                React.createElement('div', { className: 'demux-status' },
                    isActive ? `CH${activeChannel + 1}`: '(Demultiplexación)'
                )
            ),
            React.createElement('div', { className: 'signal-distribution' },
                React.createElement('div', { className: 'distribution-indicator' })
            )
        )
    );
}

// Componente para canales de salida modernos
function ModernOutputChannels({ channels, activeChannel }) {
    return React.createElement('div', { className: 'output-channels-grid' },
        channels.map((channel, index) =>
            React.createElement('div', {
                key: `output-${index}`,
                className: `output-channel-card ${activeChannel === index ? 'active' : ''}`
            },
                React.createElement('div', { className: 'channel-header' },
                    React.createElement('span', { className: 'channel-number' }, index + 1),
                    React.createElement('span', { className: 'channel-label' }, `Canal ${index + 1}`)
                ),
                React.createElement('div', { className: 'channel-visual' },
                    React.createElement('div', { className: 'output-wave' }),
                    React.createElement('div', { className: 'output-data' },
                        channel.data.slice(0, channel.currentBit)
                    )
                ),
                React.createElement('div', {
                    className: `output-status ${activeChannel === index ? 'receiving' : ''}`
                })
            )
        )
    );
}

// Componente de estadísticas modernas
function ModernStatsPanel({ stats }) {
    const statItems = [
        { key: 'bytesProcessed', label: 'Bytes Procesados', icon: '📊', color: 'primary' },
        { key: 'currentSlot', label: 'Slot Actual', icon: '🎯', color: 'accent' },
        { key: 'transferRate', label: 'Tasa de Transferencia', icon: '⚡', color: 'success' },
        { key: 'efficiency', label: 'Eficiencia', icon: '💎', color: 'warning' }
    ];

    return React.createElement('div', { className: 'stats-modern' },
        React.createElement('h2', { className: 'stats-title' },
            React.createElement('i', { className: 'fas fa-chart-line' }),
            ' Estadísticas en Tiempo Real'
        ),
        React.createElement('div', { className: 'stats-grid' },
            statItems.map(item => {
                let value = stats[item.key];
                if (item.key === 'transferRate') {
                    value = `${value} bps`;
                } else if (item.key === 'efficiency') {
                    value = `${value}%`;
                }

                return React.createElement('div', {
                    key: item.key,
                    className: `stat-card stat-${item.color}`
                },
                    React.createElement('div', { className: 'stat-icon' }, item.icon),
                    React.createElement('div', { className: 'stat-info' },
                        React.createElement('h4', {}, item.label),
                        React.createElement('div', { className: 'stat-value' }, value)
                    ),
                    React.createElement('div', { className: 'stat-progress' })
                );
            })
        )
    );
}

// Componente de información moderna
function ModernInfoSection() {
    const [activeTab, setActiveTab] = useState('basics');

    const tabs = [
        { id: 'basics', label: 'Conceptos', icon: '📚' },
        { id: 'applications', label: 'Aplicaciones', icon: '🚀' },
        { id: 'examples', label: 'Ejemplos', icon: '💡' }
    ];

    const tabContent = {
        basics: {
            title: 'Conceptos de TDM',
            content: [
                'La Multiplexación por División de Tiempo (TDM) permite compartir un canal de comunicación.',
                'Cada canal transmite durante un intervalo de tiempo exclusivo (time slot).',
                'Los intervalos se repiten en ciclos para mantener la continuidad.'
            ]
        },
        applications: {
            title: 'Aplicaciones del Mundo Real',
            content: [
                'Sistemas telefónicos digitales (PCM)',
                'Transmisión de datos en redes de computadoras',
                'Sistemas de comunicación por fibra óptica',
                'Radio digital y televisiones'
            ]
        },
        examples: {
            title: 'Ejemplos Prácticos',
            examples: [
                { title: 'Telefonía', desc: '4 canales de voz a 64kbps cada uno' },
                { title: 'Video Streaming', desc: 'Audio, video y datos de control' },
                { title: 'Datos Industriales', desc: 'Múltiples sensores en un solo enlace' }
            ]
        }
    };

    const currentContent = tabContent[activeTab];

    return React.createElement('div', { className: 'info-modern' },
        React.createElement('div', { className: 'tabs-navigation' },
            tabs.map(tab =>
                React.createElement('button', {
                    key: tab.id,
                    className: `tab-btn ${activeTab === tab.id ? 'active' : ''}`,
                    onClick: () => setActiveTab(tab.id)
                },
                    React.createElement('span', { className: 'tab-icon' }, tab.icon),
                    React.createElement('span', { className: 'tab-label' }, tab.label)
                )
            )
        ),
        React.createElement('div', { className: 'tab-content' },
            React.createElement('h3', { className: 'content-title' }, currentContent.title),
            React.createElement('div', { className: 'content-body' },
                currentContent.content &&
                    React.createElement('ul', {},
                        currentContent.content.map((item, index) =>
                            React.createElement('li', { key: index }, item)
                        )
                    ),
                currentContent.examples &&
                    React.createElement('div', { className: 'examples-grid' },
                        currentContent.examples.map((example, index) =>
                            React.createElement('div', { key: index, className: 'example-card' },
                                React.createElement('h4', {}, example.title),
                                React.createElement('p', {}, example.desc)
                            )
                        )
                    )
            )
        )
    );
}

// Función principal del componente App
function ModernTDMApp() {
    const [numChannels, setNumChannels] = useState(4);
    const [animationSpeed, setAnimationSpeed] = useState(500);
    const [inputData, setInputData] = useState('JAHIR,EDWIN,ALEXIS,MONTSE');
    const [channels, setChannels] = useState([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [animationRunning, setAnimationRunning] = useState(false);
    const [animationPaused, setAnimationPaused] = useState(false);
    const [savedFrames, setSavedFrames] = useState([]); // Nuevo estado para guardar tramas
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0); // Índice de trama actual
    const [maxFrames, setMaxFrames] = useState(0); // Número máximo de tramas basado en la palabra más larga
    const [stats, setStats] = useState({
        bytesProcessed: 0,
        currentSlot: 0,
        transferRate: 0,
        efficiency: 100
    });
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(true);

    const animationInterval = useRef(null);

    // Calcular el número máximo de tramas basado en la palabra más larga
    const calculateMaxFrames = useCallback(() => {
        const dataParts = inputData.split(',').map(d => d.trim().substring(0, 8));
        const maxLength = Math.max(...dataParts.map(part => part.length));
        return maxLength;
    }, [inputData]);

    // Inicializar canales
    useEffect(() => {
        const dataParts = inputData.split(',').map(d => d.trim().substring(0, 8));
        const newChannels = Array.from({ length: numChannels }, (_, i) => ({
            id: i + 1,
            data: dataParts[i] || `DATA${i + 1}`,
            currentBit: 0
        }));
        setChannels(newChannels);

        // Limpiar tramas al cambiar la configuración
        if (!animationRunning) {
            setSavedFrames([]);
            setCurrentFrameIndex(-1); // -1 indica que no hay trama actual
        }
    }, [numChannels, inputData, animationRunning]);

    // Actualizar el número máximo de tramas cuando cambian los datos
    useEffect(() => {
        const maxTramas = calculateMaxFrames();
        setMaxFrames(maxTramas);
    }, [inputData, calculateMaxFrames]);

    // Función para reproducir sonidos (simulada)
    const playSound = useCallback((type) => {
        if (!soundEnabled) return;
        // Aquí iría la lógica de sonido real
        console.log(`Sound: ${type}`);
    }, [soundEnabled]);

    
    // Función para guardar trama completada
    const saveCompletedFrame = useCallback((frameIndex) => {
        const dataParts = inputData.split(',').map(d => d.trim().substring(0, 8));
        const completedFrame = {
            index: frameIndex,
            timestamp: new Date().toLocaleTimeString(),
            slots: []
        };

        // Crear slots para cada canal con la letra correspondiente
        for (let i = 0; i < numChannels; i++) {
            const word = dataParts[i] || '';

            // Siempre incluir el carácter, incluso si es vacío
            const charToUse = frameIndex < word.length ? word[frameIndex] : '';

            completedFrame.slots.push({
                channel: i + 1,
                data: charToUse,
                isActive: false
            });
        }

        setSavedFrames(prev => {
            const filteredFrames = prev.filter(f => f.index !== frameIndex);
            return [...filteredFrames, completedFrame];
        });
    }, [inputData, numChannels]);

    // Función para actualizar la trama actual
    const updateCurrentFrame = useCallback(() => {
        // Solo hacer nada si currentFrameIndex es -1 (pero permitir si la animación se detuvo)
        if (currentFrameIndex === -1) return;

        const dataParts = inputData.split(',').map(d => d.trim().substring(0, 8));
        const activeChannel = currentFrame % numChannels;
        const frameIndex = Math.floor(currentFrame / numChannels);

        const currentFrameData = {
            index: frameIndex,
            timestamp: new Date().toLocaleTimeString(),
            slots: []
        };

        // Crear slots para cada canal con la letra correspondiente de la trama actual
        for (let i = 0; i < numChannels; i++) {
            const word = dataParts[i] || '';
            const charIndex = frameIndex;
            const char = charIndex < word.length ? word[charIndex] : '';

            currentFrameData.slots.push({
                channel: i + 1,
                data: char,
                isActive: i === activeChannel
            });
        }

        // Solo actualizar la trama actual si la animación está en curso
        if (animationRunning) {
            setSavedFrames(prev => {
                const filteredFrames = prev.filter(f => f.index !== frameIndex);
                return [...filteredFrames, currentFrameData];
            });
            setCurrentFrameIndex(frameIndex);
        }
    }, [inputData, numChannels, currentFrame, channels, currentFrameIndex, animationRunning]);

  // Animación principal
    const animateFrame = useCallback(() => {
        setCurrentFrame(prev => {
            const newFrame = prev + 1;
            const activeChannel = newFrame % numChannels;
            const currentTramaIndex = Math.floor(newFrame / numChannels);

            // Verificar si hemos completado todas las tramas necesarias
            if (currentTramaIndex >= maxFrames && maxFrames > 0) {
                stopAnimation();
                // Marcar que la animación ha terminado para evitar más actualizaciones
                return prev;
            }

            setChannels(prevChannels => {
                const newChannels = [...prevChannels];
                const channel = newChannels[activeChannel];

                if (channel && channel.currentBit < channel.data.length) {
                    channel.currentBit++;
                    setStats(prevStats => ({
                        ...prevStats,
                        bytesProcessed: prevStats.bytesProcessed + 1,
                        currentSlot: activeChannel + 1,
                        transferRate: Math.round((1000 / animationSpeed) * 8 * numChannels)
                    }));
                    playSound('bit');
                }

                return newChannels;
            });

            // Guardar trama completada cuando se completa un ciclo
            if (activeChannel === numChannels - 1) {
                const completedFrameIndex = Math.floor((newFrame - 1) / numChannels);
                if (completedFrameIndex < maxFrames) {
                    saveCompletedFrame(completedFrameIndex);
                }
            }

            // Actualizar la trama actual solo si no hemos terminado todas las tramas
            setTimeout(() => {
                if (currentTramaIndex < maxFrames) {
                    updateCurrentFrame();
                }
            }, 0);

            return newFrame;
        });
    }, [numChannels, animationSpeed, playSound, updateCurrentFrame, saveCompletedFrame, maxFrames, stopAnimation]);

    // Control de animación
    const startAnimation = useCallback(() => {
        if (animationRunning && !animationPaused) return;
        if (animationPaused) {
            setAnimationPaused(false);
            return;
        }

        // Si no hay animación en curso, limpiar todo y comenzar nuevo
        if (!animationPaused && !animationRunning) {
            setSavedFrames([]); // Solo limpiar tramas al iniciar una nueva animación completa
            setCurrentFrameIndex(-1); // Resetear índice de trama actual
            setChannels(prevChannels =>
                prevChannels.map(channel => ({ ...channel, currentBit: 0 }))
            );
            setStats({
                bytesProcessed: 0,
                currentSlot: 0,
                transferRate: Math.round((1000 / animationSpeed) * 8 * numChannels),
                efficiency: 100
            });
            setCurrentFrame(0);
        }

        setAnimationRunning(true);
        setAnimationPaused(false);
        playSound('start');
    }, [animationRunning, animationPaused, animationSpeed, numChannels, playSound]);

    const pauseAnimation = useCallback(() => {
        if (!animationRunning || animationPaused) return;
        setAnimationPaused(true);
    }, [animationRunning, animationPaused]);

    const stopAnimation = useCallback(() => {
        setAnimationRunning(false);
        setAnimationPaused(false);
        if (animationInterval.current) {
            clearInterval(animationInterval.current);
            animationInterval.current = null;
        }
        // Mantener el último currentFrameIndex válido si existe, establecerlo al último guardado
        setCurrentFrame(prev => {
            const lastIndex = Math.floor((prev - 1) / numChannels);
            return lastIndex >= 0 ? lastIndex : -1;
        });
        // NO limpiar las tramas guardadas - deben permanecer para visualización
        playSound('stop');
    }, [playSound, numChannels]);

    const resetAnimation = useCallback(() => {
        stopAnimation();
        setChannels(prevChannels =>
            prevChannels.map(channel => ({ ...channel, currentBit: 0 }))
        );
        setStats({
            bytesProcessed: 0,
            currentSlot: 0,
            transferRate: 0,
            efficiency: 100
        });
        setCurrentFrame(0);
        setCurrentFrameIndex(-1); // -1 indica que no hay trama actual
        setSavedFrames([]); // Limpiar tramas guardadas solo al hacer reset explícito
    }, [stopAnimation]);

    // Efecto de animación
    useEffect(() => {
        if (animationRunning && !animationPaused) {
            animationInterval.current = setInterval(animateFrame, animationSpeed);
        } else {
            if (animationInterval.current) {
                clearInterval(animationInterval.current);
                animationInterval.current = null;
            }
        }

        return () => {
            if (animationInterval.current) {
                clearInterval(animationInterval.current);
            }
        };
    }, [animationRunning, animationPaused, animationSpeed, animateFrame]);

    const activeChannel = currentFrame % numChannels;

    return React.createElement('div', { className: 'app-container' },
        // Header moderno
        React.createElement('header', { className: 'app-header' },
            React.createElement('div', { className: 'header-content' },
                React.createElement('div', { className: 'brand' },
                    React.createElement('div', { className: 'brand-icon' }, '🌐'),
                    React.createElement('div', { className: 'brand-text' },
                        React.createElement('h1', {}, 'FUNDAMENTOS DE TELECOMUNICACIONES'),
                        React.createElement('p', {}, 'MULTIPLEXACIÓN  POR DIVISIÓN DEL TIEMPO')
                    )
                ),
                React.createElement('div', { className: 'header-actions' },
                    React.createElement('button', {
                        className: 'btn-icon',
                        onClick: () => setShowAdvanced(!showAdvanced)
                    }, showAdvanced ? '🔧' : '⚙️')
                )
            )
        ),

        // Main Content
        React.createElement('main', { className: 'main-layout' },
            // Panel de control
            React.createElement('aside', { className: 'control-sidebar' },
                React.createElement('div', { className: 'panel-header' },
                    React.createElement('i', { className: 'fas fa-sliders-h' }),
                    'Configuración de la multiplexación'
                ),
                React.createElement('div', { className: 'control-content' },
                    React.createElement('div', { className: 'control-group' },
                        React.createElement('label', {}, 'Canales de Transmisión'),
                        React.createElement('div', { className: 'slider-container' },
                            React.createElement('input', {
                                type: 'range',
                                min: '2',
                                max: '8',
                                value: numChannels,
                                className: 'slider-modern',
                                onChange: (e) => {
                                    setNumChannels(parseInt(e.target.value));
                                    resetAnimation();
                                }
                            }),
                            React.createElement('div', { className: 'slider-value' }, numChannels)
                        )
                    ),
                    React.createElement('div', { className: 'control-group' },
                        React.createElement('label', {}, 'Velocidad de Animación'),
                        React.createElement('div', { className: 'slider-container' },
                            React.createElement('input', {
                                type: 'range',
                                min: '100',
                                max: '2000',
                                value: animationSpeed,
                                className: 'slider-modern',
                                onChange: (e) => setAnimationSpeed(parseInt(e.target.value))
                            }),
                            React.createElement('div', { className: 'slider-value' }, `${animationSpeed}ms`)
                        )
                    ),
                    React.createElement('div', { className: 'control-group' },
                        React.createElement('label', {}, 'Datos de Entrada'),
                        React.createElement('textarea', {
                            className: 'data-input-modern',
                            value: inputData,
                            onChange: (e) => setInputData(e.target.value),
                            placeholder: 'Canal1,Canal2,Canal3,Canal4'
                        }),
                        React.createElement('div', { className: 'info-text' },
                            `Se crearán ${maxFrames} tramas basadas en la palabra más larga`
                        )
                    ),
                    React.createElement('div', { className: 'button-controls' },
                        React.createElement('button', {
                            className: `btn-modern btn-${animationRunning ? 'danger' : 'primary'}`,
                            onClick: animationRunning ? stopAnimation : startAnimation
                        },
                            animationRunning ? '⏹️ Detener' : '▶️ Iniciar'
                        ),
                        React.createElement('button', {
                            className: 'btn-modern btn-secondary',
                            onClick: pauseAnimation,
                            disabled: !animationRunning
                        }, '⏸️ Pausar'),
                        React.createElement('button', {
                            className: 'btn-modern btn-outline',
                            onClick: resetAnimation
                        }, '🔄 Reiniciar')
                    )
                )
            ),

            // Área de visualización
            React.createElement('section', { className: 'visualization-main' },
                React.createElement('div', { className: 'animation-container' },
                    // Canales de entrada
                    React.createElement(ModernInputChannels, { channels, activeChannel }),

                    // Multiplexor
                    React.createElement(ModernMultiplexer, { isActive: animationRunning, activeChannel }),

                    // Visualización de tramas
                    React.createElement(ModernFrameVisualization, { channels, currentSlot: activeChannel, currentFrame }),

                    // Lista de tramas guardadas (siempre visible)
                    React.createElement(ModernFrameList, { frames: savedFrames, currentFrame: currentFrameIndex }),

                    // Demultiplexor
                    React.createElement(ModernDemultiplexer, { isActive: animationRunning, activeChannel }),

                    // Canales de salida
                    React.createElement(ModernOutputChannels, { channels, activeChannel })
                )
            )
        ),

        // Panel de estadísticas
        React.createElement(ModernStatsPanel, { stats }),

        // Sección de información
        React.createElement(ModernInfoSection)
    );
}

// Renderizar la aplicación
ReactDOM.render(
    React.createElement(ModernTDMApp),
    document.getElementById('root')
);