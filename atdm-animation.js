// ===== COMPONENTE PRINCIPAL DE ANIMACIÓN ATDM (MULTIPLEXACIÓN ASÍNCRONA) =====

const { useState, useEffect, useRef, useCallback } = React;

// Componente para indicador de modo asíncrono
function AsyncIndicator({ isActive }) {
    return React.createElement('div', { className: 'async-indicator' },
        React.createElement('h3', {},
            isActive ? '🟢 MODO ASÍNCRONO ACTIVO' : '⚪ MODO EN ESPERA'
        ),
        React.createElement('p', {},
            isActive
                ? 'Los canales transmiten cuando tienen datos disponibles'
                : 'Presiona "Iniciar" para comenzar la transmisión asíncrona'
        )
    );
}

// Componente para mostrar cola de solicitudes
function RequestQueue({ requests, processingRequest }) {
    return React.createElement('div', { className: 'request-queue' },
        React.createElement('h4', {},
            React.createElement('i', { className: 'fas fa-clock' }),
            ' Cola de Solicitudes de Transmisión'
        ),
        React.createElement('div', { className: 'queue-items' },
            requests.length === 0
                ? React.createElement('p', {
                    style: {
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic',
                        fontSize: '0.8rem'
                    }
                }, 'No hay solicitudes en cola')
                : requests.map((request, index) =>
                    React.createElement('div', {
                        key: `request-${index}`,
                        className: `queue-item ${
                            request.id === processingRequest?.id ? 'processing' :
                            request.completed ? 'completed' : ''
                        }`
                    },
                        React.createElement('span', { className: 'request-channel' }, `C${request.channel + 1}`),
                        React.createElement('span', { className: 'request-data' }, request.data),
                        request.id === processingRequest?.id &&
                            React.createElement('i', { className: 'fas fa-spinner fa-spin' })
                    )
                )
        )
    );
}

// Componente para canales de entrada ATDM
function ATDMInputChannels({ channels, activeChannel }) {
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
                React.createElement('div', { className: 'status-indicator' }),
                React.createElement('div', { style: {
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                } },
                    channel.pendingRequests > 0
                        ? `${channel.pendingRequests} solicitudes pendientes`
                        : 'Sin solicitudes pendientes'
                )
            )
        )
    );
}

// Componente multiplexor ATDM
function ATDMMultiplexer({ isActive, currentChannel }) {
    return React.createElement('div', { className: 'multiplexer-modern' },
        React.createElement('div', { className: 'mux-container' },
            React.createElement('div', {
                className: `mux-core ${isActive ? 'active' : ''}`
            },
                React.createElement('div', { className: 'mux-icon' }, '⚡'),
                React.createElement('div', { className: 'mux-label' }, 'MUX'),
                React.createElement('div', { className: 'mux-status' },
                    isActive
                        ? `C${currentChannel + 1} (ATDM)`
                        : 'Asíncrono'
                )
            ),
            React.createElement('div', { className: 'signal-flow' })
        )
    );
}

// Componente para visualización de tramas ATDM
function ATDMFrameVisualization({ currentTransmission }) {
    if (!currentTransmission) {
        return React.createElement('div', { className: 'async-indicator' },
            React.createElement('h3', {}, '📡 Esperando Transmisión'),
            React.createElement('p', {}, 'Las transmisiones aparecerán aquí cuando los canales tengan datos')
        );
    }

    return React.createElement('div', { className: 'async-indicator' },
        React.createElement('h3', {}, '📡 Transmisión Activa'),
        React.createElement('div', { style: {
            background: 'var(--light-color)',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            marginTop: '1rem'
        } },
            React.createElement('div', { style: { fontSize: '0.9rem', marginBottom: '0.5rem' } },
                `Canal ${currentTransmission.channel + 1}: "${currentTransmission.data}"`
            ),
            React.createElement('div', { style: { fontSize: '0.8rem', color: 'var(--text-secondary)' } },
                `Tipo: ${currentTransmission.priority === 'high' ? 'Alta Prioridad' : 'Prioridad Normal'}`
            )
        )
    );
}

