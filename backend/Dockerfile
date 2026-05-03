# ---------- BUILD ----------
    FROM node:18-alpine AS builder

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install
    
    COPY . .
    
    RUN npm run build
    
    # ---------- RUN ----------
    FROM node:18-alpine
    
    WORKDIR /app
    
    ENV NODE_ENV=production
    
    # copiar SOLO lo necesario
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/package.json ./package.json
    
    # 🔥 instalar deps limpias de producción
    RUN npm install --omit=dev
    
    EXPOSE 3000
    
    # 🔥 comando correcto
    CMD ["node_modules/.bin/next", "start", "-p", "3000", "-H", "0.0.0.0"]