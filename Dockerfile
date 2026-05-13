FROM node:22-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm --prefix backend ci
RUN npm --prefix frontend ci

COPY backend ./backend
COPY frontend ./frontend

RUN npm --prefix backend run prisma:generate
RUN npm --prefix backend run build
RUN npm --prefix frontend run build

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
