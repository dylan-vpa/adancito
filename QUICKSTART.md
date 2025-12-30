# Adan - Guía de Inicio Rápido

## Instalación y Ejecución

### 1. Instalar dependencias

```bash
cd adan-app
npm install
```

Esto instalará las dependencias para ambos proyectos (client y server).

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus configuraciones:
- `JWT_SECRET`: Cambia por una clave secreta segura
- `OLLAMA_BASE_URL`: URL de tu instancia de Ollama (default: http://localhost:11434)

### 3. Iniciar Ollama

Asegúrate de tener Ollama corriendo con al menos el modelo `Modelfile_Adan_CEO`:

```bash
ollama serve
```

### 4. Ejecutar la aplicación

**Opción A - Scripts combinados (recomendado):**

```bash
# Desde la raíz del proyecto
npm run dev
```

Esto inicia tanto el servidor backend como el frontend simultáneamente.

**Opción B - Terminales separadas:**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

### 5. Acceder a la aplicación

- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:3000
- **Health check**: http://localhost:3000/health

## Primeros pasos

1. Abre http://localhost:8000
2. Haz clic en "Registrarse"
3. Crea una cuenta con tu email y contraseña
4. ¡Empieza a chatear con los agentes de IA!

## Estructura del proyecto

```
adan-app/
├── client/          # Frontend React + Vite
├── server/          # Backend Express + SQLite
└── README.md        # Documentación completa
```

## Solución de problemas

### "Ollama no responde"
- Verifica que Ollama esté corriendo: `ollama list`
- Asegúrate de tener al menos el modelo base disponible
- Revisa `OLLAMA_BASE_URL` en `.env`

### "Error de base de datos"
- La base de datos SQLite se crea automáticamente en `server/database/adan.db`
- Si hay problemas, elimina el archivo y reinicia el servidor

### "Puerto en uso"
- Backend (3000): Cambia `PORT` en `.env`
- Frontend (8000): Cambia en `client/vite.config.ts`

## Siguientes pasos

- Lee el [README completo](./README.md) para más detalles
- Configura los modelos de Ollama personalizados para cada agente
- Integra PayPal para el sistema de monedas (opcional)

¡Disfruta de Adan! 🚀
