# ==========================================
# TechStore API - imagem Docker
# ==========================================

# ---------- Estágio 1: dependências ----------
# node:22-slim (Debian) em vez de Alpine: o bcrypt é um módulo nativo
# e os binários pré-compilados funcionam direto em glibc.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci = instalação reproduzível a partir do lockfile, sem devDependencies
RUN npm ci --omit=dev

# ---------- Estágio 2: imagem final ----------
FROM node:22-slim
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Não rodar como root dentro do container
USER node

EXPOSE 3000

# A imagem slim não tem curl/wget, então o healthcheck usa o próprio Node
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
