# Adan - Verificación y Testing

## ✅ Lista de Verificación Pre-Producción

### Backend

- [ ] **Base de datos**
  - [ ] Todas las tablas creadas correctamente
  - [ ] Índices funcionando
  - [ ] Foreign keys habilitadas
  - [ ] Queries optimizadas

- [ ] **Autenticación**
  - [ ] Registro de usuarios funciona
  - [ ] Login genera JWT válido
  - [ ] Middleware de auth protege rutas
  - [ ] Passwords hasheados con bcrypt
  
- [ ] **Chat y Ollama**
  - [ ] Conexión a Ollama establecida
  - [ ] SSE streaming funciona
  - [ ] Agentes responden correctamente
  - [ ] Framework EDEN selecciona agentes apropiados
  - [ ] Tags `<think>` son filtrados
  - [ ] Menciones @ funcionan

- [ ] **APIs**
  - [ ] Todos los endpoints responden
  - [ ] Errores manejados apropiadamente
  - [ ] CORS configuradocorrectamente
  
### Frontend

- [ ] **UI/UX**
  - [ ] Sistema de diseño Adan aplicado
  - [ ] Colores correctos (#0F1412, #9EC8B3, etc.)
  - [ ] Tipografía Inter cargada
  - [ ] Animaciones suaves
  - [ ] Glassmorphism en cards
  
- [ ] **Autenticación**
  - [ ] Login funciona
  - [ ] Register funciona
  - [ ] Protected routes funcionan
  - [ ] Logout limpia token

- [ ] **Chat**
  - [ ] Crear chat funciona
  - [ ] Enviar mensajes funciona
  - [ ] SSE streaming se muestra correctamente
  - [ ] "Pensando..." aparece
  - [ ] Markdown renderiza bien
  - [ ] Voice input funciona (en navegadores compatibles)
  - [ ] Selector de agentes funciona
  - [ ] Renombrar chat funciona
  - [ ] Archivar/eliminar chat funciona

## 🧪 Tests Manuales

### Flujo Completo de Usuario

1. **Registro**
   ```
   - Ir a /register
   - Ingresar nombre, email, password
   - Verificar redirección a dashboard
   ```

2. **Crear Chat**
   ```
   - Click en "Nuevo Chat"
   - Verificar redirección a /chat/:id
   ```

3. **Enviar Mensaje con EDEN**
   ```
   - Escribir: "Ayúdame a validar mi idea de negocio"
   - Verificar que selecciona "Nivel 1 - El Dolor"
   - Verificar badge de agente "Modelfile_Adan_CEO"
   - Verificar streaming en tiempo real
   - Verificar markdown rendering
   ```

4. **Menciones Explícitas**
   ```
   - Escribir: "@vito_fullstack ayúdame a crear una API"
   - Verificar que responde el agente mencionado
   ```

5. **Voice Input** (si está disponible)
   ```
   - Click en micrófono
   - Hablar en español
   - Verificar transcripción en textarea
   ```

6. **Gestión de Chats**
   ```
   - Editar título del chat
   - Volver al dashboard
   - Verificar que el chat aparece en la lista
   - Archivar un chat
   - Verificar que desaparece de la lista
   ```

## 🔍 Verificación de Ollama

### Modelos Requeridos

Mínimo necesario:
```bash
ollama list
# Debe mostrar al menos:
# Modelfile_Adan_CEO
```

### Test de Conexión

```bash
curl http://localhost:11434/api/tags
```

Debe devolver lista de modelos disponibles.

### Test de Chat

```bash
curl -X POST http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Modelfile_Adan_CEO",
    "messages": [{"role": "user", "content": "Hola"}],
    "stream": false
  }'
```

Debe devolver una respuesta del modelo.

## 📊 Métricas de Rendimiento

### Backend
- Tiempo de respuesta API < 200ms (sin Ollama)
- Tiempo de inicio de stream < 1s
- Base de datos query time < 50ms

### Frontend
- Time to Interactive < 2s
- First Contentful Paint < 1s
- Animaciones a 60fps

## 🐛 Problemas Conocidos

### Limitaciones Actuales

1. **PayPal Integration**: Placeholder, requiere configuración manual
2. **Email Recovery**: Placeholder, no envía emails reales
3. **File Uploads**: No implementado aún
4. **Mobile UI**: Funcional pero no optimizado
5. **Offline Mode**: No implementado

### Browser Compatibility

- **Chrome/Edge**: ✅ Totalmente compatible (incluyendo voice)
- **Firefox**: ✅ Compatible (sin voice en algunas versiones)
- **Safari**: ⚠️  Compatible (voice puede variar)

## 🔐 Seguridad

### Checklist

- [ ] JWT_SECRET es fuerte y único
- [ ] Passwords nunca se envían en plain text
- [ ] CORS configurado apropiadamente
- [ ] SQL injection prevenido (prepared statements)
- [ ] XSS prevenido (React escaping)

## 📝 Próximos Pasos

Después de verificar todo:

1. Configurar modelos de Ollama personalizados
2. Ajustar EDEN keywords según necesidad
3. Configurar PayPal si se va a usar
4. Hacer backup de la base de datos
5. Configurar HTTPS para producción
6. Implementar rate limiting
7. Añadir logging apropiado
8. Configurar monitoring

---

**Última actualización**: 2025-12-29
