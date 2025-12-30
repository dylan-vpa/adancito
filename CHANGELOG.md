# Historia de Cambios - Adan

## v1.0.0 - Versión Inicial (2025-12-29)

### ✨ Características Principales

#### Backend
- ✅ Sistema de autenticación con JWT y bcrypt
- ✅ Base de datos SQLite local con todas las tablas
- ✅ Integración completa con Ollama
- ✅ Server-Sent Events (SSE) para streaming en tiempo real
- ✅ Framework EDEN de 7 niveles para selección de agentes
- ✅ Sistema de menciones (@agente) 
- ✅ Filtrado automático de tags `<think>`
- ✅ API REST completa para chat, usuarios, y pagos
- ✅ Sistema de monedas con transacciones
- ✅ Sistema de referidos
- ✅ Feedback de usuarios

#### Frontend
- ✅ Sistema de diseño Adan completo en CSS vanilla
- ✅ Interfaz de chat con streaming en tiempo real
- ✅ Reconocimiento de voz (Web Speech API)
- ✅ Renderizado de Markdown en mensajes
- ✅ Selector de agentes por categorías
- ✅ Dashboard con grid de chats
- ✅ Edición inline de títulos de chat
- ✅ Archivo y eliminación de chats
- ✅ Indicador "Pensando..." durante procesamiento
- ✅ Autenticación con login/register
- ✅ Rutas protegidas con React Router

### 🎨 Diseño
- Modo oscuro (#0F1412) con acentos verdesCalm & minimal aesthetic
- Tipografía Inter
- Glassmorphism en cards
- Animaciones suaves (120-320ms)
- Sistema de espaciado de 4px base
- Botones pill con hover effects

### 🤖 Agentes IA Incluidos
- **Leadership**: CEO, CMO
- **Engineering**: Full Stack, Cloud/DevOps, Support
- **Design**: UX/UI, Graphic Designer
- **Mentors**: Business Mentor
- **Investors**: 3 investor profiles
- **Special**: Documentation Specialist

### 📋 Framework EDEN
- Nivel 1: El Dolor (validación de idea)
- Nivel 2: La Solución (diseño)
- Nivel 3: Plan de Negocio
- Nivel 4: MVP Funcional
- Nivel 5: Validación de Mercado
- Nivel 6: Proyección y Estrategia
- Nivel 7: Lanzamiento Real

### 🔧 Stack Tecnológico
- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: Express + TypeScript
- **Database**: SQLite (better-sqlite3)
- **AI**: Ollama
- **Auth**: JWT + bcrypt
- **Styling**: CSS vanilla (no Tailwind)
- **Markdown**: react-markdown + remark-gfm

### 📦 Estructura del Proyecto
```
adan-app/
├── client/     # Frontend
├── server/     # Backend
├── .env        # Config
└── README.md
```

### 🚀 Instalación
```bash
npm install
npm run dev
```

### 📝 Notas
- Esta es una reconstrucción completa desde cero
- Migrado de Next.js + Supabase a React + Vite + SQLite
- Enfoque en simplicidad y control local
- Sistema de diseño custom sin dependencias de UI

### 🔮 Próximas Características Planeadas
- [ ] Integración completa con PayPal
- [ ] Exportación de chats a PDF
- [ ] Modo oscuro/claro toggle
- [ ] Búsqueda en historial de chats
- [ ] Soporte para imágenes en chat
- [ ] Temas personalizables
- [ ] Notificaciones push
- [ ] Chat compartido entre usuarios
- [ ] API pública para integraciones

---

**Desarrollado con el sistema de diseño Adan** 🌿