// Componente demultiplexor ATDM
function ATDMDemultiplexer({ isActive, currentChannel }) {
    return React.createElement('div', { className: 'demultiplexer-modern' },
        React.createElement('div', { className: 'demux-container' },
            React.createElement('div', {
                className: `demux-core ${isActive ? 'active' : ''}`
            },
                React.createElement('div', { className: 'demux-icon' }, '⚡'),
                React.createElement('div', { className: 'demux-label' }, 'DEMUX'),
                React.createElement('div', { className: 'demux-status' },
                    isActive
                        ? `C${currentChannel + 1} (ATDM)`
                        : 'Asíncrono'
                )
            ),
            React.createElement('div', { className: 'signal-distribution' })
        )
    );
}

// Componente para canales de salida ATDM
function ATDMOutputChannels({ channels, activeChannel }) {
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
                        channel.transmittedData || 'Sin datos transmitidos'
                    )
                ),
                React.createElement('div', {
                    className: `output-status ${activeChannel === index ? 'receiving' : ''}`
                }),
                React.createElement('div', { style: {
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                } },
                    channel.transmissions > 0
                        ? `${channel.transmissions} transmisiones completadas`
                        : 'Sin transmisiones'
                )
            )
        )
    );
}

// Componente de estadísticas ATDM
function ATDMStatsPanel({ stats }) {
    const statItems = [
        { key: 'totalRequests', label: 'Total Solicitudes', icon: '📋', color: 'primary' },
        { key: 'processedRequests', label: 'Procesadas', icon: '✅', color: 'success' },
        { key: 'queueSize', label: 'En Cola', icon: '⏳', color: 'warning' },
        { key: 'efficiency', label: 'Eficiencia', icon: '💎', color: 'accent' }
    ];

    return React.createElement('div', { className: 'stats-modern' },
        React.createElement('h2', { className: 'stats-title' },
            React.createElement('i', { className: 'fas fa-chart-line' }),
            ' Estadísticas ATDM'
        ),
        React.createElement('div', { className: 'stats-grid' },
            statItems.map(item => {
                let value = stats[item.key];
                if (item.key === 'efficiency') {
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
                    )
                );
            })
        )
    );
}

