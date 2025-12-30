#!/bin/bash

# ============================================
# ADAN APP - Deployment Script for Linux/RunPod
# Runs both frontend and backend via npm run dev
# Frontend: 0.0.0.0:8000
# Backend:  0.0.0.0:8001
# ============================================

set -e

echo "🚀 ADAN App Deployment Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}📁 Working directory: $SCRIPT_DIR${NC}"

# ============================================
# 1. Check and install Node.js if needed
# ============================================
echo -e "\n${YELLOW}🔍 Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"
echo -e "${GREEN}✓ NPM version: $(npm -v)${NC}"

# ============================================
# 2. Install PM2 globally if not installed
# ============================================
echo -e "\n${YELLOW}🔍 Checking PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2 globally...${NC}"
    npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 version: $(pm2 -v)${NC}"

# ============================================
# 3. Install all dependencies (root, server, client)
# ============================================
echo -e "\n${YELLOW}📦 Installing all dependencies...${NC}"
npm install

# ============================================
# 4. Update vite config to use 0.0.0.0
# ============================================
echo -e "\n${YELLOW}📝 Updating Vite config for 0.0.0.0...${NC}"
cat > client/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 8000,
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:8001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 8000,
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:8001',
        changeOrigin: true,
      },
    },
  },
})
EOF

echo -e "${GREEN}✓ Vite config updated${NC}"

# ============================================
# 5. Stop existing PM2 processes
# ============================================
echo -e "\n${YELLOW}🛑 Stopping existing PM2 processes...${NC}"
pm2 delete all 2>/dev/null || true

# ============================================
# 6. Start with PM2 using npm run dev
# ============================================
echo -e "\n${YELLOW}🚀 Starting ADAN with PM2 (npm run dev)...${NC}"
pm2 start npm --name "adan-app" -- run dev

# ============================================
# 7. Save PM2 config and setup startup
# ============================================
echo -e "\n${YELLOW}💾 Saving PM2 process list...${NC}"
pm2 save

echo -e "\n${YELLOW}🔧 Setting up PM2 startup script...${NC}"
pm2 startup 2>/dev/null || echo "Run 'pm2 startup' manually if needed"

# ============================================
# 8. Show status
# ============================================
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}✅ ADAN App Deployed Successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Services running:${NC}"
pm2 list
echo ""
echo -e "${GREEN}📱 Frontend: http://0.0.0.0:8000${NC}"
echo -e "${GREEN}🔧 Backend:  http://0.0.0.0:8001${NC}"
echo ""
echo -e "${YELLOW}PM2 Commands:${NC}"
echo "  pm2 status         - Check status"
echo "  pm2 logs adan-app  - View logs"
echo "  pm2 restart adan-app - Restart"
echo "  pm2 stop adan-app    - Stop"
echo ""
echo -e "${GREEN}🎉 Done!${NC}"
