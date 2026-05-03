# ---------- BUILD ----------

FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# ---------- RUN ----------

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

ENV PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "npx next start -p $PORT -H 0.0.0.0"]
