FROM node:26-slim AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
RUN cd frontend && npm run build

FROM node:26-slim
ARG BUILD
ENV BUILD=${BUILD}
ENV NODE_ENV=production
EXPOSE 3939
WORKDIR /app
COPY app.js ./
COPY version.json ./
COPY package*.json ./
COPY --from=frontend-builder /app/frontend/production ./frontend/production
RUN npm ci --production --no-audit --no-fund
COPY backend ./backend
COPY bin ./bin
COPY webhook ./webhook
HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=10s \
    --retries=3 \
    CMD node bin/healthcheck.js

ENTRYPOINT ["npm", "start"]