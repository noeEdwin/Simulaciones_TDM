# 🌐 Fundamentos de Telecomunicaciones - Multiplexación por División de Tiempo

Plataforma educativa interactiva completa para aprender los conceptos fundamentales de la **Multiplexación por División de Tiempo (TDM)** con dos modalidades: síncrona y asíncrona. Incluye animaciones en tiempo real, controles intuitivos y diseño moderno.

## 📁 Estructura de Archivos

```
ANIMACIONVALVERDE/
├── 📄 index.html                          # 🎯 Portal principal
├── 📄 home.html                           # Copia del portal principal
├── 📄 README.md                           # 📖 Documentación general
├── 📄 README_ATDM.md                      # 📖 Documentación técnica ATDM
├── 📄 README_STRUCTURE.md                 # 📖 Arquitectura MVC del proyecto
│
├── 📁 views/                              # VISTAS: Aplicaciones HTML
│   ├── asynchronous/
│   │   ├── asincrono.html                # ⚡ TDM Asíncrono (ATDM) - App principal
│   │   └── atdm.html                     # Vista ATDM original
│   ├── synchronous/
│   │   └── sincrono.html                 # 🔄 TDM Síncrono
│   └── pages/
│       ├── nosotros.html                 # Página del equipo
│       └── quiz.html                     # Test de conocimiento
│
├── 📁 js/                                 # JavaScript (Arquitectura MVC)
│   ├── models/                           # MODELO: Lógica de negocio
│   │   └── ATDMSimulator.js             # Algoritmo ATDM completo
│   ├── controllers/                      # CONTROLADOR: Lógica UI
│   │   └── atdm-controller.js           # Controlador React para ATDM
│   ├── synchronous/                      # Scripts TDM Síncrono
│   │   ├── script.js
│   │   └── react-animation.js
│   └── utils/                            # Utilidades
│       └── quiz.js
│
├── 📁 css/                                # Estilos CSS por módulo
│   ├── home/
│   │   └── home.css                     # Estilos portal principal
│   ├── asynchronous/
│   │   ├── atdm-styles.css              # Estilos ATDM
│   │   └── atdm-modern-theme.css        # Sistema de diseño ATDM
│   ├── synchronous/
│   │   ├── react-styles.css
│   │   └── react-styles-modern.css
│   └── pages/
│       ├── nosotros.css
│       └── quiz.css
│
└── 📁 assets/                             # Recursos estáticos
    ├── images/                           # Imágenes
    └── docs/                             # Documentos PDF
```

## 🚀 ¿Cómo Empezar?

### 1. **Página Principal** 🏠
- **Archivo**: `home.html`
- **Función**: Portal de acceso a ambas aplicaciones
- **Características**:
  - Comparación visual entre síncrono y asíncrono
  - Guía de aprendizaje sugerida
  - Estadísticas y características de cada sistema

### 2. **TDM Síncrono** 🔄
- **Archivo**: `index.html`
- **Descripción**: Multiplexación con intervalos de tiempo fijos
- **Acceso**: Desde `home.html` o directamente
- **Características**:
  - Intervalos predefinidos para cada canal
  - Sistema predecible y ordenado
  - Ideal para aprendizaje básico
  - Tramas que permanecen visibles al terminar

### 3. **TDM Asíncrono (ATDM)** ⚡
- **Archivo**: `views/asynchronous/asincrono.html`
- **Descripción**: Multiplexación estadística con direccionamiento dinámico
- **Acceso**: Desde el portal principal o directamente vía URL
- **Características**:
  - **Asignación dinámica bajo demanda**: Solo canales con datos ocupan slots
  - **Direccionamiento explícito**: Cada slot incluye bits de dirección del canal origen
  - **Eficiencia optimizada**: m ≤ n (slots por trama ≤ número de canales)
  - **Buffers de entrada/salida**: Visualización completa del flujo MUX/DEMUX
  - **Estadísticas en tiempo real**: Eficiencia, slots usados, datos procesados
  - **Algoritmo Round-Robin**: Escaneo justo y secuencial de todos los canales

**📖 Documentación Técnica Completa:** Ver [`README_ATDM.md`](README_ATDM.md) para:
- Algoritmos de multiplexación y demultiplexación paso a paso
- Cálculo de bits de dirección
- Ejemplos completos con tramas
- Métricas de eficiencia
- Casos de uso educativos

## ✨ Características Principales

### 🎨 **Diseño Profesional**
- Interfaz moderna con gradientes y animaciones suaves
- Diseño responsive para todos los dispositivos
- Portal principal intuitivo con navegación clara
- Animaciones fluidas con GSAP y CSS3

