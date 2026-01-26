FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
RUN cd frontend && npm run build

FROM node:20-slim
WORKDIR /Lumunarr
COPY --from=frontend-builder /app/frontend/production ./frontend/production
COPY package*.json ./
RUN npm ci --production   # --production skips dev deps
COPY . .
ENTRYPOINT ["npm", "start"]