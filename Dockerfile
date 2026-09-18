# ==========================================
# Estágio 1: Build da Aplicação (Vite + esbuild)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Instalação limpa de dependências
COPY package*.json ./
RUN npm ci

# Cópia do código-fonte e compilação
COPY . .
RUN npm run build

# ==========================================
# Estágio 2: Imagem Mínima de Produção
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Dependências necessárias para runtime (e.g. curl para healthchecks)
RUN apk add --no-cache curl

# Copia pacotes e instala apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copia artefatos compilados do estágio anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/metadata.json ./metadata.json

# Permissões seguras e execução como usuário não-root (node)
RUN chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
