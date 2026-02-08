# Stage 1: Build
FROM node:20-alpine AS build-stage
WORKDIR /app

# Ye line build ke waqt variable accept karegi
ARG VITE_TAMBO_API_KEY

COPY package*.json ./
RUN npm install
COPY . .

# Vite build ke waqt variable ko inject karna zaroori hai
RUN VITE_TAMBO_API_KEY=$VITE_TAMBO_API_KEY npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=build-stage /app/package*.json ./
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/server ./server
COPY --from=build-stage /app/shared ./shared
COPY --from=build-stage /app/tsconfig.json ./

RUN npm install -g tsx
EXPOSE 5000
CMD ["tsx", "server/index.ts"]