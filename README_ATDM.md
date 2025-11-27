# README - Simulador ATDM (Asynchronous Time Division Multiplexing)

## 📚 Fundamento Teórico

### ¿Qué es ATDM?

**ATDM (Asynchronous Time Division Multiplexing)** es una técnica de multiplexación estadística donde:
- **n canales de entrada** comparten un medio de transmisión común
- **m slots por trama** (donde **m ≤ n**)
- Cada slot incluye **dirección explícita** del canal origen
- Solo se transmiten datos de canales activos (estadístico)

### Diferencia con TDM Síncrono

| TDM Síncrono | TDM Asíncrono (ATDM) |
|--------------|----------------------|
| m = n (slots fijos por canal) | m ≤ n (slots dinámicos) |
| Sin direccionamiento | Con dirección por slot |
| Desperdicío de bandwidth si canal vacío | Eficiencia: solo canales activos |

---

## 🏗️ Arquitectura del Simulador

### Componentes Principales

```
┌─────────────────┐
│ ATDMSimulator   │  ← Lógica de negocio (ATDMSimulator.js)
├─────────────────┤
│ - inputBuffers  │  Cola de entrada por canal
│ - outputBuffers │  Cola de salida por canal
│ - frameSize (m) │  Slots por trama
│ - numChannels   │  Canales totales (n)
│ - addressBits   │  Bits calculados: ceil(log2(n))
└─────────────────┘

┌─────────────────┐
│ React UI        │  ← Interfaz (asincrono.html)
├─────────────────┤
│ - Configuración │
│ - Visualización │
│ - Control       │
└─────────────────┘
```

---

## ⚙️ Lógica del Multiplexor (MUX)

### Algoritmo `stepMux()`

```javascript
1. Iniciar trama vacía: currentFrame = []
2. Escanear canales en round-robin (0 → n-1):
   MIENTRAS (trama no llena Y hay datos pendientes):
     a. Revisar canal[i]
     b. SI canal[i] tiene datos:
        - Extraer primer carácter
        - Calcular dirección binaria: decimalToBinary(i, addressBits)
        - Crear slot: { channelID: i, binaryAddress: "010", data: "A" }
        - Agregar slot a trama
        - i = (i + 1) % n  (siguiente canal)
     c. SINO:
        - i = (i + 1) % n  (saltar canal vacío)
3. Retornar trama completa SI tiene al menos 1 slot
```

### Ejemplo Práctico

**Configuración:**
- n = 5 canales
- m = 3 slots por trama
- Bits de dirección: ceil(log2(5)) = 3 bits

**Estado Inicial:**
```
Canal 0: "AAAAA"
Canal 1: "BBBB"
Canal 2: "CCC"
Canal 3: "DD"
Canal 4: "E"
```

**Proceso Trama #1:**
```
Scan Canal 0: Tiene "AAAAA" → Slot [000|A] C0
Scan Canal 1: Tiene "BBBB"  → Slot [001|B] C1
Scan Canal 2: Tiene "CCC"   → Slot [010|C] C2
Trama llena (3 slots)

Resultado: Trama #1 = [[000|A]C0, [001|B]C1, [010|C]C2]
```

**Estado después de Trama #1:**
```
Canal 0: "AAAA"  (consumió 'A')
Canal 1: "BBB"   (consumió 'B')
Canal 2: "CC"    (consumió 'C')
Canal 3: "DD"    (sin cambios)
Canal 4: "E"     (sin cambios)
```

---

## 🔄 Lógica del Demultiplexor (DEMUX)

### Algoritmo `stepDemux(frame)`

```javascript
1. Recibir trama completa
2. PARA cada slot en trama:
   a. Leer binaryAddress (ej: "010")
   b. Convertir a decimal: channelID = binaryToDecimal("010") = 2
   c. Extraer data del slot
   d. Entregar data a outputBuffer[channelID]
3. Actualizar estadísticas
```

### Ejemplo de Demultiplexación

**Trama Recibida:** `[[000|A]C0, [001|B]C1, [010|C]C2]`

