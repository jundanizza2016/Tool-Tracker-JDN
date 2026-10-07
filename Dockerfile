# ── Build stage: install dependencies + build assets ───────────────────────
FROM node:24-slim AS build
WORKDIR /app

# Install dependencies dulu agar layer cache optimal.
# package-lock.json WAJIB ikut disalin supaya `npm ci` bisa jalan.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Salin source code (termasuk .figma/make/site.json yang dibaca vite.config.ts)
COPY . .

# Jalankan build produksi — inilah langkah yang sebelumnya gagal (exit 127)
# karena dependencies belum pernah di-install.
RUN npm run build

# ── Serve stage: sajikan file statis via nginx ─────────────────────────────
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
