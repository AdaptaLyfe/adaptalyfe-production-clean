FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
COPY server-simple.js dist/index.js
RUN npm ci --omit=dev
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/index.js"]