**Proceso:**
```
Slot 1: Dirección "000" → Canal 0 → Output[0] += "A"
Slot 2: Dirección "001" → Canal 1 → Output[1] += "B"
Slot 3: Dirección "010" → Canal 2 → Output[2] += "C"
```

**Resultado Output:**
```
Output[0]: "A"
Output[1]: "B"
Output[2]: "C"
Output[3]: ""
Output[4]: ""
```

---

## 📊 Estructuras de Datos

### Slot

```javascript
{
  channelID: 2,           // ID del canal (0-indexed)
  binaryAddress: "010",   // Dirección en binario
  data: "C"               // Carácter transmitido
}
```

### Frame (Trama)

```javascript
[
  { channelID: 0, binaryAddress: "000", data: "A" },
  { channelID: 1, binaryAddress: "001", data: "B" },
  { channelID: 2, binaryAddress: "010", data: "C" }
]
```

### Estado del Simulador

```javascript
{
  inputBuffers: ["AAAA", "BBB", "CC", "DD", "E"],
  outputBuffers: ["A", "B", "C", "", ""],
  currentFrame: [...],
  framesSent: 1,
  totalRequests: 14,  // Total caracteres
  processed: 3,       // Caracteres enviados
  pending: 11,        // Caracteres restantes
  efficiency: 100%    // (Slots usados / Slots totales) * 100
}
```

---

## 🧮 Cálculo de Bits de Dirección

### Fórmula

```
addressBits = ceil(log2(numChannels))
```

### Ejemplos

| Canales (n) | Bits requeridos | Rango binario |
|-------------|----------------|---------------|
| 2           | 1 bit          | 0-1          |
| 3-4         | 2 bits         | 00-11        |
| 5-8         | 3 bits         | 000-111      |
| 9-16        | 4 bits         | 0000-1111    |

### Implementación

```javascript
decimalToBinary(channelID, bits) {
  return channelID.toString(2).padStart(bits, '0');
}

// Ejemplo: decimalToBinary(5, 3) = "101"
```

---

## 📈 Métricas de Eficiencia

### Fórmula de Eficiencia

```
Eficiencia = (Slots Utilizados / Slots Totales Enviados) × 100
```

### Casos

**Caso Ideal (100%):**
```
Todos los canales tienen datos
Trama #1: [A, B, C]  (3/3 slots)
Eficiencia = 100%
```

**Caso Subóptimo (<100%):**
```
Solo 2 canales tienen datos, pero m=3
Trama #1: [A, B]  (2/3 slots - trama incompleta)
Eficiencia = 66.67%
```

---

## 🔄 Ciclo de Vida de la Simulación

### Flujo Completo

```
1. INICIALIZACIÓN
   └─> numChannels = 5, frameSize = 3
   └─> inputBuffers = ["AAAAA", "BBBB", "CCC", "DD", "E"]

2. MULTIPLEXACIÓN (Loop)
   ┌─> stepMux()
   │   └─> Escanea canales
   │   └─> Construye trama
   │   └─> Retorna trama completa
   │
   └─> MIENTRAS (hay datos pendientes):
       └─> Repetir stepMux()

3. TRANSMISIÓN (Conceptual)
   └─> Trama viaja por "canal"

4. DEMULTIPLEXACIÓN
   └─> stepDemux(frame)
       └─> Lee dirección de cada slot
       └─> Entrega a outputBuffer correcto

5. RESULTADO
   └─> outputBuffers = ["AAAAA", "BBBB", "CCC", "DD", "E"]
   └─> Datos reconstruidos en destino
```

---

## 🎯 Características del Algoritmo

### Escaneo Round-Robin

- **Justo**: Todos los canales tienen igual oportunidad
- **Secuencial**: 0 → 1 → 2 → ... → n-1 → 0
- **Asíncrono**: Salta canales vacíos (no desperdicía slots)

### Condición de Parada

```javascript
if (currentFrame.length >= frameSize) {
  // Trama llena
  return currentFrame;
}

if (allBuffersEmpty()) {
  // Ya no hay más datos
  return currentFrame.length > 0 ? currentFrame : null;
}
```

