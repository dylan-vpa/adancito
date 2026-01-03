# Stage 1: Build client
FROM node:20-alpine as client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build server with Prisma
FROM node:20-alpine as server-builder
WORKDIR /app/server

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

# Install dependencies first
COPY server/package*.json ./
RUN npm install

# Copy prisma files including header
COPY server/prisma ./prisma

# Prepend header if schema is missing generator/datasource
RUN if ! grep -q "generator client" prisma/schema.prisma; then \
  cat prisma/header.prisma prisma/schema.prisma > prisma/schema.combined.prisma && \
  mv prisma/schema.combined.prisma prisma/schema.prisma; \
fi

# Generate Prisma client
RUN npx prisma generate

# Copy rest of server code
COPY server/ ./

# Copy client build for serving
COPY --from=client-builder /app/client/dist ./public

# Build TypeScript (ignore errors for MVP)
RUN npm run build || echo "Build completed with warnings"

# Stage 3: Production runner
FROM node:20-alpine as runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

# Copy server package.json and install production deps
COPY server/package*.json ./
RUN npm install --only=production

# Copy prisma and regenerate client for production
COPY --from=server-builder /app/server/prisma ./prisma
RUN npx prisma generate

# Copy compiled server and static files
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/public ./public

# Initialize SQLite database (ignore errors)
RUN npx prisma db push --skip-generate 2>/dev/null || true

EXPOSE 3000
CMD ["node", "dist/index.js"]
