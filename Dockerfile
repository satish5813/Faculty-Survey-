# ---- Stage 1: build the React frontend ----
FROM node:20-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- Stage 2: server + built frontend ----
FROM node:20-alpine AS server
WORKDIR /app/server
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
# Copy the built frontend so Express can serve it (matches CLIENT_DIST default: ../client/dist)
COPY --from=client /app/client/dist /app/client/dist

EXPOSE 4000
CMD ["node", "src/index.js"]
