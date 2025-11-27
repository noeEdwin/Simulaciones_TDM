# Estructura del Proyecto - TDM Simulator

## 📁 Arquitectura MVC

```
/SoftwareDeSimulacionATM/animacionValverde/
├── index.html                          # Portal principal (antes home.html)
├── README.md                           # Documentación general del proyecto
├── README_ATDM.md                      # Documentación técnica ATDM
│
├── assets/                             # Recursos estáticos
│   ├── images/                         # Imágenes y gráficos
│   │   ├── 1.png
│   │   ├── 2.png
│   │   ├── 3.png
│   │   └── img/                        # Subcarpeta de imágenes
│   └── docs/                           # Documentos PDF
│       └── Behrouz_Forouzan_*.pdf
│
├── css/                                # Estilos CSS organizados por módulo
│   ├── common/
│   │   └── global.css                 # Estilos globales compartidos
│   ├── home/
│   │   ├── home.css
│   │   └── home-styles.css
│   ├── synchronous/
│   │   ├── react-styles.css
│   │   └── react-styles-modern.css
│   ├── asynchronous/
│   │   ├── atdm-styles.css
│   │   └── atdm-modern-theme.css
│   └── pages/
│       ├── nosotros.css
│       └── quiz.css
│
├── js/                                 # JavaScript organizadopor capa MVC
│   ├── models/                         # MODELO: Lógica de negocio
│   │   └── ATDMSimulator.js           # Clase ATDM (multiplexación/demultiplexación)
│   ├── controllers/                    # CONTROLADOR: Lógica de UI
│   │   └── atdm-controller.js         # Controlador React ATDM
│   ├── synchronous/                    # Scripts TDM síncrono
│   │   ├── script.js
│   │   └── react-animation.js
│   └── utils/                          # Utilidades
│       └── quiz.js
│
└── views/                              # VISTAS: HTML puro
    ├── asynchronous/                   # Vistas ATDM
    │   ├── asincrono.html             # Vista principal ATDM (mejorada)
    │   └── atdm.html                  # Vista ATDM original
    ├── synchronous/                    # Vistas TDM síncrono
    │   └── sincrono.html              # Vista TDM síncrono
    └── pages/                          # Páginas secundarias
        ├── nosotros.html
        └── quiz.html
```

---

## 🏛️ Patrón MVC Aplicado

### Model (Modelo)
**Ubicación:** `/js/models/`

**Responsabilidad:** Lógica de negocio y datos

**Archivos:**
- `ATDMSimulator.js` - Algoritmo ATDM completo
  - Multiplexación asíncrona
  - Demultiplexación con direccionamiento
  - Gestión de buffers
  - Cálculo de estadísticas

**Sin dependencias de:** UI, DOM, React

### View (Vista)
**Ubicación:** `/views/` + `/css/`

**Responsabilidad:** Presentación y estilos

**Archivos:**
- `views/asynchronous/asincrono.html` - Estructura HTML
- `css/asynchronous/*.css` - Estilos visuales
- `css/asynchronous/atdm-modern-theme.css` - Sistema de diseño

**Sin lógica de:** Negocio, cálculos, algoritmos

### Controller (Controlador)
**Ubicación:** `/js/controllers/`

**Responsabilidad:** Orquestación Model ↔ View

**Archivos:**
- `atdm-controller.js` - Componente React
  - Maneja eventos de usuario
  - Actualiza estado
  - Coordina Model y View
  - Gestión de animación

---

## 🔄 Flujo de Datos

```
Usuario interactúa → VIEW (asincrono.html)
                          ↓
                    CONTROLLER (atdm-controller.js)
                          ↓
                    Llama al MODEL (ATDMSimulator.js)
                          ↓
                    MODEL retorna resultado
                          ↓
                    CONTROLLER actualiza estado
                          ↓
                    VIEW se re-renderiza
```

---

## 🚀 Cómo Ejecutar

### Desarrollo Local

