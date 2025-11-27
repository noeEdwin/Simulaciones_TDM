/**
 * ATDM Controller
 * Controlador React para el simulador ATDM
 * Maneja la lógica de UI e interacción con el modelo ATDMSimulator
 */

const { useState, useEffect, useRef, useMemo } = React;

function ATDMApp() {
    // Estados de configuración
    const [numChannels, setNumChannels] = useState(5);
    const [frameSize, setFrameSize] = useState(3);
    const [animationSpeed, setAnimationSpeed] = useState(1500);
    const [inputData, setInputData] = useState('AAAAA,BBBB,CCC,DD,E');
    const [darkMode, setDarkMode] = useState(false);
    
    // Estados de simulación
    const [simulator, setSimulator] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [framesHistory, setFramesHistory] = useState([]);
    const [inputBuffers, setInputBuffers] = useState([]);
    const [outputBuffers, setOutputBuffers] = useState([]);
    const [stats, setStats] = useState(null);
    const [eventLog, setEventLog] = useState([]);
    
    // Estado de UI
    const [sectionsCollapsed, setSectionsCollapsed] = useState({
        params: false,
        data: false
    });
    
    const intervalRef = useRef(null);
    const chartRef = useRef(null);
    
    // Modo oscuro
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);
    
    // Inicializar simulador
    useEffect(() => {
        const sim = new ATDMSimulator(numChannels, frameSize);
        setSimulator(sim);
        updateView(sim);
        addLogEntry(`Sistema inicializado con ${numChannels} canales y ${frameSize} slots por trama`);
    }, [numChannels, frameSize]);
    
    // Función para agregar entrada al log
    const addLogEntry = (message) => {
        const timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
        setEventLog(prev => [{timestamp, message}, ...prev].slice(0, 50));
    };
    
    // Actualizar vista
    const updateView = (sim) => {
        setInputBuffers(sim.getInputBuffers());
        setOutputBuffers(sim.getOutputBuffers());
        setStats(sim.getStats());
    };
    
    // Validación de entrada
    const inputValidation = useMemo(() => {
        if (!inputData.trim()) {
            return { valid: false, message: 'Ingresa datos para simular' };
        }
        
        const items = inputData.split(',').map(item => item.trim()).filter(item => item.length > 0);
        
        if (items.length === 0) {
            return { valid: false, message: 'Datos vacíos' };
        }
        
        if (items.length !== numChannels) {
            return { 
                valid: false, 
                message: `Tienes ${items.length} elementos pero ${numChannels} canales`
            };
        }
        
        return { valid: true, message: `${items.length} elementos válidos` };
    }, [inputData, numChannels]);
    
    const isInputValid = inputValidation.valid;
    
    // Paso de animación
    const animationStep = () => {
        if (!simulator || isPaused) return;
        
        const frame = simulator.stepMux();
        
        if (frame) {
            setFramesHistory(prev => [...prev, frame]);
            addLogEntry(`Trama #${framesHistory.length + 1} formada con ${frame.length} slots`);
            
            simulator.stepDemux(frame);
            updateView(simulator);
        }
        
        updateView(simulator);
        
        if (simulator.isComplete()) {
            stopAnimation();
            addLogEntry('✓ Simulación completada');
        }
    };
    
    // Control de animación
    useEffect(() => {
        if (isRunning && !isPaused && simulator) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            intervalRef.current = setInterval(animationStep, animationSpeed);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, isPaused, simulator, animationSpeed, animationStep]);
    
    const startAnimation = () => {
        if (!simulator || !isInputValid) return;
        
        if (isPaused) {
            setIsPaused(false);
            addLogEntry('▶️ Simulación reanudada');
        } else {
            // Limpiar datos anteriores
            simulator.reset();
            setFramesHistory([]);
            updateView(simulator);
            
            // Cargar nuevos datos e iniciar
            simulator.loadData(inputData);
            updateView(simulator);
            setIsRunning(true);
            addLogEntry('▶️ Simulación iniciada (datos anteriores limpiados)');
        }
    };
    
    const pauseAnimation = () => {
        setIsPaused(true);
        addLogEntry('⏸️ Simulación pausada');
    };
    
    const stopAnimation = () => {
        setIsRunning(false);
        setIsPaused(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        addLogEntry('⏹️ Simulación detenida (datos preservados)');
    };
    
    const resetAnimation = () => {
        stopAnimation();
        if (simulator) {
            simulator.reset();
            updateView(simulator);
        }
        setFramesHistory([]);
        setEventLog([]);
        addLogEntry('🔄 Sistema reiniciado');
    };
    
    const toggleSection = (section) => {
        setSectionsCollapsed(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };
    
    const getSpeedLabel = () => {
        if (animationSpeed <= 800) return '⚡ Muy rápido';
        if (animationSpeed <= 1500) return '🏃 Rápido';
        if (animationSpeed <= 2200) return '🚶 Normal';
        return '🐢 Lento';
    };
    
    // Renderizar el componente (se completa en la vista)
    return React.createElement('div', { className: 'app-container-modern' },
        // Theme Toggle
        React.createElement('div', {
            className: 'theme-toggle',
            onClick: () => setDarkMode(!darkMode)
        },
            React.createElement('i', { className: `fas fa-${darkMode ? 'sun' : 'moon'}` }),
            darkMode ? 'Claro' : 'Oscuro'
        ),
        
        // Header
        React.createElement('header', { className: 'app-header-modern' },
            React.createElement('div', { className: 'header-content-modern' },
                React.createElement('div', { className: 'brand-modern' },
                    React.createElement('div', { className: 'brand-icon-modern' }, '🌐'),
                    React.createElement('div', {},
                        React.createElement('h1', { className: 'brand-title' }, 'ATDM SIMULATOR'),
                        React.createElement('p', { className: 'brand-subtitle' }, 
                            'Multiplexación Asíncrona • Direccionamiento Dinámico • Visualización en Tiempo Real'
                        )
                    )
                )
            )
        ),
        
        // Main content con sidebar y visualización
        React.createElement('main', { className: 'main-layout-modern' },
            // Se completa en la vista con el resto del HTML
        )
    );
}

// Exportar para uso global
window.ATDMApp = ATDMApp;
