/**
 * Comparison Controller
 * React Application for Real-time TDM Comparison
 */

const { useState, useEffect, useRef } = React;

// --- Helper Components ---

const DataItem = ({ value, type }) => (
    <div className={`data-item`}>{value}</div>
);

const Buffer = ({ data, type }) => (
    <div className="channel-buffer">
        {data.map((item, i) => (
            <DataItem key={i} value={item} type={type} />
        ))}
    </div>
);

const Slot = ({ type, data, channelID, address }) => {
    const isEmpty = !data;
    return (
        <div className={`slot ${isEmpty ? 'empty' : type}`}>
            {!isEmpty && <div className="slot-addr">{address}</div>}
            <div className="slot-content">
                {isEmpty ? '∅' : data}
            </div>
        </div>
    );
};

// --- Main App Component ---

const ComparisonApp = () => {
    // Configuration
    const [speedMs, setSpeedMs] = useState(1000);

    // Inputs
    const [inputString, setInputString] = useState("AAAAAA,,CCCC,,EEEE");

    // State
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [numChannels, setNumChannels] = useState(5); // Default based on input

    // --- Synchronous State ---
    const [syncBuffers, setSyncBuffers] = useState([]);
    const [syncFrameStrip, setSyncFrameStrip] = useState([]);
    const [syncStats, setSyncStats] = useState({ used: 0, sent: 0 });
    const [syncScanIndex, setSyncScanIndex] = useState(0);

    // --- Asynchronous State ---
    const asyncSimRef = useRef(null);
    const [asyncBuffers, setAsyncBuffers] = useState([]);
    const [asyncFrameStrip, setAsyncFrameStrip] = useState([]);
    const [asyncStats, setAsyncStats] = useState({ used: 0, sent: 0 });
    const [asyncScanIndex, setAsyncScanIndex] = useState(0);

    // --- Controls ---

    const handleStart = () => {
        // If paused, resume
        if (isPaused) {
            setIsRunning(true);
            setIsPaused(false);
            return;
        }

        // --- Fresh Start ---
        // Parse input to setup channels
        const parts = inputString.split(',').map(s => s.trim());
        const nChannels = parts.length;
        setNumChannels(nChannels);

        // Sync Setup
        const newSyncBuffers = parts.map(p => p ? p.split('') : []);
        setSyncBuffers(newSyncBuffers);
        setSyncFrameStrip([]);
        setSyncStats({ used: 0, sent: 0 });
        setSyncScanIndex(0);

        // Async Setup
        // Dynamically determine frame size (M < N) or just use N for comparison simplicity?
        // Let's use M = N for now to compare direct frame utilization unless specified otherwise.
        // Or if Asynchronous is typically smaller frames. 
        // Example: 5 channels, Sync sends 5 slots. Async sends frame of size 3?
        // Let's stick to 3 (from user screenshot "Trama #1 (3/3 slots)").
        // So allow Async to be compressed.
        const frameSize = 3; 
        
        asyncSimRef.current = new ATDMSimulator(nChannels, frameSize);
        asyncSimRef.current.loadData(inputString);
        
        setAsyncBuffers(asyncSimRef.current.getInputBuffers().map(s => s.split('')));
        setAsyncFrameStrip([]);
        setAsyncStats({ used: 0, sent: 0 });
        setAsyncScanIndex(0);

        setIsRunning(true);
        setIsPaused(false);
    };

    const handlePause = () => {
        setIsRunning(false);
        setIsPaused(true);
    };

    const handleReset = () => {
        setIsRunning(false);
        setIsPaused(false);
        
        setSyncFrameStrip([]);
        setAsyncFrameStrip([]);
        setSyncStats({ used: 0, sent: 0 });
        setAsyncStats({ used: 0, sent: 0 });
        setSyncScanIndex(0);
        setAsyncScanIndex(0);
        
        // Reset buffers to empty state
        const parts = inputString.split(',').map(s => s.trim());
        setNumChannels(parts.length);
        setSyncBuffers(parts.map(p => []));
        setAsyncBuffers(parts.map(p => []));
    };

    // --- Simulation Loop ---

    useEffect(() => {
        let intervalId;

        if (isRunning) {
            intervalId = setInterval(() => {
                // --- Sync Step ---
                setSyncBuffers(prevBuffers => {
                    const nextBuffers = prevBuffers.map(b => [...b]); 
                    const currentChannel = syncScanIndex;
                    let slotData = null;

                    // Sync: Visit channel. If data, take it. Visualizes "waste" if empty.
                    if (nextBuffers[currentChannel] && nextBuffers[currentChannel].length > 0) {
                        slotData = nextBuffers[currentChannel].shift();
                    }

                    setSyncFrameStrip(prev => [
                        ...prev, 
                        { 
                            data: slotData, 
                            channelID: currentChannel, 
                            address: `CH${currentChannel}`
                        }
                    ]);

                    setSyncStats(prev => ({
                        sent: prev.sent + 1,
                        used: prev.used + (slotData ? 1 : 0)
                    }));
                    
                    return nextBuffers;
                });
                
                setSyncScanIndex(prev => (prev + 1) % numChannels);

                // --- Async Step ---
                if (asyncSimRef.current) {
                    const frame = asyncSimRef.current.stepMux();
                    
                    setAsyncBuffers(asyncSimRef.current.getInputBuffers().map(s => s.split('')));
                    setAsyncScanIndex(asyncSimRef.current.scanPointer);

                    if (frame) {
                        setAsyncFrameStrip(prev => [
                            ...prev,
                            ...frame.map(s => ({
                                data: s.data,
                                channelID: s.channelID,
                                address: s.binaryAddress
                            }))
                        ]);
                        
                        const simStats = asyncSimRef.current.getStats();
                        setAsyncStats({
                            used: simStats.usedSlots,
                            sent: simStats.totalSlots
                        });
                    }
                }

            }, speedMs);
        }

        return () => clearInterval(intervalId);
    }, [isRunning, numChannels, speedMs, syncScanIndex]); 

    // --- Rendering Helpers ---
    
    const calculateEfficiency = (stats) => {
        if (stats.sent === 0) return 0;
        return Math.round((stats.used / stats.sent) * 100);
    };

    return (
        <div className="comp-app">
            <header className="comp-header">
                <h1><i className="fas fa-balance-scale"></i> Comparativa en Tiempo Real</h1>
                
                <div className="controls-area">
                    <div className="input-group">
                        <label className="input-label" style={{color: 'white', marginRight: '5px'}}>Datos:</label>
                        <input 
                            type="text" 
                            className="fancy-input" 
                            value={inputString}
                            onChange={(e) => setInputString(e.target.value)}
                            placeholder="Ej: AAAAAA,,CCCC,,EEEE"
                            disabled={isRunning}
                        />
                    </div>
                    
                    <div className="input-group" style={{alignItems: 'center'}}>
                         <label className="input-label" style={{color: 'white', marginRight: '5px'}}>Velocidad: {speedMs}ms</label>
                        <input 
                            type="range" 
                            min="100" 
                            max="2000" 
                            step="100"
                            value={speedMs} 
                            onChange={(e) => setSpeedMs(Number(e.target.value))}
                        />
                    </div>

                    <div className="btn-group">
                        <button 
                            className="btn-start" 
                            onClick={handleStart}
                            disabled={isRunning && !isPaused}
                        >
                            <i className={`fas fa-${isPaused ? 'play' : isRunning ? 'sync' : 'play'}`}></i> 
                            {isPaused ? ' Reanudar' : ' Iniciar'}
                        </button>
                        
                        <button 
                            className="btn-pause"
                            onClick={handlePause}
                            disabled={!isRunning}
                        >
                            <i className="fas fa-pause"></i> Pausar
                        </button>
                        
                        <button 
                            className="btn-reset"
                            onClick={handleReset}
                        >
                            <i className="fas fa-undo"></i> Reiniciar
                        </button>
                    </div>
                </div>
            </header>

            <div className="split-container">
                {/* --- Left Panel: Synchronous --- */}
                <div className="panel panel-sync">
                    <div className="panel-header">
                        <h2><i className="fas fa-bolt"></i> TDM Síncrono</h2>
                    </div>
                    
                    <div className="vis-container">
                        <div className="channels-wrapper">
                            {syncBuffers.map((buf, idx) => (
                                <div key={idx} className="channel-box">
                                    <div className="channel-label">CH {idx}</div>
                                    <Buffer data={buf} type="sync" />
                                </div>
                            ))}
                        </div>

                        <div className="mux-device">
                            MUX
                            <div 
                                className="mux-scan-line"
                                style={{
                                    left: `${((syncScanIndex / Math.max(1, numChannels - 1)) * 60) + 20}%`
                                }}
                            ></div>
                        </div>

                        <div className="frame-strip-container">
                            <span className="frame-label">Slots Enviados</span>
                            <div className="frame-track">
                                <div className="slot-stream">
                                    {syncFrameStrip.map((s, i) => (
                                        <Slot 
                                            key={i} 
                                            type="sync" 
                                            data={s.data} 
                                            address={s.address}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="metrics-panel">
                            <table className="metrics-table">
                                <tbody>
                                    <tr>
                                        <th>Slots Enviados:</th>
                                        <td>{syncStats.sent}</td>
                                    </tr>
                                    <tr>
                                        <th>Desperdiciados:</th>
                                        <td className="metric-val bad">{syncStats.sent - syncStats.used}</td>
                                    </tr>
                                    <tr>
                                        <th>Eficiencia:</th>
                                        <td className="metric-val">{calculateEfficiency(syncStats)}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* --- Right Panel: Asynchronous --- */}
                <div className="panel panel-async">
                    <div className="panel-header">
                        <h2><i className="fas fa-network-wired"></i> TDM Asíncrono</h2>
                    </div>

                    <div className="vis-container">
                        <div className="channels-wrapper">
                            {asyncBuffers.map((buf, idx) => (
                                <div key={idx} className="channel-box">
                                    <div className="channel-label">CH {idx}</div>
                                    <Buffer data={buf} type="async" />
                                </div>
                            ))}
                        </div>

                        <div className="mux-device">
                            Stat MUX
                            <div 
                                className="mux-scan-line"
                                style={{
                                    left: `${((asyncScanIndex / Math.max(1, numChannels - 1)) * 60) + 20}%`,
                                    background: '#10b981'
                                }}
                            ></div>
                        </div>

                        <div className="frame-strip-container">
                            <span className="frame-label">Slots Generados (Frame Size {asyncSimRef.current?.frameSize || 3})</span>
                            <div className="frame-track">
                                <div className="slot-stream">
                                    {asyncFrameStrip.map((s, i) => (
                                        <Slot 
                                            key={i} 
                                            type="async" 
                                            data={s.data} 
                                            address={s.address} 
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="metrics-panel">
                            <table className="metrics-table">
                                <tbody>
                                    <tr>
                                        <th>Slots Enviados:</th>
                                        <td>{asyncStats.sent}</td>
                                    </tr>
                                    <tr>
                                        <th>Desperdiciados (Huecos):</th>
                                        <td className="metric-val good">{asyncStats.sent - asyncStats.used}</td>
                                    </tr>
                                    <tr>
                                        <th>Eficiencia:</th>
                                        <td className="metric-val good">{calculateEfficiency(asyncStats)}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ComparisonApp />);