### Estado de Completitud

```javascript
isComplete() {
  return inputBuffers.every(buffer => buffer.length === 0);
}
```

---

## 🚀 Optimizaciones Implementadas

### 1. Cálculo Dinámico de Bits
```javascript
// Se recalcula automáticamente al cambiar numChannels
this.addressBits = Math.ceil(Math.log2(this.numChannels));
```

### 2. Escaneo Eficiente
```javascript
// No espera a canales vacíos
while (currentFrame.length < this.frameSize && !allEmpty) {
  if (this.inputBuffers[currentChannel].length > 0) {
    // Procesar
  } else {
    // Siguiente canal inmediatamente
  }
}
```

### 3. Validación de Entrada
```javascript
// Verifica que cantidad de datos = cantidad de canales
items.length === numChannels
```

---

## 📝 Ejemplo Completo Paso a Paso

### Configuración Inicial
```
n = 3 canales
m = 2 slots por trama
addressBits = 2 bits

Input:
Canal 0: "AB"
Canal 1: "CD"
Canal 2: "E"
```

### Ejecución

**Trama #1:**
```
Scan C0: "AB" → [00|A] C0  (Frame: 1 slot)
Scan C1: "CD" → [01|C] C1  (Frame: 2 slots - LLENA)
Return: [[00|A]C0, [01|C]C1]

DEMUX: Output[0]="A", Output[1]="C"

Estado:
C0: "B", C1: "D", C2: "E"
```

**Trama #2:**
```
Scan C0: "B"  → [00|B] C0  (Frame: 1 slot)
Scan C1: "D"  → [01|D] C1  (Frame: 2 slots - LLENA)
Return: [[00|B]C0, [01|D]C1]

DEMUX: Output[0]="AB", Output[1]="CD"

Estado:
C0: "", C1: "", C2: "E"
```

**Trama #3:**
```
Scan C0: vacío
Scan C1: vacío
Scan C2: "E"  → [10|E] C2  (Frame: 1 slot)
Scan C0: vacío
Scan C1: vacío
Scan C2: vacío
Todos vacíos, retornar trama parcial
Return: [[10|E]C2]

DEMUX: Output[2]="E"

Estado: COMPLETO
Eficiencia = 5 slots usados / 5 slots totales = 100%
```

---

## 🔧 Parámetros Configurables

| Parámetro | Rango | Restricción | Descripción |
|-----------|-------|-------------|-------------|
| `numChannels` (n) | 2-8 | n ≥ 2 | Canales de entrada |
| `frameSize` (m) | 1-n | m ≤ n | Slots por trama |
| `animationSpeed` | 500-3000ms | - | Velocidad de simulación |
| `inputData` | String CSV | items = n | Datos separados por comas |

---

## 📖 Referencias

- Forouzan, B. (2007). *Data Communications and Networking* (4th ed.)
  - Capítulo: Time Division Multiplexing (TDM)
  - Sección: Statistical TDM (ATDM)

---

## 🎓 Conceptos Clave para Estudiantes

1. **Multiplexación Estadística**: Aprovecha que no todos los canales están activos simultáneamente
2. **Overhead de Dirección**: Cada slot necesita bits extra para indicar su origen
3. **Eficiencia vs TDM**: ATDM es más eficiente cuando hay tráfico irregular
4. **Trade-off**: Más bits de dirección vs mejor utilización del canal

---

## 💡 Casos de Uso Educativos

### Experimento 1: Eficiencia con Canales Inactivos
```
n=5, m=3
Input: "AAAAA","","","",""
→ Observar que solo C0 transmite, eficiencia 100%
```

### Experimento 2: Overhead de Direccionamiento
```
n=2 (1 bit) vs n=8 (3 bits)
→ Comparar overhead relativo
```

### Experimento 3: Saturación
```
n=5, m=5 (ATDM → TDM)
Input: "AAAAA","BBBB","CCC","DD","E"
→ Comportamiento similar a TDM síncrono
```

---

**Desarrollado para fines educativos - Simulador ATDM**
