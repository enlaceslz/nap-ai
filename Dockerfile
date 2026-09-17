FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application (Vite + esbuild)
RUN npm run build

# Expose the correct port
EXPOSE 3000

# Start the application using the compiled CJS server
CMD ["npm", "start"]
