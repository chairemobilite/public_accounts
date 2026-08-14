FROM node:24-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/
COPY packages/common/package.json packages/common/

FROM base AS dev
RUN npm ci --workspace=frontend --include-workspace-root
COPY packages ./packages
COPY apps/frontend ./apps/frontend
WORKDIR /app/apps/frontend
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM dev AS build
ENV VITE_API_URL=/api
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine AS runtime
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
