/**
 * ============================================================================
 * ATDM SIMULATOR - Multiplexación por División de Tiempo Asíncrona
 * ============================================================================
 * 
 * Simulador educativo de ATDM basado en los principios de Forouzan.
 * Características:
 * - Direccionamiento dinámico (bits calculados según número de canales)
 * - Multiplexación estadística (m < n)
 * - Escaneo de buffers y llenado de tramas bajo demanda
 * 
 * @author Edwin Noé 
 * @version 1.0.0
 */

class ATDMSimulator {
    /**
     * Constructor del simulador ATDM
     * 
     * @param {number} numChannels - Número de canales de entrada (n)
     * @param {number} frameSize - Número de slots por trama (m, debe ser m <= n)
     */
    constructor(numChannels, frameSize) {
        // Validación de parámetros
        if (numChannels < 2) {
            throw new Error('El número de canales debe ser al menos 2');
        }
        if (frameSize > numChannels) {
            console.warn(`frameSize (${frameSize}) > numChannels (${numChannels}). Ajustando frameSize.`);
            frameSize = numChannels;
        }
        if (frameSize < 1) {
            throw new Error('El tamaño de trama debe ser al menos 1');
        }

        this.numChannels = numChannels;
        this.frameSize = frameSize;
        
        // Cálculo dinámico de bits de dirección (Fórmula de Forouzan)
        this.addressBits = Math.ceil(Math.log2(numChannels));
        
        // Buffers de entrada (cola de datos pendientes por canal)
        this.inputBuffers = Array.from({ length: numChannels }, () => []);
        
        // Buffers de salida (datos reconstruidos por canal)
        this.outputBuffers = Array.from({ length: numChannels }, () => []);
        
        // Puntero de escaneo del MUX (simula el escaneo round-robin)
        this.scanPointer = 0;
        
        // Trama actual en construcción
        this.currentFrame = [];
        
        // Estadísticas
        this.stats = {
            totalFramesSent: 0,
            totalSlotsSent: 0,
            totalSlotsUsed: 0,
            totalDataProcessed: 0,
            efficiency: 0,
            totalBits: 0,
            realBits: 0
        };
    }

    /**
     * Carga datos en los buffers de entrada de los canales
     * 
     * @param {string} dataString - String con datos separados por comas (ej: "JAHIR,EDWIN,ALEXIS")
     */
    loadData(dataString) {
        // Parsear y limpiar datos
        const dataParts = dataString.split(',').map(s => s.trim());
        
        // Distribuir datos a los canales (permitir vacíos)
        dataParts.forEach((data, index) => {
            if (index < this.numChannels) {
                // Convertir el string en un array de caracteres (cola FIFO)
                // Si está vacío, será un array vacío (dispositivo sin datos)
                this.inputBuffers[index] = data.length > 0 ? data.split('') : [];
            }
        });
    }

    /**
     * Convierte un número decimal a binario con padding a la izquierda
     * 
     * @param {number} decimal - Número decimal a convertir
     * @param {number} bits - Número de bits deseados (con padding)
     * @returns {string} - Representación binaria (ej: "010" para 2 en 3 bits)
     */
    decimalToBinary(decimal, bits) {
        return decimal.toString(2).padStart(bits, '0');
    }

    /**
     * Convierte una dirección binaria a decimal
     * 
     * @param {string} binary - String binario (ej: "010")
     * @returns {number} - Número decimal
     */
    binaryToDecimal(binary) {
        return parseInt(binary, 2);
    }

    /**
     * Motor de Multiplexación (un paso de animación)
     * 
     * Escanea los buffers de entrada y construye slots para la trama.
     * Implementa el comportamiento asíncrono: solo toma datos de canales activos.
     * 
     * @returns {object|null} - Trama completa o null si no hay datos
     */
    stepMux() {
        // Si la trama actual ya está llena, retornarla y empezar una nueva
        if (this.currentFrame.length >= this.frameSize) {
            const completedFrame = [...this.currentFrame];
            this.currentFrame = [];
            return completedFrame;
        }

        // Verificar si hay datos pendientes en algún canal
        const hasData = this.inputBuffers.some(buffer => buffer.length > 0);
        
        if (!hasData) {
            // No hay más datos, enviar trama parcial si existe
            if (this.currentFrame.length > 0) {
                const partialFrame = [...this.currentFrame];
                this.currentFrame = [];
                
                // Actualizar estadísticas para la trama parcial
                this.stats.totalFramesSent++;
                this.stats.totalSlotsSent += this.frameSize; // La trama siempre tiene tamaño fijo S
                this.stats.totalSlotsUsed += partialFrame.length;
                this.updateEfficiency();
                
                return partialFrame;
            }
            return null; // Fin de la transmisión
        }

        // Escaneo de canales (comportamiento asíncrono)
        let scannedChannels = 0;
        let slotCreated = false;

        // Intentar llenar UN slot en este paso
        while (scannedChannels < this.numChannels && !slotCreated) {
            const channelIndex = (this.scanPointer + scannedChannels) % this.numChannels;
            const buffer = this.inputBuffers[channelIndex];

            // Si el canal tiene datos, crear un slot
            if (buffer.length > 0) {
                const data = buffer.shift(); // Extraer primer elemento (FIFO)
                const binaryAddress = this.decimalToBinary(channelIndex, this.addressBits);

                // Crear slot con cabecera de dirección
                const slot = {
                    channelID: channelIndex,
                    binaryAddress: binaryAddress,
                    data: data
                };

                this.currentFrame.push(slot);
                slotCreated = true;

                // Actualizar puntero de escaneo (siguiente canal)
                this.scanPointer = (channelIndex + 1) % this.numChannels;
                
                // Actualizar estadísticas
                this.stats.totalDataProcessed++;
            }

            scannedChannels++;
        }

        // Si completamos la trama en este paso, retornarla
        if (this.currentFrame.length >= this.frameSize) {
            const completedFrame = [...this.currentFrame];
            this.currentFrame = [];
            
            // Actualizar estadísticas de trama enviada
            this.stats.totalFramesSent++;
            this.stats.totalSlotsSent += this.frameSize;
            this.stats.totalSlotsUsed += completedFrame.length;
            this.updateEfficiency();
            
            return completedFrame;
        }

        // Si no creamos ningún slot pero hay datos, avanzar el puntero
        if (!slotCreated && hasData) {
            this.scanPointer = (this.scanPointer + 1) % this.numChannels;
        }

        return null; // Trama aún en construcción
    }