```bash
cd /home/edwinnoe/SoftwareDeSimulacionATM/animacionValverde
python3 -m http.server 8000
```

Abre en navegador:
- **Portal:** http://localhost:8000/
- **ATDM:** http://localhost:8000/views/asynchronous/asincrono.html  
- **TDM Síncrono:** http://localhost:8000/views/synchronous/sincrono.html

---

## 📝 Convenciones de Rutas

### Desde `/index.html` (raíz)
```html
<link href="css/home/home.css">
<script src="js/utils/helper.js"></script>
<img src="assets/images/logo.png">
```

### Desde `/views/asynchronous/asincrono.html`
```html
<link href="../../css/asynchronous/atdm-styles.css">
<link href="../../css/asynchronous/atdm-modern-theme.css">
<script src="../../js/models/ATDMSimulator.js"></script>
<script src="../../js/controllers/atdm-controller.js"></script>
<img src="../../assets/images/img/logo.png">
```

### Desde `/views/synchronous/sincrono.html`
```html
<link href="../../css/synchronous/react-styles.css">
<script src="../../js/synchronous/script.js"></script>
```

---

## 📦 Rutas de Archivos Comunes

| Archivo Original | Nueva Ubicación |
|-----------------|-----------------|
| `ATDMSimulator.js` | `/js/models/ATDMSimulator.js` |
| `asincrono.html` | `/views/asynchronous/asincrono.html` |
| `atdm-styles.css` | `/css/asynchronous/atdm-styles.css` |
| `atdm-modern-theme.css` | `/css/asynchronous/atdm-modern-theme.css` |
| `home.html` | `/index.html` (raíz) + copia en `/home.html` |
| `index.html` (TDM) | `/views/synchronous/sincrono.html` |
| `1.png, 2.png, 3.png` | `/assets/images/` |
| `img/` (carpeta) | `/assets/images/img/` |
| `*.pdf` | `/assets/docs/` |

---

## ✅ Beneficios de la Nueva Estructura

1. **Separación Clara**
   - Lógica ≠ Presentación ≠ Control
   - Cada archivo tiene un propósito único

2. **Escalabilidad**
   - Fácil agregar nuevos módulos
   - No hay conflictos de nombres

3. **Mantenibilidad**
   - Búsqueda rápida de archivos
   - Cambios localizados

4. **Reutilización**
   - `ATDMSimulator.js` puede usarse en otros proyectos
   - Estilos compartidos en `/css/common/`

5. **Colaboración**
   - Diseñadores: `/css/`
   - Frontend: `/views/`
   - Backend/Lógica: `/js/models/`

6. **Testing**
   - Modelos pueden probarse independientemente
   - Sin dependencias de DOM

---

## 🔍 Localizar Archivos Rápidamente

### Por Funcionalidad
- **Simulación ATDM:** `js/models/ATDMSimulator.js`
- **UI ATDM:** `views/asynchronous/asincrono.html`
- **Estilos ATDM:** `css/asynchronous/`
- **Control ATDM:** `js/controllers/atdm-controller.js`

### Por Tipo
- **Todos los modelos:** `/js/models/`
- **Todos los CSS:** `/css/`
- **Todas las vistas:** `/views/`
- **Todos los assets:** `/assets/`

---

## 🛠️ Próximos Pasos Opcionales

- [ ] Crear `css/common/global.css` con estilos compartidos
- [ ] Migrar estilos inline del HTML a CSS
- [ ] Configurar build tool (Webpack, Vite) para producción
- [ ] Añadir linter (ESLint, Stylelint)
- [ ] Implementar tests unitarios para modelos
- [ ] Minificar assets para producción

---

## 📖 Referencias

- **MVC Pattern:** [Wikipedia](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)
- **ATDM Logic:** Ver `README_ATDM.md`
- **Forouzan Book:** `/assets/docs/Behrouz_Forouzan_*.pdf`

---

**Última actualización:** 2025-11-26  
**Versión de estructura:** 2.0 (MVC Reorganization)