### 🎛️ **Controles Interactivos**
- **Número de canales**: 2-8 canales configurables
- **Velocidad de animación**: ajustable desde 100ms hasta 2 segundos
- **Datos personalizados**: ingresa tus propios datos para visualizar
- **Opciones de visualización**: cuadrícula, etiquetas, efectos de sonido

### 📊 **Visualización Completa**
- **Canales de entrada/ salida**: muestra datos individuales
- **Multiplexores (MUX/DEMUX)**: animación del proceso
- **Señal multiplexada**: canvas en tiempo real
- **Indicador de time slots**: muestra qué canal está activo
- **Estadísticas en tiempo real**: tasa de transferencia, bytes procesados

### 🔊 **Características Adicionales**
- Efectos de sonido opcionales
- Exportación de configuración
- Atajos de teclado
- Tabs informativos con teoría y ejemplos

## 🚀 Instalación y Uso

### Opción 1: Abrir directamente
1. Descarga los archivos del proyecto
2. Abre `index.html` en tu navegador web (portal principal)
3. Desde ahí accede a las simulaciones:
   - TDM Síncrono
   - TDM Asíncrono (ATDM)
   - Test de Conocimiento

### Opción 2: Servidor local (Recomendado)
```bash
# Clona el repositorio
git clone [URL-del-repositorio]

# Entra al directorio
cd animacionValverde

# Inicia un servidor local
python3 -m http.server 8000
# o con Node.js
npx http-server

# Abre en tu navegador:
# - Portal: http://localhost:8000/
# - ATDM: http://localhost:8000/views/asynchronous/asincrono.html
# - TDM Síncrono: http://localhost:8000/views/synchronous/sincrono.html
# - Quiz: http://localhost:8000/views/pages/quiz.html
```

### 📚 Documentación Adicional
- **Arquitectura del Proyecto**: Ver [`README_STRUCTURE.md`](README_STRUCTURE.md)
- **Detalles Técnicos ATDM**: Ver [`README_ATDM.md`](README_ATDM.md)

## 🎮 Cómo Usar

### 1. **Configurar Canales**
- Usa el deslizador "Número de Canales" para seleccionar entre 2-8 canales
- Ingresa tus datos en el campo "Datos de Entrada" (separados por comas)

### 2. **Ajustar Animación**
- Controla la velocidad con el deslizador "Velocidad de Animación"
- Activa/desactiva opciones de visualización según prefieras

### 3. **Iniciar Animación**
- Presiona "Iniciar Animación" para comenzar
- Usa "Pausar" para detener temporalmente
- "Reiniciar" vuelve al estado inicial

### 4. **Observar el Proceso**
- Los canales se activan secuencialmente (Time Division)
- El multiplexor selecciona un canal a la vez
- La señal compuesta se muestra en el canvas
- Los datos se reconstruyen en los canales de salida

## 🎯 Conceptos Técnicos Visualizados

### **Time Division Multiplexing (TDM)**
La aplicación demuestra cómo TDM permite compartir un medio de transmisión:

1. **Time Slots**: Cada canal tiene un intervalo de tiempo exclusivo
2. **Ciclos**: Los time slots se repiten secuencialmente
3. **Sincronización**: MUX y DEMUX deben estar sincronizados
4. **Eficiencia**: Uso óptimo del ancho de banda

### **Componentes Visualizados**
- **Canales de Entrada**: Fuentes de datos originales
- **Multiplexor (MUX)**: Combina los canales
- **Señal Multiplexada**: Flujo único de datos
- **Demultiplexor (DEMUX)**: Separa los canales
- **Canales de Salida**: Datos reconstruidos

## ⌨️ Atajos de Teclado

| Tecla | Función |
|-------|---------|
| `Espacio` | Iniciar/Pausar animación |
| `Ctrl + R` | Reiniciar animación |
| `Ctrl + S` | Exportar configuración |

## 🎨 Personalización