    /**
     * Motor de Demultiplexación
     * 
     * Recibe una trama del MUX y distribuye los datos a los buffers de salida
     * usando la dirección binaria de cada slot.
     * 
     * @param {Array} frame - Trama con slots [{channelID, binaryAddress, data}, ...]
     */
    stepDemux(frame) {
        if (!frame || frame.length === 0) {
            return;
        }

        frame.forEach(slot => {
            // Convertir dirección binaria a índice de canal
            const channelIndex = this.binaryToDecimal(slot.binaryAddress);
            
            // Validar que el índice sea válido
            if (channelIndex >= 0 && channelIndex < this.numChannels) {
                // Entregar dato al buffer de salida correspondiente
                this.outputBuffers[channelIndex].push(slot.data);
            } else {
                console.error(`Dirección inválida: ${slot.binaryAddress} (Canal ${channelIndex})`);
            }
        });
    }

    /**
     * Actualiza el cálculo de eficiencia
     */
    updateEfficiency() {
        if (this.stats.totalSlotsSent > 0) {
            this.stats.efficiency = Math.round(
                (this.stats.totalSlotsUsed / this.stats.totalSlotsSent) * 100
            );
        }
    }

    /**
     * Obtiene estadísticas actuales de la simulación
     * 
     * @returns {object} - Objeto con métricas de desempeño
     */
    getStats() {
        // Calcular datos pendientes
        const pending = this.inputBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
        
        // Mapeo de variables según la imagen proporcionada:
        // F = número de tramas enviadas
        const F = this.stats.totalFramesSent;
        
        // S = número de ranuras por trama
        const S = this.frameSize;
        
        // R = número total de ranuras (F * S)
        const R = this.stats.totalSlotsSent;
        
        // bd = bits de datos por ranura (8 bits)
        const bd = 8;
        
        // bdir = bits de dirección por ranura (log2(N))
        const bdir = this.addressBits;
        
        // bsync = bits de sincronización por trama (1 bit)
        const bsync = 1;
        
        // Fórmula de bits totales (según imagen):
        // Bits totales = F * S * bd + F * S * bdir + F * bsync
        // Nota: F * S es equivalente a R
        const totalBits = (F * S * bd) + (F * S * bdir) + (F * bsync);
                         
        // Bits Reales = Slots Usados * Bits Datos
        const realBits = this.stats.totalSlotsUsed * bd;
        
        return {
            totalRequests: this.stats.totalDataProcessed + pending,
            pending: pending,
            processed: this.stats.totalDataProcessed,
            efficiency: this.stats.efficiency,
            framesSent: this.stats.totalFramesSent,
            totalSlots: this.stats.totalSlotsSent,
            usedSlots: this.stats.totalSlotsUsed,
            addressBits: this.addressBits,
            totalBits: totalBits,
            realBits: realBits
        };
    }

    /**
     * Obtiene el estado de los buffers de entrada
     * 
     * @returns {Array} - Array con el contenido de cada buffer
     */
    getInputBuffers() {
        return this.inputBuffers.map(buffer => buffer.join(''));
    }

    /**
     * Obtiene el estado de los buffers de salida
     * 
     * @returns {Array} - Array con el contenido de cada buffer
     */
    getOutputBuffers() {
        return this.outputBuffers.map(buffer => buffer.join(''));
    }

    /**
     * Resetea el simulador a su estado inicial
     */
    reset() {
        this.inputBuffers = Array.from({ length: this.numChannels }, () => []);
        this.outputBuffers = Array.from({ length: this.numChannels }, () => []);
        this.scanPointer = 0;
        this.currentFrame = [];
        this.stats = {
            totalFramesSent: 0,
            totalSlotsSent: 0,
            totalSlotsUsed: 0,
            totalDataProcessed: 0,
            efficiency: 0
        };
    }

    /**
     * Verifica si la simulación ha terminado
     * 
     * @returns {boolean} - true si no hay más datos por procesar
     */
    isComplete() {
        const hasInputData = this.inputBuffers.some(buffer => buffer.length > 0);
        return !hasInputData && this.currentFrame.length === 0;
    }
}
