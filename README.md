# Adan - AI Business Assistant

Modern AI-powered business assistant built with React + Vite + Express + SQLite + Ollama.

## Features

- 🤖 **AI Chat with Ollama Integration** - Multiple specialized AI agents
- 📊 **EDEN Framework** - 7-level business development framework
- 🎨 **Custom Design System** - Dark mode with calm green accents
- 🔐 **Secure Authentication** - JWT-based auth with bcrypt
- 💾 **SQLite Database** - Local-first data storage
- 🗣️ **Voice Input** - Web Speech API integration
- 💰 **Coins System** - PayPal integration for purchases
- 👥 **Referral System** - Built-in referral tracking

## Prerequisites

- Node.js 18+ and npm
- [Ollama](https://ollama.ai) installed and running
- At least the `Modelfile_Adan_CEO` model available in Ollama

## Quick Start

### 1. Installation

```bash
# Clone or navigate to the project
cd adan-app

# Install dependencies
npm run install:all
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Important: Set JWT_SECRET and OLLAMA_BASE_URL
```

### 3. Run the Application

```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend dev server
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:8000
- Backend API: http://localhost:3000

## Project Structure

```
adan-app/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context providers
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API client
│   │   ├── styles/      # Adan design system CSS
│   │   └── types/       # TypeScript definitions
│   └── package.json
│
├── server/          # Express + SQLite backend
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Database layer
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic (Ollama)
│   │   └── server.ts    # Entry point
│   ├── database/    # SQLite database file
│   └── package.json
│
└── .env            # Environment variables
```

## Ollama Setup

You need to have Ollama running with the required models:

```bash
# Pull the base model (example)
ollama pull llama2

# Create custom models for Adan agents
# Create a Modelfile for each agent...
ollama create Modelfile_Adan_CEO -f ./Modelfile_Adan_CEO
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Chat
- `GET /api/chats` - Get all chat sessions
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get specific chat
- `PATCH /api/chats/:id` - Update chat (rename/archive)
- `DELETE /api/chats/:id` - Delete chat
- `GET /api/chats/:id/messages` - Get messages
- `POST /api/chat` - Send message (SSE streaming)

### User
- `GET /api/user/referral-code` - Get referral code
- `GET /api/user/referral-count` - Get referral count
- `POST /api/user/feedback` - Submit feedback

### Payments
- `GET /api/payments/coins` - Get coin balance
- `POST /api/payments/purchase` - Purchase coins
- `GET /api/payments/transactions` - Get transaction history

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret_key_here

# Database
DATABASE_PATH=./server/database/adan.db

# Ollama
OLLAMA_BASE_URL=http://localhost:11434

# PayPal (optional)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_MODE=sandbox
```

## Design System

The application follows the Adan design system:
- **Colors**: Dark mode (#0F1412) with green accents (#9EC8B3)
- **Typography**: Inter font family
- **Spacing**: 4px base unit system
- **Components**: Glassmorphism cards, pill buttons, smooth animations
- **Philosophy**: Calm, minimal, eco-conscious

## EDEN Framework

The AI automatically selects appropriate agents based on keywords:

1. **Nivel 1 - El Dolor**: Idea validation
2. **Nivel 2 - La Solución**: Solution design
3. **Nivel 3 - Plan de Negocio**: Business planning
4. **Nivel 4 - MVP Funcional**: MVP development
5. **Nivel 5 - Validación de Mercado**: Market validation
6. **Nivel 6 - Proyección y Estrategia**: Growth strategy
7. **Nivel 7 - Lanzamiento Real**: Market launch

## Development

```bash
# Run backend in watch mode
cd server && npm run dev

# Run frontend with hot reload
cd client && npm run dev

# Build for production
npm run build
```

## License

MIT
# adancito
# adancito
