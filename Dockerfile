# Use Node.js 18 LTS
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package.json first
COPY package.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the application
COPY server.js ./

# Expose port (Koyeb will set this automatically)
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