// Componente de información ATDM
function ATDMInfoSection() {
    const [activeTab, setActiveTab] = useState('basics');

    const tabs = [
        { id: 'basics', label: 'Conceptos ATDM', icon: '📚' },
        { id: 'vs-synchronous', label: 'TDM vs ATDM', icon: '⚖️' },
        { id: 'applications', label: 'Aplicaciones', icon: '🚀' }
    ];

    const tabContent = {
        basics: {
            title: 'Conceptos de Multiplexación Asíncrona',
            content: [
                'ATDM permite que los canales transmitan solo cuando tienen datos.',
                'No hay intervalos de tiempo fijos como en TDM síncrono.',
                'Los canales con datos solicitan acceso al medio y son atendidos según prioridad.',
                'Más eficiente cuando el tráfico es intermitente o bursty.'
            ]
        },
        'vs-synchronous': {
            title: 'Diferencias TDM Síncrono vs Asíncrono',
            content: [
                'TDM Síncrono: Intervalos fijos, puede desperdiciar ancho de banda.',
                'ATDM: Intervalos dinámicos, mejor uso del ancho de banda.',
                'TDM: Predecible y simple, ATDM: Más eficiente pero complejo.',
                'ATDM requiere mecanismos de control y priorización.'
            ]
        },
        applications: {
            title: 'Aplicaciones del Mundo Real',
            examples: [
                { title: 'Redes de Computadoras', desc: 'Ethernet, Frame Relay, ATM' },
                { title: 'Telefonía Móvil', desc: 'GPRS, EDGE en redes 2G/3G' },
                { title: 'Satélites', desc: 'Comunicación por satélite con tráfico variable' }
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

// Función principal del componente ATDM
function ATDMApp() {
    const [numChannels, setNumChannels] = useState(4);
    const [animationSpeed, setAnimationSpeed] = useState(1000);
    const [inputData, setInputData] = useState('JAHIR,EDWIN,ALEXIS,MONTSE');
    const [channels, setChannels] = useState([]);
    const [animationRunning, setAnimationRunning] = useState(false);
    const [animationPaused, setAnimationPaused] = useState(false);
    const [transmissionQueue, setTransmissionQueue] = useState([]);
    const [processingRequest, setProcessingRequest] = useState(null);
    const [currentTransmission, setCurrentTransmission] = useState(null);
    const [activeChannel, setActiveChannel] = useState(-1);
    const [transmissions, setTransmissions] = useState([]);
    const [stats, setStats] = useState({
        totalRequests: 0,
        processedRequests: 0,
        queueSize: 0,
        efficiency: 100
    });
    const [soundEnabled, setSoundEnabled] = useState(true);

    const animationInterval = useRef(null);

    // Inicializar canales
    useEffect(() => {
        const dataParts = inputData.split(',').map(d => d.trim().substring(0, 8));
        const newChannels = Array.from({ length: numChannels }, (_, i) => ({
            id: i + 1,
            data: dataParts[i] || `DATA${i + 1}`,
            transmittedData: '',
            pendingRequests: 0,
            transmissions: 0
        }));
        setChannels(newChannels);
    }, [numChannels, inputData]);

    // Función para generar solicitudes de transmisión
    const generateTransmissionRequests = useCallback(() => {
        const requests = [];

        channels.forEach((channel, index) => {
            if (channel.data && channel.data.length > 0) {
                // Cada caracter es una solicitud de transmisión
                for (let i = 0; i < channel.data.length; i++) {
                    requests.push({
                        id: `req-${index}-${i}`,
                        channel: index,
                        data: channel.data[i],
                        priority: Math.random() > 0.7 ? 'high' : 'normal', // 30% alta prioridad
                        completed: false,
                        timestamp: Date.now() + Math.random() * 5000 // Llegada aleatoria
                    });
                }
            }
        });

        // Ordenar por timestamp y prioridad
        requests.sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;
            return a.timestamp - b.timestamp;
        });

        setTransmissionQueue(requests);
        setStats(prev => ({
            ...prev,
            totalRequests: requests.length,
            queueSize: requests.length
        }));

        // Actualizar contadores de solicitudes pendientes por canal
        const channelRequests = new Array(numChannels).fill(0);
        requests.forEach(req => {
            if (!req.completed) {
                channelRequests[req.channel]++;
            }
        });

        setChannels(prevChannels =>
            prevChannels.map((channel, index) => ({
                ...channel,
                pendingRequests: channelRequests[index]
            }))
        );

        return requests;
    }, [channels, numChannels]);

    // Función para procesar la siguiente solicitud
    const processNextRequest = useCallback(() => {
        const pendingRequests = transmissionQueue.filter(req => !req.completed);

        if (pendingRequests.length === 0) {
            setProcessingRequest(null);
            setCurrentTransmission(null);
            setActiveChannel(-1);

            // Si no hay más solicitudes, detener la animación
            if (stats.processedRequests > 0) {
                setAnimationRunning(false);
            }
            return;
        }

        const nextRequest = pendingRequests[0];
        setProcessingRequest(nextRequest);
        setCurrentTransmission(nextRequest);
        setActiveChannel(nextRequest.channel);

        // Simular tiempo de transmisión
        setTimeout(() => {
            // Completar la transmisión
            setTransmissionQueue(prev =>
                prev.map(req =>
                    req.id === nextRequest.id ? { ...req, completed: true } : req
                )
            );

            // Actualizar canal de salida
            setChannels(prevChannels =>
                prevChannels.map((channel, index) => {
                    if (index === nextRequest.channel) {
                        return {
                            ...channel,
                            transmittedData: (channel.transmittedData || '') + nextRequest.data,
                            transmissions: channel.transmissions + 1,
                            pendingRequests: Math.max(0, channel.pendingRequests - 1)
                        };
                    }
                    return channel;
                })
            );

            // Agregar a historial de transmisiones
            setTransmissions(prev => [...prev, {
                ...nextRequest,
                completedAt: Date.now()
            }]);

            // Actualizar estadísticas
            setStats(prev => {
                const newProcessed = prev.processedRequests + 1;
                const remaining = prev.totalRequests - newProcessed;
                const efficiency = prev.totalRequests > 0
                    ? Math.round((newProcessed / prev.totalRequests) * 100)
                    : 0;

                return {
                    ...prev,
                    processedRequests: newProcessed,
                    queueSize: remaining,
                    efficiency
                };
            });

            // Continuar con la siguiente solicitud
            setProcessingRequest(null);
            setCurrentTransmission(null);
            setActiveChannel(-1);
        }, animationSpeed);
    }, [transmissionQueue, animationSpeed, stats.processedRequests]);

    // Control de animación
    const startAnimation = useCallback(() => {
        if (animationRunning && !animationPaused) return;

        if (animationPaused) {
            setAnimationPaused(false);
            return;
        }

        // Generar solicitudes de transmisión
        const requests = generateTransmissionRequests();

        if (requests.length === 0) {
            alert('No hay datos para transmitir. Por favor, ingresa datos en los campos.');
            return;
        }

        setAnimationRunning(true);
        setAnimationPaused(false);
        setTransmissions([]);
    }, [animationRunning, animationPaused, generateTransmissionRequests]);

    const pauseAnimation = useCallback(() => {
        if (!animationRunning || animationPaused) return;
        setAnimationPaused(true);
    }, [animationRunning, animationPaused]);

    const stopAnimation = useCallback(() => {
        setAnimationRunning(false);
        setAnimationPaused(false);
        setProcessingRequest(null);
        setCurrentTransmission(null);
        setActiveChannel(-1);
    }, []);

    const resetAnimation = useCallback(() => {
        stopAnimation();
        setTransmissionQueue([]);
        setProcessingRequest(null);
        setCurrentTransmission(null);
        setActiveChannel(-1);
        setTransmissions([]);
        setStats({
            totalRequests: 0,
            processedRequests: 0,
            queueSize: 0,
            efficiency: 100
        });

        // Resetear canales
        setChannels(prevChannels =>
            prevChannels.map(channel => ({
                ...channel,
                transmittedData: '',
                pendingRequests: 0,
                transmissions: 0
            }))
        );
    }, [stopAnimation]);

    // Efecto de animación principal
    useEffect(() => {
        if (animationRunning && !animationPaused) {
            animationInterval.current = setInterval(processNextRequest, animationSpeed);
        } else {
            if (animationInterval.current) {
                clearInterval(animationInterval.current);
            }
        }

        return () => {
            if (animationInterval.current) {
                clearInterval(animationInterval.current);
            }
        };
    }, [animationRunning, animationPaused, animationSpeed, processNextRequest]);

    return React.createElement('div', { className: 'app-container' },
        // Header
        React.createElement('header', { className: 'app-header' },
            React.createElement('div', { className: 'header-content' },
                React.createElement('div', { className: 'brand' },
                    React.createElement('div', { className: 'brand-icon' }, '🌐'),
                    React.createElement('div', { className: 'brand-text' },
                        React.createElement('h1', {}, 'FUNDAMENTOS DE TELECOMUNICACIONES'),
                        React.createElement('p', {}, 'MULTIPLEXACIÓN POR DIVISIÓN DE TIEMPO ASÍNCRONA (ATDM)')
                    )
                )
            )
        ),

        // Main Content
        React.createElement('main', { className: 'main-layout' },
            // Panel de control
            React.createElement('aside', { className: 'control-sidebar' },
                React.createElement('div', { className: 'panel-header' },
                    React.createElement('i', { className: 'fas fa-sliders-h' }),
                    'Configuración ATDM'
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
                        React.createElement('label', {}, 'Velocidad de Transmisión'),
                        React.createElement('div', { className: 'slider-container' },
                            React.createElement('input', {
                                type: 'range',
                                min: '500',
                                max: '3000',
                                step: '100',
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
                            'Cada caracter generará una solicitud de transmisión'
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
                    // Indicador ATDM
                    React.createElement(AsyncIndicator, { isActive: animationRunning && !animationPaused }),

                    // Cola de solicitudes
                    React.createElement(RequestQueue, {
                        requests: transmissionQueue,
                        processingRequest
                    }),

                    // Canales de entrada
                    React.createElement(ATDMInputChannels, { channels, activeChannel }),

                    // Multiplexor
                    React.createElement(ATDMMultiplexer, {
                        isActive: animationRunning && !animationPaused,
                        currentChannel: activeChannel
                    }),

                    // Visualización de transmisión actual
                    React.createElement(ATDMFrameVisualization, { currentTransmission }),

                    // Demultiplexor
                    React.createElement(ATDMDemultiplexer, {
                        isActive: animationRunning && !animationPaused,
                        currentChannel: activeChannel
                    }),

                    // Canales de salida
                    React.createElement(ATDMOutputChannels, { channels, activeChannel })
                )
            )
        ),

        // Panel de estadísticas
        React.createElement(ATDMStatsPanel, { stats }),

        // Sección de información
        React.createElement(ATDMInfoSection)
    );
}

// Renderizar la aplicación
ReactDOM.render(
    React.createElement(ATDMApp),
    document.getElementById('root')
);