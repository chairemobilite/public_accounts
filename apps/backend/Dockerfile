# ---------- shared base ----------
FROM node:24-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/common/package.json packages/common/

# ---------- dev ----------
FROM base AS dev
RUN npm ci --workspace=backend --include-workspace-root
COPY packages ./packages
COPY apps/backend ./apps/backend
RUN mkdir -p /app/data/tmp
WORKDIR /app/apps/backend
ENV NODE_ENV=development
EXPOSE 5000 9229
CMD ["npm", "run", "dev"]

# ---------- build ----------
FROM dev AS build
RUN npm run build

# ---------- prod deps ----------
FROM base AS prod-deps
RUN npm ci --omit=dev --workspace=backend --include-workspace-root \
    && npm cache clean --force

# ---------- runtime ----------
FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package.json ./package.json
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/packages/common ./packages/common # For types
RUN mkdir -p /app/data/tmp && chown -R node:node /app/data
USER node
WORKDIR /app/apps/backend
EXPOSE 5000
CMD ["node", "dist/index.js"]
