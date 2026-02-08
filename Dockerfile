FROM node:20-alpine AS build-stage
WORKDIR /app

ARG VITE_TAMBO_API_KEY

COPY package*.json ./
RUN npm install
COPY . .

RUN VITE_TAMBO_API_KEY=$VITE_TAMBO_API_KEY npm run build

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