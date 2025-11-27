// ===== VARIABLE GLOBALES =====
let animationRunning = false;
let animationPaused = false;
let currentFrame = 0;
let animationInterval = null;
let channels = [];
let timeSlots = [];
let signalData = [];
let stats = {
    bytesProcessed: 0,
    currentSlot: 0,
    transferRate: 0,
    efficiency: 100
};

// Audio context para efectos de sonido
let audioContext = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    createChannels(4);
    setupAudioContext();
});

function initializeApp() {
    // Inicializar GSAP animations
    gsap.registerPlugin();

    // Configurar canvas
    const canvas = document.getElementById('signalCanvas');
    const ctx = canvas.getContext('2d');

    // Responsive canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const canvas = document.getElementById('signalCanvas');
    const container = canvas.parentElement;
    canvas.width = container.clientWidth - 40;
    canvas.height = 200;
}

function setupAudioContext() {
    // Crear audio context para efectos de sonido
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

// ===== CONFIGURACIÓN DE EVENT LISTENERS =====
function setupEventListeners() {
    // Controles deslizantes
    document.getElementById('numChannels').addEventListener('input', function(e) {
        const value = e.target.value;
        document.getElementById('numChannelsValue').textContent = value;
        createChannels(parseInt(value));
        resetAnimation();
    });

    document.getElementById('animationSpeed').addEventListener('input', function(e) {
        const value = e.target.value;
        document.getElementById('speedValue').textContent = value + 'ms';
        if (animationRunning) {
            stopAnimation();
            startAnimation();
        }
    });

    // Botones de control
    document.getElementById('startBtn').addEventListener('click', startAnimation);
    document.getElementById('pauseBtn').addEventListener('click', pauseAnimation);
    document.getElementById('resetBtn').addEventListener('click', resetAnimation);

    // Checkbox opciones
    document.getElementById('showGrid').addEventListener('change', updateVisualization);
    document.getElementById('showLabels').addEventListener('change', updateVisualization);
    document.getElementById('enableSound').addEventListener('change', function(e) {
        if (e.target.checked && !audioContext) {
            setupAudioContext();
        }
    });

    // Input de datos
    document.getElementById('dataInput').addEventListener('input', function() {
        if (!animationRunning) {
            processInputData();
        }
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

// ===== GESTIÓN DE CANALES =====
function createChannels(numChannels) {
    channels = [];
    const inputContainer = document.getElementById('inputChannelsContainer');
    const outputContainer = document.getElementById('outputChannelsContainer');

    inputContainer.innerHTML = '';
    outputContainer.innerHTML = '';

    const inputData = document.getElementById('dataInput').value.split(',').filter(d => d.trim());

    for (let i = 0; i < numChannels; i++) {
        const channelData = inputData[i] ? inputData[i].trim() : `CANAL${i + 1}`;
        channels.push({
            id: i,
            data: channelData,
            currentBit: 0,
            active: false
        });

        // Crear canal de entrada
        const inputChannel = createChannelElement(i, channelData, 'input');
        inputContainer.appendChild(inputChannel);

        // Crear canal de salida
        const outputChannel = createChannelElement(i, '', 'output');
        outputContainer.appendChild(outputChannel);
    }

    createTimeSlots(numChannels);
}

function createChannelElement(id, data, type) {
    const channel = document.createElement('div');
    channel.className = 'channel';
    channel.id = `${type}-channel-${id}`;

    const label = document.createElement('div');
    label.className = 'channel-label';
    label.textContent = `Canal ${id + 1}`;

    const dataDiv = document.createElement('div');
    dataDiv.className = 'channel-data';
    dataDiv.id = `${type}-data-${id}`;

    if (type === 'input' && data) {
        dataDiv.innerHTML = createBitElements(data);
    }

    channel.appendChild(label);
    channel.appendChild(dataDiv);

    return channel;
}

function createBitElements(data) {
    return data.split('').map((bit, index) =>
        `<span class="channel-bit" data-index="${index}">${bit}</span>`
    ).join('');
}

function createTimeSlots(numChannels) {
    timeSlots = [];
    const container = document.getElementById('timeSlotsContainer');
    container.innerHTML = '';

    for (let i = 0; i < numChannels; i++) {
        timeSlots.push({
            id: i,
            channel: i,
            active: false
        });

        const slot = document.createElement('div');
        slot.className = 'time-slot';
        slot.id = `time-slot-${i}`;

        const number = document.createElement('div');
        number.className = 'time-slot-number';
        number.textContent = `Slot ${i + 1}`;

        const channel = document.createElement('div');
        channel.className = 'time-slot-channel';
        channel.textContent = `Ch ${i + 1}`;

        slot.appendChild(number);
        slot.appendChild(channel);
        container.appendChild(slot);
    }
}

// ===== PROCESAMIENTO DE DATOS =====
function processInputData() {
    const inputData = document.getElementById('dataInput').value.split(',').filter(d => d.trim());

    channels.forEach((channel, index) => {
        if (inputData[index]) {
            channel.data = inputData[index].trim();
            const dataElement = document.getElementById(`input-data-${index}`);
            if (dataElement) {
                dataElement.innerHTML = createBitElements(channel.data);
            }
        }
    });
}

// ===== ANIMACIÓN PRINCIPAL =====
function startAnimation() {
    if (animationRunning && !animationPaused) return;

    if (animationPaused) {
        resumeAnimation();
        return;
    }

    animationRunning = true;
    animationPaused = false;
    currentFrame = 0;

    processInputData();

    const speed = parseInt(document.getElementById('animationSpeed').value);

    // Iniciar animación con GSAP
    gsap.timeline({repeat: -1})
        .to({}, {
            duration: speed / 1000,
            repeat: -1,
            onRepeat: () => {
                if (!animationPaused && animationRunning) {
                    animateFrame();
                }
            }
        });

    // Actualizar UI
    document.getElementById('startBtn').innerHTML = '<i class="fas fa-stop"></i> Detener';
    document.getElementById('startBtn').classList.remove('btn-primary');
    document.getElementById('startBtn').classList.add('btn-danger');

    playSound('start');
}

function animateFrame() {
    const numChannels = channels.length;
    const currentChannel = currentFrame % numChannels;

    // Limpiar estado anterior
    clearAllActiveStates();

    // Activar canal actual
    activateChannel(currentChannel);

    // Activar time slot
    activateTimeSlot(currentChannel);

    // Actualizar multiplexores
    updateMultiplexers(currentChannel);

    // Procesar bit actual
    processBit(currentChannel);

    // Actualizar señal
    updateSignal(currentChannel);

    // Actualizar estadísticas
    updateStats();

    currentFrame++;
}

function activateChannel(channelId) {
    const inputChannel = document.getElementById(`input-channel-${channelId}`);
    const outputChannel = document.getElementById(`output-channel-${channelId}`);

    if (inputChannel) {
        inputChannel.classList.add('active');
        gsap.from(inputChannel, {scale: 0.8, duration: 0.3});
    }

    if (outputChannel) {
        outputChannel.classList.add('active');
        gsap.from(outputChannel, {scale: 0.8, duration: 0.3});
    }

    channels[channelId].active = true;
}

function activateTimeSlot(slotId) {
    const slot = document.getElementById(`time-slot-${slotId}`);
    if (slot) {
        slot.classList.add('active');
        gsap.from(slot, {y: -10, duration: 0.2});
    }

    timeSlots[slotId].active = true;
    stats.currentSlot = slotId + 1;
}

function updateMultiplexers(channelId) {
    const muxIndicator = document.getElementById('muxIndicator');
    const demuxIndicator = document.getElementById('demuxIndicator');

    if (muxIndicator) {
        muxIndicator.classList.add('active');
        gsap.to(muxIndicator, {rotation: 360, duration: 0.5, ease: "power2.inOut"});
    }

    if (demuxIndicator) {
        demuxIndicator.classList.add('active');
        gsap.to(demuxIndicator, {rotation: 360, duration: 0.5, ease: "power2.inOut"});
    }
}

function processBit(channelId) {
    const channel = channels[channelId];
    if (channel.currentBit < channel.data.length) {
        const bit = channel.data[channel.currentBit];

        // Resaltar bit actual en canal de entrada
        const inputBits = document.querySelectorAll(`#input-data-${channelId} .channel-bit`);
        if (inputBits[channel.currentBit]) {
            inputBits[channel.currentBit].classList.add('active');
            gsap.from(inputBits[channel.currentBit], {scale: 2, duration: 0.3});
        }

        // Transferir bit a canal de salida
        const outputData = document.getElementById(`output-data-${channelId}`);
        if (outputData) {
            const currentOutput = outputData.innerHTML;
            const bitElements = currentOutput.split('</span>');
            const newBit = `<span class="channel-bit active">${bit}</span>`;

            if (bitElements.length > channel.currentBit + 1) {
                bitElements[channel.currentBit + 1] = newBit;
                outputData.innerHTML = bitElements.join('</span>');
            } else {
                outputData.innerHTML += newBit;
            }
        }

        channel.currentBit++;
        stats.bytesProcessed++;

        playSound('bit');
    }
}

function updateSignal(channelId) {
    const canvas = document.getElementById('signalCanvas');
    const ctx = canvas.getContext('2d');
    const channel = channels[channelId];

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar cuadrícula si está activada
    if (document.getElementById('showGrid').checked) {
        drawGrid(ctx, canvas);
    }

    // Dibujar señal multiplexada
    drawMultiplexedSignal(ctx, canvas, channelId);

    // Dibujar etiquetas si están activadas
    if (document.getElementById('showLabels').checked) {
        drawLabels(ctx, canvas);
    }
}

function drawGrid(ctx, canvas) {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    // Líneas verticales
    for (let i = 0; i <= canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }

    // Líneas horizontales
    for (let i = 0; i <= canvas.height; i += 25) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

function drawMultiplexedSignal(ctx, canvas, activeChannel) {
    const numChannels = channels.length;
    const slotWidth = canvas.width / numChannels;
    const channelHeight = canvas.height / 2;

    channels.forEach((channel, index) => {
        const x = index * slotWidth;
        const y = canvas.height / 2;

        // Color del canal
        const hue = (index * 360) / numChannels;
        ctx.fillStyle = index === activeChannel ? `hsla(${hue}, 70%, 50%, 0.8)` : `hsla(${hue}, 70%, 50%, 0.3)`;
        ctx.strokeStyle = index === activeChannel ? `hsla(${hue}, 70%, 40%, 1)` : `hsla(${hue}, 70%, 40%, 0.5)`;
        ctx.lineWidth = index === activeChannel ? 3 : 2;

        // Dibujar rectángulo del time slot
        ctx.fillRect(x, y - channelHeight/2, slotWidth - 2, channelHeight);
        ctx.strokeRect(x, y - channelHeight/2, slotWidth - 2, channelHeight);

        // Dibujar datos del canal
        if (index === activeChannel && channel.currentBit > 0) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const bitsToShow = Math.min(channel.currentBit, 3);
            const startBit = Math.max(0, channel.currentBit - bitsToShow);
            const bits = channel.data.substring(startBit, channel.currentBit);

            ctx.fillText(bits, x + slotWidth/2 - 1, y);
        }

        // Etiqueta del canal
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter';
        ctx.fillText(`Ch${index + 1}`, x + slotWidth/2 - 1, canvas.height - 10);
    });
}

function drawLabels(ctx, canvas) {
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Señal TDM', 10, 10);
}

function clearAllActiveStates() {
    // Limpiar canales
    document.querySelectorAll('.channel').forEach(ch => ch.classList.remove('active'));

    // Limpiar time slots
    document.querySelectorAll('.time-slot').forEach(ts => ts.classList.remove('active'));

    // Limpiar indicadores
    document.querySelectorAll('.mux-indicator, .demux-indicator').forEach(ind => ind.classList.remove('active'));

    // Limpiar estados
    channels.forEach(ch => ch.active = false);
    timeSlots.forEach(ts => ts.active = false);
}

function updateStats() {
    const numChannels = channels.length;
    const speed = parseInt(document.getElementById('animationSpeed').value);

    // Calcular tasa de transferencia (simulada)
    stats.transferRate = Math.round((1000 / speed) * 8 * numChannels); // bits por segundo

    // Actualizar UI
    document.getElementById('transferRate').textContent = `${stats.transferRate} bps`;
    document.getElementById('currentSlot').textContent = stats.currentSlot;
    document.getElementById('bytesProcessed').textContent = stats.bytesProcessed;
    document.getElementById('efficiency').textContent = `${stats.efficiency}%`;

    // Animar números con GSAP
    gsap.from('.stat-value', {scale: 1.1, duration: 0.3, stagger: 0.05});
}

// ===== CONTROL DE ANIMACIÓN =====
function pauseAnimation() {
    if (!animationRunning || animationPaused) return;

    animationPaused = true;
    document.getElementById('startBtn').innerHTML = '<i class="fas fa-play"></i> Reanudar';
    playSound('pause');
}

function resumeAnimation() {
    if (!animationRunning || !animationPaused) return;

    animationPaused = false;
    document.getElementById('startBtn').innerHTML = '<i class="fas fa-stop"></i> Detener';
    playSound('resume');
}

function stopAnimation() {
    animationRunning = false;
    animationPaused = false;
    currentFrame = 0;

    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }

    // Detener animaciones GSAP
    gsap.killTweensOf("*");

    // Limpiar estados
    clearAllActiveStates();

    // Resetear UI
    document.getElementById('startBtn').innerHTML = '<i class="fas fa-play"></i> Iniciar Animación';
    document.getElementById('startBtn').classList.remove('btn-danger');
    document.getElementById('startBtn').classList.add('btn-primary');

    // Limpiar canvas
    const canvas = document.getElementById('signalCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    playSound('stop');
}

function resetAnimation() {
    stopAnimation();

    // Resetear estadísticas
    stats = {
        bytesProcessed: 0,
        currentSlot: 0,
        transferRate: 0,
        efficiency: 100
    };
    updateStats();

    // Resetear canales
    channels.forEach((channel, index) => {
        channel.currentBit = 0;
        const outputData = document.getElementById(`output-data-${index}`);
        if (outputData) {
            outputData.innerHTML = '';
        }
    });

    // Resetear señal
    updateVisualization();
}

// ===== FUNCIONES DE VISUALIZACIÓN =====
function updateVisualization() {
    updateSignal(-1);
}

// ===== EFECTOS DE SONIDO =====
function playSound(type) {
    if (!document.getElementById('enableSound').checked || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch(type) {
        case 'start':
            oscillator.frequency.value = 523.25; // C5
            gainNode.gain.value = 0.1;
            break;
        case 'pause':
            oscillator.frequency.value = 392; // G4
            gainNode.gain.value = 0.08;
            break;
        case 'resume':
            oscillator.frequency.value = 440; // A4
            gainNode.gain.value = 0.08;
            break;
        case 'stop':
            oscillator.frequency.value = 261.63; // C4
            gainNode.gain.value = 0.05;
            break;
        case 'bit':
            oscillator.frequency.value = 880; // A5
            gainNode.gain.value = 0.02;
            break;
    }

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

// ===== GESTIÓN DE TABS =====
function switchTab(targetTab) {
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${targetTab}"]`).classList.add('active');

    // Actualizar contenido
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(targetTab).classList.add('active');

    // Animar transición
    gsap.from('.tab-pane.active', {y: 20, opacity: 0, duration: 0.5});
}

// ===== FUNCIONES ÚTILES =====
function getRandomColor() {
    const colors = [
        '#2563eb', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===== EXPORTACIÓN Y COMPARTIR =====
function exportAnimation() {
    const config = {
        numChannels: channels.length,
        data: channels.map(ch => ch.data),
        speed: document.getElementById('animationSpeed').value,
        timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tdm-animation-config.json';
    a.click();
    URL.revokeObjectURL(url);
}

function shareAnimation() {
    const config = {
        numChannels: channels.length,
        data: channels.map(ch => ch.data)
    };

    const encoded = btoa(JSON.stringify(config));
    const url = window.location.origin + window.location.pathname + '?config=' + encoded;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            alert('¡Enlace copiado al portapapeles!');
        });
    }
}

// ===== DETECCIÓN DE CONFIGURACIÓN EN URL =====
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const config = urlParams.get('config');

    if (config) {
        try {
            const decoded = JSON.parse(atob(config));
            document.getElementById('numChannels').value = decoded.numChannels;
            document.getElementById('numChannelsValue').textContent = decoded.numChannels;
            document.getElementById('dataInput').value = decoded.data.join(',');

            createChannels(decoded.numChannels);
        } catch (e) {
            console.error('Error al cargar configuración:', e);
        }
    }
});

// ===== TECLAS DE ACCESO RÁPIDO =====
document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case ' ':
            e.preventDefault();
            if (animationRunning) {
                pauseAnimation();
            } else {
                startAnimation();
            }
            break;
        case 'r':
        case 'R':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                resetAnimation();
            }
            break;
        case 's':
        case 'S':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                exportAnimation();
            }
            break;
    }
});