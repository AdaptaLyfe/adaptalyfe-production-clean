# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server and client files
COPY server-simple.js ./
COPY client/ ./client/

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server-simple.js"]