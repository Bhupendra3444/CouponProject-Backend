# Use Node.js 18 Alpine image for a lightweight image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set the environment variable for the port (default is 5000)
ENV PORT=5000

# Expose the port the app will be listening to
EXPOSE $PORT

# Start the app
CMD ["node", "server.js"]