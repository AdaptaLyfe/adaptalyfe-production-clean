FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production=false
COPY . .
RUN npm run build
EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000
CMD ["npm", "start"]