### **Modificar Colores**
Edita las variables CSS en `styles.css`:
```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #10b981;
    --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### **Agregar Nuevas Animaciones**
El sistema usa GSAP para animaciones avanzadas:
```javascript
// Ejemplo de nueva animación
gsap.to(element, {
    scale: 1.2,
    rotation: 360,
    duration: 0.5,
    ease: "power2.inOut"
});
```

### **Extender Funcionalidad**
La arquitectura modular permite agregar fácilmente:
- Nuevos tipos de multiplexación
- Algoritmos de scheduling
- Protocolos de comunicación
- Métricas adicionales

## 🏗️ Arquitectura del Proyecto

### **Patrón MVC (Model-View-Controller)**

El proyecto sigue una arquitectura **MVC limpia** para separar responsabilidades:

- **Model** (`/js/models/`): Lógica de negocio pura (algoritmos ATDM)
  - `ATDMSimulator.js`: Multiplexación, demultiplexación, gestión de buffers
  - Sin dependencias de UI o DOM
  - Completamente testeable de forma aislada

- **View** (`/views/` + `/css/`): Presentación visual
  - HTML puro con React embebido
  - Estilos CSS modulares por componente
  - Sin lógica de negocio

- **Controller** (`/js/controllers/`): Orquestación
  - `atdm-controller.js`: Componente React que conecta Model y View
  - Manejo de eventos de usuario
  - Gestión de estado y animaciones

**📖 Más detalles**: Ver [`README_STRUCTURE.md`](README_STRUCTURE.md)

---

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **HTML5**: Estructura semántica moderna
- **CSS3**: Animaciones, Grid, Flexbox, Variables CSS
- **JavaScript ES6+**: Clases, módulos, async/await
- **React 18**: Componentes funcionales con hooks (sin build step)
- **Babel Standalone**: Transpilación JSX en el navegador

### **Librerías Externas**
- **Google Fonts**: Tipografía Inter
- **Font Awesome 6**: Iconos vectoriales
- **Chart.js 4**: Gráficos y visualizaciones en tiempo real

### **APIs Navegador**
- **Canvas API**: Dibujo de señales multiplexadas
- **Local Storage**: Persistencia de configuraciones

## 📱 Compatibilidad

### **Navegadores Soportados**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### **Dispositivos**
- ✅ Desktop (Windows, macOS, Linux)
- ✅ Tablets (iPad, Android Tablets)
- ✅ Smartphones (iOS, Android)

## 🎓 Uso Educativo

Esta herramienta es ideal para:

### **Estudiantes de**
- Ingeniería de Telecomunicaciones
- Redes de Computadoras
- Sistemas Digitales
- Comunicaciones

### **Conceptos que enseña**
- Multiplexación en telecomunicaciones
- Gestión de ancho de banda
- Sincronización de sistemas
- Procesamiento digital de señales

## 🔄 Ejemplos de Configuración

### **TDM Síncrono - Telefonía Digital**
```
Número de Canales: 4
Datos de Entrada: "VOZ1,VOZ2,VOZ3,VOZ4"
Velocidad: 500ms
Características: Slots fijos, predecible, sin direccionamiento
```

### **ATDM - Transmisión de Datos con Canales Irregulares**
```
Número de Canales: 5
Slots por Trama: 3 (m < n para eficiencia)
Datos de Entrada: "AAAAA,BBBB,CCC,DD,E"
Velocidad: 1500ms
Características: 
- Solo canales activos transmiten
- Direccionamiento automático (3 bits para 5 canales)
- Eficiencia: 100% con m < n
- Visualización de buffers de entrada/salida
```

### **ATDM - Simulación de Tráfico Bursty**
```
Número de Canales: 8
Slots por Trama: 4
Datos de Entrada: "DATA1,,,DATA4,,,DATA7,"
Velocidad: 800ms
Características:
- Algunos canales vacíos (tráfico irregular)
- ATDM aprovecha slots no utilizados
- Mayor eficiencia vs TDM síncrono
```

### **Comparación de Eficiencia**
```
TDM Síncrono (m=n):
- 5 canales, 5 slots/trama
- Canales vacíos desperdician slots
- Eficiencia depende de tráfico

ATDM (m≤n):
- 5 canales, 3 slots/trama
- Solo canales con datos usan slots
- Overhead: bits de dirección
- Eficiencia óptima con tráfico irregular
```

**💡 Tip**: Ver [`README_ATDM.md`](README_ATDM.md) para ejemplos paso a paso completos con tramas detalladas.

## 🚀 Mejoras Futuras

### **Próximas Características**
- [ ] Multiplexación por división de frecuencia (FDM)
- [ ] Multiplexación por división de código (CDM)
- [ ] Simulación de ruido y errores
- [ ] Protocolos de corrección de errores
- [ ] Modo de comparación (TDM vs FDM)
- [ ] Exportación a video

### **Mejoras Técnicas**
- [ ] WebAssembly para mejor rendimiento
- [ ] WebGL para visualizaciones 3D
- [ ] PWA para instalación offline
- [ ] API para integración externa

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Puedes usarlo, modificar y distribuir libremente.

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. **Fork** el proyecto
2. Crea una rama (`git checkout -b feature/mejora-asombrosa`)
3. Commit tus cambios (`git commit -m 'Añadir mejora asombrosa'`)
4. Push a la rama (`git push origin feature/mejora-asombrosa`)
5. Abre un Pull Request

## 📞 Contacto

- **Autor**: Animación Valverde Studio
- **Email**: contacto@animacionvalverde.com
- **Web**: https://animacionvalverde.com

---

⭐ **Si te gusta este proyecto, no olvides darle una estrella!** ⭐